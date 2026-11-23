import { z } from "zod";

/**
 * W29 R0 P1 work store contract.
 *
 * These schemas define the work records, the sync records, the work queue
 * payloads, the tracker connection contract, and the `work` config block in
 * PRD 52. They hold no Store, parser, or operation logic. Later phases build
 * on them without changing their meaning.
 */

const text = z.string().trim().min(1);
const nullableText = text.nullable();
const utcTimestamp = z
  .string()
  .datetime({ offset: true })
  .refine((value) => value.endsWith("Z"), "Expected an ISO 8601 UTC time.");
const sha256Digest = z.string().regex(/^[a-f0-9]{64}$/);
const version = z.number().int().positive();
const repositoryRelativePath = text.refine(
  (value) =>
    !value.startsWith("/") &&
    !value.startsWith("\\") &&
    !value.includes("\\") &&
    !value.split("/").includes(".."),
  "Expected a safe repository-relative path.",
);

/** Project and checkout identities follow PRD 38 R-ID-1. */
export const WorkProjectIdSchema = text;
export const WorkCheckoutIdSchema = text;

/** A stable store ID survives renumbering. Coordinates stay the human name. */
export const WORK_UNIT_STORE_ID_PATTERN = /^wu-[a-z0-9]{8,64}$/;
export const WorkUnitStoreIdSchema = z.string().regex(WORK_UNIT_STORE_ID_PATTERN);

export const WORK_CLAIM_ID_PATTERN = /^wc-[a-z0-9]{8,64}$/;
export const WorkClaimIdSchema = z.string().regex(WORK_CLAIM_ID_PATTERN);

export const WORK_UNIT_KINDS = [
  "wave",
  "revision",
  "phase",
  "stage",
  "task",
  "quick-item",
] as const;
export const WorkUnitKindSchema = z.enum(WORK_UNIT_KINDS);
export type WorkUnitKind = z.infer<typeof WorkUnitKindSchema>;

/**
 * One coordinate pattern per unit kind. These are the canonical forms that the
 * store keeps. Tasks keep their phase-local IDs, so a task coordinate does not
 * name its stage even when a stage is its parent. Task IDs use an upper-case
 * `T` (register D-063). The parser reads a lower-case `t` in older files and
 * stores `T`.
 */
export const WORK_COORDINATE_PATTERNS: Readonly<Record<WorkUnitKind, RegExp>> = Object.freeze({
  wave: /^W[1-9]\d*$/,
  revision: /^W[1-9]\d* R(?:0|[1-9]\d*)$/,
  phase: /^W[1-9]\d* R(?:0|[1-9]\d*) P[1-9]\d*$/,
  stage: /^W[1-9]\d* R(?:0|[1-9]\d*) P[1-9]\d* S[1-9]\d*$/,
  task: /^W[1-9]\d* R(?:0|[1-9]\d*) P[1-9]\d* T[1-9]\d*$/,
  "quick-item": /^[1-9]\d*$/,
});

/** The parent kinds each unit kind may have. An empty list means no parent. */
export const WORK_PARENT_KINDS: Readonly<Record<WorkUnitKind, readonly WorkUnitKind[]>> = Object.freeze({
  wave: [],
  revision: ["wave"],
  phase: ["revision"],
  stage: ["phase"],
  task: ["stage", "phase"],
  "quick-item": [],
});

/** `draft` work exists but is not approved to start. */
export const WORK_UNIT_STATUSES = ["draft", "open", "in-progress", "blocked", "closed"] as const;
export const WorkUnitStatusSchema = z.enum(WORK_UNIT_STATUSES);
export type WorkUnitStatus = z.infer<typeof WorkUnitStatusSchema>;

export const WORK_CLOSE_OUTCOMES = ["done", "cancelled", "superseded"] as const;
export const WorkCloseOutcomeSchema = z.enum(WORK_CLOSE_OUTCOMES);
export type WorkCloseOutcome = z.infer<typeof WorkCloseOutcomeSchema>;

export const WorkSourceLocationSchema = z
  .object({
    path: repositoryRelativePath,
    line: z.number().int().positive().nullable(),
  })
  .strict();
export type WorkSourceLocation = z.infer<typeof WorkSourceLocationSchema>;

export const WorkDependencySchema = z
  .object({
    dependsOnStoreId: WorkUnitStoreIdSchema,
    sourceText: text,
    source: WorkSourceLocationSchema.nullable(),
  })
  .strict();
export type WorkDependency = z.infer<typeof WorkDependencySchema>;

/** A dependency bullet that names a coordinate, but no unit matches it. */
export const WorkUnresolvedDependencySchema = z
  .object({
    sourceText: text,
    source: WorkSourceLocationSchema,
  })
  .strict();
export type WorkUnresolvedDependency = z.infer<typeof WorkUnresolvedDependencySchema>;

/**
 * A dependency bullet that names no coordinate, such as an owner approval.
 * A person or the claimant records it as met through a report.
 */
export const WorkGateSchema = z
  .object({
    sourceText: text,
    source: WorkSourceLocationSchema.nullable(),
    met: z.boolean(),
  })
  .strict();
export type WorkGate = z.infer<typeof WorkGateSchema>;

export const WorkBlockerSchema = z
  .object({
    text,
    source: WorkSourceLocationSchema.nullable(),
  })
  .strict();
export type WorkBlocker = z.infer<typeof WorkBlockerSchema>;

export const WORK_LINK_KINDS = [
  "design",
  "plan",
  "prd-section",
  "evidence",
  "request",
  "work-file",
] as const;
export const WorkLinkKindSchema = z.enum(WORK_LINK_KINDS);

/**
 * Links run in both directions. An outbound link goes from the unit to a
 * repository document. An inbound link records a repository document that
 * names this unit's coordinate.
 */
export const WorkLinkSchema = z
  .object({
    direction: z.enum(["outbound", "inbound"]),
    kind: WorkLinkKindSchema,
    path: repositoryRelativePath,
    anchor: nullableText,
  })
  .strict();
export type WorkLink = z.infer<typeof WorkLinkSchema>;

export const WorkUnitRecordSchema = z
  .object({
    projectId: WorkProjectIdSchema,
    storeId: WorkUnitStoreIdSchema,
    kind: WorkUnitKindSchema,
    coordinate: text,
    parentStoreId: WorkUnitStoreIdSchema.nullable(),
    title: text,
    body: z.string().nullable(),
    recordedStatus: nullableText,
    status: WorkUnitStatusSchema,
    closeOutcome: WorkCloseOutcomeSchema.nullable(),
    dependencies: z.array(WorkDependencySchema),
    unresolvedDependencies: z.array(WorkUnresolvedDependencySchema),
    gates: z.array(WorkGateSchema),
    blockers: z.array(WorkBlockerSchema),
    links: z.array(WorkLinkSchema),
    sourcePath: repositoryRelativePath.nullable(),
    /** `removed` after a person accepts the deletion of this unit's work file. */
    copyState: z.enum(["kept", "removed"]),
    revision: version,
  })
  .strict()
  .superRefine((unit, context) => {
    if (!WORK_COORDINATE_PATTERNS[unit.kind].test(unit.coordinate)) {
      context.addIssue({
        code: "custom",
        path: ["coordinate"],
        message: `A ${unit.kind} needs a coordinate that matches ${WORK_COORDINATE_PATTERNS[unit.kind]}.`,
      });
    }
    const parentKinds = WORK_PARENT_KINDS[unit.kind];
    if ((parentKinds.length === 0) !== (unit.parentStoreId === null)) {
      context.addIssue({
        code: "custom",
        path: ["parentStoreId"],
        message:
          parentKinds.length === 0
            ? `A ${unit.kind} has no parent.`
            : `A ${unit.kind} needs a ${parentKinds.join(" or ")} parent.`,
      });
    }
    if ((unit.status === "closed") !== (unit.closeOutcome !== null)) {
      context.addIssue({
        code: "custom",
        path: ["closeOutcome"],
        message: "A closed unit has exactly one close outcome, and any other unit has none.",
      });
    }
    if ((unit.kind === "quick-item") !== (unit.sourcePath === null)) {
      context.addIssue({
        code: "custom",
        path: ["sourcePath"],
        message: "A quick item lives only in the work store and has no work file. Every other unit has one.",
      });
    }
  });
export type WorkUnitRecord = z.infer<typeof WorkUnitRecordSchema>;

/** A claim is a short-lived mutation guard, never history. */
export const WorkClaimRecordSchema = z
  .object({
    projectId: WorkProjectIdSchema,
    claimId: WorkClaimIdSchema,
    unitStoreId: WorkUnitStoreIdSchema,
    claimant: text,
    taskHandle: nullableText,
    claimedAt: utcTimestamp,
    renewedAt: utcTimestamp,
    expiresAt: utcTimestamp,
    /** What this claimant saw on the previous holder's task handle, for a takeover. */
    takeoverObservation: z.enum(["stopped", "finished", "not-found"]).nullable(),
  })
  .strict()
  .refine(
    (claim) => claim.claimedAt <= claim.renewedAt && claim.renewedAt < claim.expiresAt,
    "A claim is claimed, then renewed, then expires, in that order.",
  );
export type WorkClaimRecord = z.infer<typeof WorkClaimRecordSchema>;

/**
 * The last applied state of one repo copy in one checkout. An accepted
 * deletion is marked on the units, so every checkout sees it, and the entry
 * is removed once this checkout's copy is gone.
 */
export const WorkSyncLedgerEntrySchema = z
  .object({
    checkoutId: WorkCheckoutIdSchema,
    targetPath: repositoryRelativePath,
    unitStoreIds: z.array(WorkUnitStoreIdSchema).min(1),
    digestAlgorithm: z.literal("sha256"),
    lastAppliedDigest: sha256Digest,
    storeRevision: version,
    syncedAt: utcTimestamp,
  })
  .strict();
export type WorkSyncLedgerEntry = z.infer<typeof WorkSyncLedgerEntrySchema>;

/**
 * File states compare the file with this checkout's ledger entry: `new` is a
 * file with no entry, `missing` is no file while an entry exists, and `absent`
 * is no file and no entry.
 */
export const WORK_SYNC_FILE_STATES = ["unchanged", "changed", "new", "missing", "absent", "unreadable"] as const;
export const WorkSyncFileStateSchema = z.enum(WORK_SYNC_FILE_STATES);
export type WorkSyncFileState = z.infer<typeof WorkSyncFileStateSchema>;

/**
 * Store states compare the store record with the ledger entry: `new` is a
 * record with no entry, `none` is no record, and `removed` is a record whose
 * file deletion a person accepted, in this or any other checkout.
 */
export const WORK_SYNC_STORE_STATES = ["unchanged", "changed", "new", "none", "removed"] as const;
export const WorkSyncStoreStateSchema = z.enum(WORK_SYNC_STORE_STATES);
export type WorkSyncStoreState = z.infer<typeof WorkSyncStoreStateSchema>;

export const WORK_SYNC_DECISIONS = [
  "none",
  "import",
  "write",
  "conflict",
  "report-unreadable",
  "remove-copy",
] as const;
export const WorkSyncDecisionSchema = z.enum(WORK_SYNC_DECISIONS);
export type WorkSyncDecision = z.infer<typeof WorkSyncDecisionSchema>;

/**
 * `claimed` (W29 R0 P4 re-check finding 4): a file edit closes or removes a
 * unit that a claim holds, live or expired. Only the holder, or a release after
 * the handle check, ends the claim, so sync stops the file (owner T18, finding 9).
 */
export const WORK_CONFLICT_KINDS = ["both-changed", "file-deleted", "store-missing", "unclear", "claimed"] as const;
export const WorkConflictKindSchema = z.enum(WORK_CONFLICT_KINDS);
export type WorkConflictKind = z.infer<typeof WorkConflictKindSchema>;

export const WorkSyncConflictRecordSchema = z
  .object({
    checkoutId: WorkCheckoutIdSchema,
    targetPath: repositoryRelativePath,
    kind: WorkConflictKindSchema,
    fileDigest: sha256Digest.nullable(),
    ledgerDigest: sha256Digest.nullable(),
    storeRevision: version.nullable(),
    affectedUnitStoreIds: z.array(WorkUnitStoreIdSchema),
    detectedAt: utcTimestamp,
  })
  .strict()
  .superRefine((conflict, context) => {
    if ((conflict.kind === "file-deleted") === (conflict.fileDigest !== null)) {
      context.addIssue({ code: "custom", path: ["fileDigest"], message: "Only a deleted file has no file digest." });
    }
    if ((conflict.kind === "store-missing") !== (conflict.storeRevision === null)) {
      context.addIssue({ code: "custom", path: ["storeRevision"], message: "Only a store-missing conflict has no store revision." });
    }
    if (conflict.kind !== "store-missing" && conflict.affectedUnitStoreIds.length === 0) {
      context.addIssue({ code: "custom", path: ["affectedUnitStoreIds"], message: "A conflict names the units it blocks." });
    }
  });
export type WorkSyncConflictRecord = z.infer<typeof WorkSyncConflictRecordSchema>;

export const WORK_SETTLE_CHOICES = [
  "keep-file",
  "keep-store",
  "restore",
  "accept-deletion",
  "reimport",
  "remove-file",
] as const;
export const WorkSettleChoiceSchema = z.enum(WORK_SETTLE_CHOICES);
export type WorkSettleChoice = z.infer<typeof WorkSettleChoiceSchema>;

export const WorkSettleRequestSchema = z
  .object({
    targetPath: repositoryRelativePath,
    choice: WorkSettleChoiceSchema,
    expectedStoreRevision: version.nullable(),
  })
  .strict();
export type WorkSettleRequest = z.infer<typeof WorkSettleRequestSchema>;

export const WORK_AUTHORITY_MODES = ["store", "files"] as const;
export const WorkAuthorityModeSchema = z.enum(WORK_AUTHORITY_MODES);
export type WorkAuthorityMode = z.infer<typeof WorkAuthorityModeSchema>;

export const WORK_STORE_STATES = [
  "usable",
  "not-configured",
  "unavailable",
  "unsafe",
  "denied",
] as const;
export const WorkStoreStateSchema = z.enum(WORK_STORE_STATES);
export type WorkStoreState = z.infer<typeof WorkStoreStateSchema>;

export const WORK_WAIT_REASONS = [
  "draft",
  "status-unknown",
  "dependency-open",
  "dependency-cancelled",
  "dependency-unresolved",
  "gate-open",
  "blocked",
  "claimed",
  "claim-expired",
  "ancestor-claimed",
  "ancestor-closed",
  "ancestor-waiting",
  "sync-conflict",
] as const;
export const WorkWaitReasonSchema = z.enum(WORK_WAIT_REASONS);
export type WorkWaitReason = z.infer<typeof WorkWaitReasonSchema>;

export const WORK_CLAIM_RESULTS = ["claimed", "renewed", "refused"] as const;
export const WorkClaimResultSchema = z.enum(WORK_CLAIM_RESULTS);
export type WorkClaimResult = z.infer<typeof WorkClaimResultSchema>;

export const WORK_CLAIM_REFUSALS = [
  "unit-not-found",
  "unit-closed",
  "not-ready",
  "already-claimed",
  "takeover-needs-handle-check",
  "previous-holder-still-working",
  "ancestor-claimed",
  "descendant-claimed",
  "no-handle-to-check",
  "version-conflict",
] as const;
export const WorkClaimRefusalSchema = z.enum(WORK_CLAIM_REFUSALS);
export type WorkClaimRefusal = z.infer<typeof WorkClaimRefusalSchema>;

export const WORK_UPDATE_REFUSALS = [
  "not-claim-holder",
  "claim-expired",
  "version-conflict",
  "unit-closed",
  // W29 R0 P4 finding 9 (owner option A): a release or close of an expired claim needs the handle check.
  "handle-check-needed",
  "previous-holder-still-working",
] as const;
export const WorkUpdateRefusalSchema = z.enum(WORK_UPDATE_REFUSALS);
export type WorkUpdateRefusal = z.infer<typeof WorkUpdateRefusalSchema>;

export const WorkNextQuerySchema = z
  .object({
    level: WorkUnitKindSchema.default("phase"),
    includeQuickItems: z.boolean().default(true),
  })
  .strict();
export type WorkNextQuery = z.infer<typeof WorkNextQuerySchema>;

/** What the new claimant saw when it checked the previous holder's task handle. */
export const WORK_HANDLE_OBSERVATIONS = ["running", "stopped", "finished", "not-found", "no-handle"] as const;
export const WorkHandleObservationSchema = z.enum(WORK_HANDLE_OBSERVATIONS);
export type WorkHandleObservation = z.infer<typeof WorkHandleObservationSchema>;

/** Claim time limits in seconds. Kept here so the request schema enforces them. */
export const WORK_CLAIM_TTL_BOUNDS = Object.freeze({ minSeconds: 20 * 60, maxSeconds: 24 * 60 * 60 });

export const WorkClaimRequestSchema = z
  .object({
    unitStoreId: WorkUnitStoreIdSchema,
    claimant: text,
    /**
     * The caller's claim ID, needed to renew a live claim. A claim ID works like
     * a private key (owner decision 2026-11-23, W29 R0 P4 T13): naming the
     * claimant alone never renews a claim or reveals its ID.
     */
    claimId: WorkClaimIdSchema.nullable().optional(),
    taskHandle: nullableText,
    ttlSeconds: z
      .number()
      .int()
      .min(WORK_CLAIM_TTL_BOUNDS.minSeconds)
      .max(WORK_CLAIM_TTL_BOUNDS.maxSeconds)
      .nullable(),
    expectedVersion: version,
    takeover: z
      .object({
        previousClaimId: WorkClaimIdSchema,
        handleObservation: WorkHandleObservationSchema,
      })
      .strict()
      .nullable(),
  })
  .strict();
export type WorkClaimRequest = z.infer<typeof WorkClaimRequestSchema>;

/** Any caller can release an expired claim. A live claim is released by its holder. */
export const WorkReleaseRequestSchema = z
  .object({
    unitStoreId: WorkUnitStoreIdSchema,
    claimId: WorkClaimIdSchema,
    expectedVersion: version,
  })
  .strict();
export type WorkReleaseRequest = z.infer<typeof WorkReleaseRequestSchema>;

/**
 * A unit with a live claim changes only through its holder. A caller without
 * a claim can change a unit that has no live claim. Clearing the last blocker
 * of a blocked unit reopens it.
 */
export const WorkReportRequestSchema = z
  .object({
    unitStoreId: WorkUnitStoreIdSchema,
    claimId: WorkClaimIdSchema.nullable(),
    status: z.enum(["open", "in-progress", "blocked"]).nullable(),
    note: z.string().trim().min(1).max(256).nullable(),
    evidencePath: repositoryRelativePath.nullable(),
    clearBlockers: z.boolean(),
    metGates: z.array(text),
    expectedVersion: version,
  })
  .strict()
  .refine(
    (report) =>
      report.status !== null ||
      report.note !== null ||
      report.evidencePath !== null ||
      report.clearBlockers ||
      report.metGates.length > 0,
    "A report changes status, adds a note, links evidence, clears blockers, or records a met gate.",
  );
export type WorkReportRequest = z.infer<typeof WorkReportRequestSchema>;

/** The same claim rule as a report: the holder, or anyone when no live claim exists. */
export const WorkCloseRequestSchema = z
  .object({
    unitStoreId: WorkUnitStoreIdSchema,
    claimId: WorkClaimIdSchema.nullable(),
    outcome: WorkCloseOutcomeSchema,
    expectedVersion: version,
  })
  .strict();
export type WorkCloseRequest = z.infer<typeof WorkCloseRequestSchema>;

export const WORK_TRACKER_OPERATIONS = ["next", "claim", "report", "close"] as const;
export const WorkTrackerOperationSchema = z.enum(WORK_TRACKER_OPERATIONS);

export const WORK_TRACKER_FIELDS = ["unit", "status", "dependencies", "claim", "links"] as const;
export const WorkTrackerFieldSchema = z.enum(WORK_TRACKER_FIELDS);

/** A field map value is a plain field name, never a value or a secret. */
export const WORK_TRACKER_FIELD_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/;

export const WorkTrackerFieldMapSchema = z.partialRecord(
  WorkTrackerFieldSchema,
  z.string().regex(WORK_TRACKER_FIELD_NAME_PATTERN),
);

export const WorkTrackerConnectionSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
    title: text,
    operations: z.array(WorkTrackerOperationSchema).min(1),
    fieldMap: WorkTrackerFieldMapSchema,
  })
  .strict();
export type WorkTrackerConnection = z.infer<typeof WorkTrackerConnectionSchema>;

/**
 * One sync hold path: a work folder or file under `docs/work/` or
 * `.make-docs/archive/work/` that sync reads but never writes or removes
 * (owner decision 2026-11-23, W29 R0 P4 T19).
 */
export const WorkSyncHoldPathSchema = repositoryRelativePath.refine(
  (value) => value.startsWith("docs/work/") || value.startsWith(".make-docs/archive/work/"),
  "A sync hold path is a work folder or file under docs/work/ or .make-docs/archive/work/.",
);

/**
 * The `work` block in `.make-docs/config.yaml`. Intent only. The local store
 * is the only current connection (R-WORK-TRACKER-3). `syncHold` lists the work
 * paths that a person holds: sync reads them and never writes or removes them.
 */
export const WorkConfigBlockSchema = z
  .object({
    projection: z.enum(["on", "off"]).default("on"),
    syncHold: z.array(WorkSyncHoldPathSchema).max(64).default([]),
    tracker: z
      .object({
        connection: z.literal("local").default("local"),
        fieldMap: WorkTrackerFieldMapSchema.optional(),
      })
      .strict()
      .default({ connection: "local" }),
  })
  .strict();
export type WorkConfigBlock = z.infer<typeof WorkConfigBlockSchema>;

/**
 * A quick item lives only in the work store (R-WORK-QUEUE-3). `work add`
 * creates one, and the store gives it the next plain quick item number of the project
 * (R-WORK-QUEUE-18). The store keeps closed quick items, so a number is never
 * used twice.
 */
export const WorkAddRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(4000).nullable(),
    links: z.array(WorkLinkSchema).max(16),
  })
  .strict();
export type WorkAddRequest = z.infer<typeof WorkAddRequestSchema>;
