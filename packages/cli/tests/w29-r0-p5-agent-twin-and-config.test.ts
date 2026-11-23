/**
 * W29 R0 P5: the work store agent twin, the `work` config block, the project
 * name proposal, and the `phase-status-line` doctor check.
 *
 * - Twin (T1, T2, T7, T9; A23): every rule ID of the rule catalog sits in its
 *   agent form section of `work-store.md`, and every rule ID in the text is in
 *   the catalog. The text's sync table, settle choices, wait reasons, recorded
 *   status map, claim timing, and command table match the catalog.
 * - Sync rules (T9): each `sync-scenario` fixture runs through the real sync.
 * - Bytes (T5; A22): template, bundled package copy, and dogfood copy match.
 * - Config (T3, T4; A24), project name (T8), doctor (T10), routers (T6).
 *
 * No test reads or writes the real Store: `MAKE_DOCS_HOME` points at a
 * temporary folder. No test writes this repository's files.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parse as parseYaml } from "yaml";

import { loadMakeDocsConfig } from "../src/config";
import { checkProjectDoctor, fixProjectDoctor } from "../src/operations/project/doctor";
import { PHASE_STATUS_LINE, scanPhaseStatusLine } from "../src/operations/project/doctor/phase-status-line";
import { workExport, workReport } from "../src/operations/work/work-queue/queue";
import {
  WORK_CLAIM_POLICY,
  WORK_RECORDED_STATUS_MAP,
  WORK_SETTLE_OPTIONS,
  WORK_STORE_AGENT_RESOURCE,
  WORK_STORE_AGENT_SECTIONS,
  WORK_STORE_OPERATIONS,
  WORK_STORE_RULES,
  WORK_SYNC_TABLE,
  WORK_WAIT_REASON_TEXT,
} from "../src/operations/work/work-store/catalog";
import { WORK_CONFLICT_KINDS, WorkConfigBlockSchema, looksLikeSecret, nameWords, workConfigStateFieldProblems, type WorkUnitRecord } from "../src/operations/work/work-store/schemas";
import { previewWorkSync, syncWorkFiles, type WorkSyncReport } from "../src/operations/work/work-store/sync";
import { parseWorkFile } from "../src/operations/work/work-store/work-file";
import { platform } from "../src/platform";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { getReferencePaths } from "../src/rules";
import { getInstallationCheckoutId, previewInstallationCheckoutMove, registerSeparateInstallationCheckout } from "../src/store/installation-state";
import { describeProjectNameForSetup, projectNameFromFolderName, projectNameProblem, proposeProjectName } from "../src/store/project-register";
import { claimWorkUnit, listWorkUnits, putWorkUnit, readWorkStore, writeWorkStore } from "../src/store/work-store";
import { WORK_STORE_CONTRACT_FIXTURES, type ReportScenarioFixture, type SyncScenarioFixture, type WorkReportScenario, type WorkSyncScenario } from "./fixtures/work-store-contract";
import { cleanupTempDir, createTempDir } from "./helpers";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const RESOURCE = ".make-docs/system/references/work-store.md";
const TEMPLATE = `packages/docs/template/${RESOURCE}`;
const BUNDLED = `packages/cli/template/${RESOURCE}`;
const DOCTOR_REFERENCE = "packages/docs/template/.make-docs/system/references/project-doctor.md";
const TEXT = readFileSync(path.join(REPO, TEMPLATE), "utf8");

/** The `##` sections of the resource, by the anchor that a rule's agent form names. */
function sections(text: string): Map<string, string> {
  const result = new Map<string, string>();
  const parts = text.split(/^## (.+)$/m);
  for (let index = 1; index < parts.length; index += 2) {
    const slug = parts[index]!.trim().toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-");
    result.set(slug, parts[index + 1]!);
  }
  return result;
}

const SECTIONS = sections(TEXT);
const RULE_ID = /WORK-RULE-\d{3}/g;

/* ------------------------------------------------------------------------ */
/* The agent twin                                                           */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P5 work-store.md is the agent twin of the work operations (T1, T2, T7, T9, A23)", () => {
  it("states that it is the twin, and that a change to either form needs a review of the other", () => {
    expect(TEXT).toContain("This reference is the agent twin of the deterministic work operations.");
    expect(TEXT).toContain("A change to either form needs a review of the other.");
    expect(TEXT).toContain("make-docs.work-store-rules.v1");
    expect(WORK_STORE_AGENT_RESOURCE).toBe("make-docs://system/reference/work-store.md");
  });

  it("has one section for each agent form section of the catalog", () => {
    for (const section of WORK_STORE_AGENT_SECTIONS) expect(SECTIONS.has(section), section).toBe(true);
  });

  it("names every catalog rule in its own section, and no rule ID that the catalog lacks", () => {
    const catalogIds = new Set(WORK_STORE_RULES.map((rule) => rule.id));
    for (const rule of WORK_STORE_RULES) {
      const section = rule.agentForm.split("#")[1]!;
      expect(SECTIONS.get(section)!, `${rule.id} in #${section}`).toContain(rule.id);
    }
    const inText = new Set(TEXT.match(RULE_ID) ?? []);
    for (const id of inText) expect(catalogIds.has(id as `WORK-RULE-${string}`), `${id} is in the catalog`).toBe(true);
    for (const id of catalogIds) expect(inText.has(id), `${id} is in the text`).toBe(true);
  });

  it("lists every work command with its MCP tool", () => {
    for (const operation of WORK_STORE_OPERATIONS) {
      expect(TEXT, operation.cli).toContain(`| \`${operation.cli}\` | \`${operation.mcp}\` |`);
    }
  });

  it("has the catalog's sync table, row for row", () => {
    const table = SECTIONS.get("sync")!.split("### Sync Table")[1]!.split("###")[0]!;
    const rows = table.split("\n").filter((line) => /^\| (unreadable|unchanged|changed|new|missing|absent) \|/.test(line));
    const decision = (text: string): { decision: string; conflictKind: string | null } => {
      const conflict = /^Conflict: `([a-z-]+)`\.$/.exec(text);
      if (conflict) return { decision: "conflict", conflictKind: conflict[1]! };
      if (text.startsWith("Reports the first failing line")) return { decision: "report-unreadable", conflictKind: null };
      if (text === "Removes the copy.") return { decision: "remove-copy", conflictKind: null };
      if (text === "Writes the file.") return { decision: "write", conflictKind: null };
      if (text === "Imports the file.") return { decision: "import", conflictKind: null };
      if (text === "Nothing." || text.startsWith("Clears the ledger entry")) return { decision: "none", conflictKind: null };
      throw new Error(`Unknown sync table text: ${text}`);
    };
    const parsed = rows.map((line) => {
      const [file, store, projection, does] = line.split("|").slice(1, 5).map((cell) => cell.trim());
      return { file, store, projection, ...decision(does!) };
    });
    const expected = WORK_SYNC_TABLE.map((row) => ({ file: row.file, store: row.store, projection: row.projection, decision: row.decision, conflictKind: row.conflictKind }));
    expect(parsed).toEqual(expected);
  });

  it("names every conflict kind with its own settle choices", () => {
    const table = SECTIONS.get("sync")!.split("### Conflict Kinds and Settle Choices")[1]!;
    for (const kind of WORK_CONFLICT_KINDS) {
      const row = table.split("\n").find((line) => line.startsWith(`| \`${kind}\` |`));
      expect(row, kind).toBeDefined();
      for (const option of WORK_SETTLE_OPTIONS[kind]) expect(row, `${kind} ${option.choice}`).toContain(`\`${option.choice}\``);
    }
    // A claimed conflict never offers keep-file, and offers the release of each claim.
    const claimed = table.split("\n").find((line) => line.startsWith("| `claimed` |"))!;
    expect(claimed).not.toContain("keep-file");
    expect(claimed).toContain("make-docs work release <unit>");
  });

  it("names every wait reason with one next action", () => {
    const readiness = SECTIONS.get("readiness")!;
    for (const reason of Object.keys(WORK_WAIT_REASON_TEXT)) {
      const row = readiness.split("\n").find((line) => line.startsWith(`| \`${reason}\` |`));
      expect(row, reason).toBeDefined();
      expect(row!.split("|").filter((cell) => cell.trim()).length, reason).toBe(3);
    }
  });

  it("maps every recorded status word as the catalog does", () => {
    const firstImport = SECTIONS.get("first-import")!;
    for (const mapping of WORK_RECORDED_STATUS_MAP) {
      for (const word of mapping.recorded) {
        const shown = word === "[x]" ? "a checked box `[x]`" : word === "[ ]" ? "an empty box `[ ]`" : `\`${word}\``;
        const row = firstImport.split("\n").find((line) => line.startsWith("| ") && line.includes(shown));
        expect(row, word).toBeDefined();
        const status = mapping.status === "in-progress" ? "in progress" : mapping.status;
        expect(row!.split("|")[2]!.trim(), word).toBe(status);
        expect(row!.split("|")[3]!.trim(), word).toBe(mapping.closeOutcome ?? "none");
      }
    }
  });

  it("states the catalog's claim timing", () => {
    const claims = SECTIONS.get("claims")!;
    expect(WORK_CLAIM_POLICY).toEqual({ defaultTtlSeconds: 1800, checkEverySeconds: 600, minTtlSeconds: 1200, maxTtlSeconds: 86400 });
    expect(claims).toContain("A claim lasts 30 minutes by default, and between 20 minutes and 24 hours from its latest renewal.");
    expect(claims).toContain("checks at least every 10 minutes");
  });

  it("covers quick items, project URIs that name their project, and the checkout without a CLI or a Store (T7)", () => {
    expect(SECTIONS.get("quick-items")).toContain("It lives only in the work store");
    expect(SECTIONS.get("quick-items")).toContain("`task 7`");
    const uris = SECTIONS.get("project-uris")!;
    expect(uris).toContain("`make-docs://project/<project>/tasks/`");
    expect(uris).toContain("`make-docs://project/<project>/backlog/`");
    expect(uris).toContain("Every project URI names its project in full. Nothing in it comes from the current folder");
    const authority = SECTIONS.get("authority")!;
    expect(authority).toContain("read the `docs/work/` files directly");
    expect(authority).toContain("Without a Store, there are no claims, progress notes, met-gate records, or quick items.");
  });

  it("keeps the tracker connection generic and the field map free of secrets", () => {
    const tracker = SECTIONS.get("tracker-connections")!;
    expect(tracker).toContain("`connection: local`");
    expect(tracker).toContain("It never holds a value, a key, a token, a password, or another secret.");
    const yaml = /```yaml\n([\s\S]*?)```/.exec(tracker)![1]!;
    const block = (yaml.match(/^work:\n([\s\S]*)$/m)![1]!)
      .split("\n")
      .map((line) => line.replace(/\s+#.*$/, ""))
      .join("\n");
    // The example block in the text is a valid work block.
    const parsed = loadYamlWorkBlock(`work:\n${block}`);
    expect(WorkConfigBlockSchema.safeParse(parsed).success).toBe(true);
  });
});

function loadYamlWorkBlock(text: string): unknown {
  const temp = createTempDir("make-docs-w29-p5-yaml-");
  try {
    mkdirSync(path.join(temp, ".make-docs"));
    writeFileSync(path.join(temp, ".make-docs/config.yaml"), text);
    const loaded = loadMakeDocsConfig(temp);
    expect(loaded.diagnostics).toEqual([]);
    return (parseYaml(text) as { work: unknown }).work;
  } finally {
    cleanupTempDir(temp);
  }
}

/* ------------------------------------------------------------------------ */
/* Bytes and routers                                                        */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P5 template, package, and dogfood bytes (T5, T6, A22)", () => {
  it("keeps the template, the bundled copy, the dogfood copy, and both catalogs in agreement", () => {
    const template = readFileSync(path.join(REPO, TEMPLATE));
    expect(readFileSync(path.join(REPO, RESOURCE)).equals(template)).toBe(true);
    if (existsSync(path.join(REPO, BUNDLED))) expect(readFileSync(path.join(REPO, BUNDLED)).equals(template)).toBe(true);
    for (const file of ["packages/docs/template/.make-docs/system-resources.catalog.json", ".make-docs/system-resources.catalog.json"]) {
      const catalog = JSON.parse(readFileSync(path.join(REPO, file), "utf8")) as { mcpResources: Array<{ uri: string; profiles: string[] }> };
      expect(catalog.mcpResources.find((entry) => entry.uri === WORK_STORE_AGENT_RESOURCE), file).toEqual({
        uri: WORK_STORE_AGENT_RESOURCE,
        profiles: ["workflow", "backlog"],
      });
    }
    expect(getReferencePaths(resolveInstallProfile(defaultSelections()))).toContain(RESOURCE);
    const doctor = readFileSync(path.join(REPO, DOCTOR_REFERENCE));
    expect(readFileSync(path.join(REPO, ".make-docs/system/references/project-doctor.md")).equals(doctor)).toBe(true);
  });

  it("points the work and references routers at the new resource, in the template and the dogfood copy", () => {
    for (const root of ["packages/docs/template/", ""]) {
      for (const name of ["AGENTS.md", "CLAUDE.md"]) {
        expect(readFileSync(path.join(REPO, `${root}docs/work/${name}`), "utf8")).toContain("make-docs://system/reference/work-store.md");
        expect(readFileSync(path.join(REPO, `${root}.make-docs/system/references/${name}`), "utf8")).toContain("Use `work-store.md` for work readiness");
      }
    }
    for (const relative of ["docs/work/AGENTS.md", "docs/work/CLAUDE.md", ".make-docs/system/references/AGENTS.md", ".make-docs/system/references/CLAUDE.md"]) {
      expect(readFileSync(path.join(REPO, relative)).equals(readFileSync(path.join(REPO, "packages/docs/template", relative))), relative).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------------ */
/* Sync scenarios through the real sync (T9)                                */
/* ------------------------------------------------------------------------ */

const PROJECT_ID = "aurora-p5-project";
const NOW = new Date("2042-06-15T12:00:00.000Z");
const RECORD = "docs/work/2042-06-01-w1-r0-aurora";
const INDEX = `${RECORD}/00-index.md`;
const P1 = `${RECORD}/01-first.md`;
const P2 = `${RECORD}/02-second.md`;
const INDEX_TEXT = `---\ntitle: "W1 R0 Aurora"\nkind: "work"\nstatus: "active"\ncoordinate: "W1 R0"\n---\n\n# W1 R0 Aurora\n\n- [01-first.md](01-first.md)\n- [02-second.md](02-second.md)\n`;
const P1_TEXT = `---\ntitle: "Phase 1: First"\nkind: "work"\nstatus: "active"\ncoordinate: "W1 R0 P1"\n---\n\n# Phase 1: First\n\n## Stage 1 - Build\n\n### Tasks\n\n- [ ] T1: Build the parser.\n- [x] T2: Write the writer.\n- [ ] T3: Check it.\n`;
const P2_TEXT = `---\ntitle: "Phase 2: Second"\nstatus: "active"\ncoordinate: "W1 R0 P2"\n---\n\n# Phase 2: Second\n\n### Dependencies\n\n- P1 is complete.\n\n## Stage 1 - Ship\n\n### Tasks\n\n- [ ] T1: Ship it.\n`;

let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w29-p5-")).canonicalPath;
  store = path.join(temp, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
});

afterEach(() => {
  vi.unstubAllEnvs();
  cleanupTempDir(temp);
});

function write(root: string, relative: string, text: string): void {
  const target = path.join(root, ...relative.split("/"));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
}

const read = (root: string, relative: string) => readFileSync(path.join(root, ...relative.split("/")), "utf8");

function project(name = "aurora", extra = ""): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: aurora\n${extra}`);
  return platform.describePath(root).canonicalPath;
}

function backlog(root: string): void {
  write(root, INDEX, INDEX_TEXT);
  write(root, P1, P1_TEXT);
  write(root, P2, P2_TEXT);
}

function sync(root: string, options: Parameters<typeof syncWorkFiles>[1] = {}): WorkSyncReport {
  return syncWorkFiles(root, { storeRoot: store, now: NOW, ...options });
}

function imported(extra = ""): string {
  const root = project("aurora", extra);
  backlog(root);
  getInstallationCheckoutId(root, store);
  sync(root);
  return root;
}

const units = (root: string): WorkUnitRecord[] => readWorkStore(root, (db) => listWorkUnits(db, PROJECT_ID), { storeRoot: store });

function storeChange(root: string, coordinate: string, change: Partial<WorkUnitRecord>): void {
  writeWorkStore(root, (db) => {
    const current = listWorkUnits(db, PROJECT_ID).find((unit) => unit.coordinate === coordinate)!;
    const { revision, ...input } = current;
    putWorkUnit(db, { ...input, ...change }, { expectedVersion: revision, now: NOW });
  }, { storeRoot: store });
}

const closeP2T1 = (root: string) => storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
const fileOf = (report: WorkSyncReport, relative: string) => report.files.find((file) => file.path === relative)!;
const changed = (report: WorkSyncReport) => report.written.length + report.removed.length > 0;

type Outcome = SyncScenarioFixture["expected"];

const SCENARIOS: Record<WorkSyncScenario, () => Outcome> = {
  "same-work-on-both-sides": () => {
    const root = imported();
    closeP2T1(root);
    write(root, P2, P2_TEXT.replace("- [ ] T1: Ship it.", "- [x] T1: Ship it."));
    const report = sync(root);
    expect(report.conflicts).toEqual([]);
    return { action: fileOf(report, P2).action as Outcome["action"], conflictKind: null, changedFiles: changed(report) };
  },
  "archive-move": () => {
    const root = imported();
    const ids = new Map(units(root).map((unit) => [unit.coordinate, unit.storeId]));
    const archived = RECORD.replace("docs/work", ".make-docs/archive/work");
    mkdirSync(path.join(root, ".make-docs/archive/work"), { recursive: true });
    renameSync(path.join(root, RECORD), path.join(root, archived));
    const report = sync(root);
    for (const unit of units(root)) expect(unit.storeId).toBe(ids.get(unit.coordinate));
    expect(report.conflicts).toEqual([]);
    return { action: fileOf(report, `${archived}/01-first.md`).action as Outcome["action"], conflictKind: null, changedFiles: changed(report) };
  },
  "unit-leaves-file": () => {
    const root = imported();
    write(root, P1, P1_TEXT.replace("- [ ] T3: Check it.\n", ""));
    const report = sync(root);
    expect(report.deleted).toEqual([{ coordinate: "W1 R0 P1 T3", path: P1 }]);
    return { action: fileOf(report, P1).action as Outcome["action"], conflictKind: null, changedFiles: changed(report) };
  },
  "file-closes-claimed-unit": () => {
    const root = imported();
    let claimId = "";
    writeWorkStore(root, (db) => {
      const unit = listWorkUnits(db, PROJECT_ID).find((candidate) => candidate.coordinate === "W1 R0 P2 T1")!;
      const outcome = claimWorkUnit(db, { unitStoreId: unit.storeId, claimant: "agent-7", taskHandle: "task-1", ttlSeconds: null, expectedVersion: unit.revision, takeover: null }, { now: NOW });
      if (outcome.result !== "claimed") throw new Error("not claimed");
      claimId = outcome.claim.claimId;
    }, { storeRoot: store });
    write(root, P2, P2_TEXT.replace("- [ ] T1: Ship it.", "- [x] T1: Ship it."));
    const report = sync(root);
    expect(JSON.stringify(report)).not.toContain(claimId);
    const conflict = report.conflicts.find((entry) => entry.path === P2)!;
    expect(units(root).find((unit) => unit.coordinate === "W1 R0 P2 T1")!.status).toBe("open");
    return { action: fileOf(report, P2).action as Outcome["action"], conflictKind: conflict.kind, changedFiles: changed(report) };
  },
  "held-path": () => {
    const root = imported(`work:\n  syncHold:\n    - ${RECORD}/\n`);
    closeP2T1(root);
    const report = sync(root);
    expect(read(root, P2)).toBe(P2_TEXT);
    expect(report.held.map((entry) => entry.path)).toContain(P2);
    return { action: fileOf(report, P2).action as Outcome["action"], conflictKind: null, changedFiles: changed(report) };
  },
  "settle-keep-store": () => {
    const root = imported();
    closeP2T1(root);
    write(root, P2, P2_TEXT.replace("Ship it.", "Ship it today."));
    const conflicted = sync(root);
    expect(conflicted.conflicts.map((entry) => entry.kind)).toEqual(["both-changed"]);
    const report = sync(root, { settle: { targetPath: P2, choice: "keep-store", expectedStoreRevision: null } });
    expect(report.settled).toMatchObject({ path: P2, choice: "keep-store", kind: "both-changed" });
    expect(read(root, P2)).toContain("- [x] T1: Ship it.");
    return { action: fileOf(report, P2).action as Outcome["action"], conflictKind: null, changedFiles: changed(report) };
  },
  "first-sync-of-a-checkout": () => {
    imported();
    const second = project("aurora-branch");
    write(second, INDEX, INDEX_TEXT);
    const preview = previewInstallationCheckoutMove(second, undefined, store);
    registerSeparateInstallationCheckout(second, preview.separateReviewDigest!, store);
    const report = sync(second);
    expect(report.firstImport).toBe(true);
    expect(report.deferred.write.sort()).toEqual([P1, P2]);
    expect(existsSync(path.join(second, P1))).toBe(false);
    return { action: fileOf(report, P1).action as Outcome["action"], conflictKind: null, changedFiles: changed(report) };
  },
  "changed-copy-with-copies-off": () => {
    const root = imported();
    write(root, P2, P2_TEXT.replace("Ship it.", "Ship it today."));
    const report = sync(root, { projection: "off" });
    expect(report.keptChangedCopies).toEqual([P2]);
    expect(existsSync(path.join(root, P2))).toBe(true);
    const later = sync(root, { projection: "off" });
    expect(later.removed).toEqual([P2]);
    return { action: fileOf(report, P2).action as Outcome["action"], conflictKind: null, changedFiles: changed(report) };
  },
  "read-only-check": () => {
    const root = imported();
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the strict parser."));
    const before = JSON.stringify(units(root));
    const preview = previewWorkSync(root, { storeRoot: store, now: NOW });
    expect(preview.pending.map((file) => [file.path, file.decision])).toEqual([[P1, "import"]]);
    expect(JSON.stringify(units(root))).toBe(before);
    expect(read(root, P1)).toBe(P1_TEXT.replace("Build the parser.", "Build the strict parser."));
    return { action: "none", conflictKind: null, changedFiles: false };
  },
  "export-to-named-folder": () => {
    const root = imported();
    const before = readdirSync(path.join(root, RECORD)).sort();
    expect(() => workExport(root, { storeRoot: store, now: NOW }, { to: path.join(root, "docs/work"), quick: null, paths: [] })).toThrow("Nothing changed.");
    const out = path.join(temp, "copies");
    const result = workExport(root, { storeRoot: store, now: NOW }, { to: out, quick: null, paths: [] });
    expect(result.complete).toBe(true);
    expect(existsSync(path.join(out, P1))).toBe(true);
    expect(readdirSync(path.join(root, RECORD)).sort()).toEqual(before);
    return { action: "none", conflictKind: null, changedFiles: false };
  },
};

describe("W29 R0 P5 sync rule fixtures run through the real sync (T9)", () => {
  const fixtures = WORK_STORE_CONTRACT_FIXTURES.filter((fixture): fixture is SyncScenarioFixture => fixture.kind === "sync-scenario");
  it("has a runner for every scenario", () => {
    expect(new Set(fixtures.map((fixture) => fixture.input.scenario))).toEqual(new Set(Object.keys(SCENARIOS)));
  });
  it.each(fixtures.map((fixture) => [fixture.id, fixture] as const))("%s", (_id, fixture) => {
    expect(SCENARIOS[fixture.input.scenario]()).toEqual(fixture.expected);
  });
});

/* ------------------------------------------------------------------------ */
/* Report scenarios through the real work report (review item 6)            */
/* ------------------------------------------------------------------------ */

const unitAt = (root: string, coordinate: string) => units(root).find((unit) => unit.coordinate === coordinate)!;
const queueEnv = () => ({ storeRoot: store, now: NOW });
const report = (root: string, coordinate: string, extra: Partial<Parameters<typeof workReport>[2]>) => workReport(root, queueEnv(), {
  unit: coordinate,
  claimId: null,
  status: null,
  evidencePath: null,
  clearBlockers: false,
  metGates: [],
  note: null,
  expectedVersion: unitAt(root, coordinate).revision,
  ...extra,
});

type ReportOutcome = ReportScenarioFixture["expected"];

const REPORT_SCENARIOS: Record<WorkReportScenario, () => ReportOutcome> = {
  "note-too-long": () => {
    const root = imported();
    const edited = P1_TEXT.replace("Build the parser.", "Build the strict parser.");
    write(root, P1, edited);
    const before = JSON.stringify(units(root));
    expect(() => report(root, "W1 R0 P1 T1", { note: "n".repeat(257) })).toThrow("Nothing changed.");
    // The input check runs before the sync, so the file edit was not imported either.
    expect(JSON.stringify(units(root))).toBe(before);
    expect(read(root, P1)).toBe(edited);
    // A note of exactly 256 characters is accepted, after a sync takes in the file edit.
    sync(root);
    expect(report(root, "W1 R0 P1 T1", { note: "n".repeat(256) }).accepted).toBe(true);
    return { accepted: false, latestNote: null, storeOnlyEditKinds: [] };
  },
  "note-replaces-last": () => {
    const root = imported();
    expect(report(root, "W1 R0 P1 T1", { note: "First note." }).note?.note).toBe("First note.");
    const second = report(root, "W1 R0 P1 T1", { note: "Second note." });
    expect(read(root, P1)).toBe(P1_TEXT);
    return { accepted: second.accepted, latestNote: second.note?.note ?? null, storeOnlyEditKinds: second.storeOnlyEdits.map((edit) => edit.kind) };
  },
  "store-only-edit-named": () => {
    const root = imported();
    const result = report(root, "W1 R0 P1 T1", { status: "in-progress" });
    expect(result.summary).toContain("Store-only edits (the file copy does not show them):");
    expect(read(root, P1)).toBe(P1_TEXT);
    return { accepted: result.accepted, latestNote: result.note?.note ?? null, storeOnlyEditKinds: result.storeOnlyEdits.map((edit) => edit.kind) };
  },
};

describe("W29 R0 P5 report fixtures run through the real work report (WORK-RULE-051)", () => {
  const fixtures = WORK_STORE_CONTRACT_FIXTURES.filter((fixture): fixture is ReportScenarioFixture => fixture.kind === "report-scenario");
  it("has a runner for every scenario", () => {
    expect(new Set(fixtures.map((fixture) => fixture.input.scenario))).toEqual(new Set(Object.keys(REPORT_SCENARIOS)));
  });
  it.each(fixtures.map((fixture) => [fixture.id, fixture] as const))("%s", (_id, fixture) => {
    expect(REPORT_SCENARIOS[fixture.input.scenario]()).toEqual(fixture.expected);
  });
});

/* ------------------------------------------------------------------------ */
/* The work config block (T3, T4, A24)                                      */
/* ------------------------------------------------------------------------ */

function configDiagnostics(work: string): Array<{ code: string; keyPath: string; message: string }> {
  const root = path.join(temp, `config-${Math.random().toString(36).slice(2)}`);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\n${work}`);
  return loadMakeDocsConfig(root).diagnostics.map(({ code, keyPath, message }) => ({ code, keyPath, message }));
}

describe("W29 R0 P5 the work block in project config (T3, T4, A24)", () => {
  it("accepts the work block with projection, syncHold, and a tracker connection name and field map", () => {
    expect(configDiagnostics("")).toEqual([]);
    expect(configDiagnostics("work: {}\n")).toEqual([]);
    expect(configDiagnostics("work:\n  projection: off\n  syncHold:\n    - docs/work/2026-01-01-w1-r0-a/\n  tracker:\n    connection: local\n    fieldMap:\n      unit: item\n      status: state\n      dependencies: depends_on\n      claim: assignee\n      links: related.links\n")).toEqual([]);
    expect(WorkConfigBlockSchema.parse({})).toEqual({ projection: "on", syncHold: [], tracker: { connection: "local" } });
  });

  it("rejects state fields, IDs, digests, receipts, and secrets, and names each one", () => {
    const diagnostics = configDiagnostics([
      "work:",
      "  projection: on",
      "  lastAppliedDigest: abc",
      "  checkoutId: c-1",
      "  receipts: []",
      "  claimId: wc-1",
      "  storeRevision: 3",
      "  tracker:",
      "    connection: local",
      "    apiToken: hidden",
      "    password: hidden",
      "",
    ].join("\n"));
    expect(diagnostics.map((item) => [item.code, item.keyPath])).toEqual([
      ["work-block-state-field", "work.lastAppliedDigest"],
      ["work-block-state-field", "work.checkoutId"],
      ["work-block-state-field", "work.receipts"],
      ["work-block-state-field", "work.claimId"],
      ["work-block-state-field", "work.storeRevision"],
      ["work-block-state-field", "work.tracker.apiToken"],
      ["work-block-state-field", "work.tracker.password"],
    ]);
    expect(diagnostics[0]!.message).toContain("holds a digest. The work block holds shared intent only: projection, syncHold, and tracker. Make Docs keeps this state in the Store. Remove the key.");
    expect(diagnostics[5]!.message).toContain("holds a secret");
    expect(diagnostics[5]!.message).toContain("A secret stays with the tool that owns it.");
  });

  it("keeps a field map key such as claim, and refuses a field map value that looks like a key", () => {
    expect(workConfigStateFieldProblems({ tracker: { fieldMap: { claim: "assignee" } } })).toEqual([]);
    expect(looksLikeSecret("tracker_field_7")).toBe(false);
    expect(looksLikeSecret("Xq7Lm2Pz9Rt4Vb8Nw3Ks6Hd")).toBe(true);
    const diagnostics = configDiagnostics("work:\n  tracker:\n    fieldMap:\n      status: Xq7Lm2Pz9Rt4Vb8Nw3Ks6Hd\n");
    expect(diagnostics).toEqual([expect.objectContaining({ code: "invalid-work-block", keyPath: "work.tracker.fieldMap.status", message: expect.stringContaining("looks like a key or a token") })]);
    expect(configDiagnostics("work:\n  tracker:\n    fieldMap:\n      status: api_key=abc\n")[0]!.message).toContain("A field map value is a tracker field name");
  });

  it("splits names into words, and refuses only names that look like a random key (review item 2)", () => {
    expect(nameWords("customField10023Value")).toEqual(["custom", "Field", "10023", "Value"]);
    expect(nameWords("tracker_field.ID-v2")).toEqual(["tracker", "field", "ID", "v", "2"]);
    for (const name of ["customField10023Value", "issueLinksAndRelatedItems2024Q", "tracker_field_7", "depends_on", "related.links", "status", "x", "a1", "URLField"]) {
      expect(looksLikeSecret(name), name).toBe(false);
    }
    for (const name of ["Xq7Lm2Pz9Rt4Vb8Nw3Ks6Hd", "a3f9c2e17b", "a".repeat(32), "k9-Zq-7x-Lp"]) expect(looksLikeSecret(name), name).toBe(true);
    expect(configDiagnostics("work:\n  tracker:\n    fieldMap:\n      unit: customField10023Value\n      links: issueLinksAndRelatedItems2024Q\n")).toEqual([]);
  });

  it("matches state and secret words as whole words, and id only as the last word (review item 4)", () => {
    const named = (key: string) => workConfigStateFieldProblems({ [key]: 1 }).map((problem) => problem.message.split(". ")[0]);
    for (const key of ["author", "valid", "idea", "colour", "identity", "handler", "locksmithNotes"]) expect(named(key), key).toEqual([]);
    expect(named("checkoutId")).toEqual(["work.checkoutId holds machine or checkout state"]);
    expect(named("storeIds")).toEqual(["work.storeIds holds an ID"]);
    expect(named("uuid")).toEqual(["work.uuid holds an ID"]);
    expect(named("authToken")).toEqual(["work.authToken holds a secret"]);
    expect(named("auth")).toEqual(["work.auth holds a secret"]);
    expect(named("api_key")).toEqual(["work.api_key holds a secret"]);
    expect(named("privateKey")).toEqual(["work.privateKey holds a secret"]);
    expect(named("hashes")).toEqual(["work.hashes holds a digest"]);
    expect(named("receipts")).toEqual(["work.receipts holds a receipt"]);
    expect(named("syncedAt")).toEqual(["work.syncedAt holds sync state"]);
    // A word that is not a state word goes to the plain unknown-key refusal.
    expect(configDiagnostics("work:\n  author: me\n")).toEqual([expect.objectContaining({ code: "invalid-work-block", message: expect.stringContaining('the work block does not accept "author"') })]);
  });

  it("refuses an unknown key and a connection other than the local store, with plain words", () => {
    expect(configDiagnostics("work:\n  colour: blue\n")).toEqual([expect.objectContaining({ code: "invalid-work-block", keyPath: "work", message: expect.stringContaining('the work block does not accept "colour"') })]);
    expect(configDiagnostics("work:\n  tracker:\n    connection: other-tracker\n").map((item) => item.code)).toEqual(["invalid-work-block"]);
    expect(configDiagnostics("work:\n  projection: maybe\n").map((item) => item.keyPath)).toEqual(["work.projection"]);
  });
});

/* ------------------------------------------------------------------------ */
/* Project name (T8)                                                        */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P5 projectName: validation and the setup proposal (T8)", () => {
  it("validates projectName in config in the PRD 38 R-ID-8 form", () => {
    expect(configDiagnostics("projectName: aurora-notes\n")).toEqual([]);
    for (const bad of ["Aurora", "-aurora", "2fast", "my_docs", "a".repeat(65), "831ddb50-b97a-47e2-9f2c-f491b27b8759"]) {
      expect(configDiagnostics(`projectName: "${bad}"\n`).map((item) => item.code), bad).toEqual(["invalid-project-name"]);
    }
  });

  it("turns a folder name into the R-ID-8 form", () => {
    expect(projectNameFromFolderName("make-docs")).toBe("make-docs");
    expect(projectNameFromFolderName("Aurora Notes")).toBe("aurora-notes");
    expect(projectNameFromFolderName("Café_Notes--2")).toBe("cafe-notes-2");
    expect(projectNameFromFolderName("2026-plans")).toBe("plans");
    expect(projectNameFromFolderName("123")).toBeNull();
    expect(projectNameFromFolderName("---")).toBeNull();
    const long = projectNameFromFolderName(`${"a".repeat(63)}-b`)!;
    expect(long).toBe("a".repeat(63));
    for (const name of ["make-docs", "aurora-notes", "cafe-notes-2", "plans", long]) expect(projectNameProblem(name)).toBeNull();
  });

  it("proposes the checkout folder name, or the main checkout's folder name for a linked worktree", () => {
    const plain = path.join(temp, "Aurora Notes");
    mkdirSync(plain);
    expect(proposeProjectName(plain)).toEqual({ name: "aurora-notes", folder: path.resolve(plain), source: "checkout-folder" });
    const main = path.join(temp, "aurora-main");
    const worktree = path.join(temp, "wt-1234abcd");
    mkdirSync(path.join(main, ".git", "worktrees", "wt-1234abcd"), { recursive: true });
    mkdirSync(worktree);
    writeFileSync(path.join(worktree, ".git"), `gitdir: ${path.join(main, ".git", "worktrees", "wt-1234abcd")}\n`);
    expect(proposeProjectName(worktree)).toEqual({ name: "aurora-main", folder: main, source: "main-checkout-folder" });
  });

  it("shows the name or the proposal in setup words, and never writes the config", () => {
    const root = project("named-project");
    const config = read(root, ".make-docs/config.yaml");
    expect(describeProjectNameForSetup(root)).toMatchObject({ name: "aurora", proposal: null, text: "Project name: aurora" });
    const unnamed = path.join(temp, "Paper Plans");
    mkdirSync(path.join(unnamed, ".make-docs"), { recursive: true });
    writeFileSync(path.join(unnamed, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\n`);
    const described = describeProjectNameForSetup(unnamed);
    expect(described.proposal).toMatchObject({ name: "paper-plans", source: "checkout-folder" });
    expect(described.text).toBe("Project name: none. Proposed: paper-plans, from the checkout folder name. To use it, add projectName: paper-plans to .make-docs/config.yaml. You can choose another name: lower-case letters, digits, and hyphens, starting with a letter.");
    expect(read(unnamed, ".make-docs/config.yaml")).toBe(`projectId: ${PROJECT_ID}\n`);
    expect(read(root, ".make-docs/config.yaml")).toBe(config);
  });
});

/* ------------------------------------------------------------------------ */
/* The phase-status-line doctor check (T10)                                 */
/* ------------------------------------------------------------------------ */

const SAMPLE = "docs/work/2026-01-01-w1-r0-sample";
const HELD = "docs/work/2026-01-02-w2-r0-held";
const DONE_NO_FRONT_MATTER = "# Phase 1: Build\n\n### Tasks\n\n- [x] T1: Write the parser.\n- [x] T2: Write the writer.\n";

function doctorProject(): string {
  const root = path.join(temp, "doctor");
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: 4c1b7f0e-0d7d-4c55-9b55-31c3c5c1f0aa\nwork:\n  syncHold:\n    - ${HELD}/\n`);
  write(root, `${SAMPLE}/00-index.md`, "# W1 R0 Sample\n");
  write(root, `${SAMPLE}/01-done.md`, DONE_NO_FRONT_MATTER);
  write(root, `${SAMPLE}/02-open.md`, "# Phase 2\n\n### Tasks\n\n- [x] T1: One.\n- [ ] T2: Two.\n");
  write(root, `${SAMPLE}/03-status.md`, "---\nstatus: \"active\"\n---\n\n# Phase 3\n\n### Tasks\n\n- [x] T1: One.\n");
  write(root, `${SAMPLE}/04-front-matter.md`, "---\ntitle: \"Phase 4: Four\"\nkind: \"work\"\ncoordinate: \"W1 R0 P4\"\n---\n\n# Phase 4: Four\n\n### Tasks\n\n- [x] T1: One.\n");
  write(root, `${SAMPLE}/05-indented.md`, "# Phase 5\n\n### Tasks\n\n- [x] T1: One.\n  - [ ] A step with no task ID.\n");
  write(root, `${SAMPLE}/06-crlf.md`, "# Phase 6\r\n\r\n### Tasks\r\n\r\n- [x] T1: One.\r\n");
  write(root, `${SAMPLE}/07-no-tasks.md`, "# Phase 7\n\nNotes only.\n");
  write(root, `${SAMPLE}/08-both.md`, "# Phase 8\n\n### Tasks\n\n- [x] t1: Old form.\n");
  write(root, `${SAMPLE}/evidence.md`, "# Evidence\n\n- [x] T1: Not a phase file.\n");
  write(root, `${HELD}/01-held.md`, DONE_NO_FRONT_MATTER);
  return platform.describePath(root).canonicalPath;
}

describe("W29 R0 P5 project doctor phase-status-line check (T10)", () => {
  it("finds phases with no status line whose tasks are all checked, and skips held paths", () => {
    const root = doctorProject();
    const result = checkProjectDoctor(root);
    const status = result.findings.filter((finding) => finding.check === "phase-status-line");
    expect(status.map((finding) => [finding.file, finding.line, finding.replacement])).toEqual([
      [`${SAMPLE}/01-done.md`, 2, PHASE_STATUS_LINE],
      [`${SAMPLE}/04-front-matter.md`, 4, PHASE_STATUS_LINE],
      [`${SAMPLE}/06-crlf.md`, 2, PHASE_STATUS_LINE],
      [`${SAMPLE}/08-both.md`, 2, PHASE_STATUS_LINE],
    ]);
    expect(result.findings.filter((finding) => finding.check === "task-id-case").map((finding) => finding.file)).toEqual([`${SAMPLE}/08-both.md`]);
    expect(result.skipped).toContainEqual({ path: `${HELD}/01-held.md`, reason: "sync-hold", check: "phase-status-line" });
    expect(result.totals.byCheck["phase-status-line"]).toEqual({ phaseFiles: 4 });
    expect(result.summary).toBe("Found 1 lower-case task ID on 1 line in 1 file: 1 task line and 0 prose references, and 4 phase files with no status line whose tasks are all checked. Nothing changed.");
    expect(result.checks.map((check) => check.id)).toEqual(["task-id-case", "phase-status-line", "phase-open-under-completed-index"]);
  });

  it("an excluded path is left out for every check", () => {
    const root = doctorProject();
    const result = checkProjectDoctor(root, [SAMPLE]);
    expect(result.findings).toEqual([]);
    expect(result.status).toBe("clean");
  });

  it("the fix adds only the reviewed status lines, never writes a held path, and the work parser then reads each status", () => {
    const root = doctorProject();
    getInstallationCheckoutId(root, store);
    const held = read(root, `${HELD}/01-held.md`);
    const check = checkProjectDoctor(root);
    const fixed = fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, storeRoot: store });
    expect(fixed.status).toBe("fixed");
    expect(fixed.summary).toBe("Changed 1 task ID and added 4 status lines in 4 files. No other text changed.");
    expect(read(root, `${SAMPLE}/01-done.md`)).toBe(`---\n${PHASE_STATUS_LINE}\n---\n\n${DONE_NO_FRONT_MATTER}`);
    expect(read(root, `${SAMPLE}/04-front-matter.md`)).toBe(`---\ntitle: "Phase 4: Four"\nkind: "work"\n${PHASE_STATUS_LINE}\ncoordinate: "W1 R0 P4"\n---\n\n# Phase 4: Four\n\n### Tasks\n\n- [x] T1: One.\n`);
    expect(read(root, `${SAMPLE}/06-crlf.md`)).toBe(`---\r\n${PHASE_STATUS_LINE}\r\n---\r\n\r\n# Phase 6\r\n\r\n### Tasks\r\n\r\n- [x] T1: One.\r\n`);
    expect(read(root, `${SAMPLE}/08-both.md`)).toBe(`---\n${PHASE_STATUS_LINE}\n---\n\n# Phase 8\n\n### Tasks\n\n- [x] T1: Old form.\n`);
    expect(read(root, `${HELD}/01-held.md`)).toBe(held);
    for (const file of ["01-done.md", "04-front-matter.md", "06-crlf.md", "08-both.md"]) {
      const parsed = parseWorkFile(`${SAMPLE}/${file}`, read(root, `${SAMPLE}/${file}`));
      expect(parsed.ok && parsed.document.units[0]!.recordedStatus, file).toBe("completed");
    }
    expect(checkProjectDoctor(root).findings).toEqual([]);
  });

  it("gives the same answer as the shared example in the agent twin", () => {
    const body = readFileSync(path.join(REPO, DOCTOR_REFERENCE), "utf8");
    const section = body.slice(body.indexOf("## The `phase-status-line` Check"), body.indexOf("## Shared Examples"));
    const [before, after] = [...section.matchAll(/```markdown\n([\s\S]*?)```/g)].map((match) => match[1]!);
    expect(scanPhaseStatusLine(`${SAMPLE}/01-phase.md`, before!)?.after).toBe(after);
    expect(body).toContain("| `phase-status-line` |");
  });

  it("keeps each line ending of a file that mixes them, and adds no second front matter (review item 1)", () => {
    const mixed = "---\ntitle: \"Phase 1: Build\"\r\nkind: \"work\"\n---\n\n# Phase 1: Build\r\n\n### Tasks\n\n- [x] T1: Write it.\n";
    const fixed = scanPhaseStatusLine(`${SAMPLE}/01-phase.md`, mixed)!;
    expect(fixed.addsFrontMatter).toBe(false);
    expect(fixed.after).toBe(`---\ntitle: "Phase 1: Build"\r\nkind: "work"\n${PHASE_STATUS_LINE}\n---\n\n# Phase 1: Build\r\n\n### Tasks\n\n- [x] T1: Write it.\n`);
    expect(fixed.after.match(/^---$/gm)).toHaveLength(2);
    const crlfFirst = "---\r\ntitle: \"Phase 1\"\n---\r\n\r\n### Tasks\n\n- [x] T1: Write it.\r\n";
    expect(scanPhaseStatusLine(`${SAMPLE}/01-phase.md`, crlfFirst)!.after).toBe(`---\r\ntitle: "Phase 1"\n${PHASE_STATUS_LINE}\r\n---\r\n\r\n### Tasks\n\n- [x] T1: Write it.\r\n`);
    const noFrontMatter = "# Phase 1\n\n### Tasks\r\n\r\n- [x] T1: Write it.\r\n";
    expect(scanPhaseStatusLine(`${SAMPLE}/01-phase.md`, noFrontMatter)!.after).toBe(`---\n${PHASE_STATUS_LINE}\n---\n\n${noFrontMatter}`);
  });

  it("builds the fix sentence from its parts, also for a dry run (review item 3)", () => {
    const only = path.join(temp, "status-only");
    mkdirSync(path.join(only, ".make-docs"), { recursive: true });
    writeFileSync(path.join(only, ".make-docs/config.yaml"), "projectId: 4c1b7f0e-0d7d-4c55-9b55-31c3c5c1f0ab\n");
    write(only, `${SAMPLE}/01-done.md`, DONE_NO_FRONT_MATTER);
    write(only, `${SAMPLE}/02-done.md`, DONE_NO_FRONT_MATTER);
    getInstallationCheckoutId(only, store);
    const check = checkProjectDoctor(only);
    expect(check.summary).toBe("Found 2 phase files with no status line whose tasks are all checked. Nothing changed.");
    expect(fixProjectDoctor({ projectRoot: only, review: check.reviewDigest, storeRoot: store, dryRun: true }).summary).toBe("Dry run. Would add 2 status lines in 2 files. Nothing changed.");
    const both = doctorProject();
    getInstallationCheckoutId(both, store);
    const bothCheck = checkProjectDoctor(both);
    expect(fixProjectDoctor({ projectRoot: both, review: bothCheck.reviewDigest, storeRoot: store, dryRun: true }).summary).toBe("Dry run. Would change 1 task ID and add 4 status lines in 4 files. Nothing changed.");
    expect(fixProjectDoctor({ projectRoot: only, review: check.reviewDigest, storeRoot: store }).summary).toBe("Added 2 status lines in 2 files. No other text changed.");
  });

  it("keeps a byte order mark and needs a phase file", () => {
    expect(scanPhaseStatusLine(`${SAMPLE}/01-phase.md`, `﻿${DONE_NO_FRONT_MATTER}`)!.after).toBe(`﻿---\n${PHASE_STATUS_LINE}\n---\n\n${DONE_NO_FRONT_MATTER}`);
    expect(scanPhaseStatusLine(`${SAMPLE}/00-index.md`, DONE_NO_FRONT_MATTER)).toBeNull();
    expect(scanPhaseStatusLine(`${SAMPLE}/evidence.md`, DONE_NO_FRONT_MATTER)).toBeNull();
    expect(scanPhaseStatusLine(`${SAMPLE}/01-phase.md`, "---\ntitle: open\n\n# never closes\n- [x] T1: One.\n")).toBeNull();
  });
});

