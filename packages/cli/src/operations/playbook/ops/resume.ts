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
  /**
   * Explicit opt-in migration after a digest mismatch (R-RESUME-2): re-map
   * still-present step identifiers and flag added/removed steps. Never the
   * default — without it a mismatch blocks with a diagnostic.
   */
  migrate: z.boolean().optional(),
});

/**
 * The digest-checked re-entry (read then write, R-OP-1, R-RESUME-1..2): a
 * matching source digest resumes at the stored cursor; a mismatch marks the
 * run stale, blocks by default with a diagnostic naming the change, and
 * requires an explicit re-plan or the opt-in `migrate` re-mapping. Semantics
 * are documented on `resumePlaybookRun`.
 */
export const playbookResumeOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  PlaybookRunState
> = {
  id: "playbook.resume",
  summary:
    "Operation `playbook.resume`: re-enter a held Playbook run at its stored cursor after a source digest check; a mismatch blocks by default with a diagnostic naming the change, with migration as an explicit opt-in.",
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
      migrate: input.migrate,
    });
  },
};
