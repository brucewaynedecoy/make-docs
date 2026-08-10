import { describe, expect, test } from "vitest";
import {
  FIRST_PARTY_WORKFLOW_BUNDLES,
  resolvePluginSubstrate,
  validatePluginArtifactDefinition,
  validatePluginPackageBoundary,
  validatePluginSupportClaim,
  validateWorkflowBundleCatalog,
  type PluginArtifactDefinition,
} from "../src/plugin-substrate";
import type { PluginPackageBoundary } from "../src/types";

function packageBoundary(
  overrides: Partial<PluginPackageBoundary> = {},
): PluginPackageBoundary {
  return {
    pluginPayloads: "deferred",
    pluginManifests: "deferred",
    nativeExposures: "deferred",
    generatedAdapters: "deferred",
    conformanceLabRecords: "excluded",
    generatedLocalRunArtifacts: "excluded",
    unreviewedGeneratedOutputs: "excluded",
    decisionEvidence: [
      "docs/prd/30-plugin-substrate-and-workflow-bundles.md",
    ],
    ...overrides,
  };
}

function pluginDefinition(
  overrides: Partial<PluginArtifactDefinition> = {},
): PluginArtifactDefinition {
  return {
    pluginId: "product-development-review",
    title: "Product Development Review",
    summary: "Review product-development work through a supported harness plugin.",
    status: "provisional",
    sourceManifest: {
      manifestId: "first-party-plugins",
      displayName: "Make Docs first-party plugins",
      source: "built-in",
    },
    ref: "package:first-party/product-development-review",
    version: "0.0.0-test",
    digest: "sha256:plugin-digest",
    provenance: "make-docs first-party plugin fixture",
    trustPolicy: {
      kind: "first-party",
      description: "Bundled make-docs fixture.",
    },
    supportedHarnesses: ["codex", "claude-code"],
    supportStatus: "provisional",
    workflowBundles: FIRST_PARTY_WORKFLOW_BUNDLES,
    packageBoundary: packageBoundary(),
    payload: [
      {
        installPath: "plugin.json",
        content: "{\"name\":\"product-development-review\"}\n",
      },
    ],
    ...overrides,
  };
}

describe("workflow bundle metadata", () => {
  test("declares first-party bundle candidates with explicit boundaries", () => {
    const bundles = validateWorkflowBundleCatalog(FIRST_PARTY_WORKFLOW_BUNDLES);

    expect(bundles.map((bundle) => bundle.family)).toEqual([
      "idea-brainstorm",
      "scaffold",
      "change-request-iterate",
      "use-run",
    ]);
    expect(
      bundles.map((bundle) => [bundle.bundleId, bundle.exposureBoundary]),
    ).toEqual([
      ["idea-brainstorm", "non-maintainer-request-capture"],
      ["scaffold", "maintainer-only"],
      ["change-request-iterate", "non-maintainer-guided-change"],
      ["use-run", "end-user-run-stack"],
    ]);
    expect(bundles.every((bundle) => bundle.packageBoundary.pluginPayloads === "deferred")).toBe(true);
    expect(bundles.every((bundle) => bundle.supportClaims.every((claim) => claim.wording === "provisional"))).toBe(true);
  });

  test("keeps Use and Run on generic Run Playbook without requiring plugin packaging", () => {
    const useRun = FIRST_PARTY_WORKFLOW_BUNDLES.find(
      (bundle) => bundle.bundleId === "use-run",
    );

    expect(useRun?.runPlaybook).toMatchObject({
      mode: "generic-run-playbook",
      orchestrator: "w18-r4-run-playbook",
      storageContract: "docs/assets/playbooks",
      pluginPackagingRequired: false,
    });
  });

  test("fails closed when request-capture bundles authorize mutation", () => {
    const [idea] = FIRST_PARTY_WORKFLOW_BUNDLES;

    expect(() => validateWorkflowBundleCatalog([{
      ...idea!,
      authorizedMutation: true,
    }])).toThrow("must capture requests without authorized mutation");
  });

  test("rejects package boundaries that ship conformance or local run artifacts", () => {
    expect(() => validatePluginPackageBoundary(packageBoundary({
      conformanceLabRecords: "included" as PluginPackageBoundary["conformanceLabRecords"],
    }))).toThrow("conformanceLabRecords must be one of: excluded");
    expect(() => validatePluginPackageBoundary(packageBoundary({
      decisionEvidence: [],
    }))).toThrow("decisionEvidence must include at least one entry");
  });

  test("keeps support wording provisional until exact tuple evidence exists", () => {
    expect(() => validatePluginSupportClaim({
      claimId: "codex-plugin",
      bundleId: "idea-brainstorm",
      surface: "plugin",
      status: "implementation-validated",
      wording: "validated",
      evidenceRefs: [],
    })).toThrow("needs validation evidence");

    expect(validatePluginSupportClaim({
      claimId: "codex-plugin",
      bundleId: "idea-brainstorm",
      surface: "plugin",
      status: "provisional",
      wording: "provisional",
      evidenceRefs: [],
    }).wording).toBe("provisional");
  });

  test("carries bundle and package metadata on plugin substrate records", () => {
    const definition = validatePluginArtifactDefinition(pluginDefinition());
    const resolution = resolvePluginSubstrate(definition, { scope: "project" });

    expect(resolution.plugin.workflowBundles?.map((bundle) => bundle.bundleId)).toEqual([
      "idea-brainstorm",
      "scaffold",
      "change-request-iterate",
      "use-run",
    ]);
    expect(resolution.plugin.packageBoundary?.pluginManifests).toBe("deferred");
  });
});
