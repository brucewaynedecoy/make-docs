import { describe, expect, it } from "vitest";
import {
  createExecutionContext,
  OperationPendingError,
  OperationWriteDeniedError,
} from "../src/operations/context";
import {
  getOperation,
  hasOperation,
  invokeOperation,
  listOperations,
  OPERATION_ID_PATTERN,
} from "../src/operations/registry";

/**
 * R-REG-1 / R-RUN-1 / R-RUN-2 contract pins. The registry is append-only:
 * adding an identifier extends EXPECTED_IDENTIFIERS; removing or renaming an
 * existing identifier is a contract break and must fail here.
 */
const EXPECTED_IDENTIFIERS = [
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
  "package.plan",
  "package.surface-resolve",
  "package.write",
  "work.item.resolve",
  "work.evidence.record",
  "work.evidence.read",
] as const;

/** Pruned per the migrated-operations inventory disposition (R-RUN-2). */
const PRUNED_SEGMENTS = [
  "wave-resolve",
  "wave-status",
  "work-phase-state",
  "phase-plan",
  "phase-gate",
  "checkpoint",
  "scope-guard",
  "closeout-probe",
  "closeout-validate",
  "closeout-history",
];

describe("operation registry contract", () => {
  it("registers exactly the retained identifier set", () => {
    const ids = listOperations()
      .map((operation) => operation.id)
      .sort();
    expect(ids).toEqual([...EXPECTED_IDENTIFIERS].sort());
  });

  it("every identifier follows the domain.verb / domain.object.verb convention", () => {
    for (const operation of listOperations()) {
      expect(operation.id, `identifier ${operation.id}`).toMatch(OPERATION_ID_PATTERN);
      expect(operation.id).toBe(operation.id.toLowerCase());
    }
  });

  it("every identifier resolves to a handler with a mutation classification", () => {
    for (const operation of listOperations()) {
      const definition = getOperation(operation.id);
      expect(typeof definition.handler, operation.id).toBe("function");
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
    expect(hasOperation("lifecycle.checkpoint")).toBe(false);
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
      await expect(invokeOperation(operation.id, {}, context), operation.id).rejects.toThrow(
        /W18 R7/,
      );
    }
  });
});
