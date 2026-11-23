import {
  listOperations,
  operationFullCliPath,
  type OperationDescriptor,
} from "../operations/registry";
import { isOperationGroup } from "./cli";
import { OPERATION_LEAF_HELP, leafHelpEntry, type LeafHelpEntry, type LeafHelpItem } from "../operations/leaf-help-table";

export { OPERATION_LEAF_HELP, leafHelpEntry, type LeafHelpEntry, type LeafHelpItem };

/**
 * Help for one registry command (a leaf), such as `make-docs work item resolve --help`.
 *
 * W33 R0 P5: before this module, `--help` after a leaf path reached that
 * command's own option parser. The shared parser read `--help` as a flag that
 * needs a value and failed with "`--help` requires a value."; other routers
 * failed with "Unknown option" or ran the command. The CLI now answers
 * `--help` or `-h` after any registry leaf from this one table, before any
 * router runs, so help never reads the Store or changes a file.
 *
 * The help text lives in `src/operations/leaf-help-table.ts`.
 */

const HELP_FLAGS = new Set(["--help", "-h"]);

function renderItems(title: string, items: LeafHelpItem[]): string[] {
  if (items.length === 0) return [];
  const width = Math.min(34, Math.max(...items.map((item) => item.name.length)));
  return [
    `${title}:`,
    ...items.map((item) =>
      item.name.length > width
        ? `  ${item.name}\n  ${" ".repeat(width)}  ${item.text}`
        : `  ${item.name.padEnd(width)}  ${item.text}`,
    ),
    "",
  ];
}

/** Help for one registry command: its summary, usage, arguments, and options. */
export function renderOperationLeafHelp(operationId: string): string {
  const operation = listOperations().find((candidate) => candidate.id === operationId);
  if (operation === undefined) throw new Error(`Unknown operation \`${operationId}\`.`);
  const entry = leafHelpEntry(operationId);
  const fullPath = operationFullCliPath(operationId);
  const usage = entry.usage ? `make-docs ${fullPath} ${entry.usage}` : `make-docs ${fullPath}`;
  return [
    `make-docs ${fullPath}`,
    "",
    entry.summary,
    "",
    "Usage:",
    `  ${usage}`,
    "",
    ...renderItems("Arguments", entry.arguments ?? []),
    ...renderItems("Options", [...entry.options, { name: "--help, -h", text: "Show this help." }]),
    ...(entry.notes && entry.notes.length > 0 ? [...entry.notes, ""] : []),
    ...(operation.mutates === "write" ? ["This command can change files or Store records.", ""] : []),
  ].join("\n");
}

/**
 * The flags of one command that take a value, read from its option list:
 * `--kind <kind>`, `--format text|json`, or the `--run-id <id>` half of
 * `--run-id <id>|--last`. A `--help` or `-h` right after one of them is
 * that flag's value, not a request for help.
 */
export function leafValueFlags(entry: LeafHelpEntry): Set<string> {
  const flags = new Set<string>();
  for (const option of entry.options) {
    for (const piece of option.name.split("|")) {
      const match = /^(--[a-z][a-z0-9-]*) \S/.exec(piece);
      if (match) flags.add(match[1]!);
    }
  }
  return flags;
}

function leadingWords(argv: string[]): string[] {
  const words: string[] = [];
  for (const arg of argv) {
    if (arg.startsWith("-")) break;
    words.push(arg);
  }
  return words;
}

function operationByLongestPath(words: string[]): OperationDescriptor | undefined {
  let match: OperationDescriptor | undefined;
  let matchLength = 0;
  for (const operation of listOperations()) {
    const parts = operationFullCliPath(operation.id).split(" ");
    if (parts.length <= matchLength || parts.length > words.length) continue;
    if (parts.every((part, index) => words[index] === part)) {
      match = operation;
      matchLength = parts.length;
    }
  }
  return match;
}

/**
 * The help a `--help` or `-h` argv asks for, or `null` when argv asks for no
 * leaf or branch help. A leaf is a registry command path; a `--help` or
 * `-h` after it asks for its help, unless it is the value of a flag that
 * takes one. A branch is a path prefix of two or more
 * words inside a registry group that has no router of its own, such as
 * `make-docs check uat --help`; it lists the commands under it.
 */
export function resolveLeafHelp(argv: string[]): string | null {
  if (!argv.some((arg) => HELP_FLAGS.has(arg))) return null;
  const words = leadingWords(argv);
  const operation = operationByLongestPath(words);
  if (operation !== undefined) {
    const takesValue = leafValueFlags(leafHelpEntry(operation.id));
    const pathLength = operationFullCliPath(operation.id).split(" ").length;
    for (let index = pathLength; index < argv.length; index += 1) {
      const arg = argv[index]!;
      if (HELP_FLAGS.has(arg)) return renderOperationLeafHelp(operation.id);
      if (takesValue.has(arg)) index += 1;
    }
    return null;
  }
  if (words.length < 2 || !isOperationGroup(words[0]) || !HELP_FLAGS.has(argv[words.length] ?? "")) return null;
  const prefix = `${words.join(" ")} `;
  const under = listOperations().filter((candidate) => operationFullCliPath(candidate.id).startsWith(prefix));
  if (under.length === 0) return null;
  return [
    `make-docs ${words.join(" ")}`,
    "",
    "Commands:",
    ...under.flatMap((candidate) => [
      `  make-docs ${operationFullCliPath(candidate.id)}`,
      `      ${leafHelpEntry(candidate.id).summary}`,
    ]),
    "",
    "Use --help or -h with a command to see its options.",
    "",
  ].join("\n");
}
