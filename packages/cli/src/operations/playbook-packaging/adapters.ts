/**
 * Harness package adapter declarations (W18 R5, revised by W18 R8 P1).
 *
 * Since W18 R8 P1 the adapters no longer author path templates: the harness
 * capability descriptor is the carrier of harness paths, manifest shapes,
 * exposure modes, and preconditions, and each first-party declaration derives
 * those fields from its descriptor via `deriveAdapterDeclarationCore`
 * (R-CAP-2, R-ADAPT-1). Ownership classes, lifecycle rules, and conformance
 * requirements stay declared here because they are Make Docs lifecycle
 * policy, not harness packaging knowledge.
 *
 * Pi has a registered capability descriptor but no adapter declaration yet;
 * the Pi adapter contract lands with Phase 3 (R-ADAPT-4).
 */

import { OperationError } from "../types";
import { deriveAdapterDeclarationCore } from "./capability-descriptor";
import {
  CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR,
  CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
  FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
} from "./descriptors";
import type { HarnessPackageAdapterDeclaration } from "./types";
import { validateHarnessAdapterDeclaration } from "./validation";

export const FIRST_PARTY_HARNESS_PACKAGE_ADAPTERS: HarnessPackageAdapterDeclaration[] = [
  createAdapter({
    ...deriveAdapterDeclarationCore(CODEX_HARNESS_CAPABILITY_DESCRIPTOR),
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
    ...deriveAdapterDeclarationCore(CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR),
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
  ...deriveAdapterDeclarationCore(FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR),
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
