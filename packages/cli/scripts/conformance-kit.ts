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
  REQUIRED_FIRST_PASS_TARGET,
  defaultConformanceSessionRoot,
  generateConformanceKit,
  generateFirstPassConformanceKitSuite,
  loadPackagingConformanceScenarioSpec,
  mintConformanceLabSessionId,
  splitConformanceScenarioId,
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
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (parsed.firstPassSuite === (parsed.scenario !== null)) {
    throw new Error("Pass exactly one of --scenario <domain/outcome> or --first-pass-suite.");
  }
  return parsed;
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2));
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
