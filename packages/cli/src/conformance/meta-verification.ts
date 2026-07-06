/**
 * The W18 R9 P3 (D9) meta-verification checks (PRD 37 R-TEST-1..3; W18 R9 P3
 * t3-t5). These are checks over the checks: they police the committed tuple
 * registry, the authored scenario set, the layer attribution of cited
 * evidence, and the maintainer-only shipping boundary. They run in the
 * standard repository suite (see `tests/conformance-meta-verification.test.ts`)
 * so a regression in the registry or the scenario set fails the build, and
 * the R-TEST-3 exclusion check is additionally wired into the packaging
 * validation surface (`packages/cli/tests/consistency.test.ts` behind
 * `validate:defaults`, and `scripts/smoke-pack.mjs` for the npm tarball).
 *
 * Every function returns human-readable error strings; empty means the
 * invariant holds. Nothing here is a support claim: a green meta-verification
 * run proves the evidence machinery is honest, not that any harness
 * recognizes any output (R-KEEP-1, R-LAYER-2).
 *
 * Implementer decisions recorded here (D8 freedoms):
 * - R-TEST-1 checks with receipts: beyond requiring a qualifying recorded run
 *   for every `conformance-validated` tuple, when a `repoRoot` is given every
 *   recorded run's `recordRef` must resolve to a committed result record that
 *   validates against the lab result contract and projects back to exactly
 *   the run stored on the registry entry — so a registry run can never drift
 *   from, or outlive, the evidence it summarizes.
 * - R-TEST-2's "runnable" is structural plus honest-blocked (ids and paths
 *   retargeted by PRD 43 R-SCHEMA-3): every required first-pass scenario must
 *   be authored as a domain-qualified definition under
 *   `conformance/scenarios/<domain>/`, bar-eligible (all four stages
 *   asserted), linked bidirectionally to registry tuples, backed by existing
 *   fixture Playbooks, bound to the required first-pass target (Codex), and
 *   must carry a probeable `harness-cli` precondition with a concrete probe
 *   command on that target binding so an unavailable harness resolves to
 *   `blocked` instead of silently passing; the dynamic blocked-never-advances
 *   leg is exercised by the meta suite through the Phase 2 probe and
 *   recording seams. The D-023 executable-by-construction proof (a
 *   kit-generation dry-run projecting every required definition to an
 *   accepted command sequence) lands with the Phase 2 kit generator and the
 *   Phase 4 bar.
 * - R-TEST-3 detects assets three ways — the asset directory path (the
 *   canonical repo-root `conformance/` home per PRD 42, its distinctive
 *   subtrees at any depth, AND the pre-relocation `docs/assets/conformance`
 *   home so a copy reappearing there still fails), the registry data file's
 *   basename, and the unambiguous schema identifiers as content markers — so
 *   a renamed or relocated copy of a conformance asset still fails the
 *   check. Check CODE shipping (this module inside `dist/`) is deliberately
 *   allowed: the PRD ships lab and check code as ordinary CLI source; only
 *   the ASSETS are maintainer-only.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { listDeclaredTestLayers, REPOSITORY_TEST_LAYERS } from "./layers";
import {
  CONFORMANCE_TUPLE_REGISTRY_RECORD,
  runQualifiesForConformanceValidation,
  type ConformanceTupleRegistry,
} from "./registry";
import {
  CONFORMANCE_RESULT_SCHEMA_VERSION,
  CONFORMANCE_SCENARIO_SCHEMA_VERSION,
  REQUIRED_FIRST_PASS_SCENARIOS,
  REQUIRED_FIRST_PASS_TARGET,
  listConformanceScenarioRegistryLinkageErrors,
  listMissingRequiredFirstPassScenarioIds,
  listUnassertedEvidenceBarStages,
  projectPackagingResultToRecordedRun,
  validatePackagingConformanceResultRecord,
  type PackagingConformanceScenarioSpec,
} from "./scenario";

type RegistryTuples = Pick<ConformanceTupleRegistry, "tuples">;

/* --------------------------------------------------------------------------
 * R-TEST-1 (t3): no `conformance-validated` tuple without a qualifying run.
 * ------------------------------------------------------------------------ */

/**
 * Asserts, end to end against a (typically committed) registry document, that
 * no tuple is marked `conformance-validated` without a recorded run meeting
 * the D4 bar (R-TEST-1), that no qualifying run is understated as a lower
 * status (drift in either direction is dishonest), and — when `repoRoot` is
 * provided — that every recorded run's `recordRef` resolves to a committed
 * result record that validates and projects back to exactly the stored run.
 */
export function listConformanceValidatedRunQualificationErrors(input: {
  registry: RegistryTuples;
  repoRoot?: string;
}): string[] {
  const errors: string[] = [];
  for (const entry of input.registry.tuples) {
    const label = `registry entry \`${entry.id}\``;
    const hasQualifyingRun = entry.recordedRuns.some(runQualifiesForConformanceValidation);
    if (entry.status === "conformance-validated" && !hasQualifyingRun) {
      errors.push(
        `${label} is marked conformance-validated without a recorded run meeting the ` +
          "install-discover-invoke-uninstall bar (R-TEST-1, R-BAR-1)",
      );
    }
    if (entry.status !== "conformance-validated" && hasQualifyingRun) {
      errors.push(
        `${label} has a qualifying recorded run but records status \`${entry.status}\`; ` +
          "statuses derive from run verdicts in both directions (R-REG-3)",
      );
    }
    if (input.repoRoot === undefined) {
      continue;
    }
    for (const run of entry.recordedRuns) {
      const runLabel = `${label} run \`${run.runId}\``;
      const recordPath = path.join(input.repoRoot, run.recordRef);
      if (!existsSync(recordPath)) {
        errors.push(
          `${runLabel} cites result record \`${run.recordRef}\` which is not committed; ` +
            "a recorded run without its compact result record is not evidence (R-TEST-1, R-KEEP-1)",
        );
        continue;
      }
      try {
        const record = validatePackagingConformanceResultRecord(
          JSON.parse(readFileSync(recordPath, "utf8")) as unknown,
        );
        const projected = projectPackagingResultToRecordedRun(record, run.recordRef);
        if (JSON.stringify(projected) !== JSON.stringify(run)) {
          errors.push(
            `${runLabel} disagrees with its committed result record \`${run.recordRef}\`; ` +
              "the registry run is a projection of the record and may not drift from it (R-TEST-1)",
          );
        }
      } catch (error) {
        errors.push(
          `${runLabel} cites result record \`${run.recordRef}\` which does not validate: ${String(error)}`,
        );
      }
    }
  }
  return errors;
}

/* --------------------------------------------------------------------------
 * R-TEST-2 (t4): required first-pass scenarios exist and are runnable-or-blocked.
 * ------------------------------------------------------------------------ */

/**
 * Asserts that every required first-pass scenario exists as an authored
 * domain-qualified definition and is structurally runnable (R-TEST-2 as
 * retargeted by PRD 43 R-SCHEMA-3): bar-eligible with all four stages
 * asserted, bidirectionally linked to the registry tuples its target
 * bindings declare, backed by fixture Playbooks that exist on disk, bound to
 * the required first-pass target ({@link REQUIRED_FIRST_PASS_TARGET}), and
 * carrying a probeable `harness-cli` precondition whose concrete probe
 * command that binding supplies, so an unavailable harness resolves to an
 * honest `blocked` rather than silently passing. The dynamic leg — an unmet
 * probe yielding a `blocked` record that never advances a tuple — is
 * exercised by the meta suite through the Phase 2 seams; the D-023
 * executability proof is owned by the Phase 2 kit generator's dry-run.
 */
export function listRequiredFirstPassScenarioErrors(input: {
  specs: PackagingConformanceScenarioSpec[];
  registry: RegistryTuples;
  repoRoot: string;
}): string[] {
  const errors: string[] = [];
  for (const missing of listMissingRequiredFirstPassScenarioIds(input.specs)) {
    errors.push(
      `required first-pass scenario \`${missing}\` (${REQUIRED_FIRST_PASS_SCENARIOS[missing]}) ` +
        "has no authored definition under conformance/scenarios/<domain>/ (R-TEST-2, R-SCHEMA-3)",
    );
  }
  for (const linkageError of listConformanceScenarioRegistryLinkageErrors(
    input.registry,
    input.specs,
  )) {
    errors.push(`scenario/registry linkage: ${linkageError}`);
  }
  const requiredIds = new Set<string>(Object.keys(REQUIRED_FIRST_PASS_SCENARIOS));
  for (const spec of input.specs) {
    if (!requiredIds.has(spec.scenarioId)) {
      continue;
    }
    const label = `required scenario \`${spec.scenarioId}\``;
    const unasserted = listUnassertedEvidenceBarStages(spec);
    if (unasserted.length > 0) {
      errors.push(
        `${label} asserts no ${unasserted.join(", ")} evidence; a definition missing a bar stage ` +
          "can never advance a tuple and is not runnable as first-pass evidence (R-TEST-2, R-BAR-1)",
      );
    }
    for (const fixture of spec.packagingExtension.fixturePlaybooks) {
      if (!existsSync(path.join(input.repoRoot, fixture))) {
        errors.push(`${label} references fixture Playbook \`${fixture}\` which does not exist`);
      }
    }
    const binding = spec.packagingExtension.targets[REQUIRED_FIRST_PASS_TARGET];
    if (!binding) {
      errors.push(
        `${label} binds no \`${REQUIRED_FIRST_PASS_TARGET}\` target; the required first-pass set ` +
          "is exactly the four packaging outcomes bound to Codex targets (R-TEST-2, R-SCHEMA-3)",
      );
      continue;
    }
    const probeableHarnessCli = spec.packagingExtension.preconditions.filter(
      (precondition) =>
        precondition.kind === "harness-cli" && precondition.probe === "command-succeeds",
    );
    if (probeableHarnessCli.length === 0) {
      errors.push(
        `${label} declares no probeable harness-cli precondition; without one an unavailable ` +
          "harness cannot resolve to an honest blocked verdict (R-TEST-2, R-KEEP-1)",
      );
    }
    for (const precondition of probeableHarnessCli) {
      if (!(precondition.id in binding.preconditionProbes)) {
        errors.push(
          `${label} target \`${REQUIRED_FIRST_PASS_TARGET}\` carries no probe command for the ` +
            `harness-cli precondition \`${precondition.id}\` (R-TEST-2, R-SCHEMA-1)`,
        );
      }
    }
  }
  return errors;
}

/* --------------------------------------------------------------------------
 * Cross-layer citation honesty (t1/t2, R-LAYER-1..2).
 * ------------------------------------------------------------------------ */

/**
 * Asserts that every `internal-test` evidence ref on the registry cites a
 * repository test file that exists and names exactly one repository layer
 * (unit or integration) in its header — so internal-test evidence is always
 * attributable to one named layer, is never a conformance-layer artifact,
 * and no suite is cited across layers (R-LAYER-1..2). The complementary
 * direction — `plannedScenarios` citing only conformance-layer specs — is
 * enforced by the Phase 2 linkage check.
 */
export function listCrossLayerCitationErrors(input: {
  registry: RegistryTuples;
  repoRoot: string;
}): string[] {
  const errors: string[] = [];
  for (const entry of input.registry.tuples) {
    for (const evidenceRef of entry.evidence) {
      if (evidenceRef.kind !== "internal-test") {
        continue;
      }
      const label = `registry entry \`${entry.id}\` internal-test evidence \`${evidenceRef.ref}\``;
      const citedPath = path.join(input.repoRoot, evidenceRef.ref);
      if (!existsSync(citedPath)) {
        errors.push(`${label} does not exist (R-LAYER-1)`);
        continue;
      }
      const content = readFileSync(citedPath, "utf8");
      const headerEnd = content.indexOf("describe(");
      const header = headerEnd === -1 ? content : content.slice(0, headerEnd);
      const layers = listDeclaredTestLayers(header);
      if (layers.length !== 1) {
        errors.push(
          `${label} must declare exactly one \`Test layer:\` marker in its header, found ${layers.length} (R-LAYER-1)`,
        );
        continue;
      }
      if (!(REPOSITORY_TEST_LAYERS as readonly string[]).includes(layers[0]!)) {
        errors.push(
          `${label} declares layer \`${layers[0]}\`; internal-test evidence must come from a ` +
            "repository layer (unit or integration), never the conformance layer (R-LAYER-2)",
        );
      }
    }
  }
  return errors;
}

/* --------------------------------------------------------------------------
 * R-TEST-3 (t5): conformance assets never ship.
 * ------------------------------------------------------------------------ */

/**
 * The canonical maintainer-only asset home: the repo-root `conformance/`
 * directory (R-KEEP-1; relocated from `docs/assets/conformance/` per PRD 42).
 * In a scanned shipped tree, any file under a root-level `conformance/`
 * directory is a conformance asset. Compiled check CODE under
 * `dist/conformance/` deliberately does not match — only the ASSETS are
 * maintainer-only.
 */
export const CONFORMANCE_ASSET_ROOT_DIR = "conformance";

/**
 * Path fragments that mark conformance assets at ANY depth of a scanned tree
 * (R-TEST-3): the pre-relocation `docs/assets/conformance` home — anything
 * reappearing under it still fails — plus the canonical family's distinctive
 * subtrees, so a nested copy of the relocated home fails too.
 */
export const CONFORMANCE_ASSET_PATH_MARKERS = [
  "docs/assets/conformance",
  "conformance/tuple-registry.json",
  "conformance/scenarios/",
  "conformance/fixtures/",
  "conformance/results/",
] as const;

/** True when a tree-relative path (posix separators) is a conformance asset path. */
export function isConformanceAssetPath(relative: string): boolean {
  return (
    relative.startsWith(`${CONFORMANCE_ASSET_ROOT_DIR}/`) ||
    CONFORMANCE_ASSET_PATH_MARKERS.some((marker) => relative.includes(marker))
  );
}

/** Basenames that are conformance assets wherever they appear. */
export const CONFORMANCE_ASSET_FILE_MARKERS = ["tuple-registry.json"] as const;

/**
 * Unambiguous schema identifiers that only conformance assets carry; a
 * relocated or renamed asset still trips these content markers.
 */
export const CONFORMANCE_ASSET_CONTENT_MARKERS = [
  CONFORMANCE_TUPLE_REGISTRY_RECORD,
  CONFORMANCE_SCENARIO_SCHEMA_VERSION,
  CONFORMANCE_RESULT_SCHEMA_VERSION,
] as const;

function walkFiles(root: string): string[] {
  const files: string[] = [];
  const pending: string[] = [root];
  while (pending.length > 0) {
    const current = pending.pop()!;
    for (const dirent of readdirSync(current, { withFileTypes: true })) {
      if (dirent.name === "node_modules" || dirent.name === ".git") {
        continue;
      }
      const absolute = path.join(current, dirent.name);
      if (dirent.isDirectory()) {
        pending.push(absolute);
      } else {
        files.push(absolute);
      }
    }
  }
  return files.sort();
}

/**
 * Scans one tree for conformance-asset content by path, basename, and content
 * marker (R-TEST-3). Returns one violation string per finding; empty means
 * the tree ships no conformance assets. A green result is an exclusion fact,
 * not a support claim (R-KEEP-1).
 */
export function listConformanceAssetExclusionViolations(input: {
  root: string;
  label: string;
}): string[] {
  const violations: string[] = [];
  if (!existsSync(input.root)) {
    return violations;
  }
  for (const absolute of walkFiles(input.root)) {
    const relative = path.relative(input.root, absolute).split(path.sep).join("/");
    if (isConformanceAssetPath(relative)) {
      violations.push(
        `${input.label} contains conformance asset path \`${relative}\`; ` +
          `the repo-root \`${CONFORMANCE_ASSET_ROOT_DIR}/**\` family is maintainer-only and never ships (R-TEST-3, R-KEEP-1)`,
      );
      continue;
    }
    if ((CONFORMANCE_ASSET_FILE_MARKERS as readonly string[]).includes(path.basename(relative))) {
      violations.push(
        `${input.label} contains conformance asset file \`${relative}\` (R-TEST-3, R-KEEP-1)`,
      );
      continue;
    }
    let content: string;
    try {
      content = readFileSync(absolute, "utf8");
    } catch {
      continue;
    }
    for (const marker of CONFORMANCE_ASSET_CONTENT_MARKERS) {
      if (content.includes(marker)) {
        violations.push(
          `${input.label} file \`${relative}\` carries the conformance schema identifier ` +
            `\`${marker}\`; relocated conformance assets still may not ship (R-TEST-3, R-KEEP-1)`,
        );
        break;
      }
    }
  }
  return violations;
}

/** Repo-relative roots the repo-side R-TEST-3 check covers. */
export const CONFORMANCE_EXCLUSION_CHECKED_ROOTS = [
  {
    relativePath: "packages/docs/template",
    label: "shipped template (packages/docs/template)",
    required: true,
  },
  {
    // Build artifact regenerated by prepack; checked when present here, and
    // always covered — together with the npm tarball itself — by
    // `scripts/smoke-pack.mjs`, which regenerates it before packing.
    relativePath: "packages/cli/template",
    label: "packaged template copy (packages/cli/template)",
    required: false,
  },
] as const;

/**
 * The repo-side R-TEST-3 check: the shipped template source of truth carries
 * no conformance assets, and neither does the generated packaged copy when it
 * exists in the working tree. The npm-tarball leg runs in the packaging
 * validation surface (`scripts/smoke-pack.mjs`). Failing this check fails
 * package validation; passing it claims nothing about harness support
 * (R-KEEP-1).
 */
export function listShippedConformanceAssetErrors(input: { repoRoot: string }): string[] {
  const errors: string[] = [];
  for (const root of CONFORMANCE_EXCLUSION_CHECKED_ROOTS) {
    const absolute = path.join(input.repoRoot, root.relativePath);
    if (!existsSync(absolute)) {
      if (root.required) {
        errors.push(`${root.label} not found at \`${root.relativePath}\`; the R-TEST-3 exclusion check cannot run`);
      }
      continue;
    }
    errors.push(...listConformanceAssetExclusionViolations({ root: absolute, label: root.label }));
  }
  return errors;
}
