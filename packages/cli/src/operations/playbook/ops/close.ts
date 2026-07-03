import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import {
  closePlaybookRun,
  PLAYBOOK_RUN_TERMINAL_STATUSES,
  type PlaybookRunState,
} from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  storeRoot: z.string().optional(),
  runId: z.string(),
  terminalStatus: z.enum(PLAYBOOK_RUN_TERMINAL_STATUSES),
  evidenceRefs: z.array(z.string()).optional(),
  note: z.string().nullish(),
});

export const playbookCloseOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  PlaybookRunState
> = {
  id: "playbook.close",
  summary:
    "Operation `playbook.close`: finalize a Playbook run with a terminal status and closeout evidence.",
  mutates: "write",
  status: "active",
  inputSchema,
  handler(input, context) {
    return closePlaybookRun({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      storeRoot: input.storeRoot,
      runId: input.runId,
      terminalStatus: input.terminalStatus,
      evidenceRefs: input.evidenceRefs,
      note: input.note,
    });
  },
};
