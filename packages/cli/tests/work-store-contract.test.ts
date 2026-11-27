import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  WORK_CONFLICT_KINDS,
  WORK_COORDINATE_PATTERNS,
  WORK_LOCAL_TRACKER_CONNECTION,
  WORK_CLAIM_POLICY,
  WORK_CLAIM_TTL_BOUNDS,
  WORK_DEPENDENCY_PATTERNS,
  WORK_PARENT_KINDS,
  WORK_RECORDED_STATUS_MAP,
  WORK_SETTLE_OPTIONS,
  WORK_STORE_AGENT_RESOURCE,
  WORK_STORE_AGENT_SECTIONS,
  WORK_STORE_CHECKPOINT_OPERATION,
  WORK_STORE_FIELD_REGISTER,
  WORK_STORE_OPERATIONS,
  WORK_STORE_RESOURCE_READ_OPERATION,
  WORK_STORE_RULES,
  WORK_PROJECT_URI_FAMILIES,
  WORK_PROJECT_URI_PREFIX,
  isValidWorkProjectName,
  parseWorkProjectUri,
  WORK_COORDINATE_PATTERNS as COORDINATE_PATTERNS,
  WORK_SYNC_FILE_STATES,
  WORK_SYNC_STORE_STATES,
  WORK_SYNC_TABLE,
  WORK_UNIT_KINDS,
  WORK_WAIT_REASONS,
  WORK_WAIT_REASON_TEXT,
  WorkClaimRecordSchema,
  WorkClaimRequestSchema,
  WorkCloseRequestSchema,
  WorkConfigBlockSchema,
  WorkAddRequestSchema,
  WorkReleaseRequestSchema,
  WorkReportRequestSchema,
  WorkSettleRequestSchema,
  WorkSyncConflictRecordSchema,
  WorkSyncLedgerEntrySchema,
  WorkTrackerConnectionSchema,
  WorkUnitRecordSchema,
  workStoreRuleCatalogDigest,
  type WorkSyncDecision,
  type WorkSyncFileState,
  type WorkSyncStoreState,
} from "../src/operations/work/work-store";
import { PACKAGE_ROOT } from "../src/utils";
import {
  WORK_STORE_CONTRACT_FIXTURES,
  WORK_CHECKPOINT_SCENARIOS,
  WORK_STORE_FIXTURE_GROUPS,
  WORK_REPORT_SCENARIOS,
  WORK_SYNC_SCENARIOS,
  storeIdFor,
  unit,
} from "./fixtures/work-store-contract";

const REPO_ROOT = path.resolve(PACKAGE_ROOT, "../..");
const PRD_52 = readFileSync(path.join(REPO_ROOT, "docs/prd/52-work-store-and-work-queue.md"), "utf8");
const PRD_38 = readFileSync(path.join(REPO_ROOT, "docs/prd/38-global-store-and-project-state.md"), "utf8");

function matchingRows(file: WorkSyncFileState, store: WorkSyncStoreState, projection: "on" | "off") {
  return WORK_SYNC_TABLE.filter(
    (row) =>
      row.file === file &&
      (row.store === "any" || row.store === store) &&
      (row.projection === "any" || row.projection === projection),
  );
}

function lookupDecision(file: WorkSyncFileState, store: WorkSyncStoreState, projection: "on" | "off"): WorkSyncDecision {
  const rows = matchingRows(file, store, projection);
  expect(rows, `${file}/${store}/${projection}`).toHaveLength(1);
  return rows[0]!.decision;
}

describe("W29 R0 P1 work store rule catalog", () => {
  it("numbers rules in order with unique IDs", () => {
    const ids = WORK_STORE_RULES.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id, index) => expect(id).toBe(`WORK-RULE-${String(index + 1).padStart(3, "0")}`));
  });

  it("gives every rule a CLI form, an agent form, and a current PRD 52 requirement", () => {
    const operationIds = new Set<string>([
      ...WORK_STORE_OPERATIONS.map((operation) => operation.id),
      WORK_STORE_RESOURCE_READ_OPERATION,
      // W35 R0 P1: the project checkpoint runs the work rules, and its rules name it.
      WORK_STORE_CHECKPOINT_OPERATION,
    ]);
    for (const rule of WORK_STORE_RULES) {
      expect(rule.cliForm.length, rule.id).toBeGreaterThan(0);
      rule.cliForm.forEach((operation) => expect(operationIds.has(operation), `${rule.id} ${operation}`).toBe(true));
      const [resource, section] = rule.agentForm.split("#");
      expect(resource).toBe(WORK_STORE_AGENT_RESOURCE);
      expect(WORK_STORE_AGENT_SECTIONS).toContain(section);
      expect(rule.prdRequirements.length, rule.id).toBeGreaterThan(0);
      rule.prdRequirements.forEach((requirement) =>
        expect(PRD_52, `${rule.id} cites ${requirement}`).toContain(`- ${requirement} (MUST`),
      );
      expect(rule.humanMeaning.trim().length).toBeGreaterThan(0);
    }
  });

  it("names every operation with its work command path and MCP tool", () => {
    for (const operation of WORK_STORE_OPERATIONS) {
      const verb = operation.id.split(".").at(-1);
      expect(operation.cli).toBe(`make-docs work ${verb}`);
      expect(operation.mcp).toBe(`work_${verb}`);
      expect(PRD_52).toContain(`\`${operation.id}\``);
    }
  });

  it("has a stable digest", () => {
    const digest = workStoreRuleCatalogDigest();
    expect(digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(workStoreRuleCatalogDigest()).toBe(digest);
  });
});

describe("W29 R0 P1 sync table", () => {
  it("gives exactly one decision for every file, store, and copy setting", () => {
    for (const file of WORK_SYNC_FILE_STATES) {
      for (const store of WORK_SYNC_STORE_STATES) {
        for (const projection of ["on", "off"] as const) {
          expect(matchingRows(file, store, projection), `${file}/${store}/${projection}`).toHaveLength(1);
        }
      }
    }
  });

  it("never writes or removes a file that a person changed", () => {
    for (const row of WORK_SYNC_TABLE.filter((candidate) => candidate.file === "changed" || candidate.file === "new")) {
      expect(["import", "conflict"]).toContain(row.decision);
    }
  });

  it("never removes a shared file because the store lost its work", () => {
    for (const store of ["none"] as const) {
      expect(lookupDecision("unchanged", store, "on")).toBe("conflict");
      expect(lookupDecision("changed", store, "on")).toBe("conflict");
    }
  });

  it("keeps an accepted deletion settled in every checkout", () => {
    for (const projection of ["on", "off"] as const) {
      expect(lookupDecision("missing", "removed", projection)).toBe("none");
      expect(lookupDecision("absent", "removed", projection)).toBe("none");
      expect(lookupDecision("unchanged", "removed", projection)).toBe("remove-copy");
      expect(lookupDecision("changed", "removed", projection)).toBe("conflict");
      expect(lookupDecision("new", "removed", projection)).toBe("conflict");
    }
  });

  it("names a conflict kind only on conflict rows, with two settle choices for each kind", () => {
    for (const row of WORK_SYNC_TABLE) {
      expect(row.conflictKind === null, `${row.file}/${row.store}`).toBe(row.decision !== "conflict");
    }
    for (const kind of WORK_CONFLICT_KINDS) {
      const choices = WORK_SETTLE_OPTIONS[kind].map((option) => option.choice);
      // A `claimed` conflict (W29 R0 P4 re-check finding 4) has one settle choice, --keep-store; its other
      // choice is `make-docs work release` for each claimed unit, which the conflict report names.
      expect(new Set(choices).size, kind).toBe(kind === "claimed" ? 1 : 2);
      if (kind === "claimed") expect(choices).toEqual(["keep-store"]);
      WORK_SETTLE_OPTIONS[kind].forEach((option) =>
        expect(option.command).toBe(`make-docs work sync --settle <path> --${option.choice}`),
      );
    }
  });
});

describe("W29 R0 P1 readiness words and claim policy", () => {
  it("has words and a next action for every wait reason", () => {
    for (const reason of WORK_WAIT_REASONS) {
      const entry = WORK_WAIT_REASON_TEXT[reason];
      expect(entry.reason).toBe(reason);
      expect(entry.template).toMatch(/\.$/);
      expect(entry.nextAction.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps claim timing inside its bounds", () => {
    expect(WORK_CLAIM_POLICY.minTtlSeconds).toBe(WORK_CLAIM_TTL_BOUNDS.minSeconds);
    expect(WORK_CLAIM_POLICY.maxTtlSeconds).toBe(WORK_CLAIM_TTL_BOUNDS.maxSeconds);
    expect(WORK_CLAIM_POLICY.minTtlSeconds).toBeGreaterThanOrEqual(2 * WORK_CLAIM_POLICY.checkEverySeconds);
    expect(WORK_CLAIM_POLICY.defaultTtlSeconds).toBeGreaterThanOrEqual(WORK_CLAIM_POLICY.minTtlSeconds);
    expect(WORK_CLAIM_POLICY.defaultTtlSeconds).toBeLessThanOrEqual(WORK_CLAIM_POLICY.maxTtlSeconds);
  });

  it("describes every dependency bullet pattern with an example", () => {
    for (const pattern of WORK_DEPENDENCY_PATTERNS) {
      expect(pattern.description.trim().length).toBeGreaterThan(0);
      expect(pattern.examples.length).toBeGreaterThan(0);
    }
  });

  it("maps every recorded status once and keeps close outcomes consistent", () => {
    const seen = WORK_RECORDED_STATUS_MAP.flatMap((mapping) => mapping.recorded.map((value) => value.toLowerCase()));
    expect(new Set(seen).size).toBe(seen.length);
    for (const mapping of WORK_RECORDED_STATUS_MAP) {
      expect(mapping.status === "closed").toBe(mapping.closeOutcome !== null);
    }
  });

  it("keeps parent kinds and coordinate patterns in step", () => {
    for (const kind of WORK_UNIT_KINDS) {
      expect(WORK_COORDINATE_PATTERNS[kind]).toBeInstanceOf(RegExp);
      WORK_PARENT_KINDS[kind].forEach((parent) => expect(WORK_UNIT_KINDS).toContain(parent));
    }
    expect(WORK_PARENT_KINDS.task).toEqual(["stage", "phase"]);
    expect(() => WorkUnitRecordSchema.parse(unit("task", "W1 R0 P2 T1"))).not.toThrow();
    expect(() => WorkUnitRecordSchema.parse(unit("task", "W1 R0 P2 T1", { parent: "W1 R0 P2 S1" }))).not.toThrow();
    expect(WorkUnitRecordSchema.safeParse({ ...unit("phase", "W1 R0 P2"), coordinate: "W1 R0" }).success).toBe(false);
    expect(WorkUnitRecordSchema.safeParse({ ...unit("phase", "W1 R0 P2"), closeOutcome: "done" }).success).toBe(false);
    expect(WorkUnitRecordSchema.safeParse({ ...unit("phase", "W1 R0 P2"), sourcePath: null }).success).toBe(false);
    expect(WorkUnitRecordSchema.safeParse(unit("quick-item", "3")).success).toBe(true);
  });

  it("accepts the local connection as the only current tracker connection", () => {
    const connection = WorkTrackerConnectionSchema.parse(WORK_LOCAL_TRACKER_CONNECTION);
    expect(connection.operations).toEqual(["next", "claim", "report", "close"]);
    expect(WorkConfigBlockSchema.parse({})).toEqual({ projection: "on", syncHold: [], tracker: { connection: "local" } });
    expect(WorkConfigBlockSchema.safeParse({ tracker: { connection: "local", fieldMap: { unit: "token_count" } } }).success).toBe(true);
  });
});

describe("W29 R0 P1 fixture matrix", () => {
  it("covers every rule and every fixture group", () => {
    const ruleIds = new Set(WORK_STORE_RULES.map((rule) => rule.id));
    const covered = new Set(WORK_STORE_CONTRACT_FIXTURES.flatMap((fixture) => fixture.rules));
    for (const id of ruleIds) expect(covered.has(id), `${id} has a parity fixture`).toBe(true);
    for (const id of covered) expect(ruleIds.has(id), `${id} exists`).toBe(true);
    const groups = new Set(WORK_STORE_CONTRACT_FIXTURES.map((fixture) => fixture.group));
    for (const group of WORK_STORE_FIXTURE_GROUPS) expect(groups.has(group), group).toBe(true);
    const ids = WORK_STORE_CONTRACT_FIXTURES.map((fixture) => fixture.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("states inputs and expected results that match the contract", () => {
    for (const fixture of WORK_STORE_CONTRACT_FIXTURES) {
      switch (fixture.kind) {
        case "readiness": {
          fixture.input.units.forEach((record) => WorkUnitRecordSchema.parse(record));
          fixture.input.claims.forEach((record) => WorkClaimRecordSchema.parse(record));
          fixture.input.conflicts.forEach((record) => WorkSyncConflictRecordSchema.parse(record));
          const byCoordinate = new Map(fixture.input.units.map((record) => [record.coordinate, record]));
          for (const coordinate of fixture.expected.ready) {
            expect(byCoordinate.get(coordinate)?.status, `${fixture.id} ${coordinate}`).not.toBe("closed");
          }
          for (const waiting of fixture.expected.waiting) {
            expect(byCoordinate.has(waiting.coordinate), `${fixture.id} ${waiting.coordinate}`).toBe(true);
            expect(waiting.reasons.length).toBeGreaterThan(0);
            waiting.reasons.forEach((reason) => expect(WORK_WAIT_REASONS).toContain(reason));
            expect(fixture.expected.ready).not.toContain(waiting.coordinate);
          }
          break;
        }
        case "sync": {
          if (fixture.input.settle) WorkSettleRequestSchema.parse(fixture.input.settle);
          expect(fixture.expected.decisions).toHaveLength(fixture.input.cases.length);
          fixture.input.cases.forEach((item, index) =>
            expect(lookupDecision(item.file, item.store, item.projection), `${fixture.id} ${item.path}`).toBe(
              fixture.expected.decisions[index],
            ),
          );
          break;
        }
        case "authority": {
          const expected = fixture.input.store === "usable" && fixture.input.cli ? "store" : "files";
          expect(fixture.expected.mode, fixture.id).toBe(expected);
          break;
        }
        case "claim": {
          fixture.input.units.forEach((record) => WorkUnitRecordSchema.parse(record));
          fixture.input.claims.forEach((record) => WorkClaimRecordSchema.parse(record));
          WorkClaimRequestSchema.parse(fixture.input.request);
          expect(fixture.expected.result === "refused", fixture.id).toBe(fixture.expected.refusal !== null);
          break;
        }
        case "update": {
          fixture.input.units.forEach((record) => WorkUnitRecordSchema.parse(record));
          fixture.input.claims.forEach((record) => WorkClaimRecordSchema.parse(record));
          const request = fixture.input.request;
          if ("report" in request) WorkReportRequestSchema.parse(request.report);
          else if ("close" in request) WorkCloseRequestSchema.parse(request.close);
          else WorkReleaseRequestSchema.parse(request.release);
          const coordinates = new Set(fixture.input.units.map((record) => record.coordinate));
          fixture.expected.readyAfter.forEach((coordinate) => expect(coordinates.has(coordinate), fixture.id).toBe(true));
          expect(fixture.expected.accepted, fixture.id).toBe(fixture.expected.refusal === null);
          break;
        }
        case "round-trip": {
          let records = 0;
          for (const root of fixture.input.roots) {
            const absolute = path.join(REPO_ROOT, root);
            expect(existsSync(absolute), root).toBe(true);
            records += readdirSync(absolute).filter((name) => /^\d{4}-\d{2}-\d{2}-w\d+-r\d+-/.test(name)).length;
          }
          expect(records).toBeGreaterThanOrEqual(fixture.expected.minimumRecords);
          break;
        }
        case "dependency": {
          const existing = new Set(fixture.input.existing);
          fixture.expected.dependencies.forEach((coordinate) => expect(existing.has(coordinate), fixture.id).toBe(true));
          fixture.expected.unresolved.forEach((coordinate) => expect(existing.has(coordinate), fixture.id).toBe(false));
          const kinds = [
            fixture.expected.dependencies.length + fixture.expected.unresolved.length > 0,
            fixture.expected.gate,
            fixture.expected.reference,
            fixture.expected.none,
          ].filter(Boolean);
          expect(kinds, fixture.id).toHaveLength(1);
          break;
        }
        case "operations": {
          const syncFirst = WORK_STORE_RULES.find((rule) => rule.id === "WORK-RULE-013");
          expect(syncFirst?.cliForm).toEqual(WORK_STORE_OPERATIONS.map((operation) => operation.id));
          break;
        }
        case "add": {
          fixture.input.units.forEach((record) => WorkUnitRecordSchema.parse(record));
          WorkAddRequestSchema.parse(fixture.input.request);
          const highest = Math.max(
            0,
            ...fixture.input.units
              .filter((record) => record.kind === "quick-item")
              .map((record) => Number(record.coordinate)),
          );
          expect(fixture.expected.coordinate, fixture.id).toBe(`${highest + 1}`);
          expect(COORDINATE_PATTERNS["quick-item"].test(fixture.expected.coordinate)).toBe(true);
          break;
        }
        case "project-uri": {
          expect(fixture.expected.canonical).toHaveLength(fixture.input.uris.length);
          fixture.input.uris.forEach((uri, index) => {
            const parsed = parseWorkProjectUri(uri);
            const expected = fixture.expected.canonical[index];
            expect(parsed.ok ? parsed.canonical : null, `${fixture.id} ${uri}`).toBe(expected);
            if (parsed.ok) expect(parseWorkProjectUri(parsed.canonical), `${fixture.id} canonical`).toEqual(parsed);
          });
          break;
        }
        case "config": {
          expect(WorkConfigBlockSchema.safeParse(fixture.input.work).success, fixture.id).toBe(fixture.expected.valid);
          break;
        }
        case "report-scenario": {
          expect(WORK_REPORT_SCENARIOS, fixture.id).toContain(fixture.input.scenario);
          if (!fixture.expected.accepted) {
            expect(fixture.expected.latestNote, fixture.id).toBeNull();
            expect(fixture.expected.storeOnlyEditKinds, fixture.id).toEqual([]);
          }
          break;
        }
        case "checkpoint-scenario": {
          expect(WORK_CHECKPOINT_SCENARIOS, fixture.id).toContain(fixture.input.scenario);
          // The sync step ran, or the result says why it did not.
          expect(fixture.expected.syncRan, fixture.id).toBe(fixture.expected.syncSkipped === null);
          if (fixture.expected.authority !== "store") expect(fixture.expected.syncRan, fixture.id).toBe(false);
          // A quiet run has nothing due, and a run with a change or a waiting file has something due.
          if (fixture.expected.quiet) expect(fixture.expected.nothingDue, fixture.id).toBe(true);
          const due = fixture.expected.imported + fixture.expected.written + fixture.expected.waiting + fixture.expected.conflicts;
          expect(fixture.expected.nothingDue, fixture.id).toBe(due === 0);
          break;
        }
        case "sync-scenario": {
          expect(WORK_SYNC_SCENARIOS, fixture.id).toContain(fixture.input.scenario);
          if (fixture.expected.conflictKind !== null) {
            expect(fixture.expected.action, fixture.id).toBe("conflict");
            expect(WORK_CONFLICT_KINDS).toContain(fixture.expected.conflictKind);
          }
          break;
        }
      }
    }
  });

  it("derives readable, valid store IDs from coordinates", () => {
    expect(storeIdFor("W1 R0 P2")).toBe("wu-w1r0p2xx");
    // W29 R0 P2 found that zero padding gave W1 R0 P1 and W1 R0 P10 the same ID.
    expect(storeIdFor("W1 R0 P1")).not.toBe(storeIdFor("W1 R0 P10"));
    expect(() => WorkSyncLedgerEntrySchema.parse({
      targetPath: "docs/work/a/01.md",
      unitStoreIds: [storeIdFor("W1 R0 P2")],
      digestAlgorithm: "sha256",
      lastAppliedDigest: "d".repeat(64),
      storeRevision: 1,
      syncedAt: "2042-06-15T12:00:00.000Z",
      checkoutId: "aurora-notes-checkout-1",
    })).not.toThrow();
    expect(WorkSyncLedgerEntrySchema.safeParse({
      targetPath: "docs/work/a/01.md",
      unitStoreIds: [storeIdFor("W1 R0 P2")],
      digestAlgorithm: "sha256",
      lastAppliedDigest: null,
      storeRevision: 1,
      syncedAt: "2042-06-15T12:00:00.000Z",
      checkoutId: "aurora-notes-checkout-1",
    }).success).toBe(false);
  });
});

describe("W29 R0 P1 field register", () => {
  const schemas = {
    WorkUnitRecord: WorkUnitRecordSchema,
    WorkSyncLedgerEntry: WorkSyncLedgerEntrySchema,
    WorkSyncConflictRecord: WorkSyncConflictRecordSchema,
    WorkClaimRecord: WorkClaimRecordSchema,
    WorkConfigBlock: WorkConfigBlockSchema,
  } as const;

  it("ties every contract field to its PRD 38 R-MIN row", () => {
    const rows = PRD_38.split("\n").filter((line) => line.startsWith("| "));
    for (const entry of WORK_STORE_FIELD_REGISTER) {
      const matches = rows.filter((line) => line.startsWith(`| ${entry.rowLabel}`));
      expect(matches, entry.rowLabel).toHaveLength(1);
      const rowText = matches[0]!.split(" | ")[0]!;
      const shapeKeys = Object.keys(schemas[entry.schema].shape).sort();
      expect(Object.keys(entry.fields).sort(), entry.schema).toEqual(shapeKeys);
      for (const [field, phrase] of Object.entries(entry.fields)) {
        expect(rowText, `${entry.schema}.${field}`).toContain(phrase);
      }
    }
  });
});

describe("W29 R0 P1 quick items and project URIs", () => {
  it("keeps quick items in the store only", () => {
    expect(WorkUnitRecordSchema.safeParse(unit("quick-item", "4", { sourcePath: "docs/work/quick/4.md" })).success).toBe(false);
    expect(WorkAddRequestSchema.safeParse({ title: " ", body: null, links: [] }).success).toBe(false);
    expect(WorkAddRequestSchema.safeParse({ title: "Plan the trip", body: null, links: [], coordinate: "3" }).success).toBe(false);
  });

  it("names the project in every project URI", () => {
    expect(WORK_PROJECT_URI_PREFIX).toBe("make-docs://project/");
    // W30 R0 P3 made the factory family current (PRD 52 R-WORK-URI-1); PRD 53 R-FACTORY-66 owns its paths.
    expect(WORK_PROJECT_URI_FAMILIES).toEqual(["tasks", "backlog", "factory"]);
    expect(PRD_52).toContain("The current families are `tasks`, `backlog`, and `factory`.");
    for (const family of WORK_PROJECT_URI_FAMILIES) {
      if (family !== "factory") expect(PRD_52).toContain(`make-docs://project/<project>/${family}/`);
      expect(parseWorkProjectUri(`make-docs://project/${family}/`).ok).toBe(false);
    }
    const parsed = parseWorkProjectUri("make-docs://project/make-docs/backlog/W29/R0/P1/T3");
    expect(parsed).toMatchObject({ ok: true, project: { kind: "name", value: "make-docs" } });
    expect(parsed.ok && parsed.target).toEqual({ family: "backlog", coordinate: "W29 R0 P1 T3", isList: false });
  });

  it("accepts short readable project names and refuses project ID look-alikes", () => {
    for (const name of ["make-docs", "paper", "ursa", "a", "w29-notes"]) expect(isValidWorkProjectName(name), name).toBe(true);
    for (const name of ["Make-Docs", "-docs", "docs-", "2fast", "my_docs", "a".repeat(65), "831ddb50-b97a-47e2-9f2c-f491b27b8759"]) {
      expect(isValidWorkProjectName(name), name).toBe(false);
    }
  });

  it("uses an upper-case T in every canonical task coordinate", () => {
    expect(WORK_COORDINATE_PATTERNS.task.test("W1 R0 P2 T1")).toBe(true);
    expect(WORK_COORDINATE_PATTERNS.task.test("W1 R0 P2 t1")).toBe(false);
  });
});
