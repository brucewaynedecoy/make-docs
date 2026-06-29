import type {
  PluginConformanceScenarioCandidate,
  PluginPackageBoundary,
  PluginSupportClaim,
  WorkflowBundleMetadata,
} from "../types";
import { validateWorkflowBundleCatalog } from "./validation";

const BOUNDARY_EVIDENCE = [
  "docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md",
];

function deferredPackageBoundary(): PluginPackageBoundary {
  return {
    pluginPayloads: "deferred",
    pluginManifests: "deferred",
    nativeExposures: "deferred",
    generatedAdapters: "deferred",
    conformanceLabRecords: "excluded",
    generatedLocalRunArtifacts: "excluded",
    unreviewedGeneratedOutputs: "excluded",
    decisionEvidence: [...BOUNDARY_EVIDENCE],
  };
}

function provisionalSupportClaim(input: {
  claimId: string;
  bundleId: string;
  surface: PluginSupportClaim["surface"];
  playbookRef?: string;
}): PluginSupportClaim {
  return {
    claimId: input.claimId,
    bundleId: input.bundleId,
    ...(input.playbookRef ? { playbookRef: input.playbookRef } : {}),
    surface: input.surface,
    status: "provisional",
    wording: "provisional",
    evidenceRefs: [],
  };
}

function conformanceCandidate(input: {
  scenarioId: string;
  claimId: string;
  bundleId: string;
  surface: PluginSupportClaim["surface"];
  playbookRef?: string;
}): PluginConformanceScenarioCandidate {
  return {
    scenarioId: input.scenarioId,
    claimId: input.claimId,
    status: "candidate",
    required: true,
    dimensions: {
      pluginId: "make-docs",
      bundleId: input.bundleId,
      ...(input.playbookRef ? { playbookRef: input.playbookRef } : {}),
      harness: "codex",
      modelProvider: "unverified",
      runtime: "typescript-cli",
      surface: input.surface,
    },
    evidenceRefs: [
      "docs/prd/20-revise-agent-harness-model-conformance-lab.md",
      "docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md",
    ],
  };
}

export const FIRST_PARTY_WORKFLOW_BUNDLES: WorkflowBundleMetadata[] =
  validateWorkflowBundleCatalog([
    {
      bundleId: "idea-brainstorm",
      title: "Idea and Brainstorm",
      summary:
        "Capture and refine an idea or request into lifecycle-ready input without silently mutating build-stack artifacts.",
      family: "idea-brainstorm",
      audiences: ["non-maintainer"],
      exposureBoundary: "non-maintainer-request-capture",
      mutationAuthority: "request-capture-only",
      requestCapture: true,
      authorizedMutation: false,
      supportClaims: [
        provisionalSupportClaim({
          claimId: "idea-brainstorm-plugin",
          bundleId: "idea-brainstorm",
          surface: "plugin",
        }),
      ],
      conformanceScenarios: [
        conformanceCandidate({
          scenarioId: "idea-brainstorm-codex-plugin",
          claimId: "idea-brainstorm-plugin",
          bundleId: "idea-brainstorm",
          surface: "plugin",
        }),
      ],
      packageBoundary: deferredPackageBoundary(),
    },
    {
      bundleId: "scaffold",
      title: "Scaffold",
      summary:
        "Create or expand a Make Docs documentation system from accepted inputs for maintainer-facing setup work.",
      family: "scaffold",
      audiences: ["maintainer"],
      exposureBoundary: "maintainer-only",
      mutationAuthority: "plan-first",
      requestCapture: true,
      authorizedMutation: false,
      supportClaims: [
        provisionalSupportClaim({
          claimId: "scaffold-plugin",
          bundleId: "scaffold",
          surface: "plugin",
        }),
      ],
      conformanceScenarios: [
        conformanceCandidate({
          scenarioId: "scaffold-codex-plugin",
          claimId: "scaffold-plugin",
          bundleId: "scaffold",
          surface: "plugin",
        }),
      ],
      packageBoundary: deferredPackageBoundary(),
    },
    {
      bundleId: "change-request-iterate",
      title: "Change Request and Iterate",
      summary:
        "Capture a bounded change request and route authorized changes through lifecycle contracts with explicit gates.",
      family: "change-request-iterate",
      audiences: ["maintainer", "non-maintainer"],
      exposureBoundary: "non-maintainer-guided-change",
      mutationAuthority: "authorized-mutation",
      requestCapture: true,
      authorizedMutation: true,
      supportClaims: [
        provisionalSupportClaim({
          claimId: "change-request-iterate-plugin",
          bundleId: "change-request-iterate",
          surface: "plugin",
        }),
      ],
      conformanceScenarios: [
        conformanceCandidate({
          scenarioId: "change-request-iterate-codex-plugin",
          claimId: "change-request-iterate-plugin",
          bundleId: "change-request-iterate",
          surface: "plugin",
        }),
      ],
      packageBoundary: deferredPackageBoundary(),
    },
    {
      bundleId: "use-run",
      title: "Use and Run",
      summary:
        "Expose run-stack workflows through generic Run Playbook without redefining playbook storage or requiring plugin packaging.",
      family: "use-run",
      audiences: ["end-user"],
      exposureBoundary: "end-user-run-stack",
      mutationAuthority: "run-stack",
      requestCapture: false,
      authorizedMutation: false,
      runPlaybook: {
        mode: "generic-run-playbook",
        orchestrator: "w18-r4-run-playbook",
        storageContract: "docs/assets/playbooks",
        pluginPackagingRequired: false,
        playbookRefs: [],
      },
      supportClaims: [
        provisionalSupportClaim({
          claimId: "use-run-generic-run-playbook",
          bundleId: "use-run",
          surface: "run-playbook",
        }),
      ],
      conformanceScenarios: [
        conformanceCandidate({
          scenarioId: "use-run-codex-run-playbook",
          claimId: "use-run-generic-run-playbook",
          bundleId: "use-run",
          surface: "run-playbook",
          playbookRef: "user/run-stack",
        }),
      ],
      packageBoundary: deferredPackageBoundary(),
    },
  ]);
