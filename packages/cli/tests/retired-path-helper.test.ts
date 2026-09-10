import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { planRetiredPathHelper, RETIRED_PATH_HELPER } from "../src/retired-path-helper";
import * as utils from "../src/utils";
import type { InstallManifest } from "../src/types";

let root: string;
const shippedHash = "77c66f924a14118f124a4d9b321b6a9f68f194ecfbf97f18e21fc801e2a88b4c";
const manifest = () => ({ files: { [RETIRED_PATH_HELPER]: { sourceId: "file:" + RETIRED_PATH_HELPER, hash: shippedHash } } }) as unknown as InstallManifest;
function put(file: string, body: string) { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), body); }
beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), "retired-helper-"));
  // Exercise ownership and planning without retaining a retired Python payload.
  const original = utils.hashText;
  vi.spyOn(utils, "hashText").mockImplementation(text => text === "shipped fixture" ? shippedHash : original(text));
  put(RETIRED_PATH_HELPER, "shipped fixture");
});
afterEach(() => { vi.restoreAllMocks(); rmSync(root, { recursive: true, force: true }); });

it("plans trusted removal only after live consumers are updated", () => {
  const prompt = ".make-docs/system/prompts/cleanup.md";
  put(prompt, "Run check_path_hygiene.py");
  expect(planRetiredPathHelper(root, manifest(), [])?.type).toBe("skip");
  expect(planRetiredPathHelper(root, manifest(), [{ type: "skip-conflict", relativePath: prompt, content: "Use the CLI" }])?.type).toBe("skip");
  expect(planRetiredPathHelper(root, manifest(), [{ type: "update", relativePath: prompt, content: "Use the CLI" }])?.type).toBe("remove-managed");
  expect(readFileSync(path.join(root, RETIRED_PATH_HELPER), "utf8")).toBe("shipped fixture");
});

it("preserves unknown, modified, project-owned, linked and non-file helpers", () => {
  expect(planRetiredPathHelper(root, null, [])?.type).toBe("skip");
  const owned = manifest(); owned.files[RETIRED_PATH_HELPER].ownershipClass = "project-owned";
  expect(planRetiredPathHelper(root, owned, [])?.type).toBe("skip");
  put(RETIRED_PATH_HELPER, "modified");
  expect(planRetiredPathHelper(root, manifest(), [])?.type).toBe("skip");
  rmSync(path.join(root, RETIRED_PATH_HELPER));
  symlinkSync(path.join(root, "missing"), path.join(root, RETIRED_PATH_HELPER));
  expect(planRetiredPathHelper(root, manifest(), [])?.type).toBe("skip");
  rmSync(path.join(root, RETIRED_PATH_HELPER)); mkdirSync(path.join(root, RETIRED_PATH_HELPER));
  expect(planRetiredPathHelper(root, manifest(), [])?.type).toBe("skip");
});

it("forgets missing managed helpers and leaves unknown directory contents alone", () => {
  put(".make-docs/scripts/custom.txt", "keep");
  rmSync(path.join(root, RETIRED_PATH_HELPER));
  expect(planRetiredPathHelper(root, manifest(), [])?.type).toBe("remove-managed");
  expect(planRetiredPathHelper(root, null, [])).toBeNull();
  const unknown = manifest(); unknown.files[RETIRED_PATH_HELPER].sourceId = "project:custom";
  expect(planRetiredPathHelper(root, unknown, [])?.type).toBe("skip");
  expect(existsSync(path.join(root, ".make-docs/scripts/custom.txt"))).toBe(true);
});
