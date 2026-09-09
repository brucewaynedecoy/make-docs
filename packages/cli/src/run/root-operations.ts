import path from "node:path";
import { Buffer } from "node:buffer";
import { createExecutionContext } from "../operations/context";
import { invokeOperation } from "../operations/registry";
import type {
  ResourceListOperationOutput,
  ResourceReadOperationOutput,
} from "../operations/resource";
import { OperationError } from "../operations/types";
import type { ProjectSurfaceEnsureOutput } from "../operations/project/ops";

type ResourceOrigin = "effective" | "local" | "installed";
type ResourceFormat = "table" | "json" | "raw";

interface RootOperationOptions {
  targetRoot?: string;
  type?: "contract" | "prompt" | "reference" | "template";
  prefix?: string;
  origin?: ResourceOrigin;
  format?: ResourceFormat;
  allowWrite: boolean;
  dryRun: boolean;
  approvals: string[];
  positionals: string[];
  present: Set<string>;
}

function parseOptions(argv: string[]): RootOperationOptions {
  const options: RootOperationOptions = {
    allowWrite: false,
    dryRun: false,
    approvals: [],
    positionals: [],
    present: new Set(),
  };
  const args = [...argv];
  while (args.length > 0) {
    const arg = args.shift()!;
    if (arg === "--target" || arg === "--target-root") {
      markPresent(options, "target", arg);
      const value = args.shift();
      if (!value) throw new OperationError(`\`${arg}\` requires a path.`);
      options.targetRoot = path.resolve(value);
    } else if (arg === "--type") {
      markPresent(options, "type", arg);
      const value = args.shift();
      if (!value || !["contract", "prompt", "reference", "template"].includes(value)) {
        throw new OperationError(
          "`--type` requires contract, prompt, reference, or template.",
        );
      }
      options.type = value as RootOperationOptions["type"];
    } else if (arg === "--prefix") {
      markPresent(options, "prefix", arg);
      const value = args.shift();
      if (!value) throw new OperationError("`--prefix` requires a path.");
      options.prefix = value;
    } else if (arg === "--origin") {
      markPresent(options, "origin", arg);
      const value = args.shift();
      if (!value || !["effective", "local", "installed"].includes(value)) {
        throw new OperationError("`--origin` requires effective, local, or installed.");
      }
      options.origin = value as ResourceOrigin;
    } else if (arg === "--format") {
      markPresent(options, "format", arg);
      const value = args.shift();
      if (!value || !["table", "json", "raw"].includes(value)) {
        throw new OperationError("`--format` requires table, json, or raw.");
      }
      options.format = value as ResourceFormat;
    } else if (arg === "--allow-write") {
      markPresent(options, "allow-write", arg);
      options.allowWrite = true;
    } else if (arg === "--dry-run") {
      markPresent(options, "dry-run", arg);
      options.dryRun = true;
    } else if (arg === "--approve") {
      const value = args.shift();
      if (!value) throw new OperationError("`--approve` requires an approval name.");
      options.approvals.push(value);
      options.present.add("approve");
    } else if (arg.startsWith("--")) {
      throw new OperationError(`Unknown option: ${arg}`);
    } else {
      options.positionals.push(arg);
    }
  }
  return options;
}

function markPresent(options: RootOperationOptions, name: string, flag: string): void {
  if (options.present.has(name)) {
    throw new OperationError(`Option \`${flag}\` can be given only once.`);
  }
  options.present.add(name);
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printResourceTable(value: ResourceListOperationOutput): void {
  const rows = ["TYPE\tURI\tORIGIN\tSTATE"];
  for (const entry of value.resources) {
    if (entry.result.ok) {
      rows.push(
        [
          entry.result.value.identity.type,
          entry.uri,
          entry.result.value.origin,
          entry.result.value.state,
        ].join("\t"),
      );
    } else {
      rows.push(["-", entry.uri, "-", entry.result.error.code].join("\t"));
    }
  }
  process.stdout.write(`${rows.join("\n")}\n`);
}

function assertOptions(
  verb: "list" | "read" | "ensure",
  options: RootOperationOptions,
): void {
  const allowed = new Set(
    verb === "list"
      ? ["target", "type", "prefix", "origin", "format"]
      : verb === "read"
        ? ["target", "origin", "format"]
        : ["target", "allow-write", "dry-run", "approve"],
  );
  for (const name of options.present) {
    if (!allowed.has(name)) {
      throw new OperationError(`Option \`--${name}\` is not valid for resource ${verb}.`);
    }
  }
  if (verb === "list" && options.format && !["table", "json"].includes(options.format)) {
    throw new OperationError("Resource list format must be table or json.");
  }
  if (verb === "read" && options.format && !["raw", "json"].includes(options.format)) {
    throw new OperationError("Resource read format must be raw or json.");
  }
}

export async function runResourceCommand(argv: string[]): Promise<void> {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    process.stdout.write(
      [
        "Usage:",
        "  make-docs resource list [--type <contract|prompt|reference|template>] [--prefix <path>] [--origin <effective|local|installed>] [--format table|json] [--target <dir>]",
        "  make-docs resource read <uri> [--origin <effective|local|installed>] [--format raw|json] [--target <dir>]",
        "  make-docs resource ensure <uri> --allow-write --approve resource-projection-write [--dry-run] [--target <dir>]",
        "",
      ].join("\n"),
    );
    return;
  }
  const verb = argv[0];
  if (verb !== "list" && verb !== "read" && verb !== "ensure") {
    throw new OperationError(`Unknown make-docs resource command: \`${verb}\`.`);
  }
  const options = parseOptions(argv.slice(1));
  assertOptions(verb, options);
  const uri = options.positionals[0];
  if (verb === "list" && options.positionals.length !== 0) {
    throw new OperationError("`make-docs resource list` accepts no positional arguments.");
  }
  if (verb !== "list" && (options.positionals.length !== 1 || !uri)) {
    throw new OperationError(`\`make-docs resource ${verb}\` requires exactly one resource URI.`);
  }
  const operationId = `resource.${verb}`;
  const invocation = await invokeOperation(
    operationId,
    {
      ...(uri ? { uri } : {}),
      ...(options.targetRoot ? { targetRoot: options.targetRoot } : {}),
      ...(verb === "list" && options.type ? { type: options.type } : {}),
      ...(verb === "list" && options.prefix ? { prefix: options.prefix } : {}),
      ...(verb !== "ensure" && options.origin ? { origin: options.origin } : {}),
    },
    createExecutionContext({
      surface: "cli",
      cwd: options.targetRoot,
      writesAllowed: options.allowWrite,
      dryRun: options.dryRun,
      approvals: options.approvals,
    }),
  );
  if (verb === "list") {
    if ((options.format ?? "table") === "json") {
      printJson(invocation.value);
    } else {
      printResourceTable(invocation.value as unknown as ResourceListOperationOutput);
    }
    return;
  }
  if (verb === "read") {
    if ((options.format ?? "raw") === "json") {
      printJson(invocation.value);
    } else {
      const value = invocation.value as unknown as ResourceReadOperationOutput;
      process.stdout.write(Buffer.from(value.resource.content.data, "base64"));
    }
    return;
  }
  printJson(invocation.value);
}

export async function runProjectCommand(argv: string[]): Promise<void> {
  if (argv[0] === "layout" || argv[0] === "persona") {
    await runProjectLayoutCommand(argv);
    return;
  }
  if (argv[0] === "state") {
    await runProjectStateCommand(argv.slice(1));
    return;
  }
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    process.stdout.write(
      [
        "Usage: make-docs project surface ensure <archive|artifacts|assets>",
        "       make-docs project persona list [--target-root <path>] [--json]",
        "       make-docs project layout preview [--map <source>=<destination>] [--json]",
        "       make-docs project layout prepare --review <digest> --mode cli|manual [--map <source>=<destination>] [--json]",
        "       make-docs project layout apply|verify <operation-id> [--target-root <path>] [--json]",
        "       make-docs project state status [--target-root <path>] [--json]",
        "       make-docs project state recover <operation-id> --resume|--rollback [--dry-run] [--target-root <path>] [--json]",
        "",
        "Installation state belongs to the global Make Docs Store.",
        "The ensure command checks Store installation evidence and configured routers",
        "before it creates the selected on-demand directory. It reports the applied or",
        "unchanged state, plan dispositions, receipt, and next check.",
        "",
        "State status reads the Store and reports pending work without changing files.",
        "State recover requires an operation ID and exactly one recovery mode.",
        "Use --resume to apply the remaining verified steps of a complete saved plan.",
        "Use --rollback to restore verified prior file state. Changed files block recovery.",
        "Add --dry-run to inspect recovery without applying changes.",
        "",
      ].join("\n"),
    );
    return;
  }
  const [noun, verb, surface, ...rest] = argv;
  if (
    noun !== "surface" ||
    verb !== "ensure" ||
    !surface ||
    !["archive", "artifacts", "assets"].includes(surface)
  ) {
    throw new OperationError(
      "Use `make-docs project surface ensure <archive|artifacts|assets>`.",
    );
  }
  let targetRoot: string | undefined;
  let json = false;
  let dryRun = false;
  const seen = new Set<string>();
  while (rest.length) {
    const flag = rest.shift()!;
    if (seen.has(flag)) throw new OperationError(`Option ${flag} can be given only once.`);
    seen.add(flag);
    if (flag === '--json') json = true;
    else if (flag === '--dry-run') dryRun = true;
    else if (flag === '--target-root') {const value = rest.shift(); if (!value || value.startsWith('--')) throw new OperationError('--target-root requires a path.'); targetRoot = path.resolve(value);}
    else throw new OperationError(`Unexpected surface option: ${flag}.`);
  }
  const invocation = await invokeOperation(
    "project.surface.ensure",
    { surface, ...(targetRoot ? {targetRoot} : {}) },
    createExecutionContext({ surface: "cli", cwd: targetRoot, writesAllowed: true, dryRun }),
  );
  const value = invocation.value as unknown as ProjectSurfaceEnsureOutput;
  if (json) {printJson(value); return;}
  const planLines = value.plan.actions.map((action) =>
    `- ${action.disposition ?? action.type}: ${action.relativePath}`,
  );
  const state = value.dryRun
    ? "planned only"
    : value.receipt
      ? "applied"
      : "unchanged";
  const receipt = value.receipt?.receiptId ?? (value.dryRun ? "none (dry run)" : "none (no write)");
  process.stdout.write(
    [
      `Target: ${value.targetRoot}`,
      `Project surface: ${value.surface}`,
      `Ensured root: ${value.ensuredPath}`,
      `Content destination: ${value.contentDestination} (${value.contentDestinationExists ? 'exists' : 'not created; create it when content needs it'})`,
      `State: ${state}`,
      "Plan dispositions:",
      ...planLines,
      `Receipt: ${receipt}`,
      "Next: Run `make-docs setup --yes --dry-run` to confirm that managed project files remain current.",
      "",
    ].join("\n"),
  );
}

async function runProjectLayoutCommand(argv: string[]): Promise<void> {
  const [noun, verb, ...args] = argv;
  if (!verb || verb === '--help' || verb === '-h') {
    process.stdout.write((noun === 'persona' ? [
      'Usage: make-docs project persona list [--target-root <path>] [--json]',
      'Read effective project audiences. This command needs no Store and writes no files.',
    ] : [
      'Usage: make-docs project layout preview [--map <source>=<destination>]',
      '       make-docs project layout prepare --review <digest> --mode cli|manual [--map <source>=<destination>]',
      '       make-docs project layout apply <operation-id>',
      '       make-docs project layout verify <operation-id>',
      'All commands accept --target-root <path> and --json. Repeat --map for each reviewed choice.',
      'Preview reads only. Prepare saves required Store state before any file move.',
      'Apply moves a prepared CLI plan. Verify checks a prepared manual plan after you move files.',
      'A pending plan blocks conflicting managed writes. Use project state status or recover to inspect it.',
      'Manual-mode recovery resume checks completion; it does not perform the manual file moves.',
    ]).concat('').join('\n'));
    return;
  }
  if (noun === 'persona' ? verb !== 'list' : !['preview', 'prepare', 'apply', 'verify'].includes(verb)) throw new OperationError(`Unknown project ${noun} command: ${verb}.`);
  let targetRoot: string | undefined, review: string | undefined, mode: string | undefined, operationId: string | undefined;
  let json = false;
  const mappings: string[] = [], seen = new Set<string>();
  while (args.length) {
    const arg = args.shift()!;
    if (arg.startsWith('--') && arg !== '--map') {
      if (seen.has(arg)) throw new OperationError(`Option ${arg} can be given only once.`);
      seen.add(arg);
    }
    const value = () => {const next = args.shift(); if (!next || next.startsWith('--')) throw new OperationError(`${arg} requires a value.`); return next;};
    if (arg === '--json') json = true;
    else if (arg === '--target-root') targetRoot = path.resolve(value());
    else if (arg === '--map' && noun === 'layout' && ['preview', 'prepare'].includes(verb)) mappings.push(value());
    else if (arg === '--review' && noun === 'layout' && verb === 'prepare') review = value();
    else if (arg === '--mode' && noun === 'layout' && verb === 'prepare') mode = value();
    else if (!arg.startsWith('-') && noun === 'layout' && ['apply', 'verify'].includes(verb) && !operationId) operationId = arg;
    else throw new OperationError(`Unexpected argument for project ${noun} ${verb}: ${arg}.`);
  }
  if (verb === 'prepare' && (!review || !['cli', 'manual'].includes(mode ?? ''))) throw new OperationError('Preparation requires --review <digest> and --mode cli|manual.');
  if (['apply', 'verify'].includes(verb) && !operationId) throw new OperationError(`${verb} requires one prepared operation ID.`);
  const invocation = await invokeOperation(`project.${noun}.${verb}`, {
    ...(targetRoot ? {targetRoot} : {}),
    ...(noun === 'layout' && ['preview', 'prepare'].includes(verb) ? {mappings} : {}),
    ...(verb === 'prepare' ? {review, mode} : {}),
    ...(operationId ? {operationId} : {}),
  }, createExecutionContext({surface: 'cli', cwd: targetRoot, writesAllowed: noun === 'layout' && verb !== 'preview'}));
  const result = invocation.value as Record<string, any>;
  if (result.status === 'blocked') process.exitCode = 1;
  if (json) {printJson(result); return;}
  if (noun === 'persona') {
    process.stdout.write([`Project: ${result.targetRoot}`, ...result.personas.map((persona: any) => `${persona.slug}: ${persona.label} (${persona.primitive}) — ${persona.description}`), 'Read only. No Store or project files changed.', ''].join('\n'));
    return;
  }
  process.stdout.write([
    `Layout: ${result.status}`,
    ...(result.targetRoot ? [`Project: ${result.targetRoot}`] : []),
    ...(result.reviewDigest ? [`Review digest: ${result.reviewDigest}`] : []),
    ...(result.operationId ? [`Operation: ${result.operationId}`] : []),
    ...(result.entries ?? []).filter((entry: any) => entry.disposition !== 'preserve').map((entry: any) => `- ${entry.disposition}: ${entry.path}${entry.destination ? ` -> ${entry.destination}` : ''}`),
    ...(result.linkEdits ? [`Link text edits: ${result.linkEdits.length}`] : []),
    ...(result.linkChecks ? [`Unchanged link target checks: ${result.linkChecks.length}`] : []),
    ...(result.linkEdits ?? []).map((edit: any) => `- Link text in ${edit.destination}: ${edit.before} -> ${edit.after}`),
    ...(result.metadataEdits ?? []).map((edit: any) => `- Persona metadata in ${edit.destination ?? edit.source}: ${JSON.stringify(edit.before)} -> ${JSON.stringify(edit.after)}`),
    ...(result.instructions ?? []).map((instruction: any) => `- ${instruction.action}: ${instruction.source ? `${instruction.source} -> ` : ''}${instruction.path}${instruction.after.digest ? ` (SHA-256 ${instruction.after.digest})` : ''}`),
    ...(result.blockers ?? result.conflicts ?? []).map((blocker: string) => `Review: ${blocker}`),
    ...(result.notice ? [result.notice, 'Use --json to obtain the exact saved file bytes for manual writes.'] : []),
    ...(result.nextAction ? [`Next: ${result.nextAction}`] : []), '',
  ].join('\n'));
}

async function runProjectStateCommand(argv: string[]): Promise<void> {
  const [verb, ...args] = argv;
  if (!verb || verb === "--help" || verb === "-h") {
    process.stdout.write([
      "Usage: make-docs project state status [--target-root <path>] [--json]",
      "       make-docs project state recover <operation-id> --resume|--rollback [--dry-run] [--target-root <path>] [--json]",
      "",
      "Installation state belongs to the global Make Docs Store.",
      "Status reads the Store and reports pending work without changing files.",
      "Recovery requires an operation ID and exactly one recovery mode.",
      "Use --resume to apply the remaining verified steps of a complete saved plan.",
      "Use --rollback to restore verified prior file state. Changed files block recovery.",
      "Add --dry-run to inspect recovery without applying changes.",
      "",
    ].join("\n"));
    return;
  }
  if (verb !== "status" && verb !== "recover") throw new OperationError(`Unknown project state command: ${verb}.`);
  let targetRoot: string | undefined;
  let mode: "resume" | "rollback" | undefined;
  let dryRun = false;
  let json = false;
  let operationId: string | undefined;
  const seen = new Set<string>();
  while (args.length) {
    const arg = args.shift()!;
    if (arg.startsWith("--")) {
      if (seen.has(arg)) throw new OperationError(`Option ${arg} can be given only once.`);
      seen.add(arg);
    }
    if (arg === "--target-root") {
      const value = args.shift();
      if (!value || value.startsWith("--")) throw new OperationError("--target-root requires a path.");
      targetRoot = path.resolve(value);
    } else if (arg === "--json") json = true;
    else if (arg === "--dry-run" && verb === "recover") dryRun = true;
    else if ((arg === "--resume" || arg === "--rollback") && verb === "recover") {
      if (mode) throw new OperationError("Recovery requires exactly one of --resume or --rollback.");
      mode = arg === "--resume" ? "resume" : "rollback";
    } else if (!arg.startsWith("--") && verb === "recover" && !operationId) operationId = arg;
    else throw new OperationError(`Unexpected argument for project state ${verb}: ${arg}.`);
  }
  if (verb === "recover" && (!operationId || !mode)) throw new OperationError("Recovery requires one operation ID and exactly one of --resume or --rollback.");
  const invocation = await invokeOperation(`project.state.${verb}`, {
    ...(targetRoot ? { targetRoot } : {}),
    ...(verb === "recover" ? { operationId, mode } : {}),
  }, createExecutionContext({ surface: "cli", cwd: targetRoot, writesAllowed: verb === "recover", dryRun }));
  if (json) { printJson(invocation.value); return; }
  const value = invocation.value as Record<string, unknown>;
  const labels: Record<string, string> = {
    "ready": verb === "recover" ? "Recovery is ready for review." : "Make Docs installation state is ready.",
    "unregistered": "This checkout has no registered installation.",
    "ownership-unverified": "Installation ownership needs review.",
    "recovery-required": "An unfinished operation needs recovery.",
    "writer-active": "Another Make Docs writer is active.",
    "store-unavailable": "The Make Docs Store is unavailable.",
    "completed": "Recovery completed.",
    "rolled-back": "Recovery restored the prior state.",
    "blocked": "Recovery stopped to preserve changed files.",
  };
  const state = String(value.status ?? value.code ?? "unknown");
  process.stdout.write([
    labels[state] ?? `State: ${state}`,
    ...(value.projectId ? [`Project ID: ${String(value.projectId)}`] : []),
    ...(value.checkoutId ? [`Checkout: ${String(value.checkoutId)}`] : []),
    ...(value.installationVersion ? [`Installed version: ${String(value.installationVersion)}`] : []),
    ...(value.pendingOperation ? [`Pending operation: ${JSON.stringify(value.pendingOperation)}`] : []),
    ...(value.operationId ? [`Operation: ${String(value.operationId)}`] : []),
    ...(value.dryRun ? ["Preview only. No files or Store records changed."] : []),
    ...(Array.isArray(value.changes) ? value.changes.map((change: {path: string; to: string}) => `- ${change.path}: ${change.to}`) : []),
    ...(Array.isArray(value.conflicts) ? value.conflicts.map((conflict: unknown) => `Review: ${String(conflict)}`) : []),
    ...(value.nextAction ? [`Next: ${String(value.nextAction)}`] : state === "blocked" ? ["Next: Review the listed conflicts. Preserve current files."] : value.dryRun && state === "ready" ? ["Next: Review this preview before running the same recovery command without --dry-run."] : []),
    "",
  ].join("\n"));
}
