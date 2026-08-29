import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyInstallPlan, planInstall } from "../src/install";
import { createExecutionContext } from "../src/operations/context";
import { invokeOperation, listAdmittedOperations } from "../src/operations/registry";
import { defaultSelections } from "../src/profile";
import { runCli, validateMakeDocsCliArgv } from "../src/cli";
import { loadManifest, MANIFEST_RELATIVE_PATH } from "../src/manifest";
import { runUninstallCommand } from "../src/uninstall";
import { readPackageFile } from "../src/utils";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("W19 R1 P4 projection and lifecycle", () => {
  it("accepts none, all, and individual explicit projection selections", () => {
    for (const value of ["none", "all", "contract,prompt", "reference"]) {
      expect(() => validateMakeDocsCliArgv([
        "setup", "--yes", "--project-resources", value,
      ])).not.toThrow();
    }
    expect(() => validateMakeDocsCliArgv([
      "setup", "--yes", "--project-resources", "unknown",
    ])).toThrow("accepts contract, prompt, reference, template");
  });

  it("projects only selected resources, preserves router bytes, and proves an unchanged no-write rerun", async () => {
    const targetDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-"));
    roots.push(targetDir);
    writeFileSync(path.join(targetDir, "AGENTS.md"), "user bytes\n", "utf8");
    const selections = defaultSelections();
    selections.resourceProjection = ["prompt"];

    const plan = await planInstall({ targetDir, selections, existingManifest: null });
    const applied = applyInstallPlan({ targetDir, plan, existingManifest: null });
    expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8").startsWith("user bytes\n")).toBe(true);
    expect(applied.manifest.resourceProjection?.selectedTypes).toEqual(["prompt"]);
    expect(Object.values(applied.manifest.resourceProjection?.resources ?? {})).not.toHaveLength(0);
    expect(Object.values(applied.manifest.resourceProjection?.resources ?? {}).every((entry) =>
      entry.type === "prompt" && entry.ownershipClass === "managed-projection" && entry.provenanceState === "verified",
    )).toBe(true);
    expect(existsSync(path.join(targetDir, ".make-docs/system/prompts"))).toBe(true);
    expect(existsSync(path.join(targetDir, ".make-docs/system/references"))).toBe(false);

    const manifestPath = path.join(targetDir, MANIFEST_RELATIVE_PATH);
    const beforeManifest = readFileSync(manifestPath, "utf8");
    const rerun = await planInstall({ targetDir, selections, existingManifest: applied.manifest });
    const result = applyInstallPlan({ targetDir, plan: rerun, existingManifest: applied.manifest });
    expect(rerun.actions.every((action) => action.type === "noop")).toBe(true);
    expect(result.mutationApplied).toBe(false);
    expect(result.receipt).toBeUndefined();
    expect(result.manifest.projectId).toBe(applied.manifest.projectId);
    expect(readFileSync(manifestPath, "utf8")).toBe(beforeManifest);
  });

  it("installs the four thin routers from the upstream template authority", async () => {
    const targetDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-router-source-"));
    roots.push(targetDir);
    const installed = await installProjection(targetDir, []);
    for (const relativePath of ["AGENTS.md", "CLAUDE.md", "docs/AGENTS.md", "docs/CLAUDE.md"]) {
      expect(readFileSync(path.join(targetDir, relativePath), "utf8")).toBe(
        readPackageFile(relativePath),
      );
      expect(installed.manifest.files[relativePath]).toMatchObject({
        ownershipClass: "managed-block",
      });
    }
  });

  it("invalidates a reviewed plan when its manifest authority changes", async () => {
    const targetDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-stale-"));
    roots.push(targetDir);
    const selections = defaultSelections();
    selections.resourceProjection = [];
    const initialPlan = await planInstall({ targetDir, selections, existingManifest: null });
    const applied = applyInstallPlan({ targetDir, plan: initialPlan, existingManifest: null });
    const reviewedPlan = await planInstall({ targetDir, selections, existingManifest: applied.manifest });
    const manifestPath = path.join(targetDir, MANIFEST_RELATIVE_PATH);
    const changed = { ...applied.manifest, updatedAt: "2099-01-01T00:00:00.000Z" };
    writeFileSync(manifestPath, `${JSON.stringify(changed, null, 2)}\n`, "utf8");
    expect(() => applyInstallPlan({
      targetDir,
      plan: reviewedPlan,
      existingManifest: applied.manifest,
    })).toThrow("reviewed lifecycle plan is stale");
  });

  it("classifies ownership from proved source roles", async () => {
    const targetDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-owner-"));
    roots.push(targetDir);
    const legacyPlan = await planInstall({
      targetDir,
      selections: defaultSelections(),
      existingManifest: null,
    });
    expect(legacyPlan.desiredFiles["docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md"]?.ownershipClass)
      .toBe("managed-snapshot");
    expect(legacyPlan.desiredFiles["docs/AGENTS.md"]?.ownershipClass).toBe("managed-block");

    const projectedSelections = defaultSelections();
    projectedSelections.resourceProjection = ["prompt"];
    const projectedPlan = await planInstall({
      targetDir,
      selections: projectedSelections,
      existingManifest: null,
    });
    const projectedFile = Object.values(projectedPlan.desiredFiles).find((entry) =>
      entry.sourceId.startsWith("resource:"),
    );
    expect(projectedFile?.ownershipClass).toBe("managed-projection");
  });

  it("rejects inconsistent or unsafe projection manifest identities", async () => {
    const targetDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-manifest-"));
    roots.push(targetDir);
    const selections = defaultSelections();
    selections.resourceProjection = ["prompt"];
    const plan = await planInstall({ targetDir, selections, existingManifest: null });
    const applied = applyInstallPlan({ targetDir, plan, existingManifest: null });
    const manifestPath = path.join(targetDir, MANIFEST_RELATIVE_PATH);
    const [uri, entry] = Object.entries(applied.manifest.resourceProjection!.resources)[0]!;
    const invalidCases = [
      { label: "map key", mutate: (copy: typeof applied.manifest) => { copy.resourceProjection!.resources[uri]!.uri = `${uri}-other`; } },
      {
        label: "canonical URI",
        mutate: (copy: typeof applied.manifest) => {
          const resource = copy.resourceProjection!.resources[uri]!;
          const wrongUri = `${uri}-wrong`;
          delete copy.resourceProjection!.resources[uri];
          copy.resourceProjection!.resources[wrongUri] = { ...resource, uri: wrongUri };
        },
      },
      { label: "must equal selections.resourceProjection", mutate: (copy: typeof applied.manifest) => { copy.selections.resourceProjection = []; } },
      { label: "must be selected", mutate: (copy: typeof applied.manifest) => { copy.resourceProjection!.resources[uri]!.type = "reference"; } },
      { label: "provider identity", mutate: (copy: typeof applied.manifest) => { copy.resourceProjection!.resources[uri]!.providerPackage = "wrong-package"; } },
      { label: "provider identity", mutate: (copy: typeof applied.manifest) => { copy.resourceProjection!.resources[uri]!.providerVersion = "wrong-version"; } },
      { label: "provider identity", mutate: (copy: typeof applied.manifest) => { copy.resourceProjection!.resources[uri]!.providerImmutableRef = "wrong-ref"; } },
      { label: "canonical relative", mutate: (copy: typeof applied.manifest) => { copy.resourceProjection!.resources[uri]!.resourcePath = "../escape.md"; } },
      { label: "managedDestination", mutate: (copy: typeof applied.manifest) => { copy.resourceProjection!.resources[uri]!.managedDestination = ".make-docs/system/references/wrong.md"; } },
      { label: "sha256", mutate: (copy: typeof applied.manifest) => { copy.resourceProjection!.resources[uri]!.sourceDigest = "bad"; } },
    ];
    expect(entry.sourceDigest).toMatch(/^[a-f0-9]{64}$/);
    for (const invalidCase of invalidCases) {
      const copy = structuredClone(applied.manifest);
      invalidCase.mutate(copy);
      writeFileSync(manifestPath, `${JSON.stringify(copy, null, 2)}\n`, "utf8");
      expect(() => loadManifest(targetDir), invalidCase.label).toThrow(invalidCase.label);
    }
  });

  it("fails closed on managed-file and managed-parent symbolic links", async () => {
    const selections = defaultSelections();
    selections.resourceProjection = ["prompt"];

    const matchingDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-symlink-match-"));
    const matchingOutside = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-symlink-match-out-"));
    roots.push(matchingDir, matchingOutside);
    const matchingOutsideFile = path.join(matchingOutside, "AGENTS.md");
    const matchingBytes = readPackageFile("AGENTS.md");
    writeFileSync(matchingOutsideFile, matchingBytes, "utf8");
    symlinkSync(matchingOutsideFile, path.join(matchingDir, "AGENTS.md"));
    await expect(planInstall({
      targetDir: matchingDir,
      selections,
      existingManifest: null,
    })).rejects.toThrow("symbolic link");
    expect(readFileSync(matchingOutsideFile, "utf8")).toBe(matchingBytes);

    const danglingDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-symlink-dangling-"));
    const danglingOutside = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-symlink-dangling-out-"));
    roots.push(danglingDir, danglingOutside);
    const danglingTarget = path.join(danglingOutside, "missing.md");
    symlinkSync(danglingTarget, path.join(danglingDir, "CLAUDE.md"));
    await expect(planInstall({
      targetDir: danglingDir,
      selections,
      existingManifest: null,
    })).rejects.toThrow("symbolic link");
    expect(existsSync(danglingTarget)).toBe(false);

    const parentDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-symlink-parent-"));
    const parentOutside = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-symlink-parent-out-"));
    roots.push(parentDir, parentOutside);
    symlinkSync(parentOutside, path.join(parentDir, "docs"));
    await expect(planInstall({
      targetDir: parentDir,
      selections,
      existingManifest: null,
    })).rejects.toThrow("symbolic link");
    expect(existsSync(path.join(parentOutside, "AGENTS.md"))).toBe(false);

    const applyDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-symlink-apply-"));
    const applyOutside = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-symlink-apply-out-"));
    roots.push(applyDir, applyOutside);
    const reviewedPlan = await planInstall({
      targetDir: applyDir,
      selections,
      existingManifest: null,
    });
    symlinkSync(applyOutside, path.join(applyDir, "docs"));
    expect(() => applyInstallPlan({
      targetDir: applyDir,
      plan: reviewedPlan,
      existingManifest: null,
    })).toThrow("symbolic link");
    expect(existsSync(path.join(applyOutside, "AGENTS.md"))).toBe(false);
    expect(existsSync(path.join(applyDir, "AGENTS.md"))).toBe(false);

    const manifestParentDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-symlink-state-"));
    const manifestOutside = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-symlink-state-out-"));
    roots.push(manifestParentDir, manifestOutside);
    symlinkSync(manifestOutside, path.join(manifestParentDir, ".make-docs"));
    await expect(planInstall({
      targetDir: manifestParentDir,
      selections,
      existingManifest: null,
    })).rejects.toThrow("symbolic link");
    expect(existsSync(path.join(manifestOutside, "manifest.json"))).toBe(false);
  });

  it("rejects symlinked setup authority and existing outside project surfaces before reads or writes", async () => {
    const setupDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-cli-state-link-"));
    const setupOutside = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-cli-state-out-"));
    roots.push(setupDir, setupOutside);
    const outsideManifestPath = path.join(setupOutside, "manifest.json");
    const outsideManifestBytes = "outside manifest bytes that must not be parsed\n";
    writeFileSync(outsideManifestPath, outsideManifestBytes, "utf8");
    symlinkSync(setupOutside, path.join(setupDir, ".make-docs"));
    expect(() => loadManifest(setupDir)).toThrow("symbolic link");
    await expect(runCli(["setup", "--yes", "--target", setupDir])).rejects.toThrow(
      "symbolic link",
    );
    expect(readFileSync(outsideManifestPath, "utf8")).toBe(outsideManifestBytes);
    expect(existsSync(path.join(setupDir, "AGENTS.md"))).toBe(false);

    const surfaceDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-surface-link-"));
    const surfaceOutside = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-surface-out-"));
    roots.push(surfaceDir, surfaceOutside);
    await installProjection(surfaceDir, []);
    rmSync(path.join(surfaceDir, "docs"), { recursive: true, force: true });
    mkdirSync(path.join(surfaceOutside, "assets"), { recursive: true });
    writeFileSync(path.join(surfaceOutside, "AGENTS.md"), readPackageFile("docs/AGENTS.md"), "utf8");
    writeFileSync(path.join(surfaceOutside, "CLAUDE.md"), readPackageFile("docs/CLAUDE.md"), "utf8");
    const outsideSentinel = path.join(surfaceOutside, "assets", "sentinel.txt");
    writeFileSync(outsideSentinel, "outside surface bytes\n", "utf8");
    symlinkSync(surfaceOutside, path.join(surfaceDir, "docs"));
    await expect(invokeOperation(
      "project.surface.ensure",
      { surface: "assets", targetRoot: surfaceDir },
      createExecutionContext({ surface: "test", cwd: surfaceDir, writesAllowed: true }),
    )).rejects.toThrow("symbolic link");
    expect(readFileSync(outsideSentinel, "utf8")).toBe("outside surface bytes\n");
    expect(readFileSync(path.join(surfaceOutside, "AGENTS.md"), "utf8")).toBe(
      readPackageFile("docs/AGENTS.md"),
    );
    expect(readFileSync(path.join(surfaceOutside, "CLAUDE.md"), "utf8")).toBe(
      readPackageFile("docs/CLAUDE.md"),
    );
  });

  it("keeps projected resources safe during clean, modified, missing, and legacy updates", async () => {
    const cleanDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-update-clean-"));
    const modifiedDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-update-modified-"));
    const missingDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-update-missing-"));
    const legacyDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-update-legacy-"));
    roots.push(cleanDir, modifiedDir, missingDir, legacyDir);

    const clean = await installProjection(cleanDir, ["prompt"]);
    const cleanPath = firstProjectedPath(clean.manifest);
    const deselected = defaultSelections();
    deselected.resourceProjection = [];
    const deselectPlan = await planInstall({
      targetDir: cleanDir,
      selections: deselected,
      existingManifest: clean.manifest,
      operation: "setup.reconfigure",
    });
    expect(deselectPlan.actions).toContainEqual(expect.objectContaining({
      relativePath: cleanPath,
      type: "remove-managed",
    }));
    const deselectResult = applyInstallPlan({
      targetDir: cleanDir,
      plan: deselectPlan,
      existingManifest: clean.manifest,
    });
    expect(existsSync(path.join(cleanDir, cleanPath))).toBe(false);
    expect(deselectResult.mutationApplied).toBe(true);
    expect(deselectResult.receipt).toMatchObject({
      operation: "setup.reconfigure",
      projectId: clean.manifest.projectId,
      selectedResourceTypes: [],
      claims: { validated: false, accepted: false, published: false, released: false },
    });

    const modified = await installProjection(modifiedDir, ["prompt"]);
    const modifiedPath = firstProjectedPath(modified.manifest);
    writeFileSync(path.join(modifiedDir, modifiedPath), "local resource change\n", "utf8");
    const modifiedPlan = await planInstall({
      targetDir: modifiedDir,
      selections: deselected,
      existingManifest: modified.manifest,
      operation: "setup.reconfigure",
    });
    expect(modifiedPlan.stops).toContain(modifiedPath);
    expect(() => applyInstallPlan({
      targetDir: modifiedDir,
      plan: modifiedPlan,
      existingManifest: modified.manifest,
    })).toThrow("not trusted");
    expect(readFileSync(path.join(modifiedDir, modifiedPath), "utf8")).toBe("local resource change\n");

    const missing = await installProjection(missingDir, ["prompt"]);
    const missingPath = firstProjectedPath(missing.manifest);
    rmSync(path.join(missingDir, missingPath), { force: true });
    const selected = defaultSelections();
    selected.resourceProjection = ["prompt"];
    const restorePlan = await planInstall({
      targetDir: missingDir,
      selections: selected,
      existingManifest: missing.manifest,
      operation: "setup.sync",
    });
    expect(restorePlan.actions).toContainEqual(expect.objectContaining({
      relativePath: missingPath,
      type: "create",
    }));
    const restoreResult = applyInstallPlan({
      targetDir: missingDir,
      plan: restorePlan,
      existingManifest: missing.manifest,
    });
    expect(existsSync(path.join(missingDir, missingPath))).toBe(true);
    expect(restoreResult.mutationApplied).toBe(true);
    expect(restoreResult.receipt).toMatchObject({
      operation: "setup.sync",
      projectId: missing.manifest.projectId,
      selectedResourceTypes: ["prompt"],
      claims: { validated: false, accepted: false, published: false, released: false },
    });

    const legacy = await installProjection(legacyDir);
    const legacyPlan = await planInstall({
      targetDir: legacyDir,
      selections: defaultSelections(),
      existingManifest: legacy.manifest,
      operation: "setup.sync",
    });
    const legacyResult = applyInstallPlan({
      targetDir: legacyDir,
      plan: legacyPlan,
      existingManifest: legacy.manifest,
    });
    expect(legacyResult.mutationApplied).toBe(false);
    expect(legacyResult.receipt).toBeUndefined();
    expect(legacyResult.manifest.projectId).toBe(legacy.manifest.projectId);
  });

  it("keeps projected resources safe during uninstall and omits no-op receipts", async () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      for (const state of ["clean", "modified", "missing", "legacy"] as const) {
        const targetDir = mkdtempSync(path.join(os.tmpdir(), `make-docs-p4-uninstall-${state}-`));
        const homeDir = mkdtempSync(path.join(os.tmpdir(), `make-docs-p4-home-${state}-`));
        roots.push(targetDir, homeDir);
        const installed = state === "legacy"
          ? await installProjection(targetDir)
          : await installProjection(targetDir, ["prompt"]);
        const selectedPath = state === "legacy" ? null : firstProjectedPath(installed.manifest);
        if (state === "modified") {
          writeFileSync(path.join(targetDir, selectedPath!), "local resource change\n", "utf8");
        } else if (state === "missing") {
          rmSync(path.join(targetDir, selectedPath!), { force: true });
        }

        const result = await runUninstallCommand({
          targetDir,
          backup: false,
          permissions: "allow-all",
          homeDir,
        });
        expect(result.status).toBe("completed");
        if (result.status !== "completed") throw new Error("Expected completed uninstall.");
        expect(result.removedFiles.length).toBeGreaterThan(0);
        expect(result.storeHandling.status).toBe("preserved");
        expect(result.receipt).toMatchObject({
          operation: "setup.remove",
          projectId: installed.manifest.projectId,
          selectedResourceTypes: state === "legacy" ? [] : ["prompt"],
          claims: { validated: false, accepted: false, published: false, released: false },
        });
        expect(result.receipt?.receiptId).toMatch(/^sha256:[a-f0-9]{64}$/);
        expect(result.receipt?.outcomes.remove).toBe(result.removedFiles.length);
        if (state === "modified") {
          expect(readFileSync(path.join(targetDir, selectedPath!), "utf8")).toBe("local resource change\n");
        } else if (selectedPath) {
          expect(existsSync(path.join(targetDir, selectedPath))).toBe(false);
        }
      }

      const targetDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-uninstall-noop-"));
      const homeDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-home-noop-"));
      roots.push(targetDir, homeDir);
      const noOp = await runUninstallCommand({
        targetDir,
        backup: false,
        permissions: "allow-all",
        homeDir,
      });
      expect(noOp.status).toBe("completed");
      if (noOp.status !== "completed") throw new Error("Expected completed uninstall.");
      expect(noOp.removedFiles).toEqual([]);
      expect(noOp.prunedDirectories).toEqual([]);
      expect(noOp.receipt).toBeUndefined();
      expect(noOp.storeHandling.status).toBe("preserved");
    } finally {
      write.mockRestore();
    }
  });

  it("stops on malformed managed blocks and unsafe surface parents", async () => {
    const targetDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-stop-"));
    roots.push(targetDir);
    writeFileSync(path.join(targetDir, "AGENTS.md"), "<!-- make-docs:begin -->\nbroken\n", "utf8");
    const selections = defaultSelections();
    selections.resourceProjection = [];
    const plan = await planInstall({ targetDir, selections, existingManifest: null });
    expect(plan.stops).toContain("AGENTS.md");
    expect(() => applyInstallPlan({ targetDir, plan, existingManifest: null })).toThrow("not trusted");

    const cleanDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-surface-"));
    roots.push(cleanDir);
    const cleanPlan = await planInstall({ targetDir: cleanDir, selections, existingManifest: null });
    const clean = applyInstallPlan({ targetDir: cleanDir, plan: cleanPlan, existingManifest: null });
    rmSync(path.join(cleanDir, "docs"), { recursive: true, force: true });
    const outside = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-outside-"));
    roots.push(outside);
    symlinkSync(outside, path.join(cleanDir, "docs"));
    await expect(invokeOperation(
      "project.surface.ensure",
      { surface: "assets", targetRoot: cleanDir },
      createExecutionContext({ surface: "test", cwd: cleanDir, writesAllowed: true }),
    )).rejects.toThrow("symbolic link");
    expect(clean.manifest.files["AGENTS.md"]?.ownershipClass).toBe("managed-block");
  });

  it("activates the registry operation for CLI and derived MCP projection", () => {
    const operation = listAdmittedOperations().find((entry) => entry.id === "project.surface.ensure");
    expect(operation).toMatchObject({ status: "active", mutates: "write" });
    expect(operation?.cli.command).toBe("make-docs project surface ensure <archive|artifacts|assets>");
  });

  it("renders the structured project surface result through the CLI adapter", async () => {
    const targetDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-p4-cli-"));
    roots.push(targetDir);
    const selections = defaultSelections();
    selections.resourceProjection = [];
    const plan = await planInstall({ targetDir, selections, existingManifest: null });
    applyInstallPlan({ targetDir, plan, existingManifest: null });
    const cwd = vi.spyOn(process, "cwd").mockReturnValue(targetDir);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      await runCli(["project", "surface", "ensure", "assets"]);
      const rendered = stdout.mock.calls.map(([chunk]) => String(chunk)).join("");
      expect(rendered).toContain(`Target: ${targetDir}`);
      expect(rendered).toContain("Project surface: assets");
      expect(rendered).toContain("State: applied");
      expect(rendered).toContain("- create: docs/assets");
      expect(rendered).toMatch(/Receipt: sha256:[a-f0-9]{64}/);
      expect(rendered).toContain("Next: Run `make-docs setup --yes --dry-run`");

      stdout.mockClear();
      await runCli(["project", "--help"]);
      const help = stdout.mock.calls.map(([chunk]) => String(chunk)).join("");
      expect(help).toContain("The ensure command creates only the selected on-demand directory");
      expect(help).toContain("applied or unchanged state");
      expect(help).not.toContain("pending");

      stdout.mockClear();
      const unchanged = await invokeOperation(
        "project.surface.ensure",
        { surface: "assets", targetRoot: targetDir },
        createExecutionContext({ surface: "test", cwd: targetDir, writesAllowed: true }),
      );
      expect(unchanged.value).toMatchObject({
        dryRun: false,
        receipt: null,
        plan: {
          actions: expect.arrayContaining([
            expect.objectContaining({ type: "noop", relativePath: "docs/assets" }),
          ]),
        },
      });

      await runCli(["project", "surface", "ensure", "assets"]);
      const unchangedRendered = stdout.mock.calls.map(([chunk]) => String(chunk)).join("");
      expect(unchangedRendered).toContain("State: unchanged");
      expect(unchangedRendered).toContain("- preserve: docs/assets");
      expect(unchangedRendered).toContain("Receipt: none (no write)");
    } finally {
      stdout.mockRestore();
      cwd.mockRestore();
    }
  });
});

async function installProjection(
  targetDir: string,
  resourceProjection?: Array<"contract" | "prompt" | "reference" | "template">,
) {
  const selections = defaultSelections();
  if (resourceProjection !== undefined) selections.resourceProjection = resourceProjection;
  const plan = await planInstall({ targetDir, selections, existingManifest: null });
  return applyInstallPlan({ targetDir, plan, existingManifest: null });
}

function firstProjectedPath(manifest: NonNullable<ReturnType<typeof loadManifest>>): string {
  const resource = Object.values(manifest.resourceProjection?.resources ?? {})[0];
  if (!resource) throw new Error("Expected a selected projected resource.");
  return resource.managedDestination;
}
