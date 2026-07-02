import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import type { JsonValue } from "../../types";
import { buildWorkEvidenceRead } from "../index";

const inputSchema = z.object({
  /** Coordinate like `W18 R11 P1`/`W18 R11` or a wave/phase path. */
  target: z.string().min(1, "target is required"),
  repoRoot: z.string().min(1).optional(),
  /** Explicit store root override (tests/sandboxes); defaults to the global store. */
  storeRoot: z.string().min(1).optional(),
});

/**
 * Retained work-execution evidence reader (R-RUN-1): returns the evidence
 * rows recorded in the global store for a phase-level identity, or every row
 * for the wave when the target resolves wave-only.
 */
export const workEvidenceReadOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  Record<string, JsonValue>
> = {
  id: "work.evidence.read",
  summary:
    "Read recorded work-execution evidence from the global store for a phase identity or a whole wave.",
  mutates: "read",
  status: "active",
  inputSchema,
  handler(input, context) {
    return buildWorkEvidenceRead({
      target: input.target,
      repoRoot: input.repoRoot ?? context.cwd,
      ...(input.storeRoot ? { storeRoot: input.storeRoot } : {}),
    });
  },
};
