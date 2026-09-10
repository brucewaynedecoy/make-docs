import { realpathSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { repairProjectPathHygiene, validateProjectPathHygiene } from "../src/path-hygiene";
import { callMakeDocsMcpTool } from "../src/mcp/tools";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
let root: string;
beforeEach(() => { root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "path-hygiene-cli-"))); });
afterEach(() => { vi.restoreAllMocks(); rmSync(root, { recursive: true, force: true }); });
function put(file: string, text: string) { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), text); }
function cli(...args: string[]) {
  return spawnSync(process.execPath, ["--import", "tsx", "packages/cli/src/index.ts", "project", "path-hygiene", ...args, "--target", root], {
    cwd: repo, encoding: "utf8", env: { ...process.env, MAKE_DOCS_HOME: path.join(root, "absent-store") },
  });
}

it("checks custom scope, rejects incompatible inputs, and does not create state", () => {
  put("docs/bad.md", "/home/alice/file\n"); put("knowledge/good.md", "Portable.\n");
  expect(validateProjectPathHygiene({ projectRoot: root }).valid).toBe(false);
  expect(validateProjectPathHygiene({ projectRoot: root, paths: ["./knowledge/", "knowledge/good.md"] }).checkedFiles).toBe(1);
  for (const paths of [["../outside"], ["missing"], [".make-docs/state"], ["C:/outside"]]) expect(() => validateProjectPathHygiene({ projectRoot: root, paths })).toThrow();
  expect(() => validateProjectPathHygiene({ projectRoot: root, paths: ["docs"], scope: "managed" })).toThrow();
  expect(() => validateProjectPathHygiene({ projectRoot: root, manifestPath: "legacy.json", scope: "content" })).toThrow();
  symlinkSync(path.join(root, "knowledge"), path.join(root, "linked"));
  expect(() => validateProjectPathHygiene({ projectRoot: root, paths: ["linked"] })).toThrow();
  expect(readdirSync(root).sort()).toEqual(["docs", "knowledge", "linked"]);
});

it("previews and repairs document-relative links while preserving allowed paths and CRLF", () => {
  const text = "Résumé [read](" + root + "/README.md#intro)\r\nPath `" + root + "/docs/a.md`\r\n<!-- make-docs-path-hygiene: allow evidence -->\r\n" + root + "/kept.md\r\n" + root + "-sibling/keep.md\r\n";
  put("docs/nested/note.md", text);
  const preview = repairProjectPathHygiene({ projectRoot: root });
  expect(preview.changedFiles).toEqual([]);
  expect(preview.proposedChanges[0].after).toBe("Résumé [read](../../README.md#intro)\r\nPath `./docs/a.md`\r\n<!-- make-docs-path-hygiene: allow evidence -->\r\n" + root + "/kept.md\r\n" + root + "-sibling/keep.md\r\n");
  expect(readFileSync(path.join(root, "docs/nested/note.md"), "utf8")).toBe(text);
  expect(repairProjectPathHygiene({ projectRoot: root, apply: true }).changedFiles).toEqual(["docs/nested/note.md"]);
  expect(repairProjectPathHygiene({ projectRoot: root, apply: true }).changedFiles).toEqual([]);
});

it("returns real CLI failure codes and readable text, and applies only when selected", () => {
  put("docs/note.md", root + "/README.md\n");
  const invalid = cli("validate");
  expect(invalid.status, invalid.stderr).toBe(1);
  expect(JSON.parse(invalid.stdout).valid).toBe(false);
  expect(cli("validate", "--path", "missing").status).toBe(2);
  expect(cli("validate", "--scope", "managed").status).toBe(2);
  const preview = cli("repair", "--format", "text");
  expect(preview.stdout).toContain("Proposed: docs/note.md");
  expect(readFileSync(path.join(root, "docs/note.md"), "utf8")).toContain(root);
  const applied = cli("repair", "--apply");
  expect(applied.status, applied.stderr).toBe(0);
  expect(cli("validate", "--format", "text").stdout).toContain("PASS");
  expect(readdirSync(root)).toEqual(["docs"]);
});

it("shares MCP scan results and requires MCP write permission for repair", async () => {
  put("docs/note.md", root + "/README.md\n");
  const result = await callMakeDocsMcpTool("make_docs_project_path_hygiene_validate", { targetRoot: root });
  expect(result.result).toEqual(validateProjectPathHygiene({ projectRoot: root }));
  await expect(callMakeDocsMcpTool("make_docs_project_path_hygiene_repair", { targetRoot: root, apply: true })).rejects.toThrow();
});
