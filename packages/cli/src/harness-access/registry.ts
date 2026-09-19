import type {
  HarnessAdapter,
  HarnessConnectionMethod,
  HarnessMethodSelection,
  HarnessMethodDefinition,
  HarnessScope,
} from "./contract";
import { createHarnessAdapter } from "./native";

function method(
  id: HarnessConnectionMethod,
  nativeFormat: HarnessMethodDefinition["nativeFormat"],
  nativeFile: (scope: HarnessScope) => string,
  options: {
    ownedEntry: string;
    requiresCommandRules?: boolean;
    availability?: HarnessMethodDefinition["availability"];
    blocker?: string | null;
    nextAction?: string;
  },
): HarnessMethodDefinition {
  return Object.freeze({
    id,
    scopes: Object.freeze(["machine", "project"] as const),
    nativeFormat,
    requiresExecutable: true,
    requiresCommandRules: options.requiresCommandRules ?? false,
    nativeFile,
    ownedEntries: Object.freeze([options.ownedEntry]),
    allowedStoreOperations: options.requiresCommandRules
      ? "bounded-command-rule-registry"
      : "active-operation-registry",
    implementationState: "implemented",
    availability: options.availability ?? "available",
    blocker: options.blocker ?? null,
    nextAction: options.nextAction ?? "Review this method, then apply the grouped setup plan",
  });
}

export const CODEX_HARNESS_ADAPTER = createHarnessAdapter({
  id: "make-docs.codex",
  version: 1,
  harnessId: "codex",
  displayName: "Codex",
  executableNames: Object.freeze(["codex"]),
  projectRouterFiles: Object.freeze(["AGENTS.md"]),
  skillRoots: Object.freeze([".agents/skills", ".codex/skills"]),
  methods: Object.freeze([
    method("mcp", "codex-mcp-toml", () => ".codex/config.toml", {
      ownedEntry: "mcp_servers.make_docs",
    }),
    method(
      "command-rules",
      "codex-command-rules",
      () => ".codex/rules/make-docs.rules",
      { ownedEntry: "make-docs.command-rules", requiresCommandRules: true },
    ),
  ]),
});

export const CLAUDE_CODE_HARNESS_ADAPTER = createHarnessAdapter({
  id: "make-docs.claude-code",
  version: 1,
  harnessId: "claude-code",
  displayName: "Claude Code",
  executableNames: Object.freeze(["claude"]),
  projectRouterFiles: Object.freeze(["CLAUDE.md"]),
  skillRoots: Object.freeze([".claude/skills"]),
  methods: Object.freeze([
    method(
      "mcp",
      "claude-mcp-json",
      scope => (scope === "machine" ? ".claude.json" : ".mcp.json"),
      { ownedEntry: "mcpServers.make-docs" },
    ),
    method(
      "permission-rules",
      "claude-permission-json",
      () => ".claude/settings.json",
      {
        ownedEntry: "permissions.allow.make-docs",
        requiresCommandRules: true,
        availability: "blocked",
        blocker:
          "Claude Code does not select or preserve the exact receipt-bound Make Docs command for permission-rule matching.",
        nextAction:
          "Use Claude Code MCP setup while Make Docs evaluates a shorter safe command carrier",
      },
    ),
  ]),
});

export const FIRST_PARTY_HARNESS_ADAPTERS: readonly HarnessAdapter[] = Object.freeze([
  CODEX_HARNESS_ADAPTER,
  CLAUDE_CODE_HARNESS_ADAPTER,
]);

export const PI_HARNESS_SUPPORT = Object.freeze({
  harnessId: "pi" as const,
  state: "unsupported" as const,
  publicSupportClaim: false as const,
  reason:
    "Make Docs does not ship a first-party Pi adapter.",
});

export function getFirstPartyHarnessAdapter(harnessId: string): HarnessAdapter | undefined {
  return FIRST_PARTY_HARNESS_ADAPTERS.find(adapter => adapter.harnessId === harnessId);
}

export function requireFirstPartyHarnessAdapter(harnessId: string): HarnessAdapter {
  const adapter = getFirstPartyHarnessAdapter(harnessId);
  if (!adapter) throw new Error(`No admitted first-party harness adapter exists for ${harnessId}.`);
  return adapter;
}

export function validateHarnessMethodSelection(input: {
  harnessId: string;
  method: HarnessMethodSelection;
  scope?: HarnessScope;
}): HarnessMethodDefinition | null {
  const adapter = requireFirstPartyHarnessAdapter(input.harnessId);
  if (input.method === "none") return null;
  const method = adapter.methods.find(candidate => candidate.id === input.method);
  if (!method || (input.scope && !method.scopes.includes(input.scope))) {
    const scope = input.scope ? ` for ${input.scope} scope` : "";
    throw new Error(`${adapter.displayName} does not admit ${input.method}${scope}.`);
  }
  return method;
}
