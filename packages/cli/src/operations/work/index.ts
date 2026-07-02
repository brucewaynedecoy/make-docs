import {
  existsSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";
import {
  listWaveEvidence,
  readWorkItemEvidence,
  recordWorkEvidence,
  resolveProjectIdentity,
  resolveStoreRoot,
  withStoreDatabase,
  type WorkItemIdentity,
} from "../../store";
import {
  findRepoRoot,
  loadJsonFile,
  normalizePath,
  readText,
  repoRelativePath,
} from "../shared";
import { OperationError, type JsonValue } from "../types";
import type {
  OperationDomainDescriptor,
  OperationResult,
} from "../types";

export interface Coordinate {
  w: number | null;
  r: number | null;
  p: number | null;
}

export interface PhaseTask {
  id: string;
  checked: boolean;
  text: string;
  line: number;
  stage: string;
  section: string;
}

export interface PhaseState {
  path: string;
  title: string;
  coordinate: Coordinate;
  tasks: PhaseTask[];
  uncheckedTasks: PhaseTask[];
  acceptanceCriteria: Array<{
    text: string;
    line: number;
    usesCheckbox: boolean;
    stage: string;
  }>;
  dependencies: Array<{ text: string; line: number; stage: string }>;
  validationCommands: Array<{ command: string; line: number; stage: string }>;
  declaredPaths: string[];
  sourceLinks: string[];
  stages: Array<{
    name: string;
    tasks: PhaseTask[];
    acceptanceCriteria: PhaseState["acceptanceCriteria"];
  }>;
  isComplete: boolean;
  warnings: string[];
}

export interface WaveResolution {
  target: string;
  mode: "wave" | "phase";
  repoRoot: string;
  waveDir: string;
  waveSlug: string;
  phasePath: string | null;
  coordinate: Coordinate;
  phases: Array<{
    path: string;
    phase: number | null;
    title: string;
    isComplete: boolean;
    uncheckedTaskCount: number;
  }>;
}

/**
 * Canonical work-item identity resolution (W18 R11; PRD 38 R-PS-3). This is
 * the tight identity the retained `work.item.resolve` operation returns:
 * coordinate or path in, canonical identity out, with NO judgment about which
 * phase to work next. When the target names a wave (no explicit phase),
 * `phasePath` is null — selecting the next incomplete phase is re-derivable
 * guidance and deliberately not part of the identity contract.
 *
 * `phasePath` is repo-relative, exactly the form the global store keys
 * work-execution evidence by (`WorkItemIdentity` in the store).
 */
export interface WorkItemIdentityResolution {
  mode: "wave" | "phase";
  repoRoot: string;
  waveDir: string;
  waveSlug: string;
  /** Repo-relative phase document path; null for a wave-only identity. */
  phasePath: string | null;
  coordinate: Coordinate;
}

const WR_COORD_RE = /\bw\s*(\d+)\s*r\s*(\d+)(?:\s*p\s*(\d+))?\b/i;
const WR_DIR_RE = /w(\d+)-r(\d+)/i;
const PHASE_FILE_RE = /^(0[1-9]|[1-9]\d)-(.+)\.md$/;
const TASK_RE = /^- \[([ xX])\] (t[1-9]\d*):\s*(.+)$/;
const ACCEPTANCE_CHECKBOX_RE = /^- \[[ xX]\]\s+/;
const BACKTICK_RE = /`([^`]+)`/g;
const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;

const PATH_HINT_NAMES = new Set([
  ".gitignore",
  ".npmrc",
  "Cargo.lock",
  "Cargo.toml",
  "justfile",
  "Justfile",
  "Makefile",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
]);

const PATH_HINT_SUFFIXES = new Set([
  ".cjs",
  ".go",
  ".js",
  ".json",
  ".lock",
  ".md",
  ".mjs",
  ".py",
  ".rs",
  ".sh",
  ".toml",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

const COUNT_RE =
  /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s+(?:crate\s+)?(?:stub|stubs|task|tasks|phase\s+output|phase\s+outputs)\b/gi;

export const workDomain: OperationDomainDescriptor = {
  name: "work",
  summary: "Wave, phase, and work-backlog inspection and planning operations.",
  commands: [
    {
      name: "work-phase-state",
      summary: "Parse one work phase document into deterministic task and validation state.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "wave-resolve",
      summary: "Resolve a wave or phase coordinate/path to the active work target.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "wave-status",
      summary: "Summarize wave phase completion and recorded work-execution evidence.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "phase-plan",
      summary: "Build the implementation plan for the next incomplete phase.",
      mutates: false,
      renderModes: ["json", "markdown"],
    },
  ],
};

export function parseWorkPhase(phasePath: string | path.ParsedPath): PhaseState {
  const phase = typeof phasePath === "string" ? path.resolve(phasePath) : path.format(phasePath);
  const text = readText(phase);
  const lines = text.split(/\r?\n/);
  const title = lines.find((line) => line.startsWith("# "))?.slice(2).trim() ?? path.basename(phase);
  const tasks: PhaseTask[] = [];
  const acceptanceCriteria: PhaseState["acceptanceCriteria"] = [];
  const dependencies: PhaseState["dependencies"] = [];
  const validationCommands: PhaseState["validationCommands"] = [];
  const declaredPaths = new Set<string>();
  const sourceLinks = new Set<string>();
  const stages = new Map<
    string,
    { tasks: PhaseTask[]; acceptanceCriteria: PhaseState["acceptanceCriteria"] }
  >();
  const headingStack: Array<[number, string]> = [];

  lines.forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 1;
    const headingMatch = HEADING_RE.exec(line);
    if (headingMatch) {
      const level = headingMatch[1]?.length ?? 0;
      const heading = headingMatch[2]?.trim() ?? "";
      while (headingStack.length > 0 && headingStack[headingStack.length - 1]![0] >= level) {
        headingStack.pop();
      }
      headingStack.push([level, heading]);
      if (level === 2 && heading.toLowerCase().startsWith("stage ")) {
        ensureStage(stages, heading);
      }
      return;
    }

    const currentH2 = [...headingStack].reverse().find(([level]) => level === 2)?.[1] ?? "";
    const currentH3 = [...headingStack].reverse().find(([level]) => level === 3)?.[1] ?? "";
    const section = currentH3.toLowerCase();
    const h2Section = currentH2.toLowerCase();
    const taskMatch = TASK_RE.exec(line);
    if (taskMatch) {
      const task = {
        id: taskMatch[2] ?? "",
        checked: (taskMatch[1] ?? "").toLowerCase() === "x",
        text: (taskMatch[3] ?? "").trim(),
        line: lineNumber,
        stage: currentH2,
        section: currentH3,
      };
      tasks.push(task);
      ensureStage(stages, currentH2 || "Unstaged").tasks.push(task);
    }

    if ((section === "acceptance criteria" || h2Section === "acceptance criteria") && line.startsWith("- ")) {
      const item = {
        text: line.slice(2).trim(),
        line: lineNumber,
        usesCheckbox: ACCEPTANCE_CHECKBOX_RE.test(line),
        stage: currentH2,
      };
      acceptanceCriteria.push(item);
      ensureStage(stages, currentH2 || "Unstaged").acceptanceCriteria.push(item);
    }

    if ((section === "dependencies" || h2Section === "dependencies") && line.startsWith("- ")) {
      dependencies.push({ text: line.slice(2).trim(), line: lineNumber, stage: currentH2 });
    }

    if (["validation commands", "validation", "checks"].includes(section) || ["validation commands", "validation", "checks"].includes(h2Section)) {
      const stripped = line.trim();
      if (stripped.startsWith("- `") && stripped.endsWith("`")) {
        validationCommands.push({
          command: stripped.slice(3, -1).trim(),
          line: lineNumber,
          stage: currentH2,
        });
      } else if (stripped.startsWith("`") && stripped.endsWith("`")) {
        validationCommands.push({
          command: stripped.slice(1, -1).trim(),
          line: lineNumber,
          stage: currentH2,
        });
      }
    }

    for (const match of line.matchAll(BACKTICK_RE)) {
      const candidate = (match[1] ?? "").trim();
      if (isPathHint(candidate)) {
        declaredPaths.add(candidate);
      }
    }

    for (const match of line.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const link = match[1] ?? "";
      if (!link.startsWith("http://") && !link.startsWith("https://") && !link.startsWith("#") && !link.startsWith("mailto:")) {
        sourceLinks.add(link);
        if (link.includes("/") && !link.startsWith("../")) {
          declaredPaths.add(link);
        }
      }
    }
  });

  const uncheckedTasks = tasks.filter((task) => !task.checked);
  return {
    path: normalizePath(path.relative(process.cwd(), phase) || phase),
    title,
    coordinate: coordinateForPath(phase),
    tasks,
    uncheckedTasks,
    acceptanceCriteria,
    dependencies,
    validationCommands,
    declaredPaths: [...declaredPaths].sort(),
    sourceLinks: [...sourceLinks].sort(),
    stages: [...stages.entries()]
      .filter(([name]) => name.length > 0)
      .map(([name, stage]) => ({
        name,
        tasks: stage.tasks,
        acceptanceCriteria: stage.acceptanceCriteria,
      })),
    isComplete: tasks.length > 0 && uncheckedTasks.length === 0,
    warnings: phaseWarnings(tasks, acceptanceCriteria),
  };
}

export function resolveWaveTarget(target: string, repoRoot?: string): WaveResolution {
  const root = findRepoRoot(repoRoot ? path.resolve(repoRoot) : undefined);
  const raw = target.trim();
  const candidate = path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(root, raw);
  if (existsSync(candidate)) {
    return resolveWavePath(candidate, findRepoRoot(path.dirname(candidate)));
  }

  const coordinate = parseCoordinateTarget(target, raw);
  const waveDir = matchWaveDirectory(root, coordinate.wave, coordinate.revision);
  const phases = phaseDocs(waveDir);
  let phaseDoc: string | null = null;
  let mode: "wave" | "phase" = "wave";
  if (coordinate.phase !== null) {
    mode = "phase";
    phaseDoc = findPhaseDoc(root, waveDir, phases, coordinate.phase);
  } else {
    phaseDoc = phases.find((item) => !parseWorkPhase(item).isComplete) ?? null;
  }

  return buildResolution(root, waveDir, phases, phaseDoc, mode, raw);
}

/**
 * Resolves a coordinate (`W18 R11 P1`) or a wave/phase path to the canonical
 * work-item identity (R-PS-3): repo root, wave slug, and repo-relative phase
 * path. Unlike `resolveWaveTarget`, a wave-level target resolves with
 * `phasePath: null` — this resolver never scans phase completion state and
 * never selects the next incomplete phase (that judgment is re-derivable and
 * not identity).
 */
export function resolveWorkItemIdentity(target: string, repoRoot?: string): WorkItemIdentityResolution {
  const root = findRepoRoot(repoRoot ? path.resolve(repoRoot) : undefined);
  const raw = target.trim();
  const candidate = path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(root, raw);
  if (existsSync(candidate)) {
    if (statSync(candidate).isFile()) {
      const waveDir = path.dirname(candidate);
      return buildIdentityResolution(findRepoRoot(waveDir), waveDir, candidate, "phase");
    }
    if (statSync(candidate).isDirectory()) {
      return buildIdentityResolution(findRepoRoot(path.dirname(candidate)), candidate, null, "wave");
    }
    throw new OperationError(`Path does not resolve to a wave directory or phase file: ${candidate}`);
  }

  const coordinate = parseCoordinateTarget(target, raw);
  const waveDir = matchWaveDirectory(root, coordinate.wave, coordinate.revision);
  if (coordinate.phase === null) {
    return buildIdentityResolution(root, waveDir, null, "wave");
  }
  const phaseDoc = findPhaseDoc(root, waveDir, phaseDocs(waveDir), coordinate.phase);
  return buildIdentityResolution(root, waveDir, phaseDoc, "phase");
}

/**
 * Records one work-execution evidence entry in the global store (R-BND-2,
 * R-PS-3), keyed by the manifest-minted project identifier plus the canonical
 * work-item identity. Evidence is phase-scoped: a wave-only target is refused
 * rather than silently attributed to a guessed phase. The evidence kind and
 * payload are the caller's vocabulary; the store treats the payload as opaque
 * JSON (R-SCOPE-1 — the PRD 38 schema is consumed as-is).
 */
export function buildWorkEvidenceRecord(input: {
  target: string;
  repoRoot?: string;
  /** Explicit store root override (tests/sandboxes); defaults to the resolved global store. */
  storeRoot?: string;
  evidenceKind: string;
  payload: JsonValue;
}): Record<string, JsonValue> {
  const resolution = resolveWorkItemIdentity(input.target, input.repoRoot);
  if (!resolution.phasePath) {
    throw new OperationError(
      `Work-execution evidence requires a phase-level identity, but \`${input.target}\` resolves ` +
        `to wave ${resolution.waveSlug} with no phase. Name an explicit phase coordinate ` +
        "(for example `W18 R11 P1`) or pass a phase document path.",
    );
  }
  const identity: WorkItemIdentity = {
    repoRoot: resolution.repoRoot,
    waveSlug: resolution.waveSlug,
    phasePath: resolution.phasePath,
  };
  const projectId = requireProjectId(resolution.repoRoot);
  return withStoreDatabase(
    resolveStoreRoot(input.storeRoot ? { storeRoot: input.storeRoot } : {}),
    (db) => {
      recordWorkEvidence(db, {
        projectId,
        identity,
        evidenceKind: input.evidenceKind,
        payload: input.payload,
      });
      // Mirror what the store row captured (recordedAt is minted by the store).
      const row = readWorkItemEvidence(db, { projectId, identity }).find(
        (item) => item.evidenceKind === input.evidenceKind,
      );
      return {
        projectId,
        identity: identity as unknown as JsonValue,
        evidenceKind: input.evidenceKind,
        recordedAt: row?.recordedAt ?? null,
      };
    },
  );
}

/**
 * Reads recorded work-execution evidence from the global store for one
 * canonical work-item identity. A phase-level target returns that phase's
 * rows; a wave-only target returns every row recorded for the wave.
 */
export function buildWorkEvidenceRead(input: {
  target: string;
  repoRoot?: string;
  /** Explicit store root override (tests/sandboxes); defaults to the resolved global store. */
  storeRoot?: string;
}): Record<string, JsonValue> {
  const resolution = resolveWorkItemIdentity(input.target, input.repoRoot);
  const projectId = requireProjectId(resolution.repoRoot);
  return withStoreDatabase(
    resolveStoreRoot(input.storeRoot ? { storeRoot: input.storeRoot } : {}),
    (db): Record<string, JsonValue> => {
      if (resolution.phasePath) {
        const identity: WorkItemIdentity = {
          repoRoot: resolution.repoRoot,
          waveSlug: resolution.waveSlug,
          phasePath: resolution.phasePath,
        };
        return {
          projectId,
          identity: identity as unknown as JsonValue,
          evidence: readWorkItemEvidence(db, { projectId, identity }) as unknown as JsonValue,
        };
      }
      return {
        projectId,
        waveSlug: resolution.waveSlug,
        evidence: listWaveEvidence(db, {
          projectId,
          waveSlug: resolution.waveSlug,
        }) as unknown as JsonValue,
      };
    },
  );
}

/**
 * Wave status over the docs/work phase documents plus the recorded
 * work-execution evidence for the wave. Evidence is read from the global
 * store (R-BND-2); a not-yet-migrated legacy checkpoint file under
 * `.make-docs/runs/<wave-slug>/state.json` is surfaced read-only until the
 * next checkpoint migrates and removes it. This operation never writes.
 */
export function buildWaveStatus(
  target: string,
  options: { storeRoot?: string } = {},
): Record<string, JsonValue> {
  const resolution = resolveWaveTarget(target);
  const phases = resolution.phases.map((item) => {
    const phaseState = parseWorkPhase(item.path);
    return {
      ...item,
      taskCount: phaseState.tasks.length,
      uncheckedTasks: phaseState.uncheckedTasks as unknown as JsonValue,
      warnings: phaseState.warnings,
    };
  });

  const warnings: string[] = [];
  let evidence: JsonValue = [];
  const identityResolution = resolveProjectIdentity(resolution.repoRoot);
  if (identityResolution.status === "resolved") {
    try {
      evidence = withStoreDatabase(
        resolveStoreRoot(options.storeRoot ? { storeRoot: options.storeRoot } : {}),
        (db) =>
          listWaveEvidence(db, {
            projectId: identityResolution.projectId,
            waveSlug: resolution.waveSlug,
          }),
      ) as unknown as JsonValue;
    } catch (error) {
      warnings.push(
        `Recorded evidence could not be read from the global store (${error instanceof Error ? error.message : String(error)}).`,
      );
    }
  } else {
    warnings.push(
      `Recorded evidence unavailable: project identity is ${identityResolution.status} (evidence is keyed by the manifest-minted project identifier).`,
    );
  }

  const legacyStatePath = statePathFor(resolution);
  const legacyPresent = existsSync(legacyStatePath);
  return {
    resolution: resolution as unknown as JsonValue,
    phases: phases as unknown as JsonValue,
    nextPhasePath: resolution.phasePath,
    evidenceSource: "global-store",
    projectIdentity: {
      status: identityResolution.status,
      projectId:
        identityResolution.status === "resolved" ? identityResolution.projectId : null,
    },
    evidence,
    legacyCheckpoint: {
      path: repoRelativePath(legacyStatePath, resolution.repoRoot),
      present: legacyPresent,
      state: legacyPresent ? (loadJsonFile(legacyStatePath) as JsonValue) : null,
    } as unknown as JsonValue,
    warnings,
  };
}

export function buildPhasePlan(target: string): Record<string, JsonValue> {
  const resolution = resolveWaveTarget(target);
  if (!resolution.phasePath) {
    throw new OperationError("No incomplete phase found for this target.");
  }
  const phase = parseWorkPhase(resolution.phasePath);
  const warnings = [...phase.warnings, ...consistencyWarnings(resolution.phasePath, phase)];
  return {
    target,
    mode: resolution.mode,
    waveDir: resolution.waveDir,
    phasePath: resolution.phasePath,
    title: phase.title,
    coordinate: phase.coordinate as unknown as JsonValue,
    stages: phase.stages as unknown as JsonValue,
    dependencies: phase.dependencies as unknown as JsonValue,
    validationCommands: phase.validationCommands as unknown as JsonValue,
    declaredPaths: phase.declaredPaths,
    warnings,
    parallelization: parallelizationFor(phase),
  };
}

export function renderPhasePlan(plan: Record<string, JsonValue>): string {
  const lines = [
    `# Phase Plan: ${String(plan.title)}`,
    "",
    `- Phase: \`${String(plan.phasePath)}\``,
    `- Mode: \`${String(plan.mode)}\``,
    "",
    "## Stages",
  ];
  const stages = Array.isArray(plan.stages) ? plan.stages : [];
  if (stages.length === 0) {
    lines.push("- No staged task sections found.");
  } else {
    for (const rawStage of stages) {
      const stage = rawStage as { name?: string; tasks?: unknown[]; acceptanceCriteria?: unknown[] };
      lines.push(
        `- ${stage.name ?? "Unnamed"}: ${stage.tasks?.length ?? 0} task(s), ${stage.acceptanceCriteria?.length ?? 0} acceptance item(s)`,
      );
    }
  }
  lines.push("", "## Dependencies");
  const dependencies = Array.isArray(plan.dependencies) ? plan.dependencies : [];
  if (dependencies.length === 0) {
    lines.push("- No explicit dependency bullets found.");
  } else {
    for (const rawItem of dependencies) {
      const item = rawItem as { text?: string };
      lines.push(`- ${item.text ?? ""}`);
    }
  }
  lines.push("", "## Validation");
  const commands = Array.isArray(plan.validationCommands) ? plan.validationCommands : [];
  if (commands.length === 0) {
    lines.push("- No explicit validation commands found; derive focused validation from touched code/docs.");
  } else {
    for (const rawCommand of commands) {
      const command = rawCommand as { command?: string };
      lines.push(`- \`${command.command ?? ""}\``);
    }
  }
  lines.push("", "## Scope Hints");
  const paths = Array.isArray(plan.declaredPaths) ? plan.declaredPaths : [];
  if (paths.length === 0) {
    lines.push("- No declared file paths found in the phase.");
  } else {
    for (const item of paths) {
      lines.push(`- \`${String(item)}\``);
    }
  }
  lines.push("", "## Parallelization");
  const parallelization = Array.isArray(plan.parallelization) ? plan.parallelization : [];
  for (const item of parallelization) {
    lines.push(`- ${String(item)}`);
  }
  const warnings = Array.isArray(plan.warnings) ? plan.warnings : [];
  if (warnings.length > 0) {
    lines.push("", "## Consistency Warnings");
    for (const warning of warnings) {
      lines.push(`- ${String(warning)}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

export function readWorkPhaseState(phasePath: string): OperationResult<PhaseState> {
  return {
    value: parseWorkPhase(phasePath),
    provenance: {
      domain: "work",
      operation: "work-phase-state",
      source: "shared",
      target: phasePath,
    },
  };
}

export function resolveWorkWave(target: string): OperationResult<WaveResolution> {
  return {
    value: resolveWaveTarget(target),
    provenance: {
      domain: "work",
      operation: "wave-resolve",
      source: "shared",
      target,
    },
  };
}

export function readWaveStatus(target: string): OperationResult<Record<string, JsonValue>> {
  return {
    value: buildWaveStatus(target),
    provenance: {
      domain: "work",
      operation: "wave-status",
      source: "shared",
      target,
    },
  };
}

export function planWorkPhase(target: string): OperationResult<Record<string, JsonValue>> {
  return {
    value: buildPhasePlan(target),
    provenance: {
      domain: "work",
      operation: "phase-plan",
      source: "shared",
      target,
    },
  };
}

/**
 * Location of the LEGACY per-repo checkpoint file (W18 R10 P3, R-BND-2).
 * This path is read-and-migrate only: no operation writes work-lifecycle
 * state here anymore — evidence lives in the global store, keyed by the
 * manifest-minted project identifier plus the canonical work-item identity.
 * The mutating checkpoint operation migrates a file found here into evidence
 * rows and removes it.
 */
export function statePathFor(resolution: WaveResolution): string {
  return path.join(resolution.repoRoot, ".make-docs", "runs", resolution.waveSlug, "state.json");
}

function resolveWavePath(targetPath: string, repoRoot: string): WaveResolution {
  const resolvedPath = path.resolve(targetPath);
  const root = findRepoRoot(repoRoot);
  if (statSync(resolvedPath).isFile()) {
    const waveDir = path.dirname(resolvedPath);
    const phases = phaseDocs(waveDir);
    return buildResolution(root, waveDir, phases, resolvedPath, "phase", resolvedPath);
  }
  if (statSync(resolvedPath).isDirectory()) {
    const phases = phaseDocs(resolvedPath);
    const phaseDoc = phases.find((phase) => !parseWorkPhase(phase).isComplete) ?? null;
    return buildResolution(root, resolvedPath, phases, phaseDoc, "wave", resolvedPath);
  }
  throw new OperationError(`Path does not resolve to a wave directory or phase file: ${resolvedPath}`);
}

function parseCoordinateTarget(
  target: string,
  raw: string,
): { wave: number; revision: number; phase: number | null } {
  const coord = WR_COORD_RE.exec(raw);
  if (!coord) {
    throw new OperationError(`Could not parse target \`${target}\` as a coordinate or path.`);
  }
  return {
    wave: Number(coord[1]),
    revision: Number(coord[2]),
    phase: coord[3] ? Number(coord[3]) : null,
  };
}

function matchWaveDirectory(root: string, wave: number, revision: number): string {
  const workRoot = path.join(root, "docs", "work");
  const matches = readdirSync(workRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && new RegExp(`w0*${wave}-r0*${revision}\\b`, "i").test(entry.name))
    .map((entry) => path.join(workRoot, entry.name))
    .sort();

  if (matches.length === 0) {
    throw new OperationError(`No docs/work wave directory found for W${wave} R${revision}.`);
  }
  if (matches.length > 1) {
    throw new OperationError(
      `Ambiguous wave coordinate; candidates: ${matches.map((item) => normalizePath(path.relative(root, item))).join(", ")}`,
    );
  }
  return matches[0]!;
}

function findPhaseDoc(root: string, waveDir: string, phases: string[], phase: number): string {
  const phaseDoc = phases.find((item) => phaseNumber(item) === phase) ?? null;
  if (!phaseDoc) {
    throw new OperationError(`No phase P${phase} found under ${normalizePath(path.relative(root, waveDir))}.`);
  }
  return phaseDoc;
}

function buildIdentityResolution(
  root: string,
  waveDir: string,
  phaseDoc: string | null,
  mode: "wave" | "phase",
): WorkItemIdentityResolution {
  return {
    mode,
    repoRoot: root,
    waveDir,
    waveSlug: path.basename(waveDir),
    phasePath: phaseDoc ? repoRelativePath(phaseDoc, root) : null,
    coordinate: coordinateForPath(phaseDoc ?? waveDir),
  };
}

function requireProjectId(repoRoot: string): string {
  const resolution = resolveProjectIdentity(repoRoot);
  if (resolution.status === "resolved") {
    return resolution.projectId;
  }
  const guidance =
    resolution.status === "unminted"
      ? "this project's manifest predates the stable project identifier; run `make-docs` once to mint it."
      : resolution.status === "no-manifest"
        ? "this repository has no .make-docs/manifest.json; run `make-docs` to set up Make Docs first."
        : "this project's .make-docs/manifest.json is unreadable; repair it and rerun `make-docs`.";
  throw new OperationError(
    `Cannot use the global store for work-execution evidence: ${guidance} ` +
      "Evidence is keyed by the manifest-minted project identifier, never by a repository path.",
  );
}

function buildResolution(
  root: string,
  waveDir: string,
  phases: string[],
  phaseDoc: string | null,
  mode: "wave" | "phase",
  target: string,
): WaveResolution {
  return {
    target,
    mode,
    repoRoot: root,
    waveDir,
    waveSlug: path.basename(waveDir),
    phasePath: phaseDoc,
    coordinate: coordinateForPath(phaseDoc ?? waveDir),
    phases: phases.map((phase) => {
      const state = parseWorkPhase(phase);
      return {
        path: phase,
        phase: phaseNumber(phase),
        title: state.title,
        isComplete: state.isComplete,
        uncheckedTaskCount: state.uncheckedTasks.length,
      };
    }),
  };
}

function phaseDocs(waveDir: string): string[] {
  return readdirSync(waveDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && PHASE_FILE_RE.test(entry.name) && !entry.name.startsWith("00-"))
    .map((entry) => path.join(waveDir, entry.name))
    .sort(phaseSort);
}

function phaseSort(left: string, right: string): number {
  const leftNumber = phaseNumber(left) ?? 999;
  const rightNumber = phaseNumber(right) ?? 999;
  if (leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }
  return path.basename(left).localeCompare(path.basename(right));
}

function phaseNumber(value: string): number | null {
  const match = PHASE_FILE_RE.exec(path.basename(value));
  return match ? Number(match[1]) : null;
}

function coordinateForPath(value: string): Coordinate {
  const wr = WR_DIR_RE.exec(normalizePath(value));
  return {
    w: wr ? Number(wr[1]) : null,
    r: wr ? Number(wr[2]) : null,
    p: existsSync(value) && statSync(value).isFile() ? phaseNumber(value) : null,
  };
}

function ensureStage(
  stages: Map<string, { tasks: PhaseTask[]; acceptanceCriteria: PhaseState["acceptanceCriteria"] }>,
  name: string,
): { tasks: PhaseTask[]; acceptanceCriteria: PhaseState["acceptanceCriteria"] } {
  const existing = stages.get(name);
  if (existing) {
    return existing;
  }
  const created = { tasks: [], acceptanceCriteria: [] };
  stages.set(name, created);
  return created;
}

function phaseWarnings(
  tasks: PhaseTask[],
  acceptance: PhaseState["acceptanceCriteria"],
): string[] {
  const warnings: string[] = [];
  const seen = new Set<string>();
  let expected = 1;
  for (const task of tasks) {
    if (seen.has(task.id)) {
      warnings.push(`duplicate task id ${task.id}`);
    }
    seen.add(task.id);
    if (task.id !== `t${expected}`) {
      warnings.push(`expected task id t${expected}, found ${task.id}`);
    }
    expected += 1;
  }
  if (acceptance.some((item) => item.usesCheckbox)) {
    warnings.push("acceptance criteria contains checkbox syntax");
  }
  return warnings;
}

function isPathHint(value: string): boolean {
  const clean = value.trim();
  if (!clean || clean.startsWith("-") || clean.startsWith("$")) {
    return false;
  }
  if (/\s/.test(clean)) {
    return false;
  }
  if (PATH_HINT_NAMES.has(clean) || PATH_HINT_NAMES.has(path.basename(clean))) {
    return true;
  }
  if (clean.startsWith(".") && !clean.includes("/") && !clean.includes(" ")) {
    return true;
  }
  if (clean.endsWith("/")) {
    return true;
  }
  if (clean.includes("/") && !clean.startsWith("http://") && !clean.startsWith("https://")) {
    return true;
  }
  return PATH_HINT_SUFFIXES.has(path.extname(clean));
}

function consistencyWarnings(phasePath: string, phase: PhaseState): string[] {
  const warnings: string[] = [];
  for (const rawLink of phase.sourceLinks) {
    if (!rawLink.endsWith(".md")) {
      continue;
    }
    const candidate = path.resolve(path.dirname(phasePath), rawLink);
    if (!existsSync(candidate)) {
      continue;
    }
    const text = readText(candidate);
    for (const match of text.matchAll(COUNT_RE)) {
      const expected = countValue(match[1] ?? "");
      if (expected !== phase.tasks.length) {
        warnings.push(
          `linked source ${normalizePath(candidate)} mentions ${expected} expected item(s), but this phase has ${phase.tasks.length} task(s)`,
        );
        break;
      }
    }
  }
  return warnings;
}

function countValue(raw: string): number {
  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }
  return NUMBER_WORDS[raw.toLowerCase()] ?? 0;
}

function parallelizationFor(phase: PhaseState): string[] {
  const dependencyText = phase.dependencies.map((item) => item.text.toLowerCase()).join(" ");
  if (dependencyText.includes("depend") || dependencyText.includes("stage")) {
    return [
      "Explicit dependency notes are present; implement dependency gates serially first, then parallelize only clearly disjoint tasks.",
    ];
  }
  const independent = phase.stages
    .filter(
      (stage) =>
        stage.tasks.length > 0 &&
        !stage.acceptanceCriteria.some((item) => item.text.toLowerCase().includes("depend")),
    )
    .map((stage) => stage.name);
  if (independent.length <= 1) {
    return ["Implement serially unless the phase dependency notes identify disjoint work."];
  }
  return [
    `Candidate parallel stages: ${independent.join(", ")}`,
    "Keep worker write scopes disjoint and integrate through the coordinator.",
  ];
}
