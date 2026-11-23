import { stdin as input, stdout as output } from "node:process";
import { confirm, isCancel } from "@clack/prompts";
import { createExecutionContext, type CliOperationLaunch } from "../operations/context";
import { invokeOperation } from "../operations/registry";
import { OperationError } from "../operations/types";
import { formatBytes, type StoreCheckReport, type StoreCleanReport, type StoreMaintenanceRuleReport } from "../store/maintenance";

export const SETUP_STORE_HELP = [
  "Usage: make-docs setup store check [--json]",
  "       make-docs setup store clean [--yes] [--dry-run] [--json]",
  "",
  "Check reads the Make Docs Store and changes nothing. It shows what each fixed",
  "rule would remove, the items that need your decision, and the crash leftovers",
  "that block this computer. It also reads a Store that was changed outside Make Docs.",
  "",
  "Clean backs up the Store under ~/.make-docs/backup/ and keeps the three newest",
  "backups. Then it removes only what the fixed rules prove, in one transaction,",
  "shrinks the file, and tells you how to restore the backup.",
  "An interactive run asks once. A non-interactive run needs --yes.",
  "--dry-run shows what clean would do and changes nothing.",
  "",
  "Run these commands yourself in a terminal. An agent uses the setup_store_check",
  "and setup_store_clean MCP tools instead; they are not native command rules.",
  "",
].join("\n");

export function renderStoreCheck(report: StoreCheckReport): string {
  const lines = [`Store check: ${report.summary}`];
  lines.push(`Store: ${report.store.databasePath} (schema ${report.store.schemaVersion}, ${formatBytes(report.store.sizeBytes)}).`);
  for (const note of report.notes) lines.push(`Note: ${note}`);
  lines.push("", "Fixed rules:");
  for (const rule of report.rules) lines.push(...renderRule(rule));
  if (report.decisions.length > 0) {
    lines.push("", "Needs your decision (never removed by a rule):");
    for (const item of report.decisions) lines.push(`  ${item.id} ${item.title}: ${item.reason}`, `    Next: ${item.nextAction}`);
  }
  if (report.leftovers.length > 0) {
    lines.push("", "Crash leftovers that block this computer:");
    for (const leftover of report.leftovers) {
      lines.push(`  ${leftover.id} ${leftover.key}: ${leftover.title}. ${leftover.why}`);
      lines.push(`    It blocks: ${leftover.blocks}`);
      lines.push(`    ${leftover.clearedByClean ? "Clean clears it." : "Clean does not clear it."} Next: ${leftover.nextAction}`);
    }
  }
  lines.push("", `Next: ${report.nextAction}`, "");
  return lines.join("\n");
}

function renderRule(rule: StoreMaintenanceRuleReport): string[] {
  const state = rule.state === "active" ? "" : " (not on yet)";
  const head = rule.act.rows > 0
    ? `would remove or trim ${rule.act.rows} row${rule.act.rows === 1 ? "" : "s"} (about ${formatBytes(rule.act.bytes)})`
    : "would remove nothing";
  const lines = [`  ${rule.id} ${rule.title}${state}: ${head}.${rule.kept > 0 ? ` Keeps ${rule.kept}.` : ""}${rule.skipped.rows > 0 ? ` Skips ${rule.skipped.rows}.` : ""}`];
  for (const row of rule.act.entries) lines.push(`    Remove: ${row.key}${row.reason ? ` (${row.reason})` : ""}`);
  if (rule.act.more > 0) lines.push(`    ...and ${rule.act.more} more.`);
  for (const row of rule.skipped.entries) lines.push(`    Skip: ${row.key}: ${row.reason ?? "no reason given"}`);
  if (rule.skipped.more > 0) lines.push(`    ...and ${rule.skipped.more} more skipped.`);
  return lines;
}

export function renderStoreClean(report: StoreCleanReport): string {
  const lines = [`Store clean: ${report.summary}`, `Store: ${report.databasePath}.`];
  if (!report.dryRun && report.backup) {
    lines.push("", "Each rule:");
    for (const rule of report.rules) {
      const state = rule.state === "active" ? "" : " (not on yet)";
      lines.push(`  ${rule.id} ${rule.title}${state}: ${rule.changed} row${rule.changed === 1 ? "" : "s"} (about ${formatBytes(rule.bytes)}).${rule.skipped.rows > 0 ? ` Skipped ${rule.skipped.rows}.` : ""}`);
      for (const row of rule.skipped.entries) lines.push(`    Skip: ${row.key}: ${row.reason ?? "no reason given"}`);
      if (rule.skipped.more > 0) lines.push(`    ...and ${rule.skipped.more} more skipped.`);
    }
    lines.push("", `Space: ${formatBytes(report.space.beforeBytes)} before, ${formatBytes(report.space.afterBytes)} after, ${formatBytes(report.space.freedBytes)} freed.`);
    lines.push(`Backup: ${report.backup.path}`);
    if (report.backup.removedOldBackups.length > 0) lines.push(`Removed older backups: ${report.backup.removedOldBackups.join(", ")}`);
    lines.push("", "To restore this backup:");
    report.restore.forEach((step, index) => lines.push(`  ${index + 1}. ${step}`));
  } else {
    // A dry run or a clean with nothing to prove shows the check. Its summary,
    // Store line, and next action are already above or below, so each is stated once.
    const check = renderStoreCheck(report.check).trimEnd().split("\n").slice(1);
    if (check.at(-1)?.startsWith("Next: ")) check.pop();
    while (check.at(-1) === "") check.pop();
    lines.splice(1, 1, ...check);
  }
  lines.push("", `Next: ${report.nextAction}`, "");
  return lines.join("\n");
}

/** `make-docs setup store check|clean` (PRD 39 R-STORE-CMD-3, R-STORE-CMD-4). */
export async function runSetupStoreCommand(argv: string[], launch: CliOperationLaunch): Promise<void> {
  const [verb, ...args] = argv;
  if (!verb || verb === "--help" || verb === "-h" || args.some((arg) => arg === "--help" || arg === "-h")) {
    output.write(SETUP_STORE_HELP);
    return;
  }
  if (verb !== "check" && verb !== "clean") throw new OperationError(`Unknown setup store command: ${verb}. Use check or clean.`);
  let json = false, yes = false, dryRun = false;
  const seen = new Set<string>();
  for (const arg of args) {
    if (seen.has(arg)) throw new OperationError(`Option ${arg} can be given only once.`);
    seen.add(arg);
    if (arg === "--json") json = true;
    else if (arg === "--yes" && verb === "clean") yes = true;
    else if (arg === "--dry-run" && verb === "clean") dryRun = true;
    else throw new OperationError(`Unexpected argument for setup store ${verb}: ${arg}.`);
  }
  const context = (writesAllowed: boolean, planOnly: boolean) => createExecutionContext({
    surface: "cli",
    route: launch.route,
    callerIdentityRaw: launch.callerIdentityRaw,
    callerReference: launch.callerReference,
    writesAllowed,
    dryRun: planOnly,
  });
  if (verb === "check") {
    const report = (await invokeOperation("setup.store.check", {}, context(false, false))).value as unknown as StoreCheckReport;
    output.write(json ? `${JSON.stringify(report, null, 2)}\n` : renderStoreCheck(report));
    return;
  }
  const interactive = !yes && !dryRun && !json && Boolean(input.isTTY && output.isTTY);
  if (interactive) {
    const preview = (await invokeOperation("setup.store.clean", { yes: false }, context(true, true))).value as unknown as StoreCleanReport;
    output.write(renderStoreCheck(preview.check));
    if (preview.check.totals.actRows === 0) {
      output.write("Clean has nothing to remove. Nothing was changed.\n");
      return;
    }
    const answer = await confirm({
      message: `Back up the Store and remove or trim ${preview.check.totals.actRows} row(s)?`,
      initialValue: false,
      active: "Yes",
      inactive: "No",
      withGuide: true,
    });
    if (isCancel(answer) || !answer) {
      output.write("Clean stopped. Nothing was changed.\n");
      return;
    }
    yes = true;
  }
  const report = (await invokeOperation("setup.store.clean", { yes }, context(true, dryRun))).value as unknown as StoreCleanReport;
  output.write(json ? `${JSON.stringify(report, null, 2)}\n` : renderStoreClean(report));
}
