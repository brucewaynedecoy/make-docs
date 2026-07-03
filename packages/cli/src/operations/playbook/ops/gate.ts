import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import {
  PLAYBOOK_GATE_DECISION_VALUES,
  recordPlaybookRunGate,
  type PlaybookRunState,
} from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  storeRoot: z.string().optional(),
  runId: z.string(),
  gateId: z.string().nullish(),
  decision: z.enum(PLAYBOOK_GATE_DECISION_VALUES),
  evidenceRefs: z.array(z.string()).optional(),
  note: z.string().nullish(),
});

export const playbookGateOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  PlaybookRunState
> = {
  id: "playbook.gate",
  summary:
    "Operation `playbook.gate`: record a gate decision with its evidence on a Playbook run and either unblock past the gate or stop.",
  mutates: "write",
  status: "active",
  inputSchema,
  handler(input, context) {
    return recordPlaybookRunGate({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      storeRoot: input.storeRoot,
      runId: input.runId,
      gateId: input.gateId,
      decision: input.decision,
      evidenceRefs: input.evidenceRefs,
      note: input.note,
    });
  },
};
