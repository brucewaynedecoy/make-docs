import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";
import { getMakeDocsConfigPath, loadMakeDocsConfig } from "../src/config";
import { GENERATED_DOCUMENT_KINDS, validateGeneratedDocumentMetadata } from "../src/document-metadata";
import { createMakeDocsMcpServer } from "../src/mcp/server";
import { deriveMcpToolName } from "../src/mcp/tools";
import { getOperation, listOperations } from "../src/operations/registry";

// Literal P3 baseline. It must not derive from the candidate registry.
const retired = [
  "playbook.validate", "playbook.catalog", "playbook.resolve", "playbook.capabilities",
  "playbook.start", "playbook.invoke", "playbook.status", "playbook.next",
  "playbook.advance", "playbook.gate", "playbook.resume", "playbook.close",
  "playbook.run.export", "playbook.run.import", "package.plan", "package.surface-resolve",
  "package.write", "package.ship",
];
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe("P8 runtime retirement", () => {
  it("removes the frozen public registry while preserving current replacement operations", () => {
    expect(listOperations()).toHaveLength(25);
    for (const id of retired) expect(() => getOperation(id)).toThrow("Unknown operation identifier");
    for (const id of ["resource.list", "project.surface.ensure", "lifecycle.start", "uat.persona.resolve"]) {
      expect(getOperation(id).status).toBe("active");
      expect(getOperation(id).handler).toBeTypeOf("function");
    }
  });

  it("refuses every retired route and preview spelling through the real CLI entry", () => {
    for (const id of [...retired, "package.preview", "protocol.catalog"]) {
      const result = spawnSync(process.execPath, ["--import", "tsx", "src/index.ts", "run", ...id.split(".")], {
        cwd: packageRoot, encoding: "utf8",
      });
      expect(result.status, id).toBe(1);
      expect(result.stderr, id).toContain("Unknown make-docs run operation");
    }
    const help = spawnSync(process.execPath, ["--import", "tsx", "src/index.ts", "run", "--help"], {
      cwd: packageRoot, encoding: "utf8",
    });
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("lifecycle start");
    expect(help.stdout).not.toMatch(/playbook|protocol|package preview/i);
  }, 20000);

  it("omits and refuses the frozen tools through the MCP SDK transport", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createMakeDocsMcpServer();
    const client = new Client({ name: "p8-retirement-test", version: "1.0.0" });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    try {
      const names = (await client.listTools()).tools.map((tool) => tool.name);
      for (const id of retired) {
        const name = deriveMcpToolName(id);
        expect(names).not.toContain(name);
        const result = await client.callTool({ name, arguments: {} });
        expect(result.isError, name).toBe(true);
      }
      expect(names).toContain("make_docs_lifecycle_start");
      expect(names).toContain("make_docs_uat_persona_resolve");
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("reads current Persona config beside opaque retired fields without rewriting it", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "p8-config-")); roots.push(root);
    const configPath = getMakeDocsConfigPath(root);
    mkdirSync(path.dirname(configPath), { recursive: true });
    const source = "packaging: [opaque, legacy]\nlabels:\n  lifecycle:\n    playbook: {old: shape}\n  documentKinds:\n    protocol: old\npersonas:\n  - slug: reader\n    label: Reader\n    description: Reads the product.\n    primitive: user\nharnessCapabilities:\n  - harness: codex\n    reviewStatus: reviewed\n    capabilities:\n      parallel_playbook_runs: opaque\n      subagent_delegation: true\n";
    writeFileSync(configPath, source);
    const loaded = loadMakeDocsConfig(root);
    expect(loaded.valid).toBe(true);
    expect(loaded.config.personas.some((persona) => persona.slug === "reader")).toBe(true);
    expect(loaded.config).not.toHaveProperty("packaging");
    expect(loaded.config.labels.lifecycle).not.toHaveProperty("playbook");
    expect(loaded.config.harnessCapabilities[0]?.capabilities).toEqual({ subagent_delegation: true });
    expect(readFileSync(configPath, "utf8")).toBe(source);
  });

  it("defines no current Playbook or Protocol document kind", () => {
    expect(GENERATED_DOCUMENT_KINDS).not.toContain("playbook");
    expect(GENERATED_DOCUMENT_KINDS).not.toContain("protocol");
    for (const kind of ["playbook", "protocol"]) {
      expect(validateGeneratedDocumentMetadata(`---\nkind: ${kind}\n---\nBody\n`)).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: "invalid-kind" })]),
      );
    }
  });
});
