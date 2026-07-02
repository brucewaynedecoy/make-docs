import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import { resolvePlaybook, type PlaybookResolution } from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  ref: z.string(),
  requestedStack: z.string().nullish(),
});

export const playbookResolveOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  PlaybookResolution
> = {
  id: "playbook.resolve",
  summary:
    "Operation `playbook.resolve`: resolve an explicit path, persona/slug, or unique bare playbook reference to a single catalog entry.",
  mutates: "read",
  status: "active",
  inputSchema,
  handler(input, context) {
    return resolvePlaybook({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      ref: input.ref,
      requestedStack: input.requestedStack,
    });
  },
};
