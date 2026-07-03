/**
 * First-party harness capability descriptors (W18 R8 P1, revised by P3;
 * R-CAP-2, R-ADAPT-1..4).
 *
 * These descriptors are the single home of harness-specific packaging
 * knowledge: adapter declarations derive their path templates, preconditions,
 * exposure modes, and verification blocks from here (R-CAP-2, R-ADAPT-1), and
 * the shared harness registry serves them to answer the packaging-time
 * capability question (R-CAP-1).
 *
 * Implementer decisions recorded here:
 * - Verification statuses (W18 R8 P3, R-ADAPT-1): Codex is `verified` — the
 *   design confirmed the real Codex contract (a plugin is a folder containing
 *   `.codex-plugin/plugin.json`, registered through a marketplace entry such
 *   as `.agents/plugins/marketplace.json` or a configured marketplace source;
 *   a skills bundle uses direct `.agents/skills/{id}/SKILL.md` discovery) and
 *   its `contractDigest` pins that surface against unreviewed drift; the one
 *   residual inference (MCP-server hosting inside the plugin container) stays
 *   flagged in `provisionalNotes`. Claude Code stays `provisional`: R-ADAPT-3
 *   declares its shapes but requires review against the actual Claude Code
 *   plugin and skill contract before support moves beyond provisional. Pi
 *   stays `provisional`: R-ADAPT-4 confirms only its primitives (skills, MCP,
 *   extensions, no hooks) and its richest container (an extension bundled
 *   with skills); every Pi path and manifest filename is inferred. No
 *   verification status is harness-recognition evidence; that bar is owned by
 *   W18 R9 (R-TEST-5).
 * - Codex plugin placement roots (W18 R8 P3, R-ADAPT-2): the assumed W18 R5
 *   `.agents/plugins/{packageId}` root is gone. The verified contract fixes
 *   the folder shape and the marketplace registration, not a mandatory folder
 *   location — the marketplace entry names the folder — so the exposure roots
 *   `.codex/plugins/{packageId}` (project) and
 *   `<user-home>/.codex/plugins/{packageId}` (global) are Make Docs-chosen
 *   install locations (D9 implementer freedom) that the generated marketplace
 *   entry references; `.agents/plugins/` holds only the marketplace file.
 * - Pi's adapter declaration lands with Phase 3 as descriptor-derived data
 *   (skills, MCP, and extensions but not hooks; richest native container is
 *   an extension, R-ADAPT-4). Its paths remain inferred and flagged in
 *   `verification.provisionalNotes`.
 * - The claude-code lifecycle event map covers the harness-session events;
 *   the git events (`on-pre-commit`, `on-post-commit`, `on-pre-push`) have no
 *   Claude Code hook points and are deliberately absent so event-bound steps
 *   on them degrade or fail closed per R-CAP-4/R-CAP-5.
 */

import type { HarnessCapabilityDescriptor } from "./capability-descriptor";
import { validateHarnessCapabilityDescriptor } from "./capability-descriptor";

const PACKAGING_DESIGN_REF =
  "docs/designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md";
const PLAYBOOK_ARCHITECTURE_REF = "docs/assets/artifacts/playbook-architecture.md";

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
            { surface: "native", scope: "project", pathTemplate: ".codex/plugins/{packageId}" },
            {
              surface: "native",
              scope: "global",
              pathTemplate: "<user-home>/.codex/plugins/{packageId}",
            },
            {
              surface: "native",
              scope: "export-only",
              pathTemplate: ".make-docs/exports/playbook-packages/{packageId}",
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
      status: "verified",
      reference:
        `Verified Codex contract: a plugin is a folder containing \`.codex-plugin/plugin.json\` registered through a marketplace entry (\`.agents/plugins/marketplace.json\` or a configured marketplace source), and a skills bundle uses direct \`.agents/skills/{id}/SKILL.md\` discovery with symlink or copy-mirror exposure — confirmed in ${PACKAGING_DESIGN_REF} (D6, R-ADAPT-2) and ${PLAYBOOK_ARCHITECTURE_REF} (Section 8). Plugin folder exposure roots are Make Docs-chosen install locations the marketplace entry references (D9 implementer freedom).`,
      provisionalNotes: [
        "MCP-server hosting inside the plugin container remains inferred; only the R-ADAPT-2 plugin-folder, marketplace-registration, and skills-discovery shapes are design-verified, and support stays provisional pending W18 R9 tuple evidence (R-PROV-3).",
      ],
      // Recorded at verification time; recomputed by descriptor validation so
      // any change to the declared Codex contract surface demands
      // re-verification (R-ADAPT-1).
      contractDigest: "sha256:2033146ce7fa5b71",
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
      reference:
        `Declared Claude Code contract — plugin at \`.claude/plugins/{id}/plugin.json\`, skill at \`.claude/skills/{id}/SKILL.md\`, agents-standard \`.agents/skills\` for the portable profile, event-bound steps on Claude Code hook points — stated in ${PACKAGING_DESIGN_REF} (D6, R-ADAPT-3) and ${PLAYBOOK_ARCHITECTURE_REF} (Section 8); unverified until reviewed against the actual Claude Code plugin and skill contract.`,
      provisionalNotes: [
        "The plugin/skill layout and hook-point names must be reviewed against the actual Claude Code plugin and skill contract before the support status moves beyond provisional (R-ADAPT-3, R-ADAPT-1).",
        "Git lifecycle events (`on-pre-commit`, `on-post-commit`, `on-pre-push`) are deliberately unmapped; they degrade or fail closed per R-CAP-4.",
      ],
      contractDigest: null,
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
      reference:
        `Declared Pi contract — skills, MCP, and extension support with no hooks, and an extension bundled with one or more skills as the richest native container — stated in ${PACKAGING_DESIGN_REF} (D6, R-ADAPT-4) and ${PLAYBOOK_ARCHITECTURE_REF} (Section 8); every Pi path and manifest filename is inferred and unverified against the real Pi harness.`,
      provisionalNotes: [
        "All Pi paths, the extension manifest filename, and the skills placement are inferred; the design confirms only the primitive set (skills, MCP, extensions, no hooks) and the extension-with-skills container (R-ADAPT-4).",
        "The Pi adapter therefore produces only export-only or provisional output and carries no support claim until real-harness verification and W18 R9 conformance evidence exist (R-ADAPT-1, R-PROV-3).",
      ],
      contractDigest: null,
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
      contractDigest: null,
    },
  });

/**
 * Fixture descriptor whose harness deliberately supports only the native
 * plugin profile at project or export-only scope, so the unsupported paths —
 * unsupported output kind, unsupported surface, and a scope the adapter
 * cannot honor — are exercised and the fail-closed behavior is itself tested
 * (R-ADAPT-5, R-TEST-3).
 */
export const FIXTURE_LIMITED_HARNESS_CAPABILITY_DESCRIPTOR: HarnessCapabilityDescriptor =
  validateHarnessCapabilityDescriptor({
    harnessId: "fixture-limited",
    supportedPrimitives: ["skill", "plugin"],
    containers: [
      {
        containerId: "limited-plugin",
        kind: "plugin",
        profile: "native",
        richness: 1,
        hostedPrimitives: ["skill", "plugin"],
        layout: {
          placements: [
            {
              surface: "native",
              scope: "project",
              pathTemplate: ".limited/plugins/{packageId}/plugin.json",
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
    ],
    lifecycleEventMap: {},
    supportedExposureModes: ["symlink", "copy-mirror", "export-only"],
    preferredExposureMode: "symlink",
    fallbackExposureMode: "copy-mirror",
    registration: {
      kind: "direct-discovery",
      description:
        "Fixture harness discovers native plugins only; it has no portable container, no agents-standard surface, no global scope, and no hooks.",
      autoRegister: false,
    },
    preconditions: [
      {
        id: "limited-project-trusted",
        description: "Fixture harness project trust must be reviewed before native surfaces are used.",
        required: true,
      },
    ],
    verification: {
      status: "provisional",
      reference: "packages/cli/tests/playbook-packaging-adapters.test.ts (fail-closed fixture)",
      provisionalNotes: [
        "Fixture descriptor exists to exercise the unsupported-output-kind, unsupported-surface, and un-honorable-scope fail-closed paths (R-ADAPT-5).",
      ],
      contractDigest: null,
    },
  });

export const FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS: HarnessCapabilityDescriptor[] = [
  CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
  CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR,
  PI_HARNESS_CAPABILITY_DESCRIPTOR,
];
