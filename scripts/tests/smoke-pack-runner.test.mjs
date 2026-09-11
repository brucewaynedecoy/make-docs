import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Writable } from "node:stream";
import test from "node:test";
import {
  ObservedCommandError,
  createPackageRunnerEnv,
  formatDuration,
  getSmokeModePlan,
  parseSmokePackOptions,
  preflightPackageRunners,
  runObservedCommand,
  sanitizeRegistryUrl,
} from "../lib/smoke-pack-runner.mjs";

test("smoke-pack options default to the full release gate", () => {
  assert.deepEqual(parseSmokePackOptions([]), { mode: "full", verifyDogfood: false });
  assert.deepEqual(getSmokeModePlan("full"), {
    runLocalChecks: true,
    runPackageRunners: true,
  });
});

test("smoke-pack options select local and runner-only work", () => {
  assert.deepEqual(parseSmokePackOptions(["--mode", "local", "--verify-dogfood"]), {
    mode: "local",
    verifyDogfood: true,
  });
  assert.deepEqual(parseSmokePackOptions(["--mode=runners"]), {
    mode: "runners",
    verifyDogfood: false,
  });
  assert.deepEqual(getSmokeModePlan("local"), {
    runLocalChecks: true,
    runPackageRunners: false,
  });
  assert.deepEqual(getSmokeModePlan("runners"), {
    runLocalChecks: false,
    runPackageRunners: true,
  });
});

test("smoke-pack options reject invalid input before work starts", () => {
  for (const args of [
    ["--mode"],
    ["--mode", "unknown"],
    ["--unexpected"],
    ["--mode", "runners", "--verify-dogfood"],
  ]) {
    assert.throws(
      () => parseSmokePackOptions(args),
      (error) => error.exitCode === 2,
    );
  }
});

test("runner environments keep cold caches inside their smoke root", () => {
  const smokeRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-runner-env-test-"));
  try {
    const npmEnv = createPackageRunnerEnv(smokeRoot, "npm", { PATH: process.env.PATH });
    const pnpmEnv = createPackageRunnerEnv(smokeRoot, "pnpm", { PATH: process.env.PATH });
    const bunEnv = createPackageRunnerEnv(smokeRoot, "bun", { PATH: process.env.PATH });
    assert.equal(npmEnv.npm_config_cache, path.join(smokeRoot, "npm-cache"));
    assert.equal(pnpmEnv.npm_config_store_dir, path.join(smokeRoot, "pnpm-store"));
    assert.equal(bunEnv.BUN_CACHE_DIR, path.join(smokeRoot, "bun-cache"));
    assert.equal(npmEnv.HOME, path.join(smokeRoot, "home"));
  } finally {
    rmSync(smokeRoot, { recursive: true, force: true });
  }
});

test("observed commands stream output before the child exits", async () => {
  const chunks = [];
  let resolveFirstChunk;
  const firstChunk = new Promise((resolve) => {
    resolveFirstChunk = resolve;
  });
  const sink = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      resolveFirstChunk();
      callback();
    },
  });
  let completed = false;
  const pending = runObservedCommand({
    command: process.execPath,
    args: [
      "-e",
      "process.stdout.write('first\\n'); setTimeout(() => process.stdout.write('second\\n'), 50);",
    ],
    timeoutMs: 2_000,
    stdoutSink: sink,
    stderrSink: sink,
  }).finally(() => {
    completed = true;
  });

  await firstChunk;
  assert.equal(completed, false);
  const result = await pending;
  assert.equal(result.stdout, "first\nsecond\n");
  assert.equal(chunks.join(""), "first\nsecond\n");
  assert.equal(result.timedOut, false);
});

test("observed commands bound captured output without blocking the stream", async () => {
  const result = await runObservedCommand({
    command: process.execPath,
    args: ["-e", "process.stdout.write('x'.repeat(64));"],
    captureLimitBytes: 10,
    streamOutput: false,
  });
  assert.equal(result.stdout, "x".repeat(10));
  assert.equal(result.stdoutTruncated, true);
});

test("observed commands report nonzero exits", async () => {
  await assert.rejects(
    runObservedCommand({
      command: process.execPath,
      args: ["-e", "process.stderr.write('failed\\n'); process.exit(7);"],
      streamOutput: false,
    }),
    (error) => error instanceof ObservedCommandError
      && error.exitCode === 7
      && error.stderr === "failed\n"
      && error.timedOut === false,
  );
});

test("observed commands report missing commands", async () => {
  await assert.rejects(
    runObservedCommand({
      command: "make-docs-command-that-does-not-exist",
      streamOutput: false,
    }),
    (error) => error instanceof ObservedCommandError && error.code === "ENOENT",
  );
});

test("observed commands stop and report timeouts", async () => {
  await assert.rejects(
    runObservedCommand({
      command: process.execPath,
      args: ["-e", "setInterval(() => {}, 1000);"],
      timeoutMs: 30,
      forceKillDelayMs: 30,
      streamOutput: false,
    }),
    (error) => error instanceof ObservedCommandError
      && error.timedOut === true
      && error.durationMs < 1_000,
  );
});

test("duration and registry output are stable and safe", () => {
  assert.equal(formatDuration(18_749), "18.7s");
  assert.equal(
    sanitizeRegistryUrl("https://user:secret@registry.example.test/custom"),
    "https://registry.example.test/custom",
  );
  assert.equal(sanitizeRegistryUrl("not a URL"), "<configured registry>");
});

test("package-runner preflight checks tools and registry and removes its temp root", async () => {
  const smokeRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-preflight-test-"));
  const calls = [];
  const logs = [];
  const runCommand = async (options) => {
    calls.push([options.command, ...options.args]);
    if (options.args[0] === "config") return { stdout: "https://registry.npmjs.org/\n" };
    return { stdout: "1.0.0\n" };
  };

  const result = await preflightPackageRunners({
    runCommand,
    logger: (message) => logs.push(message),
    makeTempRoot: () => smokeRoot,
  });

  assert.equal(result.registry, "https://registry.npmjs.org/");
  assert.deepEqual(calls.slice(0, 4).map(([command]) => command), ["npm", "npx", "pnpm", "bun"]);
  assert.equal(calls.at(-1)[1], "ping");
  assert.match(logs.join("\n"), /PASS package runners/);
  assert.equal(existsSync(smokeRoot), false);
});

test("package-runner preflight reports all missing tools", async () => {
  const smokeRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-preflight-missing-test-"));
  const runCommand = async (options) => {
    if (options.command === "pnpm" || options.command === "bun") throw new Error("missing");
    return { stdout: "1.0.0\n" };
  };

  await assert.rejects(
    preflightPackageRunners({ runCommand, logger: () => {}, makeTempRoot: () => smokeRoot }),
    (error) => /pnpm \(pnpm dlx\), bun \(bun x\)/.test(error.message)
      && /smoke:pack:local/.test(error.message),
  );
  assert.equal(existsSync(smokeRoot), false);
});

test("package-runner preflight classifies blocked registry access", async () => {
  const smokeRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-preflight-registry-test-"));
  const runCommand = async (options) => {
    if (options.args[0] === "config") return { stdout: "https://registry.example.test/\n" };
    if (options.args[0] === "ping") throw new Error("blocked");
    return { stdout: "1.0.0\n" };
  };

  await assert.rejects(
    preflightPackageRunners({ runCommand, logger: () => {}, makeTempRoot: () => smokeRoot }),
    (error) => /Package registry access is required/.test(error.message)
      && /within 5000 ms/.test(error.message)
      && /smoke:pack:local/.test(error.message),
  );
  assert.equal(existsSync(smokeRoot), false);
});
