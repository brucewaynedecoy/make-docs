import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runToolUpdateCommand } from "../src/self/update-tool";
import { runToolUninstallCommand } from "../src/self/uninstall-tool";
import * as installationState from "../src/store/installation-state";
import { withInstallationDatabase } from "../src/store/installation-state";
import { prepareToolOperationStore, runRecordedToolOperation, withStoreRemovalLock, listPendingToolOperations } from "../src/store/tool-operations";
const roots: string[]=[];
function fixture(){const parent=mkdtempSync(path.join(os.tmpdir(),"make-docs-tool-r3-"));roots.push(parent);const root=path.join(parent,"project"),store=path.join(parent,"store");mkdirSync(root);return{root,store};}
const binary="/usr/local/lib/node_modules/@brucewaynedecoy/make-docs/dist/index.js";
const output={write:()=>{}};
function rows(root:string,store:string){return withInstallationDatabase(root,db=>db.prepare("SELECT * FROM tool_operations ORDER BY started_at").all(),{storeRoot:store,readOnly:true}) as {status:string;operation_id:string;metadata_json:string}[];}
afterEach(()=>{vi.restoreAllMocks();for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});
describe("required global tool operation state",()=>{
 it("reads missing machine state without creating a Store",()=>{
  const f=fixture();expect(listPendingToolOperations(f.root,f.store)).toEqual([]);expect(existsSync(f.store)).toBe(false);
 });
 it("saves intent before invoking the manager and records its result without a project identity",async()=>{
  const f=fixture();const exec=vi.fn(async()=>{expect(rows(f.root,f.store)).toMatchObject([{status:"pending"}]);return{exitCode:0};});
  await runToolUpdateCommand({yes:true,targetDir:f.root,storeRoot:f.store,argv1:binary,execPath:"/usr/local/bin/node",realpath:x=>x,exec,output});
  expect(exec).toHaveBeenCalledOnce();expect(rows(f.root,f.store)).toMatchObject([{status:"completed"}]);
  expect(readdirSync(f.root)).toEqual([]);
  const count=withInstallationDatabase(f.root,db=>db.prepare("SELECT count(*) AS n FROM installation_checkouts").get(),{storeRoot:f.store,readOnly:true});expect(count).toEqual({n:0});
 });
 it("does not invoke the manager when the Store is corrupt",async()=>{
  const f=fixture();mkdirSync(f.store);writeFileSync(path.join(f.store,"store.db"),"corrupt");const exec=vi.fn(async()=>({exitCode:0}));
  await expect(runToolUpdateCommand({yes:true,targetDir:f.root,storeRoot:f.store,argv1:binary,execPath:"/usr/local/bin/node",realpath:x=>x,exec,output})).rejects.toThrow();
  expect(exec).not.toHaveBeenCalled();expect(readdirSync(f.root)).toEqual([]);
 });
 it("keeps failed manager outcomes in the Store",async()=>{
  const f=fixture();prepareToolOperationStore(f.root,f.store);
  await runRecordedToolOperation(f.root,f.store,"tool.update",{manager:"npm",command:"update",binaryPath:binary},async()=>({exitCode:7}));
  expect(rows(f.root,f.store)).toMatchObject([{status:"failed"}]);expect(JSON.parse(rows(f.root,f.store)[0].metadata_json).exitCode).toBe(7);
 });
 it("blocks concurrent or interrupted pending tool operations",async()=>{
  const f=fixture();prepareToolOperationStore(f.root,f.store);let finish!:()=>void;const ready=new Promise<void>(resolve=>{finish=resolve;});
  const first=runRecordedToolOperation(f.root,f.store,"tool.update",{manager:"npm",command:"update",binaryPath:binary},async()=>{await ready;return{exitCode:0};});
  const second=vi.fn(async()=>({exitCode:0}));
  await expect(runRecordedToolOperation(f.root,f.store,"tool.uninstall",{manager:"npm",command:"uninstall",binaryPath:binary},second)).rejects.toThrow("is pending");
  expect(second).not.toHaveBeenCalled();
  expect(()=>installationState.acquireInstallationLock(f.root,f.store)).toThrow(/Tool operation .* is pending/);
  expect(listPendingToolOperations(f.root,f.store)).toMatchObject([{operation:"tool.update",status:"pending",nextAction:expect.stringContaining("Do not replay")}]);
  finish();await first;
 });
 it.each([false,true])("blocks a tool change during the checkout lease handoff (Store alias: %s)",async alias=>{
  const f=fixture();prepareToolOperationStore(f.root,f.store);
  // This is the exact handoff boundary: the SQL reservation is committed,
  // but the setup process has not acquired its long-lived filesystem lease.
  withInstallationDatabase(f.root,db=>db.prepare("INSERT INTO installation_locks VALUES (?,?,?,?,?)").run(f.root,"setup-reservation",process.pid,os.hostname(),new Date().toISOString()),{storeRoot:f.store});
  const selectedStore=alias?path.join(path.dirname(f.store),"store-alias"):f.store;
  if(alias)symlinkSync(f.store,selectedStore);
  const exec=vi.fn(async()=>({exitCode:0}));
  await expect(runRecordedToolOperation(f.root,selectedStore,"tool.update",{manager:"npm",command:"update",binaryPath:binary},exec)).rejects.toThrow("checkout writer is pending");
  expect(exec).not.toHaveBeenCalled();expect(rows(f.root,f.store)).toEqual([]);
 });
 it("blocks tool changes until an interrupted installation is resolved",async()=>{
  const f=fixture();
  expect(()=>installationState.withInstallationOperation(f.root,"setup.test",()=>{throw new Error("interrupted");},{storeRoot:f.store})).toThrow("interrupted");
  const exec=vi.fn(async()=>({exitCode:0}));
  await expect(runRecordedToolOperation(f.root,f.store,"tool.update",{manager:"npm",command:"update",binaryPath:binary},exec)).rejects.toThrow("installation operation");
  expect(exec).not.toHaveBeenCalled();expect(rows(f.root,f.store)).toEqual([]);
 });
 it("keeps pending evidence when the final Store receipt cannot be saved",async()=>{
  const f=fixture();prepareToolOperationStore(f.root,f.store);
  await expect(runRecordedToolOperation(f.root,f.store,"tool.update",{manager:"npm",command:"update",binaryPath:binary},async()=>{
    withInstallationDatabase(f.root,db=>db.exec("CREATE TRIGGER fail_tool_result BEFORE UPDATE ON tool_operations BEGIN SELECT RAISE(ABORT, 'receipt blocked'); END"),{storeRoot:f.store});
    return{exitCode:0};
  })).rejects.toThrow("receipt blocked");
  expect(rows(f.root,f.store)).toMatchObject([{status:"pending"}]);
 });
 it("blocks corrected writers during explicit Store removal",()=>{
  const f=fixture();prepareToolOperationStore(f.root,f.store);
  withStoreRemovalLock(f.root,f.store,()=>{
    expect(()=>prepareToolOperationStore(f.root,f.store)).toThrow();
  });
  expect(()=>prepareToolOperationStore(f.root,f.store)).not.toThrow();
  expect(existsSync(path.join(f.store,"removal.lock"))).toBe(false);
 });
 it("does not invoke a manager when Store removal starts after intent commit",async()=>{
  const f=fixture();prepareToolOperationStore(f.root,f.store);const original=installationState.withInstallationDatabase;let armed=true;
  vi.spyOn(installationState,"withInstallationDatabase").mockImplementation((root,fn,options)=>{
    const result=original(root,fn,options);
    if(armed&&!options?.readOnly){armed=false;writeFileSync(path.join(f.store,"removal.lock"),"test-remover");}
    return result;
  });
  const exec=vi.fn(async()=>({exitCode:0}));
  await expect(runRecordedToolOperation(f.root,f.store,"tool.update",{manager:"npm",command:"update",binaryPath:binary},exec)).rejects.toThrow(/removal/i);
  expect(exec).not.toHaveBeenCalled();rmSync(path.join(f.store,"removal.lock"));
  expect(rows(f.root,f.store)).toMatchObject([{status:"pending"}]);
 });
 it.each(["store-access.lock","installation-bootstrap.lock","global-assets.lock","installation-lease-recovery.lock"])("preserves the Store while %s is held",name=>{
  const f=fixture();prepareToolOperationStore(f.root,f.store);writeFileSync(path.join(f.store,name),JSON.stringify({token:"test",pid:process.pid,hostname:os.hostname()}));
  const remove=vi.fn();expect(()=>withStoreRemovalLock(f.root,f.store,remove)).toThrow();
  expect(remove).not.toHaveBeenCalled();expect(existsSync(path.join(f.store,"store.db"))).toBe(true);expect(existsSync(path.join(f.store,name))).toBe(true);
  expect(existsSync(path.join(f.store,"removal.lock"))).toBe(false);
 });
 it("preserves the Store when --yes confirms binary uninstall",async()=>{
  const f=fixture();const exec=vi.fn(async()=>({exitCode:0}));
  const result=await runToolUninstallCommand({yes:true,storeRoot:f.store,argv1:binary,execPath:"/usr/local/bin/node",realpath:x=>x,exec,output});
  expect(result.binary?.kind).toBe("removed");expect(result.storeRemoval).toBeNull();expect(existsSync(path.join(f.store,"store.db"))).toBe(true);
  expect(rows(f.root,f.store)).toMatchObject([{status:"completed"}]);
 });
});
