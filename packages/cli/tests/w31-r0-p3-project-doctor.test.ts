import { spawnSync } from "node:child_process";
import { cpSync, existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callMakeDocsMcpTool, listMakeDocsMcpTools } from "../src/mcp/tools";
import { createExecutionContext, OperationWriteDeniedError } from "../src/operations/context";
import { getOperation, invokeOperation, operationCliCommand } from "../src/operations/registry";
import { checkProjectDoctor, fixProjectDoctor, shellQuote, type DoctorCheckResult, type DoctorFixResult } from "../src/operations/project/doctor";
import { applyTaskIdCase, scanTaskIdCase } from "../src/operations/project/doctor/task-id-case";
import { runProjectCommand } from "../src/run/root-operations";
import { getInstallationCheckoutId, readInstallationStatus } from "../src/store/installation-state";
import { HARNESS_CALLER_IDENTITY_ENV } from "../src/harness-access/contract";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../..");
const FIXTURE = path.join(HERE, "fixtures/project-doctor");
const REFERENCE = "packages/docs/template/.make-docs/system/references/project-doctor.md";
const SAMPLE = "docs/work/2026-01-01-w1-r0-sample";
const EXCLUDED = "docs/work/2026-01-02-w2-r0-excluded";

/**
 * Some platforms cannot create links, such as Windows without symbolic link
 * rights. A test that needs a link then skips and says why, instead of failing.
 */
function linkSupport(kind: "symbolic" | "hard"): string | null {
  const probe = mkdtempSync(path.join(os.tmpdir(), "w31-p3-link-probe-"));
  try {
    if (kind === "symbolic") {
      mkdirSync(path.join(probe, "folder"));
      symlinkSync(path.join(probe, "folder"), path.join(probe, "link"));
    } else {
      writeFileSync(path.join(probe, "file"), "x");
      linkSync(path.join(probe, "file"), path.join(probe, "link"));
    }
    return null;
  } catch (error) {
    return `this platform cannot create ${kind} links (${(error as NodeJS.ErrnoException).code ?? String(error)})`;
  } finally {
    rmSync(probe, { recursive: true, force: true });
  }
}
const SYMLINK_SKIP = linkSupport("symbolic");
const HARD_LINK_SKIP = linkSupport("hard");
const GIT_SKIP = spawnSync("git", ["--version"]).status === 0 ? null : "git is not available on this machine";
type TestBody = () => unknown;
const skipWith = (reason: string | null) => reason
  ? (title: string, body: TestBody) => it.skip(`${title} [skipped: ${reason}]`, body)
  : (title: string, body: TestBody) => it(title, body);
const itWithSymlinks = skipWith(SYMLINK_SKIP);
const itWithHardLinks = skipWith(HARD_LINK_SKIP);
const itWithGit = skipWith(GIT_SKIP);

let temp: string;
let root: string;
let store: string;

function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else out[path.relative(dir, absolute).split(path.sep).join("/")] = readFileSync(absolute).toString("base64");
    }
  };
  walk(dir);
  return out;
}

function read(relative: string): string {
  return readFileSync(path.join(root, relative), "utf8");
}

function registerProject(): void {
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), "projectId: 4c1b7f0e-0d7d-4c55-9b55-31c3c5c1f0aa\n");
  getInstallationCheckoutId(root, store);
}

async function captureStdout(run: () => Promise<void>): Promise<string> {
  const chunks: string[] = [];
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => { chunks.push(String(chunk)); return true; });
  try { await run(); } finally { spy.mockRestore(); }
  return chunks.join("");
}

function context(writesAllowed = false) {
  return createExecutionContext({ writesAllowed, storeRoot: store, cwd: root });
}

beforeEach(() => {
  temp = mkdtempSync(path.join(os.tmpdir(), "w31-p3-doctor-"));
  root = path.join(temp, "project");
  store = path.join(temp, "store");
  cpSync(path.join(FIXTURE, "project"), root, { recursive: true });
  writeFileSync(path.join(root, SAMPLE, "02-crlf.md"), "# CRLF file\r\n- [ ] t1: Windows line endings.\r\nDone t1.\r\n");
  vi.stubEnv("MAKE_DOCS_HOME", store);
  vi.stubEnv(HARNESS_CALLER_IDENTITY_ENV, "");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  process.exitCode = 0;
  rmSync(temp, { recursive: true, force: true });
});

describe("W31 R0 P3 task-id-case agent twin parity (A11, A12)", () => {
  it("gives the same answer as every shared example in the agent twin reference", () => {
    const body = readFileSync(path.join(REPO, REFERENCE), "utf8");
    const section = body.slice(body.indexOf("## Shared Examples"));
    const block = /```text\n([\s\S]*?)```/.exec(section)![1]!.split("\n").filter(Boolean);
    expect(block.length % 2).toBe(0);
    expect(block.length).toBeGreaterThanOrEqual(20);
    for (let index = 0; index < block.length; index += 2) {
      const before = /^before: (.*)$/.exec(block[index]!)![1]!;
      const after = /^after:  (.*)$/.exec(block[index + 1]!)![1]!;
      const scan = scanTaskIdCase(`${before}\n`);
      expect(applyTaskIdCase(`${before}\n`, scan.matches), before).toBe(`${after}\n`);
      expect(scan.matches.every((match) => match.replacement === `T${match.current.slice(1)}`)).toBe(true);
    }
  });

  it("keeps the template, the dogfood copy, the bundled copy, and both catalogs in agreement", () => {
    const template = readFileSync(path.join(REPO, REFERENCE));
    expect(readFileSync(path.join(REPO, ".make-docs/system/references/project-doctor.md")).equals(template)).toBe(true);
    const bundled = path.join(REPO, "packages/cli/template/.make-docs/system/references/project-doctor.md");
    if (existsSync(bundled)) expect(readFileSync(bundled).equals(template)).toBe(true);
    const catalogs = ["packages/docs/template/.make-docs/system-resources.catalog.json", ".make-docs/system-resources.catalog.json"]
      .map((file) => JSON.parse(readFileSync(path.join(REPO, file), "utf8")) as { mcpResources: Array<{ uri: string; profiles: string[] }> });
    for (const catalog of catalogs) {
      expect(catalog.mcpResources.find((entry) => entry.uri === "make-docs://system/reference/project-doctor.md")).toEqual({
        uri: "make-docs://system/reference/project-doctor.md",
        profiles: ["setup", "quality"],
      });
    }
    const text = template.toString("utf8");
    expect(text).toContain("agent twin of the deterministic doctor operations");
    expect(text).toContain("A change to either form needs a review of the other.");
  });
});

describe("W31 R0 P3 project doctor check (A7, A9, A10, A11)", () => {
  it("finds every lower-case task line and prose reference and skips archives, history, code, and link targets", () => {
    const before = snapshot(root);
    const result = checkProjectDoctor(root);
    expect(snapshot(root)).toEqual(before);
    expect(existsSync(store)).toBe(false);
    expect(result.status).toBe("findings");
    expect(result.summary.startsWith("Found ")).toBe(true);
    expect(result.summary.endsWith("Nothing changed.")).toBe(true);
    const phase = result.findings.filter((finding) => finding.file === `${SAMPLE}/01-phase.md`);
    const expected = readFileSync(path.join(FIXTURE, "expected", SAMPLE, "01-phase.md"), "utf8");
    expect(applyTaskIdCase(read(`${SAMPLE}/01-phase.md`), scanTaskIdCase(read(`${SAMPLE}/01-phase.md`)).matches)).toBe(expected);
    expect(phase.filter((finding) => finding.kind === "task-line").map((finding) => finding.line)).toEqual([13, 14, 16]);
    expect(phase.map((finding) => finding.fixedLineText)).toEqual(phase.map((finding) => expected.split("\n")[finding.line - 1]));
    for (const finding of result.findings) {
      expect(finding.current).toMatch(/^t[1-9]\d*$/);
      expect(finding.replacement).toBe(`T${finding.current.slice(1)}`);
      expect(finding.lineText.slice(finding.column - 1, finding.column - 1 + finding.current.length)).toBe(finding.current);
    }
    expect(result.skipped).toEqual([{ path: `${SAMPLE}/03-history.md`, reason: "history-record" }]);
    expect(result.findings.some((finding) => finding.file.startsWith("docs/prd/"))).toBe(false);
    expect(result.findings.some((finding) => finding.file.endsWith(".txt"))).toBe(false);
    expect(result.findings.filter((finding) => finding.file === `${SAMPLE}/05-unclosed-fence.md`).map((finding) => finding.line)).toEqual([1]);
    expect(result.findings.filter((finding) => finding.file === `${SAMPLE}/02-crlf.md`).map((finding) => [finding.line, finding.column, finding.lineText])).toEqual([
      [2, 7, "- [ ] t1: Windows line endings."],
      [3, 6, "Done t1."],
    ]);
    expect(result.files.map((file) => file.path)).toEqual([
      `${SAMPLE}/01-phase.md`, `${SAMPLE}/02-crlf.md`, `${SAMPLE}/03-history.md`, `${SAMPLE}/04-clean.md`, `${SAMPLE}/05-unclosed-fence.md`, `${EXCLUDED}/00-index.md`,
    ]);
    expect(result.totals).toMatchObject({ filesRead: 6, filesSkipped: 1, filesExcluded: 0, filesWithFindings: 4, findings: result.findings.length });
    expect(result.notes.join(" ")).toContain("can be something that is not a task ID");
    expect(result.checks.map((check) => check.id)).toEqual(["task-id-case", "phase-status-line", "phase-open-under-completed-index"]);
    expect(result.nextAction).toContain(`make-docs project doctor fix --review ${result.reviewDigest}`);
    expect(checkProjectDoctor(root).reviewDigest).toBe(result.reviewDigest);
  });

  it("returns no findings and says so in plain words for a clean project (A10)", async () => {
    const clean = path.join(temp, "clean");
    mkdirSync(path.join(clean, "docs/work/2026-01-01-w1-r0-clean"), { recursive: true });
    writeFileSync(path.join(clean, "docs/work/2026-01-01-w1-r0-clean/01-phase.md"), "- [ ] T1: Upper case.\n");
    const result = checkProjectDoctor(clean);
    expect(result).toMatchObject({ status: "clean", findings: [], summary: "No problems found in 1 file. Nothing changed.", nextAction: "No fix is needed." });
    const text = await captureStdout(() => runProjectCommand(["doctor", "check", "--target-root", clean]));
    expect(text.split("\n")[0]).toBe("Project doctor: No problems found in 1 file. Nothing changed.");
    expect(process.exitCode).toBe(0);
  });

  it("gives matching CLI and MCP results and writes nothing (A7)", async () => {
    const before = snapshot(root);
    const cli = JSON.parse(await captureStdout(() => runProjectCommand(["doctor", "check", "--target-root", root, "--json"]))) as DoctorCheckResult;
    expect(process.exitCode).toBe(1);
    const mcp = (await callMakeDocsMcpTool("project_doctor_check", { targetRoot: root }, { profile: "quality" })).result as DoctorCheckResult;
    expect(cli).toEqual(mcp);
    expect((await callMakeDocsMcpTool("project_doctor_check", { targetRoot: root }, { profile: "setup" })).result).toEqual(mcp);
    expect((await callMakeDocsMcpTool("project_doctor_check", { targetRoot: root }, { profile: "all" })).result).toEqual(mcp);
    expect(cli).toEqual(checkProjectDoctor(root));
    expect(snapshot(root)).toEqual(before);
    expect(existsSync(store)).toBe(false);
  });

  it("puts totals first in the human output, then each finding with file, line, current text, and replacement", async () => {
    const text = await captureStdout(() => runProjectCommand(["doctor", "check", "--target-root", root]));
    const lines = text.split("\n");
    expect(lines[0]).toMatch(/^Project doctor: Found \d+ lower-case task IDs on \d+ lines in 4 files: \d+ task lines and \d+ prose references\. Nothing changed\.$/);
    expect(text).toContain(`\n${SAMPLE}/01-phase.md\n  line 13: t1 -> T1 (task line)\n    now:   - [ ] t1: Write the parser.\n    fixed: - [ ] T1: Write the parser.\n`);
    expect(text).toContain("Skipped: docs/work/2026-01-01-w1-r0-sample/03-history.md (history record)");
    expect(text).toContain("Note: A prose finding is a lower-case t and a number");
    expect(text.indexOf("Project doctor:")).toBeLessThan(text.indexOf(`${SAMPLE}/01-phase.md`));
    expect(text).toMatch(/Review digest: [a-f0-9]{64}\nNext: Review each finding\. Then run: make-docs project doctor fix --review /);
  });
});

describe("W31 R0 P3 exclusions (A9)", () => {
  it("leaves excluded files unread and binds the exclusion in the digest", () => {
    const all = checkProjectDoctor(root);
    const excluded = checkProjectDoctor(root, [`${EXCLUDED}/`]);
    expect(excluded.exclusions).toEqual([EXCLUDED]);
    expect(excluded.files.some((file) => file.path.startsWith(EXCLUDED))).toBe(false);
    expect(excluded.findings.some((finding) => finding.file.startsWith(EXCLUDED))).toBe(false);
    expect(excluded.totals.filesExcluded).toBe(1);
    expect(excluded.reviewDigest).not.toBe(all.reviewDigest);
    expect(checkProjectDoctor(root, [`./${EXCLUDED}`, EXCLUDED]).reviewDigest).toBe(excluded.reviewDigest);
    expect(excluded.nextAction).toContain(`--exclude ${EXCLUDED}`);
    expect(checkProjectDoctor(root, [`${SAMPLE}/01-phase.md`]).files.some((file) => file.path === `${SAMPLE}/01-phase.md`)).toBe(false);
  });

  it.each([
    ["../outside", "must not use .. to leave a folder."],
    ["docs/../docs/work", "must not use .. to leave a folder."],
    ["/etc", "must be relative to the project folder."],
    ["~/docs", "must be relative to the project folder."],
    ["docs\\work", "must use forward slashes."],
    ["docs/work/missing-folder", "does not exist in the project."],
    ["docs//work", "has an empty or . part."],
    ["", "is empty"],
  ])("fails closed for %j", (value, message) => {
    expect(() => checkProjectDoctor(root, [value])).toThrow(message);
  });

  itWithSymlinks("fails closed for an exclusion that passes through a symbolic link", () => {
    symlinkSync(path.join(root, EXCLUDED), path.join(root, "docs/work/linked"));
    expect(() => checkProjectDoctor(root, ["docs/work/linked"])).toThrow("passes through a symbolic link.");
    // A link to a folder under docs/work stops the run and names the link.
    expect(() => checkProjectDoctor(root)).toThrow("docs/work/linked is a symbolic link to a folder. The doctor does not follow links. Nothing was read or changed.");
  });

  it("keeps every excluded file unchanged after the fix (A9)", async () => {
    registerProject();
    const check = checkProjectDoctor(root, [EXCLUDED]);
    const before = readFileSync(path.join(root, EXCLUDED, "00-index.md"));
    const fixed = fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, exclusions: [EXCLUDED], storeRoot: store });
    expect(fixed.status).toBe("fixed");
    expect(fixed.exclusions).toEqual([EXCLUDED]);
    expect(readFileSync(path.join(root, EXCLUDED, "00-index.md")).equals(before)).toBe(true);
    expect(checkProjectDoctor(root, [EXCLUDED]).status).toBe("clean");
    expect(checkProjectDoctor(root).findings.map((finding) => finding.file)).toEqual([`${EXCLUDED}/00-index.md`]);
  });
});

describe("W31 R0 P3 project doctor fix (A8)", () => {
  it("writes only the reviewed changes, keeps a backup, and reports the undo path", () => {
    registerProject();
    const check = checkProjectDoctor(root);
    const before = snapshot(root);
    const result = fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, storeRoot: store });
    expect(result.status).toBe("fixed");
    expect(result.summary).toBe(`Changed ${check.totals.findings} task IDs on ${check.totals.lines} lines in 4 files. No other text changed.`);
    expect(result.changedFiles.map((file) => file.path)).toEqual([
      `${SAMPLE}/01-phase.md`, `${SAMPLE}/02-crlf.md`, `${SAMPLE}/05-unclosed-fence.md`, `${EXCLUDED}/00-index.md`,
    ].sort());
    for (const relative of ["01-phase.md", "05-unclosed-fence.md"]) {
      expect(read(`${SAMPLE}/${relative}`)).toBe(readFileSync(path.join(FIXTURE, "expected", SAMPLE, relative), "utf8"));
    }
    expect(read(`${SAMPLE}/02-crlf.md`)).toBe("# CRLF file\r\n- [ ] T1: Windows line endings.\r\nDone T1.\r\n");
    const after = snapshot(root);
    const changed = Object.keys(after).filter((file) => after[file] !== before[file]);
    const created = changed.filter((file) => !(file in before));
    expect(changed.filter((file) => file in before).sort()).toEqual(result.changedFiles.map((file) => file.path).sort());
    expect(created.every((file) => file.startsWith(".make-docs/backup/operations/"))).toBe(true);
    for (const file of result.changedFiles) {
      expect(file.backup).toMatch(/^\.make-docs\/backup\/operations\/[0-9a-f-]{36}\/\d+-before$/);
      expect(readFileSync(path.join(root, file.backup!)).toString("base64")).toBe(before[file.path]);
    }
    expect(result.undo).toMatchObject({ method: "backup", command: null });
    expect(result.undo.instructions).toContain("copy each backup file back");
    expect(readInstallationStatus(root, store)).not.toMatchObject({ status: "recovery-required" });
    expect(checkProjectDoctor(root).status).toBe("clean");
  });

  itWithGit("names git only for tracked files, quotes names for the shell, and names the backup for untracked files (review fix 8)", async () => {
    registerProject();
    const spaced = `${SAMPLE}/it's spaced.md`;
    writeFileSync(path.join(root, spaced), "- [ ] t1: A file name with a space and a quote.\n");
    const git = (...args: string[]) => spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
    expect(git("init", "-q").status).toBe(0);
    expect(git("add", "--", `${SAMPLE}/01-phase.md`, spaced).status).toBe(0);
    const check = checkProjectDoctor(root, [EXCLUDED]);
    const result = fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, exclusions: [EXCLUDED], storeRoot: store });
    expect(result.undo.method).toBe("git");
    expect(result.undo.command).toBe(`git -C '${result.targetRoot}' restore -- '${SAMPLE}/01-phase.md' '${SAMPLE}/it'\\''s spaced.md'`);
    expect(result.undo.notTrackedByGit).toEqual([`${SAMPLE}/02-crlf.md`, `${SAMPLE}/05-unclosed-fence.md`]);
    expect(result.undo.instructions).toContain("also drops any earlier uncommitted edit");
    expect(result.undo.instructions).toContain("Git does not track 2 changed files");
    // The quoted command really restores the tracked files in a shell, run from
    // another git folder that has the same relative path (re-check finding 1).
    if (process.platform !== "win32") {
      const other = path.join(temp, "other-repo");
      mkdirSync(path.join(other, SAMPLE), { recursive: true });
      writeFileSync(path.join(other, SAMPLE, "01-phase.md"), "Other repository text.\n");
      expect(spawnSync("git", ["-C", other, "init", "-q"]).status).toBe(0);
      expect(spawnSync("git", ["-C", other, "add", "--", `${SAMPLE}/01-phase.md`]).status).toBe(0);
      writeFileSync(path.join(other, SAMPLE, "01-phase.md"), "Other repository text, edited.\n");
      expect(spawnSync("sh", ["-c", result.undo.command!], { cwd: other }).status).toBe(0);
      expect(readFileSync(path.join(other, SAMPLE, "01-phase.md"), "utf8")).toBe("Other repository text, edited.\n");
      expect(read(spaced)).toBe("- [ ] t1: A file name with a space and a quote.\n");
      expect(read(`${SAMPLE}/01-phase.md`)).toBe(readFileSync(path.join(FIXTURE, "project", SAMPLE, "01-phase.md"), "utf8"));
    }
    const text = await captureStdout(async () => { process.stdout.write((await import("../src/run/root-operations")).renderDoctorFix(result)); });
    expect(text).toContain(`Not tracked by git, undo from backup: ${SAMPLE}/02-crlf.md`);
  });

  itWithGit("names the backup, not git, when git tracks none of the changed files (review fix 8)", () => {
    registerProject();
    expect(spawnSync("git", ["-C", root, "init", "-q"]).status).toBe(0);
    const check = checkProjectDoctor(root, [EXCLUDED]);
    const result = fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, exclusions: [EXCLUDED], storeRoot: store });
    expect(result.undo).toMatchObject({ method: "backup", command: null });
    expect(result.undo.instructions).toBe("Git does not track these files. To undo the fix, copy each backup file back over its changed file.");
    expect(shellQuote("a b'c")).toBe("'a b'\\''c'");
    expect(shellQuote("docs/work/x.md")).toBe("docs/work/x.md");
    expect(result.nextAction).toBe(`Run make-docs project doctor check --exclude ${EXCLUDED} --target-root ${shellQuote(result.targetRoot)} to confirm that it finds nothing.`);
  });

  it("refuses a file that changed after the check, names it, and changes nothing", () => {
    registerProject();
    const check = checkProjectDoctor(root);
    writeFileSync(path.join(root, SAMPLE, "04-clean.md"), "- [ ] T1: Edited after the check.\n");
    const before = snapshot(root);
    expect(() => fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, reviewedFiles: check.files, storeRoot: store }))
      .toThrow(`These files changed after the check: ${SAMPLE}/04-clean.md. Nothing changed.`);
    expect(() => fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, storeRoot: store }))
      .toThrow("The review digest does not match the project now.");
    expect(snapshot(root)).toEqual(before);
    expect(readInstallationStatus(root, store)).not.toMatchObject({ status: "recovery-required" });
  });

  it("names a new file and a removed file as changed after the check", () => {
    registerProject();
    const check = checkProjectDoctor(root);
    writeFileSync(path.join(root, SAMPLE, "06-new.md"), "New.\n");
    rmSync(path.join(root, SAMPLE, "04-clean.md"));
    expect(() => fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, reviewedFiles: check.files, storeRoot: store }))
      .toThrow(`These files changed after the check: ${SAMPLE}/04-clean.md, ${SAMPLE}/06-new.md.`);
  });

  it("refuses a digest made with other exclusions", () => {
    registerProject();
    const check = checkProjectDoctor(root, [EXCLUDED]);
    const before = snapshot(root);
    expect(() => fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, storeRoot: store })).toThrow("the --exclude options are not the same");
    expect(snapshot(root)).toEqual(before);
  });

  it("needs the project write permission on every surface", async () => {
    registerProject();
    const check = checkProjectDoctor(root);
    const before = snapshot(root);
    await expect(invokeOperation("project.doctor.fix", { targetRoot: root, review: check.reviewDigest }, context(false))).rejects.toBeInstanceOf(OperationWriteDeniedError);
    await expect(callMakeDocsMcpTool("project_doctor_fix", { targetRoot: root, review: check.reviewDigest }, { profile: "quality" })).rejects.toBeInstanceOf(OperationWriteDeniedError);
    expect(snapshot(root)).toEqual(before);
    const dry = (await invokeOperation("project.doctor.fix", { targetRoot: root, review: check.reviewDigest }, createExecutionContext({ writesAllowed: true, dryRun: true, storeRoot: store, cwd: root }))).value as unknown as DoctorFixResult;
    expect(dry).toMatchObject({ status: "unchanged", operationId: null });
    expect(snapshot(root)).toEqual(before);
    const fixed = (await invokeOperation("project.doctor.fix", { targetRoot: root, review: check.reviewDigest }, context(true))).value as unknown as DoctorFixResult;
    expect(fixed.status).toBe("fixed");
  });

  it("gives the same fix result from the CLI and the shared core, refuses MCP without a Store grant, and names a changed file from --check-json", async () => {
    registerProject();
    const twin = path.join(temp, "twin");
    cpSync(root, twin, { recursive: true });
    const check = checkProjectDoctor(root);
    const cli = JSON.parse(await captureStdout(() => runProjectCommand(["doctor", "fix", "--review", check.reviewDigest, "--target-root", root, "--json"]))) as DoctorFixResult;
    expect(cli.status).toBe("fixed");
    expect(checkProjectDoctor(root).status).toBe("clean");
    // A second run of the same review is refused: the files changed.
    const saved = path.join(temp, "check.json");
    writeFileSync(saved, JSON.stringify(check));
    await expect(runProjectCommand(["doctor", "fix", "--review", check.reviewDigest, "--check-json", saved, "--target-root", root]))
      .rejects.toThrow(`These files changed after the check: ${SAMPLE}/01-phase.md`);
    const strip = (value: DoctorFixResult) => ({ ...value, targetRoot: "", operationId: value.operationId ? "id" : null,
      changedFiles: value.changedFiles.map((file) => ({ ...file, backup: file.backup ? "backup" : null })),
      nextAction: value.nextAction.replace(value.targetRoot, "") });
    // The twin folder needs its own checkout row to use the same write path.
    writeFileSync(path.join(twin, ".make-docs/config.yaml"), "projectId: 7d4e2a10-5b1c-4f0e-8a3d-2b9c6e1f4a77\n");
    getInstallationCheckoutId(twin, store);
    const twinCheck = checkProjectDoctor(twin);
    expect(twinCheck.reviewDigest).toBe(check.reviewDigest);
    // Without a harness Store grant, MCP returns the typed Store access refusal and changes nothing.
    const twinBefore = snapshot(twin);
    await expect(callMakeDocsMcpTool("project_doctor_fix", { targetRoot: twin, review: check.reviewDigest, allowWrite: true }, { profile: "setup" }))
      .rejects.toMatchObject({ code: "store-not-configured" });
    expect(snapshot(twin)).toEqual(twinBefore);
    // The MCP tool and the CLI call one registry handler; the core result matches the CLI result.
    const core = (await invokeOperation("project.doctor.fix", { targetRoot: twin, review: check.reviewDigest }, createExecutionContext({ writesAllowed: true, storeRoot: store, cwd: twin }))).value as unknown as DoctorFixResult;
    expect(strip(core)).toEqual(strip(cli));
  });

  it("refuses a project with no Make Docs project ID before any write", () => {
    const check = checkProjectDoctor(root);
    const before = snapshot(root);
    expect(() => fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, storeRoot: store })).toThrow("no Make Docs project ID");
    expect(snapshot(root)).toEqual(before);
  });

  it("returns unchanged for a clean project with its digest", () => {
    const clean = path.join(temp, "clean");
    mkdirSync(path.join(clean, "docs/work"), { recursive: true });
    const check = checkProjectDoctor(clean);
    expect(fixProjectDoctor({ projectRoot: clean, review: check.reviewDigest, storeRoot: store })).toMatchObject({ status: "unchanged", changedFiles: [], summary: "No problems to fix. Nothing changed." });
    expect(lstatSync(clean).isDirectory()).toBe(true);
  });
});

describe("W31 R0 P3 registry and MCP admission", () => {
  it("admits both operations under make-docs project doctor with the PRD 39 projections", () => {
    expect(operationCliCommand("project.doctor.check")).toBe("make-docs project doctor check [--exclude <path>] [--target-root <path>] [--json]");
    expect(operationCliCommand("project.doctor.fix")).toBe("make-docs project doctor fix --review <digest> [--exclude <path>] [--check-json <file>] [--dry-run] [--target-root <path>] [--json]");
    expect(getOperation("project.doctor.check")).toMatchObject({ mutates: "read", access: { store: "none", project: "read", hostConfig: "none" } });
    expect(getOperation("project.doctor.fix")).toMatchObject({ mutates: "write", access: { store: "write", project: "write", hostConfig: "none" } });
  });

  it("lists the MCP tools in the quality, setup, and all profiles only", () => {
    for (const profile of ["quality", "setup", "all"] as const) {
      const names = listMakeDocsMcpTools(root, { profile }).map((tool) => tool.name);
      expect(names).toEqual(expect.arrayContaining(["project_doctor_check", "project_doctor_fix"]));
    }
    for (const profile of ["core", "workflow", "backlog"] as const) {
      const names = listMakeDocsMcpTools(root, { profile }).map((tool) => tool.name);
      expect(names).not.toContain("project_doctor_check");
      expect(names).not.toContain("project_doctor_fix");
    }
  });
});

describe("W31 R0 P3 reviewer findings", () => {
  it("fails closed for an --exclude path in the wrong letter case, so nothing in that folder changes (fix 1)", async () => {
    registerProject();
    const wrong = "Docs/Work/2026-01-02-W2-R0-EXCLUDED";
    const caseBlind = existsSync(path.join(root, wrong));
    expect(() => checkProjectDoctor(root, [wrong])).toThrow(caseBlind ? "does not match the exact letter case" : "does not exist in the project");
    expect(() => checkProjectDoctor(root, [`${SAMPLE}/01-PHASE.md`])).toThrow(caseBlind ? "does not match the exact letter case" : "does not exist in the project");
    const before = snapshot(root);
    const check = checkProjectDoctor(root, [EXCLUDED]);
    expect(() => fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, exclusions: [wrong], storeRoot: store })).toThrow(/letter case|does not exist/);
    await expect(runProjectCommand(["doctor", "check", "--exclude", wrong, "--target-root", root])).rejects.toThrow(/letter case|does not exist/);
    expect(snapshot(root)).toEqual(before);
  });

  itWithSymlinks("stops when docs is a symbolic link, before any read outside the project or any pending operation (fix 2)", () => {
    registerProject();
    const outside = path.join(temp, "outside");
    renameSync(path.join(root, "docs"), path.join(outside));
    symlinkSync(outside, path.join(root, "docs"));
    const outsideBefore = snapshot(outside);
    expect(() => checkProjectDoctor(root)).toThrow("docs is a symbolic link. The doctor does not follow links.");
    expect(() => fixProjectDoctor({ projectRoot: root, review: "0".repeat(64), storeRoot: store })).toThrow("docs is a symbolic link.");
    expect(snapshot(outside)).toEqual(outsideBefore);
    expect(readInstallationStatus(root, store)).not.toMatchObject({ status: "recovery-required" });
    expect((readInstallationStatus(root, store) as { pendingOperation?: unknown }).pendingOperation ?? null).toBeNull();
  });

  itWithSymlinks("stops when docs/work or a folder that the check walks into is reached through a link (fix 2)", () => {
    const outside = path.join(temp, "outside-work");
    renameSync(path.join(root, "docs/work"), outside);
    symlinkSync(outside, path.join(root, "docs/work"));
    expect(() => checkProjectDoctor(root)).toThrow("docs/work is a symbolic link.");
  });

  itWithHardLinks("skips a hard-linked file with a stated reason, and the fix never writes through it (fix 3)", async () => {
    registerProject();
    const outsideFile = path.join(temp, "outside.md");
    writeFileSync(outsideFile, "- [ ] t1: Outside the project.\n");
    const linked = `${SAMPLE}/08-hard-link.md`;
    linkSync(outsideFile, path.join(root, linked));
    const check = checkProjectDoctor(root);
    expect(check.skipped).toContainEqual({ path: linked, reason: "hard-link" });
    expect(check.files.some((file) => file.path === linked)).toBe(false);
    expect(check.findings.some((finding) => finding.file === linked)).toBe(false);
    const text = await captureStdout(() => runProjectCommand(["doctor", "check", "--target-root", root]));
    expect(text).toContain(`Skipped: ${linked} (hard link, shares its bytes with another path)`);
    fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, storeRoot: store });
    expect(readFileSync(outsideFile, "utf8")).toBe("- [ ] t1: Outside the project.\n");
  });

  itWithHardLinks("refuses the fix when a reviewed file becomes hard-linked after the check (fix 3)", () => {
    registerProject();
    const check = checkProjectDoctor(root);
    const outsideLink = path.join(temp, "outside-link.md");
    linkSync(path.join(root, SAMPLE, "01-phase.md"), outsideLink);
    const before = readFileSync(outsideLink);
    expect(() => fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, storeRoot: store })).toThrow("The fix stopped.");
    expect(readFileSync(outsideLink).equals(before)).toBe(true);
    expect(readInstallationStatus(root, store)).not.toMatchObject({ status: "recovery-required" });
  });

  it("names --check-json for CLI callers and reviewedFiles for MCP callers in a stale-review refusal (fix 4)", async () => {
    registerProject();
    const check = checkProjectDoctor(root);
    writeFileSync(path.join(root, SAMPLE, "04-clean.md"), "Edited.\n");
    const handler = getOperation("project.doctor.fix").handler!;
    const call = (surface: "cli" | "mcp") => handler({ targetRoot: root, review: check.reviewDigest }, { ...context(true), surface });
    expect(() => call("mcp")).toThrow("pass the check result's files list as reviewedFiles.");
    expect(() => call("cli")).toThrow("pass the saved check result with --check-json.");
    const help = await captureStdout(() => runProjectCommand(["doctor", "--help"]));
    expect(help).toContain("[--check-json <file>] [--dry-run]");
    const description = listMakeDocsMcpTools(root, { profile: "quality" }).find((tool) => tool.name === "project_doctor_fix")!;
    expect(Object.keys(description.inputSchema)).toEqual(expect.arrayContaining(["review", "exclude", "reviewedFiles", "allowWrite", "dryRun"]));
  });

  it("ignores a leading byte order mark: a BOM history record is skipped and a BOM task line is a task line (fix 5)", () => {
    const bom = "\uFEFF";
    const task = scanTaskIdCase(`${bom}- [ ] t1: BOM task line.\nDone t1.\n`);
    expect(task.matches.map((match) => [match.kind, match.line, match.column])).toEqual([["task-line", 1, 7], ["prose-reference", 2, 6]]);
    expect(applyTaskIdCase(`${bom}- [ ] t1: BOM task line.\nDone t1.\n`, task.matches)).toBe(`${bom}- [ ] T1: BOM task line.\nDone T1.\n`);
    expect(scanTaskIdCase(`${bom}---\nkind: history\n---\n- [ ] t1: Frozen.\n`)).toEqual({ skipped: "history-record", matches: [], skippedText: [] });
    // Front matter must start on line 1.
    expect(scanTaskIdCase(`\n---\nkind: history\n---\n- [ ] t1: Not a history record.\n`).skipped).toBeNull();
    writeFileSync(path.join(root, SAMPLE, "06-bom-history.md"), `${bom}---\nkind: "history"\n---\n- [x] t1: Frozen.\n`);
    expect(checkProjectDoctor(root).skipped).toContainEqual({ path: `${SAMPLE}/06-bom-history.md`, reason: "history-record" });
  });

  it("finds lower-case parts of mixed-case lists, finds strikethrough, and reports HTML tag text as left unchanged (fix 6)", async () => {
    const line = (text: string) => applyTaskIdCase(text, scanTaskIdCase(text).matches);
    expect(line("T1-t3, T1–t10, T1/t2, T1—t4, A41-t5, and t1/T2/t3.")).toBe("T1-T3, T1–T10, T1/T2, T1—T4, A41-T5, and T1/T2/T3.");
    expect(line("Paths a/T3/t4 and x-T1-t2 stay.")).toBe("Paths a/T3/t4 and x-T1-t2 stay.");
    expect(line("Struck ~~t3~~ here.")).toBe("Struck ~~T3~~ here.");
    expect(line("Bold <b>t3</b> and `code`t4 edge.")).toBe("Bold <b>T3</b> and `code`T4 edge.");
    const html = scanTaskIdCase(`<a id="t3" title='t4'></a> and <span data-x="t5">t6</span>.\n`);
    expect(html.matches.map((match) => match.current)).toEqual(["t6"]);
    expect(html.skippedText).toEqual([
      { line: 1, column: 8, current: "t3", reason: "html-tag" },
      { line: 1, column: 19, current: "t4", reason: "html-tag" },
      { line: 1, column: 46, current: "t5", reason: "html-tag" },
    ]);
    const check = checkProjectDoctor(root);
    expect(check.skippedText).toEqual([{ file: `${SAMPLE}/01-phase.md`, line: 54, column: 8, current: "t3", reason: "html-tag" }]);
    expect(check.totals.textSkipped).toBe(1);
    const text = await captureStdout(() => runProjectCommand(["doctor", "check", "--target-root", root]));
    expect(text).toContain(`Left unchanged: ${SAMPLE}/01-phase.md:54:8 t3 (inside an HTML tag)`);
  });

  it("states the twin rules exactly as the code applies them (fix 7)", () => {
    const body = readFileSync(path.join(REPO, REFERENCE), "utf8");
    expect(body).toContain("a left curly quote: `“` (U+201C) or `‘` (U+2018)");
    expect(body).toContain("a right curly quote: `”` (U+201D) or `’` (U+2019)");
    expect(body).toContain("Stop with an error, and change nothing, when `docs` or `docs/work` is a symbolic link, or when any folder under `docs/work/` holds a symbolic link to a folder. Name the linked folder.");
    expect(body).toContain("front matter starts on line 1");
    expect(body).toContain("Skip a hard-linked file");
    expect(body).toContain("same upper and lower case");
    expect(body).toContain("`reviewedFiles`");
    expect(body).toContain("[--check-json <file>] [--dry-run]");
    const fixture = readFileSync(path.join(FIXTURE, "project", SAMPLE, "01-phase.md"), "utf8");
    for (const sample of ["Mixed: T1-t3, T1–t10, T1/t2, and A41-t5.", "Struck ~~t3~~", "<a id=\"t3\"></a> Anchor for t4."]) {
      expect(body).toContain(sample);
      expect(fixture).toContain(sample);
    }
  });

  it("skips managed router files under docs/work with a stated reason and never changes them (owner decision 2)", async () => {
    registerProject();
    const routers = ["docs/work/AGENTS.md", "docs/work/CLAUDE.md", `${SAMPLE}/AGENTS.md`];
    for (const router of routers) writeFileSync(path.join(root, router), "<!-- make-docs:begin -->\n- [ ] t1: Router text with a bare t2.\n<!-- make-docs:end -->\n");
    const before = Object.fromEntries(routers.map((router) => [router, readFileSync(path.join(root, router))]));
    const check = checkProjectDoctor(root);
    for (const router of routers) expect(check.skipped).toContainEqual({ path: router, reason: "managed-router" });
    expect(check.files.some((file) => routers.includes(file.path))).toBe(false);
    expect(check.findings.some((finding) => routers.includes(finding.file))).toBe(false);
    const text = await captureStdout(() => runProjectCommand(["doctor", "check", "--target-root", root]));
    expect(text).toContain("Skipped: docs/work/AGENTS.md (managed router; fixed upstream by reseed)");
    fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, storeRoot: store });
    for (const router of routers) expect(readFileSync(path.join(root, router)).equals(before[router]!)).toBe(true);
    const body = readFileSync(path.join(REPO, REFERENCE), "utf8");
    expect(body).toContain("Skip each managed router file: a file named `AGENTS.md` or `CLAUDE.md` in any letter case, such as `agents.md`, at any depth under `docs/work/`.");
    expect(body).toContain("\"managed router; fixed upstream by reseed\"");
    expect(body).toContain("A Windows junction counts as a link.");
  });

});

describe("W31 R0 P3 re-check findings", () => {
  itWithSymlinks("stops with an error naming a linked folder nested under docs/work, before any operation opens (re-check 2)", () => {
    registerProject();
    const outside = path.join(temp, "outside-nested");
    mkdirSync(outside);
    writeFileSync(path.join(outside, "01.md"), "- [ ] t1: Outside.\n");
    mkdirSync(path.join(root, SAMPLE, "deeper"));
    symlinkSync(outside, path.join(root, SAMPLE, "deeper/linked"));
    const message = `${SAMPLE}/deeper/linked is a symbolic link to a folder. The doctor does not follow links. Nothing was read or changed.`;
    expect(() => checkProjectDoctor(root)).toThrow(message);
    expect(() => fixProjectDoctor({ projectRoot: root, review: "0".repeat(64), storeRoot: store })).toThrow(message);
    expect(readFileSync(path.join(outside, "01.md"), "utf8")).toBe("- [ ] t1: Outside.\n");
    expect((readInstallationStatus(root, store) as { pendingOperation?: unknown }).pendingOperation ?? null).toBeNull();
    // A linked Markdown file is still only skipped.
    rmSync(path.join(root, SAMPLE, "deeper/linked"));
    symlinkSync(path.join(outside, "01.md"), path.join(root, SAMPLE, "deeper/linked.md"));
    expect(checkProjectDoctor(root).skipped).toContainEqual({ path: `${SAMPLE}/deeper/linked.md`, reason: "symbolic-link" });
  });

  it("skips router files in any letter case (re-check 3)", () => {
    for (const name of ["agents.md", "Claude.MD"]) writeFileSync(path.join(root, SAMPLE, name), "- [ ] t1: Router.\n");
    const check = checkProjectDoctor(root);
    expect(check.skipped).toContainEqual({ path: `${SAMPLE}/Claude.MD`, reason: "managed-router" });
    expect(check.skipped).toContainEqual({ path: `${SAMPLE}/agents.md`, reason: "managed-router" });
    expect(readFileSync(path.join(REPO, REFERENCE), "utf8")).toContain("in any letter case, such as `agents.md`");
  });

  it("carries an HTML tag that runs over more than one line, and a blank line or fence ends it (re-check 4)", () => {
    const text = "<a\n  id=\"t3\" title='t4'>t5</a> and t6.\n<div\n\nt7 after a blank line.\n<span\n```\ncode\n```\nt8 after a fence.\n";
    const scan = scanTaskIdCase(text);
    expect(scan.skippedText.map((skip) => [skip.line, skip.current])).toEqual([[2, "t3"], [2, "t4"]]);
    expect(scan.matches.map((match) => [match.line, match.current])).toEqual([[2, "t5"], [2, "t6"], [5, "t7"], [10, "t8"]]);
    expect(applyTaskIdCase(text, scan.matches)).toBe("<a\n  id=\"t3\" title='t4'>T5</a> and T6.\n<div\n\nT7 after a blank line.\n<span\n```\ncode\n```\nT8 after a fence.\n");
    expect(readFileSync(path.join(REPO, REFERENCE), "utf8")).toContain("A tag can run over more than one line");
  });

  it("names glued text next to a skipped part as a known risk in the notes and the twin (re-check 5)", () => {
    const line = (text: string) => applyTaskIdCase(text, scanTaskIdCase(text).matches);
    expect(line("word<span>t3</span>word, `code`t4, and <https://example.com>t5.")).toBe("word<span>T3</span>word, `code`T4, and <https://example.com>T5.");
    const check = checkProjectDoctor(root);
    expect(check.notes.join(" ")).toContain("text glued to such a part is found");
    const body = readFileSync(path.join(REPO, REFERENCE), "utf8");
    expect(body).toContain("so text glued to inline code, a link target, a URL, or an HTML tag is found.");
    expect(body).toContain("before: Glued word<span>t3</span>word and <https://example.com>t4.");
  });

  it("matches an exclusion with accents in either Unicode form and still fails closed on a real mismatch (re-check 6)", () => {
    const decomposed = "Cafe\u0301-notes";
    const composed = "Caf\u00e9-notes";
    mkdirSync(path.join(root, "docs/work", decomposed));
    writeFileSync(path.join(root, "docs/work", decomposed, "01.md"), "- [ ] t1: Accent folder.\n");
    const onDisk = readdirSync(path.join(root, "docs/work")).find((name) => name.normalize("NFC") === composed)!;
    for (const typed of [decomposed, composed]) {
      const check = checkProjectDoctor(root, [`docs/work/${typed}`]);
      expect(check.exclusions).toEqual([`docs/work/${onDisk}`]);
      expect(check.files.some((file) => file.path.includes("notes/01.md"))).toBe(false);
    }
    expect(() => checkProjectDoctor(root, ["docs/work/Cafe-notes"])).toThrow("Check the spelling, the letter case, and any accents.");
    expect(readFileSync(path.join(REPO, REFERENCE), "utf8")).toContain("Compare names in Unicode NFC form");
  });

  it("refuses a dry-run fix of an unregistered project the same way as a real fix (re-check 7)", () => {
    const check = checkProjectDoctor(root);
    const refusal = (dryRun: boolean) => {
      try { fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, storeRoot: store, dryRun }); } catch (error) { return (error as Error).message; }
      return "no refusal";
    };
    expect(refusal(true)).toContain("no Make Docs project ID");
    expect(refusal(true)).toBe(refusal(false));
    // With a project ID but no Store checkout, both refuse with the same message.
    mkdirSync(path.join(root, ".make-docs"), { recursive: true });
    writeFileSync(path.join(root, ".make-docs/config.yaml"), "projectId: 9a0b1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d\n");
    expect(refusal(true)).not.toBe("no refusal");
    expect(refusal(true)).toBe(refusal(false));
    expect(existsSync(path.join(root, ".make-docs/backup"))).toBe(false);
  });

  itWithGit("asks git, so a project inside a larger git folder still gets the git undo path (re-check 7)", () => {
    registerProject();
    expect(spawnSync("git", ["-C", temp, "init", "-q"]).status).toBe(0);
    expect(spawnSync("git", ["-C", temp, "add", "--", `project/${SAMPLE}/01-phase.md`]).status).toBe(0);
    expect(existsSync(path.join(root, ".git"))).toBe(false);
    const check = checkProjectDoctor(root, [EXCLUDED]);
    const result = fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, exclusions: [EXCLUDED], storeRoot: store });
    expect(result.undo.method).toBe("git");
    expect(result.undo.command).toBe(`git -C '${result.targetRoot}' restore -- '${SAMPLE}/01-phase.md'`);
    if (process.platform !== "win32") {
      expect(spawnSync("sh", ["-c", result.undo.command!], { cwd: os.tmpdir() }).status).toBe(0);
      expect(read(`${SAMPLE}/01-phase.md`)).toBe(readFileSync(path.join(FIXTURE, "project", SAMPLE, "01-phase.md"), "utf8"));
    }
  });
});
