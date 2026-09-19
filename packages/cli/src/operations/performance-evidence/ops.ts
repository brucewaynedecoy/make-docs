import path from "node:path";
import { z } from "zod";
import { PROJECT_READ_ACCESS } from "../access";
import type { OperationDefinition } from "../registry";
import { validatePerformanceEvidence, type PerformanceEvidenceValidationReport } from "./validator";

const inputSchema = z.object({
  targetRoot: z.string().min(1).optional(),
}).strict();

type PerformanceEvidenceValidateInput = z.infer<typeof inputSchema>;

export const performanceEvidenceValidateOperation: OperationDefinition<
  PerformanceEvidenceValidateInput,
  PerformanceEvidenceValidationReport
> = {
  id: "performance.evidence.validate",
  summary: "Validate Performance Evidence structure and traceability without running a benchmark or changing repository state.",
  mutates: "read",
  access: PROJECT_READ_ACCESS,
  status: "active",
  inputSchema,
  handler(input, context) {
    return validatePerformanceEvidence(path.resolve(context.cwd, input.targetRoot ?? "."));
  },
};

export const performanceEvidenceOperations: OperationDefinition[] = [
  performanceEvidenceValidateOperation,
];
