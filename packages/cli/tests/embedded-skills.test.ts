import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { parse } from "yaml";
import { assertNoReplicatedSkillTrees, buildEmbeddedSkillBundle } from "../scripts/embedded-skills";
import { loadEffectiveSkillRegistry, loadSkillRegistry } from "../src/skill-registry";
import { assertEmbeddedSkillPackageDigest, getEmbeddedSkillPackageDigest, readSkillRuntimeDigest, resolveSkillSource, validateEmbeddedSkillBundle } from "../src/skill-resolver";
import { PACKAGE_ROOT } from "../src/utils";

vi.mock("node:fs", async (importOriginal) => ({ ...await importOriginal<typeof import("node:fs")>() }));

const hash = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const names = ["archive-docs", "cleanup-docs", "decompose-codebase", "human-experience", "naive-uat", "preflight", "software-factory"];
const roots: string[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-embedded-")); roots.push(root);
  const cli = path.join(root, "cli");
  const skill = path.join(root, "skills", "sample");
  mkdirSync(cli); mkdirSync(skill, { recursive: true });
  const registry = JSON.parse(readFileSync(path.join(PACKAGE_ROOT, "skill-registry.json"), "utf8"));
  registry.skills = [{ ...registry.skills[0], name: "sample", source: "embedded:sample", installName: "sample", assets: [{ source: "pixel.bin", installPath: "pixel.bin" }] }];
  writeFileSync(path.join(cli, "skill-registry.json"), JSON.stringify(registry));
  writeFileSync(path.join(cli, "package.json"), '{"name":"fixture","version":"1"}');
  writeFileSync(path.join(skill, "SKILL.md"), "# Sample\n");
  writeFileSync(path.join(skill, "pixel.bin"), Buffer.from([0, 255, 128, 13, 10]));
  return { root, cli, skill, registry };
}

describe("embedded first-party Skills", () => {
  test("embeds the exact seven declared source byte inventories without writing a payload tree", () => {
    const registry = loadSkillRegistry(PACKAGE_ROOT);
    const bundle = buildEmbeddedSkillBundle(PACKAGE_ROOT);
    expect(Object.keys(bundle.payloads).sort()).toEqual(names);
    expect(bundle.registryDigest).toBe(hash(readFileSync(path.join(PACKAGE_ROOT, "skill-registry.json"))));
    expect(bundle.packageDigest).toBe(hash(readFileSync(path.join(PACKAGE_ROOT, "package.json"))));
    validateEmbeddedSkillBundle(bundle);
    for (const entry of registry.skills) {
      const payload = bundle.payloads[entry.name];
      expect(Object.keys(payload.files).sort()).toEqual([...new Set([entry.entryPoint, ...entry.assets.map((asset) => asset.source)])].sort());
      for (const [source, file] of Object.entries(payload.files)) {
        const bytes = readFileSync(path.join(PACKAGE_ROOT, "../skills", entry.name, source));
        expect(Buffer.from(file.base64, "base64")).toEqual(bytes);
        expect(file.sha256).toBe(hash(bytes));
      }
    }
    expect(existsSync(path.join(PACKAGE_ROOT, "skills"))).toBe(false);
    expect(existsSync(path.join(PACKAGE_ROOT, "../docs/template/.make-docs/agentics"))).toBe(false);
  });

  test.each(names)("resolves %s from embedded bytes with first-party fetch unavailable", async (name) => {
    const fetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network disabled"));
    const entry = loadSkillRegistry(PACKAGE_ROOT).skills.find((entry) => entry.name === name)!;
    const resolved = await resolveSkillSource(entry.source, entry.entryPoint, entry.assets);
    expect(resolved.entryPointContent).toBe(readFileSync(path.join(PACKAGE_ROOT, "../skills", name, entry.entryPoint), "utf8"));
    for (const asset of resolved.assets) {
      expect(Buffer.from(asset.content)).toEqual(readFileSync(path.join(PACKAGE_ROOT, "../skills", name, entry.assets.find((item) => item.installPath === asset.installPath)!.source)));
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  test("rechecks the exact loaded package before a locked apply", async () => {
    const digest = await getEmbeddedSkillPackageDigest();
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(() => assertEmbeddedSkillPackageDigest(digest)).not.toThrow();
    expect(() => assertEmbeddedSkillPackageDigest("0".repeat(64))).toThrow("not loaded or has changed");
  });

  test("binds same-version runtime byte, added-file, and removed-file changes", () => {
    const { cli } = fixture();
    const runtime = path.join(cli, "dist");
    mkdirSync(runtime);
    writeFileSync(path.join(runtime, "index.js"), "export const version = 1;");
    const original = readSkillRuntimeDigest(cli);
    writeFileSync(path.join(runtime, "index.js"), "export const version = 2;");
    expect(readSkillRuntimeDigest(cli)).not.toBe(original);
    writeFileSync(path.join(runtime, "index.js"), "export const version = 1;");
    expect(readSkillRuntimeDigest(cli)).toBe(original);
    writeFileSync(path.join(runtime, "chunk.js"), "export const chunk = true;");
    const added = readSkillRuntimeDigest(cli);
    expect(added).not.toBe(original);
    rmSync(path.join(runtime, "chunk.js"));
    expect(readSkillRuntimeDigest(cli)).not.toBe(added);
    expect(readSkillRuntimeDigest(cli)).toBe(original);
  });

  test("locked recheck refuses changed installed CLI bytes with unchanged package and Skills", async () => {
    const { cli, skill } = fixture();
    const runtime = path.join(PACKAGE_ROOT, "dist");
    const directoryStat = fs.lstatSync(cli), fileStat = fs.lstatSync(path.join(skill, "SKILL.md"));
    const stat = fs.lstatSync, entries = fs.readdirSync;
    vi.spyOn(fs, "lstatSync").mockImplementation(((file: any, ...args: any[]) =>
      String(file) === runtime ? directoryStat : String(file) === path.join(runtime, "index.js") ? fileStat : (stat as any)(file, ...args)) as typeof fs.lstatSync);
    vi.spyOn(fs, "readdirSync").mockImplementation(((file: any, ...args: any[]) =>
      String(file) === runtime ? ["index.js"] : (entries as any)(file, ...args)) as typeof fs.readdirSync);
    let runtimeBytes = Buffer.from("export const version = 1;");
    const read = fs.readFileSync;
    vi.spyOn(fs, "readFileSync").mockImplementation(((file: any, ...args: any[]) => {
      return String(file) === path.join(runtime, "index.js") ? runtimeBytes : (read as any)(file, ...args);
    }) as typeof fs.readFileSync);
    const before = await getEmbeddedSkillPackageDigest();
    runtimeBytes = Buffer.from("export const version = 2;");
    expect(() => assertEmbeddedSkillPackageDigest(before)).toThrow("not loaded or has changed");
    expect(await getEmbeddedSkillPackageDigest()).not.toBe(before);
  });

  test("requires installed runtime and never uses the test adapter to omit a present or unsafe runtime", () => {
    const { cli } = fixture();
    expect(() => readSkillRuntimeDigest(cli)).toThrow("runtime is missing");
    const absent = readSkillRuntimeDigest(cli, true);
    const runtime = path.join(cli, "dist");
    mkdirSync(runtime);
    expect(() => readSkillRuntimeDigest(cli, true)).toThrow("entry point is missing");
    writeFileSync(path.join(runtime, "index.js"), "export {};");
    expect(readSkillRuntimeDigest(cli, true)).not.toBe(absent);
    symlinkSync("index.js", path.join(runtime, "linked.js"));
    expect(() => readSkillRuntimeDigest(cli, true)).toThrow("unsafe file");
  });

  test("keeps promoted Skills explicit-only and preflight independent", () => {
    for (const name of ["preflight", "software-factory", "human-experience"]) {
      const root = path.join(PACKAGE_ROOT, "../skills", name);
      expect(parse(readFileSync(path.join(root, "agents/openai.yaml"), "utf8")).policy.allow_implicit_invocation).toBe(false);
      const body = readFileSync(path.join(root, "SKILL.md"), "utf8");
      for (const match of body.matchAll(/\]\(([^)]+)\)/g)) {
        const link = match[1];
        if (link.includes("://") || link.startsWith("#")) continue;
        expect(path.resolve(root, link).startsWith(`${root}${path.sep}`)).toBe(true);
        expect(existsSync(path.resolve(root, link))).toBe(true);
      }
    }
    const store = readFileSync(path.join(PACKAGE_ROOT, "../skills/preflight/references/store.md"), "utf8");
    expect(store).not.toContain("docs/prd/");
    expect(store).not.toContain("manifest with a stable project ID");
    expect(store).not.toContain("CLI passed isolated");
  });

  test("preserves binary bytes and ignores undeclared source files", () => {
    const { cli, skill } = fixture();
    writeFileSync(path.join(skill, ".DS_Store"), "not a payload");
    const payload = buildEmbeddedSkillBundle(cli).payloads.sample;
    expect(Buffer.from(payload.files["pixel.bin"].base64, "base64")).toEqual(Buffer.from([0, 255, 128, 13, 10]));
    expect(Object.keys(payload.files)).toEqual(["SKILL.md", "pixel.bin"]);
  });

  test.each(["template/.make-docs/agentics/skills", ".ignored-staging/skills", ".ignored-staging/copy"])("normal builds reject a duplicate or empty replicated tree at %s", (relative) => {
    const { cli } = fixture();
    const duplicate = path.join(cli, relative);
    mkdirSync(duplicate, { recursive: true });
    if (relative.endsWith("copy")) writeFileSync(path.join(duplicate, "SKILL.md"), "# Copied Skill\n");
    expect(() => assertNoReplicatedSkillTrees(cli)).toThrow("Replicated Skill tree");
    expect(() => buildEmbeddedSkillBundle(cli)).toThrow("Replicated Skill tree");
  });

  test.each(["missing", "symlink", "binary-entry", "unsafe", "duplicate"])("refuses %s build input", (kind) => {
    const { cli, skill, registry } = fixture();
    if (kind === "missing") rmSync(path.join(skill, "pixel.bin"));
    if (kind === "symlink") { rmSync(path.join(skill, "pixel.bin")); symlinkSync("SKILL.md", path.join(skill, "pixel.bin")); }
    if (kind === "binary-entry") writeFileSync(path.join(skill, "SKILL.md"), Buffer.from([255, 128]));
    if (kind === "unsafe") registry.skills[0].assets[0].source = "../outside.bin";
    if (kind === "duplicate") registry.skills[0].assets[0].installPath = "skill.MD";
    writeFileSync(path.join(cli, "skill-registry.json"), JSON.stringify(registry));
    expect(() => buildEmbeddedSkillBundle(cli)).toThrow();
  });

  test.each(["version", "missing-file", "extra-file", "corrupt", "binary-entry", "shape"])("refuses a %s bundle, including a recomputed outer digest", (kind) => {
    const bundle: any = buildEmbeddedSkillBundle(fixture().cli);
    if (kind === "version") bundle.schemaVersion = 2;
    if (kind === "missing-file") delete bundle.payloads.sample.files["pixel.bin"];
    if (kind === "extra-file") bundle.payloads.sample.files.extra = bundle.payloads.sample.files["pixel.bin"];
    if (kind === "corrupt") bundle.payloads.sample.files["pixel.bin"].base64 = "AAAA";
    if (kind === "binary-entry") { const bytes = Buffer.from([255]); bundle.payloads.sample.files["SKILL.md"] = { base64: bytes.toString("base64"), sha256: hash(bytes) }; }
    if (kind === "shape") bundle.payloads.sample.assets = null;
    bundle.digest = hash(JSON.stringify({ packageDigest: bundle.packageDigest, registryDigest: bundle.registryDigest, payloads: bundle.payloads }));
    expect(() => validateEmbeddedSkillBundle(bundle)).toThrow("missing or corrupt");
  });

  test("refuses unknown/mismatched embedded requests and alternate first-party claims", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network disabled"));
    await expect(resolveSkillSource("embedded:unknown", "SKILL.md", [])).rejects.toThrow("inventory does not match");
    await expect(resolveSkillSource("embedded:preflight", "SKILL.md", [])).rejects.toThrow("inventory does not match");
    expect(() => loadEffectiveSkillRegistry({ packageRoot: PACKAGE_ROOT, manifestReference: path.join(PACKAGE_ROOT, "skill-registry.json") })).toThrow("cannot claim");
    expect(fetch).not.toHaveBeenCalled();
  });
});
