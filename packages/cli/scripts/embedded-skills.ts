import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "esbuild";
import type { EmbeddedSkillBundle, EmbeddedSkillPayload } from "../src/embedded-skill-types";
import { validateSkillRegistryManifest } from "../src/skill-registry";

export const EMBEDDED_SKILLS_MODULE = "virtual:make-docs-first-party-skills";
const sha256 = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");

/** Inspect actual disk, including ignored staging paths, on every normal build. */
export function assertNoReplicatedSkillTrees(packageRoot: string): void {
  const packages = path.resolve(packageRoot, "..");
  const source = path.join(packages, "skills");
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const current = path.join(directory, entry.name);
      if (current === source || entry.name === "node_modules") continue;
      if (entry.name === "SKILL.md" || (entry.name === "skills" && (entry.isDirectory() || entry.isSymbolicLink()))) {
        throw new Error(`Replicated Skill tree outside packages/skills: ${current}. Refresh generated templates through prepack; keep payloads in compiled output.`);
      }
      if (entry.isDirectory()) {
        if (entry.name === "agentics" && directory.endsWith(`${path.sep}template${path.sep}.make-docs`) && readdirSync(current).length === 0) {
          throw new Error(`Obsolete empty Skill source parent: ${current}`);
        }
        visit(current);
      }
    }
  };
  visit(packages);
}

function safePath(value: string): string {
  if (!value || value.includes("\\") || value.startsWith("/") || value.split("/").some(
    (part) => !part || part === "." || part === ".." || part.startsWith(".") ||
      /^(?:node_modules|__pycache__|tests?|cache)$/i.test(part) || /\.(?:test|spec)\./i.test(part),
  ) || /[:\x00-\x1f]/.test(value)) {
    throw new Error(`Unsafe or non-payload declared Skill path: ${value}`);
  }
  return value;
}

function readPayloadFile(root: string, relativePath: string): Buffer {
  const parts = safePath(relativePath).split("/");
  let current = root;
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const stat = lstatSync(current);
    if (stat.isSymbolicLink() || (index === parts.length - 1 ? !stat.isFile() : !stat.isDirectory())) {
      throw new Error(`Skill payload must use regular files and directories: ${current}`);
    }
  }
  return readFileSync(current);
}

/** Build-time only. Nothing is copied to a generated Skill directory. */
export function buildEmbeddedSkillBundle(packageRoot: string): EmbeddedSkillBundle {
  assertNoReplicatedSkillTrees(packageRoot);
  const registryBytes = readFileSync(path.join(packageRoot, "skill-registry.json"));
  const registry = validateSkillRegistryManifest(JSON.parse(registryBytes.toString("utf8")));
  if (registry.sourcePolicy.kind !== "first-party") throw new Error("The CLI bundle requires its first-party registry");
  const sourceRoot = path.resolve(packageRoot, "../skills");
  if (!lstatSync(sourceRoot).isDirectory() || lstatSync(sourceRoot).isSymbolicLink()) {
    throw new Error("The first-party Skill source root must be a regular directory");
  }
  const payloads: Record<string, EmbeddedSkillPayload> = {};
  const names = new Set<string>();
  for (const skill of registry.skills) {
    const name = safePath(skill.name);
    if (name.includes("/") || names.has(name.toLowerCase())) throw new Error(`Duplicate or invalid Skill name: ${name}`);
    names.add(name.toLowerCase());
    const root = path.join(sourceRoot, name);
    if (lstatSync(root).isSymbolicLink() || !lstatSync(root).isDirectory()) throw new Error(`Unsafe Skill source: ${root}`);
    const files: EmbeddedSkillPayload["files"] = {};
    const destinations = new Set<string>();
    for (const item of [{ source: skill.entryPoint, installPath: skill.entryPoint }, ...skill.assets]) {
      const source = safePath(item.source);
      const destination = safePath(item.installPath).toLowerCase();
      if (destinations.has(destination)) throw new Error(`Duplicate Skill destination: ${name}/${item.installPath}`);
      destinations.add(destination);
      const bytes = readPayloadFile(root, source);
      if (source === skill.entryPoint && !Buffer.from(bytes.toString("utf8")).equals(bytes)) {
        throw new Error(`Skill entry point is not valid UTF-8: ${name}/${source}`);
      }
      files[source] = { base64: bytes.toString("base64"), sha256: sha256(bytes) };
    }
    payloads[name] = { entryPoint: skill.entryPoint, assets: skill.assets, files };
  }
  const registryDigest = sha256(registryBytes);
  const packageDigest = sha256(readFileSync(path.join(packageRoot, "package.json")));
  return { schemaVersion: 1, packageDigest, registryDigest, payloads, digest: sha256(JSON.stringify({ packageDigest, registryDigest, payloads })) };
}

export function embeddedSkillsModuleSource(packageRoot: string, sourceTestAdapter = false): string {
  return `export const sourceTestAdapter = ${sourceTestAdapter}; export const bundle = ${JSON.stringify(buildEmbeddedSkillBundle(packageRoot))};`;
}

export function embeddedSkillsEsbuildPlugin(packageRoot: string): Plugin {
  return {
    name: "make-docs-first-party-skills",
    setup(build) {
      build.onResolve({ filter: /^virtual:make-docs-first-party-skills$/ }, () => ({ path: EMBEDDED_SKILLS_MODULE, namespace: "make-docs-skills" }));
      build.onLoad({ filter: /.*/, namespace: "make-docs-skills" }, () => ({ contents: embeddedSkillsModuleSource(packageRoot), loader: "js" }));
    },
  };
}

/** Source tests use the identical build-time reader, without runtime fallbacks. */
export function embeddedSkillsTestPlugin(packageRoot: string) {
  return {
    name: "make-docs-first-party-skills",
    resolveId(id: string) { if (id === EMBEDDED_SKILLS_MODULE) return `\0${id}`; },
    load(id: string) { if (id === `\0${EMBEDDED_SKILLS_MODULE}`) return embeddedSkillsModuleSource(packageRoot, true); },
  };
}
