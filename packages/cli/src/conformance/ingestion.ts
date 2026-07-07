/**
 * Fail-closed lab-session ingestion (PRD 43 R-ING-1..2; PRD 44 R-EXEC-1..3;
 * W18 R13 P3 t1-t4).
 *
 * Ingestion closes the loop from a driven lab session to the tuple registry.
 * It is where "the agent drives, the instruments measure" becomes
 * ENFORCEABLE: each asserted bar-stage boolean on the assembled
 * `conformance.result.v1` record derives SOLELY from that stage's instrument
 * outputs, validated against the session manifest's expected-evidence table.
 * A missing or failed instrument output yields `false` for that stage — there
 * is no narrative rescue. Everything the driving agent or human contributes —
 * the run metadata (model, provider, runtime), the operator attestations
 * (network, model routing), and the narrative reason — is recorded as an
 * ATTESTATION, structurally separate from the measurements in the assembly
 * provenance, and can never turn a false measurement true.
 *
 * The recording seam does not change (PRD 43 R-ING-2): the assembled record is
 * validated against the existing result contract, written under
 * `conformance/results/<harness>/`, and bound to its tuple exclusively through
 * {@link recordConformanceRunOnRegistryEntry} — whose refusals (unasserted
 * stages, tuple or harness mismatch, simulation-posture mismatch) and receipts
 * discipline apply as-is. Ingestion itself never mutates the tuple registry.
 *
 * The discover honesty rule (the load-bearing distinction, register item
 * R-021): a bar stage is confirmable only by an instrument that measures the
 * thing the stage asserts. `install`, `invoke`, and `uninstall` assert Make
 * Docs behaviors or a harness's own transcript output, all directly measured.
 * `discover` asserts a HARNESS RECOGNITION — that the harness's own listing
 * surface shows the installed package. A directory listing or manifest read of
 * a path MAKE DOCS ITSELF WROTE re-observes placement (the install evidence),
 * NOT recognition: a non-empty `.codex/plugins/` listing proves we wrote
 * files, never that the harness found them. So only a `command-output`
 * capture — the harness running its OWN listing command and reporting what IT
 * sees — can confirm discover. A target whose descriptor declares no such
 * verified harness-listing surface (Codex today: its listing captures are file
 * surfaces, and the workspace-plugins UI observation stays narrative context)
 * cannot reach an instrument-confirmed discover; the stage resolves false with
 * a caveat naming exactly why, and the tuple honestly stays below
 * conformance-validated. This is the redesign's whole point: never let "files
 * were written" masquerade as "the harness recognized them".
 *
 * Home (PRD 43 R-HOME-1): ingestion is maintainer lab tooling like the kit
 * generator — invoked through an npm script, registered nowhere, on no shipped
 * CLI or MCP surface. It reads a session's `evidence/` and `kit/manifest.json`
 * and produces a compact committed record; it needs no harness knowledge of
 * its own (all of that lives in the manifest the kit generated).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { OperationError } from "../operations/types";
import { conformanceResultRecordRelativePath } from "./governance";
import {
  CONFORMANCE_SESSION_MANIFEST_SCHEMA_VERSION,
  type ConformanceSessionManifest,
} from "./kit";
import { CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION } from "./lab-session";
import {
  CONFORMANCE_EVIDENCE_BAR_STAGES,
  type ConformanceEvidenceBarStage,
  type ConformanceTupleRegistryEntry,
} from "./registry";
import {
  CONFORMANCE_RESULT_SCHEMA_VERSION,
  blockedPackagingResultRecord,
  getScenarioTargetBinding,
  listUnassertedEvidenceBarStages,
  recordConformanceRunOnRegistryEntry,
  splitConformanceScenarioId,
  validatePackagingConformanceResultRecord,
  type PackagingConformanceResultRecord,
  type PackagingConformanceScenarioSpec,
  type ScenarioPreconditionProbeOutcome,
} from "./scenario";

/** Provenance-record schema id: the audit trail of measured vs attested. */
export const CONFORMANCE_INGESTION_PROVENANCE_SCHEMA_VERSION =
  "conformance.ingestion-provenance.v1";

/* --------------------------------------------------------------------------
 * Operator-contributed material (attestations, never measurements)
 * ------------------------------------------------------------------------ */

/**
 * The operator-contributed inputs to ingestion — the run metadata and
 * attestations the driving human or agent supplies. Every field here is an
 * ATTESTATION, recorded as such and structurally distinguishable from the
 * instrument measurements; none of it can turn a false bar-stage measurement
 * true (PRD 44 R-EXEC-2).
 */
export interface ConformanceOperatorAttestations {
  /** Run metadata: the model the harness routed to (or `unknown` if none reached). */
  modelName: string;
  providerOrRoutingLayer: string;
  modelVersion: string;
  runtimeDistribution: string;
  runtimeVersion: string;
  /**
   * Ids of the definition's `operator-attestation` preconditions (network,
   * model routing) the operator explicitly attests were satisfied. A manifest
   * attestation precondition NOT listed here is unmet and blocks the session
   * (the default is unmet — an unattended run never assumes expensive
   * preconditions hold).
   */
  attestedPreconditionIds: string[];
  /**
   * Ids of probeable (`command-succeeds`) preconditions the operator reports
   * UNMET — the session aborted at precondition probing. Empty means every
   * probeable precondition passed (the session reached instrumentation).
   */
  unmetProbeablePreconditionIds?: string[];
  /** The operator's plain honest narrative — context for ingestion, never a verdict input. */
  narrativeReason: string;
  /** Retained-evidence pointer (store lab area) or `discarded-with-session`. */
  transcriptLogPointer?: string;
  /** Whether transcripts pinned `--json` or ran non-TTY (R-INST-2). */
  transcriptFormat?: "json" | "non-tty";
  /**
   * Additional operator caveats — e.g. harness-side residue removed through
   * the harness's own flow (attributed to the harness, not `setup remove`).
   * Surfaced on the record like every instrument-derived caveat.
   */
  additionalCaveats?: string[];
}

/* --------------------------------------------------------------------------
 * Measurement provenance
 * ------------------------------------------------------------------------ */

/** One bar stage's measured outcome plus the audit trail of how it was derived. */
export interface ConformanceStageMeasurement {
  stage: ConformanceEvidenceBarStage;
  /** True only when this stage is asserted by the definition AND its instruments confirm it. */
  value: boolean;
  /** False when the definition asserts no expectation for this stage (not bar-eligible). */
  asserted: boolean;
  /** Session-relative instrument outputs this measurement read. */
  outputsRead: string[];
  /** Whether every expected output for the stage was present. */
  outputsPresent: boolean;
  /** One line: what the instruments showed and why the boolean is what it is. */
  detail: string;
  /** A caveat to surface on the record when the stage is asserted but not confirmed. */
  caveat: string | null;
}

/**
 * The assembly provenance: measured stages (from instruments only) held apart
 * from attested metadata (from the operator). Written beside the committed
 * record as an audit trail proving the evidence bar was measured, not attested
 * (PRD 44 R-EXEC-2 "distinguishable from measurement").
 */
export interface ConformanceIngestionAssembly {
  schemaVersion: typeof CONFORMANCE_INGESTION_PROVENANCE_SCHEMA_VERSION;
  sessionId: string;
  scenarioId: string;
  harness: string;
  blocked: boolean;
  unmetPreconditions: { id: string; reason: string }[];
  measured: ConformanceStageMeasurement[];
  attested: {
    modelName: string;
    providerOrRoutingLayer: string;
    modelVersion: string;
    runtimeDistribution: string;
    runtimeVersion: string;
    attestedPreconditionIds: string[];
    transcriptLogPointer: string;
    transcriptFormat: "json" | "non-tty";
    narrativeReason: string;
  };
  caveats: string[];
  verdictDerivation: string;
}

export interface ConformanceIngestionResult {
  record: PackagingConformanceResultRecord;
  /** Repo-relative committed home of the record (`conformance/results/<harness>/...`). */
  recordRef: string;
  assembly: ConformanceIngestionAssembly;
}

/* --------------------------------------------------------------------------
 * Instrument-output readers (deterministic, no interpretation beyond the
 * expected-evidence rules)
 * ------------------------------------------------------------------------ */

function readSessionJson(sessionRoot: string, relative: string): unknown | null {
  const absolute = path.join(sessionRoot, relative);
  if (!existsSync(absolute)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(absolute, "utf8")) as unknown;
  } catch (error) {
    throw new OperationError(
      `Conformance ingestion: instrument output \`${relative}\` is not valid JSON: ${String(error)}.`,
    );
  }
}

function readSessionText(sessionRoot: string, relative: string): string | null {
  const absolute = path.join(sessionRoot, relative);
  if (!existsSync(absolute)) {
    return null;
  }
  return readFileSync(absolute, "utf8");
}

interface CapturedCommand {
  command?: string;
  exitCode?: number | null;
}

function everyCommandSucceeded(commands: CapturedCommand[]): boolean {
  return commands.length > 0 && commands.every((command) => command.exitCode === 0);
}

function firstNonZeroExit(commands: CapturedCommand[]): number | null {
  for (const command of commands) {
    if (typeof command.exitCode === "number" && command.exitCode !== 0) {
      return command.exitCode;
    }
  }
  return commands.length > 0 ? 0 : null;
}

/* --------------------------------------------------------------------------
 * Per-stage measurement (R-ING-1)
 * ------------------------------------------------------------------------ */

function measureInstallStage(
  sessionRoot: string,
  outputs: string[],
): { measurement: Omit<ConformanceStageMeasurement, "stage" | "asserted">; producedFiles: string[]; exitStatus: number | null } {
  const commandsDoc = readSessionJson(sessionRoot, "evidence/install/commands.json") as
    | { commands?: CapturedCommand[] }
    | null;
  const inventoryDoc = readSessionJson(sessionRoot, "evidence/install/placement-inventory.json") as
    | { entries?: { path: string }[] }
    | null;
  const outputsPresent = commandsDoc !== null && inventoryDoc !== null;
  if (!outputsPresent) {
    return {
      measurement: {
        value: false,
        outputsRead: outputs,
        outputsPresent: false,
        detail: "install not measured: the install instrument output is missing (no rescue from narrative).",
        caveat: "install stage was not measured — the install instrument produced no output.",
      },
      producedFiles: [],
      exitStatus: null,
    };
  }
  const commands = commandsDoc.commands ?? [];
  const entries = inventoryDoc.entries ?? [];
  const commandsOk = everyCommandSucceeded(commands);
  const filesPlaced = entries.length > 0;
  const value = commandsOk && filesPlaced;
  return {
    measurement: {
      value,
      outputsRead: outputs,
      outputsPresent: true,
      detail: value
        ? `install confirmed: every install command exited 0 and ${String(entries.length)} file(s) were placed under the descriptor-declared roots.`
        : `install not confirmed: ${commandsOk ? "" : "an install command exited non-zero"}${!commandsOk && !filesPlaced ? "; " : ""}${filesPlaced ? "" : "no files were placed under the declared roots"}.`,
      caveat: value ? null : "install stage did not confirm from its instrument output.",
    },
    producedFiles: entries.map((entry) => entry.path).sort(),
    exitStatus: firstNonZeroExit(commands),
  };
}

interface DiscoverCapture {
  id?: string;
  kind?: string;
  status?: string;
  exitCode?: number | null;
  stdout?: string;
  entryCount?: number;
  exists?: boolean;
}

/**
 * The discover honesty rule (see the module header). Only a `command-output`
 * capture — the harness's own listing command — can confirm recognition;
 * `directory-listing`/`manifest-read` captures re-observe Make Docs' own
 * placement and never confirm discover on their own.
 */
function measureDiscoverStage(
  sessionRoot: string,
  outputs: string[],
  packageId: string | null,
): Omit<ConformanceStageMeasurement, "stage" | "asserted"> {
  const capturesDoc = readSessionJson(sessionRoot, "evidence/discover/captures.json") as
    | { captures?: DiscoverCapture[] }
    | null;
  if (capturesDoc === null) {
    return {
      value: false,
      outputsRead: outputs,
      outputsPresent: false,
      detail: "discover not measured: the discover instrument output is missing.",
      caveat: "discover stage was not measured — the discover instrument produced no output.",
    };
  }
  const captures = capturesDoc.captures ?? [];
  const recognitionCaptures = captures.filter((capture) => capture.kind === "command-output");
  const placementCaptureIds = captures
    .filter((capture) => capture.kind !== "command-output")
    .map((capture) => capture.id ?? "(unnamed)");

  if (recognitionCaptures.length === 0) {
    // The load-bearing honest outcome: the descriptor declares no verified
    // harness-listing command, so every capture only re-observes files Make
    // Docs wrote. Placement is not recognition; whether the harness FOUND the
    // package is narrative context, never evidence (R-EXEC-1, register item
    // R-021).
    return {
      value: false,
      outputsRead: outputs,
      outputsPresent: true,
      detail:
        "discover not confirmed: no harness-listing (command-output) capture exists — the captured surfaces re-observe Make Docs' own placement, not harness recognition.",
      caveat:
        "discover is not instrument-confirmable for this target: the harness capability descriptor declares no verified machine-readable listing command, so the only captures are file surfaces that re-observe Make Docs' own placement" +
        (placementCaptureIds.length > 0 ? ` (${placementCaptureIds.join(", ")})` : "") +
        ". Whether the harness RECOGNIZES the package is narrative context, never evidence (PRD 44 R-EXEC-1); harness recognition stays unverified (register item R-021).",
    };
  }

  const unconfirmed: string[] = [];
  for (const capture of recognitionCaptures) {
    const id = capture.id ?? "(unnamed)";
    if (capture.status !== "verified") {
      unconfirmed.push(`${id} (capture is ${capture.status ?? "unmarked"}, not verified)`);
      continue;
    }
    if (capture.exitCode !== 0) {
      unconfirmed.push(`${id} (listing command exited ${String(capture.exitCode)})`);
      continue;
    }
    const stdout = capture.stdout ? readSessionText(sessionRoot, capture.stdout) : null;
    if (stdout === null || stdout.trim().length === 0) {
      unconfirmed.push(`${id} (listing produced no output)`);
      continue;
    }
    if (packageId !== null && !stdout.includes(packageId)) {
      unconfirmed.push(`${id} (listing did not show \`${packageId}\`)`);
    }
  }
  const value = unconfirmed.length === 0;
  return {
    value,
    outputsRead: outputs,
    outputsPresent: true,
    detail: value
      ? `discover confirmed: the harness's own listing surface reported ${packageId ? `\`${packageId}\`` : "the installed package"}.`
      : `discover not confirmed by the harness listing surface: ${unconfirmed.join("; ")}.`,
    caveat: value ? null : `discover not confirmed: ${unconfirmed.join("; ")}.`,
  };
}

function measureInvokeStage(
  sessionRoot: string,
  outputs: string[],
): Omit<ConformanceStageMeasurement, "stage" | "asserted"> {
  const probeDoc = readSessionJson(sessionRoot, "evidence/invoke/probe-assertion.json") as
    | { exists?: boolean; markers?: { marker: string; found: boolean }[] }
    | null;
  if (probeDoc === null) {
    return {
      value: false,
      outputsRead: outputs,
      outputsPresent: false,
      detail: "invoke not measured: the invoke instrument output is missing.",
      caveat: "invoke stage was not measured — the invoke instrument produced no output.",
    };
  }
  const markers = probeDoc.markers ?? [];
  const transcriptSaved = probeDoc.exists === true;
  const missing = markers.filter((entry) => !entry.found).map((entry) => entry.marker);
  const value = transcriptSaved && markers.length > 0 && missing.length === 0;
  return {
    value,
    outputsRead: outputs,
    outputsPresent: true,
    detail: value
      ? `invoke confirmed: the driver-saved harness transcript contained every expected marker verbatim (${markers.map((entry) => entry.marker).join(", ")}).`
      : !transcriptSaved
        ? "invoke not confirmed: no harness transcript was saved for the marker scan."
        : `invoke not confirmed: the harness transcript is missing marker(s) ${missing.join(", ")}.`,
    caveat: value ? null : "invoke stage did not confirm from the harness transcript marker scan.",
  };
}

interface UninstallDiff {
  removed?: string[];
  added?: string[];
  modified?: { path: string }[];
  emptyManagedDirs?: string[];
}

function measureUninstallStage(
  sessionRoot: string,
  outputs: string[],
  managedRoots: string[],
): { measurement: Omit<ConformanceStageMeasurement, "stage" | "asserted">; relevantDiffs: string[] } {
  const beforeDoc = readSessionJson(sessionRoot, "evidence/uninstall/before-inventory.json") as
    | { managedFiles?: string[] }
    | null;
  const commandsDoc = readSessionJson(sessionRoot, "evidence/uninstall/removal-commands.json") as
    | { commands?: CapturedCommand[] }
    | null;
  const diffDoc = readSessionJson(sessionRoot, "evidence/uninstall/diff.json") as UninstallDiff | null;
  const outputsPresent = beforeDoc !== null && commandsDoc !== null && diffDoc !== null;
  if (!outputsPresent) {
    return {
      measurement: {
        value: false,
        outputsRead: outputs,
        outputsPresent: false,
        detail: "uninstall not measured: one or more uninstall instrument outputs are missing.",
        caveat: "uninstall stage was not measured — the uninstall instrument produced incomplete output.",
      },
      relevantDiffs: [],
    };
  }
  const commands = commandsDoc.commands ?? [];
  const removed = diffDoc.removed ?? [];
  const modified = diffDoc.modified ?? [];
  const emptyManagedDirs = diffDoc.emptyManagedDirs ?? [];
  const commandsOk = everyCommandSucceeded(commands);
  // A removed path is legitimate when it is Make Docs-managed: a setup-managed
  // file recorded in the workspace manifest (the uninstall instrument captures
  // that set before removal — register item D-026), a file under a packaging
  // placement root, or anything under `.make-docs/`. A removal outside all
  // three is a user-authored deletion — the exact thing uninstall must never do.
  const managedFiles = new Set(beforeDoc?.managedFiles ?? []);
  const managedPrefixes = [...managedRoots, ".make-docs"];
  const userAuthoredRemovals = removed.filter(
    (removedPath) =>
      !managedFiles.has(removedPath) &&
      !managedPrefixes.some((prefix) => removedPath === prefix || removedPath.startsWith(`${prefix}/`)),
  );
  const somethingRemoved = removed.length > 0;
  const noOrphans = emptyManagedDirs.length === 0;
  const noUserChanges = modified.length === 0 && userAuthoredRemovals.length === 0;
  const value = commandsOk && somethingRemoved && noOrphans && noUserChanges;
  const reasons: string[] = [];
  if (!commandsOk) reasons.push("a removal command exited non-zero");
  if (!somethingRemoved) reasons.push("nothing was removed");
  if (!noOrphans) reasons.push(`orphaned empty managed dir(s): ${emptyManagedDirs.join(", ")}`);
  if (modified.length > 0) reasons.push(`file(s) changed in place: ${modified.map((entry) => entry.path).join(", ")}`);
  if (userAuthoredRemovals.length > 0) reasons.push(`user-authored file(s) removed: ${userAuthoredRemovals.join(", ")}`);
  return {
    measurement: {
      value,
      outputsRead: outputs,
      outputsPresent: true,
      detail: value
        ? "uninstall confirmed: removal commands exited 0, managed outputs removed with no orphaned managed directories, and no user-authored file was changed or deleted."
        : `uninstall not confirmed: ${reasons.join("; ")}.`,
      caveat: value ? null : "uninstall stage did not confirm from its instrument diff.",
    },
    relevantDiffs: removed.slice().sort(),
  };
}

/* --------------------------------------------------------------------------
 * Manifest loading and precondition assembly
 * ------------------------------------------------------------------------ */

function loadSessionManifest(sessionRoot: string): ConformanceSessionManifest {
  const manifestPath = path.join(sessionRoot, "kit", "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new OperationError(
      `Conformance ingestion: no session manifest at \`${manifestPath}\`; a session is ingested from its kit-generated manifest and evidence.`,
    );
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ConformanceSessionManifest;
  if (manifest.schemaVersion !== CONFORMANCE_SESSION_MANIFEST_SCHEMA_VERSION) {
    throw new OperationError(
      `Conformance ingestion: session manifest schema \`${String(manifest.schemaVersion)}\` is not \`${CONFORMANCE_SESSION_MANIFEST_SCHEMA_VERSION}\`.`,
    );
  }
  return manifest;
}

function extractPackageId(manifest: ConformanceSessionManifest): string | null {
  for (const step of manifest.sessionSteps) {
    if (step.barStage === "install" && step.command) {
      const match = /--package-id\s+(\S+)/.exec(step.command);
      if (match) {
        return match[1]!;
      }
    }
  }
  return null;
}

function managedRootsFromInventory(sessionRoot: string): string[] {
  const inventory = readSessionJson(sessionRoot, "evidence/install/placement-inventory.json") as
    | { roots?: string[] }
    | null;
  return inventory?.roots ?? [];
}

/* --------------------------------------------------------------------------
 * Ingestion (t1-t3)
 * ------------------------------------------------------------------------ */

export interface IngestConformanceLabSessionInput {
  /** The disposable session root holding `kit/manifest.json` and `evidence/`. */
  sessionRoot: string;
  /** The authored definition, loaded by the caller; cross-checked against the manifest. */
  spec: PackagingConformanceScenarioSpec;
  /** Operator-contributed run metadata and attestations. */
  operator: ConformanceOperatorAttestations;
  /** ISO run date for the record id and committed path; defaults to the manifest's session date prefix. */
  runDate?: string;
  /** Positive sequence number disambiguating same-day records for the target. */
  sequence?: number;
}

/**
 * Assembles a `conformance.result.v1` record from a driven lab session, with
 * every asserted bar-stage boolean derived SOLELY from instrument outputs and
 * every operator contribution recorded as an attestation (R-ING-1, R-EXEC-1..2).
 * Preconditions unmet at the operator's report resolve to an honest `blocked`
 * record (R-EXEC-3). The record is validated against the existing result
 * contract before return; it is NOT written or bound here — those are the
 * caller's explicit, reviewable steps.
 */
export function ingestConformanceLabSession(
  input: IngestConformanceLabSessionInput,
): ConformanceIngestionResult {
  const { sessionRoot, spec, operator } = input;
  const manifest = loadSessionManifest(sessionRoot);
  if (manifest.scenarioId !== spec.scenarioId) {
    throw new OperationError(
      `Conformance ingestion: session manifest is for \`${manifest.scenarioId}\`, not the supplied definition \`${spec.scenarioId}\`.`,
    );
  }
  if (manifest.scenarioVersion !== spec.scenarioVersion) {
    throw new OperationError(
      `Conformance ingestion: session manifest scenarioVersion \`${manifest.scenarioVersion}\` does not match the supplied definition \`${spec.scenarioVersion}\`; regenerate the kit from the current definition.`,
    );
  }
  const harness = manifest.harness;
  const binding = getScenarioTargetBinding(spec, harness);

  // Refuse a session that ran against the wrong `make-docs` (register item
  // D-027): if the kit's preflight recorded a CLI-identity mismatch, every Make
  // Docs command in the session ran a different build than the kit was
  // generated and validated from, so its measurements are meaningless. Absent
  // preflight evidence (older kits) is not an error — ingestion proceeds.
  const preflight = readSessionJson(sessionRoot, "evidence/preflight/preflight.json") as
    | { ok?: boolean; expectedVersion?: string; actualVersion?: string | null }
    | null;
  if (preflight && preflight.ok === false) {
    throw new OperationError(
      `Conformance ingestion refused: the session's preflight recorded a make-docs CLI mismatch — the kit was generated for \`${String(preflight.expectedVersion)}\` but the session ran \`${String(preflight.actualVersion ?? "unknown")}\`. The Make Docs commands ran a different build than the kit was validated against, so the measurements are meaningless; rebuild and reinstall the CLI (\`just install-cli-pack\` from the repo root), regenerate the kit, and re-run (register item D-027).`,
    );
  }

  const runDate = input.runDate ?? manifest.sessionId.slice(0, 10);
  const { outcome } = splitConformanceScenarioId(spec.scenarioId);
  const transcriptLogPointer = operator.transcriptLogPointer ?? CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION;
  const transcriptFormat = operator.transcriptFormat ?? "non-tty";

  // Precondition resolution (R-EXEC-3): an operator-attestation precondition
  // the operator did not attest, or a probeable precondition the operator
  // reports unmet, blocks the session. Blocked is honest absence of evidence.
  const unmet: ScenarioPreconditionProbeOutcome[] = [];
  const attested = new Set(operator.attestedPreconditionIds);
  const reportedUnmetProbeable = new Set(operator.unmetProbeablePreconditionIds ?? []);
  for (const precondition of spec.packagingExtension.preconditions) {
    if (precondition.probe === "operator-attestation" && !attested.has(precondition.id)) {
      unmet.push({
        id: precondition.id,
        kind: precondition.kind,
        description: precondition.description,
        satisfied: false,
        reason: "operator did not attest this precondition",
      });
    } else if (precondition.probe === "command-succeeds" && reportedUnmetProbeable.has(precondition.id)) {
      unmet.push({
        id: precondition.id,
        kind: precondition.kind,
        description: precondition.description,
        satisfied: false,
        reason: "operator reported the precondition probe unmet",
      });
    }
  }

  const recordRef = conformanceResultRecordRelativePath({
    harness,
    runDate,
    scenarioId: spec.scenarioId,
    sequence: input.sequence ?? 1,
  });

  if (unmet.length > 0) {
    const record = validatePackagingConformanceResultRecord(
      blockedPackagingResultRecord({
        spec,
        harness,
        unmet,
        runDate,
        makeDocsVersion: manifest.generationInputs.cliVersion,
        runtimeDistribution: operator.runtimeDistribution,
        runtimeVersion: operator.runtimeVersion,
        transcriptLogPointer,
      }),
    );
    const assembly: ConformanceIngestionAssembly = {
      schemaVersion: CONFORMANCE_INGESTION_PROVENANCE_SCHEMA_VERSION,
      sessionId: manifest.sessionId,
      scenarioId: spec.scenarioId,
      harness,
      blocked: true,
      unmetPreconditions: unmet.map((outcome) => ({ id: outcome.id, reason: outcome.reason })),
      measured: CONFORMANCE_EVIDENCE_BAR_STAGES.map((stage) => ({
        stage,
        value: false,
        asserted: !listUnassertedEvidenceBarStages(spec).includes(stage),
        outputsRead: [],
        outputsPresent: false,
        detail: "session blocked before execution; no stage was measured.",
        caveat: null,
      })),
      attested: {
        modelName: record.modelName,
        providerOrRoutingLayer: record.providerOrRoutingLayer,
        modelVersion: record.modelVersion,
        runtimeDistribution: operator.runtimeDistribution,
        runtimeVersion: operator.runtimeVersion,
        attestedPreconditionIds: [...operator.attestedPreconditionIds],
        transcriptLogPointer,
        transcriptFormat,
        narrativeReason: record.reason,
      },
      caveats: [],
      verdictDerivation: `blocked: unmet precondition(s) ${unmet.map((outcome) => outcome.id).join(", ")}; every bar stage false, supportClaimUse none (R-EXEC-3).`,
    };
    return { record, recordRef, assembly };
  }

  // Runnable: measure each asserted stage from instruments only (R-ING-1).
  const unasserted = listUnassertedEvidenceBarStages(spec);
  const packageId = extractPackageId(manifest);
  const managedRoots = managedRootsFromInventory(sessionRoot);

  const measured: ConformanceStageMeasurement[] = [];
  const caveats: string[] = [];
  let producedFiles: string[] = [];
  let relevantDiffs: string[] = [];
  let exitStatus: number | null = null;

  for (const stage of CONFORMANCE_EVIDENCE_BAR_STAGES) {
    const asserted = !unasserted.includes(stage);
    if (!asserted) {
      measured.push({
        stage,
        value: false,
        asserted: false,
        outputsRead: [],
        outputsPresent: false,
        detail: "the definition asserts no expectation for this stage; it is not bar-eligible.",
        caveat: null,
      });
      continue;
    }
    const expected = manifest.expectedEvidence[stage];
    let partial: Omit<ConformanceStageMeasurement, "stage" | "asserted">;
    if (stage === "install") {
      const result = measureInstallStage(sessionRoot, expected.outputs);
      partial = result.measurement;
      producedFiles = result.producedFiles;
      exitStatus = result.exitStatus;
    } else if (stage === "discover") {
      partial = measureDiscoverStage(sessionRoot, expected.outputs, packageId);
    } else if (stage === "invoke") {
      partial = measureInvokeStage(sessionRoot, expected.outputs);
    } else {
      const result = measureUninstallStage(sessionRoot, expected.outputs, managedRoots);
      partial = result.measurement;
      relevantDiffs = result.relevantDiffs;
    }
    measured.push({ stage, asserted: true, ...partial });
    if (partial.caveat) {
      caveats.push(partial.caveat);
    }
  }

  for (const extra of operator.additionalCaveats ?? []) {
    caveats.push(extra);
  }

  const assertedStages = CONFORMANCE_EVIDENCE_BAR_STAGES.filter((stage) => !unasserted.includes(stage));
  const evidenceBar = {
    install: measured.find((entry) => entry.stage === "install")!.value,
    discover: measured.find((entry) => entry.stage === "discover")!.value,
    invoke: measured.find((entry) => entry.stage === "invoke")!.value,
    uninstall: measured.find((entry) => entry.stage === "uninstall")!.value,
  };
  const allAssertedMet = assertedStages.every((stage) => evidenceBar[stage]);

  // Verdict derivation is deterministic from the MEASURED bar (never attested):
  // all asserted stages measured true -> pass (or pass-with-caveats when
  // caveats ride along, surfaced); anything short -> unsupported (the evidence
  // does not establish the harness supports the full outcome). `inconsistent`
  // is a reviewer verdict, never machine-derived here.
  let verdict: PackagingConformanceResultRecord["verdict"];
  let supportClaimUse: PackagingConformanceResultRecord["supportClaimUse"];
  let caveatsSurfaced: boolean;
  let verdictDerivation: string;
  if (allAssertedMet && caveats.length === 0) {
    verdict = "pass";
    supportClaimUse = "nominal-tuple";
    caveatsSurfaced = false;
    verdictDerivation = "pass: every asserted bar stage confirmed from instruments, no caveats.";
  } else if (allAssertedMet) {
    verdict = "pass-with-caveats";
    supportClaimUse = "nominal-tuple";
    caveatsSurfaced = true;
    verdictDerivation = `pass-with-caveats: every asserted bar stage confirmed from instruments, ${String(caveats.length)} caveat(s) surfaced.`;
  } else {
    verdict = "unsupported";
    supportClaimUse = "none";
    caveatsSurfaced = caveats.length > 0;
    const unmetStages = assertedStages.filter((stage) => !evidenceBar[stage]);
    verdictDerivation = `unsupported: asserted stage(s) ${unmetStages.join(", ")} not confirmed from instruments; advances no tuple.`;
  }

  const simulated = binding.harnessExecution.mode === "faithful-simulation";
  const record = validatePackagingConformanceResultRecord({
    schemaVersion: CONFORMANCE_RESULT_SCHEMA_VERSION,
    resultId: `${runDate}-${outcome}-${String(input.sequence ?? 1).padStart(3, "0")}`,
    scenarioId: spec.scenarioId,
    scenarioVersion: spec.scenarioVersion,
    runDate,
    makeDocsVersion: manifest.generationInputs.cliVersion,
    harness,
    modelName: operator.modelName,
    providerOrRoutingLayer: operator.providerOrRoutingLayer,
    modelVersion: operator.modelVersion,
    runtimeDistribution: operator.runtimeDistribution,
    runtimeVersion: operator.runtimeVersion,
    producedFiles,
    relevantDiffs,
    exitStatus,
    transcriptLogPointer,
    verdict,
    reason: operator.narrativeReason,
    caveats,
    reviewerStatus: "unreviewed",
    supportClaimUse,
    caveatsSurfaced,
    evidenceBar,
    simulated,
    simulationMechanicsRef: simulated ? binding.harnessExecution.simulationMechanics : null,
    transcriptFormat,
  });

  const assembly: ConformanceIngestionAssembly = {
    schemaVersion: CONFORMANCE_INGESTION_PROVENANCE_SCHEMA_VERSION,
    sessionId: manifest.sessionId,
    scenarioId: spec.scenarioId,
    harness,
    blocked: false,
    unmetPreconditions: [],
    measured,
    attested: {
      modelName: operator.modelName,
      providerOrRoutingLayer: operator.providerOrRoutingLayer,
      modelVersion: operator.modelVersion,
      runtimeDistribution: operator.runtimeDistribution,
      runtimeVersion: operator.runtimeVersion,
      attestedPreconditionIds: [...operator.attestedPreconditionIds],
      transcriptLogPointer,
      transcriptFormat,
      narrativeReason: operator.narrativeReason,
    },
    caveats,
    verdictDerivation,
  };
  return { record, recordRef, assembly };
}

/* --------------------------------------------------------------------------
 * Committing the record and binding it to the registry (t4)
 * ------------------------------------------------------------------------ */

export interface WriteConformanceResultRecordInput {
  result: ConformanceIngestionResult;
  /** Maintainer repo root the `conformance/results/<harness>/` home resolves against. */
  repoRoot?: string;
  /** Also write the assembly provenance beside the record as an audit trail. */
  writeProvenance?: boolean;
}

/**
 * Writes the compact result record to its committed home
 * (`conformance/results/<harness>/...`) — the committed evidence class,
 * distinct from disposable session artifacts. Optionally writes the assembly
 * provenance beside it (`<record>.provenance.json`) so the measured-vs-attested
 * audit trail is committed too. Returns the absolute record path.
 */
export function writeConformanceResultRecord(input: WriteConformanceResultRecordInput): string {
  const repoRoot = path.resolve(input.repoRoot ?? ".");
  const absolute = path.join(repoRoot, input.result.recordRef);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(input.result.record, null, 2)}\n`);
  if (input.writeProvenance) {
    const provenancePath = absolute.replace(/\.json$/, ".provenance.json");
    writeFileSync(provenancePath, `${JSON.stringify(input.result.assembly, null, 2)}\n`);
  }
  return absolute;
}

/**
 * Binds an ingested record to one registry entry through the ONE unchanged
 * seam (R-ING-2): this is a thin, explicit pass-through to
 * {@link recordConformanceRunOnRegistryEntry} so the ingestion tooling never
 * grows a second registry-mutation path. Every refusal the seam enforces —
 * scenario, tuple, harness, overclaim, and simulation-posture mismatches —
 * fires unchanged; the returned entry carries the recorded run and its
 * rederived status. Persisting the registry stays a separate reviewed step.
 */
export function bindIngestedResultToRegistryEntry(input: {
  entry: ConformanceTupleRegistryEntry;
  spec: PackagingConformanceScenarioSpec;
  result: ConformanceIngestionResult;
}): ConformanceTupleRegistryEntry {
  return recordConformanceRunOnRegistryEntry({
    entry: input.entry,
    spec: input.spec,
    record: input.result.record,
    recordRef: input.result.recordRef,
  });
}
