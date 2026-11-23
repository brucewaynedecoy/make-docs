import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  NAME_CATALOG,
  NAME_GROUPS,
  NAME_END_WORDS,
  NAME_OWNER_DECISIONS,
  checkNameCatalogCoverage,
  compareBacklogAppPaths,
  compareMcpProfileNames,
  comparePrdCommandList,
  compareRRun1,
  compareRRun4,
  markdownSection,
  mcpNameForCliPath,
  parsePrdGroupedOperationTable,
  parsePrdOperationTable,
  validateNameCatalog,
  type NameCatalogEntry,
  type NameCatalogSources,
} from "../src/operations/name-catalog";
import { ADMITTED_OPERATION_IDS, listOperations } from "../src/operations/registry";
import { MAKE_DOCS_MCP_TOOLS, MCP_TOOL_NAME_BY_OPERATION } from "../src/mcp/tools";
import { WORK_STORE_OPERATIONS } from "../src/operations/work/work-store";
import { PACKAGE_ROOT } from "../src/utils";

const REPO_ROOT = path.resolve(PACKAGE_ROOT, "../..");
const readPrd = (file: string) => readFileSync(path.join(REPO_ROOT, "docs/prd", file), "utf8");
const PRD_39 = readPrd("39-cli-command-model-and-operation-registry.md");
const PRD_52 = readPrd("52-work-store-and-work-queue.md");
const PRD_53 = readPrd("53-factory-setup-and-orchestration.md");
const PRD_25 = readPrd("25-typescript-runtime-cli-mcp-operation-boundaries.md");
const PRD_51 = readPrd("51-backlog-review-and-reporting.md");

function realSources(): NameCatalogSources {
  const operations = listOperations();
  return {
    registeredOperationIds: operations.map((operation) => operation.id),
    currentCliByOperation: new Map(operations.map((operation) => [operation.id, `${operation.cli.root} ${operation.cli.path}`])),
    currentMcpByOperation: new Map(Object.entries(MCP_TOOL_NAME_BY_OPERATION)),
    handDefinedTools: MAKE_DOCS_MCP_TOOLS.filter((tool) => tool.operation === undefined).map((tool) => tool.name),
    mutatesByOperation: new Map(operations.map((operation) => [operation.id, operation.mutates])),
  };
}

function requirementLine(markdown: string, id: string): string {
  const line = markdown.split("\n").find((candidate) => candidate.startsWith(`- ${id} `));
  if (!line) throw new Error(`${id} not found`);
  return line;
}

const PRD_LISTS = {
  prd52: (markdown: string) =>
    comparePrdCommandList(
      "PRD 52 Operations",
      parsePrdOperationTable(markdownSection(markdown, "### Operations")),
      NAME_CATALOG,
      (item) => item.id.startsWith("work.queue."),
    ),
  prd53: (markdown: string) =>
    comparePrdCommandList(
      "PRD 53 Operations",
      parsePrdGroupedOperationTable(markdownSection(markdown, "### Operations")),
      NAME_CATALOG,
      (item) => item.id.startsWith("factory."),
    ),
  doctor: (markdown: string) =>
    comparePrdCommandList(
      "PRD 39 R-DOCTOR",
      parsePrdOperationTable(markdownSection(markdown, "### Project Doctor Commands (R-DOCTOR)")),
      NAME_CATALOG,
      (item) => item.id.startsWith("project.doctor."),
    ),
  storeCmd: (markdown: string) =>
    comparePrdCommandList(
      "PRD 39 R-STORE-CMD",
      parsePrdOperationTable(markdownSection(markdown, "### Project List and Store Maintenance Commands (R-STORE-CMD)")),
      NAME_CATALOG,
      (item) => ["project.register.list", "setup.store.check", "setup.store.clean"].includes(item.id),
    ),
  rRun4: (markdown: string) => compareRRun4(requirementLine(markdown, "R-RUN-4"), NAME_CATALOG),
  rRun1: (markdown: string) => compareRRun1(requirementLine(markdown, "R-RUN-1"), NAME_CATALOG),
  mcpProfiles: (markdown: string) => compareMcpProfileNames(markdown, NAME_CATALOG),
  backlogApp: (markdown: string) => compareBacklogAppPaths(markdown, NAME_CATALOG),
};

function find(id: string): NameCatalogEntry {
  const item = NAME_CATALOG.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`No entry ${id}`);
  return item;
}

function rulesFor(entries: readonly NameCatalogEntry[]): string[] {
  return validateNameCatalog(entries).map((problem) => problem.rule);
}

/** A rule-clean fixture entry to break one field at a time. */
function fixture(overrides: Partial<NameCatalogEntry>): NameCatalogEntry {
  const newCli = overrides.newCli ?? "work fixture add";
  return {
    id: "work.fixture.add",
    kind: "operation",
    status: "planned",
    plannedBy: "W29 R0",
    group: "work",
    currentCli: null,
    currentMcp: null,
    cliCommand: true,
    ...overrides,
    newCli,
    newMcp: overrides.newMcp ?? mcpNameForCliPath(newCli),
  };
}

describe("W33 R0 P1 name catalog", () => {
  it("lists 45 current operations, 6 hand-defined tools, and 22 planned operations", () => {
    const currentOperations = NAME_CATALOG.filter((item) => item.kind === "operation" && item.status === "current");
    const tools = NAME_CATALOG.filter((item) => item.kind === "hand-defined-tool");
    const plannedOperations = NAME_CATALOG.filter((item) => item.status === "planned");
    expect(currentOperations).toHaveLength(ADMITTED_OPERATION_IDS.length);
    expect(currentOperations).toHaveLength(45);
    expect(tools.map((item) => item.id).sort()).toEqual(
      ["compatibility", "config", "domains", "install_plan", "install_status", "manifest"],
    );
    const byWave = (wave: string) => plannedOperations.filter((item) => item.plannedBy === wave).length;
    expect({ w29: byWave("W29 R0"), w30: byWave("W30 R0"), w31: byWave("W31 R0"), w32: byWave("W32 R0") }).toEqual({
      w29: 9,
      w30: 10,
      w31: 0,
      w32: 3,
    });
  });

  it("passes R-NAME-1 to R-NAME-4 and has unique names", () => {
    expect(validateNameCatalog(NAME_CATALOG)).toEqual([]);
  });

  it("covers every registry operation and hand-defined tool with their current names, and nothing else", () => {
    expect(checkNameCatalogCoverage(NAME_CATALOG, realSources())).toEqual([]);
  });

  it("uses only the eleven groups and retires `run`", () => {
    expect(NAME_GROUPS).toHaveLength(11);
    expect(new Set(NAME_CATALOG.map((item) => item.group))).toEqual(
      new Set(NAME_GROUPS.filter((group) => !["update", "uninstall"].includes(group))),
    );
    expect(NAME_CATALOG.some((item) => item.newCli.startsWith("run "))).toBe(false);
  });

  it("keeps the design's example rows except where a rule or the owner changed them", () => {
    const designRows: Array<[string, string, string]> = [
      ["work.evidence.record", "work evidence record", "work_evidence_record"],
      ["work.evidence.read", "work evidence read", "work_evidence_read"],
      ["work.backlog.snapshot", "backlog snapshot", "backlog_snapshot"],
      ["work.backlog-cache.lookup", "backlog cache lookup", "backlog_cache_lookup"],
      ["work.backlog-cache.write", "backlog cache write", "backlog_cache_write"],
      ["backlog.review.open", "backlog review open", "backlog_review_open"],
      ["lifecycle.start", "lifecycle start", "lifecycle_start"],
      ["prd.authority.validate", "check prd", "check_prd"],
      ["work.queue.next", "work next", "work_next"],
      ["factory.workflow.save", "factory workflow save", "factory_workflow_save"],
      ["project.checkout-move.preview", "project move preview", "project_move_preview"],
      ["project.doctor.check", "project doctor check", "project_doctor_check"],
      ["project.register.list", "project list", "project_list"],
      ["setup.store.check", "setup store check", "setup_store_check"],
    ];
    for (const [id, cli, mcp] of designRows) {
      expect([find(id).newCli, find(id).newMcp], id).toEqual([cli, mcp]);
    }
    // The owner kept `work item resolve` instead of the design row `work resolve` (ND-09).
    expect([find("work.item.resolve").newCli, find("work.item.resolve").newMcp]).toEqual(["work item resolve", "work_item_resolve"]);
    // R-NAME-2 forces a final verb, so the design row `project personas` changes (ND-02).
    expect(find("project.persona.list").newCli).toBe("project persona list");
    expect(rulesFor([fixture({ id: "project.persona.list", group: "project", newCli: "project personas" })])).toContain("R-NAME-2");
  });

  it("records a reason and an owner decision for every shortened path and every MCP-only tool", () => {
    for (const item of NAME_CATALOG) {
      if (item.unshortenedCli !== undefined || !item.cliCommand) {
        expect(item.reason, item.id).toBeTruthy();
        expect(item.decision, item.id).toBeTruthy();
      }
    }
    const used = new Set(NAME_CATALOG.map((item) => item.decision).filter(Boolean));
    expect(NAME_OWNER_DECISIONS.map((decision) => decision.id).filter((id) => !used.has(id))).toEqual([]);
  });

  it("applies the owner's 2026-11-22 decisions", () => {
    const names = (id: string) => [find(id).newCli, find(id).newMcp];
    expect(names("performance.evidence.validate")).toEqual(["check performance-evidence", "check_performance_evidence"]);
    expect(names("project.checkout-register.preview")).toEqual(["project checkout preview", "project_checkout_preview"]);
    expect(names("project.checkout-register.apply")).toEqual(["project checkout apply", "project_checkout_apply"]);
    expect(names("project.state.status")).toEqual(["project state status", "project_state_status"]);
    expect(names("project.state.recover")).toEqual(["project state recover", "project_state_recover"]);
    expect(names("work.item.resolve")).toEqual(["work item resolve", "work_item_resolve"]);
    expect(NAME_CATALOG.some((item) => item.newCli.startsWith("project register "))).toBe(false);
    const outcomes = Object.fromEntries(NAME_OWNER_DECISIONS.map((decision) => [decision.id, decision.outcome]));
    expect(outcomes).toEqual({
      "ND-01": "accepted",
      "ND-02": "accepted",
      "ND-03": "changed",
      "ND-04": "accepted",
      "ND-05": "changed",
      "ND-06": "accepted",
      "ND-07": "changed",
      "ND-08": "accepted",
      "ND-09": "changed",
      "ND-10": "accepted",
    });
    for (const decision of NAME_OWNER_DECISIONS) {
      expect(decision.decidedOn, decision.id).toBe("2026-11-22");
      expect(Boolean(decision.proposed), decision.id).toBe(decision.outcome === "changed");
    }
  });

  it("lists only end words that are verbs or documented exceptions, and only words the catalog uses", () => {
    const exceptions = NAME_END_WORDS.filter((word) => word.form === "exception");
    expect(exceptions.map((word) => word.word)).toEqual(["lookup", "next", "status"]);
    for (const word of NAME_END_WORDS) {
      expect(Boolean(word.note), word.word).toBe(word.form === "exception");
    }
    const words = NAME_END_WORDS.map((word) => word.word);
    expect(new Set(words).size).toBe(words.length);
    const used = new Set(NAME_CATALOG.filter((item) => item.group !== "check").map((item) => item.newCli.split(" ").at(-1)!));
    expect(words.filter((word) => !used.has(word))).toEqual([]);
  });

  it("puts only read-only registry operations in `check`", () => {
    const checks = NAME_CATALOG.filter((item) => item.group === "check");
    expect(checks).toHaveLength(8);
    const operations = new Map(listOperations().map((operation) => [operation.id, operation]));
    for (const item of checks) expect(operations.get(item.id)?.mutates, item.id).toBe("read");
  });

  it("agrees with the W29 R0 P1 work store operation list", () => {
    for (const operation of WORK_STORE_OPERATIONS) {
      expect([`make-docs ${find(operation.id).newCli}`, find(operation.id).newMcp]).toEqual([operation.cli, operation.mcp]);
    }
  });

  describe("PRD command lists match the catalog", () => {
    it("PRD 52 Operations table", () => expect(PRD_LISTS.prd52(PRD_52)).toEqual([]));
    it("PRD 53 Operations table", () => expect(PRD_LISTS.prd53(PRD_53)).toEqual([]));
    it("PRD 39 R-DOCTOR table", () => expect(PRD_LISTS.doctor(PRD_39)).toEqual([]));
    it("PRD 39 R-STORE-CMD table", () => expect(PRD_LISTS.storeCmd(PRD_39)).toEqual([]));
    it("PRD 39 R-RUN-4", () => expect(PRD_LISTS.rRun4(PRD_39)).toEqual([]));
    it("PRD 39 R-RUN-1", () => expect(PRD_LISTS.rRun1(PRD_39)).toEqual([]));
    it("PRD 25 R-MCP-PROFILE tool names", () => expect(PRD_LISTS.mcpProfiles(PRD_25)).toEqual([]));
    it("PRD 51 R-BACKLOG-APP-1 paths", () => expect(PRD_LISTS.backlogApp(PRD_51)).toEqual([]));

    it("reads every row of each table", () => {
      expect(parsePrdOperationTable(markdownSection(PRD_52, "### Operations"))).toHaveLength(9);
      expect(parsePrdGroupedOperationTable(markdownSection(PRD_53, "### Operations"))).toHaveLength(10);
    });
  });
});

describe("W33 R0 P1 name catalog fails on broken fixtures", () => {
  it("accepts the clean fixture", () => {
    expect(validateNameCatalog([fixture({})])).toEqual([]);
  });

  it("R-NAME-1: a group outside R-TOP-1, a path outside its group, or a group word inside another group", () => {
    expect(rulesFor([fixture({ group: "run" as never, newCli: "run work fixture add" })])).toContain("R-NAME-1");
    expect(rulesFor([fixture({ group: "work", newCli: "backlog fixture add" })])).toContain("R-NAME-1");
    expect(rulesFor([fixture({ newCli: "work backlog snapshot" })])).toContain("R-NAME-1");
  });

  it("R-NAME-2: bad words, no final verb, or a verb at the end of a `check` path", () => {
    expect(rulesFor([fixture({ newCli: "work Fixture add" })])).toContain("R-NAME-2");
    expect(rulesFor([fixture({ newCli: "work fixture_x add" })])).toContain("R-NAME-2");
    expect(rulesFor([fixture({ newCli: "work fixture" })])).toContain("R-NAME-2");
    expect(rulesFor([fixture({ newCli: "work" })])).toContain("R-NAME-2");
    expect(rulesFor([fixture({ group: "check", newCli: "check fixture validate" })])).toContain("R-NAME-2");
  });

  it("R-NAME-3: an MCP name that is not the path with underscores", () => {
    expect(rulesFor([fixture({ newMcp: "fixture_add" })])).toContain("R-NAME-3");
    expect(rulesFor([fixture({ newMcp: "work-fixture-add" })])).toContain("R-NAME-3");
  });

  it("R-NAME-4: a name longer than 26 characters", () => {
    expect(rulesFor([fixture({ newCli: "work fixture-with-long-words add" })])).toContain("R-NAME-4");
  });

  it("a duplicate CLI path or MCP name", () => {
    const first = fixture({});
    expect(rulesFor([first, fixture({ id: "work.fixture.other" })])).toEqual(
      expect.arrayContaining(["duplicate-cli", "duplicate-mcp"]),
    );
    // `work fixture-add` and `work fixture add` differ as paths but share one MCP name.
    expect(rulesFor([first, fixture({ id: "work.fixture-add.x", newCli: "work fixture-add" })])).toContain("duplicate-mcp");
    expect(rulesFor([first, first])).toContain("shape");
  });

  it("a new name that is another entry's old name", () => {
    const old = fixture({ id: "work.old.add", status: "current", plannedBy: undefined, currentCli: "run work old add", currentMcp: "work_fixture_add", newCli: "work old add" });
    expect(rulesFor([fixture({}), old])).toContain("alias-collision");
  });

  it("one operation family split across two groups", () => {
    expect(
      rulesFor([fixture({}), fixture({ id: "work.fixture.close", group: "backlog", newCli: "backlog fixture close" })]),
    ).toContain("family-split");
  });

  it("a full command that also starts a longer command", () => {
    expect(
      rulesFor([fixture({ newCli: "work fixture add" }), fixture({ id: "work.fixture-x.add", newCli: "work fixture add list" })]),
    ).toContain("prefix-collision");
  });

  it("a `check` entry that writes or that the registry does not hold", () => {
    const sources = realSources();
    const writes: NameCatalogSources = {
      ...sources,
      mutatesByOperation: new Map([...sources.mutatesByOperation, ["prd.authority.validate", "write"]]),
    };
    expect(checkNameCatalogCoverage(NAME_CATALOG, writes)).toEqual([
      "Check entry prd.authority.validate is not a read-only registry operation.",
    ]);
    const plannedCheck = fixture({ id: "check.fixture.thing", group: "check", newCli: "check fixture" });
    expect(checkNameCatalogCoverage([...NAME_CATALOG, plannedCheck], sources)).toEqual([
      "Check entry check.fixture.thing is not a read-only registry operation.",
    ]);
  });

  it("a path that takes the place of a command outside the registry", () => {
    expect(rulesFor([fixture({ id: "setup.skills.list", group: "setup", newCli: "setup skills list" })])).toContain(
      "non-registry-collision",
    );
  });

  it("a shortened path with no reason, a shortening that is not forced, an MCP-only tool with no reason, or an unknown decision", () => {
    expect(rulesFor([fixture({ unshortenedCli: "work fixture-with-long-words add" })])).toContain("missing-reason");
    expect(rulesFor([fixture({ unshortenedCli: "work fixture add", reason: "x" })])).toContain("shortening-not-forced");
    expect(rulesFor([fixture({ cliCommand: false })])).toContain("missing-reason");
    expect(rulesFor([fixture({ decision: "ND-99" })])).toContain("unknown-decision");
  });

  it("coverage: a missing or extra operation, a missing or extra tool, a planned entry that landed, or a changed current name", () => {
    const sources = realSources();
    const without = (id: string) => NAME_CATALOG.filter((item) => item.id !== id);
    expect(checkNameCatalogCoverage(without("lifecycle.start"), sources)).toEqual([
      "Registry operation lifecycle.start has no catalog entry.",
    ]);
    expect(checkNameCatalogCoverage(without("manifest"), sources)).toEqual(["Hand-defined tool manifest has no catalog entry."]);
    const extraOperation = fixture({ id: "work.ghost.add", status: "current", plannedBy: undefined, currentCli: "run work ghost add", currentMcp: "ghost", newCli: "work ghost add" });
    expect(checkNameCatalogCoverage([...NAME_CATALOG, extraOperation], sources)).toEqual([
      "Catalog operation work.ghost.add is current but not in the registry.",
    ]);
    const extraTool = { ...find("manifest"), id: "ghost_tool", currentMcp: "ghost_tool", newCli: "setup ghost read", newMcp: "setup_ghost_read" };
    expect(checkNameCatalogCoverage([...NAME_CATALOG, extraTool], sources)).toEqual([
      "Catalog tool ghost_tool is not a hand-defined MCP tool.",
    ]);
    const landed: NameCatalogSources = { ...sources, registeredOperationIds: [...sources.registeredOperationIds, "work.queue.next"] };
    expect(checkNameCatalogCoverage(NAME_CATALOG, landed)).toContain(
      "Catalog operation work.queue.next is planned but the registry holds it. Mark it current.",
    );
    const renamed = NAME_CATALOG.map((item) => (item.id === "lifecycle.show" ? { ...item, currentMcp: "show" } : item));
    expect(checkNameCatalogCoverage(renamed, sources)).toEqual([
      "lifecycle.show: catalog current MCP `show` differs from the server `lifecycle_show`.",
    ]);
  });

  it("a PRD 52 list that differs: a changed path, a changed tool, or a missing row", () => {
    expect(PRD_LISTS.prd52(PRD_52.replace("`make-docs work next`", "`make-docs work queue next`"))).toEqual([
      "PRD 52 Operations gives work.queue.next the path `work queue next`; the catalog has `work next`.",
    ]);
    expect(PRD_LISTS.prd52(PRD_52.replace("| `work_add` |", "| `work_item_add` |"))).toEqual([
      "PRD 52 Operations gives work.queue.add the tool `work_item_add`; the catalog has `work_add`.",
    ]);
    const withoutAdd = PRD_52.split("\n").filter((line) => !line.startsWith("| `work.queue.add`")).join("\n");
    expect(PRD_LISTS.prd52(withoutAdd)).toEqual(["PRD 52 Operations misses work.queue.add, which the catalog has."]);
  });

  it("a PRD 53 list that differs: a dropped grouped operation or an unknown one", () => {
    const dropped = PRD_53.replace("`factory.workflow.save`, `.show`, `.list` | `make-docs factory workflow save \\| show \\| list`", "`factory.workflow.save`, `.show` | `make-docs factory workflow save \\| show`");
    expect(dropped).not.toBe(PRD_53);
    expect(PRD_LISTS.prd53(dropped)).toEqual(["PRD 53 Operations misses factory.workflow.list, which the catalog has."]);
    const unknown = PRD_53.replace("`factory.restore` | `make-docs factory restore`", "`factory.reset` | `make-docs factory reset`");
    expect(PRD_LISTS.prd53(unknown)).toEqual([
      "PRD 53 Operations lists factory.reset, which the catalog does not have.",
      "PRD 53 Operations misses factory.restore, which the catalog has.",
    ]);
  });

  it("a PRD 39 R-DOCTOR or R-STORE-CMD table that differs", () => {
    expect(PRD_LISTS.doctor(PRD_39.replace("`make-docs project doctor fix --review", "`make-docs project doctor repair --review"))).toEqual([
      "PRD 39 R-DOCTOR gives project.doctor.fix the path `project doctor repair`; the catalog has `project doctor fix`.",
    ]);
    expect(PRD_LISTS.storeCmd(PRD_39.replace("`make-docs project list [--json]`", "`make-docs project register list [--json]`"))).toEqual([
      "PRD 39 R-STORE-CMD gives project.register.list the path `project register list`; the catalog has `project list`.",
    ]);
  });

  it("a PRD 39 R-RUN-4 list that differs", () => {
    expect(PRD_LISTS.rRun4(PRD_39.replace(", and `work.queue.add`, with CLI paths", ", with CLI paths"))).toEqual([
      "R-RUN-4 misses work.queue.add, which the catalog has.",
    ]);
    expect(PRD_LISTS.rRun4(PRD_39.replace("for example `factory_workflow_save`", "for example `factory_flow_save`"))).toEqual([
      "R-RUN-4 example `factory_flow_save` is not a catalog MCP name.",
    ]);
  });

  it("a PRD 39 R-RUN-1 list that differs", () => {
    expect(PRD_LISTS.rRun1(PRD_39.replace("`backlog-cache lookup`, and `backlog-cache write`", "and `backlog-cache lookup`"))).toEqual([
      "R-RUN-1 misses active `run work backlog-cache write`.",
    ]);
    expect(PRD_LISTS.rRun1(PRD_39.replace("`item resolve`, `evidence record`", "`item resolve`, `item delete`, `evidence record`"))).toEqual([
      "R-RUN-1 lists active `run work item delete`, which the registry does not have.",
    ]);
    expect(PRD_LISTS.rRun1(PRD_39.replace("`export`, and `add`, and planned `factory`", "and `export`, and planned `factory`"))).toEqual([
      "R-RUN-1 misses planned `work add`.",
    ]);
  });

  it("a PRD 25 R-MCP-PROFILE line with a name the catalog does not have", () => {
    expect(PRD_LISTS.mcpProfiles(PRD_25.replace("`project_list` and `setup_store_check` read only", "`project_register_list` and `setup_store_check` read only"))).toEqual([
      "R-MCP-PROFILE-10 names the tool `project_register_list`, which is not a current or new catalog name.",
    ]);
    expect(PRD_LISTS.mcpProfiles(PRD_25.replace("includes `work.backlog.snapshot`", "includes `work.backlog.snap`"))).toEqual([
      "R-MCP-PROFILE-5 names the operation `work.backlog.snap`, which the catalog does not have.",
    ]);
  });

  it("a PRD 51 R-BACKLOG-APP-1 path that differs", () => {
    expect(PRD_LISTS.backlogApp(PRD_51.replace("`make-docs backlog cache lookup`", "`make-docs backlog-cache lookup`"))).toEqual([
      "R-BACKLOG-APP-1 names `backlog-cache lookup`, which is not a catalog `backlog` path.",
      "R-BACKLOG-APP-1 misses `backlog cache lookup`.",
    ]);
  });
});
