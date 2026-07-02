import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import type { JsonValue } from "../../types";
import { buildWorkEvidenceRecord } from "../index";

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number(),
    z.string(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

const inputSchema = z.object({
  /** Coordinate like `W18 R11 P1` or a phase path; must resolve to a phase. */
  target: z.string().min(1, "target is required"),
  repoRoot: z.string().min(1).optional(),
  /** Explicit store root override (tests/sandboxes); defaults to the global store. */
  storeRoot: z.string().min(1).optional(),
  evidenceKind: z.string().min(1, "evidenceKind is required"),
  payload: jsonValueSchema,
});

/**
 * Retained work-execution evidence recorder (R-RUN-1, R-BND-2): records one
 * evidence entry in the W18 R10 global store, keyed by the manifest-minted
 * project identifier plus the canonical work-item identity. Never writes
 * under a repository path.
 */
export const workEvidenceRecordOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  Record<string, JsonValue>
> = {
  id: "work.evidence.record",
  summary:
    "Record one work-execution evidence entry in the global store, keyed to the canonical work-item identity.",
  mutates: "write",
  status: "active",
  inputSchema,
  handler(input, context) {
    return buildWorkEvidenceRecord({
      target: input.target,
      repoRoot: input.repoRoot ?? context.cwd,
      ...(input.storeRoot ? { storeRoot: input.storeRoot } : {}),
      evidenceKind: input.evidenceKind,
      payload: input.payload,
    });
  },
};
