import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMakeDocsMcpServer } from "../src/mcp/server";
import { getOperation } from "../src/operations/registry";

describe("backlog current-chat action surface", () => {
  it.each(["backlog", "all"] as const)("has no request resolver or task prompt in %s", async profile => {
    const server = createMakeDocsMcpServer({ profile });
    // A second prompt must retain the SDK's normal registered-prompt dispatch.
    server.registerPrompt("ordinary_prompt", { description: "Test ordinary SDK dispatch." }, () => ({
      messages: [{ role: "user", content: { type: "text", text: "Ordinary prompt." } }],
    }));
    const client = new Client({ name: "backlog-action-surface-test", version: "1" });
    const [left, right] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(right), client.connect(left)]);
    try {
      const tools = (await client.listTools()).tools.map(tool => tool.name);
      expect(tools).toContain("backlog_review_open");
      expect(tools).toContain("backlog_review_refresh");
      expect(tools).not.toContain("make_docs_backlog_review_request_resolve");
      expect((await client.listPrompts()).prompts.map(prompt => prompt.name)).toEqual(["ordinary_prompt"]);
      expect(await client.getPrompt({ name: "ordinary_prompt" })).toMatchObject({
        messages: [{ role: "user", content: { type: "text", text: "Ordinary prompt." } }],
      });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("has no canonical request-resolve operation", () => {
    expect(() => getOperation("backlog.review.request-resolve")).toThrow();
  });
});
