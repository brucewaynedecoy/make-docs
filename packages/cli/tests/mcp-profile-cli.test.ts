import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { runCli } from "../src/cli";
import { MCP_SERVER_PROFILES } from "../src/operations/mcp-metadata";

const { runMcpServerMock } = vi.hoisted(() => ({ runMcpServerMock: vi.fn() }));
vi.mock("../src/mcp/server", () => ({ runMcpServer: runMcpServerMock }));

describe("MCP CLI profile selection", () => {
  beforeEach(() => { runMcpServerMock.mockReset(); });
  afterEach(() => { vi.restoreAllMocks(); });

  test("keeps the existing launch command on all", async () => {
    await runCli(["mcp"]);
    expect(runMcpServerMock).toHaveBeenCalledExactlyOnceWith({ profile: "all" });
  });

  test.each(MCP_SERVER_PROFILES)("passes the selected %s profile to stdio startup", async (profile) => {
    await runCli(["mcp", "--profile", profile]);
    expect(runMcpServerMock).toHaveBeenCalledExactlyOnceWith({ profile });
  });

  test.each([
    ["--help"], ["-h"], ["--profile", "backlog", "--help"],
    ["--help", "--profile", "core"],
  ])("shows profile choices and the default without starting a server: %j", async (...args) => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await runCli(["mcp", ...args]);
    const help = write.mock.calls.map(([chunk]) => String(chunk)).join("");
    expect(help).toContain("make-docs mcp [--profile <name>] [--help]");
    expect(help).toContain("Default: all");
    for (const profile of MCP_SERVER_PROFILES) expect(help).toContain(profile);
    expect(help).toContain("make-docs mcp --profile backlog");
    expect(runMcpServerMock).not.toHaveBeenCalled();
  });

  test.each(["unknown", "CORE", "core,setup", "", " all "])("rejects invalid profile %j before startup", async (profile) => {
    await expect(runCli(["mcp", "--profile", profile]))
      .rejects.toThrow(`Allowed profiles: ${MCP_SERVER_PROFILES.join(", ")}`);
    expect(runMcpServerMock).not.toHaveBeenCalled();
  });

  test.each([[], ["--help"], ["--profile", "core"]])("rejects a missing profile name: %j", async (...tail) => {
    await expect(runCli(["mcp", "--profile", ...tail])).rejects.toThrow("--profile requires a name");
    expect(runMcpServerMock).not.toHaveBeenCalled();
  });

  test("rejects repeated profile selection", async () => {
    await expect(runCli(["mcp", "--profile", "core", "--profile", "setup"]))
      .rejects.toThrow("--profile can be supplied only once");
    expect(runMcpServerMock).not.toHaveBeenCalled();
  });

  test.each(["--target", "--json", "--yes", "--dry-run", "--profile=core", "extra"])("keeps unrelated argument %s off the stdio path", async (arg) => {
    await expect(runCli(["mcp", "--profile", "core", arg])).rejects.toThrow(`Unknown argument: ${arg}`);
    expect(runMcpServerMock).not.toHaveBeenCalled();
  });

  test("does not ignore an invalid profile when help is requested", async () => {
    await expect(runCli(["mcp", "--help", "--profile", "unknown"]))
      .rejects.toThrow(/profile/i);
    expect(runMcpServerMock).not.toHaveBeenCalled();
  });
});
