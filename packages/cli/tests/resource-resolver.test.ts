import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createExecutionContext } from "../src/operations/context";
import { __configureSystemResourceDigestTrustForTests } from "../src/operations/resource/resolver";
import {
  SYSTEM_RESOURCE_ENSURE_APPROVAL,
  SYSTEM_RESOURCE_TYPES,
  SYSTEM_RESOURCE_TYPE_DIRECTORIES,
  ensureSystemResource,
  listSystemResources,
  loadSystemResourceProvider,
  parseSystemResourceUri,
  readSystemResource,
  resolveSystemResource,
  type SystemResourceDigestEvidence,
  type SystemResourceProjectContext,
  type SystemResourceProjectEvidence,
  type SystemResourceProviderEntry,
  type SystemResourceProviderInventory,
  type SystemResourceType,
} from "../src/operations/resource";

const tempRoots: string[] = [];

afterEach(() => {
  __configureSystemResourceDigestTrustForTests(null);
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("system-resource resolver", () => {
  it.each(SYSTEM_RESOURCE_TYPES)("resolves provider-only %s resources", (type) => {
    const provider = createProvider();
    const project = createProject();
    const entry = providerEntry(provider, type);
    const result = readSystemResource(entry.identity.uri, provider, context(project));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.resource.state).toBe("provider-only");
    expect(result.value.resource.source).toBe("provider");
    expect(Buffer.from(result.value.resource.content).toString("utf8")).toBe(`${type} content\n`);
    expect(existsSync(path.join(project, ".make-docs"))).toBe(false);
  });

  it("selects effective, local, and installed origins in the shared resolver", () => {
    const provider = createProvider();
    const project = createProject();
    const entry = providerEntry(provider, "contract");
    const override = Buffer.from("local contract override\n");
    writeProjection(project, entry, override);
    const projectContext = context(project, [{
      uri: entry.identity.uri,
      selected: true,
      ownership: "project-override",
      expectedDigest: digest(override),
      localPath: projectionPath(entry),
    }]);

    const effective = readSystemResource(entry.identity.uri, provider, projectContext);
    const local = readSystemResource(entry.identity.uri, provider, projectContext, "local");
    const installed = readSystemResource(entry.identity.uri, provider, projectContext, "installed");
    expect(effective.ok && effective.value.resource.source).toBe("project-override");
    expect(local.ok && local.value.resource.source).toBe("project-override");
    expect(installed.ok && installed.value.resource.source).toBe("provider");
    if (installed.ok) {
      expect(Buffer.from(installed.value.resource.content).toString("utf8")).toBe(
        "contract content\n",
      );
    }

    const effectiveList = listSystemResources(provider, projectContext, "effective");
    const localList = listSystemResources(provider, projectContext, "local");
    const installedList = listSystemResources(provider, projectContext, "installed");
    expect(effectiveList.ok && effectiveList.value.resources).toHaveLength(4);
    expect(localList.ok && localList.value.resources.map((item) => item.uri)).toEqual([
      entry.identity.uri,
    ]);
    expect(installedList.ok && installedList.value.resources).toHaveLength(4);
    if (installedList.ok) {
      expect(
        installedList.value.resources.every(
          (item) => item.result.ok && item.result.value.source === "provider",
        ),
      ).toBe(true);
    }
  });

  it("isolates provider inventory bytes from read-result mutation and ensure output", () => {
    const provider = createProvider();
    const entry = provider.resources[0];
    const original = entry.readContent();
    const exposedInventoryBytes = entry.readContent();
    exposedInventoryBytes[0] ^= 0xff;
    expect(entry.readContent()).toEqual(original);
    const readProject = createProject();
    const first = readSystemResource(entry.identity.uri, provider, context(readProject));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    first.value.resource.content[0] ^= 0xff;

    expect(entry.readContent()).toEqual(original);
    const second = readSystemResource(entry.identity.uri, provider, context(readProject));
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.resource.content).toEqual(original);
    expect(second.value.resource.digest).toBe(digest(second.value.resource.content));

    const ensureProject = createProject();
    const ensured = ensureSystemResource({
      uri: entry.identity.uri,
      provider,
      project: context(ensureProject, [managedEvidence(provider, entry)]),
      execution: createExecutionContext({
        writesAllowed: true,
        approvals: [SYSTEM_RESOURCE_ENSURE_APPROVAL],
      }),
    });
    expect(ensured.ok).toBe(true);
    if (ensured.ok) expect(readFileSync(ensured.value.path)).toEqual(Buffer.from(original));
  });

  it.each(SYSTEM_RESOURCE_TYPES)("resolves a trustworthy clean %s projection first", (type) => {
    const provider = createProvider();
    const project = createProject();
    const entry = providerEntry(provider, type);
    writeProjection(project, entry, entry.readContent());
    const result = resolveSystemResource(
      entry.identity.uri,
      provider,
      context(project, [managedEvidence(provider, entry)]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state).toBe("clean-projection");
    expect(result.value.source).toBe("managed-projection");
    expect(result.value.provenance.provider?.immutableRef).toBe(
      provider.provider.identity.immutableRef,
    );
    expect(result.value.provenance.digestSource).toBe("computed");
  });

  it.each(SYSTEM_RESOURCE_TYPES)("resolves an explicit %s project override", (type) => {
    const provider = createProvider();
    const project = createProject();
    const entry = providerEntry(provider, type);
    const override = Buffer.from(`${type} project override\n`);
    writeProjection(project, entry, override);
    const evidence: SystemResourceProjectEvidence = {
      uri: entry.identity.uri,
      selected: true,
      ownership: "project-override",
      expectedDigest: digest(override),
      localPath: projectionPath(entry),
    };
    const result = resolveSystemResource(entry.identity.uri, provider, context(project, [evidence]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state).toBe("explicit-override");
    expect(result.value.source).toBe("project-override");
    expect(result.value.digest).toBe(digest(override));
    expect(result.value.provenance.provider?.immutableRef).toBe(
      provider.provider.identity.immutableRef,
    );
  });

  it.each(SYSTEM_RESOURCE_TYPES)("reports a divergent managed %s projection as conflict", (type) => {
    const provider = createProvider();
    const project = createProject();
    const entry = providerEntry(provider, type);
    writeProjection(project, entry, Buffer.from("changed\n"));
    const result = resolveSystemResource(
      entry.identity.uri,
      provider,
      context(project, [managedEvidence(provider, entry)]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code, result.error.message).toBe("resource-conflict");
  });

  it.each(SYSTEM_RESOURCE_TYPES)("rejects an unowned local %s file", (type) => {
    const provider = createProvider();
    const project = createProject();
    const entry = providerEntry(provider, type);
    writeProjection(project, entry, entry.readContent());
    const result = resolveSystemResource(entry.identity.uri, provider, context(project));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("provenance-untrusted");
  });

  it.each(SYSTEM_RESOURCE_TYPES)("reports a missing %s resource with a typed result", (type) => {
    const provider = createProvider();
    const project = createProject();
    const uri = `make-docs://system/${type}/missing.md`;
    const result = resolveSystemResource(uri, provider, context(project));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("resource-not-found");
  });

  it.each(SYSTEM_RESOURCE_TYPES)("rejects cross-platform ambiguous %s paths", (type) => {
    for (const uri of [
      `make-docs://system/${type}/folder\\file.md`,
      `make-docs://system/${type}/C:/file.md`,
      `make-docs://system/${type}/C:folder/file.md`,
      `make-docs://system/${type}/%2e%2e/file.md`,
    ]) {
      expect(parseSystemResourceUri(uri).ok).toBe(false);
    }
  });

  it.each(SYSTEM_RESOURCE_TYPES)("rejects a symbolic-link %s projection", (type) => {
    const provider = createProvider();
    const project = createProject();
    const entry = providerEntry(provider, type);
    const target = path.join(project, `${type}-target.md`);
    writeFileSync(target, entry.readContent());
    const localPath = absoluteProjectionPath(project, entry);
    mkdirSync(path.dirname(localPath), { recursive: true });
    symlinkSync(target, localPath);
    const result = resolveSystemResource(
      entry.identity.uri,
      provider,
      context(project, [managedEvidence(provider, entry)]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("symlink-not-allowed");
  });

  it("does not resolve a projection through a case-only path alias", () => {
    const provider = createProvider();
    const project = createProject();
    const uri = "make-docs://system/contract/case.md";
    const content = Buffer.from("case-sensitive override\n");
    const wrongCasePath = path.join(project, ".make-docs/system/contracts/Case.md");
    const requestedPath = path.join(project, ".make-docs/system/contracts/case.md");
    mkdirSync(path.dirname(wrongCasePath), { recursive: true });
    writeFileSync(wrongCasePath, content);
    const aliasesOnThisFileSystem = existsSync(requestedPath);
    const result = resolveSystemResource(
      uri,
      provider,
      context(project, [{
        uri,
        selected: true,
        ownership: "project-override",
        expectedDigest: digest(content),
        localPath: ".make-docs/system/contracts/case.md",
      }]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        aliasesOnThisFileSystem ? "provenance-untrusted" : "resource-not-found",
      );
    }
  });

  it("returns one URI-sorted list and does not materialize project files", () => {
    const provider = createProvider();
    const project = createProject();
    const result = listSystemResources(provider, context(project));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const uris = result.value.resources.map((entry) => entry.uri);
    expect(uris).toEqual([...uris].sort());
    expect(uris).toHaveLength(4);
    expect(result.value.resources.every((entry) => entry.result.ok)).toBe(true);
    expect(existsSync(path.join(project, ".make-docs"))).toBe(false);
  });

  it("orders the resolved list without locale-sensitive comparison", () => {
    const provider = createProvider();
    const project = createProject();
    const compare = vi.spyOn(String.prototype, "localeCompare").mockImplementation(() => {
      throw new Error("localeCompare must not control resource order");
    });
    let result: ReturnType<typeof listSystemResources> | undefined;
    try {
      result = listSystemResources(provider, context(project));
    } finally {
      compare.mockRestore();
    }
    expect(result?.ok).toBe(true);
    if (!result?.ok) return;
    const uris = result.value.resources.map((entry) => entry.uri);
    expect(uris).toEqual([...uris].sort());
  });

  it("rejects duplicate project and provider identities", () => {
    const provider = createProvider();
    const project = createProject();
    const entry = provider.resources[0];
    const evidence = managedEvidence(provider, entry);
    const projectDuplicate = resolveSystemResource(
      entry.identity.uri,
      provider,
      context(project, [evidence, evidence]),
    );
    expect(projectDuplicate.ok).toBe(false);
    if (!projectDuplicate.ok) expect(projectDuplicate.error.code).toBe("duplicate-resource-identity");

    const providerDuplicate: SystemResourceProviderInventory = {
      ...provider,
      resources: [...provider.resources, provider.resources[0]],
    };
    const inventoryDuplicate = listSystemResources(providerDuplicate, context(project));
    expect(inventoryDuplicate.ok).toBe(false);
    if (!inventoryDuplicate.ok) {
      expect(inventoryDuplicate.error.code).toBe("duplicate-resource-identity");
    }
  });
});

describe("system-resource ensure", () => {
  it.each(SYSTEM_RESOURCE_TYPES)("plans, creates, and reuses a selected %s projection", (type) => {
    const provider = createProvider();
    const project = createProject();
    const entry = providerEntry(provider, type);
    const projectContext = context(project, [managedEvidence(provider, entry)]);

    const planned = ensureSystemResource({
      uri: entry.identity.uri,
      provider,
      project: projectContext,
      execution: createExecutionContext({ dryRun: true }),
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    expect(planned.value.action).toBe("planned");
    expect(existsSync(absoluteProjectionPath(project, entry))).toBe(false);

    const created = ensureSystemResource({
      uri: entry.identity.uri,
      provider,
      project: projectContext,
      execution: createExecutionContext({
        writesAllowed: true,
        approvals: [SYSTEM_RESOURCE_ENSURE_APPROVAL],
      }),
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.action).toBe("created");
    expect(readFileSync(created.value.path)).toEqual(Buffer.from(entry.readContent()));

    const reused = ensureSystemResource({
      uri: entry.identity.uri,
      provider,
      project: projectContext,
      execution: createExecutionContext({
        writesAllowed: true,
        approvals: [SYSTEM_RESOURCE_ENSURE_APPROVAL],
      }),
    });
    expect(reused.ok).toBe(true);
    if (reused.ok) expect(reused.value.action).toBe("reused");
  });

  it("requires write permission and reviewed approval", () => {
    const provider = createProvider();
    const project = createProject();
    const entry = provider.resources[0];
    const projectContext = context(project, [managedEvidence(provider, entry)]);

    const denied = ensureSystemResource({
      uri: entry.identity.uri,
      provider,
      project: projectContext,
      execution: createExecutionContext(),
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.code).toBe("write-not-authorized");

    const unapproved = ensureSystemResource({
      uri: entry.identity.uri,
      provider,
      project: projectContext,
      execution: createExecutionContext({ writesAllowed: true }),
    });
    expect(unapproved.ok).toBe(false);
    if (!unapproved.ok) expect(unapproved.error.code).toBe("approval-required");
    expect(existsSync(absoluteProjectionPath(project, entry))).toBe(false);
  });

  it("does not bypass selection, ownership, or conflict review", () => {
    const provider = createProvider();
    const entry = provider.resources[0];
    const execution = createExecutionContext({
      writesAllowed: true,
      approvals: [SYSTEM_RESOURCE_ENSURE_APPROVAL],
    });

    const unselectedProject = createProject();
    const unselected = ensureSystemResource({
      uri: entry.identity.uri,
      provider,
      project: context(unselectedProject),
      execution,
    });
    expect(unselected.ok).toBe(false);
    if (!unselected.ok) expect(unselected.error.code).toBe("projection-not-selected");

    const overrideProject = createProject();
    const overrideEvidence: SystemResourceProjectEvidence = {
      ...managedEvidence(provider, entry),
      ownership: "project-override",
    };
    const override = ensureSystemResource({
      uri: entry.identity.uri,
      provider,
      project: context(overrideProject, [overrideEvidence]),
      execution,
    });
    expect(override.ok).toBe(false);
    if (!override.ok) expect(override.error.code).toBe("override-not-materializable");

    const conflictProject = createProject();
    writeProjection(conflictProject, entry, Buffer.from("changed\n"));
    const conflict = ensureSystemResource({
      uri: entry.identity.uri,
      provider,
      project: context(conflictProject, [managedEvidence(provider, entry)]),
      execution,
    });
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) expect(conflict.error.code).toBe("resource-conflict");
  });

  it("requires an immutable provider reference for a managed projection", () => {
    const provider = createProvider();
    const project = createProject();
    const entry = provider.resources[0];
    writeProjection(project, entry, entry.readContent());
    const evidence = managedEvidence(provider, entry);
    delete evidence.providerImmutableRef;

    const result = resolveSystemResource(
      entry.identity.uri,
      provider,
      context(project, [evidence]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("invalid-project-evidence");
  });

  it("rejects malformed project evidence before it controls resolution", () => {
    const provider = createProvider();
    const project = createProject();
    const entry = provider.resources[0];
    const valid = managedEvidence(provider, entry);
    const malformedContexts: unknown[] = [
      { projectRoot: 7, evidence: [valid] },
      { projectRoot: project, evidence: "not-an-array" },
      { projectRoot: project, evidence: [{ ...valid, uri: 7 }] },
      { projectRoot: project, evidence: [{ ...valid, selected: "yes" }] },
      { projectRoot: project, evidence: [{ ...valid, ownership: "managed" }] },
      { projectRoot: project, evidence: [{ ...valid, expectedDigest: 7 }] },
      { projectRoot: project, evidence: [{ ...valid, providerImmutableRef: "" }] },
      { projectRoot: project, evidence: [{ ...valid, localPath: "../outside.md" }] },
      {
        projectRoot: project,
        evidence: [valid],
        digestEvidence: [{ path: project, digest: valid.expectedDigest, fingerprint: {} }],
      },
    ];

    for (const malformed of malformedContexts) {
      const result = resolveSystemResource(
        entry.identity.uri,
        provider,
        malformed as SystemResourceProjectContext,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("invalid-project-evidence");
    }
  });
});

describe("system-resource determinism and evidence reuse", () => {
  it("reuses a verified digest without running local SHA-256 again", () => {
    let localHashCalls = 0;
    __configureSystemResourceDigestTrustForTests(() => {
      localHashCalls += 1;
    });
    const provider = createProvider();
    const project = createProject();
    const entry = provider.resources[0];
    writeProjection(project, entry, entry.readContent());
    const evidence = managedEvidence(provider, entry);

    const initial = resolveSystemResource(entry.identity.uri, provider, context(project, [evidence]));
    expect(initial.ok).toBe(true);
    if (!initial.ok || !initial.value.digestEvidence) return;
    expect(initial.value.provenance.digestSource).toBe("computed");
    expect(localHashCalls).toBe(1);

    const reused = resolveSystemResource(
      entry.identity.uri,
      provider,
      context(project, [evidence], [initial.value.digestEvidence]),
    );
    expect(reused.ok).toBe(true);
    if (!reused.ok) return;
    expect(reused.value.provenance.digestSource).toBe("reused");
    expect(localHashCalls).toBe(1);
    expect(reused.value.digest).toBe(digest(reused.value.content));

    const changedProviderFacts: SystemResourceProviderInventory = {
      ...provider,
      provider: {
        ...provider.provider,
        identity: { ...provider.provider.identity, version: "1.0.0-review-change" },
      },
    };
    const reverified = resolveSystemResource(
      entry.identity.uri,
      changedProviderFacts,
      context(project, [evidence], [initial.value.digestEvidence]),
    );
    expect(reverified.ok).toBe(true);
    if (!reverified.ok) return;
    expect(reverified.value.provenance.digestSource).toBe("computed");
    expect(localHashCalls).toBe(2);

    const changedEvidence: SystemResourceProjectEvidence = {
      ...evidence,
      expectedDigest: "0".repeat(64),
    };
    const evidenceResult = resolveSystemResource(
      entry.identity.uri,
      provider,
      context(project, [changedEvidence], [initial.value.digestEvidence]),
    );
    expect(evidenceResult.ok).toBe(false);
    if (!evidenceResult.ok) expect(evidenceResult.error.code).toBe("resource-conflict");
    expect(localHashCalls).toBe(3);

    const changedFingerprint: SystemResourceDigestEvidence = {
      ...initial.value.digestEvidence,
      fingerprint: {
        ...initial.value.digestEvidence.fingerprint,
        size: initial.value.digestEvidence.fingerprint.size + 1,
      },
    };
    const fingerprintResult = resolveSystemResource(
      entry.identity.uri,
      provider,
      context(project, [evidence], [changedFingerprint]),
    );
    expect(fingerprintResult.ok).toBe(true);
    if (!fingerprintResult.ok) return;
    expect(fingerprintResult.value.provenance.digestSource).toBe("computed");
    expect(localHashCalls).toBe(4);

    const changedIdentityPath = `changed-${entry.identity.path}`;
    const changedIdentityUri = `make-docs://system/${entry.identity.type}/${changedIdentityPath}`;
    const identityResult = resolveSystemResource(
      changedIdentityUri,
      provider,
      context(project, [{
        ...evidence,
        uri: changedIdentityUri,
        localPath: `.make-docs/system/${SYSTEM_RESOURCE_TYPE_DIRECTORIES[entry.identity.type]}/${changedIdentityPath}`,
      }], [initial.value.digestEvidence]),
    );
    expect(identityResult.ok).toBe(false);
    expect(localHashCalls).toBe(4);

    const pathResult = resolveSystemResource(
      entry.identity.uri,
      provider,
      context(project, [{ ...evidence, localPath: "wrong/path.md" }], [initial.value.digestEvidence]),
    );
    expect(pathResult.ok).toBe(false);
    if (!pathResult.ok) expect(pathResult.error.code).toBe("invalid-project-evidence");
    expect(localHashCalls).toBe(4);
  });

  it("recomputes a matching fingerprint before trusting cached digest evidence", () => {
    const provider = createProvider();
    const project = createProject();
    const entry = provider.resources[0];
    const changed = Buffer.from("changed managed bytes\n");
    writeProjection(project, entry, changed);
    const localPath = realpathSync(absoluteProjectionPath(project, entry));
    const stats = statSync(localPath);
    const forged: SystemResourceDigestEvidence = {
      path: localPath,
      fingerprint: {
        size: stats.size,
        mtimeMs: stats.mtimeMs,
        ctimeMs: stats.ctimeMs,
        device: stats.dev,
        inode: stats.ino,
      },
      digest: entry.digest,
    };

    const result = resolveSystemResource(
      entry.identity.uri,
      provider,
      context(project, [managedEvidence(provider, entry)], [forged]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code, result.error.message).toBe("resource-conflict");
  });

  it("returns identical typed results and revalidates unchanged digest evidence", () => {
    const provider = createProvider();
    const project = createProject();
    const entry = provider.resources[0];
    writeProjection(project, entry, entry.readContent());
    const evidence = managedEvidence(provider, entry);

    const initial = resolveSystemResource(entry.identity.uri, provider, context(project, [evidence]));
    expect(initial.ok).toBe(true);
    if (!initial.ok || !initial.value.digestEvidence) return;
    expect(initial.value.provenance.digestSource).toBe("computed");

    const cached: SystemResourceDigestEvidence[] = [initial.value.digestEvidence];
    const second = resolveSystemResource(
      entry.identity.uri,
      provider,
      context(project, [evidence], cached),
    );
    const third = resolveSystemResource(
      entry.identity.uri,
      provider,
      context(project, [evidence], cached),
    );
    expect(second).toEqual(third);
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.value.provenance.digestSource).toBe("reused");
  });
});

function createProvider(): SystemResourceProviderInventory {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-provider-"));
  tempRoots.push(root);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  const resourceTypes = SYSTEM_RESOURCE_TYPES.map((type) => ({
    type,
    sourceRoot: `.make-docs/${SYSTEM_RESOURCE_TYPE_DIRECTORIES[type]}/system`,
    include: ["*.md"],
    exclude: ["AGENTS.md", "CLAUDE.md"],
  }));
  writeFileSync(
    path.join(root, ".make-docs/system-resources.catalog.json"),
    JSON.stringify({
      schemaVersion: 1,
      pathBase: "template-root",
      identityTemplate: "make-docs://system/{type}/{path}",
      defaultMediaType: "text/markdown; charset=utf-8",
      resourceTypes,
    }),
  );
  for (const type of SYSTEM_RESOURCE_TYPES) {
    const directory = path.join(root, ".make-docs", SYSTEM_RESOURCE_TYPE_DIRECTORIES[type], "system");
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, `${type}.md`), `${type} content\n`);
  }
  const result = loadSystemResourceProvider({
    root,
    packageName: "fixture",
    version: "1.0.0",
    immutableRef: "fixture@1.0.0",
    source: "test",
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

function createProject(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-project-"));
  tempRoots.push(root);
  return root;
}

function context(
  projectRoot: string,
  evidence: readonly SystemResourceProjectEvidence[] = [],
  digestEvidence?: readonly SystemResourceDigestEvidence[],
): SystemResourceProjectContext {
  return { projectRoot, evidence, digestEvidence };
}

function providerEntry(
  provider: SystemResourceProviderInventory,
  type: SystemResourceType,
): SystemResourceProviderEntry {
  const entry = provider.resources.find((candidate) => candidate.identity.type === type);
  if (!entry) throw new Error(`Missing ${type} fixture.`);
  return entry;
}

function managedEvidence(
  provider: SystemResourceProviderInventory,
  entry: SystemResourceProviderEntry,
): SystemResourceProjectEvidence {
  return {
    uri: entry.identity.uri,
    selected: true,
    ownership: "managed-projection",
    expectedDigest: entry.digest,
    providerImmutableRef: provider.provider.identity.immutableRef,
    localPath: projectionPath(entry),
  };
}

function projectionPath(entry: SystemResourceProviderEntry): string {
  return `.make-docs/system/${SYSTEM_RESOURCE_TYPE_DIRECTORIES[entry.identity.type]}/${entry.identity.path}`;
}

function absoluteProjectionPath(project: string, entry: SystemResourceProviderEntry): string {
  return path.join(project, ...projectionPath(entry).split("/"));
}

function writeProjection(
  project: string,
  entry: SystemResourceProviderEntry,
  content: Uint8Array,
): void {
  const filePath = absoluteProjectionPath(project, entry);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function digest(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}
