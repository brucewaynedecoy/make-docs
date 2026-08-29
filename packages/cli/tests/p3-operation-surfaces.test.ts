import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../src/cli";
import {
  callMakeDocsMcpTool,
  deriveMcpToolName,
  MAKE_DOCS_MCP_TOOLS,
} from "../src/mcp/tools";
import { listNativeMcpResources, readNativeMcpResource } from "../src/mcp/resources";
import { createMakeDocsMcpServer } from "../src/mcp/server";
import {
  createExecutionContext,
  OperationApprovalRequiredError,
  OperationPendingError,
  OperationWriteDeniedError,
} from "../src/operations/context";
import {
  ADMITTED_OPERATION_IDS,
  getOperation,
  invokeOperation,
  LEGACY_COMPATIBILITY_OPERATION_IDS,
  listAdmittedOperations,
  operationCliCommand,
} from "../src/operations/registry";
import { runCliEntry } from "../src/run/entry";
import {
  __setResourceOperationRuntimeForTests,
  loadSystemResourceProvider,
  ResourceOperationError,
  SYSTEM_RESOURCE_ENSURE_APPROVAL,
  SYSTEM_RESOURCE_TYPES,
  SYSTEM_RESOURCE_TYPE_DIRECTORIES,
  type SystemResourceProjectContext,
  type SystemResourceProviderEntry,
  type SystemResourceProviderInventory,
} from "../src/operations/resource";

const tempRoots: string[] = [];

afterEach(() => {
  __setResourceOperationRuntimeForTests(null);
  vi.restoreAllMocks();
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("W19 R1 P3 admitted operation surfaces", () => {
  it("pins the exact 24-ID inventory and current P4 activation split", () => {
    const admitted = listAdmittedOperations();
    expect(admitted.map((entry) => entry.id)).toEqual([...ADMITTED_OPERATION_IDS]);
    expect(admitted).toHaveLength(24);
    expect(admitted.filter((entry) => entry.status === "active")).toHaveLength(8);
    expect(admitted.filter((entry) => entry.status === "pending")).toHaveLength(16);

    for (const entry of admitted) {
      expect(typeof getOperation(entry.id).handler).toBe(
        entry.status === "active" ? "function" : "undefined",
      );
      expect(operationCliCommand(entry.id)).toBe(entry.cli.command);
    }

    expect(operationCliCommand("resource.list")).toBe("make-docs resource list");
    expect(operationCliCommand("resource.read")).toBe("make-docs resource read <uri>");
    expect(operationCliCommand("resource.ensure")).toBe("make-docs resource ensure <uri>");
    expect(operationCliCommand("project.surface.ensure")).toBe(
      "make-docs project surface ensure <archive|artifacts|assets>",
    );
    expect(operationCliCommand("uat.evidence-reference.validate")).toBe(
      "make-docs run uat evidence-reference validate",
    );

    const lineages = Object.fromEntries(
      admitted
        .filter((entry) => entry.status === "pending")
        .map((entry) => [entry.id, entry.pendingLineage]),
    );
    expect(lineages["project.surface.ensure"]).toBeUndefined();
    expect(Object.entries(lineages).filter(([id]) => id.startsWith("lifecycle."))).toHaveLength(10);
    expect(Object.entries(lineages).filter(([id]) => id.startsWith("uat."))).toHaveLength(6);
    expect(new Set(Object.entries(lineages).filter(([id]) => id.startsWith("lifecycle.")).map(([, value]) => value))).toEqual(new Set(["W19 R1 P6"]));
    expect(new Set(Object.entries(lineages).filter(([id]) => id.startsWith("uat.")).map(([, value]) => value))).toEqual(new Set(["W19 R1 P7"]));
  });

  it("keeps the 14 Playbook and four Playbook-package registry projections frozen", () => {
    expect(LEGACY_COMPATIBILITY_OPERATION_IDS).toHaveLength(18);
    expect(LEGACY_COMPATIBILITY_OPERATION_IDS.filter((id) => id.startsWith("playbook."))).toHaveLength(14);
    expect(LEGACY_COMPATIBILITY_OPERATION_IDS.filter((id) => id.startsWith("package."))).toHaveLength(4);
    expect(LEGACY_COMPATIBILITY_OPERATION_IDS.some((id) => id.startsWith("protocol."))).toBe(false);
    for (const id of LEGACY_COMPATIBILITY_OPERATION_IDS) {
      expect(operationCliCommand(id)).toBe(`make-docs run ${id.split(".").join(" ")}`);
      expect(deriveMcpToolName(id)).toBe(`make_docs_${id.replace(/[.-]/g, "_")}`);
    }
  });

  it("returns typed pending and unknown-ID failures", async () => {
    const pending = invokeOperation(
      "lifecycle.start",
      {},
      createExecutionContext({ surface: "test", writesAllowed: true }),
    );
    await expect(pending).rejects.toBeInstanceOf(OperationPendingError);
    await expect(pending).rejects.toMatchObject({
      code: "operation-pending",
      operation: "lifecycle.start",
      pendingLineage: "W19 R1 P6",
      handlerAvailable: false,
    });
    await expect(runCli(["project", "surface", "ensure", "assets"])).rejects.toThrow(
      "trusted P4 manifest evidence",
    );
    expect(() => getOperation("unknown.operation")).toThrow("Unknown operation identifier");
  });

  it("preserves typed pending fields through every CLI and MCP projection", async () => {
    const pending = listAdmittedOperations().filter((entry) => entry.status === "pending");
    expect(pending).toHaveLength(16);

    for (const operation of pending) {
      let stderr = "";
      const exitCode = await runCliEntry(runCli, pendingCliArgs(operation.cli.command), {
        machineReadable: true,
        writeError: (value) => {
          stderr += value;
        },
      });
      expect(exitCode, operation.id).toBe(1);
      expect(JSON.parse(stderr), operation.id).toMatchObject({
        ok: false,
        code: "operation-pending",
        operation: operation.id,
        pendingLineage: operation.pendingLineage,
        handlerAvailable: false,
      });
    }

    let humanError = "";
    await runCliEntry(runCli, ["project", "surface", "ensure", "assets"], {
      machineReadable: false,
      writeError: (value) => {
        humanError += value;
      },
    });
    expect(humanError).toBe(
      "This project does not have trusted P4 manifest evidence. Run `make-docs setup reconfigure` before you ensure a project surface.\n",
    );

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createMakeDocsMcpServer();
    const client = new Client({ name: "p3-pending-test", version: "1.0.0" });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    for (const operation of pending) {
      const result = await client.callTool({
        name: deriveMcpToolName(operation.id),
        arguments: operation.id === "project.surface.ensure" ? { surface: "assets" } : {},
      });
      expect(result.isError, operation.id).toBe(true);
      expect(result.structuredContent, operation.id).toMatchObject({
        code: "operation-pending",
        operation: operation.id,
        pendingLineage: operation.pendingLineage,
        handlerAvailable: false,
      });
    }
    await client.close();
    await server.close();
  });

  it("keeps CLI, derived MCP tools, and native MCP resources byte- and provenance-equivalent", async () => {
    const provider = createProvider();
    const project = createProject();
    __setResourceOperationRuntimeForTests(() => ({ provider, project: projectContext(project) }));

    const directList = await invokeOperation(
      "resource.list",
      { targetRoot: project },
      createExecutionContext({ surface: "cli", cwd: project }),
    );
    const toolList = await callMakeDocsMcpTool("make_docs_resource_list", { targetRoot: project });
    expect(toolList.result).toEqual(directList.value);

    const nativeList = await listNativeMcpResources(project);
    const directUris = (directList.value as { resources: Array<{ uri: string }> }).resources.map(
      (entry) => entry.uri,
    );
    expect(nativeList.resources.map((entry) => entry.uri)).toEqual(directUris);
    expect(directUris).toHaveLength(4);

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createMakeDocsMcpServer();
    const client = new Client({ name: "p3-test", version: "1.0.0" });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const protocolList = await client.listResources({});
    expect(protocolList.resources.map((entry) => entry.uri)).toEqual(directUris);

    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await runCli(["resource", "list", "--target", project, "--format", "json"]);
    const cliList = JSON.parse(stdout.mock.calls.map(([chunk]) => String(chunk)).join(""));
    expect(cliList).toEqual(directList.value);
    stdout.mockClear();

    for (const type of SYSTEM_RESOURCE_TYPES) {
      const entry = provider.resources.find((candidate) => candidate.identity.type === type)!;
      const directRead = await invokeOperation(
        "resource.read",
        { uri: entry.identity.uri, targetRoot: project },
        createExecutionContext({ surface: "cli", cwd: project }),
      );
      const toolRead = await callMakeDocsMcpTool("make_docs_resource_read", {
        uri: entry.identity.uri,
        targetRoot: project,
      });
      expect(toolRead.result).toEqual(directRead.value);
      await runCli([
        "resource",
        "read",
        entry.identity.uri,
        "--target",
        project,
        "--format",
        "json",
      ]);
      expect(
        JSON.parse(stdout.mock.calls.map(([chunk]) => String(chunk)).join("")),
      ).toEqual(directRead.value);
      stdout.mockClear();

      const nativeRead = await readNativeMcpResource(entry.identity.uri, project);
      const resource = (directRead.value as { resource: Record<string, unknown> & { content: { data: string }; mediaType: string; provenance: unknown } }).resource;
      expect(nativeRead.contents[0]).toMatchObject({
        uri: entry.identity.uri,
        mimeType: resource.mediaType,
        blob: resource.content.data,
        _meta: { makeDocs: expect.objectContaining({ provenance: resource.provenance }) },
      });
      const protocolRead = await client.readResource({ uri: entry.identity.uri });
      expect(protocolRead.contents[0]).toMatchObject({
        uri: entry.identity.uri,
        mimeType: resource.mediaType,
        blob: resource.content.data,
      });
    }

    await client.close();
    await server.close();

    expect(existsSync(path.join(project, ".make-docs"))).toBe(false);
  });

  it("implements resource filters, origins, table, raw, and JSON modes", async () => {
    const provider = createProvider();
    const project = createProject();
    const contract = provider.resources.find((entry) => entry.identity.type === "contract")!;
    const overrideBytes = Buffer.from("local contract bytes\n");
    const relativePath = projectionPath(contract);
    mkdirSync(path.dirname(path.join(project, relativePath)), { recursive: true });
    writeFileSync(path.join(project, relativePath), overrideBytes);
    const overrideEvidence = {
      ...managedEvidence(provider, contract),
      ownership: "project-override" as const,
      expectedDigest: createHash("sha256").update(overrideBytes).digest("hex"),
    };
    __setResourceOperationRuntimeForTests(() => ({
      provider,
      project: projectContext(project, [overrideEvidence]),
    }));

    const listTool = MAKE_DOCS_MCP_TOOLS.find((tool) => tool.name === "make_docs_resource_list")!;
    const readTool = MAKE_DOCS_MCP_TOOLS.find((tool) => tool.name === "make_docs_resource_read")!;
    expect(Object.keys(listTool.inputSchema)).toEqual(
      expect.arrayContaining(["origin", "prefix", "targetRoot", "type"]),
    );
    expect(Object.keys(readTool.inputSchema)).toEqual(
      expect.arrayContaining(["origin", "targetRoot", "uri"]),
    );
    expect(listTool.inputSchema).not.toHaveProperty("format");
    expect(readTool.inputSchema).not.toHaveProperty("format");

    const mcpLocalList = await callMakeDocsMcpTool("make_docs_resource_list", {
      targetRoot: project,
      type: "contract",
      prefix: contract.identity.path,
      origin: "local",
    });
    expect(mcpLocalList.result).toMatchObject({ schemaVersion: 1, origin: "local" });
    expect(
      (mcpLocalList.result as { resources: Array<{ result: { value: { origin: string } } }> })
        .resources,
    ).toEqual([
      expect.objectContaining({
        result: expect.objectContaining({
          value: expect.objectContaining({ origin: "project-override" }),
        }),
      }),
    ]);

    const mcpInstalledRead = await callMakeDocsMcpTool("make_docs_resource_read", {
      uri: contract.identity.uri,
      targetRoot: project,
      origin: "installed",
    });
    expect(mcpInstalledRead.result).toMatchObject({
      schemaVersion: 1,
      origin: "installed",
      resource: {
        origin: "installed-machine",
        content: { data: Buffer.from("contract bytes\n").toString("base64") },
      },
    });

    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await runCli(["resource", "list", "--target", project]);
    const table = stdout.mock.calls.map(([chunk]) => String(chunk)).join("");
    expect(table).toContain("TYPE\tURI\tORIGIN\tSTATE");
    expect(table).toContain(`${contract.identity.uri}\tproject-override\texplicit-override`);
    stdout.mockClear();

    await runCli([
      "resource",
      "list",
      "--target",
      project,
      "--type",
      "contract",
      "--prefix",
      contract.identity.path,
      "--origin",
      "local",
      "--format",
      "json",
    ]);
    const localList = JSON.parse(stdout.mock.calls.map(([chunk]) => String(chunk)).join(""));
    expect(localList).toMatchObject({ schemaVersion: 1, origin: "local" });
    expect(localList.resources).toHaveLength(1);
    expect(localList.resources[0].result.value.origin).toBe("project-override");
    stdout.mockClear();

    await runCli([
      "resource",
      "list",
      "--target",
      project,
      "--origin",
      "installed",
      "--format",
      "json",
    ]);
    const installedList = JSON.parse(stdout.mock.calls.map(([chunk]) => String(chunk)).join(""));
    expect(installedList.resources).toHaveLength(4);
    expect(
      installedList.resources.every(
        (entry: { result: { value: { origin: string } } }) =>
          entry.result.value.origin === "installed-machine",
      ),
    ).toBe(true);
    stdout.mockClear();

    await runCli(["resource", "read", contract.identity.uri, "--target", project]);
    expect(Buffer.concat(stdout.mock.calls.map(([chunk]) => Buffer.from(chunk as Uint8Array)))).toEqual(
      overrideBytes,
    );
    stdout.mockClear();

    await runCli([
      "resource",
      "read",
      contract.identity.uri,
      "--target",
      project,
      "--origin",
      "installed",
    ]);
    expect(Buffer.concat(stdout.mock.calls.map(([chunk]) => Buffer.from(chunk as Uint8Array)))).toEqual(
      Buffer.from("contract bytes\n"),
    );
    stdout.mockClear();

    await runCli([
      "resource",
      "read",
      contract.identity.uri,
      "--target",
      project,
      "--origin",
      "local",
      "--format",
      "json",
    ]);
    const localRead = JSON.parse(stdout.mock.calls.map(([chunk]) => String(chunk)).join(""));
    expect(localRead).toMatchObject({
      schemaVersion: 1,
      origin: "local",
      resource: {
        origin: "project-override",
        provenance: { source: "project-override" },
        content: { data: overrideBytes.toString("base64") },
      },
    });
  });

  it("rejects invalid resource formats and command-specific flags", async () => {
    await expect(runCli(["resource", "list", "--format", "raw"])).rejects.toThrow(
      "Resource list format must be table or json",
    );
    await expect(
      runCli(["resource", "read", "make-docs://system/contract/x.md", "--format", "table"]),
    ).rejects.toThrow("Resource read format must be raw or json");
    await expect(runCli(["resource", "list", "--json"])).rejects.toThrow("Unknown option");
    await expect(
      runCli(["resource", "read", "make-docs://system/contract/x.md", "--type", "contract"]),
    ).rejects.toThrow("not valid for resource read");
    await expect(
      runCli([
        "resource",
        "ensure",
        "make-docs://system/contract/x.md",
        "--origin",
        "local",
      ]),
    ).rejects.toThrow("not valid for resource ensure");
    await expect(runCli(["resource", "list", "--origin", "remote"])).rejects.toThrow(
      "requires effective, local, or installed",
    );
  });

  it("enforces ensure write permission, approval, and stable failure codes", async () => {
    const provider = createProvider();
    const project = createProject();
    const entry = provider.resources[0]!;
    const secondEntry = provider.resources[1]!;
    const projectState = projectContext(
      project,
      provider.resources.map((candidate) => managedEvidence(provider, candidate)),
    );
    __setResourceOperationRuntimeForTests(() => ({ provider, project: projectState }));
    const input = { uri: entry.identity.uri, targetRoot: project };

    await expect(
      runCli(["resource", "ensure", entry.identity.uri, "--target", project]),
    ).rejects.toBeInstanceOf(OperationWriteDeniedError);

    await expect(
      invokeOperation("resource.ensure", input, createExecutionContext({ surface: "test" })),
    ).rejects.toBeInstanceOf(OperationWriteDeniedError);
    await expect(
      invokeOperation(
        "resource.ensure",
        input,
        createExecutionContext({ surface: "test", writesAllowed: true }),
      ),
    ).rejects.toBeInstanceOf(OperationApprovalRequiredError);

    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await runCli([
      "resource",
      "ensure",
      entry.identity.uri,
      "--target",
      project,
      "--allow-write",
      "--approve",
      SYSTEM_RESOURCE_ENSURE_APPROVAL,
    ]);
    expect(JSON.parse(stdout.mock.calls.map(([chunk]) => String(chunk)).join(""))).toMatchObject({
      action: "created",
    });
    expect(existsSync(path.join(project, projectionPath(entry)))).toBe(true);

    const secondInput = { uri: secondEntry.identity.uri, targetRoot: project };
    await expect(
      callMakeDocsMcpTool("make_docs_resource_ensure", secondInput),
    ).rejects.toBeInstanceOf(OperationWriteDeniedError);
    await expect(
      callMakeDocsMcpTool("make_docs_resource_ensure", {
        ...secondInput,
        allowWrite: true,
      }),
    ).rejects.toBeInstanceOf(OperationApprovalRequiredError);
    const mcpEnsured = await callMakeDocsMcpTool("make_docs_resource_ensure", {
      ...secondInput,
      allowWrite: true,
      approvals: [SYSTEM_RESOURCE_ENSURE_APPROVAL],
    });
    expect(mcpEnsured.result).toMatchObject({ action: "created" });
    expect(existsSync(path.join(project, projectionPath(secondEntry)))).toBe(true);

    const missing = invokeOperation(
      "resource.read",
      { uri: "make-docs://system/contract/missing.md", targetRoot: project },
      createExecutionContext({ surface: "test" }),
    );
    await expect(missing).rejects.toBeInstanceOf(ResourceOperationError);
    await expect(missing).rejects.toMatchObject({ code: "resource-not-found" });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createMakeDocsMcpServer();
    const client = new Client({ name: "p3-failure-test", version: "1.0.0" });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    await expect(
      client.readResource({ uri: "make-docs://system/contract/missing.md" }),
    ).rejects.toMatchObject({
      code: ErrorCode.InvalidParams,
      data: {
        makeDocs: expect.objectContaining({
          code: "resource-not-found",
          uri: "make-docs://system/contract/missing.md",
        }),
      },
    });
    await client.close();
    await server.close();
  });
});

function createProvider(): SystemResourceProviderInventory {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-p3-provider-"));
  tempRoots.push(root);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(
    path.join(root, ".make-docs/system-resources.catalog.json"),
    JSON.stringify({
      schemaVersion: 1,
      pathBase: "template-root",
      identityTemplate: "make-docs://system/{type}/{path}",
      defaultMediaType: "text/markdown; charset=utf-8",
      resourceTypes: SYSTEM_RESOURCE_TYPES.map((type) => ({
        type,
        sourceRoot: `.make-docs/${SYSTEM_RESOURCE_TYPE_DIRECTORIES[type]}/system`,
        include: ["*.md"],
        exclude: [],
      })),
    }),
  );
  for (const type of SYSTEM_RESOURCE_TYPES) {
    const directory = path.join(
      root,
      ".make-docs",
      SYSTEM_RESOURCE_TYPE_DIRECTORIES[type],
      "system",
    );
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, `${type}.md`), `${type} bytes\n`);
  }
  const loaded = loadSystemResourceProvider({
    root,
    packageName: "p3-fixture",
    version: "1.0.0",
    immutableRef: "p3-fixture@1.0.0",
    source: "test",
  });
  if (!loaded.ok) throw new Error(loaded.error.message);
  return loaded.value;
}

function createProject(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-p3-project-"));
  tempRoots.push(root);
  return root;
}

function projectContext(
  projectRoot: string,
  evidence: SystemResourceProjectContext["evidence"] = [],
): SystemResourceProjectContext {
  return { projectRoot, evidence };
}

function managedEvidence(
  provider: SystemResourceProviderInventory,
  entry: SystemResourceProviderEntry,
) {
  return {
    uri: entry.identity.uri,
    selected: true,
    ownership: "managed-projection" as const,
    expectedDigest: entry.digest,
    providerImmutableRef: provider.provider.identity.immutableRef,
    localPath: projectionPath(entry),
  };
}

function projectionPath(entry: SystemResourceProviderEntry): string {
  return `.make-docs/system/${SYSTEM_RESOURCE_TYPE_DIRECTORIES[entry.identity.type]}/${entry.identity.path}`;
}

function pendingCliArgs(command: string): string[] {
  return command
    .replace("<archive|artifacts|assets>", "assets")
    .split(" ")
    .slice(1);
}
