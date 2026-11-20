import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, test, vi } from "vitest";
import { runCli } from "../src/cli";
import { readInstallationManifest, withInstallationDatabase } from "../src/store/installation-state";
import { hashText } from "../src/utils";
import { setupFollowUpAction } from "../src/migration";

// W28 R0 P8: a setup sync must not turn "no resource choice saved" into "no resources chosen".
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));

type SetupResult = { status: string; nextAction?: string | null; project?: { actions?: Array<{ path: string; action: string }> } };

async function inStore(store: string, args: string[]): Promise<SetupResult> {
  const prior = process.env.MAKE_DOCS_HOME;
  process.env.MAKE_DOCS_HOME = store;
  const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  try {
    await runCli(args);
    return JSON.parse(output.mock.calls.map(call => String(call[0])).join("")) as SetupResult;
  } finally {
    output.mockRestore();
    if (prior === undefined) delete process.env.MAKE_DOCS_HOME;
    else process.env.MAKE_DOCS_HOME = prior;
  }
}

test("a sync of an older install with no saved resource choice keeps that choice unset", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-w28-setup-"));
  roots.push(root);
  const project = path.join(root, "project");
  const store = path.join(root, "store");
  mkdirSync(project);
  const harness = ["--codex-method", "none", "--claude-code-method", "none", "--no-github-copilot"];
  const install = await inStore(store, [
    "setup", "--target", project, "--yes", ...harness, "--no-skills", "--project-resources", "none", "--json",
  ]);
  expect(install.status).toBe("complete");

  // Simulate an install recorded by an older package that saved no resource choice.
  const configPath = path.join(project, ".make-docs", "config.yaml");
  writeFileSync(configPath, readFileSync(configPath, "utf8").replace(/^\s*resourceProjection:.*\n(?:\s+- .*\n)*/m, ""));
  const currentVersion = (JSON.parse(readFileSync(path.join(__dirname, "..", "package.json"), "utf8")) as { version: string }).version;
  expect(readFileSync(configPath, "utf8")).not.toContain("resourceProjection");
  const manifest = readInstallationManifest(project, store)!;
  const older = JSON.parse(JSON.stringify(manifest).replaceAll(currentVersion, "2.0.7")) as typeof manifest;
  delete (older.selections as { resourceProjection?: unknown }).resourceProjection;
  withInstallationDatabase(project, db => {
    const row = db.prepare("SELECT checkout_id FROM installation_checkouts WHERE project_id=?").get(manifest.projectId!) as { checkout_id: string };
    db.prepare("UPDATE installation_ledgers SET manifest_json=? WHERE checkout_id=?").run(JSON.stringify(older), row.checkout_id);
  }, { storeRoot: store });

  const sync = await inStore(store, ["setup", "--target", project, "--yes", ...harness, "--json"]);
  expect(sync.status, JSON.stringify(sync)).toBe("complete");
  expect(readInstallationManifest(project, store)!.selections.resourceProjection).toBeUndefined();

  const repeat = await inStore(store, ["setup", "--target", project, "--dry-run", ...harness, "--json"]);
  const removals = (repeat.project?.actions ?? []).filter(action => action.action !== "noop");
  expect(removals, JSON.stringify(removals.slice(0, 5))).toEqual([]);
});

test("a full setup sync names Skill changes it leaves to setup skills instead of reporting them as applied", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-w28-skills-"));
  roots.push(root);
  const project = path.join(root, "project");
  const store = path.join(root, "store");
  mkdirSync(project);
  const harness = ["--codex-method", "none", "--claude-code-method", "none", "--no-github-copilot"];
  const install = await inStore(store, [
    "setup", "--target", project, "--yes", ...harness, "--skill-scope", "project", "--selected-skills", "preflight",
    "--project-resources", "none", "--json",
  ]);
  expect(install.status, JSON.stringify(install)).toBe("complete");

  // Make one installed Skill file a clean, older managed copy, so the planner wants to update it.
  const manifest = readInstallationManifest(project, store)!;
  const skillPath = Object.keys(manifest.files).find(relativePath => relativePath.endsWith("preflight/SKILL.md") && relativePath.startsWith(".agents/"))!;
  expect(skillPath).toBeTruthy();
  const olderBytes = "# Older preflight\n";
  writeFileSync(path.join(project, skillPath), olderBytes);
  const older = structuredClone(manifest);
  older.files[skillPath] = { ...older.files[skillPath]!, hash: hashText(olderBytes) };
  withInstallationDatabase(project, db => {
    const row = db.prepare("SELECT checkout_id FROM installation_checkouts WHERE project_id=?").get(manifest.projectId!) as { checkout_id: string };
    db.prepare("UPDATE installation_ledgers SET manifest_json=? WHERE checkout_id=?").run(JSON.stringify(older), row.checkout_id);
  }, { storeRoot: store });

  const dry = await inStore(store, ["setup", "--target", project, "--dry-run", ...harness, "--json"]);
  expect(dry.project?.actions?.find(action => action.path === skillPath)?.action).toBe("skip");
  expect(dry.nextAction).toContain(`\`make-docs setup skills --target ${JSON.stringify(project)}\``);

  const sync = await inStore(store, ["setup", "--target", project, "--yes", ...harness, "--json"]);
  expect(sync.status, JSON.stringify(sync)).toBe("complete");
  expect(sync.nextAction).toContain(`\`make-docs setup skills --target ${JSON.stringify(project)}\``);
  expect(readFileSync(path.join(project, skillPath), "utf8")).toBe(olderBytes);
});

test("the applied setup result names both a blocked platform and the Skill route when both remain", () => {
  expect(setupFollowUpAction("Add the MCP entry, then run setup again.", 3)).toBe(
    "Add the MCP entry, then run setup again. Full setup leaves 3 Skill file changes to `make-docs setup skills`. Run it to apply them.",
  );
  expect(setupFollowUpAction("Add the MCP entry, then run setup again.", 0)).toBe("Add the MCP entry, then run setup again.");
  expect(setupFollowUpAction(undefined, 1)).toBe("Full setup leaves 1 Skill file change to `make-docs setup skills`. Run it to apply that change.");
  expect(setupFollowUpAction(null, 0)).toBeNull();
  // The target is quoted the way other make-docs next actions quote it, which also works in Windows shells.
  expect(setupFollowUpAction(undefined, 2, "/work/my project")).toContain('`make-docs setup skills --target "/work/my project"`');
  expect(setupFollowUpAction(undefined, 2, "C:\\My Project")).toContain('`make-docs setup skills --target "C:\\\\My Project"`');
});
