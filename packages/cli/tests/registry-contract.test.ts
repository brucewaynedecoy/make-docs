import { describe, expect, it } from "vitest";
import {
  createExecutionContext,
  OperationPendingError,
  OperationWriteDeniedError,
} from "../src/operations/context";
import {
  ADMITTED_OPERATION_IDS,
  getOperation,
  hasOperation,
  invokeOperation,
  LEGACY_COMPATIBILITY_OPERATION_IDS,
  listAdmittedOperations,
  listOperations,
  OPERATION_ID_PATTERN,
} from "../src/operations/registry";

/**
 * R-REG-1 / R-RUN-1 / R-RUN-2 contract pins. The registry is append-only:
 * adding an identifier extends EXPECTED_IDENTIFIERS; removing or renaming an
 * existing identifier is a contract break and must fail here.
 */
const LITERAL_LEGACY_COMPATIBILITY_IDENTIFIERS = [
  "playbook.validate",
  "playbook.catalog",
  "playbook.resolve",
  "playbook.capabilities",
  "playbook.start",
  "playbook.invoke",
  "playbook.status",
  "playbook.next",
  "playbook.advance",
  "playbook.gate",
  "playbook.resume",
  "playbook.close",
  "playbook.run.export",
  "playbook.run.import",
  "package.plan",
  "package.surface-resolve",
  "package.write",
  // Appended by W18 R12 P3 (PRD 41 R-GRAM-3): the composite single-entry
  // packaging operation, registered per the append-only rule.
  "package.ship",
] as const;

const LITERAL_P3_ADMITTED_IDENTIFIERS = [
  "prd.authority.validate",
  "work.item.resolve",
  "work.evidence.record",
  "work.evidence.read",
  "resource.list",
  "resource.read",
  "resource.ensure",
  "project.surface.ensure",
  "lifecycle.start",
  "lifecycle.show",
  "lifecycle.list",
  "lifecycle.checkpoint",
  "lifecycle.pause",
  "lifecycle.resume",
  "lifecycle.attach-evidence",
  "lifecycle.complete",
  "lifecycle.fail",
  "lifecycle.abandon",
  "uat.scenario.validate",
  "uat.persona.resolve",
  "uat.target.validate",
  "uat.evidence-reference.validate",
  "uat.finding.validate",
  "uat.result.validate",
] as const;

const LITERAL_P5_ADMITTED_IDENTIFIERS = ["project.path-hygiene.validate"] as const;

/** Pruned per the migrated-operations inventory disposition (R-RUN-2). */
const PRUNED_SEGMENTS = [
  "wave-resolve",
  "wave-status",
  "work-phase-state",
  "phase-plan",
  "phase-gate",
  "scope-guard",
  "closeout-probe",
  "closeout-validate",
  "closeout-history",
];

describe("operation registry contract", () => {
  it("keeps the frozen 24 P3 admissions and records the separate P5 admission", () => {
    const ids = listOperations()
      .map((operation) => operation.id)
      .sort();
    expect([...LEGACY_COMPATIBILITY_OPERATION_IDS]).toEqual(
      LITERAL_LEGACY_COMPATIBILITY_IDENTIFIERS,
    );
    expect(LITERAL_P3_ADMITTED_IDENTIFIERS).toHaveLength(24);
    const admittedIds = [...ADMITTED_OPERATION_IDS];
    expect(admittedIds.filter((id) => id !== "project.path-hygiene.validate")).toEqual(
      LITERAL_P3_ADMITTED_IDENTIFIERS,
    );
    expect(admittedIds.filter((id) => id === "project.path-hygiene.validate")).toEqual(
      LITERAL_P5_ADMITTED_IDENTIFIERS,
    );
    expect(listAdmittedOperations().map((entry) => entry.id)).toEqual(admittedIds);
    expect(ids).toEqual(
      [
        ...LITERAL_LEGACY_COMPATIBILITY_IDENTIFIERS,
        ...LITERAL_P3_ADMITTED_IDENTIFIERS,
        ...LITERAL_P5_ADMITTED_IDENTIFIERS,
      ].sort(),
    );
    expect(ids).toHaveLength(43);
  });

  it("every identifier follows the domain.verb / domain.object.verb convention", () => {
    for (const operation of listOperations()) {
      expect(operation.id, `identifier ${operation.id}`).toMatch(OPERATION_ID_PATTERN);
      expect(operation.id).toBe(operation.id.toLowerCase());
    }
  });

  it("gives active identifiers one handler and pending identifiers no handler claim", () => {
    for (const operation of listOperations()) {
      const definition = getOperation(operation.id);
      expect(typeof definition.handler, operation.id).toBe(
        operation.status === "active" ? "function" : "undefined",
      );
      expect(["read", "write"], operation.id).toContain(definition.mutates);
      expect(definition.inputSchema, operation.id).toBeDefined();
    }
  });

  it("contains no pruned operation (R-RUN-2)", () => {
    for (const operation of listOperations()) {
      for (const pruned of PRUNED_SEGMENTS) {
        expect(
          operation.id.includes(pruned),
          `pruned operation ${pruned} must not appear in registry (found in ${operation.id})`,
        ).toBe(false);
      }
    }
    expect(hasOperation("lifecycle.checkpoint")).toBe(true);
    expect(hasOperation("closeout.probe")).toBe(false);
  });

  it("contains no tool lifecycle command as an operation (R-SURF-1)", () => {
    const domains = new Set(listOperations().map((operation) => operation.domain));
    for (const lifecycle of ["setup", "mcp", "update", "uninstall"]) {
      expect(domains.has(lifecycle), `lifecycle command ${lifecycle}`).toBe(false);
    }
  });

  it("refuses write operations uniformly without write permission", async () => {
    const context = createExecutionContext({ surface: "test", writesAllowed: false });
    for (const operation of listOperations()) {
      if (operation.mutates !== "write") continue;
      const attempt = invokeOperation(operation.id, {}, context);
      if (operation.status === "pending") {
        await expect(attempt, operation.id).rejects.toBeInstanceOf(OperationPendingError);
      } else {
        await expect(attempt, operation.id).rejects.toBeInstanceOf(OperationWriteDeniedError);
      }
    }
  });

  it("names the owning lineage when refusing a pending identifier", async () => {
    const context = createExecutionContext({ surface: "test", writesAllowed: true });
    for (const operation of listOperations()) {
      if (operation.status !== "pending") continue;
      const attempt = invokeOperation(operation.id, {}, context);
      await expect(attempt, operation.id).rejects.toBeInstanceOf(OperationPendingError);
      await expect(attempt, operation.id).rejects.toMatchObject({
        code: "operation-pending",
        operation: operation.id,
        pendingLineage: operation.pendingLineage,
        handlerAvailable: false,
      });
    }
  });
});
