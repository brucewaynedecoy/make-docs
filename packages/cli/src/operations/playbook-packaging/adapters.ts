import { OperationError } from "../types";
import type { HarnessPackageAdapterDeclaration } from "./types";
import { validateHarnessAdapterDeclaration } from "./validation";

export const FIRST_PARTY_HARNESS_PACKAGE_ADAPTERS: HarnessPackageAdapterDeclaration[] = [
  createAdapter({
    harnessId: "codex",
    supportedOutputKinds: ["plugin", "skills-bundle"],
    supportedSurfaces: ["native", "agents-standard", "auto"],
    supportedScopes: ["project", "global", "export-only"],
    pathTemplates: [
      {
        outputKind: "plugin",
        surface: "native",
        scope: "project",
        template: ".agents/plugins/{packageId}",
      },
      {
        outputKind: "skills-bundle",
        surface: "native",
        scope: "project",
        template: ".agents/skills/{packageId}/SKILL.md",
      },
      {
        outputKind: "skills-bundle",
        surface: "agents-standard",
        scope: "project",
        template: ".agents/skills/{packageId}/SKILL.md",
      },
      {
        outputKind: "plugin",
        surface: "native",
        scope: "global",
        template: "<user-home>/.codex/plugins/{packageId}",
      },
      {
        outputKind: "skills-bundle",
        surface: "agents-standard",
        scope: "global",
        template: "<user-home>/.agents/skills/{packageId}/SKILL.md",
      },
      {
        outputKind: "plugin",
        surface: "native",
        scope: "export-only",
        template: ".make-docs/exports/playbook-packages/{packageId}/plugin.json",
      },
      {
        outputKind: "skills-bundle",
        surface: "agents-standard",
        scope: "export-only",
        template: ".make-docs/exports/playbook-packages/{packageId}/SKILL.md",
      },
    ],
    preconditions: [
      {
        id: "harness-supported",
        description: "The target harness adapter must be present and selected.",
        required: true,
      },
      {
        id: "project-trusted",
        description: "The project must be trusted before project-local standard agentic locations are used.",
        required: true,
      },
      {
        id: "symlink-or-copy-mirror",
        description: "Native exposure uses symlinks when available and managed copy mirrors otherwise.",
        required: true,
      },
    ],
    preferredExposureMode: "symlink",
    fallbackExposureMode: "copy-mirror",
    ownershipClasses: ["generated-plugin", "generated-skills-bundle", "symlink-exposure", "copy-mirror"],
    lifecycleRules: [
      {
        id: "unlink-symlink-exposure",
        description: "Lifecycle cleanup unlinks symlink exposures without following targets.",
      },
      {
        id: "remove-reviewed-copy-mirror",
        description: "Lifecycle cleanup removes managed copy mirrors only after reviewed ownership and backup.",
      },
    ],
    conformanceRequirements: [
      {
        id: "codex-package-output-fixture",
        description: "Codex package output support remains provisional until exact tuple conformance evidence exists.",
        required: true,
      },
    ],
  }),
  createAdapter({
    harnessId: "claude-code",
    supportedOutputKinds: ["plugin", "skills-bundle"],
    supportedSurfaces: ["native", "agents-standard", "auto"],
    supportedScopes: ["project", "global", "export-only"],
    pathTemplates: [
      {
        outputKind: "plugin",
        surface: "native",
        scope: "project",
        template: ".claude/plugins/{packageId}/plugin.json",
      },
      {
        outputKind: "skills-bundle",
        surface: "native",
        scope: "project",
        template: ".claude/skills/{packageId}/SKILL.md",
      },
      {
        outputKind: "skills-bundle",
        surface: "agents-standard",
        scope: "project",
        template: ".agents/skills/{packageId}/SKILL.md",
      },
      {
        outputKind: "plugin",
        surface: "native",
        scope: "global",
        template: "<user-home>/.claude/plugins/{packageId}/plugin.json",
      },
      {
        outputKind: "skills-bundle",
        surface: "agents-standard",
        scope: "global",
        template: "<user-home>/.agents/skills/{packageId}/SKILL.md",
      },
      {
        outputKind: "plugin",
        surface: "native",
        scope: "export-only",
        template: ".make-docs/exports/playbook-packages/{packageId}/plugin.json",
      },
      {
        outputKind: "skills-bundle",
        surface: "agents-standard",
        scope: "export-only",
        template: ".make-docs/exports/playbook-packages/{packageId}/SKILL.md",
      },
    ],
    preconditions: [
      {
        id: "harness-supported",
        description: "The target harness adapter must be present and selected.",
        required: true,
      },
      {
        id: "plugin-or-skill-support",
        description: "The target Claude Code surface must support the selected output kind.",
        required: true,
      },
      {
        id: "symlink-or-copy-mirror",
        description: "Native exposure uses symlinks when available and managed copy mirrors otherwise.",
        required: true,
      },
    ],
    preferredExposureMode: "symlink",
    fallbackExposureMode: "copy-mirror",
    ownershipClasses: ["generated-plugin", "generated-skills-bundle", "generated-adapter", "symlink-exposure", "copy-mirror"],
    lifecycleRules: [
      {
        id: "preserve-user-authored-plugin",
        description: "User-authored harness plugin files are preserved or routed to review.",
      },
      {
        id: "remove-reviewed-copy-mirror",
        description: "Lifecycle cleanup removes managed copy mirrors only after reviewed ownership and backup.",
      },
    ],
    conformanceRequirements: [
      {
        id: "claude-code-package-output-fixture",
        description: "Claude Code package output support remains provisional until exact tuple conformance evidence exists.",
        required: true,
      },
    ],
  }),
];

export const FIXTURE_FUTURE_HARNESS_PACKAGE_ADAPTER: HarnessPackageAdapterDeclaration = createAdapter({
  harnessId: "future-harness",
  supportedOutputKinds: ["plugin", "skills-bundle"],
  supportedSurfaces: ["native", "agents-standard", "auto"],
  supportedScopes: ["project", "global", "export-only"],
  pathTemplates: [
    {
      outputKind: "plugin",
      surface: "native",
      scope: "project",
      template: ".future/plugins/{packageId}/plugin.json",
    },
    {
      outputKind: "skills-bundle",
      surface: "agents-standard",
      scope: "project",
      template: ".agents/skills/{packageId}/SKILL.md",
    },
    {
      outputKind: "skills-bundle",
      surface: "agents-standard",
      scope: "global",
      template: "<user-home>/.agents/skills/{packageId}/SKILL.md",
    },
    {
      outputKind: "plugin",
      surface: "native",
      scope: "export-only",
      template: ".make-docs/exports/playbook-packages/{packageId}/plugin.json",
    },
  ],
  preconditions: [
    {
      id: "future-project-trusted",
      description: "Fixture harness project trust must be reviewed before standard surfaces are used.",
      required: true,
    },
  ],
  preferredExposureMode: "symlink",
  fallbackExposureMode: "copy-mirror",
  ownershipClasses: ["generated-plugin", "generated-skills-bundle", "symlink-exposure", "copy-mirror"],
  lifecycleRules: [
    {
      id: "fixture-safe-cleanup",
      description: "Fixture harness cleanup preserves user-authored files and removes only reviewed generated output.",
    },
  ],
  conformanceRequirements: [
    {
      id: "future-harness-fixture",
      description: "Fixture proves future harness support is additive.",
      required: true,
    },
  ],
});

export function listHarnessPackageAdapters(input: {
  includeFixtures?: boolean;
  adapters?: HarnessPackageAdapterDeclaration[];
} = {}): HarnessPackageAdapterDeclaration[] {
  const adapters = input.adapters ?? FIRST_PARTY_HARNESS_PACKAGE_ADAPTERS;
  return [
    ...adapters,
    ...(input.includeFixtures ? [FIXTURE_FUTURE_HARNESS_PACKAGE_ADAPTER] : []),
  ].map((adapter) => validateHarnessAdapterDeclaration(adapter));
}

export function getHarnessPackageAdapter(input: {
  harnessId: string;
  includeFixtures?: boolean;
  adapters?: HarnessPackageAdapterDeclaration[];
}): HarnessPackageAdapterDeclaration {
  const adapter = listHarnessPackageAdapters({
    adapters: input.adapters,
    includeFixtures: input.includeFixtures,
  }).find((candidate) => candidate.harnessId === input.harnessId);
  if (!adapter) {
    throw new OperationError(`No package adapter registered for harness \`${input.harnessId}\`.`);
  }
  return adapter;
}

function createAdapter(adapter: HarnessPackageAdapterDeclaration): HarnessPackageAdapterDeclaration {
  return validateHarnessAdapterDeclaration(adapter);
}
