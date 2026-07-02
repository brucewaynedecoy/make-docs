import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import { resolveWorkItemIdentity, type WorkItemIdentityResolution } from "../index";

const inputSchema = z.object({
  /** Coordinate like `W18 R11 P1` or a wave/phase path. */
  target: z.string().min(1, "target is required"),
  repoRoot: z.string().min(1).optional(),
});

/**
 * Retained work-item identity resolver (R-RUN-1): coordinate or path in,
 * canonical identity out. A wave-only target resolves with `phasePath: null`
 * — next-incomplete-phase selection is re-derivable judgment and is
 * deliberately not part of this operation.
 */
export const workItemResolveOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  WorkItemIdentityResolution
> = {
  id: "work.item.resolve",
  summary:
    "Resolve a coordinate or path to the canonical work-item identity (repo root, wave slug, phase path).",
  mutates: "read",
  status: "active",
  inputSchema,
  handler(input, context) {
    return resolveWorkItemIdentity(input.target, input.repoRoot ?? context.cwd);
  },
};
