import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import { importPlaybookRun, type ImportPlaybookRunResult } from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  storeRoot: z.string().optional(),
  /** The JSON artifact produced by `playbook.run.export`; validated fail-closed by the handler. */
  artifact: z.unknown(),
  /** Explicit opt-in to replace an existing run record with the same run id. */
  overwrite: z.boolean().optional(),
  /** Explicit opt-in to re-key an artifact exported from a different project identity. */
  adoptProject: z.boolean().optional(),
});

export const playbookRunImportOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  ImportPlaybookRunResult
> = {
  id: "playbook.run.import",
  summary:
    "Operation `playbook.run.import`: rehydrate an exported Playbook run artifact into this machine's global store, keyed by the importing repository's project identifier — opt-in cross-machine handoff that never writes run state into the repository.",
  mutates: "write",
  status: "active",
  inputSchema,
  handler(input, context) {
    return importPlaybookRun({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      storeRoot: input.storeRoot,
      artifact: input.artifact,
      overwrite: input.overwrite,
      adoptProject: input.adoptProject,
    });
  },
};
