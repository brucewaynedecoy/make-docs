import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyInstallPlan, planInstall } from "../src/install";
import { defaultSelections } from "../src/profile";
import { createExecutionContext } from "../src/operations/context";
import { invokeOperation } from "../src/operations/registry";
import { PERFORMANCE_EVIDENCE_RULES } from "../src/operations/performance-evidence";
import type { ResourceListOperationOutput, ResourceReadOperationOutput } from "../src/operations/resource/ops";
import { TEMPLATE_ROOT } from "../src/utils";

const roots: string[] = [];
const repoRoot = path.resolve(TEMPLATE_ROOT, "..", "..", "..");
const resources = [
  {
    type: "contract",
    directory: "contracts",
    name: "performance-evidence-governance.md",
    uri: "make-docs://system/contract/performance-evidence-governance.md",
  },
  {
    type: "reference",
    directory: "references",
    name: "performance-evidence.md",
    uri: "make-docs://system/reference/performance-evidence.md",
  },
  {
    type: "prompt",
    directory: "prompts",
    name: "performance-coverage.prompt.md",
    uri: "make-docs://system/prompt/performance-coverage.prompt.md",
  },
  {
    type: "template",
    directory: "templates",
    name: "performance-evidence-profile.md",
    uri: "make-docs://system/template/performance-evidence-profile.md",
  },
] as const;
const workflowMembership = {
  contracts: [resources[0].uri],
  references: [resources[1].uri],
  prompts: [resources[2].uri],
  templates: [resources[3].uri],
};
const routerCases = ["designs", "plans", "prd", "work"].flatMap(directory =>
  ["AGENTS.md", "CLAUDE.md"].map(name => [`docs/${directory}/${name}`, directory, name] as const),
);
const lifecycleProjectionPaths = [
  ".make-docs/system/prompts/coverage-pass-testing-uat.prompt.md",
  ".make-docs/system/references/execution-workflow.md",
  ".make-docs/system/references/lifecycle.md",
  ".make-docs/system/references/planning-workflow.md",
  ".make-docs/system/references/prd-change-management.md",
  ".make-docs/system/templates/design.md",
  ".make-docs/system/templates/plan-overview.md",
  ".make-docs/system/templates/work-phase.md",
] as const;
const lifecycleFixturePath = path.join(
  repoRoot,
  "packages/cli/tests/fixtures/performance-evidence/lifecycle-cases.md",
);

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("Performance Evidence resource delivery", () => {
  it("keeps four identities in one catalog workflow and preserves projection bytes", () => {
    const catalogPath = ".make-docs/system-resources.catalog.json";
    const upstreamCatalog = readFileSync(path.join(repoRoot, "packages/docs/template", catalogPath));
    expect(readFileSync(path.join(TEMPLATE_ROOT, catalogPath))).toEqual(upstreamCatalog);
    expect(readFileSync(path.join(repoRoot, catalogPath))).toEqual(upstreamCatalog);

    const catalog = JSON.parse(upstreamCatalog.toString("utf8"));
    const workflow = catalog.systemWorkflows.find((candidate: { id?: string }) => candidate.id === "performance-evidence");
    expect(workflow).toMatchObject({ id: "performance-evidence", ...workflowMembership });
    expect(Object.values(workflowMembership).flat()).toEqual(resources.map(resource => resource.uri));
    expect(new Set(Object.values(workflowMembership).flat()).size).toBe(4);

    for (const resource of resources) {
      const local = `.make-docs/system/${resource.directory}/${resource.name}`;
      const upstream = readFileSync(path.join(repoRoot, "packages/docs/template", local));
      expect(readFileSync(path.join(TEMPLATE_ROOT, local))).toEqual(upstream);
      expect(readFileSync(path.join(repoRoot, local))).toEqual(upstream);
    }
  });

  it.each([
    { selected: false, expectedOrigin: "installed-machine" },
    { selected: true, expectedOrigin: "installed-machine" },
  ])("resolves offline with local projection selected: $selected", async ({ selected, expectedOrigin }) => {
    const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-performance-resources-"));
    const storeRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-performance-store-"));
    roots.push(root, storeRoot);
    const previousStoreHome = process.env.MAKE_DOCS_HOME;
    process.env.MAKE_DOCS_HOME = storeRoot;
    try {
      const selections = defaultSelections();
      selections.resourceProjection = selected ? ["contract", "reference", "prompt", "template"] : [];
      const plan = await planInstall({ targetDir: root, selections, existingManifest: null });
      const applied = applyInstallPlan({ targetDir: root, plan, existingManifest: null });
      const context = createExecutionContext({ surface: "test", cwd: root });
      const listed = (await invokeOperation("resource.list", { targetRoot: root }, context)).value as unknown as ResourceListOperationOutput;

      for (const resource of resources) {
        const local = `.make-docs/system/${resource.directory}/${resource.name}`;
        const expectedBytes = readFileSync(path.join(TEMPLATE_ROOT, local));
        const entry = listed.resources.find(candidate => candidate.uri === resource.uri);
        expect(entry?.result.ok).toBe(true);
        if (entry?.result.ok) {
          expect(entry.result.value.identity.type).toBe(resource.type);
          expect(entry.result.value.identity.uri).toBe(resource.uri);
        }

        const read = (await invokeOperation(
          "resource.read",
          { uri: resource.uri, targetRoot: root },
          context,
        )).value as unknown as ResourceReadOperationOutput;
        expect(read.resource.identity.type).toBe(resource.type);
        expect(read.resource.identity.uri).toBe(resource.uri);
        expect(read.resource.origin).toBe(expectedOrigin);
        expect(Buffer.from(read.resource.content.data, "base64")).toEqual(expectedBytes);
        expect(existsSync(path.join(root, local))).toBe(selected);
      }

      const rerun = await planInstall({
        targetDir: root,
        selections,
        existingManifest: applied.manifest,
        operation: "setup.sync",
      });
      expect(rerun.actions.every(action => action.type === "noop")).toBe(true);
    } finally {
      if (previousStoreHome === undefined) delete process.env.MAKE_DOCS_HOME;
      else process.env.MAKE_DOCS_HOME = previousStoreHome;
    }
  });

  it.each(routerCases)("keeps the %s pointer thin and paired", (relativePath, directory, name) => {
    const upstream = readFileSync(path.join(repoRoot, "packages/docs/template/docs", directory, name), "utf8");
    expect(readFileSync(path.join(TEMPLATE_ROOT, "docs", directory, name), "utf8")).toBe(upstream);
    expect(readFileSync(path.join(repoRoot, relativePath), "utf8")).toBe(upstream);
    expect(upstream).toContain("When a performance candidate exists, use the `performance-evidence` catalog workflow.");
    expect(upstream).toContain("make-docs://system/contract/performance-evidence-governance.md");
    expect(upstream).toContain("make-docs://system/prompt/performance-coverage.prompt.md");
    expect(upstream).toContain("make-docs://system/template/performance-evidence-profile.md");
    expect(upstream).toContain("Do not load the prompt or template otherwise.");
  });

  it("keeps the shared coverage and work pointers bounded to lifecycle fields", () => {
    const coverage = readFileSync(
      path.join(TEMPLATE_ROOT, ".make-docs/system/prompts/coverage-pass-testing-uat.prompt.md"),
      "utf8",
    );
    const workPhase = readFileSync(
      path.join(TEMPLATE_ROOT, ".make-docs/system/templates/work-phase.md"),
      "utf8",
    );
    for (const body of [coverage, workPhase]) {
      expect(body).toContain("Base maintenance action");
      expect(body).toContain("Performance applicability");
      expect(body).toContain("Canonical `PERF-###` profile link or `none`");
      expect(body).toContain("Finite evidence budget and stop-rule reference or `not-applicable`");
      expect(body).toContain("Outcome and evidence handoff or `none`");
      expect(body).not.toContain("## Assign One Target Class And Owner");
      expect(body).not.toContain("## Define Comparable Evidence");
    }
  });

  it("keeps P3 lifecycle surfaces upstream-first and thin", () => {
    for (const relativePath of lifecycleProjectionPaths) {
      const upstream = readFileSync(path.join(repoRoot, "packages/docs/template", relativePath));
      expect(readFileSync(path.join(TEMPLATE_ROOT, relativePath))).toEqual(upstream);
      expect(readFileSync(path.join(repoRoot, relativePath))).toEqual(upstream);
    }

    const lifecycle = readFileSync(
      path.join(TEMPLATE_ROOT, ".make-docs/system/references/lifecycle.md"),
      "utf8",
    );
    for (const lifecyclePoint of [
      "Design",
      "Plan",
      "PRD",
      "Work backlog",
      "Implementation",
      "Coverage",
      "Closeout",
      "Release / publish",
    ]) {
      expect(lifecycle).toContain(`| ${lifecyclePoint} |`);
    }
    expect(lifecycle).toContain("the only detailed policy source");
    expect(lifecycle).toContain("proves recording only");
  });

  it("covers target classes, outcomes, gates, reuse, expiry, and proof separation with documentation fixtures", () => {
    const fixture = readFileSync(lifecycleFixturePath, "utf8");

    for (const targetClass of [
      "hard-product-requirement",
      "engineering-guardrail",
      "characterization-baseline",
      "experiment-or-stretch",
      "deferred-required-outcome",
      "unsupported-assumption",
    ]) {
      expect(fixture).toContain(`\`${targetClass}\``);
    }
    for (const outcome of ["pass", "fail", "revise", "blocked", "waived"]) {
      expect(fixture).toContain(`\`${outcome}\``);
    }
    for (const requiredCase of [
      "Expired result",
      "Non-comparable result",
      "Missing or invalid result",
      "Adjacent-mode evidence",
      "Unchanged reuse",
      "Affected-only rerun",
      "Budget exhausted",
      "First requalification execution",
      "Repeated requalification execution",
    ]) {
      expect(fixture).toContain(`| ${requiredCase} |`);
    }
    for (const packetField of [
      "Environment",
      "Workload and fixture",
      "Instrument and measurement",
      "Correctness precondition",
      "Finite budget",
      "Fingerprint",
      "Reuse rule",
      "Stop rule",
      "Evidence destinations",
    ]) {
      expect(fixture).toContain(`| ${packetField} |`);
    }
    for (const promotionField of [
      "Source",
      "Comparability",
      "Normal variance",
      "Measurement resolution",
      "Protected-outcome rationale",
      "Trade-offs",
      "Owner approval",
      "Superseding lineage",
    ]) {
      expect(fixture).toContain(`| ${promotionField} |`);
    }
    for (const resultField of [
      "Identity",
      "Exact profile binding",
      "Build",
      "Fingerprint",
      "Environment",
      "Workload",
      "Raw evidence",
      "Analyzed evidence",
      "Observed distribution",
      "Uncertainty",
      "Exclusions",
      "Budget ledger",
      "Outcome",
      "Findings",
      "Owner or reviewer disposition",
      "Scope limit",
      "Expiry",
      "Later-result link",
    ]) {
      expect(fixture).toContain(`| ${resultField} |`);
    }
    expect(fixture).toContain("Task completion does not close it.");
    expect(fixture).toContain("A Store receipt proves recording only.");
    expect(fixture).toContain("Performance Testing remains separate from Automated Implementation Testing");
    expect(fixture).toContain("Do not retroactively fail a completed phase.");
    expect(fixture).toContain("PRD 18 conflict stop");
  });

  it("keeps the contract as the only reusable policy authority", () => {
    const bodies = new Map(
      resources.map(resource => [
        resource.type,
        readFileSync(
          path.join(TEMPLATE_ROOT, `.make-docs/system/${resource.directory}/${resource.name}`),
          "utf8",
        ),
      ]),
    );
    expect(bodies.get("contract")).toContain("This is the sole reusable policy source for Make Docs performance evidence.");
    expect(bodies.get("reference")).toContain("The [Performance Evidence Governance Contract](../contracts/performance-evidence-governance.md) owns the rules.");
    expect(bodies.get("prompt")).toContain("Use the contract as the only reusable policy source.");
    expect(bodies.get("template")).not.toContain("This is the sole reusable policy source");
    expect(workflowMembership.contracts).toHaveLength(1);
  });

  it("ships the canonical agent method and every stable rule mapping", () => {
    const contractPath = ".make-docs/system/contracts/performance-evidence-governance.md";
    const referencePath = ".make-docs/system/references/performance-evidence.md";
    const contract = readFileSync(path.join(TEMPLATE_ROOT, contractPath), "utf8");
    const reference = readFileSync(path.join(TEMPLATE_ROOT, referencePath), "utf8");

    expect(contract).toContain("### Agent method");
    expect(contract).toContain("State whether the deterministic operation ran.");
    expect(contract).toContain("evidence, observation, conclusion, limit, and next action");
    expect(contract).toContain("It does not create a benchmark runner, daemon, retry service, or hidden state change.");
    expect(reference).toContain("## Use The Validation Twin");
    expect(reference).toContain("The agent must say whether the deterministic operation ran.");
    for (const rule of PERFORMANCE_EVIDENCE_RULES) {
      expect(contract).toContain(`\`${rule.id}\``);
      expect(contract).toContain(`\`${rule.diagnosticCode}\``);
    }
  });
});
