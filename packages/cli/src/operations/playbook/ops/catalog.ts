import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import { catalogPlaybooks, type PlaybookContractCatalog } from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
});

export const playbookCatalogOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  PlaybookContractCatalog
> = {
  id: "playbook.catalog",
  summary:
    "Operation `playbook.catalog`: enumerate Playbooks by canonical persona/slug reference with frontmatter identity, detecting the `<slug>.playbook.md` suffix form and the deprecated plain form.",
  mutates: "read",
  status: "active",
  inputSchema,
  handler(input, context) {
    return catalogPlaybooks({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
    });
  },
};
