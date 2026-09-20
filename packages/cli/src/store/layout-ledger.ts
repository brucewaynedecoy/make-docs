import { getManifestFileHash, validateAndMigrateManifest } from '../manifest';
import type { LayoutPlan } from '../layout-plan';
import type { InstallManifest } from '../types';

/** Move only ownership already proved by the ledger; never adopt ordinary content. */
export function projectLayoutLedger(manifest: InstallManifest | null, plan: LayoutPlan): InstallManifest | null {
    if (!manifest) return null;
    const next = structuredClone(manifest);
    const destinations = new Map(plan.entries.filter(entry => entry.disposition === 'move' && entry.destination).map(entry => [entry.path, entry.destination!]));
    let changed = false;
    const mapped = (value: string) => destinations.get(value) ?? value;
    const stop = (relative: string): never => {throw new Error(`Layout ownership needs review at ${relative}. Run make-docs setup --dry-run and resolve the ownership conflict before preparing this move.`);};
    for (const [relative, entry] of Object.entries(manifest.files)) {
        const destination = mapped(relative);
        const before = plan.expectedBefore[relative];
        const after = plan.expectedAfter[destination];
        if (destination === relative && (!before || (after && before.kind === after.kind && before.digest === after.digest))) continue;
        if (!before || before.kind !== 'file' || !after || after.kind !== 'file' || before.contentBase64 === undefined || after.contentBase64 === undefined || entry.skillExposure || entry.agenticOwnership) stop(relative);
        if (getManifestFileHash(relative, Buffer.from(before.contentBase64!, 'base64').toString('utf8')) !== entry.hash) stop(relative);
        const destinationEntry = manifest.files[destination];
        if (destination !== relative && destinationEntry && (destinationEntry.sourceId !== entry.sourceId || destinationEntry.ownershipClass !== entry.ownershipClass || destinationEntry.hash !== entry.hash)) stop(destination);
        const hash = getManifestFileHash(destination, Buffer.from(after.contentBase64!, 'base64').toString('utf8'));
        if (!hash) stop(destination);
        const adjusted = {...entry, hash: hash!};
        if (adjusted.systemAsset) adjusted.systemAsset = {...adjusted.systemAsset, ...(adjusted.systemAsset.localPath ? {localPath: mapped(adjusted.systemAsset.localPath)} : {})};
        delete next.files[relative];
        next.files[destination] = adjusted;
        changed = true;
    }
    if (!changed) return manifest;
    next.systemAssetMaterialization.assets = Object.fromEntries(Object.entries(next.systemAssetMaterialization.assets).map(([key, asset]) => [mapped(key), {...asset, ...(asset.localPath ? {localPath: mapped(asset.localPath)} : {})}]));
    if (next.resourceProjection) for (const resource of Object.values(next.resourceProjection.resources)) {
        const destination = mapped(resource.managedDestination);
        if (destination !== resource.managedDestination || plan.expectedAfter[destination]?.digest !== plan.expectedBefore[destination]?.digest) {
            const after = plan.expectedAfter[destination];
            if (!after?.digest || after.kind !== 'file') stop(destination);
            resource.managedDestination = destination;
            resource.installedDigest = after.digest!;
        }
    }
    if (next.routerOwnership) next.routerOwnership.routers = Object.fromEntries(Object.entries(next.routerOwnership.routers).map(([key, router]) => {
        const destination = mapped(key);
        const file = next.files[destination];
        if (!file) stop(destination);
        return [destination, {...router, relativePath: mapped(router.relativePath), installedHash: file.hash}];
    }));
    next.skillFiles = next.skillFiles.map(mapped);
    try { return validateAndMigrateManifest(next, 'Prepared layout ownership'); }
    catch (error) { throw new Error(`The reviewed move cannot preserve this installation ownership shape. Run make-docs setup --dry-run before layout preparation. ${error instanceof Error ? error.message : String(error)}`); }
}
