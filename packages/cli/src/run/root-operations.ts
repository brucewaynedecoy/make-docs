import path from "node:path";
import { Buffer } from "node:buffer";
import { createExecutionContext } from "../operations/context";
import { invokeOperation } from "../operations/registry";
import type {
  ResourceListOperationOutput,
  ResourceReadOperationOutput,
} from "../operations/resource";
import { OperationError } from "../operations/types";

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
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    process.stdout.write(
      "Usage: make-docs project surface ensure <archive|artifacts|assets>\n",
    );
    return;
  }
  const [noun, verb, surface, ...rest] = argv;
  if (
    noun !== "surface" ||
    verb !== "ensure" ||
    !surface ||
    rest.length > 0 ||
    !["archive", "artifacts", "assets"].includes(surface)
  ) {
    throw new OperationError(
      "Use `make-docs project surface ensure <archive|artifacts|assets>`.",
    );
  }
  await invokeOperation(
    "project.surface.ensure",
    { surface },
    createExecutionContext({ surface: "cli", writesAllowed: false }),
  );
}
