import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

export const COMMAND_TIMEOUT_MS = 120_000;
export const FORCE_KILL_DELAY_MS = 2_000;
export const OUTPUT_CAPTURE_LIMIT_BYTES = 1_048_576;
export const PREFLIGHT_TIMEOUT_MS = 5_000;

const SMOKE_MODES = new Set(["full", "local", "runners"]);
const REQUIRED_COMMANDS = [
  { command: "npm", label: "npm", envKind: "npm" },
  { command: "npx", label: "npx", envKind: "npm" },
  { command: "pnpm", label: "pnpm dlx", envKind: "pnpm" },
  { command: "bun", label: "bun x", envKind: "bun" },
];

export class SmokePackUsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "SmokePackUsageError";
    this.exitCode = 2;
  }
}

export class ObservedCommandError extends Error {
  constructor(message, details = {}, options = {}) {
    super(message, options);
    this.name = "ObservedCommandError";
    Object.assign(this, details);
  }
}

export class PackageRunnerEnvironmentError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "PackageRunnerEnvironmentError";
  }
}

export function parseSmokePackOptions(args) {
  let mode = "full";
  let verifyDogfood = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--verify-dogfood") {
      verifyDogfood = true;
      continue;
    }

    if (arg === "--mode") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new SmokePackUsageError("Smoke-pack option --mode requires full, local, or runners.");
      }
      mode = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--mode=")) {
      mode = arg.slice("--mode=".length);
      continue;
    }

    throw new SmokePackUsageError(`Unknown smoke-pack option: ${arg}`);
  }

  if (!SMOKE_MODES.has(mode)) {
    throw new SmokePackUsageError(`Unknown smoke-pack mode: ${mode}. Use full, local, or runners.`);
  }
  if (mode === "runners" && verifyDogfood) {
    throw new SmokePackUsageError("Smoke-pack option --verify-dogfood requires full or local mode.");
  }

  return { mode, verifyDogfood };
}

export function getSmokeModePlan(mode) {
  if (!SMOKE_MODES.has(mode)) {
    throw new SmokePackUsageError(`Unknown smoke-pack mode: ${mode}. Use full, local, or runners.`);
  }

  return {
    runLocalChecks: mode !== "runners",
    runPackageRunners: mode !== "local",
  };
}

export function formatDuration(durationMs) {
  return `${(durationMs / 1_000).toFixed(1)}s`;
}

export function sanitizeRegistryUrl(value) {
  try {
    const registry = new URL(value);
    registry.username = "";
    registry.password = "";
    return registry.toString();
  } catch {
    return "<configured registry>";
  }
}

export function createPackageRunnerEnv(smokeRoot, envKind, baseEnv = process.env) {
  const homeDir = path.join(smokeRoot, "home");
  const xdgCacheDir = path.join(smokeRoot, "xdg-cache");
  const env = {
    ...baseEnv,
    CI: "1",
    FORCE_COLOR: "0",
    HOME: homeDir,
    USERPROFILE: homeDir,
    CODEX_HOME: path.join(homeDir, ".codex"),
    CLAUDE_CONFIG_DIR: path.join(homeDir, ".claude"),
    NO_COLOR: "1",
    XDG_CACHE_HOME: xdgCacheDir,
    MAKE_DOCS_HOME: path.join(homeDir, ".make-docs"),
  };

  mkdirSync(homeDir, { recursive: true });
  mkdirSync(xdgCacheDir, { recursive: true });

  if (envKind === "npm") {
    return {
      ...env,
      npm_config_cache: path.join(smokeRoot, "npm-cache"),
      npm_config_userconfig: path.join(homeDir, ".npmrc"),
    };
  }

  if (envKind === "pnpm") {
    return {
      ...env,
      COREPACK_HOME: path.join(smokeRoot, "corepack"),
      PNPM_HOME: path.join(smokeRoot, "pnpm-home"),
      npm_config_cache: path.join(smokeRoot, "pnpm-npm-cache"),
      npm_config_store_dir: path.join(smokeRoot, "pnpm-store"),
      npm_config_userconfig: path.join(homeDir, ".npmrc"),
    };
  }

  return {
    ...env,
    BUN_CACHE_DIR: path.join(smokeRoot, "bun-cache"),
    BUN_INSTALL_CACHE_DIR: path.join(smokeRoot, "bun-install-cache"),
  };
}

function createOutputCapture(limitBytes) {
  const chunks = [];
  let bytes = 0;
  let truncated = false;

  return {
    append(chunk) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      const remaining = Math.max(0, limitBytes - bytes);
      if (remaining > 0) {
        const captured = buffer.subarray(0, remaining);
        chunks.push(captured);
        bytes += captured.length;
      }
      if (buffer.length > remaining) truncated = true;
    },
    result() {
      return { text: Buffer.concat(chunks).toString("utf8"), truncated };
    },
  };
}

export function runObservedCommand(options) {
  const {
    command,
    args = [],
    cwd,
    env,
    timeoutMs = COMMAND_TIMEOUT_MS,
    forceKillDelayMs = FORCE_KILL_DELAY_MS,
    captureLimitBytes = OUTPUT_CAPTURE_LIMIT_BYTES,
    streamOutput = true,
    stdoutSink = process.stdout,
    stderrSink = process.stderr,
  } = options;

  const startedAt = performance.now();
  const stdoutCapture = createOutputCapture(captureLimitBytes);
  const stderrCapture = createOutputCapture(captureLimitBytes);

  return new Promise((resolve, reject) => {
    let child;
    let timedOut = false;
    let settled = false;
    let timeoutHandle;
    let forceKillHandle;

    const commandDetails = (extra = {}) => {
      const stdout = stdoutCapture.result();
      const stderr = stderrCapture.result();
      return {
        command,
        args,
        durationMs: performance.now() - startedAt,
        stdout: stdout.text,
        stderr: stderr.text,
        stdoutTruncated: stdout.truncated,
        stderrTruncated: stderr.truncated,
        timedOut,
        ...extra,
      };
    };

    const finish = (callback) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      clearTimeout(forceKillHandle);
      callback();
    };

    try {
      child = spawn(command, args, {
        cwd,
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (cause) {
      const details = commandDetails({ code: cause?.code });
      reject(new ObservedCommandError(`Could not start ${command}.`, details, { cause }));
      return;
    }

    child.stdout.on("data", (chunk) => {
      stdoutCapture.append(chunk);
      if (streamOutput && stdoutSink) stdoutSink.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderrCapture.append(chunk);
      if (streamOutput && stderrSink) stderrSink.write(chunk);
    });

    child.once("error", (cause) => {
      finish(() => {
        const details = commandDetails({ code: cause?.code });
        reject(new ObservedCommandError(`Could not start ${command}.`, details, { cause }));
      });
    });

    child.once("close", (exitCode, signal) => {
      finish(() => {
        const details = commandDetails({ exitCode, signal });
        if (timedOut) {
          reject(new ObservedCommandError(
            `${command} timed out after ${timeoutMs} ms.`,
            details,
          ));
          return;
        }
        if (exitCode !== 0) {
          reject(new ObservedCommandError(
            `${command} exited with status ${exitCode ?? "unknown"}.`,
            details,
          ));
          return;
        }
        resolve(details);
      });
    });

    timeoutHandle = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      forceKillHandle = setTimeout(() => {
        if (!settled) child.kill("SIGKILL");
      }, forceKillDelayMs);
    }, timeoutMs);
  });
}

function environmentFailureMessage(detail) {
  return [
    detail,
    "Package registry access is required for npm run smoke:pack and npm run smoke:pack:runners.",
    "Run npm run smoke:pack:local in a restricted test area.",
  ].join("\n");
}

export async function preflightPackageRunners(options = {}) {
  const {
    baseEnv = process.env,
    cwd = process.cwd(),
    logger = console.log,
    runCommand = runObservedCommand,
    makeTempRoot = () => mkdtempSync(path.join(os.tmpdir(), "make-docs-runner-preflight-")),
  } = options;
  const smokeRoot = makeTempRoot();

  try {
    logger("[smoke:pack][preflight] START package runners");
    const unavailable = [];

    for (const required of REQUIRED_COMMANDS) {
      try {
        await runCommand({
          command: required.command,
          args: ["--version"],
          cwd,
          env: createPackageRunnerEnv(smokeRoot, required.envKind, baseEnv),
          timeoutMs: PREFLIGHT_TIMEOUT_MS,
          streamOutput: false,
        });
      } catch {
        unavailable.push(`${required.command} (${required.label})`);
      }
    }

    if (unavailable.length > 0) {
      throw new PackageRunnerEnvironmentError(environmentFailureMessage(
        `Smoke pack package-runner validation requires: ${unavailable.join(", ")}.`,
      ));
    }

    const npmEnvironment = createPackageRunnerEnv(smokeRoot, "npm", baseEnv);
    let registry;
    try {
      const registryResult = await runCommand({
        command: "npm",
        args: ["config", "get", "registry"],
        cwd,
        env: npmEnvironment,
        timeoutMs: PREFLIGHT_TIMEOUT_MS,
        streamOutput: false,
      });
      registry = registryResult.stdout.trim();
      if (!registry) throw new Error("npm returned an empty registry value.");
    } catch (cause) {
      throw new PackageRunnerEnvironmentError(
        environmentFailureMessage("Smoke pack could not resolve the npm registry."),
        { cause },
      );
    }

    const safeRegistry = sanitizeRegistryUrl(registry);
    logger(`[smoke:pack][preflight] registry=${safeRegistry}`);
    try {
      await runCommand({
        command: "npm",
        args: [
          "ping",
          "--registry",
          registry,
          "--fetch-retries=0",
          `--fetch-timeout=${PREFLIGHT_TIMEOUT_MS}`,
        ],
        cwd,
        env: npmEnvironment,
        timeoutMs: PREFLIGHT_TIMEOUT_MS,
        streamOutput: false,
      });
    } catch (cause) {
      throw new PackageRunnerEnvironmentError(
        environmentFailureMessage(`Smoke pack could not reach ${safeRegistry} within ${PREFLIGHT_TIMEOUT_MS} ms.`),
        { cause },
      );
    }

    logger("[smoke:pack][preflight] PASS package runners");
    return { registry: safeRegistry };
  } finally {
    rmSync(smokeRoot, { recursive: true, force: true });
  }
}
