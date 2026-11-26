import path from "node:path";
import { z } from "zod";
import { PROJECT_READ_ACCESS, PROJECT_WRITE_ACCESS } from "../access";
import type { OperationDefinition } from "../registry";
import type { JsonValue } from "../types";
import { repairMarkdownStyle, validateMarkdownStyle } from "./markdown-style";
import { listProjectRelations } from "./relations";

const markdownInput = z.object({
  targetRoot: z.string().min(1).optional(),
  paths: z.array(z.string().min(1)).min(1).optional(),
}).strict();

const markdownRepairInput = markdownInput.extend({ apply: z.boolean().optional() }).strict();

const relationsInput = z.object({
  targetRoot: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
}).strict();

/**
 * W34 R0 P1: the `project` Skill check operations (PRD 39 R-SKILL-CHECK-3 to
 * R-SKILL-CHECK-5): `project relations list`, `project markdown validate`,
 * and `project markdown repair`.
 */
export const projectSkillCheckOperations: OperationDefinition[] = [{
  id: "project.relations.list",
  mcp: { profiles: ["workflow"], defaultExposure: "deferred" },
  summary: "List the relations between designs, plans, work backlogs, history records, and guides: links, related: front matter, W/R coordinates, and same-slug matches.",
  mutates: "read",
  access: PROJECT_READ_ACCESS,
  status: "active",
  inputSchema: relationsInput,
  handler(rawInput, context) {
    const input = relationsInput.parse(rawInput);
    return listProjectRelations({
      targetRoot: path.resolve(input.targetRoot ?? context.cwd),
      ...(input.path ? { path: input.path } : {}),
    }) as unknown as JsonValue;
  },
}, {
  id: "project.markdown-style.validate",
  mcp: { profiles: ["setup", "quality"], defaultExposure: "deferred" },
  summary: "Check Markdown source style: blank lines between blocks, wrapped paragraphs, and wrapped list items.",
  mutates: "read",
  access: PROJECT_READ_ACCESS,
  status: "active",
  inputSchema: markdownInput,
  handler(rawInput, context) {
    const input = markdownInput.parse(rawInput);
    return validateMarkdownStyle({
      targetRoot: path.resolve(input.targetRoot ?? context.cwd),
      ...(input.paths ? { paths: input.paths } : {}),
    }) as unknown as JsonValue;
  },
}, {
  id: "project.markdown-style.repair",
  mcp: { profiles: ["setup"], defaultExposure: "deferred" },
  summary: "Preview or make the Markdown style fixes that the check marks as fixable.",
  mutates: "write",
  access: PROJECT_WRITE_ACCESS,
  status: "active",
  inputSchema: markdownRepairInput,
  handler(rawInput, context) {
    const input = markdownRepairInput.parse(rawInput);
    return repairMarkdownStyle({
      targetRoot: path.resolve(input.targetRoot ?? context.cwd),
      ...(input.paths ? { paths: input.paths } : {}),
      apply: input.apply === true && !context.dryRun,
    }) as unknown as JsonValue;
  },
}];
