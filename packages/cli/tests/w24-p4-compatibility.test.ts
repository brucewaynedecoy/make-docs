import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { callMakeDocsMcpTool, listMakeDocsMcpTools } from "../src/mcp/tools";
import { HARNESS_CALLER_IDENTITY_ENV } from "../src/harness-access/contract";
import { OperationWriteDeniedError, serializeOperationError } from "../src/operations/context";
import { getOperation } from "../src/operations/registry";

const roots: string[] = [];
function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "w24-p4-access-"));
  roots.push(root);
  mkdirSync(path.join(root, "docs"));
  writeFileSync(path.join(root, "docs/note.md"), "Portable project knowledge.\n");
  vi.stubEnv("MAKE_DOCS_HOME", path.join(root, "unconfigured-store"));
  vi.stubEnv(HARNESS_CALLER_IDENTITY_ENV, "");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-03T19:00:00.000Z"));
  return root;
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("W24 R0 P4 shared dispatch and access", () => {
  test.each([
    ["make_docs_config_read", ["core", "setup"], (root: string) => ({ targetDir: root })],
    ["make_docs_project_persona_list", ["core", "workflow"], (root: string) => ({ targetRoot: root })],
    ["make_docs_project_path_hygiene_validate", ["setup", "quality"], (root: string) => ({ targetRoot: root, scope: "content", paths: ["docs/note.md"] })],
    ["make_docs_work_backlog_snapshot", ["backlog"], (root: string) => ({ targetRoot: root })],
  ] as const)("%s gives the same Store-free result in each assigned profile", async (name, profiles, args) => {
    const root = fixture();
    const expected = await callMakeDocsMcpTool(name, args(root), { profile: "all" });
    for (const profile of profiles) expect(await callMakeDocsMcpTool(name, args(root), { profile })).toEqual(expected);
    expect(existsSync(path.join(root, "unconfigured-store"))).toBe(false);
    expect(readFileSync(path.join(root, "docs/note.md"), "utf8")).toBe("Portable project knowledge.\n");
  });

  test("all and setup share the real Store-free write handler and dry-run gate", async () => {
    const root = fixture();
    const args = { targetRoot: root, scope: "content", paths: ["docs/note.md"], apply: true, dryRun: true };
    const definition = getOperation("project.path-hygiene.repair");
    const handler = vi.spyOn(definition, "handler");
    for (const profile of ["setup", "all"] as const) {
      await expect(callMakeDocsMcpTool("make_docs_project_path_hygiene_repair", args, { profile })).rejects.toBeInstanceOf(OperationWriteDeniedError);
    }
    expect(handler).not.toHaveBeenCalled();
    const allowed = await callMakeDocsMcpTool("make_docs_project_path_hygiene_repair", { ...args, allowWrite: true }, { profile: "setup" });
    expect(await callMakeDocsMcpTool("make_docs_project_path_hygiene_repair", { ...args, allowWrite: true }, { profile: "all" })).toEqual(allowed);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(getOperation("project.path-hygiene.repair").handler).toBe(handler);
    expect(readFileSync(path.join(root, "docs/note.md"), "utf8")).toBe("Portable project knowledge.\n");
    expect(existsSync(path.join(root, "unconfigured-store"))).toBe(false);
  });

  test.each([
    ["make_docs_resource_ensure", "resource.ensure", "setup", (root: string) => ({ targetRoot: root, uri: "make-docs://system/contract/human-experience-contract.md", approvals: ["resource-projection-write"] })],
    ["make_docs_lifecycle_start", "lifecycle.start", "workflow", (root: string) => ({ repoRoot: root, lifecycleStage: "implementation" })],
    ["make_docs_work_backlog_cache_write", "work.backlog-cache.write", "backlog", (root: string) => ({ targetRoot: root })],
  ] as const)("%s keeps write permission separate from Store admission", async (name, id, profile, makeArgs) => {
    const root = fixture();
    const args = makeArgs(root);
    const handler = vi.spyOn(getOperation(id), "handler");
    const errors: unknown[] = [];
    for (const selected of [profile, "all"] as const) {
      await expect(callMakeDocsMcpTool(name, args, { profile: selected })).rejects.toBeInstanceOf(OperationWriteDeniedError);
      try { await callMakeDocsMcpTool(name, { ...args, allowWrite: true }, { profile: selected }); throw new Error("Expected access denial"); }
      catch (error) { errors.push(serializeOperationError(error)); }
    }
    expect(errors[0]).toEqual(errors[1]);
    if (id === "work.backlog-cache.write") {
      // Its large report schema is enforced before Store admission.
      expect(errors[0]).toMatchObject({ code: "operation-error", message: expect.stringContaining("Invalid input") });
      const snapshot = (await callMakeDocsMcpTool("make_docs_work_backlog_snapshot", { targetRoot: root }, { profile })).result;
      const denials: unknown[] = [];
      for (const selected of [profile, "all"] as const) {
        try { await callMakeDocsMcpTool("make_docs_work_backlog_cache_lookup", { targetRoot: root, snapshot }, { profile: selected }); }
        catch (error) { denials.push(serializeOperationError(error)); }
      }
      expect(denials).toHaveLength(2);
      expect(denials[0]).toEqual(denials[1]);
      expect(denials[0]).toMatchObject({ code: "store-not-configured", operation: "work.backlog-cache.lookup" });
    } else expect(errors[0]).toMatchObject({ code: "store-not-configured", operation: id });
    expect(handler).not.toHaveBeenCalled();
    expect(existsSync(path.join(root, "unconfigured-store"))).toBe(false);
    // A Store denial stops that probe. Independent reads can still complete.
    expect(await callMakeDocsMcpTool("make_docs_project_persona_list", { targetRoot: root }, { profile: "core" })).toEqual(await callMakeDocsMcpTool("make_docs_project_persona_list", { targetRoot: root }, { profile: "all" }));
  });

  test("each shared descriptor still targets the same registered operation handler", () => {
    for (const tool of listMakeDocsMcpTools()) {
      if (!tool.operation) continue;
      const definition = getOperation(tool.operation);
      for (const profile of [...tool.mcp!.profiles, "all"] as const) {
        const member = listMakeDocsMcpTools(undefined, { profile }).find((candidate) => candidate.name === tool.name)!;
        expect(member.operation).toBe(definition.id);
        expect(getOperation(member.operation!).handler).toBe(definition.handler);
        expect(member.inputSchema).toBe(tool.inputSchema);
        expect(member.access).toEqual(tool.access);
        expect(member.description).toBe(tool.description);
      }
    }
  });
});
