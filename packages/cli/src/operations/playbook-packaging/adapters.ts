/**
 * Harness package adapter declarations (W18 R5, revised by W18 R8 P1/P3).
 *
 * Since W18 R8 P1 the adapters no longer author path templates: the harness
 * capability descriptor is the carrier of harness paths, manifest shapes,
 * exposure modes, preconditions, and — since P3 — the verification reference
 * and status every adapter declaration must carry (R-ADAPT-1), and each
 * first-party declaration derives those fields from its descriptor via
 * `deriveAdapterDeclarationCore` (R-CAP-2). Ownership classes, lifecycle
 * rules, and conformance requirements stay declared here because they are
 * Make Docs lifecycle policy, not harness packaging knowledge.
 *
 * The Pi adapter (W18 R8 P3, R-ADAPT-4) is a descriptor-derived declaration
 * like every other: adding it required no shared-planner or resolver change
 * (R-KEEP-1) — a descriptor, this declaration, and fixtures only. Pi supports
 * skills, MCP, and extensions but not hooks; its richest native container is
 * an extension bundled with one or more skills, and event-bound steps degrade
 * to a documented manual step or skill instruction, or fail closed, per
 * R-CAP-4/R-CAP-5.
 */

import { OperationError } from "../types";
import { deriveAdapterDeclarationCore } from "./capability-descriptor";
import {
  CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR,
  CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
  FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
  FIXTURE_LIMITED_HARNESS_CAPABILITY_DESCRIPTOR,
  PI_HARNESS_CAPABILITY_DESCRIPTOR,
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
  createAdapter({
    ...deriveAdapterDeclarationCore(PI_HARNESS_CAPABILITY_DESCRIPTOR),
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
        id: "pi-package-output-fixture",
        description: "Pi package output support remains provisional until exact tuple conformance evidence exists.",
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

/**
 * Fixture adapter that exercises the unsupported paths so the fail-closed
 * behavior is itself tested (R-ADAPT-5): its harness declares no portable
 * container, no agents-standard surface, no global scope, and no hooks.
 */
export const FIXTURE_LIMITED_HARNESS_PACKAGE_ADAPTER: HarnessPackageAdapterDeclaration = createAdapter({
  ...deriveAdapterDeclarationCore(FIXTURE_LIMITED_HARNESS_CAPABILITY_DESCRIPTOR),
  ownershipClasses: ["generated-plugin", "symlink-exposure", "copy-mirror"],
  lifecycleRules: [
    {
      id: "fixture-safe-cleanup",
      description: "Fixture harness cleanup preserves user-authored files and removes only reviewed generated output.",
    },
  ],
  conformanceRequirements: [
    {
      id: "limited-harness-fixture",
      description: "Fixture proves unknown and unsupported targets fail closed before any write.",
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
    ...(input.includeFixtures
      ? [FIXTURE_FUTURE_HARNESS_PACKAGE_ADAPTER, FIXTURE_LIMITED_HARNESS_PACKAGE_ADAPTER]
      : []),
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
