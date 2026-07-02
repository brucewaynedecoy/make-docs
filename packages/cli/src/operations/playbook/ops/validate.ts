import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import { validatePlaybooks, type PlaybookValidationReport } from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  refs: z.array(z.string()).optional(),
});

export const playbookValidateOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  PlaybookValidationReport
> = {
  id: "playbook.validate",
  summary:
    "Operation `playbook.validate`: parse one or more Playbooks through the Playbook library and report the full diagnostic set with codes, severities, locations, and fix hints.",
  mutates: "read",
  status: "active",
  inputSchema,
  handler(input, context) {
    return validatePlaybooks({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      refs: input.refs,
    });
  },
};
