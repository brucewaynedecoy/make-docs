/** Active W19 R6 support tuple. Historical tuple shapes live in historical-contract.ts. */
import { OperationError } from "../operations/types";
import { z } from "zod";

export const CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS = [
  "scenario",
  "harness",
  "connectionMethod",
  "surface",
  "scope",
  "modelOrProvider",
  "runtime",
] as const;

export type ConformanceSupportTupleDimension =
  (typeof CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS)[number];

export const CONFORMANCE_SCENARIO_FAMILIES = [
  "setup-access/mcp-store-operations",
  "setup-access/bounded-rule-store-operations",
  "setup-access/permission-rule-store-operations",
  "setup-access/direct-resource-read",
] as const;
export type ConformanceScenarioFamily = (typeof CONFORMANCE_SCENARIO_FAMILIES)[number];

export type ConformanceTupleHarness = "codex" | "claude-code";
export type ConformanceTupleConnectionMethod =
  | "mcp"
  | "command-rules"
  | "permission-rules"
  | "direct-cli";
export type ConformanceTupleSurface =
  | "mcp"
  | "cli-command-rules"
  | "cli-permission-rules"
  | "cli-resource";
export type ConformanceTupleScope = "machine" | "project";

/** Every active support claim is exact. Empty values, wildcards, and null are invalid. */
export interface ConformanceSupportTuple {
  scenario: ConformanceScenarioFamily;
  harness: ConformanceTupleHarness;
  connectionMethod: ConformanceTupleConnectionMethod;
  surface: ConformanceTupleSurface;
  scope: ConformanceTupleScope;
  modelOrProvider: string;
  runtime: string;
}

export const conformanceSupportTupleSchema = z.object({
  scenario: z.enum(CONFORMANCE_SCENARIO_FAMILIES),
  harness: z.enum(["codex", "claude-code"]),
  connectionMethod: z.enum(["mcp", "command-rules", "permission-rules", "direct-cli"]),
  surface: z.enum(["mcp", "cli-command-rules", "cli-permission-rules", "cli-resource"]),
  scope: z.enum(["machine", "project"]),
  modelOrProvider: z.string().trim().min(1).refine(value => value !== "*", "wildcards are not active claims"),
  runtime: z.string().trim().min(1).refine(value => value !== "*", "wildcards are not active claims"),
}).strict();

export function validateConformanceSupportTuple(document: unknown): ConformanceSupportTuple {
  const parsed = conformanceSupportTupleSchema.safeParse(document);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(issue => `${issue.path.join(".") || "(tuple)"}: ${issue.message}`)
      .join("; ");
    throw new OperationError(`Active conformance tuple is invalid: ${issues}`);
  }
  assertConformanceTupleCombination(parsed.data);
  return parsed.data;
}

/** Validate cross-field combinations which a plain object schema cannot explain well. */
export function assertConformanceTupleCombination(tuple: ConformanceSupportTuple): void {
  const expectedScenario: Record<ConformanceTupleConnectionMethod, ConformanceScenarioFamily> = {
    mcp: "setup-access/mcp-store-operations",
    "command-rules": "setup-access/bounded-rule-store-operations",
    "permission-rules": "setup-access/permission-rule-store-operations",
    "direct-cli": "setup-access/direct-resource-read",
  };
  const expectedSurface: Record<ConformanceTupleConnectionMethod, ConformanceTupleSurface> = {
    mcp: "mcp",
    "command-rules": "cli-command-rules",
    "permission-rules": "cli-permission-rules",
    "direct-cli": "cli-resource",
  };
  if (tuple.scenario !== expectedScenario[tuple.connectionMethod]) {
    throw new OperationError(
      `Connection method \`${tuple.connectionMethod}\` requires scenario \`${expectedScenario[tuple.connectionMethod]}\`.`,
    );
  }
  if (tuple.surface !== expectedSurface[tuple.connectionMethod]) {
    throw new OperationError(
      `Connection method \`${tuple.connectionMethod}\` requires surface \`${expectedSurface[tuple.connectionMethod]}\`.`,
    );
  }
  if (tuple.connectionMethod === "command-rules" && tuple.harness !== "codex") {
    throw new OperationError("Command rules are a Codex-only support tuple.");
  }
  if (tuple.connectionMethod === "permission-rules" && tuple.harness !== "claude-code") {
    throw new OperationError("Permission rules are a Claude Code-only support tuple.");
  }
}

/** Active tuples are always bound because version 2 does not admit null or wildcard values. */
export function isConformanceTupleBound(tuple: ConformanceSupportTuple): boolean {
  return CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS.every((dimension) => {
    const value = tuple[dimension];
    return typeof value === "string" && value.trim().length > 0 && value !== "*";
  });
}

export function listUnboundConformanceTupleDimensions(
  tuple: ConformanceSupportTuple,
): ConformanceSupportTupleDimension[] {
  return CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS.filter((dimension) => {
    const value = tuple[dimension];
    return typeof value !== "string" || value.trim().length === 0 || value === "*";
  });
}

/** Canonical active tuple identity in the fixed seven-field order. */
export function conformanceTupleKey(tuple: ConformanceSupportTuple): string {
  const missing = listUnboundConformanceTupleDimensions(tuple);
  if (missing.length > 0) {
    throw new OperationError(`Active conformance tuple has empty or wildcard fields: ${missing.join(", ")}.`);
  }
  assertConformanceTupleCombination(tuple);
  return CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS.map((dimension) => tuple[dimension]).join("/");
}
