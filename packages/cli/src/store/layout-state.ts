import { layoutPlanDigest, previewProjectLayout, verifyProjectLayout, type LayoutPlan } from '../layout-plan';
import {
    canonicalInstallationPath,
    InstallationStateError,
    prepareDetachedInstallationOperation,
    readDetachedInstallationOperation,
    readInstallationManifest,
    recoverInstallationOperation,
    registerDetachedInstallationOperation,
} from './installation-state';
import { projectLayoutLedger } from './layout-ledger';

const OPERATION = 'project.layout.prepare';
function nextAction(root: string, id: string, mode: 'cli' | 'manual'): string {
    return `make-docs project layout ${mode === 'manual' ? 'verify' : 'apply'} ${id} --target-root ${JSON.stringify(root)}`;
}
registerDetachedInstallationOperation(OPERATION, {
    validate(root, metadata, phase, temporaryFiles) {
        const plan = metadata as LayoutPlan;
        if (!plan || plan.schemaVersion !== 1 || !Array.isArray(plan.changes) || !Array.isArray(plan.blockers)) return ['The saved layout plan is not supported.'];
        if (plan.blockers.length) return plan.blockers;
        return verifyProjectLayout(root, plan, phase, temporaryFiles).blockers;
    },
    nextAction,
});

/** Presentation omits recovery bodies; the complete reviewed plan stays in Store. */
export function presentProjectLayout(plan: LayoutPlan) {
    const state = ({ contentBase64: _bytes, ...value }: Record<string, unknown>) => value;
    return {
        schemaVersion: 1 as const,
        targetRoot: plan.projectRoot,
        status: plan.blockers.length ? 'blocked' : plan.changes.length ? 'ready' : 'unchanged',
        reviewDigest: plan.digest,
        configDigest: plan.configDigest,
        mappings: plan.mappings,
        entries: plan.entries.map(entry => ({...entry, state: state(entry.state as unknown as Record<string, unknown>)})),
        changes: plan.changes.map(change => ({...change, before: state(change.before as unknown as Record<string, unknown>), after: state(change.after as unknown as Record<string, unknown>)})),
        linkEdits: plan.linkEdits.filter(edit => edit.before !== edit.after),
        linkChecks: plan.linkEdits.filter(edit => edit.before === edit.after),
        metadataEdits: plan.metadataEdits,
        blockers: plan.blockers,
        exclusions: plan.exclusions,
        nextAction: plan.blockers.length
            ? 'Resolve the listed choices, then preview again.'
            : !plan.changes.length
                ? 'No layout migration is required. No operation needs to be prepared.'
                : `make-docs project layout prepare --review ${plan.digest} --mode cli --target-root ${JSON.stringify(plan.projectRoot)}${plan.mappings.map(mapping => ` --map ${JSON.stringify(mapping)}`).join('')}`,
    };
}

export function prepareProjectLayout(projectRoot: string, reviewDigest: string, mode: 'cli' | 'manual', mappings: string[] = [], storeRoot?: string) {
    const root = canonicalInstallationPath(projectRoot);
    let reviewed: LayoutPlan;
    const build = (withLedger = false) => {
        const plan = previewProjectLayout(root, mappings);
        if (plan.blockers.length) throw new InstallationStateError('ownership-unverified', plan.blockers.join('\n'));
        if (plan.digest !== reviewDigest || layoutPlanDigest(plan) !== reviewDigest) throw new InstallationStateError('snapshot-drift', 'The reviewed layout changed. Run layout preview and review its new digest.');
        reviewed = plan;
        return {schemaVersion: 1 as const, reviewDigest, mode, metadata: plan, changes: plan.changes, ...(withLedger ? {afterLedger: projectLayoutLedger(readInstallationManifest(root, storeRoot), plan)} : {})};
    };
    build(); // Reject stale reviews before opening or creating a Store.
    const result = prepareDetachedInstallationOperation(root, OPERATION, () => build(true), storeRoot);
    return {...result, targetRoot: root, ...(mode === 'manual' ? {
        instructions: reviewed!.changes.map(change => ({path: change.path, source: reviewed!.entries.find(entry => entry.destination === change.path && entry.state.kind === 'file')?.path, action: change.after.kind === 'missing' ? 'remove exact reviewed source only after destination byte checks' : change.after.kind === 'directory' ? 'create directory' : 'write reviewed destination', before: change.before, after: change.after})),
        entries: presentProjectLayout(reviewed!).entries,
        linkEdits: presentProjectLayout(reviewed!).linkEdits,
        linkChecks: presentProjectLayout(reviewed!).linkChecks,
        metadataEdits: reviewed!.metadataEdits,
        notice: 'Perform only these reviewed changes. Then run the verify command. Completion is recorded only after file and link checks pass.',
    } : {})};
}

export function applyProjectLayout(projectRoot: string, operationId: string, action: 'apply' | 'verify', dryRun = false, storeRoot?: string) {
    const root = canonicalInstallationPath(projectRoot);
    const saved = readDetachedInstallationOperation(root, operationId, OPERATION, storeRoot);
    const requiredMode = action === 'verify' ? 'manual' : 'cli';
    if (saved.plan.mode !== requiredMode) throw new InstallationStateError('recovery-required', `This plan uses ${saved.plan.mode} mode. Run ${nextAction(root, operationId, saved.plan.mode)}.`);
    if (saved.status === 'completed') return {schemaVersion: 1 as const, targetRoot: root, operationId, mode: saved.plan.mode, status: 'already-complete', nextAction: 'This operation is already complete. Preview again to review later changes.'};
    if (saved.status !== 'pending') throw new InstallationStateError('recovery-required', 'This operation was rolled back. Preview and prepare a new operation.');
    const result = recoverInstallationOperation(root, operationId, 'resume', dryRun, storeRoot);
    return {...result, targetRoot: root, mode: saved.plan.mode, reviewDigest: saved.plan.reviewDigest, nextAction: result.status === 'completed' ? 'Layout verification passed. No further action is required for this operation.' : nextAction(root, operationId, saved.plan.mode)};
}
