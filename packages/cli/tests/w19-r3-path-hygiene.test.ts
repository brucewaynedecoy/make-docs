import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateProjectPathHygiene } from "../src/path-hygiene";
import { readInstallationManifest } from "../src/store/installation-state";

vi.mock("../src/store/installation-state", () => ({ readInstallationManifest: vi.fn() }));
const readInventory = vi.mocked(readInstallationManifest);
let root: string;
function put(relative: string, text: string): void {
  const target = path.join(root, relative);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
}
function inventory(files: string[]) {
  return { files: Object.fromEntries(files.map(file => [file, { hash: "unused" }])), skillFiles: [] } as unknown as NonNullable<ReturnType<typeof readInstallationManifest>>;
}

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), "w19-r3-hygiene-"));
  readInventory.mockReset();
  readInventory.mockReturnValue(null);
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("W19 R3 content checks without local installation state", () => {
  it("uses the Store inventory instead of a conflicting local legacy manifest", () => {
    put("docs/store.md", "Portable text.\n");
    put("docs/legacy.md", "/home/alice/private\n");
    put(".make-docs/manifest.json", JSON.stringify(inventory(["docs/legacy.md"])));
    readInventory.mockReturnValue(inventory(["docs/store.md"]));
    const result = validateProjectPathHygiene({ projectRoot: root });
    expect(result.inventorySource).toBe("store");
    expect(result.checkedFiles).toBe(1);
    expect(result.valid).toBe(true);
    expect(readInventory).toHaveBeenCalledOnce();
  });

  it("continues ordinary checking without the Store and does not parse legacy state", () => {
    put("docs/note.md", "Portable project knowledge.\n");
    put(".make-docs/manifest.json", "invalid legacy JSON must not be read");
    const before = readFileSync(path.join(root, ".make-docs/manifest.json"), "utf8");
    const result = validateProjectPathHygiene({ projectRoot: root });
    expect(result.inventorySource).toBe("content");
    expect(result.inventoryNotice).toContain("not installation evidence");
    expect(result.valid).toBe(true);
    expect(result.checkedFiles).toBe(1);
    expect(readFileSync(path.join(root, ".make-docs/manifest.json"), "utf8")).toBe(before);
    expect(readdirSync(path.join(root, ".make-docs"))).toEqual(["manifest.json"]);
  });

  it("reports unavailable Store inventory without creating local state or hiding content findings", () => {
    put("docs/note.md", "/home/alice/private\n");
    readInventory.mockImplementation(() => { throw new Error("Store is corrupt"); });
    const result = validateProjectPathHygiene({ projectRoot: root });
    expect(result.inventorySource).toBe("content");
    expect(result.inventoryNotice).toContain("unavailable");
    expect(result.valid).toBe(false);
    expect(result.failingFindings).toBe(1);
    expect(result.ioErrors).toEqual([]);
    expect(readdirSync(root)).toEqual(["docs"]);
  });

  it("accepts an explicit legacy inventory without using it as Store authority", () => {
    put("knowledge/note.md", "Legacy source content.\n");
    put("legacy.json", JSON.stringify(inventory(["knowledge/note.md"])));
    const result = validateProjectPathHygiene({ projectRoot: root, manifestPath: "legacy.json" });
    expect(result.inventorySource).toBe("legacy-manifest");
    expect(result.checkedFiles).toBe(1);
    expect(result.valid).toBe(true);
    expect(readInventory).not.toHaveBeenCalled();
    expect(readdirSync(root).sort()).toEqual(["knowledge", "legacy.json"]);
  });

  it("does not scan backup payloads or follow content links when the Store is absent", () => {
    put("docs/note.md", "Portable text.\n");
    put(".make-docs/backup/payload.md", "/home/alice/private\n");
    symlinkSync(path.join(root, ".make-docs/backup/payload.md"), path.join(root, "docs/link.md"));
    const result = validateProjectPathHygiene({ projectRoot: root });
    expect(result.checkedFiles).toBe(1);
    expect(result.valid).toBe(true);
    expect(readFileSync(path.join(root, ".make-docs/backup/payload.md"), "utf8")).toBe("/home/alice/private\n");
  });

  it("rejects escaping or linked explicit legacy inputs and escaping ledger paths", () => {
    expect(() => validateProjectPathHygiene({ projectRoot: root, manifestPath: "../escape.json" })).toThrow("inside the project");
    put("legacy.json", JSON.stringify(inventory([])));
    symlinkSync(path.join(root, "legacy.json"), path.join(root, "linked.json"));
    expect(() => validateProjectPathHygiene({ projectRoot: root, manifestPath: "linked.json" })).toThrow();
    readInventory.mockReturnValue(inventory(["../escape.md"]));
    const result = validateProjectPathHygiene({ projectRoot: root });
    expect(result.valid).toBe(false);
    expect(result.checkedFiles).toBe(0);
    expect(result.ioErrors).toEqual(["../escape.md: inventory path is not repository-relative POSIX."]);
  });
});
