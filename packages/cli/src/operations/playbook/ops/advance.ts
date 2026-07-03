import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import {
  advancePlaybookRun,
  PLAYBOOK_ADVANCE_OUTCOMES,
  type AdvancePlaybookRunResult,
} from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  storeRoot: z.string().optional(),
  runId: z.string(),
  stepId: z.string().nullish(),
  /**
   * Reported outcome: required to move a delegated step past its hold, and
   * accepted on a deterministic step as the by-hand execution report. Absent,
   * the step's execution mode decides what advance does (R-MODE-1..2).
   */
  outcome: z.enum(PLAYBOOK_ADVANCE_OUTCOMES).nullish(),
  /** Manual-mode acknowledgment: records that the step was read; nothing executes. */
  acknowledge: z.boolean().optional(),
  /** CLI-absent deterministic path (R-TIER-1): present the human command form instead of executing. */
  present: z.boolean().optional(),
  evidenceRefs: z.array(z.string()).optional(),
  outputRefs: z.array(z.string()).optional(),
  note: z.string().nullish(),
});

export const playbookAdvanceOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  AdvancePlaybookRunResult
> = {
  id: "playbook.advance",
  summary:
    "Operation `playbook.advance`: advance the current Playbook run step per its execution mode — execute a deterministic operation or command (or present its human command form), hold a delegated step for a reported outcome with evidence, or record a manual acknowledgment — then transition status and compute the next cursor.",
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
      acknowledge: input.acknowledge,
      present: input.present,
      evidenceRefs: input.evidenceRefs,
      outputRefs: input.outputRefs,
      note: input.note,
      // Deterministic `operation:` steps run as the playbook-step surface,
      // inheriting this caller's write permission, dry-run, and approvals.
      operationContext: context,
    });
  },
};
