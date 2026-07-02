import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  normalizePath,
  readJsonFile,
  readText,
  safeRunGit,
  valueAsRecord,
} from "../shared";
import type {
  JsonValue,
  OperationResult,
} from "../types";

const COORDINATE_RE = /w(\d+)-r(\d+)/i;
const TASK_ID_RE = /\bt([1-9]\d*)\b/i;
const RISK_HEADING_RE = /^###\s+([DQR])-(\d{3})\b/gm;
const SLUG_RE = /[^a-z0-9]+/g;

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

export function runCloseoutValidate(options: {
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

export function runCloseoutHistory(options: {
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

export function probeCloseout(input: {
  repoRoot: string;
  scope: "auto" | "staged" | "unstaged" | "full";
}): OperationResult<Record<string, JsonValue>> {
  return {
    value: buildCloseoutProbe(input),
    provenance: {
      domain: "closeout",
      operation: "closeout-probe",
      source: "shared",
      target: input.repoRoot,
    },
  };
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

function safeRead(filePath: string): string {
  try {
    return readText(filePath);
  } catch {
    return "";
  }
}
