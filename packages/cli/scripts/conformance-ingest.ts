/**
 * Maintainer lab tooling: conformance lab-session ingestion entry point (PRD
 * 43 R-ING-1..2, R-HOME-1; PRD 44 R-EXEC-1..3; W18 R13 P3 t1-t4). Invoked
 * through the `conformance:ingest` npm script — like the kit generator,
 * deliberately NOT a registered operation, NOT on the shipped CLI tree, and
 * NOT an MCP tool (the same D-022 category error would apply). The W18 R11
 * parity rule is preserved vacuously; the revisit seam is on register item
 * Q-022.
 *
 * Ingestion assembles a `conformance.result.v1` record from a driven session:
 * every asserted bar-stage boolean derives SOLELY from that stage's instrument
 * outputs, and every operator contribution is recorded as an attestation. By
 * default this previews the assembled record and its measured-vs-attested
 * provenance; `--write` commits the record under `conformance/results/
 * <harness>/`. Binding the record to the tuple registry is a separate reviewed
 * step through `recordConformanceRunOnRegistryEntry` — never automated here.
 *
 * Usage (from the repo root):
 *   npm run conformance:ingest -- --session-root <dir> --attestations <file.json> \
 *     [--run-date YYYY-MM-DD] [--sequence N] [--write]
 *
 * The attestations file is a JSON object matching ConformanceOperatorAttestations:
 *   {
 *     "modelName": "...", "providerOrRoutingLayer": "...", "modelVersion": "...",
 *     "runtimeDistribution": "node", "runtimeVersion": "22.5.0",
 *     "attestedPreconditionIds": ["network-available", "model-routing-available"],
 *     "narrativeReason": "...", "transcriptLogPointer": "discarded-with-session",
 *     "transcriptFormat": "non-tty"
 *   }
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ingestConformanceLabSession,
  loadPackagingConformanceScenarioSpec,
  writeConformanceResultRecord,
  type ConformanceOperatorAttestations,
} from "../src/conformance";

interface CliArguments {
  sessionRoot: string | null;
  attestations: string | null;
  runDate: string | null;
  sequence: number;
  write: boolean;
  repoRoot: string;
}

function parseArguments(argv: string[]): CliArguments {
  const parsed: CliArguments = {
    sessionRoot: null,
    attestations: null,
    runDate: null,
    sequence: 1,
    write: false,
    repoRoot: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", ".."),
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
      case "--session-root":
        parsed.sessionRoot = path.resolve(next());
        break;
      case "--attestations":
        parsed.attestations = path.resolve(next());
        break;
      case "--run-date":
        parsed.runDate = next();
        break;
      case "--sequence":
        parsed.sequence = Number.parseInt(next(), 10);
        break;
      case "--write":
        parsed.write = true;
        break;
      case "--repo-root":
        parsed.repoRoot = path.resolve(next());
        break;
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!parsed.sessionRoot || !parsed.attestations) {
    throw new Error("Both --session-root <dir> and --attestations <file.json> are required.");
  }
  return parsed;
}

function main(): void {
  const args = parseArguments(process.argv.slice(2));
  const manifest = JSON.parse(
    readFileSync(path.join(args.sessionRoot!, "kit", "manifest.json"), "utf8"),
  ) as { scenarioId: string };
  const spec = loadPackagingConformanceScenarioSpec(
    path.join(args.repoRoot, "conformance", "scenarios", `${manifest.scenarioId}.json`),
  );
  const operator = JSON.parse(readFileSync(args.attestations!, "utf8")) as ConformanceOperatorAttestations;

  const result = ingestConformanceLabSession({
    sessionRoot: args.sessionRoot!,
    spec,
    operator,
    runDate: args.runDate ?? undefined,
    sequence: args.sequence,
  });

  process.stdout.write(`Ingested lab session \`${result.assembly.sessionId}\` (${result.assembly.scenarioId} on ${result.assembly.harness}):\n`);
  process.stdout.write(`- verdict: ${result.record.verdict} (supportClaimUse ${result.record.supportClaimUse})\n`);
  process.stdout.write("- evidence bar (MEASURED from instruments only):\n");
  for (const measurement of result.assembly.measured) {
    const mark = measurement.value ? "PASS" : measurement.asserted ? "not confirmed" : "not asserted";
    process.stdout.write(`    ${measurement.stage}: ${mark} — ${measurement.detail}\n`);
  }
  if (result.record.caveats.length > 0) {
    process.stdout.write("- caveats (surfaced on the record):\n");
    for (const caveat of result.record.caveats) {
      process.stdout.write(`    - ${caveat}\n`);
    }
  }
  process.stdout.write(`- verdict derivation: ${result.assembly.verdictDerivation}\n`);
  process.stdout.write(`- committed home: ${result.recordRef}\n`);

  if (args.write) {
    const written = writeConformanceResultRecord({ result, repoRoot: args.repoRoot, writeProvenance: true });
    process.stdout.write(`\nWrote result record: ${written}\n`);
    process.stdout.write(
      "Next (reviewed step): bind it to its tuple through recordConformanceRunOnRegistryEntry and commit the registry change after review.\n",
    );
  } else {
    process.stdout.write("\nPreview only. Re-run with --write to commit the record under conformance/results/.\n");
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
