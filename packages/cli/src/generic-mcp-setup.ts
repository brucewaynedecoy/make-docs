import { randomBytes } from "node:crypto";
import os from "node:os";
import path from "node:path";
import {
  encodeHarnessCallerIdentity,
  sha256,
  verifyMakeDocsExecutable,
  type GenericMcpCallerIdentity,
  type VerifiedExecutableIdentity,
} from "./harness-access";
import type { ProjectHarnessIntegrationRecord } from "./config";
import {
  loadGlobalConfig,
  writeGlobalConfig,
  type GlobalHarnessIntent,
} from "./store/global-config";
import { resolveStoreRoot } from "./store/paths";

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
  accessCeiling: { store: "write"; project: "write"; hostConfig: "none" };
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
  const accessCeiling = { store: "write", project: "write", hostConfig: "none" } as const;

  if (action === "remove") {
    return {
      schemaVersion: 1,
      clientLabel,
      harnessId,
      action,
      changed: Boolean(existing),
      state: existing ? "planned" : "missing",
      accessCeiling,
      review: existing
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
  const proof = randomBytes(32).toString("base64url");
  const machineRoot = path.resolve(options.machineRoot ?? os.homedir());
  const identity: GenericMcpCallerIdentity = {
    schemaVersion: 1,
    kind: "make-docs-generic-mcp-caller",
    adapterId: "generic-mcp",
    adapterVersion: 1,
    harnessId,
    connectionMethod: "mcp",
    scope: "machine",
    root: machineRoot,
    executable,
    proof,
  };
  const configuration = {
    mcpServers: {
      "make-docs": {
        command: executable.path,
        args: ["mcp"],
        env: { MAKE_DOCS_HARNESS_CALLER_IDENTITY: encodeHarnessCallerIdentity(identity) },
      },
    },
  };
  const configurationDigest = sha256(JSON.stringify(configuration));
  const priorRevision = typeof existing?.identityRevision === "number"
    ? existing.identityRevision
    : 0;
  const intent: GlobalHarnessIntent = {
    selected: true,
    maximumMethod: "mcp",
    accessCeiling: { ...accessCeiling },
    profileKind: "generic-mcp",
    clientLabel,
    machineRoot,
    proofSha256: sha256(proof),
    identityRevision: priorRevision + 1,
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
    delete loaded.config.settings.harnesses[plan.harnessId];
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
    lines.push("Client-owned configuration object:", JSON.stringify(plan.configuration, null, 2));
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
    typeof value.proofSha256 === "string" &&
    /^[a-f0-9]{64}$/.test(value.proofSha256) &&
    typeof value.configurationDigest === "string" &&
    /^[a-f0-9]{64}$/.test(value.configurationDigest),
  );
}
