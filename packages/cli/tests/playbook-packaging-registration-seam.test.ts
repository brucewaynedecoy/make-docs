/**
 * W18 R8 P4 Stage 1 coverage: the marketplace and registration seam.
 *
 * - t1 (R-MKT-1, R-CAP-2): registration and marketplace files are generated
 *   INTO the distributable per the target's descriptor registration model,
 *   and the entry content is harness-usable (no Make Docs `<user-home>`
 *   marker survives into the generated file).
 * - t2 (R-MKT-1): a user's global marketplace surface is never auto-mutated
 *   without explicit global scope AND the named
 *   `global-marketplace-registration` approval; the default is generate but
 *   do not install, enforced by the writer's marketplace protection guard.
 * - t3 (R-MKT-2, R-SCOPE-1): the auto-registration opt-in is a documented,
 *   additive, off-by-default seam whose configuration home is the global
 *   store (`settings.marketplaceAutoRegistration`); packaging only READS the
 *   key, and even a granted opt-in yields generate-only with the withhold
 *   reasons declared — no auto-registration behavior ships enabled pending
 *   the W18 R9 evidence bar.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createManifest, writeManifest } from "../src/manifest";
import {
  CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
  createPlaybookPackagePlan,
  FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
  GLOBAL_MARKETPLACE_REGISTRATION_APPROVAL,
  globalMarketplaceProtectionStops,
  MARKETPLACE_AUTO_REGISTRATION_CONFIG_HOME,
  MARKETPLACE_AUTO_REGISTRATION_CONFIG_KEY,
  readMarketplaceAutoRegistrationOptIn,
  resolveMarketplaceRegistrationSeam,
  validateHarnessCapabilityDescriptor,
  writePlaybookPackageOutputs,
} from "../src/operations";
import type {
  HarnessCapabilityDescriptor,
  PackageSurfaceResolution,
} from "../src/operations";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { createEmptySystemAssetManifestState } from "../src/system-assets";
import { cleanupTempDir, createTempDir } from "./helpers";

const SUPPORT_EVIDENCE_REF =
  "docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md";
const CODEX_PLUGIN_PRECONDITIONS = {
  "harness-supported": "satisfied",
  "project-trusted": "satisfied",
  "symlink-or-copy-mirror": "satisfied",
} as const;

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

function canonicalAbsolutePath(root: string, canonicalPath: string): string {
  return path.isAbsolute(canonicalPath) ? canonicalPath : path.join(root, canonicalPath);
}

function writeMakeDocsManifest(root: string): void {
  writeManifest(
    root,
    createManifest(
      { name: "@brucewaynedecoy/make-docs", version: "0.0.0-test" },
      resolveInstallProfile(defaultSelections()),
      {},
      [],
      createEmptySystemAssetManifestState(),
      "playbook-packaging-seam-test",
    ),
  );
}

function writePlaybook(root: string, persona: string, slug: string, title: string): void {
  writeFile(
    root,
    `docs/assets/playbooks/${persona}/${slug}.md`,
    [
      "---",
      `title: ${title}`,
      "kind: playbook",
      "status: accepted",
      `persona: ${persona}`,
      "stack: run",
      `summary: ${title} summary.`,
      "---",
      "",
      `# ${title}`,
      "",
      "## Purpose",
      "",
      "Use this playbook when the matching workflow goal is active.",
      "",
      "## Inputs and Authority",
      "",
      "- User request.",
      "",
      "## Procedure",
      "",
      "1. Follow the documented steps in order.",
      "",
      "## Gates and Decisions",
      "",
      "- Stop when user review is required.",
      "",
      "## Assists",
      "",
      "- Assists are optional unless the playbook says otherwise.",
      "",
      "## Outputs and Handoff",
      "",
      "- Record the expected output.",
      "",
      "## Validation",
      "",
      "- Confirm the workflow completed.",
      "",
    ].join("\n"),
  );
}

describe("registration files per the descriptor registration model (t1, R-MKT-1)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("marketplace entries land inside the distributable and are harness-usable as written", () => {
    const root = createTempDir("make-docs-seam-registration-");
    const homeDir = createTempDir("make-docs-seam-home-");
    tempRoots.push(root, homeDir);
    writeMakeDocsManifest(root);
    writePlaybook(root, "user", "run-stack", "Run Stack");
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "global" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;

    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      homeDir,
      plan,
      write: true,
      marketplaceAutoRegistration: false,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });

    expect(result.status).toBe("written");
    // Generated per the Codex marketplace-entry registration model, into the
    // distributable — with the concrete global install location the entry
    // registers, lowered from the Make Docs `<user-home>` marker to `~` so
    // the file is usable as written (R-ADAPT-2, R-COMP-1).
    const marketplace = JSON.parse(readFileSync(
      path.join(canonicalAbsolutePath(root, result.canonicalPath), "registration/marketplace.json"),
      "utf8",
    )) as { plugins: Array<{ id: string; version: string; source: { type: string; path: string } }> };
    expect(marketplace.plugins[0]).toMatchObject({
      id: "run-stack",
      version: "0.1.0",
      source: { type: "path", path: "~/.codex/plugins/run-stack" },
    });
    expect(JSON.stringify(marketplace)).not.toContain("<user-home>");
    // The result records the generate-only decision with the would-install
    // location; neither marketplace surface was touched (R-MKT-1).
    expect(result.registration).toMatchObject({
      disposition: "generate-only",
      autoRegistrationOptIn: false,
      withheldBecause: ["auto-registration-opt-in-off"],
      files: [
        {
          generatedAt: "registration/marketplace.json",
          installAt: ".agents/plugins/marketplace.json",
        },
      ],
    });
    expect(existsSync(path.join(root, ".agents/plugins/marketplace.json"))).toBe(false);
    expect(existsSync(path.join(homeDir, ".agents/plugins/marketplace.json"))).toBe(false);
  });

  test("descriptor registration models and registration files stay consistent", () => {
    // marketplace-entry without a registration file to generate is invalid.
    expect(() => validateHarnessCapabilityDescriptor({
      ...CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
      containers: CODEX_HARNESS_CAPABILITY_DESCRIPTOR.containers.map((container) => ({
        ...container,
        layout: { ...container.layout, registrationFiles: [] },
      })),
    })).toThrow("marketplace-entry registration model but no container declares a registration file");

    // direct-discovery has no registration surface, so declaring one fails.
    expect(() => validateHarnessCapabilityDescriptor({
      ...FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
      containers: [
        {
          ...FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR.containers[0]!,
          layout: {
            ...FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR.containers[0]!.layout,
            registrationFiles: [".agents/plugins/marketplace.json"],
          },
        },
        ...FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR.containers.slice(1),
      ],
    })).toThrow("direct discovery has no registration surface");
  });
});

describe("global marketplace protection (t2, R-MKT-1)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("no write path may land on the global marketplace without global scope and approval", () => {
    const targets = [".agents/plugins/marketplace.json"];

    // Global surface, no approval: stopped regardless of scope.
    expect(globalMarketplaceProtectionStops({
      registrationInstallTargets: targets,
      plannedWritePaths: ["<user-home>/.agents/plugins/marketplace.json"],
      scope: "global",
      globalApprovalGranted: false,
    })).toEqual([
      expect.objectContaining({
        reason: "manual-review-required",
        message: expect.stringContaining(GLOBAL_MARKETPLACE_REGISTRATION_APPROVAL),
      }),
    ]);

    // Approval without explicit global scope is still not enough (R-MKT-1
    // requires BOTH an explicit global scope and approval).
    expect(globalMarketplaceProtectionStops({
      registrationInstallTargets: targets,
      plannedWritePaths: ["<user-home>/.agents/plugins/marketplace.json"],
      scope: "project",
      globalApprovalGranted: true,
    })).toHaveLength(1);

    // Explicit global scope plus the named approval satisfies R-MKT-1.
    expect(globalMarketplaceProtectionStops({
      registrationInstallTargets: targets,
      plannedWritePaths: ["<user-home>/.agents/plugins/marketplace.json"],
      scope: "global",
      globalApprovalGranted: true,
    })).toEqual([]);

    // A project-local registration surface still needs the named approval.
    expect(globalMarketplaceProtectionStops({
      registrationInstallTargets: targets,
      plannedWritePaths: [".agents/plugins/marketplace.json"],
      scope: "project",
      globalApprovalGranted: false,
    })).toHaveLength(1);

    // The distributable's own generated copy never trips the guard.
    expect(globalMarketplaceProtectionStops({
      registrationInstallTargets: targets,
      plannedWritePaths: [
        ".make-docs/agentics/plugins/run-stack/registration/marketplace.json",
        ".codex/plugins/run-stack",
      ],
      scope: "project",
      globalApprovalGranted: false,
    })).toEqual([]);
  });

  test("the writer fails closed before any write that would mutate the global marketplace", () => {
    const root = createTempDir("make-docs-seam-guard-");
    const homeDir = createTempDir("make-docs-seam-guard-home-");
    tempRoots.push(root, homeDir);
    writeMakeDocsManifest(root);
    writePlaybook(root, "user", "run-stack", "Run Stack");

    // A hostile/misdeclared descriptor whose exposure placement IS the global
    // marketplace file: the guard must stop the write even though every
    // shipped descriptor keeps registration files inside the distributable.
    const hostileDescriptor: HarnessCapabilityDescriptor = {
      ...FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
      registration: {
        kind: "marketplace-entry",
        description: "Fixture marketplace registration for the protection guard test.",
        autoRegister: false,
      },
      containers: [
        {
          ...FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR.containers[0]!,
          layout: {
            ...FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR.containers[0]!.layout,
            placements: [
              {
                surface: "native",
                scope: "global",
                pathTemplate: "<user-home>/.agents/plugins/marketplace.json",
              },
            ],
            registrationFiles: [".agents/plugins/marketplace.json"],
          },
        },
      ],
    };
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: { harness: "future-harness", outputKind: "plugin", surface: "native", scope: "global" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      descriptors: [hostileDescriptor],
    }).plan;
    const surfaceResolution: PackageSurfaceResolution = {
      status: "ready",
      harnessId: "future-harness",
      outputKind: "plugin",
      requestedSurface: "native",
      surface: "native",
      scope: "global",
      path: "<user-home>/.agents/plugins/marketplace.json",
      exposureMode: "symlink",
      fallbackExposureMode: "copy-mirror",
      fallbackUsed: false,
      preconditions: [],
      lifecycleRules: [],
      conformanceRequirements: [],
      stops: [],
    };

    const dryRun = writePlaybookPackageOutputs({
      repoRoot: root,
      homeDir,
      plan,
      surfaceResolution,
      descriptors: [hostileDescriptor],
      marketplaceAutoRegistration: false,
    });
    expect(dryRun.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: "manual-review-required",
        message: expect.stringContaining("global marketplace surface"),
      }),
    ]));
    expect(() => writePlaybookPackageOutputs({
      repoRoot: root,
      homeDir,
      plan,
      surfaceResolution,
      descriptors: [hostileDescriptor],
      marketplaceAutoRegistration: false,
      write: true,
    })).toThrow("Playbook package write stopped");
    expect(existsSync(path.join(homeDir, ".agents/plugins/marketplace.json"))).toBe(false);
  });
});

describe("the config-gated auto-registration opt-in seam (t3, R-MKT-2)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("the seam reads the documented global-store key and an absent key means off", () => {
    // The store dependency is recorded as a named key + home, never a schema
    // definition (R-SCOPE-1): the key already lives in the store's own
    // GlobalConfigSettings.
    expect(MARKETPLACE_AUTO_REGISTRATION_CONFIG_KEY).toBe("settings.marketplaceAutoRegistration");
    expect(MARKETPLACE_AUTO_REGISTRATION_CONFIG_HOME).toContain("runtime-and-global-store");

    const storeRoot = createTempDir("make-docs-seam-store-");
    tempRoots.push(storeRoot);
    // Absent config file: off by default.
    expect(readMarketplaceAutoRegistrationOptIn({ storeRoot })).toBe(false);
    // Config present without the key: still off.
    writeFileSync(
      path.join(storeRoot, "config.json"),
      JSON.stringify({ schemaVersion: 1, settings: { selfUpdate: "prompt" } }),
      "utf8",
    );
    expect(readMarketplaceAutoRegistrationOptIn({ storeRoot })).toBe(false);
    // Explicit opt-in through the store surface.
    writeFileSync(
      path.join(storeRoot, "config.json"),
      JSON.stringify({
        schemaVersion: 1,
        settings: { selfUpdate: "prompt", marketplaceAutoRegistration: true },
      }),
      "utf8",
    );
    expect(readMarketplaceAutoRegistrationOptIn({ storeRoot })).toBe(true);
  });

  test("the seam decision is generate-only for every gating combination", () => {
    const files = [
      { generatedAt: "registration/marketplace.json", installAt: ".agents/plugins/marketplace.json" },
    ];

    // Off (the shipping default): the only withhold reason is the opt-in.
    expect(resolveMarketplaceRegistrationSeam({
      scope: "global",
      autoRegistrationOptIn: false,
      globalApprovalGranted: true,
      files,
    })).toMatchObject({
      disposition: "generate-only",
      withheldBecause: ["auto-registration-opt-in-off"],
    });

    // Opt-in on, but without global scope or approval: R-MKT-1 gating is
    // named explicitly, and the behavior itself stays unshipped.
    expect(resolveMarketplaceRegistrationSeam({
      scope: "project",
      autoRegistrationOptIn: true,
      globalApprovalGranted: false,
      files,
    }).withheldBecause).toEqual([
      "scope-not-global",
      "global-approval-missing",
      "auto-registration-unshipped-pending-conformance",
    ]);

    // Even the fully granted combination ships generate-only: the R-MKT-2
    // behavior is recognized but gated on the W18 R9 conformance evidence
    // bar; no auto-registration behavior ships enabled.
    const granted = resolveMarketplaceRegistrationSeam({
      scope: "global",
      autoRegistrationOptIn: true,
      globalApprovalGranted: true,
      files,
    });
    expect(granted.disposition).toBe("generate-only");
    expect(granted.withheldBecause).toEqual(["auto-registration-unshipped-pending-conformance"]);
    expect(granted.configKey).toBe(MARKETPLACE_AUTO_REGISTRATION_CONFIG_KEY);
  });

  test("a granted opt-in still never mutates a marketplace surface end to end", () => {
    const root = createTempDir("make-docs-seam-optin-");
    const homeDir = createTempDir("make-docs-seam-optin-home-");
    tempRoots.push(root, homeDir);
    writeMakeDocsManifest(root);
    writePlaybook(root, "user", "run-stack", "Run Stack");
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "global" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;

    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      homeDir,
      plan,
      write: true,
      marketplaceAutoRegistration: true,
      globalRegistrationApproved: true,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });

    expect(result.status).toBe("written");
    expect(result.registration.disposition).toBe("generate-only");
    expect(result.registration.autoRegistrationOptIn).toBe(true);
    expect(result.registration.withheldBecause).toEqual([
      "auto-registration-unshipped-pending-conformance",
    ]);
    // The plugin folder exposure exists; the marketplace files do not.
    expect(existsSync(path.join(homeDir, ".codex/plugins/run-stack"))).toBe(true);
    expect(existsSync(path.join(homeDir, ".agents/plugins/marketplace.json"))).toBe(false);
    expect(existsSync(path.join(root, ".agents/plugins/marketplace.json"))).toBe(false);
    // The generated registration record documents the seam.
    const registration = JSON.parse(readFileSync(
      path.join(canonicalAbsolutePath(root, result.canonicalPath), ".make-docs/registration.json"),
      "utf8",
    )) as { autoRegister: boolean; optInSeam: { configKey: string; default: string } };
    expect(registration.autoRegister).toBe(false);
    expect(registration.optInSeam).toMatchObject({
      configKey: MARKETPLACE_AUTO_REGISTRATION_CONFIG_KEY,
      default: "off",
    });
  });
});
