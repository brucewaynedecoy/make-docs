import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { OperationError, type JsonValue } from "./operations/types";

export { OperationError };
export type { JsonValue };

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

interface OperationOptions {
  positionals: string[];
  values: Record<string, string>;
  arrays: Record<string, string[]>;
  booleans: Set<string>;
}

const WR_COORD_RE = /\bw\s*(\d+)\s*r\s*(\d+)(?:\s*p\s*(\d+))?\b/i;
const WR_DIR_RE = /w(\d+)-r(\d+)/i;
const PHASE_FILE_RE = /^(0[1-9]|[1-9]\d)-(.+)\.md$/;
const TASK_RE = /^- \[([ xX])\] (t[1-9]\d*):\s*(.+)$/;
const ACCEPTANCE_CHECKBOX_RE = /^- \[[ xX]\]\s+/;
const BACKTICK_RE = /`([^`]+)`/g;
const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;
const COORDINATE_RE = /w(\d+)-r(\d+)/i;
const TASK_ID_RE = /\bt([1-9]\d*)\b/i;
const RISK_HEADING_RE = /^###\s+([DQR])-(\d{3})\b/gm;
const SLUG_RE = /[^a-z0-9]+/g;

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

const LOCKFILE_MANIFESTS: Record<string, string[]> = {
  "Cargo.lock": ["Cargo.toml"],
  "package-lock.json": ["package.json"],
  "pnpm-lock.yaml": ["package.json", "pnpm-workspace.yaml"],
  "yarn.lock": ["package.json"],
  "bun.lockb": ["package.json"],
};

export async function runOperationsCommand(argv: string[]): Promise<void> {
  const operation = argv[0];
  if (!operation || operation === "--help" || operation === "-h") {
    printOperationsHelp();
    return;
  }

  const options = parseOperationOptions(argv.slice(1));

  switch (operation) {
    case "closeout-probe":
      printJson(
        buildCloseoutProbe({
          repoRoot: path.resolve(options.values["repo-root"] ?? "."),
          scope: parseScope(options.values.scope ?? "auto"),
        }),
      );
      return;
    case "closeout-validate":
      printJson(
        runCloseoutValidate({
          repoRoot: path.resolve(options.values["repo-root"] ?? "."),
          probeJson: requiredValue(options, "probe-json", operation),
          run: options.booleans.has("run"),
        }),
      );
      return;
    case "closeout-history":
      printJson(
        runCloseoutHistory({
          repoRoot: path.resolve(options.values["repo-root"] ?? "."),
          mode: parseCloseoutMode(requiredValue(options, "mode", operation)),
          probeJson: options.values["probe-json"],
          phaseJson: options.values["phase-json"],
          title: options.values.title,
          date: options.values.date ?? new Date().toISOString().slice(0, 10),
          outputDir: options.values["output-dir"] ?? "docs/assets/archive/history",
          write: options.booleans.has("write"),
        }),
      );
      return;
    case "work-phase-state":
      printJson(parseWorkPhase(resolveCliPath(requiredPositionals(options, operation).join(" "))));
      return;
    case "wave-resolve":
      printJson(resolveWaveTarget(requiredPositionals(options, operation).join(" ")));
      return;
    case "wave-status":
      printJson(buildWaveStatus(requiredPositionals(options, operation).join(" ")));
      return;
    case "phase-plan": {
      const plan = buildPhasePlan(requiredPositionals(options, operation).join(" "));
      process.stdout.write(
        options.booleans.has("json") ? `${JSON.stringify(plan, null, 2)}\n` : renderPhasePlan(plan),
      );
      return;
    }
    case "checkpoint":
      printJson(
        buildCheckpoint({
          target: requiredPositionals(options, operation).join(" "),
          phase: options.values.phase,
          mode: parseOptionalMode(options.values.mode),
          commitPolicy: options.values["commit-policy"],
          status: options.values.status,
          validationStatus: options.values["validation-status"],
          validationCommands: options.arrays["validation-command"] ?? [],
          reviewStatus: options.values["review-status"],
          reviewRequired: booleanOption(options, "review-required"),
          closeoutStatus: options.values["closeout-status"],
          commitStatus: options.values["commit-status"],
          commitSha: options.values["commit-sha"],
          pushStatus: options.values["push-status"],
          note: options.values.note,
        }),
      );
      return;
    case "scope-guard":
      printJson(
        buildScopeReport(
          requiredPositionals(options, operation).join(" "),
          options.arrays.changed,
        ),
      );
      return;
    case "phase-gate":
      printJson(
        buildPhaseGateReport(
          requiredPositionals(options, operation).join(" "),
          options.values["commit-policy"],
        ),
      );
      return;
    default:
      throw new OperationError(`Unknown make-docs operation: ${operation}`);
  }
}

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

  const coord = WR_COORD_RE.exec(raw);
  if (!coord) {
    throw new OperationError(`Could not parse target \`${target}\` as a coordinate or path.`);
  }
  const wave = Number(coord[1]);
  const revision = Number(coord[2]);
  const phase = coord[3] ? Number(coord[3]) : null;
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

  const waveDir = matches[0]!;
  const phases = phaseDocs(waveDir);
  let phaseDoc: string | null = null;
  let mode: "wave" | "phase" = "wave";
  if (phase !== null) {
    mode = "phase";
    phaseDoc = phases.find((item) => phaseNumber(item) === phase) ?? null;
    if (!phaseDoc) {
      throw new OperationError(`No phase P${phase} found under ${normalizePath(path.relative(root, waveDir))}.`);
    }
  } else {
    phaseDoc = phases.find((item) => !parseWorkPhase(item).isComplete) ?? null;
  }

  return buildResolution(root, waveDir, phases, phaseDoc, mode, raw);
}

export function buildWaveStatus(target: string): Record<string, JsonValue> {
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
  const statePath = statePathFor(resolution);
  return {
    resolution: resolution as unknown as JsonValue,
    phases: phases as unknown as JsonValue,
    nextPhasePath: resolution.phasePath,
    statePath,
    state: loadJsonFile(statePath) as JsonValue,
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

export function buildCheckpoint(options: {
  target: string;
  phase?: string;
  mode?: "wave" | "phase";
  commitPolicy?: string;
  status?: string;
  validationStatus?: string;
  validationCommands?: string[];
  reviewStatus?: string;
  reviewRequired?: boolean;
  closeoutStatus?: string;
  commitStatus?: string;
  commitSha?: string;
  pushStatus?: string;
  note?: string;
}): Record<string, JsonValue> {
  const resolution = resolveWaveTarget(options.target);
  const statePath = statePathFor(resolution);
  const repoRoot = resolution.repoRoot;
  const existing = loadJsonFile(statePath);
  const state = localizeStatePaths(
    (existing as Record<string, JsonValue> | null) ?? {
      schemaVersion: 1,
      phases: {},
      createdAt: utcNow(),
    },
    repoRoot,
  ) as Record<string, JsonValue>;

  state.updatedAt = utcNow();
  state.waveSlug = resolution.waveSlug;
  state.waveDir = repoRelativePath(resolution.waveDir, repoRoot);
  state.target = repoRelativePath(resolution.target, repoRoot);
  state.coordinate = resolution.coordinate as unknown as JsonValue;
  state.mode = options.mode ?? resolution.mode;
  state.commitPolicy = options.commitPolicy ?? String(state.commitPolicy ?? "commit-required");
  state.nextPhasePath = repoRelativePath(resolution.phasePath, repoRoot);
  const activePhasePath = options.phase ?? resolution.phasePath;
  state.activePhasePath = repoRelativePath(activePhasePath, repoRoot);

  const phases = ensureRecord(state, "phases");
  const key = phaseKey(activePhasePath);
  const phaseState = ensureRecord(phases, key);
  phaseState.phasePath = repoRelativePath(activePhasePath, repoRoot);
  if (options.status) {
    phaseState.status = options.status;
  }
  if (options.note) {
    const notes = ensureArray(phaseState, "notes");
    notes.push({ at: utcNow(), text: options.note });
  }
  if (options.validationStatus || (options.validationCommands && options.validationCommands.length > 0)) {
    const validation = ensureRecord(phaseState, "validation");
    if (options.validationStatus) {
      validation.status = options.validationStatus;
    }
    if (options.validationCommands && options.validationCommands.length > 0) {
      validation.commands = options.validationCommands;
    }
  }
  if (options.reviewStatus || options.reviewRequired !== undefined) {
    const review = ensureRecord(phaseState, "review");
    if (options.reviewStatus) {
      review.status = options.reviewStatus;
    }
    if (options.reviewRequired !== undefined) {
      review.required = options.reviewRequired;
    }
  }
  if (options.closeoutStatus) {
    ensureRecord(phaseState, "closeout").status = options.closeoutStatus;
  }
  if (options.commitStatus || options.commitSha) {
    const commit = ensureRecord(phaseState, "commit");
    if (options.commitStatus) {
      commit.status = options.commitStatus;
    }
    if (options.commitSha) {
      commit.sha = options.commitSha;
    }
  }
  if (options.pushStatus) {
    ensureRecord(phaseState, "push").status = options.pushStatus;
  }

  const localized = localizeStatePaths(state, repoRoot);
  mkdirSync(path.dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(localized, null, 2)}\n`, "utf8");
  return { statePath, state: localized };
}

export function buildScopeReport(target: string, explicitChanged?: string[]): Record<string, JsonValue> {
  const resolution = resolveWaveTarget(target);
  if (!resolution.phasePath) {
    throw new OperationError("No phase path resolved for scope guard.");
  }
  const repoRoot = resolution.repoRoot;
  const phase = parseWorkPhase(resolution.phasePath);
  const phaseRelative = normalizePath(path.relative(repoRoot, resolution.phasePath));
  const allowed = phase.declaredPaths;
  const files = explicitChanged && explicitChanged.length > 0 ? explicitChanged : changedFilesForWork(repoRoot);
  const outOfScope: string[] = [];
  const allowedDerived: Array<{ path: string; reason: string }> = [];

  for (const file of files) {
    if (isAllowedScopePath(file, allowed, resolution.waveSlug, phaseRelative)) {
      continue;
    }
    const reason = managedStateReason(file, resolution.waveSlug) ?? derivedReason(file, files);
    if (reason) {
      allowedDerived.push({ path: file, reason });
      continue;
    }
    outOfScope.push(file);
  }

  return {
    phasePath: resolution.phasePath,
    declaredPaths: allowed,
    changedFiles: files,
    allowedDerived: allowedDerived as unknown as JsonValue,
    outOfScope,
    status: outOfScope.length === 0 ? "passed" : "warning",
  };
}

export function buildPhaseGateReport(
  target: string,
  commitPolicy?: string,
): Record<string, JsonValue> {
  const resolution = resolveWaveTarget(target);
  if (!resolution.phasePath) {
    throw new OperationError("No phase path resolved for phase gate.");
  }
  const phase = parseWorkPhase(resolution.phasePath);
  const state = (loadJsonFile(statePathFor(resolution)) as Record<string, JsonValue> | null) ?? {};
  const phases = valueAsRecord(state.phases);
  const phaseState = valueAsRecord(phases[phaseKey(resolution.phasePath)]);
  const policy = commitPolicy ?? String(state.commitPolicy ?? "commit-required");
  const blockers: string[] = [];

  if (phase.uncheckedTasks.length > 0) {
    blockers.push(`${phase.uncheckedTasks.length} unchecked task(s) remain in the phase doc`);
  }
  const validation = valueAsRecord(phaseState.validation);
  if (validation.status !== "passed") {
    blockers.push("validation has not been recorded as passed");
  }
  const files = changedFilesForWork(resolution.repoRoot);
  const review = valueAsRecord(phaseState.review);
  const reviewRequired = Boolean(review.required) || hasCodeChanges(files);
  if (reviewRequired && review.status !== "passed" && review.status !== "waived") {
    blockers.push("code review is required and has not passed or been waived");
  }
  const closeout = valueAsRecord(phaseState.closeout);
  if (closeout.status !== "passed") {
    blockers.push("closeout-phase has not been recorded as passed");
  }
  const commit = valueAsRecord(phaseState.commit);
  if (policy === "commit-required" && !(commit.status === "passed" && typeof commit.sha === "string" && commit.sha.length > 0)) {
    blockers.push("phase commit is required but no committed SHA is recorded");
  }
  if (policy === "commit-and-push") {
    if (!(commit.status === "passed" && typeof commit.sha === "string" && commit.sha.length > 0)) {
      blockers.push("phase commit is required but no committed SHA is recorded");
    }
    const push = valueAsRecord(phaseState.push);
    if (push.status !== "passed") {
      blockers.push("phase push is required but is not recorded as passed");
    }
  }

  return {
    phasePath: resolution.phasePath,
    commitPolicy: policy,
    status: blockers.length === 0 ? "passed" : "blocked",
    blockers,
    state: phaseState,
  };
}

export function buildCloseoutProbe(options: {
  repoRoot: string;
  scope: "auto" | "staged" | "unstaged" | "full";
}): Record<string, JsonValue> {
  const repoRoot = path.resolve(options.repoRoot);
  const filesByPath = changedFilesForCloseout(repoRoot, options.scope);
  const files = [...filesByPath.keys()].sort().map((filePath) => filesByPath.get(filePath)!);
  let selectedScope: string = options.scope;
  if (options.scope === "auto") {
    selectedScope = files.some((file) => file.staged) ? "staged" : "full";
  }

  return {
    repoRoot,
    scope: selectedScope,
    statusShort: safeRunGit(repoRoot, ["status", "--short"]).split(/\r?\n/).filter(Boolean),
    files: files as unknown as JsonValue,
    contracts: discoverContracts(repoRoot) as unknown as JsonValue,
    coordinates: extractCoordinates(files.map((file) => file.path)) as unknown as JsonValue,
    historyCandidates: discoverHistoryCandidates(
      repoRoot,
      extractCoordinates(files.map((file) => file.path)),
    ),
    riskRegister: nextRiskIds(repoRoot) as unknown as JsonValue,
    validationHints: validationHints(files, repoRoot),
  };
}

function runCloseoutValidate(options: {
  repoRoot: string;
  probeJson: string;
  run: boolean;
}): Record<string, JsonValue> {
  const probe = readJsonFile(options.probeJson);
  const commands = commandsFromProbe(probe);
  const output: Record<string, JsonValue> = {
    repoRoot: options.repoRoot,
    commands,
    ran: options.run,
  };
  if (options.run) {
    output.results = commands.map((command) => runShellCommand(options.repoRoot, command)) as unknown as JsonValue;
  }
  return output;
}

function runCloseoutHistory(options: {
  repoRoot: string;
  mode: "commit" | "phase";
  probeJson?: string;
  phaseJson?: string;
  title?: string;
  date: string;
  outputDir: string;
  write: boolean;
}): Record<string, JsonValue> {
  const probe = options.probeJson ? readJsonFile(options.probeJson) : {};
  const phase = options.phaseJson ? readJsonFile(options.phaseJson) : {};
  const title = options.title ?? defaultHistoryTitle(options.mode, probe, phase);
  const contents = renderHistory(options.mode, title, options.date, probe, phase);
  const outputPath = path.join(
    options.repoRoot,
    options.outputDir,
    historyFilename(options.mode, options.date, title, probe, phase),
  );
  const result: Record<string, JsonValue> = {
    path: outputPath,
    wrote: false,
    contents,
  };
  if (options.write) {
    mkdirSync(path.dirname(outputPath), { recursive: true });
    if (existsSync(outputPath)) {
      result.contents = readText(outputPath);
    } else {
      writeFileSync(outputPath, contents, "utf8");
      result.wrote = true;
    }
  }
  return result;
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

function parseOperationOptions(argv: string[]): OperationOptions {
  const positionals: string[] = [];
  const values: Record<string, string> = {};
  const arrays: Record<string, string[]> = {};
  const booleans = new Set<string>();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const key = arg.slice(2);
    if (
      [
        "json",
        "run",
        "print-only",
        "write",
        "review-required",
        "no-review-required",
      ].includes(key)
    ) {
      booleans.add(key);
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      throw new OperationError(`\`${arg}\` requires a value.`);
    }
    index += 1;
    if (["validation-command", "changed"].includes(key)) {
      arrays[key] = [...(arrays[key] ?? []), next];
    } else {
      values[key] = next;
    }
  }

  return { positionals, values, arrays, booleans };
}

function printOperationsHelp(): void {
  process.stdout.write(
    [
      "Usage: make-docs operations <operation> [options]",
      "",
      "Operations:",
      "  closeout-probe",
      "  closeout-validate",
      "  closeout-history",
      "  work-phase-state",
      "  wave-resolve",
      "  wave-status",
      "  phase-plan",
      "  checkpoint",
      "  scope-guard",
      "  phase-gate",
      "",
    ].join("\n"),
  );
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function requiredPositionals(options: OperationOptions, operation: string): string[] {
  if (options.positionals.length === 0) {
    throw new OperationError(`\`${operation}\` requires a target argument.`);
  }
  return options.positionals;
}

function requiredValue(options: OperationOptions, key: string, operation: string): string {
  const value = options.values[key];
  if (!value) {
    throw new OperationError(`\`${operation}\` requires --${key}.`);
  }
  return value;
}

function booleanOption(options: OperationOptions, key: string): boolean | undefined {
  if (options.booleans.has(key)) {
    return true;
  }
  if (options.booleans.has(`no-${key}`)) {
    return false;
  }
  return undefined;
}

function parseScope(value: string): "auto" | "staged" | "unstaged" | "full" {
  if (value === "auto" || value === "staged" || value === "unstaged" || value === "full") {
    return value;
  }
  throw new OperationError("`--scope` must be auto, staged, unstaged, or full.");
}

function parseCloseoutMode(value: string): "commit" | "phase" {
  if (value === "commit" || value === "phase") {
    return value;
  }
  throw new OperationError("`--mode` must be commit or phase.");
}

function parseOptionalMode(value?: string): "wave" | "phase" | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "wave" || value === "phase") {
    return value;
  }
  throw new OperationError("`--mode` must be wave or phase.");
}

function resolveCliPath(value: string): string {
  return path.resolve(value);
}

function findRepoRoot(start?: string): string {
  let current = path.resolve(start ?? process.cwd());
  while (true) {
    if (existsSync(path.join(current, "docs", "work")) || existsSync(path.join(current, ".git"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(start ?? process.cwd());
    }
    current = parent;
  }
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

function statePathFor(resolution: WaveResolution): string {
  return path.join(resolution.repoRoot, ".make-docs", "runs", resolution.waveSlug, "state.json");
}

function loadJsonFile(filePath: string): JsonValue | null {
  if (!existsSync(filePath)) {
    return null;
  }
  return JSON.parse(readText(filePath)) as JsonValue;
}

function readJsonFile(filePath: string): Record<string, JsonValue> {
  const value = JSON.parse(readText(path.resolve(filePath))) as JsonValue;
  return valueAsRecord(value);
}

function readText(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

function utcNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

function repoRelativePath(value: string | null | undefined, repoRoot: string): string | null {
  if (!value) {
    return value ?? null;
  }
  if (!path.isAbsolute(value)) {
    return normalizePath(value);
  }
  const relative = path.relative(repoRoot, value);
  return relative.startsWith("..") ? normalizePath(value) : normalizePath(relative || ".");
}

function localizeStatePaths(value: JsonValue, repoRoot: string): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => localizeStatePaths(item, repoRoot));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, localizeStatePaths(item, repoRoot)]),
    );
  }
  if (typeof value !== "string") {
    return value;
  }
  const root = normalizePath(path.resolve(repoRoot));
  const normalized = normalizePath(value);
  if (normalized === root) {
    return ".";
  }
  return normalized.replace(`${root}/`, "");
}

function phaseKey(value: string | null | undefined): string {
  if (!value) {
    return "wave";
  }
  return path.basename(value);
}

function ensureRecord(parent: Record<string, JsonValue>, key: string): Record<string, JsonValue> {
  const current = parent[key];
  if (current && typeof current === "object" && !Array.isArray(current)) {
    return current as Record<string, JsonValue>;
  }
  const created: Record<string, JsonValue> = {};
  parent[key] = created;
  return created;
}

function ensureArray(parent: Record<string, JsonValue>, key: string): JsonValue[] {
  const current = parent[key];
  if (Array.isArray(current)) {
    return current;
  }
  const created: JsonValue[] = [];
  parent[key] = created;
  return created;
}

function valueAsRecord(value: unknown): Record<string, JsonValue> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, JsonValue>;
  }
  return {};
}

function isAllowedScopePath(
  filePath: string,
  allowed: string[],
  waveSlug: string,
  phasePath: string,
): boolean {
  const normalized = filePath.replace(/^\/+|\/+$/g, "");
  if (normalized === phasePath || normalized.startsWith(`docs/work/${waveSlug}/`)) {
    return true;
  }
  if (normalized.startsWith("docs/assets/archive/history/") || normalized.startsWith("docs/assets/library/")) {
    return true;
  }
  for (const item of allowed) {
    let clean = item.replace(/^\/+|\/+$/g, "");
    if (clean.startsWith("./")) {
      clean = clean.slice(2);
    }
    if (!clean) {
      continue;
    }
    if (normalized === clean || normalized.startsWith(`${clean.replace(/\/+$/g, "")}/`)) {
      return true;
    }
  }
  return false;
}

function changedFilesForWork(repoRoot: string): string[] {
  const output = runGit(repoRoot, ["status", "--porcelain"]);
  return [...new Set(output.split(/\r?\n/).filter(Boolean).map((line) => {
    const raw = line.slice(3);
    return raw.includes(" -> ") ? raw.split(" -> ", 2)[1]! : raw;
  }))].sort();
}

function derivedReason(filePath: string, files: string[]): string | null {
  const manifests = LOCKFILE_MANIFESTS[path.basename(filePath)];
  if (!manifests) {
    return null;
  }
  const normalizedFiles = new Set(files.map((file) => file.replace(/^\/+|\/+$/g, "")));
  const parent = normalizePath(path.dirname(filePath));
  for (const manifest of manifests) {
    const candidate = parent === "." ? manifest : `${parent}/${manifest}`;
    if (normalizedFiles.has(candidate)) {
      return `${path.basename(filePath)} is derived from changed dependency manifest ${candidate}`;
    }
  }
  return null;
}

function managedStateReason(filePath: string, waveSlug: string): string | null {
  const normalized = filePath.replace(/^\/+|\/+$/g, "");
  const expectedPrefix = `.make-docs/runs/${waveSlug}/`;
  if (normalized.startsWith(expectedPrefix) && normalized.endsWith("/state.json")) {
    return "managed work-on-wave checkpoint state";
  }
  return null;
}

function hasCodeChanges(files: string[]): boolean {
  const codeSuffixes = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".mjs",
    ".cjs",
    ".py",
    ".rs",
    ".go",
    ".java",
    ".rb",
    ".sh",
    ".swift",
    ".kt",
    ".cs",
    ".php",
  ]);
  return files.some((file) => codeSuffixes.has(path.extname(file)));
}

interface CloseoutFile {
  path: string;
  gitStatus: string;
  staged: boolean;
  unstaged: boolean;
  category?: string;
}

function changedFilesForCloseout(
  repoRoot: string,
  scope: "auto" | "staged" | "unstaged" | "full",
): Map<string, CloseoutFile> {
  const status = parseStatusShort(safeRunGit(repoRoot, ["status", "--short"]));
  const staged = parseNameStatus(safeRunGit(repoRoot, ["diff", "--cached", "--name-status"]), true);
  const unstaged = parseNameStatus(safeRunGit(repoRoot, ["diff", "--name-status"]), false);
  for (const entry of status) {
    if (entry.index === "?" && entry.workingTree === "?") {
      unstaged.set(entry.path, {
        path: entry.path,
        gitStatus: "??",
        staged: false,
        unstaged: true,
      });
    }
  }
  let selectedScope: typeof scope = scope;
  if (scope === "auto") {
    selectedScope = staged.size > 0 ? "staged" : "full";
  }
  const merged = new Map<string, CloseoutFile>();
  if (selectedScope === "staged" || selectedScope === "full") {
    for (const [filePath, file] of staged) {
      merged.set(filePath, { ...file });
    }
  }
  if (selectedScope === "unstaged" || selectedScope === "full") {
    for (const [filePath, file] of unstaged) {
      const existing = merged.get(filePath);
      if (existing) {
        existing.unstaged = true;
        existing.gitStatus = `${existing.gitStatus}+${file.gitStatus}`;
      } else {
        merged.set(filePath, { ...file });
      }
    }
  }
  for (const file of merged.values()) {
    file.category = classifyPath(file.path);
  }
  return merged;
}

function parseNameStatus(output: string, staged: boolean): Map<string, CloseoutFile> {
  const files = new Map<string, CloseoutFile>();
  for (const line of output.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }
    const parts = line.split("\t");
    const status = parts[0] ?? "";
    const filePath = parts[parts.length - 1] ?? "";
    files.set(filePath, {
      path: filePath,
      gitStatus: status,
      staged,
      unstaged: !staged,
    });
  }
  return files;
}

function parseStatusShort(output: string): Array<{ path: string; index: string; workingTree: string }> {
  const entries: Array<{ path: string; index: string; workingTree: string }> = [];
  for (const line of output.split(/\r?\n/)) {
    if (!line) {
      continue;
    }
    if (line.startsWith("?? ")) {
      entries.push({ path: line.slice(3), index: "?", workingTree: "?" });
      continue;
    }
    if (line.length >= 4) {
      entries.push({ path: line.slice(3), index: line[0] ?? "", workingTree: line[1] ?? "" });
    }
  }
  return entries;
}

function classifyPath(filePath: string): string {
  if (/\.(test|spec)\.ts$/.test(filePath) || filePath.endsWith("_test.py") || filePath.endsWith("test_validate_output.py")) {
    return "tests";
  }
  if (filePath.startsWith("packages/cli/src/") || filePath.startsWith("packages/cli/bin/")) {
    return "code";
  }
  if (filePath.startsWith("packages/cli/tests/")) {
    return "tests";
  }
  if (filePath.startsWith("packages/skills/") || filePath.startsWith(".agents/skills/") || filePath.startsWith(".claude/skills/")) {
    return "skill";
  }
  if (filePath.startsWith("docs/") || filePath.startsWith("packages/docs/template/docs/")) {
    return "docs";
  }
  if (/\.(json|ya?ml|toml)$/.test(filePath)) {
    return "config";
  }
  if (/\.(ts|tsx|js|py|rs|sh)$/.test(filePath)) {
    return "code";
  }
  return "other";
}

function discoverContracts(repoRoot: string): Record<string, JsonValue> {
  const candidates: Record<string, string[]> = {
    rootAgentInstructions: ["AGENTS.md", "CLAUDE.md"],
    historyDir: ["docs/assets/archive/history"],
    riskRegister: ["docs/prd/03-open-questions-and-risk-register.md"],
    commitConvention: [
      ".make-docs/contracts/system/commit-message-convention.md",
      "docs/assets/references/commit-message-convention.md",
    ],
    templateCommitConvention: [
      "packages/docs/template/.make-docs/contracts/system/commit-message-convention.md",
      "packages/docs/template/docs/assets/references/commit-message-convention.md",
    ],
    guideContract: [".make-docs/contracts/system/guide-contract.md"],
    developerGuides: ["docs/assets/library/developer"],
    userGuides: ["docs/assets/library/user"],
  };
  return Object.fromEntries(
    Object.entries(candidates).map(([name, paths]) => {
      const existing = paths.filter((candidate) => existsSync(path.join(repoRoot, candidate)));
      return [name, { exists: existing.length > 0, paths: existing }];
    }),
  ) as Record<string, JsonValue>;
}

function extractCoordinates(paths: string[]): Array<Record<string, JsonValue>> {
  const seen = new Set<string>();
  const coordinates: Array<Record<string, JsonValue>> = [];
  for (const filePath of paths) {
    const wr = COORDINATE_RE.exec(filePath);
    const phase = filePath.startsWith("docs/work/") ? /^([0-9]{2}|[1-9]\d)-/.exec(path.basename(filePath)) : null;
    const task = TASK_ID_RE.exec(filePath);
    const coordinate = {
      w: wr ? Number(wr[1]) : null,
      r: wr ? Number(wr[2]) : null,
      p: phase ? Number(phase[1]) : null,
      t: task ? Number(task[1]) : null,
      source: filePath,
    };
    if (Object.values(coordinate).some((value) => value !== null && value !== filePath)) {
      const key = JSON.stringify(coordinate);
      if (!seen.has(key)) {
        seen.add(key);
        coordinates.push(coordinate as unknown as Record<string, JsonValue>);
      }
    }
  }
  return coordinates;
}

function discoverHistoryCandidates(
  repoRoot: string,
  coordinates: Array<Record<string, JsonValue>>,
): string[] {
  const historyDir = path.join(repoRoot, "docs", "assets", "archive", "history");
  if (!existsSync(historyDir) || !statSync(historyDir).isDirectory()) {
    return [];
  }
  const terms = new Set<string>();
  for (const coordinate of coordinates) {
    if (typeof coordinate.w === "number" && typeof coordinate.r === "number") {
      terms.add(`w${coordinate.w}-r${coordinate.r}`);
      terms.add(`W${coordinate.w} R${coordinate.r}`);
    }
  }
  const candidates: string[] = [];
  for (const entry of readdirSync(historyDir).sort()) {
    if (!entry.endsWith(".md")) {
      continue;
    }
    const filePath = path.join(historyDir, entry);
    const rel = normalizePath(path.relative(repoRoot, filePath));
    const text = safeRead(filePath).toLowerCase();
    if (terms.size === 0 || [...terms].some((term) => `${rel}\n${text}`.toLowerCase().includes(term.toLowerCase()))) {
      candidates.push(rel);
    }
  }
  return candidates.slice(0, 20);
}

function nextRiskIds(repoRoot: string): Record<string, JsonValue> {
  const riskPath = path.join(repoRoot, "docs", "prd", "03-open-questions-and-risk-register.md");
  if (!existsSync(riskPath)) {
    return { exists: false, path: null, next: {} };
  }
  const highest: Record<string, number> = { D: 0, Q: 0, R: 0 };
  const text = readText(riskPath);
  for (const match of text.matchAll(RISK_HEADING_RE)) {
    const prefix = match[1] ?? "";
    highest[prefix] = Math.max(highest[prefix] ?? 0, Number(match[2]));
  }
  return {
    exists: true,
    path: "docs/prd/03-open-questions-and-risk-register.md",
    next: {
      D: `D-${String(highest.D + 1).padStart(3, "0")}`,
      Q: `Q-${String(highest.Q + 1).padStart(3, "0")}`,
      R: `R-${String(highest.R + 1).padStart(3, "0")}`,
    },
  };
}

function validationHints(files: CloseoutFile[], repoRoot: string): string[] {
  const paths = files.map((file) => file.path);
  const categories = new Set(files.map((file) => file.category));
  const commands: string[] = [];
  if (paths.some((filePath) => filePath.startsWith("packages/skills/decompose-codebase/scripts/"))) {
    commands.push("python3 -B packages/skills/decompose-codebase/scripts/test_validate_output.py");
  }
  if (paths.some((filePath) => filePath.startsWith("packages/skills/closeout-commit/scripts/"))) {
    commands.push("python3 -B packages/skills/closeout-commit/scripts/test_closeout_helpers.py");
  }
  if (paths.some((filePath) => filePath.startsWith("packages/skills/closeout-phase/scripts/"))) {
    commands.push("python3 -B packages/skills/closeout-phase/scripts/test_closeout_helpers.py");
  }
  if ((categories.has("code") || categories.has("tests") || categories.has("skill") || categories.has("config")) && isMakeDocsNodeWorkspace(repoRoot, paths)) {
    commands.push("npm test -w packages/cli -- consistency install skill-catalog skill-registry");
  }
  if (paths.some((filePath) => filePath.startsWith("packages/cli/src/") || filePath.startsWith("packages/cli/tests/"))) {
    commands.push("npm run build -w packages/cli");
  }
  if (paths.some((filePath) => filePath.startsWith("docs/") || filePath.startsWith("packages/docs/template/docs/"))) {
    commands.push("scripts/check-instruction-routers.sh");
  }
  commands.push("git diff --check");
  return [...new Set(commands)];
}

function isMakeDocsNodeWorkspace(repoRoot: string, paths: string[]): boolean {
  const packageJson = path.join(repoRoot, "package.json");
  if (!existsSync(packageJson)) {
    return paths.some((filePath) => filePath.startsWith("packages/cli/") || filePath.startsWith("packages/skills/"));
  }
  const text = safeRead(packageJson);
  return text.includes("make-docs") || paths.some((filePath) =>
    filePath.startsWith("packages/cli/") ||
    filePath.startsWith("packages/skills/") ||
    filePath === "package.json" ||
    filePath === "package-lock.json",
  );
}

function commandsFromProbe(probe: Record<string, JsonValue>): string[] {
  const hints = Array.isArray(probe.validationHints) ? probe.validationHints : [];
  const commands: string[] = [];
  for (const hint of hints) {
    if (typeof hint === "string" && !commands.includes(hint)) {
      commands.push(hint);
    }
  }
  if (!commands.includes("git diff --check")) {
    commands.push("git diff --check");
  }
  return commands;
}

function runShellCommand(repoRoot: string, command: string): Record<string, JsonValue> {
  const result = spawnSync(command, {
    cwd: repoRoot,
    shell: true,
    encoding: "utf8",
  });
  return {
    command,
    returncode: result.status ?? 1,
    stdout: (result.stdout ?? "").slice(-4000),
    stderr: (result.stderr ?? "").slice(-4000),
  };
}

function defaultHistoryTitle(
  mode: "commit" | "phase",
  probe: Record<string, JsonValue>,
  phase: Record<string, JsonValue>,
): string {
  if (typeof phase.title === "string" && phase.title.length > 0) {
    return `${phase.title} Closeout`;
  }
  const files = Array.isArray(probe.files) ? probe.files : [];
  const first = files[0] as { path?: string } | undefined;
  if (first?.path) {
    return `${path.basename(first.path, path.extname(first.path)).replace(/-/g, " ")} Closeout`;
  }
  return mode === "phase" ? "Phase Closeout" : "Closeout";
}

function historyFilename(
  mode: "commit" | "phase",
  date: string,
  title: string,
  probe: Record<string, JsonValue>,
  phase: Record<string, JsonValue>,
): string {
  const titleSlug = slugify(title);
  if (mode === "phase") {
    const coord = coordinateSlug(probe, phase);
    if (coord) {
      return `${date}-${coord}-${titleSlug}.md`;
    }
  }
  return `${date}-${titleSlug}.md`;
}

function renderHistory(
  mode: "commit" | "phase",
  title: string,
  date: string,
  probe: Record<string, JsonValue>,
  phase: Record<string, JsonValue>,
): string {
  const coordinate = coordinateLabel(probe, phase);
  const files = Array.isArray(probe.files) ? probe.files : [];
  const validations = commandsFromProbe(probe);
  const fileLines = files.length > 0
    ? files.map((file) => `- \`${String((file as { path?: string }).path ?? "")}\``)
    : ["- No changed files were reported by the probe."];
  const phaseTasks = Array.isArray(phase.tasks) ? phase.tasks : [];
  const taskLines = phaseTasks.length > 0
    ? phaseTasks.map((task) => {
      const typedTask = task as { id?: string; checked?: boolean; text?: string };
      return `- \`${typedTask.id ?? "task"}\` ${typedTask.checked ? "checked" : "unchecked"}: ${typedTask.text ?? ""}`;
    })
    : ["- No phase task data was available from the probe."];

  const sections = [
    "---",
    `date: ${date}`,
    `coordinate: ${coordinate}`,
    `closeout: ${mode}`,
    "---",
    "",
    `# ${title}`,
    "",
    "## Purpose",
    "",
    "Document the closeout decisions for the current change set before drafting the commit message.",
    "",
    "## Changes",
    "",
    ...fileLines,
    "",
  ];
  if (mode === "phase") {
    sections.push("## Task Status", "", ...taskLines, "");
  }
  sections.push(
    "## Gap Decisions",
    "",
    "No novel gaps were found.",
    "",
    "## Guide Decisions",
    "",
    "No new developer guide was needed. No new user guide was needed.",
    "",
    "## Validation",
    "",
    ...validations.map((command) => `- \`${command}\``),
    "",
    "## Commit Message Source",
    "",
    "Use the repository commit-message convention and this history entry as the source for the draft.",
    "",
    "## Links",
    "",
    "- Add relevant PRD, plan, work, guide, or archive links before finalizing closeout.",
    "",
  );
  return sections.join("\n");
}

function coordinateLabel(
  probe: Record<string, JsonValue>,
  phase: Record<string, JsonValue>,
): string {
  const phaseCoordinate = valueAsRecord(phase.coordinate);
  if (typeof phaseCoordinate.w === "number" && typeof phaseCoordinate.r === "number") {
    return [
      `W${phaseCoordinate.w}`,
      `R${phaseCoordinate.r}`,
      typeof phaseCoordinate.p === "number" ? `P${phaseCoordinate.p}` : null,
    ].filter(Boolean).join(" ");
  }
  const coordinates = Array.isArray(probe.coordinates) ? probe.coordinates : [];
  for (const rawCoordinate of coordinates) {
    const coordinate = valueAsRecord(rawCoordinate);
    if (typeof coordinate.w === "number" && typeof coordinate.r === "number") {
      return [
        `W${coordinate.w}`,
        `R${coordinate.r}`,
        typeof coordinate.p === "number" ? `P${coordinate.p}` : null,
      ].filter(Boolean).join(" ");
    }
  }
  return "Uncoordinated";
}

function coordinateSlug(
  probe: Record<string, JsonValue>,
  phase: Record<string, JsonValue>,
): string | null {
  const phaseCoordinate = valueAsRecord(phase.coordinate);
  if (typeof phaseCoordinate.w === "number" && typeof phaseCoordinate.r === "number") {
    return [
      `w${phaseCoordinate.w}`,
      `r${phaseCoordinate.r}`,
      typeof phaseCoordinate.p === "number" ? `p${phaseCoordinate.p}` : null,
    ].filter(Boolean).join("-");
  }
  const coordinates = Array.isArray(probe.coordinates) ? probe.coordinates : [];
  for (const rawCoordinate of coordinates) {
    const coordinate = valueAsRecord(rawCoordinate);
    if (typeof coordinate.w === "number" && typeof coordinate.r === "number") {
      return [
        `w${coordinate.w}`,
        `r${coordinate.r}`,
        typeof coordinate.p === "number" ? `p${coordinate.p}` : null,
      ].filter(Boolean).join("-");
    }
  }
  return null;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(SLUG_RE, "-").replace(/^-+|-+$/g, "") || "closeout";
}

function safeRunGit(repoRoot: string, args: string[]): string {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout : "";
}

function runGit(repoRoot: string, args: string[]): string {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new OperationError(result.stderr.trim() || result.stdout.trim() || "git command failed");
  }
  return result.stdout;
}

function safeRead(filePath: string): string {
  try {
    return readText(filePath);
  } catch {
    return "";
  }
}

function normalizePath(value: string): string {
  return value.split(path.sep).join("/");
}
