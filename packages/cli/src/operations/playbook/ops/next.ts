import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import { computePlaybookRunNext, type PlaybookRunNextReport } from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  storeRoot: z.string().optional(),
  runId: z.string(),
});

/**
 * `playbook.next` is side-effect free (R-OP-3): it computes the next
 * executable position from run state plus the parsed Playbook model and
 * never writes run state.
 */
export const playbookNextOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  PlaybookRunNextReport
> = {
  id: "playbook.next",
  summary:
    "Operation `playbook.next`: compute the next executable step or gate for a Playbook run from run state plus the parsed Playbook model, without mutating.",
  mutates: "read",
  status: "active",
  inputSchema,
  handler(input, context) {
    return computePlaybookRunNext({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      storeRoot: input.storeRoot,
      runId: input.runId,
    });
  },
};
