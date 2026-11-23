import path from "node:path";
import { z } from "zod";
import { PROJECT_READ_ACCESS, STORE_WRITE_PROJECT_WRITE_ACCESS } from "../../access";
import type { OperationDefinition } from "../../registry";
import { checkProjectDoctor, fixProjectDoctor } from "./index";

const exclude = z.array(z.string().min(1)).default([]);
const checkInput = z.object({
  targetRoot: z.string().min(1).optional(),
  exclude,
}).strict();
const fixInput = z.object({
  targetRoot: z.string().min(1).optional(),
  review: z.string().regex(/^[a-f0-9]{64}$/),
  exclude,
  /** Optional `files` list from the saved check result. Used only to name changed files. */
  reviewedFiles: z.array(z.object({ path: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict()).optional()
    .describe("Optional. The files list from the check result. The fix uses it only to name each file that changed after the check. The CLI form is --check-json."),
}).strict();

export const projectDoctorOperations: OperationDefinition[] = [{
  id: "project.doctor.check",
  mcp: { profiles: ["quality", "setup"], defaultExposure: "deferred" },
  summary: "Check project files for known problems, such as lower-case task IDs, and return a review digest. Reads only.",
  mutates: "read",
  access: PROJECT_READ_ACCESS,
  status: "active",
  inputSchema: checkInput,
  handler(raw, context) {
    const input = checkInput.parse(raw);
    return checkProjectDoctor(path.resolve(input.targetRoot ?? context.cwd), input.exclude);
  },
}, {
  id: "project.doctor.fix",
  mcp: { profiles: ["quality", "setup"], defaultExposure: "deferred" },
  summary: "Apply only the project doctor changes that a check review digest names, with a backup and an undo path.",
  mutates: "write",
  access: STORE_WRITE_PROJECT_WRITE_ACCESS,
  status: "active",
  inputSchema: fixInput,
  handler(raw, context) {
    const input = fixInput.parse(raw);
    return fixProjectDoctor({
      projectRoot: path.resolve(input.targetRoot ?? context.cwd),
      review: input.review,
      exclusions: input.exclude,
      ...(input.reviewedFiles ? { reviewedFiles: input.reviewedFiles } : {}),
      storeRoot: context.storeRoot,
      dryRun: context.dryRun,
      caller: context.surface === "mcp" ? "mcp" : "cli",
    });
  },
}];
