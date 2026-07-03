import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import {
  advancePlaybookRun,
  PLAYBOOK_ADVANCE_OUTCOMES,
  type PlaybookRunState,
} from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  storeRoot: z.string().optional(),
  runId: z.string(),
  stepId: z.string().nullish(),
  outcome: z.enum(PLAYBOOK_ADVANCE_OUTCOMES),
  evidenceRefs: z.array(z.string()).optional(),
  outputRefs: z.array(z.string()).optional(),
  note: z.string().nullish(),
});

export const playbookAdvanceOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  PlaybookRunState
> = {
  id: "playbook.advance",
  summary:
    "Operation `playbook.advance`: record completion or failure of the current Playbook run step with its evidence, transition status, and compute the next cursor.",
  mutates: "write",
  status: "active",
  inputSchema,
  handler(input, context) {
    return advancePlaybookRun({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      storeRoot: input.storeRoot,
      runId: input.runId,
      stepId: input.stepId,
      outcome: input.outcome,
      evidenceRefs: input.evidenceRefs,
      outputRefs: input.outputRefs,
      note: input.note,
    });
  },
};
