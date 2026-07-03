import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import { exportPlaybookRun, type ExportPlaybookRunResult } from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  storeRoot: z.string().optional(),
  runId: z.string(),
  /**
   * Explicit caller-named destination for the artifact file. Never defaulted
   * (R-PORT-1): absent, the artifact is only returned as the operation value
   * for the surface to present, and no file is written.
   */
  outputPath: z.string().nullish(),
});

export const playbookRunExportOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  ExportPlaybookRunResult
> = {
  id: "playbook.run.export",
  summary:
    "Operation `playbook.run.export`: serialize a Playbook run record and its evidence into a portable artifact for explicit cross-machine handoff, written only to a caller-named output path (or returned inline) and never into the repository by default.",
  // Classified write conservatively: with an explicit output path the handler
  // writes the artifact file to disk. Run state itself is never mutated.
  mutates: "write",
  status: "active",
  inputSchema,
  handler(input, context) {
    return exportPlaybookRun({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      storeRoot: input.storeRoot,
      runId: input.runId,
      outputPath: input.outputPath ? path.resolve(context.cwd, input.outputPath) : null,
    });
  },
};
