/**
 * First-party harness capability descriptors (W18 R8 P1, R-CAP-2).
 *
 * These descriptors are the single home of harness-specific packaging
 * knowledge: adapter declarations derive their path templates, preconditions,
 * and exposure modes from here (R-CAP-2, R-ADAPT-1), and the shared harness
 * registry serves them to answer the packaging-time capability question
 * (R-CAP-1).
 *
 * Implementer decisions recorded here:
 * - Every descriptor is `provisional` in Phase 1. Phase 3 (W18 R8 P3) owns
 *   real-harness verification and the verified-adapter-contract corrections;
 *   until then no descriptor content is harness-recognition evidence
 *   (R-ADAPT-1, R-TEST-5).
 * - Codex placement roots keep the W18 R5 shapes so the Phase 2 writer
 *   rebuild lands against a stable resolver; the container's manifest
 *   filename and marketplace registration files already declare the verified
 *   Codex shape from the design (`.codex-plugin/plugin.json` inside the
 *   plugin folder plus a marketplace entry, R-ADAPT-2) so Phase 2/3 consume
 *   them from the descriptor rather than re-inventing them.
 * - Pi has a descriptor but no adapter module yet: the registry can answer
 *   both capability questions for Pi (skills, MCP, and extensions but not
 *   hooks; richest native container is an extension, R-ADAPT-4) while the Pi
 *   adapter contract itself lands in Phase 3. Its paths are inferred and
 *   flagged in `verification.provisionalNotes`.
 * - The claude-code lifecycle event map covers the harness-session events;
 *   the git events (`on-pre-commit`, `on-post-commit`, `on-pre-push`) have no
 *   Claude Code hook points and are deliberately absent so event-bound steps
 *   on them degrade or fail closed per R-CAP-4/R-CAP-5.
 */

import type { HarnessCapabilityDescriptor } from "./capability-descriptor";
import { validateHarnessCapabilityDescriptor } from "./capability-descriptor";

const PACKAGING_DESIGN_REF =
  "docs/designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md";

export const CODEX_HARNESS_CAPABILITY_DESCRIPTOR: HarnessCapabilityDescriptor =
  validateHarnessCapabilityDescriptor({
    harnessId: "codex",
    supportedPrimitives: ["skill", "plugin", "mcp-server"],
    containers: [
      {
        containerId: "codex-plugin",
        kind: "plugin",
        profile: "native",
        richness: 2,
        hostedPrimitives: ["skill", "plugin", "mcp-server"],
        layout: {
          placements: [
            { surface: "native", scope: "project", pathTemplate: ".agents/plugins/{packageId}" },
            {
              surface: "native",
              scope: "global",
              pathTemplate: "<user-home>/.codex/plugins/{packageId}",
            },
            {
              surface: "native",
              scope: "export-only",
              pathTemplate: ".make-docs/exports/playbook-packages/{packageId}/plugin.json",
            },
          ],
          manifestFilename: ".codex-plugin/plugin.json",
          skillFileTemplate: "skills/{skillId}/SKILL.md",
          registrationFiles: [".agents/plugins/marketplace.json"],
        },
      },
      {
        containerId: "codex-skills-directory",
        kind: "skills-directory",
        profile: "portable",
        richness: 1,
        hostedPrimitives: ["skill"],
        layout: {
          placements: [
            {
              surface: "native",
              scope: "project",
              pathTemplate: ".agents/skills/{packageId}/SKILL.md",
            },
            {
              surface: "agents-standard",
              scope: "project",
              pathTemplate: ".agents/skills/{packageId}/SKILL.md",
            },
            {
              surface: "agents-standard",
              scope: "global",
              pathTemplate: "<user-home>/.agents/skills/{packageId}/SKILL.md",
            },
            {
              surface: "agents-standard",
              scope: "export-only",
              pathTemplate: ".make-docs/exports/playbook-packages/{packageId}/SKILL.md",
            },
          ],
          manifestFilename: null,
          skillFileTemplate: "{skillId}/SKILL.md",
          registrationFiles: [],
        },
      },
    ],
    lifecycleEventMap: {},
    supportedExposureModes: ["symlink", "copy-mirror", "export-only"],
    preferredExposureMode: "symlink",
    fallbackExposureMode: "copy-mirror",
    registration: {
      kind: "marketplace-entry",
      description:
        "A Codex plugin is a folder containing `.codex-plugin/plugin.json`, registered through a marketplace entry such as `.agents/plugins/marketplace.json` or a configured marketplace source; skills bundles use direct `.agents/skills/{id}/SKILL.md` discovery (R-ADAPT-2).",
      autoRegister: false,
    },
    preconditions: [
      {
        id: "harness-supported",
        description: "The target harness adapter must be present and selected.",
        required: true,
      },
      {
        id: "project-trusted",
        description:
          "The project must be trusted before project-local standard agentic locations are used.",
        required: true,
      },
      {
        id: "symlink-or-copy-mirror",
        description: "Native exposure uses symlinks when available and managed copy mirrors otherwise.",
        required: true,
      },
    ],
    verification: {
      status: "provisional",
      reference: `${PACKAGING_DESIGN_REF} (R-ADAPT-2)`,
      provisionalNotes: [
        "Plugin placement roots keep the W18 R5 shapes pending the Phase 3 R-ADAPT-2 adapter correction against the real Codex harness.",
        "Codex hook support is undeclared pending Phase 3 verification; event-bound steps degrade or fail closed (R-CAP-5).",
        "MCP-server hosting inside the plugin container is inferred pending Phase 3 verification.",
      ],
    },
  });

export const CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR: HarnessCapabilityDescriptor =
  validateHarnessCapabilityDescriptor({
    harnessId: "claude-code",
    supportedPrimitives: ["skill", "plugin", "hook", "mcp-server"],
    containers: [
      {
        containerId: "claude-code-plugin",
        kind: "plugin",
        profile: "native",
        richness: 2,
        hostedPrimitives: ["skill", "plugin", "hook", "mcp-server"],
        layout: {
          placements: [
            {
              surface: "native",
              scope: "project",
              pathTemplate: ".claude/plugins/{packageId}/plugin.json",
            },
            {
              surface: "native",
              scope: "global",
              pathTemplate: "<user-home>/.claude/plugins/{packageId}/plugin.json",
            },
            {
              surface: "native",
              scope: "export-only",
              pathTemplate: ".make-docs/exports/playbook-packages/{packageId}/plugin.json",
            },
          ],
          manifestFilename: "plugin.json",
          skillFileTemplate: "skills/{skillId}/SKILL.md",
          registrationFiles: [],
        },
      },
      {
        containerId: "claude-code-skills-directory",
        kind: "skills-directory",
        profile: "portable",
        richness: 1,
        hostedPrimitives: ["skill"],
        layout: {
          placements: [
            {
              surface: "native",
              scope: "project",
              pathTemplate: ".claude/skills/{packageId}/SKILL.md",
            },
            {
              surface: "agents-standard",
              scope: "project",
              pathTemplate: ".agents/skills/{packageId}/SKILL.md",
            },
            {
              surface: "agents-standard",
              scope: "global",
              pathTemplate: "<user-home>/.agents/skills/{packageId}/SKILL.md",
            },
            {
              surface: "agents-standard",
              scope: "export-only",
              pathTemplate: ".make-docs/exports/playbook-packages/{packageId}/SKILL.md",
            },
          ],
          manifestFilename: null,
          skillFileTemplate: "{skillId}/SKILL.md",
          registrationFiles: [],
        },
      },
    ],
    lifecycleEventMap: {
      "on-session-start": {
        hookPoint: "SessionStart",
        description: "Runs when a Claude Code session starts.",
      },
      "on-session-end": {
        hookPoint: "SessionEnd",
        description: "Runs when a Claude Code session ends.",
      },
      "on-user-prompt-submit": {
        hookPoint: "UserPromptSubmit",
        description: "Runs when the user submits a prompt.",
      },
      "on-pre-tool-use": {
        hookPoint: "PreToolUse",
        description: "Runs before a tool call executes.",
      },
      "on-post-tool-use": {
        hookPoint: "PostToolUse",
        description: "Runs after a tool call completes.",
      },
    },
    supportedExposureModes: ["symlink", "copy-mirror", "export-only"],
    preferredExposureMode: "symlink",
    fallbackExposureMode: "copy-mirror",
    registration: {
      kind: "direct-discovery",
      description:
        "Claude Code discovers plugins under `.claude/plugins/{id}/plugin.json` and skills under `.claude/skills/{id}/SKILL.md` or agents-standard `.agents/skills` (R-ADAPT-3).",
      autoRegister: false,
    },
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
    verification: {
      status: "provisional",
      reference: `${PACKAGING_DESIGN_REF} (R-ADAPT-3)`,
      provisionalNotes: [
        "The plugin/skill layout and hook-point names must be reviewed against the actual Claude Code plugin and skill contract before support moves beyond provisional (R-ADAPT-3).",
        "Git lifecycle events (`on-pre-commit`, `on-post-commit`, `on-pre-push`) are deliberately unmapped; they degrade or fail closed per R-CAP-4.",
      ],
    },
  });

export const PI_HARNESS_CAPABILITY_DESCRIPTOR: HarnessCapabilityDescriptor =
  validateHarnessCapabilityDescriptor({
    harnessId: "pi",
    supportedPrimitives: ["skill", "extension", "mcp-server"],
    containers: [
      {
        containerId: "pi-extension",
        kind: "extension",
        profile: "native",
        richness: 2,
        hostedPrimitives: ["skill", "extension", "mcp-server"],
        layout: {
          placements: [
            { surface: "native", scope: "project", pathTemplate: ".pi/extensions/{packageId}" },
            {
              surface: "native",
              scope: "global",
              pathTemplate: "<user-home>/.pi/extensions/{packageId}",
            },
            {
              surface: "native",
              scope: "export-only",
              pathTemplate: ".make-docs/exports/playbook-packages/{packageId}/extension.json",
            },
          ],
          manifestFilename: "extension.json",
          skillFileTemplate: "skills/{skillId}/SKILL.md",
          registrationFiles: [],
        },
      },
      {
        containerId: "pi-skills-directory",
        kind: "skills-directory",
        profile: "portable",
        richness: 1,
        hostedPrimitives: ["skill"],
        layout: {
          placements: [
            {
              surface: "agents-standard",
              scope: "project",
              pathTemplate: ".agents/skills/{packageId}/SKILL.md",
            },
            {
              surface: "agents-standard",
              scope: "global",
              pathTemplate: "<user-home>/.agents/skills/{packageId}/SKILL.md",
            },
            {
              surface: "agents-standard",
              scope: "export-only",
              pathTemplate: ".make-docs/exports/playbook-packages/{packageId}/SKILL.md",
            },
          ],
          manifestFilename: null,
          skillFileTemplate: "{skillId}/SKILL.md",
          registrationFiles: [],
        },
      },
    ],
    lifecycleEventMap: {},
    supportedExposureModes: ["symlink", "copy-mirror", "export-only"],
    preferredExposureMode: "symlink",
    fallbackExposureMode: "copy-mirror",
    registration: {
      kind: "direct-discovery",
      description:
        "Pi supports skills, MCP, and extensions but not hooks; its richest native container is an extension bundled with one or more skills (R-ADAPT-4).",
      autoRegister: false,
    },
    preconditions: [
      {
        id: "harness-supported",
        description: "The target harness adapter must be present and selected.",
        required: true,
      },
      {
        id: "symlink-or-copy-mirror",
        description: "Native exposure uses symlinks when available and managed copy mirrors otherwise.",
        required: true,
      },
    ],
    verification: {
      status: "provisional",
      reference: `${PACKAGING_DESIGN_REF} (R-ADAPT-4)`,
      provisionalNotes: [
        "All Pi paths, the extension manifest filename, and the skills placement are inferred; the Pi adapter contract lands and is verified in Phase 3 (R-ADAPT-4).",
        "Pi has no adapter module yet; the registry answers its capability questions while packaging output stays unavailable until Phase 3.",
      ],
    },
  });

/** Fixture descriptor proving future-harness support stays additive (R-ADAPT-5). */
export const FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR: HarnessCapabilityDescriptor =
  validateHarnessCapabilityDescriptor({
    harnessId: "future-harness",
    supportedPrimitives: ["skill", "plugin"],
    containers: [
      {
        containerId: "future-plugin",
        kind: "plugin",
        profile: "native",
        richness: 2,
        hostedPrimitives: ["skill", "plugin"],
        layout: {
          placements: [
            {
              surface: "native",
              scope: "project",
              pathTemplate: ".future/plugins/{packageId}/plugin.json",
            },
            {
              surface: "native",
              scope: "export-only",
              pathTemplate: ".make-docs/exports/playbook-packages/{packageId}/plugin.json",
            },
          ],
          manifestFilename: "plugin.json",
          skillFileTemplate: "skills/{skillId}/SKILL.md",
          registrationFiles: [],
        },
      },
      {
        containerId: "future-skills-directory",
        kind: "skills-directory",
        profile: "portable",
        richness: 1,
        hostedPrimitives: ["skill"],
        layout: {
          placements: [
            {
              surface: "agents-standard",
              scope: "project",
              pathTemplate: ".agents/skills/{packageId}/SKILL.md",
            },
            {
              surface: "agents-standard",
              scope: "global",
              pathTemplate: "<user-home>/.agents/skills/{packageId}/SKILL.md",
            },
          ],
          manifestFilename: null,
          skillFileTemplate: "{skillId}/SKILL.md",
          registrationFiles: [],
        },
      },
    ],
    lifecycleEventMap: {},
    supportedExposureModes: ["symlink", "copy-mirror", "export-only"],
    preferredExposureMode: "symlink",
    fallbackExposureMode: "copy-mirror",
    registration: {
      kind: "direct-discovery",
      description: "Fixture harness discovers plugins and skills directly from project paths.",
      autoRegister: false,
    },
    preconditions: [
      {
        id: "future-project-trusted",
        description: "Fixture harness project trust must be reviewed before standard surfaces are used.",
        required: true,
      },
    ],
    verification: {
      status: "provisional",
      reference: "packages/cli/tests/playbook-packaging.test.ts (fixture harness)",
      provisionalNotes: ["Fixture descriptor exists to test additive registration and fail-closed paths."],
    },
  });

export const FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS: HarnessCapabilityDescriptor[] = [
  CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
  CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR,
  PI_HARNESS_CAPABILITY_DESCRIPTOR,
];
