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
  pending("lifecycle.start", "Reserve general lifecycle run creation.", "W19 R1 P6", "write"),
  pending("lifecycle.show", "Reserve general lifecycle run inspection.", "W19 R1 P6"),
  pending("lifecycle.list", "Reserve general lifecycle run listing.", "W19 R1 P6"),
  pending(
    "lifecycle.checkpoint",
    "Reserve general lifecycle checkpoint recording.",
    "W19 R1 P6",
    "write",
  ),
  pending("lifecycle.pause", "Reserve general lifecycle run pause.", "W19 R1 P6", "write"),
  pending("lifecycle.resume", "Reserve general lifecycle run resume.", "W19 R1 P6", "write"),
  pending(
    "lifecycle.attach-evidence",
    "Reserve lifecycle evidence attachment.",
    "W19 R1 P6",
    "write",
  ),
  pending("lifecycle.complete", "Reserve general lifecycle completion.", "W19 R1 P6", "write"),
  pending("lifecycle.fail", "Reserve general lifecycle failure.", "W19 R1 P6", "write"),
  pending("lifecycle.abandon", "Reserve general lifecycle abandonment.", "W19 R1 P6", "write"),
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
