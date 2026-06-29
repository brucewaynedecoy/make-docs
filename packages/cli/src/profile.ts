import { hashText, formatInlineList } from "./utils";
import {
  CAPABILITIES,
  type Capability,
  type CapabilityState,
  type InstallProfile,
  type InstallSelections,
} from "./types";

export const CAPABILITY_DEPENDENCIES: Record<Capability, Capability[]> = {
  designs: [],
  plans: [],
  prd: ["plans"],
  work: ["plans", "prd"],
};

export function defaultSelections(): InstallSelections {
  return {
    capabilities: {
      designs: true,
      plans: true,
      prd: true,
      work: true,
    },
    harnesses: {
      "claude-code": true,
      codex: true,
    },
    skills: false,
    skillScope: "project",
    selectedSkills: [],
    plugins: false,
    pluginScope: "project",
    selectedPlugins: [],
  };
}

export function cloneSelections(
  selections: InstallSelections,
): InstallSelections {
  return structuredClone(selections);
}

export function resolveCapabilityState(
  selections: InstallSelections,
): Record<Capability, CapabilityState> {
  const state = {} as Record<Capability, CapabilityState>;

  for (const capability of CAPABILITIES) {
    const missingPrerequisites = CAPABILITY_DEPENDENCIES[capability].filter(
      (dependency) => !state[dependency]?.effectiveSelection,
    );
    const explicitSelection = selections.capabilities[capability];
    const effectiveSelection =
      explicitSelection && missingPrerequisites.length === 0;

    state[capability] = {
      explicitSelection,
      effectiveSelection,
      missingPrerequisites,
      disabledReason:
        missingPrerequisites.length > 0
          ? `${capability} requires ${formatInlineList(missingPrerequisites)}`
          : undefined,
    };
  }

  return state;
}

export function resolveInstallProfile(
  selections: InstallSelections,
): InstallProfile {
  const capabilityState = resolveCapabilityState(selections);
  const effectiveCapabilities = CAPABILITIES.filter(
    (capability) => capabilityState[capability].effectiveSelection,
  );

  const profileId = hashText(
    JSON.stringify({
      capabilities: capabilityState,
      harnesses: selections.harnesses,
      skills: selections.skills,
      skillScope: selections.skillScope,
      selectedSkills: [...selections.selectedSkills].sort(),
      skillManifest: selections.skillManifest,
      skillSelectionProvenance: selections.skillSelectionProvenance ?? [],
      plugins: selections.plugins,
      pluginScope: selections.pluginScope,
      selectedPlugins: [...selections.selectedPlugins].sort(),
      pluginManifest: selections.pluginManifest,
      pluginSelectionProvenance: selections.pluginSelectionProvenance ?? [],
    }),
  ).slice(0, 16);

  return {
    selections,
    capabilityState,
    effectiveCapabilities,
    profileId,
  };
}

export function hasEffectiveCapabilities(profile: InstallProfile): boolean {
  return profile.effectiveCapabilities.length > 0;
}
