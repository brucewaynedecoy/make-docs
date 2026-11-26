import path from "node:path";
import { z } from "zod";
import { PROJECT_READ_ACCESS } from "../access";
import type { OperationDefinition } from "../registry";
import type { JsonValue } from "../types";
import { validateDecompositionOutput } from "./output";

const inputSchema = z.object({ targetRoot: z.string().min(1).optional() }).strict();

/** W34 R0 P1: `make-docs check decomposition` and `check_decomposition` (PRD 39 R-SKILL-CHECK-2). */
export const decompositionOperations: OperationDefinition[] = [{
  id: "decomposition.output.validate",
  mcp: { profiles: ["quality"], defaultExposure: "deferred" },
  summary: "Check a decomposition result: PRD names and sections, source anchors, work backlog folders, task lines and task IDs, acceptance criteria, archive folders, and links.",
  mutates: "read",
  access: PROJECT_READ_ACCESS,
  status: "active",
  inputSchema,
  handler(rawInput, context) {
    const input = inputSchema.parse(rawInput);
    return validateDecompositionOutput(path.resolve(input.targetRoot ?? context.cwd)) as unknown as JsonValue;
  },
}];
