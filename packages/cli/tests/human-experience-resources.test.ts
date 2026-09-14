import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyInstallPlan, planInstall } from "../src/install";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { getReferencePaths } from "../src/rules";
import { createExecutionContext } from "../src/operations/context";
import { invokeOperation } from "../src/operations/registry";
import type { ResourceListOperationOutput, ResourceReadOperationOutput } from "../src/operations/resource/ops";
import { TEMPLATE_ROOT } from "../src/utils";

const roots: string[] = [];
const repoRoot = path.resolve(TEMPLATE_ROOT, "..", "..", "..");
const resources = [
  ["contract", "contracts", "human-experience-contract.md"],
  ["reference", "references", "human-experience.md"],
] as const;
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe("Human Experience resource delivery", () => {
  it("keeps the upstream, generated, and dogfood resource bytes identical", () => {
    for (const [, directory, name] of resources) {
      const local = `.make-docs/system/${directory}/${name}`;
      const upstream = readFileSync(path.join(repoRoot, "packages/docs/template", local));
      expect(readFileSync(path.join(TEMPLATE_ROOT, local))).toEqual(upstream);
      expect(readFileSync(path.join(repoRoot, local))).toEqual(upstream);
    }
  });

  it("includes both shared resources even when the design capability is not selected", () => {
    const selections = defaultSelections();
    selections.capabilities.designs = false;
    const paths = getReferencePaths(resolveInstallProfile(selections));
    for (const [, dir, name] of resources) expect(paths).toContain(`.make-docs/system/${dir}/${name}`);
  });

  it.each([false, true])("lists and reads offline with local projection selected: %s", async selected => {
    const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-hx-resources-"));
    roots.push(root);
    const selections = defaultSelections();
    selections.resourceProjection = selected ? ["contract", "reference"] : [];
    const plan = await planInstall({ targetDir: root, selections, existingManifest: null });
    const applied = applyInstallPlan({ targetDir: root, plan, existingManifest: null });
    const context = createExecutionContext({ surface: "test", cwd: root });
    const listed = (await invokeOperation("resource.list", { targetRoot: root }, context)).value as unknown as ResourceListOperationOutput;
    for (const [type, directory, name] of resources) {
      const uri = `make-docs://system/${type}/${name}`;
      const local = `.make-docs/system/${directory}/${name}`;
      const bytes = readFileSync(path.join(TEMPLATE_ROOT, local));
      expect(listed.resources.find(r => r.uri === uri)?.result.ok).toBe(true);
      const read = (await invokeOperation("resource.read", { uri, targetRoot: root }, context)).value as unknown as ResourceReadOperationOutput;
      expect(Buffer.from(read.resource.content.data, "base64")).toEqual(bytes);
      expect(read.resource.origin).toBe(selected ? "managed-snapshot" : "installed-machine");
      expect(existsSync(path.join(root, local))).toBe(selected);
      if (selected) {
        expect(readFileSync(path.join(root, local))).toEqual(bytes);
        expect(applied.manifest.resourceProjection?.resources[uri]?.uri).toBe(uri);
      }
    }
    const rerun = await planInstall({ targetDir: root, selections, existingManifest: applied.manifest, operation: "setup.sync" });
    expect(rerun.actions.every(action => action.type === "noop")).toBe(true);
  });
});
