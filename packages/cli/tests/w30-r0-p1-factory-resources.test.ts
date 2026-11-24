import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyInstallPlan, planInstall } from "../src/install";
import { defaultSelections } from "../src/profile";
import { createExecutionContext } from "../src/operations/context";
import { invokeOperation } from "../src/operations/registry";
import type { ResourceListOperationOutput, ResourceReadOperationOutput } from "../src/operations/resource/ops";
import { TEMPLATE_ROOT } from "../src/utils";

const roots: string[] = [];
const repoRoot = path.resolve(TEMPLATE_ROOT, "..", "..", "..");
const upstreamRoot = path.join(repoRoot, "packages/docs/template");

const resources = [
  { uri: "make-docs://system/contract/factory-contract.md", local: ".make-docs/system/contracts/factory-contract.md" },
  { uri: "make-docs://system/reference/factory/workflows/build-then-review.md", local: ".make-docs/system/references/factory/workflows/build-then-review.md" },
  { uri: "make-docs://system/reference/factory/workflows/lead-and-specialists.md", local: ".make-docs/system/references/factory/workflows/lead-and-specialists.md" },
  { uri: "make-docs://system/reference/factory/workflows/staged-backlog.md", local: ".make-docs/system/references/factory/workflows/staged-backlog.md" },
] as const;
const workflowTypes = resources.slice(1);

// R-FACTORY-1, R-WORK-RESOURCE-4: no example, default, or required step names a particular tool.
// Git appears only in the PRD-stated backup rule "in a folder without git".
// Match product names only, so common words such as "screen", "teams", or "email" stay usable.
// Names that are never ordinary English words match in any letter case.
const PRODUCT_NAMES = /\b(whatsapp|imessage|gmail|tmux|zellij|crontab|launchd|systemd|claude|anthropic|openai|chatgpt|gpt-?\d|github|gitlab|jira|trello|asana|kubernetes|ollama|vercel|jetbrains|vs ?code|vscode|iterm2?|windsurf|pushover|ntfy)\b/i;
// Brand names that are also ordinary words match only in their brand form.
const BRAND_FORMS = /\b(Slack|Discord|Telegram|Notion|Codex|Gemini|Copilot|Mistral|Llama|Microsoft Teams|Google Chat|Signal app|Linear app|Zoom app|Amazon Bedrock|Vertex AI|Cursor IDE|Zed editor|Warp terminal|GNU Screen)\b/;

const upstream = (local: string) => readFileSync(path.join(upstreamRoot, local), "utf8");
const section = (body: string, heading: string) => {
  const start = body.indexOf(`\n${heading}\n`);
  expect(start, heading).toBeGreaterThan(-1);
  const level = heading.match(/^#+/)![0].length;
  const rest = body.slice(start + heading.length + 2);
  const next = rest.search(new RegExp(`\\n#{1,${level}} `));
  return next === -1 ? rest : rest.slice(0, next);
};
const tableRows = (text: string) =>
  text.split("\n").filter((line) => line.startsWith("| ") && !line.startsWith("| ---")).slice(1);

afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe("W30 R0 P1 factory resources", () => {
  it("keeps the upstream, bundled, and dogfood bytes identical (A6)", () => {
    for (const local of [...resources.map((resource) => resource.local), ".make-docs/system-resources.catalog.json"]) {
      const bytes = readFileSync(path.join(upstreamRoot, local));
      expect(readFileSync(path.join(TEMPLATE_ROOT, local)), local).toEqual(bytes);
      expect(readFileSync(path.join(repoRoot, local)), local).toEqual(bytes);
    }
  });

  it("lists each resource once in the catalog, with no new resource type (A8)", () => {
    const catalog = JSON.parse(upstream(".make-docs/system-resources.catalog.json")) as {
      resourceTypes: { type: string; include: string[] }[];
      mcpResources: { uri: string; profiles: string[] }[];
    };
    expect(catalog.resourceTypes.map((entry) => entry.type)).toEqual(["contract", "prompt", "reference", "template"]);
    expect(catalog.resourceTypes.find((entry) => entry.type === "reference")?.include).toContain("factory/workflows/*.md");
    for (const { uri } of resources) {
      // W30 R0 P3 added each factory resource to the new factory profile.
      expect(catalog.mcpResources.filter((entry) => entry.uri === uri).map((entry) => entry.profiles), uri).toEqual([["workflow", "factory"]]);
    }
    for (const { local } of resources) {
      expect(local).not.toMatch(/playbook|protocol/i);
    }
  });

  it.each([false, true])("lists and reads each URI offline with local projection selected: %s", async (selected) => {
    const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-factory-resources-"));
    const storeRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-factory-store-"));
    roots.push(root, storeRoot);
    const previousStoreHome = process.env.MAKE_DOCS_HOME;
    process.env.MAKE_DOCS_HOME = storeRoot;
    try {
      const selections = defaultSelections();
      selections.resourceProjection = selected ? ["contract", "reference"] : [];
      const plan = await planInstall({ targetDir: root, selections, existingManifest: null });
      const applied = applyInstallPlan({ targetDir: root, plan, existingManifest: null });
      const context = createExecutionContext({ surface: "test", cwd: root });
      const listed = (await invokeOperation("resource.list", { targetRoot: root }, context)).value as unknown as ResourceListOperationOutput;
      for (const { uri, local } of resources) {
        const bytes = readFileSync(path.join(TEMPLATE_ROOT, local));
        expect(listed.resources.find((resource) => resource.uri === uri)?.result.ok, uri).toBe(true);
        const read = (await invokeOperation("resource.read", { uri, targetRoot: root }, context)).value as unknown as ResourceReadOperationOutput;
        expect(Buffer.from(read.resource.content.data, "base64")).toEqual(bytes);
        expect(existsSync(path.join(root, local)), local).toBe(selected);
        if (selected) {
          expect(readFileSync(path.join(root, local))).toEqual(bytes);
          expect(applied.manifest.resourceProjection?.resources[uri]?.uri).toBe(uri);
        }
      }
      const rerun = await planInstall({ targetDir: root, selections, existingManifest: applied.manifest, operation: "setup.sync" });
      expect(rerun.actions.every((action) => action.type === "noop")).toBe(true);
    } finally {
      if (previousStoreHome === undefined) delete process.env.MAKE_DOCS_HOME;
      else process.env.MAKE_DOCS_HOME = previousStoreHome;
    }
  });

  it("states the roles, capabilities, readiness states, floor, and rule catalog (A1, A2, A4)", () => {
    const contract = upstream(resources[0].local);
    const roles = tableRows(section(contract, "## Roles")).map((row) => row.split(" | ")[0].replace("| ", ""));
    expect(roles).toEqual(["Front desk", "Foreman", "Builder", "Reviewer"]);
    for (const field of ["`job`", "`capabilities`", "`returns`"]) {
      expect(section(contract, "### Custom Roles")).toContain(field);
    }

    const capabilities = tableRows(section(contract, "## Capability Catalog"));
    expect(capabilities.map((row) => row.match(/^\| `([a-z-]+)` \|/)?.[1])).toEqual([
      "read-write-files", "run-commands", "launch-agent", "wait-for-agent", "read-agent-result",
      "wake-on-schedule", "wake-on-event", "message-person", "receive-answer", "isolate-working-copy", "edit-code",
    ]);
    for (const row of capabilities) {
      const proof = row.split(" | ")[2]?.replace(/ \|$/, "") ?? "";
      expect(proof.length, row).toBeGreaterThan(20);
    }

    const states = tableRows(section(contract, "## Readiness")).map((row) => row.match(/^\| `([a-z]+)` \|/)?.[1]);
    expect(states).toEqual(["draft", "wired", "ready", "drifted"]);
    expect(section(contract, "### Escalation Floor").match(/^\d\. /gm)).toHaveLength(5);
    for (const heading of ["## Acceptance", "## Working Rules", "## Limits", "## Backups Outside Git", "### Optional Steps", "### Project-Owned Types"]) {
      expect(section(contract, heading).trim().length, heading).toBeGreaterThan(0);
    }
    expect(section(contract, "## Limits")).toContain("| Correction rounds before the foreman escalates | 3 |");
    expect(section(contract, "## Backups Outside Git")).toContain("older than 30 days");

    // A lost tool always drifts. Only a deliberate unbind returns a workflow to draft.
    const moves = section(contract, "## Readiness");
    expect(moves).toContain("A lost tool always moves the workflow to `drifted`");
    expect(moves).toContain("Only a deliberate unbind moves a workflow to `draft`. A lost tool never does.");
    expect(moves).not.toMatch(/loses its only tool/);

    // The smallest setup can reach `wired`: its one tool starts its own subagents.
    const smallest = section(contract, "## Smallest Setup");
    for (const id of ["`launch-agent`", "`wait-for-agent`", "`read-agent-result`"]) expect(smallest).toContain(id);

    // A name clash saves nothing and escalates; the shipped type is not used in its place.
    const projectTypes = section(contract, "### Project-Owned Types");
    expect(projectTypes).toContain("Setup saves nothing until the clash is fixed.");
    expect(projectTypes).toContain("floor event 4");
    expect(projectTypes).not.toContain("Until then, setup uses the shipped type.");

    // Claim timing and takeover follow the work queue rules.
    const claims = section(contract, "## Claims and Lifecycle Runs");
    expect(claims).toContain("Only the holder of a live claim starts or updates the unit's assignments.");
    expect(claims).toContain("wake interval must be shorter than the claim time limit");
    expect(claims).toContain("`make-docs work release`");
    expect(section(contract, "## Parts")).toContain("`work_release`");

    const rules = tableRows(section(contract, "## Rule Catalog"));
    const ids = rules.map((row) => row.match(/^\| `([a-z-]+)` \|/)?.[1]);
    expect(new Set(ids).size).toBe(rules.length);
    for (const id of [
      "grant-for-merge-deploy", "smallest-setup", "custom-role-new-name", "setup-summary", "rerun-same-workflow",
      "machine-records-shared", "no-self-authority", "completion-returns-control", "no-wake-said",
      "backlog-review-handoff", "status-human-first", "lost-tool-drifts", "wake-before-expiry",
    ]) {
      expect(ids, id).toContain(id);
    }
    const checkOf = (id: string) => rules.find((row) => row.startsWith(`| \`${id}\` |`))!.split(" | ")[3];
    expect(checkOf("escalation-floor")).toMatch(/^Built in W30 R0 P5 T11/);
    expect(checkOf("check-handles-before-takeover")).toMatch(/^Built in W29 R0 P4 T4/);
    expect(checkOf("limits-saved")).toMatch(/^Built in W30 R0 P2 T7/);
    for (const row of rules) {
      const check = row.split(" | ")[3] ?? "";
      // A built check, or a check that is planned and not built yet, names its phase and task.
      // A contract-only row gives a reason. "Built in" is the word of W30 R0 P6 T14.
      expect(check, row).toMatch(/^((Built|Planned) in W\d+ R\d+ P\d+ T\d+[ :,]|Contract-only\. \S)/);
      expect(row, row).toMatch(/\]\(#[a-z-]+\)/);
    }
  });

  it("gives each workflow type the standard sections and three examples (A5)", () => {
    const fields = section(upstream(resources[0].local), "### Workflow Type Fields");
    const headings = [...fields.matchAll(/^\| `(## [^`]+)` \|/gm)].map((match) => match[1]);
    expect(headings).toHaveLength(9);
    for (const { local } of workflowTypes) {
      const body = upstream(local);
      for (const heading of headings) expect(body, `${local} ${heading}`).toContain(`\n${heading}\n`);
      expect(body).toContain("make-docs://system/contract/factory-contract.md");
      const examples = section(body, "## Examples");
      expect(examples.match(/^- (Software|Personal|Business): /gm), local).toEqual(["- Software: ", "- Personal: ", "- Business: "]);
      // The limit is checked before defects go back for correction.
      const steps = section(body, "## Steps");
      const limitCheck = steps.indexOf("first checks the limit");
      const sendBack = steps.search(/sends (the defects|each defect) back|sends each defect to/);
      if (sendBack !== -1) {
        expect(limitCheck, local).toBeGreaterThan(-1);
        expect(limitCheck, local).toBeLessThan(sendBack);
      }
    }
  });

  it("names no particular tool and uses upper-case task IDs (A3)", () => {
    for (const { local } of resources) {
      const body = upstream(local);
      expect(body.match(PRODUCT_NAMES)?.[0], local).toBeUndefined();
      expect(body.match(BRAND_FORMS)?.[0], local).toBeUndefined();
      expect(body, local).not.toMatch(/\bt\d+\b/);
    }
  });
});
