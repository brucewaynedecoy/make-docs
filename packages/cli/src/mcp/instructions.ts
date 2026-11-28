import { NAME_CATALOG, type NameCatalogEntry } from "../operations/name-catalog";

/**
 * W35 R0 P3: the server instructions that an MCP host gets when an agent
 * connects (PRD 25 R-MCP-INSTR-1 to R-MCP-INSTR-4). They are the adapter of
 * the `session-start` event: the text tells an agent that starts work on the
 * backlog to run the checkpoint, as a direct run with no event.
 *
 * The text is the root router rule with tool names in place of commands. It
 * is conditional, so it is true with a Store and without one. It asks for the
 * write permission only from an agent whose task may change project files.
 * Each tool name comes from the name catalog (PRD 39 R-NAME-6), so a rename
 * changes the text.
 *
 * The instructions are advice, so they can never stop the server. When the
 * catalog does not hold one of the three operations as a current name, the
 * server sends no instructions, and the name test is the guard.
 */

/** The operations whose tools the work rule names, in the order of the text. */
export const MCP_WORK_RULE_OPERATIONS = ["project.checkpoint.run", "work.queue.status", "work.queue.next"] as const;

/**
 * The tool names that the work rule needs, or `undefined` when the catalog
 * does not hold each of them as a current name. A profile that lacks one of
 * them sends no work rule.
 */
export function mcpWorkRuleToolNames(catalog: readonly NameCatalogEntry[] = NAME_CATALOG): string[] | undefined {
  const names: string[] = [];
  for (const operationId of MCP_WORK_RULE_OPERATIONS) {
    const entry = catalog.find((item) => item.id === operationId && item.status === "current");
    if (!entry) return undefined;
    names.push(entry.newMcp);
  }
  return names;
}

/** The work rule, with the current tool names, or `undefined` when a name is not current. */
export function mcpWorkRuleText(catalog: readonly NameCatalogEntry[] = NAME_CATALOG): string | undefined {
  const names = mcpWorkRuleToolNames(catalog);
  if (!names) return undefined;
  const [checkpoint, status, next] = names;
  return [
    `When you start work on this project's backlog, call \`${checkpoint}\` with no \`event\`.`,
    `Add \`allowWrite: true\` only when your task may change this project's files.`,
    `When the work store is in charge (\`${status}\` says which side is), find work with \`${next}\`, not with file searches, and call \`${checkpoint}\` with \`allowWrite: true\` after you change a file under \`docs/work/\` and after you close a phase.`,
    `Without a usable Store, the \`docs/work/\` files are the authority: \`${checkpoint}\` says so and changes nothing.`,
  ].join(" ");
}

/**
 * The server instructions for the tools that a connection lists, or
 * `undefined` when the connection sends none. The work rule is sent only
 * when the connection lists every tool that the rule names.
 */
export function mcpServerInstructions(listedToolNames: Iterable<string>, catalog: readonly NameCatalogEntry[] = NAME_CATALOG): string | undefined {
  const names = mcpWorkRuleToolNames(catalog);
  if (!names) return undefined;
  const listed = new Set(listedToolNames);
  return names.every((name) => listed.has(name)) ? mcpWorkRuleText(catalog) : undefined;
}
