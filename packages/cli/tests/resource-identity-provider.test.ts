import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SYSTEM_RESOURCE_TYPES,
  SYSTEM_RESOURCE_TYPE_DIRECTORIES,
  createSystemResourceIdentity,
  loadInstalledSystemResourceProvider,
  loadSystemResourceProvider,
  parseSystemResourceUri,
  type SystemResourceProviderInventory,
  type SystemResourceType,
} from "../src/operations/resource";

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("system-resource identity", () => {
  it.each(SYSTEM_RESOURCE_TYPES)("creates one canonical %s identity", (type) => {
    const result = createSystemResourceIdentity(type, "nested/Example.md");
    expect(result).toEqual({
      ok: true,
      value: {
        type,
        path: "nested/Example.md",
        uri: `make-docs://system/${type}/nested/Example.md`,
      },
    });
    expect(parseSystemResourceUri(`make-docs://system/${type}/nested/Example.md`)).toEqual(result);
  });

  it.each([
    ["script", "file.md", "invalid-resource-type"],
    ["contract", "", "invalid-resource-path"],
    ["contract", "/absolute.md", "invalid-resource-path"],
    ["contract", "C:/absolute.md", "invalid-resource-path"],
    ["contract", "folder\\file.md", "invalid-resource-path"],
    ["contract", "folder//file.md", "invalid-resource-path"],
    ["contract", "./file.md", "invalid-resource-path"],
    ["contract", "../file.md", "invalid-resource-path"],
    ["contract", "folder/../file.md", "invalid-resource-path"],
    ["contract", "%2e%2e/file.md", "invalid-resource-path"],
    ["contract", "folder/%2Ffile.md", "invalid-resource-path"],
  ])("rejects type %s and path %s", (type, resourcePath, code) => {
    const result = createSystemResourceIdentity(type, resourcePath);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(code);
  });

  it("rejects non-canonical URI query and fragment forms", () => {
    for (const uri of [
      "make-docs://system/contract/file.md?raw=1",
      "make-docs://system/contract/file.md#part",
      "make-docs://other/contract/file.md",
    ]) {
      const result = parseSystemResourceUri(uri);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("invalid-resource-uri");
    }
  });
});

describe("system-resource provider inventory", () => {
  it("loads the current development provider catalog", () => {
    const result = loadInstalledSystemResourceProvider();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const type of SYSTEM_RESOURCE_TYPES) {
      expect(result.value.resources.some((entry) => entry.identity.type === type)).toBe(true);
    }
  });

  it("loads all peer types without a project projection", () => {
    const inventory = loadFixtureProvider(createProviderFixture("development"), "development");
    expect(inventory.resources.map((entry) => entry.identity.type).sort()).toEqual(
      [...SYSTEM_RESOURCE_TYPES].sort(),
    );
    expect(inventory.resources.every((entry) => entry.digest.length === 64)).toBe(true);
    expect(inventory.provider.identity.immutableRef).toBe(
      `sha256:${inventory.provider.inventoryDigest}`,
    );
  });

  it("keeps stable URI inventory across development and packed roots", () => {
    const development = loadFixtureProvider(createProviderFixture("development"), "development");
    const packed = loadFixtureProvider(createProviderFixture("packed"), "packed");
    expect(packed.resources.map((entry) => entry.identity.uri)).toEqual(
      development.resources.map((entry) => entry.identity.uri),
    );
    expect(packed.resources.map((entry) => entry.digest)).toEqual(
      development.resources.map((entry) => entry.digest),
    );
    expect(packed.provider.identity.source).toBe("packed");
  });

  it("orders provider identities without locale-sensitive comparison", () => {
    const compare = vi.spyOn(String.prototype, "localeCompare").mockImplementation(() => {
      throw new Error("localeCompare must not control resource order");
    });
    let inventory: SystemResourceProviderInventory;
    try {
      inventory = loadFixtureProvider(createProviderFixture("stable-order"), "development");
    } finally {
      compare.mockRestore();
    }
    const uris = inventory.resources.map((entry) => entry.identity.uri);
    expect(uris).toEqual([...uris].sort());
  });

  it("fails closed on duplicate type mappings", () => {
    const root = createProviderFixture("duplicate");
    const catalogPath = path.join(root, ".make-docs/system-resources.catalog.json");
    const catalog = createCatalog();
    catalog.resourceTypes[1] = { ...catalog.resourceTypes[0] };
    writeFileSync(catalogPath, JSON.stringify(catalog));
    const result = loadSystemResourceProvider({
      root,
      packageName: "fixture",
      version: "1.0.0",
      source: "test",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("duplicate-resource-identity");
  });

  it("fails closed when a provider resource is a symlink", () => {
    const root = createProviderFixture("symlink");
    const target = path.join(root, "target.md");
    writeFileSync(target, "target");
    const link = path.join(root, ".make-docs/contracts/system/link.md");
    symlinkSync(target, link);
    const result = loadSystemResourceProvider({
      root,
      packageName: "fixture",
      version: "1.0.0",
      source: "test",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("symlink-not-allowed");
  });
});

function createProviderFixture(label: string): string {
  const root = mkdtempSync(path.join(os.tmpdir(), `make-docs-resource-${label}-`));
  tempRoots.push(root);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(
    path.join(root, ".make-docs/system-resources.catalog.json"),
    JSON.stringify(createCatalog()),
  );
  for (const type of SYSTEM_RESOURCE_TYPES) {
    const directory = path.join(
      root,
      ".make-docs",
      SYSTEM_RESOURCE_TYPE_DIRECTORIES[type],
      "system",
    );
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, `${type}.md`), `${type} content\n`);
    writeFileSync(path.join(directory, "AGENTS.md"), "excluded\n");
  }
  return root;
}

function createCatalog(): {
  schemaVersion: number;
  pathBase: string;
  identityTemplate: string;
  defaultMediaType: string;
  resourceTypes: Array<{
    type: SystemResourceType;
    sourceRoot: string;
    include: string[];
    exclude: string[];
  }>;
} {
  return {
    schemaVersion: 1,
    pathBase: "template-root",
    identityTemplate: "make-docs://system/{type}/{path}",
    defaultMediaType: "text/markdown; charset=utf-8",
    resourceTypes: SYSTEM_RESOURCE_TYPES.map((type) => ({
      type,
      sourceRoot: `.make-docs/${SYSTEM_RESOURCE_TYPE_DIRECTORIES[type]}/system`,
      include: ["*.md"],
      exclude: ["AGENTS.md", "CLAUDE.md"],
    })),
  };
}

function loadFixtureProvider(
  root: string,
  source: "development" | "packed",
): SystemResourceProviderInventory {
  const result = loadSystemResourceProvider({
    root,
    packageName: "fixture",
    version: "1.0.0",
    source,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}
