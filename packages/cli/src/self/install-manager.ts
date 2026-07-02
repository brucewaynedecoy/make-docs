import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { readPackageMeta } from "../utils";

/**
 * Install-manager detection matrix (W18 R11 P3; PRD 39 R-SELF-1..3).
 *
 * The tool self-management commands (`make-docs update` / `make-docs
 * uninstall`) must decide whether the running binary is a persistent global
 * install — and if so, which install manager owns it — or a transient
 * remote-execution invocation (npx / pnpm dlx / bunx), where no persistent
 * binary exists on the machine.
 *
 * D9 implementer freedom — the documented detection matrix:
 *
 * The realpath of the running script (`process.argv[1]`, falling back to
 * `process.execPath`) is normalized to POSIX separators and matched against
 * two data-driven marker sets, in this order:
 *
 * 1. Remote-execution (transient runner cache) markers — matched first, so a
 *    runner cache that happens to live under a manager directory (for
 *    example pnpm's dlx store under `~/Library/pnpm/store/`) is classified
 *    as remote, never persistent:
 *    - `/_npx/`            — npm exec / npx cache (`~/.npm/_npx/<hash>/…`)
 *    - `/pnpm/store/`      — pnpm content-addressable store (dlx runs here)
 *    - `/.pnpm-store/`     — alternate pnpm store location
 *    - `/dlx-<id>/`        — pnpm dlx temporary install directories
 *    - `/.bun/install/cache/` — bun package cache (bunx executes from here)
 *    - `/bunx-<id>/`       — bunx temporary directories
 *
 * 2. Persistent global-install markers, one entry per known manager:
 *    - npm      — `/lib/node_modules/` (covers `$(npm root -g)`-style
 *                 prefixes, including Homebrew-provided node at
 *                 `/opt/homebrew/lib/node_modules/…`, where npm still owns
 *                 the install)
 *    - pnpm     — `/pnpm/global/`, `/.local/share/pnpm/`, `/Library/pnpm/`
 *    - bun      — `/.bun/install/global/`
 *    - homebrew — `/Cellar/make-docs/` (a make-docs formula install; a
 *                 Homebrew *node* install that used `npm install -g` matches
 *                 the npm marker instead, which is the correct owner)
 *
 * A persistent marker only counts when the matched path also references the
 * make-docs package (substring `make-docs`), so a node binary living under
 * `/Cellar/node/…` never claims ownership. Exactly one matching manager →
 * `persistent`. More than one, or a path matching no known pattern (for
 * example a repo checkout during development) → `ambiguous`: the commands
 * never guess and instead print the exact command(s) and the affected store
 * path (R-SELF-3). A remote marker → `remote`: there is no persistent
 * binary on the machine.
 *
 * Command execution is behind the injectable {@link ExecCommand} seam so
 * tests never run a real package manager.
 */

/** npm package name of the CLI itself (used in manager commands). */
export const SELF_PACKAGE_NAME: string = (() => {
  try {
    return readPackageMeta().name;
  } catch {
    return "@brucewaynedecoy/make-docs";
  }
})();

export type InstallManagerId = "npm" | "pnpm" | "bun" | "homebrew";

export interface ManagerCommand {
  command: string;
  args: string[];
}

export interface InstallManagerSpec {
  id: InstallManagerId;
  label: string;
  /** Path markers identifying this manager's persistent global root. */
  markers: readonly RegExp[];
  uninstallCommand: ManagerCommand;
  updateCommand: ManagerCommand;
}

export const INSTALL_MANAGER_MATRIX: readonly InstallManagerSpec[] = [
  {
    id: "npm",
    label: "npm (global install)",
    markers: [/\/lib\/node_modules\//],
    uninstallCommand: { command: "npm", args: ["uninstall", "-g", SELF_PACKAGE_NAME] },
    updateCommand: {
      command: "npm",
      args: ["install", "-g", `${SELF_PACKAGE_NAME}@latest`],
    },
  },
  {
    id: "pnpm",
    label: "pnpm (global install)",
    markers: [/\/pnpm\/global\//, /\/\.local\/share\/pnpm\//, /\/Library\/pnpm\//],
    uninstallCommand: { command: "pnpm", args: ["remove", "-g", SELF_PACKAGE_NAME] },
    updateCommand: {
      command: "pnpm",
      args: ["add", "-g", `${SELF_PACKAGE_NAME}@latest`],
    },
  },
  {
    id: "bun",
    label: "bun (global install)",
    markers: [/\/\.bun\/install\/global\//],
    uninstallCommand: { command: "bun", args: ["remove", "-g", SELF_PACKAGE_NAME] },
    updateCommand: {
      command: "bun",
      args: ["add", "-g", `${SELF_PACKAGE_NAME}@latest`],
    },
  },
  {
    id: "homebrew",
    label: "Homebrew",
    markers: [/\/Cellar\/make-docs\//],
    uninstallCommand: { command: "brew", args: ["uninstall", "make-docs"] },
    updateCommand: { command: "brew", args: ["upgrade", "make-docs"] },
  },
];

/** Transient runner caches: matching paths mean remote execution. */
export const REMOTE_EXECUTION_MARKERS: readonly RegExp[] = [
  /\/_npx\//,
  /\/pnpm\/store\//,
  /\/\.pnpm-store\//,
  /\/dlx-[^/]+\//,
  /\/\.bun\/install\/cache\//,
  /\/bunx-[^/]+\//,
];

export type InstallDetection =
  | {
      kind: "persistent";
      manager: InstallManagerSpec;
      binaryPath: string;
    }
  | {
      kind: "remote";
      binaryPath: string | null;
      evidence: string;
    }
  | {
      kind: "ambiguous";
      binaryPath: string | null;
      candidates: InstallManagerSpec[];
      reason: string;
    };

export interface DetectInstallSourceOptions {
  /** Script path of the running CLI; defaults to `process.argv[1]`. */
  argv1?: string;
  /** Node (or standalone) binary path; defaults to `process.execPath`. */
  execPath?: string;
  /** Realpath resolver seam; defaults to `fs.realpathSync`. */
  realpath?: (candidate: string) => string;
}

export function detectInstallSource(
  options: DetectInstallSourceOptions = {},
): InstallDetection {
  const realpath = options.realpath ?? defaultRealpath;
  const rawCandidates = [
    options.argv1 ?? process.argv[1],
    options.execPath ?? process.execPath,
  ].filter((candidate): candidate is string => Boolean(candidate));
  const resolvedPaths = [
    ...new Set(rawCandidates.map((candidate) => toPosixPath(realpath(candidate)))),
  ];
  const primaryPath = resolvedPaths[0] ?? null;

  if (resolvedPaths.length === 0) {
    return {
      kind: "ambiguous",
      binaryPath: null,
      candidates: [],
      reason: "No script or binary path is available to inspect.",
    };
  }

  for (const resolvedPath of resolvedPaths) {
    const remoteMarker = REMOTE_EXECUTION_MARKERS.find((marker) =>
      marker.test(resolvedPath),
    );
    if (remoteMarker) {
      return {
        kind: "remote",
        binaryPath: resolvedPath,
        evidence: `${resolvedPath} matches the transient runner cache pattern ${remoteMarker}.`,
      };
    }
  }

  const owners = new Map<InstallManagerId, { spec: InstallManagerSpec; path: string }>();
  for (const resolvedPath of resolvedPaths) {
    if (!resolvedPath.includes("make-docs")) {
      continue;
    }
    for (const spec of INSTALL_MANAGER_MATRIX) {
      if (spec.markers.some((marker) => marker.test(resolvedPath))) {
        owners.set(spec.id, { spec, path: resolvedPath });
      }
    }
  }

  const matches = [...owners.values()];
  if (matches.length === 1) {
    return {
      kind: "persistent",
      manager: matches[0].spec,
      binaryPath: matches[0].path,
    };
  }

  if (matches.length > 1) {
    return {
      kind: "ambiguous",
      binaryPath: primaryPath,
      candidates: matches.map((match) => match.spec),
      reason: `The path matches more than one install manager (${matches
        .map((match) => match.spec.id)
        .join(", ")}).`,
    };
  }

  return {
    kind: "ambiguous",
    binaryPath: primaryPath,
    candidates: [],
    reason: `${primaryPath} matches no known install-manager global root or runner cache.`,
  };
}

export function formatManagerCommand(command: ManagerCommand): string {
  return [command.command, ...command.args].join(" ");
}

/**
 * Injectable command-execution seam. The default implementation runs the
 * manager command in the foreground with inherited stdio; tests inject a
 * fake so no real package manager ever runs.
 */
export type ExecCommand = (
  command: string,
  args: string[],
) => Promise<{ exitCode: number | null }>;

export const defaultExecCommand: ExecCommand = async (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit" });
  return { exitCode: result.status };
};

function defaultRealpath(candidate: string): string {
  try {
    return realpathSync(candidate);
  } catch {
    return candidate;
  }
}

function toPosixPath(candidate: string): string {
  return candidate.split("\\").join("/");
}
