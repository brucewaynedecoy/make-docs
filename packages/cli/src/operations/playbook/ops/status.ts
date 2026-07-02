import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import { readPlaybookRunState, type PlaybookRunState } from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  runId: z.string(),
});

export const playbookStatusOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  PlaybookRunState
> = {
  id: "playbook.status",
  summary:
    "Operation `playbook.status`: read Make Docs-owned Playbook run state for resume or audit.",
  mutates: "read",
  status: "active",
  inputSchema,
  handler(input, context) {
    return readPlaybookRunState({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      runId: input.runId,
    });
  },
};
