import * as os from "node:os";
import path from "node:path";
import { resolveSkillSource } from "./skill-resolver";
import {
  loadSkillRegistry,
  type EffectiveSkillRegistry,
  type SkillRegistry,
  type SkillRegistryEntry,
} from "./skill-registry";
import {
  HARNESSES,
  type Harness,
  type InstallSelections,
  type ResolvedAsset,
  type SkillManifestSelectionSource,
  type SkillSelectionProvenanceEntry,
} from "./types";
import { PACKAGE_ROOT } from "./utils";

const HARNESS_SKILL_DIRS: Record<Harness, string> = {
  "claude-code": ".claude/skills",
  codex: ".agents/skills",
};

const SHARED_AGENTICS_SKILL_DIR = ".make-docs/agentics/skills";

const RETIRED_MANAGED_SKILL_ASSETS: Record<string, string[]> = {
  "closeout-commit": [
    "scripts/closeout_probe.py",
    "scripts/closeout_validate.py",
    "scripts/closeout_history.py",
  ],
  "closeout-phase": [
    "scripts/closeout_probe.py",
    "scripts/closeout_validate.py",
    "scripts/closeout_history.py",
    "scripts/work_phase_state.py",
  ],
  "work-on-phase": [
    "scripts/work_on_wave_common.py",
    "scripts/resolve_wave.py",
    "scripts/phase_plan.py",
    "scripts/checkpoint.py",
    "scripts/scope_guard.py",
    "scripts/phase_gate.py",
  ],
  "work-on-wave": [
    "scripts/work_on_wave_common.py",
    "scripts/resolve_wave.py",
    "scripts/wave_status.py",
    "scripts/phase_plan.py",
    "scripts/checkpoint.py",
    "scripts/scope_guard.py",
    "scripts/phase_gate.py",
  ],
};

export interface WizardSkillChoice {
  name: string;
  displayName: string;
  description: string;
  purposes: Array<{ id: string; label: string; description: string }>;
  source: string;
  sourcePolicyKind: SkillRegistry["sourcePolicy"]["kind"];
  supportedHarnesses: Harness[];
  provenanceLabel: string;
  provenanceKind: SkillRegistryEntry["provenance"]["kind"];
}

export async function getDesiredSkillAssets(
  selections: InstallSelections,
  registry = loadSkillRegistry(PACKAGE_ROOT),
): Promise<ResolvedAsset[]> {
  if (!selections.skills) {
    return [];
  }

  const selectedSkills = new Set(selections.selectedSkills);
  const selectedEntries = registry.skills.filter((entry) =>
    selectedSkills.has(entry.name),
  );

  if (selectedEntries.length === 0) {
    return [];
  }

  const installRoot = selections.skillScope === "project" ? "." : os.homedir();
  const purposeLabelsById = new Map(
    registry.purposes.map((purpose) => [purpose.id, purpose.label]),
  );
  const sharedAssets = (
    await Promise.all(
      selectedEntries.map((entry) => buildSharedSkillAssets(entry, installRoot)),
    )
  ).flat();
  const harnessStubs = HARNESSES.flatMap((harness) => {
    if (!selections.harnesses[harness]) {
      return [];
    }

    return selectedEntries
      .filter((entry) => entry.supportedHarnesses.includes(harness))
      .map((entry) =>
        buildHarnessSkillStubAsset(
          entry,
          harness,
          installRoot,
          purposeLabelsById,
        ),
      );
  });
  const desiredAssets = [...sharedAssets, ...harnessStubs];

  return desiredAssets.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
}

export async function getRetiredManagedSkillAssets(
  selections: InstallSelections,
  registry = loadSkillRegistry(PACKAGE_ROOT),
): Promise<ResolvedAsset[]> {
  if (!selections.skills) {
    return [];
  }

  const selectedSkills = new Set(selections.selectedSkills);
  const selectedEntries = registry.skills.filter(
    (entry) =>
      selectedSkills.has(entry.name) &&
      RETIRED_MANAGED_SKILL_ASSETS[entry.name]?.length > 0,
  );

  if (selectedEntries.length === 0) {
    return [];
  }

  const installRoot = selections.skillScope === "project" ? "." : os.homedir();
  const retiredAssets = (
    await Promise.all(
      HARNESSES.flatMap((harness) => {
        if (!selections.harnesses[harness]) {
          return [];
        }

        return selectedEntries.map((entry) =>
          entry.supportedHarnesses.includes(harness)
            ? buildRetiredManagedSkillAssets(entry, harness, installRoot)
            : [],
        );
      }),
    )
  ).flat(2);

  return retiredAssets.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
}

export function getRecommendedSkillChoices(
  registry = loadSkillRegistry(PACKAGE_ROOT),
): WizardSkillChoice[] {
  const purposeById = new Map(
    registry.purposes.map((purpose) => [purpose.id, purpose]),
  );
  const purposeOrder = new Map(
    registry.purposes.map((purpose, index) => [
      purpose.id,
      purpose.order ?? index,
    ]),
  );

  const toChoice = (entry: SkillRegistryEntry): WizardSkillChoice => ({
    name: entry.name,
    displayName: entry.displayName,
    description: entry.description,
    purposes: entry.purposes.map((purposeId) => {
      const purpose = purposeById.get(purposeId);
      return {
        id: purposeId,
        label: purpose?.label ?? purposeId,
        description: purpose?.description ?? "",
      };
    }),
    source: entry.source,
    sourcePolicyKind: registry.sourcePolicy.kind,
    supportedHarnesses: [...entry.supportedHarnesses],
    provenanceLabel: entry.provenance.label,
    provenanceKind: entry.provenance.kind,
  });

  return registry.skills
    .map(toChoice)
    .sort((left, right) => {
      const leftPurposeOrder = Math.min(
        ...left.purposes.map((purpose) => purposeOrder.get(purpose.id) ?? 10_000),
      );
      const rightPurposeOrder = Math.min(
        ...right.purposes.map((purpose) => purposeOrder.get(purpose.id) ?? 10_000),
      );
      if (leftPurposeOrder !== rightPurposeOrder) {
        return leftPurposeOrder - rightPurposeOrder;
      }
      return left.name.localeCompare(right.name);
    });
}

export function applySkillRegistrySelectionMetadata(
  selections: InstallSelections,
  effectiveRegistry: EffectiveSkillRegistry,
): InstallSelections {
  const next = structuredClone(selections);
  if (!next.skills) {
    delete next.skillManifest;
    delete next.skillSelectionProvenance;
    return next;
  }

  next.skillManifest = createSkillManifestSelectionSource(effectiveRegistry);
  next.skillSelectionProvenance = createSkillSelectionProvenance(
    effectiveRegistry.registry,
    next.selectedSkills,
  );
  return next;
}

function createSkillManifestSelectionSource(
  effectiveRegistry: EffectiveSkillRegistry,
): SkillManifestSelectionSource {
  const { registry, source } = effectiveRegistry;

  return {
    manifestId: registry.manifestId,
    displayName: registry.displayName,
    sourcePolicyKind: registry.sourcePolicy.kind,
    source:
      source.kind === "built-in"
        ? "built-in"
        : source.kind === "file"
          ? "file"
          : "remote-pinned",
    ...(source.kind === "file" ? { path: source.path } : {}),
    ...(source.kind === "remote-pinned" ? { digest: source.digest } : {}),
  };
}

function createSkillSelectionProvenance(
  registry: SkillRegistry,
  selectedSkills: string[],
): SkillSelectionProvenanceEntry[] {
  const purposeById = new Map(
    registry.purposes.map((purpose) => [purpose.id, purpose]),
  );
  const selectedSkillSet = new Set(selectedSkills);

  return registry.skills
    .filter((skill) => selectedSkillSet.has(skill.name))
    .map((skill) => ({
      skillName: skill.name,
      displayName: skill.displayName,
      manifestId: registry.manifestId,
      manifestDisplayName: registry.displayName,
      sourcePolicyKind: registry.sourcePolicy.kind,
      purposeIds: [...skill.purposes],
      purposeLabels: skill.purposes.map(
        (purposeId) => purposeById.get(purposeId)?.label ?? purposeId,
      ),
      supportedHarnesses: [...skill.supportedHarnesses],
      skillSource: skill.source,
      provenanceKind: skill.provenance.kind,
      provenanceLabel: skill.provenance.label,
      ...(skill.provenance.repository
        ? { repository: skill.provenance.repository }
        : {}),
      ...(skill.provenance.ref ? { ref: skill.provenance.ref } : {}),
      ...(skill.provenance.digest ? { digest: skill.provenance.digest } : {}),
    }))
    .sort((left, right) => left.skillName.localeCompare(right.skillName));
}

async function buildSharedSkillAssets(
  entry: SkillRegistryEntry,
  installRoot: string,
): Promise<ResolvedAsset[]> {
  const resolvedSkill = await resolveSkillSource(
    entry.source,
    entry.entryPoint,
    entry.assets,
  );
  const skillInstallRoot = getInstallPath(
    installRoot,
    SHARED_AGENTICS_SKILL_DIR,
    entry.installName,
  );

  const desiredAssets: ResolvedAsset[] = [
    {
      relativePath: getInstallPath(skillInstallRoot, entry.entryPoint),
      assetClass: "static",
      sourceId: getSharedSkillSourceId(entry),
      content: resolvedSkill.entryPointContent,
    },
  ];

  resolvedSkill.assets.forEach((asset) => {
    desiredAssets.push({
      relativePath: getInstallPath(skillInstallRoot, asset.installPath),
      assetClass: "static",
      sourceId: getSharedSkillAssetSourceId(entry.name, asset.installPath),
      content:
        typeof asset.content === "string"
          ? asset.content
          : asset.content.toString("utf8"),
    });
  });

  return desiredAssets;
}

function buildHarnessSkillStubAsset(
  entry: SkillRegistryEntry,
  harness: Harness,
  installRoot: string,
  purposeLabelsById: ReadonlyMap<string, string>,
): ResolvedAsset {
  const stubInstallRoot = getInstallPath(
    installRoot,
    HARNESS_SKILL_DIRS[harness],
    entry.installName,
  );
  const canonicalEntryPointPath = getInstallPath(
    installRoot,
    SHARED_AGENTICS_SKILL_DIR,
    entry.installName,
    entry.entryPoint,
  );
  const purposeSummary = entry.purposes
    .map((purposeId) => purposeLabelsById.get(purposeId) ?? purposeId)
    .join(", ");
  const provenanceDetails = [
    entry.provenance.label,
    `kind: ${entry.provenance.kind}`,
    entry.provenance.repository ? `repository: ${entry.provenance.repository}` : "",
    entry.provenance.ref ? `ref: ${entry.provenance.ref}` : "",
    entry.provenance.digest ? `digest: ${entry.provenance.digest}` : "",
  ].filter(Boolean);

  return {
    relativePath: getInstallPath(stubInstallRoot, entry.entryPoint),
    assetClass: "static",
    sourceId: getSkillStubSourceId(entry, harness),
    content: [
      "---",
      `name: ${entry.installName}`,
      `description: Generated ${getHarnessLabel(harness)} entrypoint for the shared ${entry.displayName} make-docs skill payload.`,
      "---",
      "",
      `# ${entry.displayName}`,
      "",
      "This file is a generated make-docs harness stub. It may be replaced by future `make-docs` skill syncs.",
      "",
      `Canonical payload: \`${canonicalEntryPointPath}\``,
      `Skill source: \`${entry.source}\``,
      `Purpose summary: ${purposeSummary || "unspecified"}`,
      `Provenance: ${provenanceDetails.join("; ")}`,
      "",
      "Read and follow the canonical payload before executing this skill. Treat that payload and its sibling `references/`, `scripts/`, `assets/`, and `agents/` directories as the skill source of truth.",
      "",
      "Deterministic make-docs behavior belongs in the TypeScript CLI/shared-core operation domains. Invoke packaged behavior through `make-docs operations` or the Make Docs MCP surface when available; do not copy deterministic logic into this stub.",
      "",
    ].join("\n"),
  };
}

async function buildRetiredManagedSkillAssets(
  entry: SkillRegistryEntry,
  harness: Harness,
  installRoot: string,
): Promise<ResolvedAsset[]> {
  const retiredAssetPaths = RETIRED_MANAGED_SKILL_ASSETS[entry.name] ?? [];
  const resolvedSkill = await resolveSkillSource(
    entry.source,
    entry.entryPoint,
    retiredAssetPaths.map((assetPath) => ({
      source: assetPath,
      installPath: assetPath,
    })),
  );
  const skillInstallRoot = getInstallPath(
    installRoot,
    HARNESS_SKILL_DIRS[harness],
    entry.installName,
  );

  return resolvedSkill.assets.map((asset) => ({
    relativePath: getInstallPath(skillInstallRoot, asset.installPath),
    assetClass: "static",
    sourceId: getRetiredSkillAssetSourceId(harness, entry.name, asset.installPath),
    content:
      typeof asset.content === "string"
        ? asset.content
        : asset.content.toString("utf8"),
  }));
}

function getInstallPath(...segments: string[]): string {
  return path.join(...segments);
}

function getSharedSkillSourceId(entry: SkillRegistryEntry): string {
  return `skill:shared:${entry.name}`;
}

function getSharedSkillAssetSourceId(
  skillName: string,
  installPath: string,
): string {
  return `skill-shared-asset:${skillName}:${installPath}`;
}

function getSkillStubSourceId(
  entry: SkillRegistryEntry,
  harness: Harness,
): string {
  return `skill-stub:${harness}:${entry.name}`;
}

function getRetiredSkillAssetSourceId(
  harness: Harness,
  skillName: string,
  installPath: string,
): string {
  return `retired-skill-asset:${harness}:${skillName}:${installPath}`;
}

function getHarnessLabel(harness: Harness): string {
  return harness === "claude-code" ? "Claude Code" : "Codex";
}
