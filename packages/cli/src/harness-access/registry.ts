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
  requiresCommandRules = false,
): HarnessMethodDefinition {
  return Object.freeze({
    id,
    scopes: Object.freeze(["machine", "project"] as const),
    nativeFormat,
    requiresExecutable: true,
    requiresCommandRules,
    nativeFile,
    admittedOperations: "operation-registry-derived",
    accessRequirements: "operation-registry-derived",
    implementationState: "implemented",
    publicSupportClaim: false,
    conformanceState: "not-run",
  });
}

export const CODEX_HARNESS_ADAPTER = createHarnessAdapter({
  id: "make-docs.codex",
  version: 1,
  harnessId: "codex",
  displayName: "Codex",
  projectRouterFiles: Object.freeze(["AGENTS.md"]),
  skillRoots: Object.freeze([".agents/skills", ".codex/skills"]),
  methods: Object.freeze([
    method("mcp", "codex-mcp-toml", () => ".codex/config.toml"),
    method(
      "command-rules",
      "codex-command-rules",
      () => ".codex/rules/make-docs.rules",
      true,
    ),
  ]),
});

export const CLAUDE_CODE_HARNESS_ADAPTER = createHarnessAdapter({
  id: "make-docs.claude-code",
  version: 1,
  harnessId: "claude-code",
  displayName: "Claude Code",
  projectRouterFiles: Object.freeze(["CLAUDE.md"]),
  skillRoots: Object.freeze([".claude/skills"]),
  methods: Object.freeze([
    method(
      "mcp",
      "claude-mcp-json",
      scope => (scope === "machine" ? ".claude.json" : ".mcp.json"),
    ),
    method(
      "permission-rules",
      "claude-permission-json",
      () => ".claude/settings.json",
      true,
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
    "No first-party Make Docs Pi extension has passed lifecycle, installed-product, and real Pi conformance.",
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
