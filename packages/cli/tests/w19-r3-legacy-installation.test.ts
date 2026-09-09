import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { previewLegacyInstallationState, importLegacyInstallationState } from "../src/store/legacy-installation";
import { importInstallationState, listMigrationState, recordMigrationState } from "../src/store/installation-state";
const roots: string[] = [];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function stable(value: any): string {
  const sort = (x: any): any => Array.isArray(x) ? x.map(sort) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k,v]) => [k,sort(v)])) : x;
  return JSON.stringify(sort(value));
}
function fixture(status = "completed") {
  const parent = realpathSync(mkdtempSync(path.join(os.tmpdir(), "make-docs-legacy-r3-"))); roots.push(parent);
  const root = path.join(parent, "project"), store = path.join(parent, "store");
  mkdirSync(path.join(root, ".make-docs/state/migration-receipts"), {recursive: true});
  mkdirSync(path.join(root, ".make-docs/backup/one/files"), {recursive: true});
  const snapshotId = `sha256:${hash("snapshot")}`;
  const subject = { status, checkpoint: 11, snapshotId, lockTokenDigest: hash("lock"), createdAt: "2026-09-09T00:00:00Z", code: null, message: "done", rollback: {attempted:false,completed:false,restoredPaths:[],unrestoredPaths:[]} };
  const receipt = { schemaVersion:1,receiptId:`sha256:${hash(stable(subject))}`, ...subject, claims:{validated:false,accepted:false,downstreamAuthorized:false,released:false} };
  const source = `.make-docs/state/migration-receipts/${receipt.receiptId.slice(7)}.json`;
  writeFileSync(path.join(root,source),JSON.stringify(receipt));
  writeFileSync(path.join(root,".make-docs/backup/one/files/doc.md"),"prior knowledge");
  writeFileSync(path.join(root,"doc.md"),"current knowledge");
  const backup = {schemaVersion:1,backupId:"one",snapshotId,projectRoot:root,repository:{projectRootDigest:hash(root)},entries:[{relativePath:"doc.md",backupPath:"files/doc.md",original:{relativePath:"doc.md",digest:hash("prior knowledge")},copied:true,verified:true}]};
  writeFileSync(path.join(root,".make-docs/backup/one/backup-manifest.json"),JSON.stringify(backup));
  return {root,store,source,receipt};
}
afterEach(() => {for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});
describe("bounded legacy installation transfer", () => {
  it("previews without creating a Store or changing a source", () => {
    const f=fixture(); const before=readFileSync(path.join(f.root,f.source));
    expect(previewLegacyInstallationState(f.root)).toMatchObject({blockers:[],recoveryRequired:false});
    expect(readFileSync(path.join(f.root,f.source))).toEqual(before);
    expect(existsSync(f.store)).toBe(false);
  });
  it("imports completed receipts once and removes only state metadata", () => {
    const f=fixture(); importLegacyInstallationState(f.root,f.store);
    expect(listMigrationState(f.root,"receipt",f.store)).toEqual([f.receipt]);
    expect(existsSync(path.join(f.root,".make-docs/state"))).toBe(false);
    expect(existsSync(path.join(f.root,".make-docs/backup/one/backup-manifest.json"))).toBe(false);
    expect(readFileSync(path.join(f.root,"doc.md"),"utf8")).toBe("current knowledge");
    expect(readFileSync(path.join(f.root,".make-docs/backup/one/files/doc.md"),"utf8")).toBe("prior knowledge");
    importLegacyInstallationState(f.root,f.store);
    expect(listMigrationState(f.root,"receipt",f.store)).toHaveLength(1);
  });
  it("blocks unknown inputs before Store creation and keeps all files", () => {
    const f=fixture(); writeFileSync(path.join(f.root,".make-docs/state/custom.json"),"{}");
    expect(()=>importLegacyInstallationState(f.root,f.store)).toThrow("Unknown legacy state");
    expect(existsSync(path.join(f.root,f.source))).toBe(true); expect(existsSync(f.store)).toBe(false);
  });
  it("preserves Finder metadata and records later migration state only in the Store", () => {
    const f=fixture(); const preserved=[".make-docs/state/.DS_Store", ".make-docs/state/migration-receipts/.DS_Store"];
    const bytes=Buffer.from([0,1,2,255]);
    for(const relative of preserved)writeFileSync(path.join(f.root,relative),bytes);
    const preview=previewLegacyInstallationState(f.root);
    expect(preview.blockers).toEqual([]); expect(preview.preservedFiles).toEqual(preserved);
    expect(preview.sources.some(source=>source.relativePath.endsWith(".DS_Store"))).toBe(false);
    importLegacyInstallationState(f.root,f.store);
    recordMigrationState(f.root,"quiescence","new-operation",{status:"active"},f.store);
    for(const relative of preserved)expect(readFileSync(path.join(f.root,relative))).toEqual(bytes);
    expect(existsSync(path.join(f.root,f.source))).toBe(false);
    expect(readdirSync(path.join(f.root,".make-docs/state"))).toEqual([".DS_Store","migration-receipts"]);
    expect(readdirSync(path.join(f.root,".make-docs/state/migration-receipts"))).toEqual([".DS_Store"]);
    expect(listMigrationState(f.root,"receipt",f.store)).toEqual([f.receipt]);
    expect(listMigrationState(f.root,"quiescence",f.store)).toEqual([{status:"active"}]);
  });
  it("rejects changed backup bytes and symbolic links", () => {
    const f=fixture(); writeFileSync(path.join(f.root,".make-docs/backup/one/files/doc.md"),"changed");
    expect(previewLegacyInstallationState(f.root).blockers.join(" ")).toContain("Backup content changed");
    const g=fixture(); rmSync(path.join(g.root,g.source)); symlinkSync(path.join(g.root,"doc.md"),path.join(g.root,g.source));
    expect(previewLegacyInstallationState(g.root).blockers.length).toBeGreaterThan(0);
  });
  it("keeps incomplete migration recovery explicit", () => {
    const f=fixture("paused"); expect(previewLegacyInstallationState(f.root)).toMatchObject({blockers:[],recoveryRequired:true});
  });
  it("resumes cleanup after a committed import without replaying project changes", () => {
    const f=fixture(); const preview=previewLegacyInstallationState(f.root);
    importInstallationState(f.root,{manifest:null,records:preview.records,importId:"interrupted",sources:preview.sources,recoveryRequired:false},f.store);
    rmSync(path.join(f.root,".make-docs/backup/one/backup-manifest.json"));
    importLegacyInstallationState(f.root,f.store);
    expect(existsSync(path.join(f.root,".make-docs/state"))).toBe(false);
    expect(readFileSync(path.join(f.root,"doc.md"),"utf8")).toBe("current knowledge");
  });
  it("preserves every remaining source when cleanup finds changed bytes", () => {
    const f=fixture(); const preview=previewLegacyInstallationState(f.root);
    importInstallationState(f.root,{manifest:null,records:preview.records,importId:"interrupted",sources:preview.sources,recoveryRequired:false},f.store);
    writeFileSync(path.join(f.root,f.source),"user edit");
    expect(()=>importLegacyInstallationState(f.root,f.store)).toThrow("Legacy source changed");
    expect(existsSync(path.join(f.root,".make-docs/backup/one/backup-manifest.json"))).toBe(true);
  });
  it("preserves copied sources when another checkout replaces the bound directory", () => {
    const f=fixture(); const preview=previewLegacyInstallationState(f.root);
    const copies=preview.sources.map(source=>({relativePath:source.relativePath,bytes:readFileSync(path.join(f.root,source.relativePath))}));
    importLegacyInstallationState(f.root,f.store);
    const priorConfig=readFileSync(path.join(f.root,".make-docs/config.yaml"));
    renameSync(f.root,`${f.root}-old`);
    mkdirSync(f.root);
    for(const copy of copies){mkdirSync(path.dirname(path.join(f.root,copy.relativePath)),{recursive:true});writeFileSync(path.join(f.root,copy.relativePath),copy.bytes);}
    writeFileSync(path.join(f.root,".make-docs/config.yaml"),priorConfig);
    expect(()=>importLegacyInstallationState(f.root,f.store)).toThrow("directory identity changed");
    for(const copy of copies)expect(readFileSync(path.join(f.root,copy.relativePath))).toEqual(copy.bytes);
  });
  it("does not delete sources when the Store is inside the project", () => {
    const f=fixture(); expect(()=>importLegacyInstallationState(f.root,path.join(f.root,"store"))).toThrow();
    expect(existsSync(path.join(f.root,f.source))).toBe(true);
  });
  it("blocks known old writers without deleting or expiring their lease", () => {
    const f=fixture(); writeFileSync(path.join(f.root,".make-docs/state/migration.lock.json"),JSON.stringify({pid:1,createdAt:"2000-01-01"}));
    expect(()=>importLegacyInstallationState(f.root,f.store)).toThrow("obsolete writer");
    expect(existsSync(path.join(f.root,".make-docs/state/migration.lock.json"))).toBe(true);
  });
});
