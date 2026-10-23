import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { MCP_PROFILES } from "../src/operations/mcp-metadata";
import {
  SYSTEM_RESOURCE_TYPES,
  SYSTEM_RESOURCE_TYPE_DIRECTORIES,
  getSystemResourceMcpProfiles,
  listSystemResources,
  loadSystemResourceProvider,
  readSystemResource,
  type SystemResourceMcpProfileAssignment,
  type SystemResourceProviderInventory,
} from "../src/operations/resource";

const roots: string[] = [];
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const upstreamRoot = path.join(repoRoot, "packages/docs/template");
const catalogPath = ".make-docs/system-resources.catalog.json";
const schemaPath = ".make-docs/system-resources.schema.json";
const fixtureUris = SYSTEM_RESOURCE_TYPES.map((type) => `make-docs://system/${type}/${type}.md`);

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("system-resource MCP profile metadata", () => {
  it("assigns every shipped provider URI and derives all as the exact union", () => {
    const provider = loadProvider(upstreamRoot);
    const result = getSystemResourceMcpProfiles(provider);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const uris = provider.resources.map((resource) => resource.identity.uri);
    expect(Object.keys(result.value)).toEqual(uris);
    const union = new Set(MCP_PROFILES.flatMap((profile) =>
      uris.filter((uri) => result.value[uri].includes(profile)),
    ));
    expect([...union].sort()).toEqual(uris);
    for (const profiles of Object.values(result.value)) {
      expect(profiles.length).toBeGreaterThan(0);
      expect(profiles.every((profile) => MCP_PROFILES.includes(profile))).toBe(true);
      expect(new Set(profiles).size).toBe(profiles.length);
    }
  });

  it("maps resource purposes with declared overlaps", () => {
    const result = getSystemResourceMcpProfiles(loadProvider(upstreamRoot));
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value["make-docs://system/contract/system-resource-contract.md"]).toEqual(["core", "setup"]);
    expect(result.value["make-docs://system/prompt/docs-path-hygiene-cleanup.prompt.md"]).toEqual(["setup", "quality"]);
    expect(result.value["make-docs://system/reference/prd-change-management.md"]).toEqual(["workflow", "quality"]);
    expect(result.value["make-docs://system/template/work-phase.md"]).toEqual(["workflow", "backlog"]);
    expect(result.value["make-docs://system/contract/performance-evidence-governance.md"]).toEqual(["quality"]);
    expect(result.value["ui://make-docs/backlog-review/v1.html"]).toBeUndefined();
  });

  it("requires the same five intent values in the shipped schema", () => {
    const schema = JSON.parse(readFileSync(path.join(upstreamRoot, schemaPath), "utf8"));
    expect(schema.required).toContain("mcpResources");
    expect(schema.properties.mcpResources.items).toEqual({ $ref: "#/$defs/mcpResource" });
    expect(schema.$defs.mcpResource.required).toEqual(["uri", "profiles"]);
    expect(schema.$defs.mcpResource.additionalProperties).toBe(false);
    expect(schema.$defs.mcpResource.properties.profiles).toEqual({
      type: "array", minItems: 1, uniqueItems: true, items: { enum: [...MCP_PROFILES] },
    });
  });

  it("dogfoods the exact source catalog and schema bytes", () => {
    for (const relativePath of [catalogPath, schemaPath]) {
      expect(readFileSync(path.join(repoRoot, relativePath))).toEqual(
        readFileSync(path.join(upstreamRoot, relativePath)),
      );
    }
  });

  it("keeps CLI-only legacy catalogs valid while native MCP rejects missing metadata", () => {
    const provider = loadProvider(createFixture(undefined, false));
    expect(provider.mcpResources).toBeUndefined();
    const project = { projectRoot: provider.provider.root, evidence: [], providerOnly: true };
    const listed = listSystemResources(provider, project);
    expect(listed.ok).toBe(true);
    if (listed.ok) expect(listed.value.resources.map((resource) => resource.uri)).toEqual([...fixtureUris].sort());
    expect(getSystemResourceMcpProfiles(provider)).toMatchObject({
      ok: false, error: { code: "provider-catalog-invalid" },
    });
  });

  it("keeps profile assignments out of resource byte identity and CLI results", () => {
    const root = createFixture();
    const original = loadProvider(root);
    writeCatalog(root, fixtureUris.map((uri) => ({ uri, profiles: ["quality"] })));
    const reassigned = loadProvider(root);
    expect(reassigned.provider).toEqual(original.provider);
    expect(reassigned.resources).toEqual(original.resources.map((resource, index) => ({
      ...resource, readContent: reassigned.resources[index].readContent,
    })));
    const project = { projectRoot: root, evidence: [], providerOnly: true };
    expect(listSystemResources(reassigned, project)).toEqual(listSystemResources(original, project));
    for (const uri of fixtureUris) {
      expect(readSystemResource(uri, reassigned, project)).toEqual(readSystemResource(uri, original, project));
    }
  });

  it("copies and freezes source assignments without sharing mutable arrays", () => {
    const input = validAssignments();
    const provider = loadProvider(createFixture(input));
    const result = getSystemResourceMcpProfiles(provider);
    if (!result.ok) throw new Error(result.error.message);
    input[0].profiles.push("quality");
    expect(result.value[fixtureUris[0]]).toEqual(["core"]);
    expect(Object.isFrozen(provider.mcpResources)).toBe(true);
    expect(Object.isFrozen(provider.mcpResources?.[0])).toBe(true);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value[fixtureUris[0]])).toBe(true);
  });

  it.each([
    ["null assignments", null],
    ["object assignments", {}],
    ["empty assignments", []],
    ["missing URI assignment", validAssignments().slice(1)],
    ["non-object assignment", [null, ...validAssignments().slice(1)]],
    ["missing URI", [{ profiles: ["core"] }, ...validAssignments().slice(1)]],
    ["non-string URI", [{ uri: 7, profiles: ["core"] }, ...validAssignments().slice(1)]],
    ["non-canonical URI", [{ uri: fixtureUris[0] + "#part", profiles: ["core"] }, ...validAssignments().slice(1)]],
    ["unknown URI", [{ uri: "make-docs://system/contract/unknown.md", profiles: ["core"] }, ...validAssignments().slice(1)]],
    ["UI URI", [{ uri: "ui://make-docs/backlog-review/v1.html", profiles: ["backlog"] }, ...validAssignments().slice(1)]],
    ["duplicate URI", [...validAssignments(), validAssignments()[0]]],
    ["missing profiles", [{ uri: fixtureUris[0] }, ...validAssignments().slice(1)]],
    ["null profiles", [{ uri: fixtureUris[0], profiles: null }, ...validAssignments().slice(1)]],
    ["non-array profiles", [{ uri: fixtureUris[0], profiles: "core" }, ...validAssignments().slice(1)]],
    ["empty profile set", [{ uri: fixtureUris[0], profiles: [] }, ...validAssignments().slice(1)]],
    ["unknown profile", [{ uri: fixtureUris[0], profiles: ["other"] }, ...validAssignments().slice(1)]],
    ["all assignment", [{ uri: fixtureUris[0], profiles: ["all"] }, ...validAssignments().slice(1)]],
    ["duplicate profiles", [{ uri: fixtureUris[0], profiles: ["core", "core"] }, ...validAssignments().slice(1)]],
    ["extra assignment field", [{ uri: fixtureUris[0], profiles: ["core"], ready: true }, ...validAssignments().slice(1)]],
  ])("rejects %s at provider load", (_label, metadata) => {
    const root = createFixture(metadata);
    const result = loadSystemResourceProvider({ root, packageName: "fixture", version: "1.0.0", source: "test" });
    expect(result).toMatchObject({ ok: false, error: { code: "provider-catalog-invalid" } });
  });

  it("rejects a provider inventory addition with no explicit assignment", () => {
    const root = createFixture();
    writeFileSync(path.join(root, ".make-docs/system/contracts/new.md"), "new resource\n");
    expect(loadSystemResourceProvider({ root, packageName: "fixture", version: "1.0.0", source: "test" }))
      .toMatchObject({ ok: false, error: { code: "provider-catalog-invalid" } });
  });

  it("rejects a stale assignment after a provider resource is removed", () => {
    const root = createFixture();
    rmSync(path.join(root, ".make-docs/system/contracts/contract.md"));
    expect(loadSystemResourceProvider({ root, packageName: "fixture", version: "1.0.0", source: "test" }))
      .toMatchObject({ ok: false, error: { code: "provider-catalog-invalid" } });
  });

  it.each([
    ["missing metadata", (provider: SystemResourceProviderInventory) => ({ ...provider, mcpResources: undefined })],
    ["missing assignment", (provider: SystemResourceProviderInventory) => ({ ...provider, mcpResources: provider.mcpResources?.slice(1) })],
    ["duplicate inventory URI", (provider: SystemResourceProviderInventory) => ({ ...provider, resources: [...provider.resources, provider.resources[0]] })],
    ["invalid inventory URI", (provider: SystemResourceProviderInventory) => ({ ...provider, resources: [{ ...provider.resources[0], identity: { ...provider.resources[0].identity, uri: "bad" } }] })],
    ["unknown profile", (provider: SystemResourceProviderInventory) => ({ ...provider, mcpResources: [{ uri: fixtureUris[0], profiles: ["all"] }] as unknown as SystemResourceMcpProfileAssignment[] })],
  ])("checks injected %s again at the native boundary", (_label, inject) => {
    const provider = loadProvider(createFixture());
    expect(getSystemResourceMcpProfiles(inject(provider))).toMatchObject({
      ok: false, error: { code: "provider-catalog-invalid" },
    });
  });
});

function validAssignments(): Array<{ uri: string; profiles: Array<(typeof MCP_PROFILES)[number]> }> {
  return fixtureUris.map((uri) => ({ uri, profiles: ["core"] }));
}

function createFixture(metadata: unknown = validAssignments(), includeMetadata = true): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-resource-mcp-profiles-"));
  roots.push(root);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  for (const type of SYSTEM_RESOURCE_TYPES) {
    const directory = path.join(root, ".make-docs/system", SYSTEM_RESOURCE_TYPE_DIRECTORIES[type]);
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, `${type}.md`), `${type} bytes\n`);
  }
  writeCatalog(root, metadata, includeMetadata);
  return root;
}

function writeCatalog(root: string, metadata: unknown, includeMetadata = true): void {
  writeFileSync(path.join(root, catalogPath), JSON.stringify({
    schemaVersion: 1,
    pathBase: "template-root",
    identityTemplate: "make-docs://system/{type}/{path}",
    defaultMediaType: "text/markdown; charset=utf-8",
    resourceTypes: SYSTEM_RESOURCE_TYPES.map((type) => ({
      type,
      sourceRoot: `.make-docs/system/${SYSTEM_RESOURCE_TYPE_DIRECTORIES[type]}`,
      include: ["*.md"], exclude: ["AGENTS.md", "CLAUDE.md"],
    })),
    ...(includeMetadata ? { mcpResources: metadata } : {}),
  }));
}

function loadProvider(root: string): SystemResourceProviderInventory {
  const result = loadSystemResourceProvider({ root, packageName: "fixture", version: "1.0.0", source: "test" });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}
