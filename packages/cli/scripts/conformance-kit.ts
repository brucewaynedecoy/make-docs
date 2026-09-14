/**
 * Maintainer lab tooling: conformance kit generation entry point (PRD 43
 * R-HOME-1; W18 R13 P2 t4). Invoked through the `conformance:kit` npm script
 * — deliberately NOT a registered operation, NOT on the shipped CLI command
 * tree, and NOT an MCP tool: the kit's required assets (`conformance/**`)
 * are structurally excluded from every install by R-TEST-3, so a shipped
 * command could never succeed for a user (the D-022 category error at the
 * command level). The W18 R11 parity rule is preserved vacuously; the
 * revisit seam is recorded on register item Q-022.
 *
 * Usage (from the repo root):
 *   npm run conformance:kit -- --scenario packaging/plugin-marketplace-install [--target codex] [--session-root <dir>] [--force] [--disambiguator <slug>]
 *   npm run conformance:kit -- --first-pass-suite [--target codex] [--sessions-root <dir>] [--force] [--disambiguator <slug>]
 *   npm run conformance:kit -- --scenario setup-access/mcp-store-operations --harness codex --connection-method mcp --model-or-provider <value> --runtime <value> --harness-version <value> --packed-product <file.tgz> --session-root <disposable-dir>
 *   npm run conformance:kit -- --cleanup-session <disposable-session/manifest.json>
 *
 * Regenerating the same scenario+target on the same day reuses the same
 * deterministic session id, so the default root collides (R-KIT-2). To iterate
 * without hand-deleting: `--force` replaces the superseded session in place;
 * `--disambiguator <slug>` mints a distinct session id so rounds sit side by
 * side (register item D-028).
 */

import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  bootstrapSetupAccessLabSession,
  cleanupSetupAccessLabSession,
  REQUIRED_FIRST_PASS_TARGET,
  defaultConformanceSessionRoot,
  generateConformanceKit,
  generateFirstPassConformanceKitSuite,
  loadPackagingConformanceScenarioSpec,
  mintConformanceLabSessionId,
  splitConformanceScenarioId,
  type ConformanceScenarioFamily,
  type ConformanceTupleConnectionMethod,
  type ConformanceTupleHarness,
} from "../src/conformance";

interface CliArguments {
  scenario: string | null;
  firstPassSuite: boolean;
  target: string;
  sessionRoot: string | null;
  sessionsRoot: string | null;
  repoRoot: string;
  force: boolean;
  disambiguator: string | null;
  harness: string | null;
  connectionMethod: string | null;
  modelOrProvider: string | null;
  runtime: string | null;
  harnessVersion: string | null;
  packedProduct: string | null;
  cleanupSession: string | null;
}

/**
 * The directory the operator invoked `npm run` from (npm's `INIT_CWD`), so
 * operator-supplied relative paths resolve against where the operator is —
 * not the `packages/cli/` working directory the root `-w packages/cli`
 * passthrough runs this script in.
 */
const INVOCATION_CWD = process.env.INIT_CWD ?? process.cwd();

function parseArguments(argv: string[]): CliArguments {
  const parsed: CliArguments = {
    scenario: null,
    firstPassSuite: false,
    target: REQUIRED_FIRST_PASS_TARGET,
    sessionRoot: null,
    sessionsRoot: null,
    repoRoot: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", ".."),
    force: false,
    disambiguator: null,
    harness: null,
    connectionMethod: null,
    modelOrProvider: null,
    runtime: null,
    harnessVersion: null,
    packedProduct: null,
    cleanupSession: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    const next = (): string => {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`\`${argument}\` requires a value.`);
      }
      index += 1;
      return value;
    };
    switch (argument) {
      case "--scenario":
        parsed.scenario = next();
        break;
      case "--first-pass-suite":
        parsed.firstPassSuite = true;
        break;
      case "--target":
        parsed.target = next();
        break;
      case "--session-root":
        parsed.sessionRoot = path.resolve(INVOCATION_CWD, next());
        break;
      case "--sessions-root":
        parsed.sessionsRoot = path.resolve(INVOCATION_CWD, next());
        break;
      case "--repo-root":
        parsed.repoRoot = path.resolve(INVOCATION_CWD, next());
        break;
      case "--force":
        parsed.force = true;
        break;
      case "--disambiguator":
        parsed.disambiguator = next();
        break;
      case "--harness":
        parsed.harness = next();
        break;
      case "--connection-method":
        parsed.connectionMethod = next();
        break;
      case "--model-or-provider":
        parsed.modelOrProvider = next();
        break;
      case "--runtime":
        parsed.runtime = next();
        break;
      case "--harness-version":
        parsed.harnessVersion = next();
        break;
      case "--packed-product":
        parsed.packedProduct = path.resolve(INVOCATION_CWD, next());
        break;
      case "--cleanup-session":
        parsed.cleanupSession = path.resolve(INVOCATION_CWD, next());
        break;
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (parsed.cleanupSession) {
    if (parsed.firstPassSuite || parsed.scenario !== null || argv.length !== 2) {
      throw new Error("Pass `--cleanup-session <manifest>` by itself.");
    }
    return parsed;
  }
  if (parsed.firstPassSuite === (parsed.scenario !== null)) {
    throw new Error("Pass exactly one of --scenario <domain/outcome> or --first-pass-suite.");
  }
  if (parsed.scenario?.startsWith("setup-access/")) {
    const missing = [
      ["--harness", parsed.harness],
      ["--connection-method", parsed.connectionMethod],
      ["--model-or-provider", parsed.modelOrProvider],
      ["--runtime", parsed.runtime],
      ["--harness-version", parsed.harnessVersion],
      ["--packed-product", parsed.packedProduct],
      ["--session-root", parsed.sessionRoot],
    ].filter(([, value]) => !value).map(([flag]) => flag);
    if (missing.length > 0) {
      throw new Error(`Setup-access bootstrap requires ${missing.join(", ")}.`);
    }
    if (parsed.force || parsed.disambiguator || parsed.sessionsRoot) {
      throw new Error("Setup-access bootstrap accepts one new empty session root. It does not accept --force, --disambiguator, or --sessions-root.");
    }
  }
  return parsed;
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2));
  if (args.cleanupSession) {
    const cleaned = cleanupSetupAccessLabSession({
      manifestPath: args.cleanupSession,
      repoRoot: args.repoRoot,
    });
    process.stdout.write("Cleaned setup-access lab session:\n");
    process.stdout.write(`- cleanup evidence: ${cleaned.cleanupPath}\n`);
    process.stdout.write(`- native entry removed: ${String(cleaned.nativeEntryRemoved)}\n`);
    process.stdout.write(`- user content preserved: ${String(cleaned.userContentPreserved)}\n`);
    return;
  }
  const sessionDate = new Date().toISOString().slice(0, 10);
  if (args.firstPassSuite) {
    const sessionsRoot =
      args.sessionsRoot ?? path.join(os.tmpdir(), "make-docs-conformance-lab", `${sessionDate}-${args.target}-first-pass`);
    const kits = await generateFirstPassConformanceKitSuite({
      sessionsRoot,
      harness: args.target,
      repoRoot: args.repoRoot,
      sessionDate,
      disambiguator: args.disambiguator ?? undefined,
      force: args.force,
    });
    process.stdout.write(`Generated ${kits.length} first-pass lab-session kit(s) for \`${args.target}\`:\n`);
    for (const kit of kits) {
      process.stdout.write(`- ${kit.sessionId}: ${kit.sessionRoot}\n`);
    }
    return;
  }
  const scenarioId = args.scenario!;
  if (scenarioId.startsWith("setup-access/")) {
    const lab = await bootstrapSetupAccessLabSession({
      scenario: scenarioId as ConformanceScenarioFamily,
      harness: args.harness as ConformanceTupleHarness,
      connectionMethod: args.connectionMethod as ConformanceTupleConnectionMethod,
      modelOrProvider: args.modelOrProvider!,
      runtime: args.runtime!,
      harnessVersion: args.harnessVersion!,
      packedProduct: args.packedProduct!,
      sessionRoot: args.sessionRoot!,
      repoRoot: args.repoRoot,
    });
    process.stdout.write(`Bootstrapped setup-access lab session:\n`);
    process.stdout.write(`- session root: ${lab.manifest.session.root}\n`);
    process.stdout.write(`- manifest: ${lab.manifestPath}\n`);
    process.stdout.write(`- measurements: ${lab.measurementsPath}\n`);
    process.stdout.write("- support status: unchanged; no result was written\n");
    return;
  }
  const { outcome } = splitConformanceScenarioId(scenarioId);
  const sessionId = mintConformanceLabSessionId({
    date: sessionDate,
    harness: args.target,
    outcome,
    disambiguator: args.disambiguator ?? undefined,
  });
  const spec = loadPackagingConformanceScenarioSpec(
    path.join(args.repoRoot, "conformance", "scenarios", `${scenarioId}.json`),
  );
  const kit = await generateConformanceKit({
    spec,
    harness: args.target,
    sessionRoot: args.sessionRoot ?? defaultConformanceSessionRoot({ sessionId }),
    repoRoot: args.repoRoot,
    sessionId,
    force: args.force,
  });
  process.stdout.write(`Generated lab-session kit \`${kit.sessionId}\`:\n`);
  process.stdout.write(`- session root: ${kit.sessionRoot}\n`);
  process.stdout.write(`- manifest: ${kit.manifestPath}\n`);
  process.stdout.write(`- start with: ${path.join(kit.kitDir, "prompts", "session-prompt.md")}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
