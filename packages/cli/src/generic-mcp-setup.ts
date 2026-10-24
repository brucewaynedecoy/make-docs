import os from "node:os";
import path from "node:path";
import {
  sha256,
  verifyMakeDocsExecutable,
  type VerifiedExecutableIdentity,
} from "./harness-access";
import { createMcpConnection, MCP_CONNECTION_ID_ENV, MCP_CONNECTION_KEY_ENV, redactMcpNativeValue } from "./mcp-connection";
import type { ProjectHarnessIntegrationRecord } from "./config";
import {
  loadGlobalConfig,
  writeGlobalConfig,
  type GlobalHarnessIntent,
} from "./store/global-config";
import { resolveStoreRoot } from "./store/paths";
import type { OperationAccess } from "./operations/access";

export type GenericMcpAction = "configure" | "rotate" | "repair" | "remove";

export interface GenericMcpSetupOptions {
  clientLabel: string;
  action?: GenericMcpAction;
  storeRoot?: string;
  machineRoot?: string;
  executable?: VerifiedExecutableIdentity;
}

export interface GenericMcpSetupPlan {
  schemaVersion: 1;
  clientLabel: string;
  harnessId: string;
  action: GenericMcpAction;
  changed: boolean;
  state: "planned" | "current" | "missing";
  accessCeiling: OperationAccess;
  review: string;
  nextAction: string | null;
  /** Present only for a new, rotated, or repaired profile review. */
  configuration: Record<string, unknown> | null;
  configurationDigest: string | null;
  intent: GlobalHarnessIntent | null;
  storeRoot: string;
}

export function validateGenericMcpClientLabel(label: string): string {
  const normalized = label.trim().toLowerCase();
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(normalized) || normalized.length > 48) {
    throw new Error("`--generic-mcp-client` needs a stable lowercase label of 1 to 48 letters, numbers, or single hyphens.");
  }
  return normalized;
}

export function prepareGenericMcpSetup(options: GenericMcpSetupOptions): GenericMcpSetupPlan {
  const clientLabel = validateGenericMcpClientLabel(options.clientLabel);
  const harnessId = `generic-mcp-${clientLabel}`;
  const action = options.action ?? "configure";
  const storeRoot = options.storeRoot ?? resolveStoreRoot();
  const existing = loadGlobalConfig(storeRoot).config.settings.harnesses[harnessId];
  const active = isCurrentGenericIntent(existing, clientLabel);
  const accessCeiling: OperationAccess = existing?.accessCeiling
    ? { ...existing.accessCeiling }
    : { store: "write", project: "write", hostConfig: "none" };

  if (action === "remove") {
    const enabled = Boolean(existing?.selected || existing?.mcpConnection?.active);
    return {
      schemaVersion: 1,
      clientLabel,
      harnessId,
      action,
      changed: enabled,
      state: enabled ? "planned" : "missing",
      accessCeiling,
      review: enabled
        ? `Remove the Make Docs-owned generic MCP profile '${clientLabel}'. No client-owned file changes.`
        : `Generic MCP profile '${clientLabel}' is already absent. No client-owned file changes.`,
      nextAction: null,
      configuration: null,
      configurationDigest: null,
      intent: null,
      storeRoot,
    };
  }

  if (action === "configure" && active) {
    return {
      schemaVersion: 1,
      clientLabel,
      harnessId,
      action,
      changed: false,
      state: "current",
      accessCeiling,
      review: `Generic MCP profile '${clientLabel}' is current. Make Docs cannot show the prior secret proof. Use --generic-mcp-action rotate to produce a new configuration object.`,
      nextAction: `Use the existing client configuration, or run setup again with --generic-mcp-action rotate.`,
      configuration: null,
      configurationDigest: typeof existing.configurationDigest === "string" ? existing.configurationDigest : null,
      intent: existing,
      storeRoot,
    };
  }

  const executable = options.executable ?? verifyMakeDocsExecutable({
    executablePath: path.resolve(process.argv[1] ?? ""),
  });
  const machineRoot = path.resolve(options.machineRoot ?? os.homedir());
  const connection = createMcpConnection(harnessId);
  const configuration = {
    mcpServers: {
      "make-docs": {
        command: executable.path,
        args: ["mcp"],
        env: {
          [MCP_CONNECTION_ID_ENV]: connection.id,
          [MCP_CONNECTION_KEY_ENV]: connection.key,
        },
      },
    },
  };
  const configurationDigest = sha256(JSON.stringify(configuration));
  const intent: GlobalHarnessIntent = {
    ...existing,
    selected: true,
    maximumMethod: "mcp",
    accessCeiling: { ...accessCeiling },
    profileKind: "generic-mcp",
    clientLabel,
    machineRoot,
    mcpConnection: connection.record,
    configurationDigest,
    lifecycleState: "active",
  };
  return {
    schemaVersion: 1,
    clientLabel,
    harnessId,
    action,
    changed: true,
    state: "planned",
    accessCeiling,
    review: `${action === "configure" ? "Create" : action === "rotate" ? "Rotate" : "Repair"} generic MCP profile '${clientLabel}'. Make Docs will write only its global intent and will not edit client-owned files.`,
    nextAction: `Copy the printed configuration object into the client's MCP server settings. Run \`make-docs setup --generic-mcp-client ${clientLabel} --target <project>\` to record separate project access.`,
    configuration,
    configurationDigest,
    intent,
    storeRoot,
  };
}

export function applyGenericMcpSetup(plan: GenericMcpSetupPlan): GenericMcpSetupPlan {
  if (!plan.changed) return { ...plan, state: plan.state === "missing" ? "missing" : "current" };
  const loaded = loadGlobalConfig(plan.storeRoot);
  if (plan.action === "remove") {
    const prior = loaded.config.settings.harnesses[plan.harnessId];
    if (prior) {
      loaded.config.settings.harnesses[plan.harnessId] = {
        ...prior,
        selected: false,
        maximumMethod: null,
        mcpConnection: prior.mcpConnection
          ? { ...prior.mcpConnection, active: false }
          : undefined,
        lifecycleState: "disabled",
      };
    }
  } else if (plan.intent) {
    loaded.config.settings.harnesses[plan.harnessId] = {
      ...plan.intent,
      accessCeiling: { ...plan.intent.accessCeiling },
    };
  }
  writeGlobalConfig(plan.storeRoot, loaded.config);
  return { ...plan, state: plan.action === "remove" ? "missing" : "current" };
}

export function genericMcpProjectIntent(plan: GenericMcpSetupPlan): ProjectHarnessIntegrationRecord {
  return plan.action === "remove"
    ? { harness: plan.harnessId, mode: "disable" }
    : {
        harness: plan.harnessId,
        mode: "narrow",
        method: "mcp",
        accessCeiling: { ...plan.accessCeiling },
      };
}

export function renderGenericMcpSetupResult(plan: GenericMcpSetupPlan): string {
  const lines = [
    `Generic MCP client: ${plan.clientLabel}.`,
    `State: ${plan.state}.`,
    plan.review,
  ];
  if (plan.configuration) {
    const configuration = plan.state === "planned"
      ? redactMcpNativeValue(plan.configuration)
      : plan.configuration;
    lines.push("Client-owned configuration object:", JSON.stringify(configuration, null, 2));
  }
  if (plan.nextAction) lines.push(`Next: ${plan.nextAction}`);
  return `${lines.join("\n")}\n`;
}

function isCurrentGenericIntent(value: GlobalHarnessIntent | undefined, clientLabel: string): value is GlobalHarnessIntent {
  return Boolean(
    value?.selected === true &&
    value.maximumMethod === "mcp" &&
    value.profileKind === "generic-mcp" &&
    value.clientLabel === clientLabel &&
    value.lifecycleState === "active" &&
    value.mcpConnection?.active === true &&
    value.mcpConnection.owner === `generic-mcp-${clientLabel}` &&
    typeof value.mcpConnection.keySha256 === "string" &&
    /^[a-f0-9]{64}$/.test(value.mcpConnection.keySha256),
  );
}
