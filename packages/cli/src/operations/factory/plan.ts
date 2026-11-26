import { createHash } from "node:crypto";
import {
  FACTORY_DEFAULT_CONTEXT,
  FACTORY_MOVE_TABLE_VERSION,
  type FactoryContextKind,
  type FactoryProofResult,
  type FactoryToolState,
  type FactoryWakeMethod,
} from "./records";
import type { FactoryWorkflowDefinition } from "./config-block";

/**
 * W30 R0 P2 resolved plan functions (PRD 53 R-FACTORY-55 to R-FACTORY-59).
 *
 * Pure functions only: canonical JSON, the SHA-256 digest, the plan that
 * joins the three workflow sources, and the revision keep rule. They read no
 * file and no Store. The Store service saves revisions with them, and the P3
 * commands resolve the current plan with them. A grant is never an input, so
 * a plan can never hold one (R-FACTORY-24).
 */

/** A JSON value that canonical JSON accepts. */
export type FactoryJsonValue = null | boolean | number | string | FactoryJsonValue[] | { [key: string]: FactoryJsonValue };

/**
 * Canonical JSON (R-FACTORY-56): object keys in sorted order (by UTF-16 code
 * unit, as `Array.prototype.sort` sorts), no extra spaces, and arrays in
 * their own order. It refuses a value that JSON cannot hold the same way
 * every time: `undefined`, a function, a symbol, a big integer, or a number
 * that is not finite.
 */
export function factoryCanonicalJson(value: unknown): string {
  const write = (node: unknown, at: string): string => {
    if (node === null) return "null";
    switch (typeof node) {
      case "boolean":
        return node ? "true" : "false";
      case "number":
        if (!Number.isFinite(node)) throw new TypeError(`Canonical JSON cannot hold a number that is not finite at ${at}.`);
        return JSON.stringify(Object.is(node, -0) ? 0 : node);
      case "string":
        return JSON.stringify(node);
      case "object": {
        if (Array.isArray(node)) return `[${node.map((item, index) => write(item, `${at}[${index}]`)).join(",")}]`;
        const prototype = Object.getPrototypeOf(node);
        if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`Canonical JSON holds only plain objects; ${at} is not one.`);
        const record = node as Record<string, unknown>;
        const keys = Object.keys(record).sort();
        return `{${keys.map((key) => {
          if (record[key] === undefined) throw new TypeError(`Canonical JSON cannot hold undefined at ${at}.${key}.`);
          return `${JSON.stringify(key)}:${write(record[key], `${at}.${key}`)}`;
        }).join(",")}}`;
      }
      default:
        throw new TypeError(`Canonical JSON cannot hold a ${typeof node} at ${at}.`);
    }
  };
  return write(value, "$");
}

/** The SHA-256 of the UTF-8 bytes of a text, as 64 lower-case hex characters. */
export function factoryDigest(text: string): string {
  return createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
}

/** The digest of a value's canonical JSON. */
export function factoryCanonicalDigest(value: unknown): string {
  return factoryDigest(factoryCanonicalJson(value));
}

/* ------------------------------------------------------------------------ */
/* Plan resolution                                                          */
/* ------------------------------------------------------------------------ */

/** The saved binding: only the choices that setup saved (factory contract, Machine Binding). */
export interface FactorySavedBinding {
  /** For each role, the bound tool by its tool ID, never by a path. */
  roles: Readonly<Record<string, string>>;
  wakeMethod: FactoryWakeMethod;
  /** The human channel account, as a reference that holds no secret. */
  channelRef: string | null;
  /** The working-copy method. */
  worktreeMethod: string;
  /** Each known loss that the person accepted, as one short line. */
  knownLosses: readonly string[];
}

/** The live facts of one machine tool row (factory contract, How the CLI Finds the State). */
export interface FactoryToolFacts {
  toolId: string;
  state: FactoryToolState;
  reportedVersion: string | null;
  proofs: Readonly<Record<string, { result: FactoryProofResult; toolVersion: string | null; notCovered: readonly string[] }>>;
}

/** The workflow type that the config names. */
export interface FactoryTypeFacts {
  name: string;
  /** The `Type version: N` line of the type file. */
  version: number;
  /** The SHA-256 of the type file's bytes. */
  fileDigest: string;
}

export interface FactoryPlanInput {
  workflowName: string;
  /** The workflow's entry in the `factory:` block, after config validation. */
  definition: FactoryWorkflowDefinition;
  type: FactoryTypeFacts;
  binding: FactorySavedBinding;
  /** Machine tool rows, by tool ID. Only the bound tools are read. */
  tools: Readonly<Record<string, FactoryToolFacts>>;
}

export interface FactoryResolvedPlan {
  plan: Record<string, FactoryJsonValue>;
  planJson: string;
  planDigest: string;
  configDigest: string;
  bindingDigest: string;
}

/** The portable definition with the contract defaults filled in, so an omitted default and a written one give the same digest. */
export function normalizeFactoryDefinition(definition: FactoryWorkflowDefinition): Record<string, FactoryJsonValue> {
  const roles: Record<string, FactoryJsonValue> = {};
  for (const [role, entry] of Object.entries(definition.roles)) {
    const context: readonly FactoryContextKind[] = entry.context ?? FACTORY_DEFAULT_CONTEXT[role] ?? [];
    roles[role] = {
      job: entry.job,
      capabilities: [...new Set(entry.capabilities)].sort(),
      returns: entry.returns,
      context: [...new Set(context)].sort(),
    };
  }
  const limits: Record<string, FactoryJsonValue> = { claimSize: definition.limits.claimSize };
  if (definition.limits.parallelWorkers !== undefined) limits.parallelWorkers = definition.limits.parallelWorkers;
  return {
    type: definition.type,
    typeVersion: definition.typeVersion,
    roles,
    roundLimit: definition.roundLimit,
    limits,
    gates: [...definition.gates],
    escalations: [...definition.escalations],
    steps: { preflight: definition.steps.preflight },
    integrationOwner: definition.integrationOwner ?? null,
    humanChannel: definition.humanChannel,
  };
}

export function normalizeFactoryBinding(binding: FactorySavedBinding): Record<string, FactoryJsonValue> {
  return {
    roles: Object.fromEntries(Object.entries(binding.roles).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))),
    wakeMethod: binding.wakeMethod,
    channelRef: binding.channelRef,
    worktreeMethod: binding.worktreeMethod,
    knownLosses: [...binding.knownLosses],
  };
}

/**
 * Join the three workflow sources into one resolved plan (R-FACTORY-55,
 * R-FACTORY-56). The plan is data: who does each job, with which tool, under
 * which limits, and which move table version applies. It has no steps,
 * conditions, branches, joins, or code (R-FACTORY-59). For each bound role
 * it takes the tool's live state, its reported version, and for each
 * capability that the role needs, the proof result, the proved version, and
 * the "does not cover" list. A capability with no proof row is recorded as
 * `unproved`, so a missing proof changes the digest.
 */
export function resolveFactoryPlan(input: FactoryPlanInput): FactoryResolvedPlan {
  const definition = normalizeFactoryDefinition(input.definition);
  const binding = normalizeFactoryBinding(input.binding);
  const roleTools: Record<string, FactoryJsonValue> = {};
  for (const [role, entry] of Object.entries(input.definition.roles).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))) {
    const toolId = input.binding.roles[role];
    if (toolId === undefined) {
      roleTools[role] = null;
      continue;
    }
    const facts = input.tools[toolId];
    const capabilities: Record<string, FactoryJsonValue> = {};
    for (const capability of [...new Set(entry.capabilities)].sort()) {
      const proof = facts?.proofs[capability];
      capabilities[capability] = proof
        ? { result: proof.result, toolVersion: proof.toolVersion, notCovered: [...proof.notCovered] }
        : { result: "unproved", toolVersion: null, notCovered: [] };
    }
    roleTools[role] = {
      toolId,
      state: facts?.state ?? "missing",
      reportedVersion: facts?.reportedVersion ?? null,
      capabilities,
    };
  }
  const plan: Record<string, FactoryJsonValue> = {
    workflow: input.workflowName,
    moveTableVersion: FACTORY_MOVE_TABLE_VERSION,
    type: { name: input.type.name, version: input.type.version, fileDigest: input.type.fileDigest },
    definition,
    binding,
    roleTools,
  };
  const planJson = factoryCanonicalJson(plan);
  return {
    plan,
    planJson,
    planDigest: factoryDigest(planJson),
    configDigest: factoryCanonicalDigest(definition),
    bindingDigest: factoryCanonicalDigest(binding),
  };
}

/** The round limit that a saved plan JSON holds, or null when the plan has none. */
export function factoryPlanRoundLimit(planJson: string): number | null {
  try {
    const plan = JSON.parse(planJson) as { definition?: { roundLimit?: unknown } };
    const limit = plan.definition?.roundLimit;
    return typeof limit === "number" && Number.isInteger(limit) && limit >= 0 ? limit : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------------ */
/* Revision keep rule                                                       */
/* ------------------------------------------------------------------------ */

/** For each workflow, the Store keeps this many newest revisions besides the `ready` one and the ones that retained assignments name. */
export const FACTORY_PLAN_KEEP_NEWEST = 10;

/**
 * The revisions to keep for one workflow (R-FACTORY-57): the `ready`
 * revision, each revision that a retained assignment names (open or final;
 * owner decision 2026-11-24), and the 10 newest other revisions. Every other
 * revision is removed in the same write.
 */
export function factoryPlanRevisionsToKeep(
  revisions: readonly number[],
  readyRevision: number | null,
  assignmentRevisions: Iterable<number>,
): Set<number> {
  const existing = new Set(revisions);
  const kept = new Set<number>();
  if (readyRevision !== null && existing.has(readyRevision)) kept.add(readyRevision);
  for (const revision of assignmentRevisions) if (existing.has(revision)) kept.add(revision);
  const others = [...existing].filter((revision) => !kept.has(revision)).sort((left, right) => right - left);
  for (const revision of others.slice(0, FACTORY_PLAN_KEEP_NEWEST)) kept.add(revision);
  return kept;
}
