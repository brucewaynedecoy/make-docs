import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadManifest } from "../src/manifest";
import {
  SYSTEM_RESOURCE_TYPE_DIRECTORIES,
  listSystemResources,
  loadInstalledSystemResourceProvider,
  readSystemResource,
  type SystemResourceProjectContext,
  type SystemResourceProjectEvidence,
  type SystemResourceProviderEntry,
  type SystemResourceProviderInventory,
} from "../src/operations/resource";
import { __configureSystemResourceDigestTrustForTests } from "../src/operations/resource/resolver";
import { TEMPLATE_ROOT } from "../src/utils";

const REPO_ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");
const ROUTER_NAMES = ["AGENTS.md", "CLAUDE.md"] as const;
const tempRoots: string[] = [];

afterEach(() => {
  __configureSystemResourceDigestTrustForTests(null);
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("installed system-resource provider integration", () => {
  it("resolves all 19 real full-snapshot prompts and excludes prompt routers", () => {
    const provider = installedProvider();
    const manifest = loadManifest(REPO_ROOT);
    expect(manifest).not.toBeNull();
    if (!manifest) return;

    const prompts = promptEntries(provider);
    expect(prompts).toHaveLength(19);
    expect(prompts.every((entry) => entry.identity.path.endsWith(".prompt.md"))).toBe(true);
    const project = projectContext(REPO_ROOT, provider, prompts);
    const routerUris = ROUTER_NAMES.map((name) => `make-docs://system/prompt/${name}`);

    for (const origin of ["effective", "local", "installed"] as const) {
      const listed = listSystemResources(provider, project, origin);
      expect(listed.ok).toBe(true);
      if (!listed.ok) continue;
      const listedPrompts = listed.value.resources.filter((item) =>
        item.uri.startsWith("make-docs://system/prompt/"),
      );
      expect(listedPrompts).toHaveLength(19);
      expect(listed.value.resources.map((item) => item.uri)).not.toEqual(
        expect.arrayContaining(routerUris),
      );
      expect(
        listedPrompts.every(
          (item) =>
            item.result.ok &&
            item.result.value.state ===
              (origin === "installed" ? "provider-only" : "clean-projection"),
        ),
      ).toBe(true);
    }

    for (const entry of prompts) {
      const localPath = projectionPath(entry);
      const asset = manifest.systemAssetMaterialization.assets[localPath];
      expect(asset?.materializationMode).toBe("full-snapshot");
      expect(asset?.sourceImmutableRef).toBe(provider.provider.identity.immutableRef);
      expect(asset?.expectedHashes).toContain(entry.digest);

      for (const origin of ["effective", "local", "installed"] as const) {
        const read = readSystemResource(entry.identity.uri, provider, project, origin);
        expect(read.ok).toBe(true);
        if (!read.ok) continue;
        expect(read.value.resource.state).toBe(
          origin === "installed" ? "provider-only" : "clean-projection",
        );
        expect(read.value.resource.digest).toBe(entry.digest);
        expect(Buffer.from(read.value.resource.content)).toEqual(Buffer.from(entry.readContent()));
      }
    }

    for (const router of ROUTER_NAMES) {
      const uri = `make-docs://system/prompt/${router}`;
      expect(
        readFileSync(path.join(REPO_ROOT, ".make-docs/system/prompts", router)).byteLength,
      ).toBeGreaterThan(0);
      for (const origin of ["effective", "local", "installed"] as const) {
        const read = readSystemResource(uri, provider, project, origin);
        expect(read.ok).toBe(false);
        if (!read.ok) expect(read.error.code).toBe("resource-not-found");
      }
    }
  });

  it("reports a changed full-snapshot prompt as a conflict", () => {
    const provider = installedProvider();
    const prompts = promptEntries(provider);
    const projectRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-full-snapshot-"));
    tempRoots.push(projectRoot);
    for (const entry of prompts) {
      const localPath = path.join(projectRoot, ...projectionPath(entry).split("/"));
      mkdirSync(path.dirname(localPath), { recursive: true });
      writeFileSync(localPath, entry.readContent());
    }
    const changed = prompts[0];
    expect(changed).toBeDefined();
    if (!changed) return;
    writeFileSync(
      path.join(projectRoot, ...projectionPath(changed).split("/")),
      "changed prompt content\n",
    );
    const project = projectContext(projectRoot, provider, prompts);
    const changedEvidence = project.evidence.find((entry) => entry.uri === changed.identity.uri);
    expect(changedEvidence?.providerImmutableRef).toBe(provider.provider.identity.immutableRef);

    const read = readSystemResource(changed.identity.uri, provider, project);
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.error.code).toBe("resource-conflict");
  });

  it("reports provider content drift under the same package reference as a conflict", () => {
    const provider = installedProvider();
    const prompts = promptEntries(provider);
    const projectRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-provider-drift-"));
    tempRoots.push(projectRoot);
    for (const entry of prompts) {
      const localPath = path.join(projectRoot, ...projectionPath(entry).split("/"));
      mkdirSync(path.dirname(localPath), { recursive: true });
      writeFileSync(localPath, entry.readContent());
    }
    const changed = prompts[0];
    expect(changed).toBeDefined();
    if (!changed) return;
    const changedContent = Buffer.from("changed provider prompt content\n");
    const changedDigest = createHash("sha256").update(changedContent).digest("hex");
    const changedResources = provider.resources.map((entry) =>
      entry.identity.uri === changed.identity.uri
        ? {
            ...entry,
            digest: changedDigest,
            byteLength: changedContent.byteLength,
            readContent: () => Buffer.from(changedContent),
          }
        : entry,
    );
    const changedProvider: SystemResourceProviderInventory = {
      provider: {
        ...provider.provider,
        inventoryDigest: createHash("sha256")
          .update(
            Buffer.from(
              changedResources
                .map((entry) => `${entry.identity.uri}\0${entry.digest}`)
                .join("\n"),
            ),
          )
          .digest("hex"),
      },
      resources: changedResources,
    };
    const project = projectContext(projectRoot, provider, prompts);
    const changedEvidence = project.evidence.find((entry) => entry.uri === changed.identity.uri);
    expect(changedProvider.provider.identity.version).toBe(provider.provider.identity.version);
    expect(changedProvider.provider.identity.immutableRef).toBe(
      provider.provider.identity.immutableRef,
    );
    expect(changedEvidence?.expectedDigest).toBe(changed.digest);
    expect(changedEvidence?.providerImmutableRef).toBe(
      changedProvider.provider.identity.immutableRef,
    );

    for (const origin of ["effective", "local"] as const) {
      const read = readSystemResource(changed.identity.uri, changedProvider, project, origin);
      expect(read.ok).toBe(false);
      if (!read.ok) expect(read.error.code).toBe("resource-conflict");
    }
  });

  it("ignores local files and manifest evidence outside provider inventory membership", () => {
    const provider = installedProvider();
    const projectRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-provider-membership-"));
    tempRoots.push(projectRoot);
    const excluded = [
      {
        uri: "make-docs://system/prompt/AGENTS.md",
        localPath: ".make-docs/system/prompts/AGENTS.md",
        content: "# Local prompt router\n",
      },
      {
        uri: "make-docs://system/contract/playbook-contract.md",
        localPath: ".make-docs/system/contracts/playbook-contract.md",
        content: "# Preserved legacy contract\n",
      },
      {
        uri: "make-docs://system/prompt/stray.prompt.md",
        localPath: ".make-docs/system/prompts/stray.prompt.md",
        content: "# Stray catalog-matching prompt\n",
      },
    ] as const;
    const evidence: SystemResourceProjectEvidence[] = excluded.map((entry) => {
      const localPath = path.join(projectRoot, ...entry.localPath.split("/"));
      mkdirSync(path.dirname(localPath), { recursive: true });
      writeFileSync(localPath, entry.content);
      return {
        uri: entry.uri,
        selected: true,
        ownership: "managed-projection",
        expectedDigest: createHash("sha256").update(entry.content).digest("hex"),
        providerImmutableRef: provider.provider.identity.immutableRef,
        localPath: entry.localPath,
      };
    });
    const project: SystemResourceProjectContext = { projectRoot, evidence };

    for (const origin of ["effective", "local", "installed"] as const) {
      const listed = listSystemResources(provider, project, origin);
      expect(listed.ok).toBe(true);
      if (!listed.ok) continue;
      expect(listed.value.resources.map((item) => item.uri)).not.toEqual(
        expect.arrayContaining(excluded.map((entry) => entry.uri)),
      );
      for (const entry of excluded) {
        const read = readSystemResource(entry.uri, provider, project, origin);
        expect(read.ok).toBe(false);
        if (!read.ok) expect(read.error.code).toBe("resource-not-found");
      }
    }
  });
});

function installedProvider(): SystemResourceProviderInventory {
  const result = loadInstalledSystemResourceProvider();
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

function promptEntries(provider: SystemResourceProviderInventory): SystemResourceProviderEntry[] {
  return provider.resources.filter((entry) => entry.identity.type === "prompt");
}

function projectContext(
  projectRoot: string,
  provider: SystemResourceProviderInventory,
  prompts: readonly SystemResourceProviderEntry[],
): SystemResourceProjectContext {
  const manifest = loadManifest(REPO_ROOT);
  if (!manifest) throw new Error("The real full-snapshot manifest is missing.");
  const evidence: SystemResourceProjectEvidence[] = prompts.map((entry) => {
    const localPath = projectionPath(entry);
    const asset = manifest.systemAssetMaterialization.assets[localPath];
    if (!asset) throw new Error(`Missing full-snapshot evidence for ${localPath}.`);
    return {
      uri: entry.identity.uri,
      selected: true,
      ownership: "managed-projection",
      expectedDigest: asset.expectedHashes[0] ?? "",
      providerImmutableRef: asset.sourceImmutableRef,
      localPath,
    };
  });
  expect(provider.provider.identity.immutableRef).toBe(
    `package:${provider.provider.identity.packageName}@${provider.provider.identity.version}`,
  );
  return { projectRoot, evidence };
}

function projectionPath(entry: SystemResourceProviderEntry): string {
  return `.make-docs/system/${SYSTEM_RESOURCE_TYPE_DIRECTORIES[entry.identity.type]}/${entry.identity.path}`;
}
