/**
 * Maintainer lab tooling: conformance lab-session ingestion entry point (PRD
 * 43 R-ING-1..2, R-HOME-1; PRD 44 R-EXEC-1..3; W18 R13 P3 t1-t4). Invoked
 * through the `conformance:ingest` npm script — like the kit generator,
 * deliberately NOT a registered operation, NOT on the shipped CLI tree, and
 * NOT an MCP tool (the same D-022 category error would apply). The W18 R11
 * parity rule is preserved vacuously; the revisit seam is on register item
 * Q-022.
 *
 * Setup-access ingestion assembles `conformance.result.v2`. The retired
 * packaging path remains readable for history.
 * every asserted bar-stage boolean derives SOLELY from that stage's instrument
 * outputs, and every operator contribution is recorded as an attestation. By
 * default this previews the assembled record and its measured-vs-attested
 * provenance; `--write` commits the record under `conformance/results/
 * <harness>/`. Setup-access `--write` also records the exact tuple after a
 * maintainer review and a source-registry digest check.
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

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ingestConformanceLabSession,
  ingestSetupAccessLabSession,
  CONFORMANCE_TUPLE_REGISTRY_PATH,
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

/**
 * The directory the operator invoked `npm run` from. npm sets `INIT_CWD` to
 * that directory, so operator-supplied relative paths (`--session-root`,
 * `--attestations`) resolve against where the operator actually is — not the
 * `packages/cli/` working directory the root `-w packages/cli` passthrough
 * runs this script in.
 */
const INVOCATION_CWD = process.env.INIT_CWD ?? process.cwd();

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
        parsed.sessionRoot = path.resolve(INVOCATION_CWD, next());
        break;
      case "--attestations":
        parsed.attestations = path.resolve(INVOCATION_CWD, next());
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
        parsed.repoRoot = path.resolve(INVOCATION_CWD, next());
        break;
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!parsed.sessionRoot) {
    throw new Error("--session-root <dir> is required.");
  }
  return parsed;
}

function main(): void {
  const args = parseArguments(process.argv.slice(2));
  const setupAccessManifestPath = path.join(args.sessionRoot!, "manifest.json");
  if (existsSync(setupAccessManifestPath)) {
    const attestation = args.attestations
      ? JSON.parse(readFileSync(args.attestations, "utf8")) as {
          reviewerStatus?: "unreviewed" | "reviewed" | "needs-follow-up" | "rejected";
          reason?: string;
        }
      : {};
    const result = ingestSetupAccessLabSession({
      sessionRoot: args.sessionRoot!,
      sequence: args.sequence,
      reviewerStatus: attestation.reviewerStatus,
      reason: attestation.reason,
    });
    process.stdout.write(`Ingested setup-access session:\n`);
    process.stdout.write(`- tuple: ${Object.values(result.record.tuple).join(" / ")}\n`);
    process.stdout.write(`- verdict: ${result.record.verdict}\n`);
    process.stdout.write(`- result: ${result.recordRef}\n`);
    process.stdout.write(`- derived status: ${result.promotedRegistry.tuples.find(entry => entry.tuple.scenario === result.record.tuple.scenario && entry.tuple.harness === result.record.tuple.harness && entry.tuple.connectionMethod === result.record.tuple.connectionMethod)?.status ?? "unknown"}\n`);
    if (args.write) {
      if (attestation.reviewerStatus !== "reviewed") {
        throw new Error("Setup-access --write requires an attestation file with reviewerStatus `reviewed`.");
      }
      const manifest = JSON.parse(readFileSync(setupAccessManifestPath, "utf8")) as {
        registry: { source: string; sourceDigest: string };
      };
      const expectedRegistrySource = path.join(args.repoRoot, CONFORMANCE_TUPLE_REGISTRY_PATH);
      if (path.resolve(manifest.registry.source) !== path.resolve(expectedRegistrySource)) {
        throw new Error("The setup-access session does not point to this repository's root registry.");
      }
      const currentDigest = createHash("sha256").update(readFileSync(manifest.registry.source)).digest("hex");
      if (currentDigest !== manifest.registry.sourceDigest) {
        throw new Error("The source registry changed after bootstrap. Start a new session against the current registry.");
      }
      const resultPath = path.join(args.repoRoot, result.recordRef);
      mkdirSync(path.dirname(resultPath), { recursive: true });
      writeFileSync(resultPath, `${JSON.stringify(result.record, null, 2)}\n`);
      writeFileSync(manifest.registry.source, `${JSON.stringify(result.promotedRegistry, null, 2)}\n`);
      process.stdout.write(`Wrote reviewed result and promoted the exact source tuple.\n`);
    } else {
      process.stdout.write("Preview only. No result or registry change was written.\n");
    }
    return;
  }
  if (!args.attestations) {
    throw new Error("Packaging ingestion requires --attestations <file.json>.");
  }
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
