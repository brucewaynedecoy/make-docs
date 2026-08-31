import { z } from "zod";
import type { OperationDefinition } from "../registry";

const emptyInput = z.object({}).strict();

function pending(
  id: string,
  summary: string,
  lineage: "W19 R1 P4" | "W19 R1 P6" | "W19 R1 P7",
  mutates: "read" | "write" = "read",
  inputSchema: OperationDefinition["inputSchema"] = emptyInput,
): OperationDefinition {
  return {
    id,
    summary,
    mutates,
    status: "pending",
    pendingLineage: lineage,
    inputSchema,
  };
}

export const pendingOperations: OperationDefinition[] = [
  pending("uat.scenario.validate", "Reserve Naive UAT scenario validation.", "W19 R1 P7"),
  pending("uat.persona.resolve", "Reserve Naive UAT persona resolution.", "W19 R1 P7"),
  pending("uat.target.validate", "Reserve Naive UAT target validation.", "W19 R1 P7"),
  pending(
    "uat.evidence-reference.validate",
    "Reserve Naive UAT evidence-reference validation.",
    "W19 R1 P7",
  ),
  pending("uat.finding.validate", "Reserve Naive UAT finding validation.", "W19 R1 P7"),
  pending("uat.result.validate", "Reserve Naive UAT result validation.", "W19 R1 P7"),
];
