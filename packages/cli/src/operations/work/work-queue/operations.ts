import path from "node:path";
import { z } from "zod";

import {
  STORE_READ_PROJECT_READ_ACCESS,
  STORE_WRITE_PROJECT_WRITE_ACCESS,
} from "../../access.js";
import type { OperationExecutionContext } from "../../context.js";
import { assertHarnessOperationAllowed } from "../../harness-policy.js";
import type { McpToolMetadata } from "../../mcp-metadata.js";
import type { OperationDefinition } from "../../registry.js";
import { StoreAccessStateError } from "../../store-access.js";
import { type JsonValue } from "../../types.js";
import {
  WORK_CLOSE_OUTCOMES,
  WORK_HANDLE_OBSERVATIONS,
  WORK_SETTLE_CHOICES,
  WORK_UNIT_KINDS,
} from "../work-store/schemas.js";
import { previewWorkSync } from "../work-store/sync.js";
import {
  checkOutcome,
  workAdd,
  workAuthority,
  workClaim,
  workClose,
  workExport,
  workNext,
  workRelease,
  workReport,
  workStatus,
  workSync,
  type WorkQueueEnv,
} from "./queue.js";

/**
 * W29 R0 P4 `work` queue operations (PRD 52 R-WORK-QUEUE-12, PRD 39 R-RUN-4).
 * The MCP tools are `work_status` to `work_add` in the `backlog` and `workflow`
 * profiles. Every write needs the shared write permission and an expected
 * version (R-WORK-QUEUE-13). Every operation syncs first (R-WORK-SYNC-8): a
 * write runs sync, and a read runs the read-only sync check.
 */

const MCP: McpToolMetadata = { profiles: ["backlog", "workflow"], defaultExposure: "deferred" };

const targetRoot = z.string().min(1).optional()
  .describe("The project folder. The default is the current folder.");
const unit = z.string().trim().min(1)
  .describe("The unit: a coordinate such as `W29 R0 P4` or `W29 R0 P4 T3` (any letter case), or a quick item number such as `7` or `task 7`.");
const expectedVersion = z.number().int().positive()
  .describe("The unit revision you last read, from `work next` or the claim result. The change stops if the unit changed since then.");
const claimId = z.string().regex(/^wc-[a-z0-9]{8,64}$/).optional()
  .describe("Your claim ID from the claim result. Only the holder knows it.");

const statusInput = z.object({ targetRoot }).strict();
const syncInput = z.object({
  targetRoot,
  settle: z.string().min(1).optional().describe("Settle the conflict of this work file, such as docs/work/2042-06-01-w1-r0-aurora/02-second.md."),
  choice: z.enum(WORK_SETTLE_CHOICES).optional().describe("The settle choice that the conflict report names."),
  expectedRevision: z.number().int().positive().optional().describe("The store revision of the file that the conflict report shows. The settle stops if it changed."),
}).strict().refine((input) => (input.settle === undefined) === (input.choice === undefined), "Give settle and choice together.");
const nextInput = z.object({
  targetRoot,
  level: z.enum(WORK_UNIT_KINDS).default("phase").describe("The unit level to list: wave, revision, phase, stage, task, or quick-item."),
  claimant: z.string().trim().min(1).optional().describe("Your claimant name. Units inside a unit you hold are ready for you. work next never shows a claim ID: only the result of a new claim does."),
  quickItems: z.boolean().default(true).describe("Also list quick items. The default is true."),
  limit: z.number().int().positive().optional().describe("Show at most this many ready units."),
}).strict();
const claimInput = z.object({
  targetRoot,
  unit,
  claimant: z.string().trim().min(1).describe("Who claims the unit, such as an agent or person name."),
  taskHandle: z.string().trim().min(1).optional().describe("A handle that another claimant can check, such as a task or session ID."),
  ttlSeconds: z.number().int().positive().optional().describe("How long the claim lasts, from 1200 to 86400 seconds. The default is 1800."),
  expectedVersion,
  claimId: z.string().regex(/^wc-[a-z0-9]{8,64}$/).optional()
    .describe("Your claim ID, to renew your live claim. A new claim result gives it once; no other result shows it."),
  takeoverFrom: z.string().trim().min(1).optional().describe("Take over the expired claim of this claimant, after you checked its task handle."),
  handle: z.enum(WORK_HANDLE_OBSERVATIONS).optional().describe("What the handle check saw: running, stopped, finished, not-found, or no-handle."),
}).strict().refine((input) => (input.takeoverFrom === undefined) === (input.handle === undefined), "Give takeoverFrom and handle together.");
const handle = z.enum(WORK_HANDLE_OBSERVATIONS).optional()
  .describe("For an expired claim that you do not hold: what the check of its task handle saw. stopped, finished, or not-found; no-handle when the claim has no task handle. running is refused.");
const releaseInput = z.object({ targetRoot, unit, claimId, expectedVersion, handle }).strict();
const reportInput = z.object({
  targetRoot,
  unit,
  claimId,
  status: z.enum(["open", "in-progress", "blocked"]).optional().describe("The new status."),
  evidence: z.string().min(1).optional().describe("A repository-relative path to an evidence file to link."),
  clearBlockers: z.boolean().default(false).describe("Clear every blocker. A blocked unit opens again."),
  metGates: z.array(z.string().min(1)).default([]).describe("Gate texts to record as met, exactly as `work next` shows them."),
  note: z.string().max(256).optional().describe("A short progress note: one line of plain text, at most 256 characters. It replaces the unit's last note."),
  expectedVersion,
}).strict();
const closeInput = z.object({
  targetRoot,
  unit,
  claimId,
  outcome: z.enum(WORK_CLOSE_OUTCOMES).default("done").describe("done, cancelled, or superseded. The default is done."),
  expectedVersion,
  handle,
}).strict();
const exportInput = z.object({
  targetRoot,
  to: z.string().min(1).optional().describe("A folder outside docs/work/ for the backlog files that the store holds."),
  quick: z.string().min(1).optional().describe("A file for the project's quick item list."),
  paths: z.array(z.string().min(1)).default([]).describe("Only these work files or folders, such as docs/work/2042-06-01-w1-r0-aurora/."),
}).strict();
const addInput = z.object({
  targetRoot,
  title: z.string().trim().min(1).max(200).describe("The quick item title."),
  body: z.string().trim().min(1).max(4000).optional().describe("More detail."),
  request: z.string().min(1).optional().describe("A repository-relative path to the request that created it."),
}).strict();

function rootOf(input: { targetRoot?: string }, context: OperationExecutionContext): string {
  return path.resolve(input.targetRoot ?? context.cwd);
}

function envOf(context: OperationExecutionContext): WorkQueueEnv {
  return { storeRoot: context.storeRoot, now: new Date(context.now()) };
}

const json = (value: unknown) => value as JsonValue;

const READ_SUMMARY = "Changes nothing.";

export const WORK_QUEUE_OPERATION_IDS = [
  "work.queue.status",
  "work.queue.sync",
  "work.queue.next",
  "work.queue.claim",
  "work.queue.release",
  "work.queue.report",
  "work.queue.close",
  "work.queue.export",
  "work.queue.add",
] as const;

export const workQueueOperations: OperationDefinition[] = [
  {
    id: "work.queue.status",
    summary: `Say whether the work store or the docs/work/ files are the authority, and why, with the sync check and each conflict's settle commands. ${READ_SUMMARY}`,
    mutates: "read",
    access: STORE_READ_PROJECT_READ_ACCESS,
    // Status reports every Store state itself, so it reads the Store only when it is usable.
    storeAdmission: "optional",
    status: "active",
    mcp: MCP,
    inputSchema: statusInput,
    async handler(raw, context) {
      const input = statusInput.parse(raw);
      const root = rootOf(input, context);
      let denied: { reason: string; nextAction: string } | null = null;
      if ((context.surface === "cli" || context.surface === "mcp") && context.route !== "test") {
        const { listHarnessCommandRules, validateRegistryHarnessCommandRules } = await import("../../registry.js");
        try {
          assertHarnessOperationAllowed({
            operation: "work.queue.status",
            required: STORE_READ_PROJECT_READ_ACCESS,
            targetRoot: root,
            storeRoot: context.storeRoot,
            route: context.route,
            callerIdentityRaw: context.callerIdentityRaw,
            callerReference: context.callerReference,
            mcpConnectionId: context.mcpConnectionId,
            mcpConnectionKey: context.mcpConnectionKey,
            commandRuleAuthority: { list: listHarnessCommandRules, validate: validateRegistryHarnessCommandRules },
          });
        } catch (error) {
          if (!(error instanceof StoreAccessStateError)) throw error;
          denied = { reason: error.reason, nextAction: error.nextAction };
        }
      }
      return json(workStatus(root, envOf(context), workAuthority(root, context.storeRoot, denied)));
    },
  },
  {
    id: "work.queue.sync",
    summary: "Run two-way sync between the docs/work/ files and the work store, or settle one conflict with the choice its report names.",
    mutates: "write",
    access: STORE_WRITE_PROJECT_WRITE_ACCESS,
    status: "active",
    mcp: MCP,
    inputSchema: syncInput,
    handler(raw, context) {
      const input = syncInput.parse(raw);
      const root = rootOf(input, context);
      if (context.dryRun) {
        const sync = checkOutcome(previewWorkSync(root, { storeRoot: context.storeRoot, now: new Date(context.now()) }));
        return json({ operation: "work.queue.sync", dryRun: true, sync, lines: [sync.summary, "Dry run: nothing changed."], summary: `${sync.summary}\nDry run: nothing changed.` });
      }
      const settle = input.settle && input.choice
        ? { targetPath: input.settle.replace(/\\/g, "/"), choice: input.choice, expectedStoreRevision: input.expectedRevision ?? null }
        : null;
      return json(workSync(root, envOf(context), settle));
    },
  },
  {
    id: "work.queue.next",
    summary: `List the ready units in dependency and coordinate order, and why each other open unit waits, with one next action for each reason. ${READ_SUMMARY}`,
    mutates: "read",
    access: STORE_READ_PROJECT_READ_ACCESS,
    status: "active",
    mcp: MCP,
    inputSchema: nextInput,
    handler(raw, context) {
      const input = nextInput.parse(raw);
      return json(workNext(rootOf(input, context), envOf(context), {
        level: input.level,
        includeQuickItems: input.quickItems,
        claimant: input.claimant ?? null,
        limit: input.limit ?? null,
      }));
    },
  },
  {
    id: "work.queue.claim",
    summary: "Claim a ready unit for a time limit, renew your claim, or take over an expired claim after checking the old task handle.",
    mutates: "write",
    access: STORE_WRITE_PROJECT_WRITE_ACCESS,
    status: "active",
    mcp: MCP,
    inputSchema: claimInput,
    handler(raw, context) {
      const input = claimInput.parse(raw);
      return json(workClaim(rootOf(input, context), envOf(context), {
        unit: input.unit,
        claimant: input.claimant,
        taskHandle: input.taskHandle ?? null,
        ttlSeconds: input.ttlSeconds ?? null,
        expectedVersion: input.expectedVersion,
        claimId: input.claimId ?? null,
        takeover: input.takeoverFrom && input.handle ? { previousClaimant: input.takeoverFrom, handleObservation: input.handle } : null,
      }));
    },
  },
  {
    id: "work.queue.release",
    summary: "Release a claim without closing its unit: your own claim with its claim ID, or anyone's expired claim after a check of its task handle.",
    mutates: "write",
    access: STORE_WRITE_PROJECT_WRITE_ACCESS,
    status: "active",
    mcp: MCP,
    inputSchema: releaseInput,
    handler(raw, context) {
      const input = releaseInput.parse(raw);
      return json(workRelease(rootOf(input, context), envOf(context), { unit: input.unit, claimId: input.claimId ?? null, expectedVersion: input.expectedVersion, handleObservation: input.handle ?? null }));
    },
  },
  {
    id: "work.queue.report",
    summary: "Record progress on a unit: a status change, a short note, an evidence link, cleared blockers, or met gates. A claimed unit changes only through its holder.",
    mutates: "write",
    access: STORE_WRITE_PROJECT_WRITE_ACCESS,
    status: "active",
    mcp: MCP,
    inputSchema: reportInput,
    handler(raw, context) {
      const input = reportInput.parse(raw);
      return json(workReport(rootOf(input, context), envOf(context), {
        unit: input.unit,
        claimId: input.claimId ?? null,
        status: input.status ?? null,
        evidencePath: input.evidence?.replace(/\\/g, "/") ?? null,
        clearBlockers: input.clearBlockers,
        metGates: input.metGates,
        note: input.note ?? null,
        expectedVersion: input.expectedVersion,
      }));
    },
  },
  {
    id: "work.queue.close",
    summary: "Close a unit as done, cancelled, or superseded, and release its claim. A claimed unit closes only through its holder.",
    mutates: "write",
    access: STORE_WRITE_PROJECT_WRITE_ACCESS,
    status: "active",
    mcp: MCP,
    inputSchema: closeInput,
    handler(raw, context) {
      const input = closeInput.parse(raw);
      return json(workClose(rootOf(input, context), envOf(context), {
        unit: input.unit,
        claimId: input.claimId ?? null,
        outcome: input.outcome,
        expectedVersion: input.expectedVersion,
        handleObservation: input.handle ?? null,
      }));
    },
  },
  {
    id: "work.queue.export",
    summary: "Write the backlog files that the work store holds to a folder you name, or the quick item list to a file you name.",
    mutates: "write",
    access: STORE_WRITE_PROJECT_WRITE_ACCESS,
    status: "active",
    mcp: MCP,
    inputSchema: exportInput,
    handler(raw, context) {
      const input = exportInput.parse(raw);
      return json(workExport(rootOf(input, context), envOf(context), { to: input.to ?? null, quick: input.quick ?? null, paths: input.paths }));
    },
  },
  {
    id: "work.queue.add",
    summary: "Add a quick item with the next quick item number of the project. It lives only in the work store.",
    mutates: "write",
    access: STORE_WRITE_PROJECT_WRITE_ACCESS,
    status: "active",
    mcp: MCP,
    inputSchema: addInput,
    handler(raw, context) {
      const input = addInput.parse(raw);
      return json(workAdd(rootOf(input, context), envOf(context), {
        title: input.title,
        body: input.body ?? null,
        requestPath: input.request?.replace(/\\/g, "/") ?? null,
      }));
    },
  },
];
