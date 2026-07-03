import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import { resumePlaybookRun, type PlaybookRunState } from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  storeRoot: z.string().optional(),
  runId: z.string(),
  resumeHints: z.array(z.string()).optional(),
  evidenceRefs: z.array(z.string()).optional(),
  note: z.string().nullish(),
});

/**
 * W18 R7 Phase 2 operation shell (read then write, R-OP-1): re-enters a held
 * run at its stored cursor. The digest-aware resume semantics (R-RESUME-1)
 * land with W18 R7 Phase 3 at the seam documented on `resumePlaybookRun`.
 */
export const playbookResumeOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  PlaybookRunState
> = {
  id: "playbook.resume",
  summary:
    "Operation `playbook.resume`: re-enter a held Playbook run at its stored cursor from persisted run state.",
  mutates: "write",
  status: "active",
  inputSchema,
  handler(input, context) {
    return resumePlaybookRun({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      storeRoot: input.storeRoot,
      runId: input.runId,
      resumeHints: input.resumeHints,
      evidenceRefs: input.evidenceRefs,
      note: input.note,
    });
  },
};
