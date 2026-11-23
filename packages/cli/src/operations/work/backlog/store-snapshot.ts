import { lstatSync } from "node:fs";

import { getExistingInstallationCheckoutId, readDeclarativeProjectId } from "../../../store/installation-state.js";
import { listSyncConflicts, listWorkClaims, listWorkUnits, readWorkStore } from "../../../store/work-store.js";
import { STORE_READ_PROJECT_READ_ACCESS } from "../../access.js";
import type { OperationExecutionContext } from "../../context.js";
import { StoreAccessStateError } from "../../store-access.js";
import { getStoreDatabasePath } from "../../../store/paths.js";
import { WORK_FILES_NEXT_STEP, checkWorkHarness, pointToWorkFiles, runWorkStoreRead } from "../work-queue/files-fallback.js";
import { checkOutcome, renderStoreWorkFile, storeWorkFilePaths, workAuthority } from "../work-queue/queue.js";
import { WorkReadiness } from "../work-queue/readiness.js";
import type { WorkUnitRecord } from "../work-store/schemas.js";
import { previewWorkSync } from "../work-store/sync.js";
import {
  BacklogSnapshotV1Schema,
  type BacklogSnapshotV1,
  type BacklogWorkStoreFact,
  type WorkStoreReadinessFact,
} from "./schemas.js";
import { buildBacklogSnapshot, resolveSafeTargetRoot, type BacklogSnapshotSeams } from "./snapshot.js";

/**
 * W29 R0 P4 T7 and T8: the backlog snapshot source (PRD 51
 * R-BACKLOG-SNAPSHOT-4, R-BACKLOG-SNAPSHOT-24, R-BACKLOG-SNAPSHOT-31,
 * R-BACKLOG-SNAPSHOT-32; PRD 52 R-WORK-STORE-1, R-WORK-STORE-2).
 *
 * - Without a usable Store (absent, an older schema, unsafe, or a checkout
 *   that is not bound), the snapshot reads `docs/work/` exactly as before, and
 *   its result has no store-mode key (T8, A20).
 * - When the work store is the authority, the snapshot runs the read-only sync
 *   check, reads each work file's text from the store, and adds resolved
 *   readiness facts to each record and phase (T7, A21). It writes nothing.
 * - A Store refusal in store mode, such as a harness denial, stops only the
 *   store read: the snapshot reads the files and reports the typed Store
 *   result in `workStore.refusal`. It never invents readiness.
 */

interface StoreView {
  units: WorkUnitRecord[];
  readiness: WorkReadiness;
  conflictPaths: Set<string>;
  conflictUnits: Set<string>;
}

function readinessFact(view: StoreView, unit: WorkUnitRecord): WorkStoreReadinessFact {
  const doneBy = view.readiness.doneBy(unit);
  const reasons = view.readiness.reasonsFor(unit, null);
  const claim = view.readiness.claimOf(unit.storeId);
  const live = claim !== null && claim.expiresAt > view.readiness.nowText;
  return {
    source: "work-store",
    storeId: unit.storeId,
    revision: unit.revision,
    status: unit.status,
    closeOutcome: unit.closeOutcome,
    state: unit.status === "closed" ? "closed" : doneBy !== null ? "done" : reasons.length === 0 ? "ready" : "waiting",
    doneBy,
    waitReasons: reasons.map((reason) => ({ reason: reason.reason, text: reason.text, coordinate: reason.coordinate })),
    // Only a live claim is a claim fact (R-BACKLOG-SNAPSHOT-31). An expired claim shows as a wait reason.
    liveClaim: claim && live
      ? { claimant: claim.claimant, taskHandle: claim.taskHandle, claimedAt: claim.claimedAt, renewedAt: claim.renewedAt, expiresAt: claim.expiresAt }
      : null,
    syncConflict: (unit.sourcePath !== null && view.conflictPaths.has(unit.sourcePath)) || view.conflictUnits.has(unit.storeId),
  };
}

/** The store-mode snapshot. Store failures throw; the operation turns them into a refusal. */
export function buildStoreBacklogSnapshot(
  targetRoot: string,
  env: { storeRoot: string; now: Date },
  seams: BacklogSnapshotSeams = {},
): BacklogSnapshotV1 {
  const check = checkOutcome(previewWorkSync(targetRoot, { storeRoot: env.storeRoot, now: env.now }));
  const projectId = readDeclarativeProjectId(targetRoot) ?? "";
  const checkoutId = getExistingInstallationCheckoutId(targetRoot, env.storeRoot);
  const state = readWorkStore(targetRoot, (db) => ({
    units: listWorkUnits(db, projectId),
    claims: listWorkClaims(db, projectId),
    conflicts: checkoutId ? listSyncConflicts(db, checkoutId).map((row) => row.conflict) : [],
  }), { storeRoot: env.storeRoot });
  const texts = new Map<string, string | null>();
  for (const file of storeWorkFilePaths(state.units)) {
    const rendered = renderStoreWorkFile(state.units, file);
    texts.set(file, rendered.ok ? rendered.text : null);
  }
  const snapshot = buildBacklogSnapshot(targetRoot, {
    now: () => env.now,
    ...seams,
    workFiles: { files: [...texts.keys()], read: (file) => texts.get(file) ?? null },
  });
  const view: StoreView = {
    units: state.units,
    readiness: new WorkReadiness({ now: env.now, claimant: null, units: state.units, claims: state.claims, conflicts: state.conflicts }),
    conflictPaths: new Set(state.conflicts.map((conflict) => conflict.targetPath)),
    conflictUnits: new Set(state.conflicts.flatMap((conflict) => conflict.affectedUnitStoreIds)),
  };
  const unitOf = (kind: "revision" | "phase", sourcePath: string) =>
    state.units.find((unit) => unit.kind === kind && unit.sourcePath === sourcePath) ?? null;
  const records = snapshot.records.map((record) => {
    const revision = unitOf("revision", `${record.recordPath}/00-index.md`);
    return {
      ...record,
      phases: record.phases.map((phase) => {
        const unit = unitOf("phase", phase.phasePath);
        return unit ? { ...phase, readiness: readinessFact(view, unit) } : phase;
      }),
      ...(revision ? { readiness: readinessFact(view, revision) } : {}),
    };
  });
  const workStore: BacklogWorkStoreFact = {
    authority: "store",
    state: "read",
    syncCheck: {
      summary: check.summary,
      pending: check.pending.map((entry) => ({ path: entry.path, decision: entry.decision, conflictKind: entry.conflictKind, held: entry.held })),
      conflicts: check.conflicts.map((conflict) => ({ path: conflict.path, kind: conflict.kind })),
    },
    refusal: null,
  };
  return BacklogSnapshotV1Schema.parse({
    ...snapshot,
    capabilities: { ...snapshot.capabilities, store: { state: "available", diagnosticCodes: [] } },
    records,
    workStore,
  });
}

/**
 * The `work.backlog.snapshot` handler: the store when the work store is the
 * authority, the files otherwise.
 */
export async function buildBacklogSnapshotForOperation(
  targetRootInput: string,
  context: OperationExecutionContext,
  seams: BacklogSnapshotSeams = {},
): Promise<BacklogSnapshotV1> {
  // An unsafe target root fails exactly as before, before any Store check.
  const targetRoot = resolveSafeTargetRoot(targetRootInput);
  const access = STORE_READ_PROJECT_READ_ACCESS;
  const refused = (error: StoreAccessStateError): BacklogSnapshotV1 => {
    const pointed = pointToWorkFiles(error, WORK_FILES_NEXT_STEP);
    const snapshot = buildBacklogSnapshot(targetRoot, seams);
    return BacklogSnapshotV1Schema.parse({
      ...snapshot,
      capabilities: { ...snapshot.capabilities, store: { state: pointed.code === "store-denied" ? "denied" : "unavailable", diagnosticCodes: [] } },
      workStore: {
        authority: "store",
        state: "refused",
        syncCheck: null,
        refusal: { code: pointed.code, reason: pointed.reason, nextAction: pointed.nextAction },
      },
    });
  };
  // The harness check runs first, so a caller without a Store grant never makes
  // Make Docs read Store state (review item 3). A refused caller still gets the
  // file facts. With no Store database at all, the result is the old file
  // snapshot (A20); this is a file check only.
  try {
    await checkWorkHarness({ operation: "work.backlog.snapshot", access, root: targetRoot, context });
  } catch (error) {
    if (!(error instanceof StoreAccessStateError)) throw error;
    if (!lstatSync(getStoreDatabasePath(context.storeRoot), { throwIfNoEntry: false })) return buildBacklogSnapshot(targetRoot, seams);
    return refused(error);
  }
  let mode: "store" | "files";
  try {
    mode = workAuthority(targetRoot, context.storeRoot, null).mode;
  } catch {
    // A Store that cannot even be classified is not usable: read the files (R-BACKLOG-SNAPSHOT-4).
    mode = "files";
  }
  if (mode === "files") return buildBacklogSnapshot(targetRoot, seams);
  const now = new Date(context.now());
  try {
    return await runWorkStoreRead(
      { operation: "work.backlog.snapshot", access, root: targetRoot, context, filesStep: WORK_FILES_NEXT_STEP, session: true, harnessChecked: true },
      () => buildStoreBacklogSnapshot(targetRoot, { storeRoot: context.storeRoot, now }, seams),
    );
  } catch (error) {
    if (!(error instanceof StoreAccessStateError)) throw error;
    return refused(error);
  }
}
