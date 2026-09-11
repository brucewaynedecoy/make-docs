import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { existsSync, readFileSync, renameSync, symlinkSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { recoverDeadStoreLeases, STORE_LEASE_RECOVERY_FILE } from "../src/store/lease-recovery";
import { cleanupTempDir, createTempDir } from "./helpers";

const roots: string[] = [];
const children: ChildProcess[] = [];
function fixture() { const root = createTempDir("w19-r3-leases-"); roots.push(root); return root; }
const childScript = `
const fs = require('node:fs');
const path = require('node:path');
const { hostname } = require('node:os');
const { DatabaseSync } = require('node:sqlite');
const root = process.env.LEASE_TEST_ROOT;
const db = new DatabaseSync(path.join(root, 'store.db'));
db.exec("CREATE TABLE pending (operation_id TEXT, status TEXT); INSERT INTO pending VALUES ('interrupted-operation', 'pending')");
db.close();
for (const name of ['installation-bootstrap.lock', 'store-access.lock', 'global-assets.lock']) {
  fs.writeFileSync(path.join(root, name), JSON.stringify({token:name+'-token',pid:process.pid,hostname:hostname()}), {flag:'wx'});
}
process.send({ready:true});
process.on('message', message => { if (message === 'exit') process.exit(0); });
`;
async function owner(root: string) {
  const child = spawn(process.execPath, ["--input-type=commonjs", "-e", childScript], {
    env: { ...process.env, LEASE_TEST_ROOT: root }, stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  children.push(child);
  let stderr = "";
  child.stderr?.on("data", value => { stderr += value; });
  await Promise.race([
    once(child, "message"),
    once(child, "exit").then(([code]) => { throw new Error(`Lease owner exited before ready (${code}): ${stderr}`); }),
  ]);
  return child;
}
async function stop(child: ChildProcess, signal?: NodeJS.Signals) {
  const exited = once(child, "exit");
  if (signal) child.kill(signal); else child.send("exit");
  await exited;
}
function assertPending(root: string) {
  const result = spawnSync(process.execPath, ["--input-type=commonjs", "-e", `
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(process.argv[1], {readOnly:true});
process.stdout.write(JSON.stringify(db.prepare('SELECT * FROM pending').get())); db.close();
`, path.join(root, "store.db")], { encoding: "utf8" });
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({ operation_id: "interrupted-operation", status: "pending" });
}
afterEach(async () => {
  vi.restoreAllMocks();
  for (const child of children.splice(0)) if (child.exitCode === null && child.signalCode === null) await stop(child, "SIGKILL");
  for (const root of roots.splice(0)) cleanupTempDir(root);
});

describe("explicit dead Store lease recovery", () => {
  test.each(["exit", "SIGKILL"] as const)("removes all verified leases after subprocess %s and preserves SQL intent", async mode => {
    const root = fixture();
    const child = await owner(root);
    await stop(child, mode === "exit" ? undefined : mode);
    const databaseBefore = readFileSync(path.join(root, "store.db"));
    expect(recoverDeadStoreLeases(root).removed).toEqual(["installation-bootstrap.lock", "store-access.lock", "global-assets.lock"]);
    expect(readFileSync(path.join(root, "store.db"))).toEqual(databaseBefore);
    assertPending(root);
    expect(existsSync(path.join(root, STORE_LEASE_RECOVERY_FILE))).toBe(false);
  });

  test("never steals leases from a live subprocess", async () => {
    const root = fixture();
    await owner(root);
    const before = readFileSync(path.join(root, "store-access.lock"));
    expect(() => recoverDeadStoreLeases(root)).toThrow("live process");
    expect(readFileSync(path.join(root, "store-access.lock"))).toEqual(before);
    expect(existsSync(path.join(root, "installation-bootstrap.lock"))).toBe(true);
    assertPending(root);
  });

  test.each(["foreign host", "missing host", "unreadable owner"])("preserves all leases when one owner has %s", async condition => {
    const root = fixture();
    const child = await owner(root);
    await stop(child);
    const file = path.join(root, "store-access.lock");
    const record = JSON.parse(readFileSync(file, "utf8"));
    if (condition === "foreign host") record.hostname = `${hostname()}-other`;
    if (condition === "missing host") delete record.hostname;
    writeFileSync(file, condition === "unreadable owner" ? "{" : JSON.stringify(record));
    const before = readFileSync(file);
    expect(() => recoverDeadStoreLeases(root)).toThrow();
    expect(readFileSync(file)).toEqual(before);
    expect(existsSync(path.join(root, "installation-bootstrap.lock"))).toBe(true);
  });

  test("serializes recovery without stealing an existing recovery guard", async () => {
    const root = fixture();
    const child = await owner(root);
    await stop(child);
    const guard = path.join(root, STORE_LEASE_RECOVERY_FILE);
    const bytes = JSON.stringify({ token: "other-recovery", pid: process.pid, hostname: hostname() });
    writeFileSync(guard, bytes);
    expect(() => recoverDeadStoreLeases(root)).toThrow("recovery guard");
    expect(readFileSync(guard, "utf8")).toBe(bytes);
    expect(existsSync(path.join(root, "store-access.lock"))).toBe(true);
  });

  test("rejects a replaced inode even when token and bytes match", async () => {
    const root = fixture();
    const child = await owner(root);
    await stop(child);
    const file = path.join(root, "installation-bootstrap.lock");
    const bytes = readFileSync(file);
    let replaced = false;
    const original = process.kill;
    vi.spyOn(process, "kill").mockImplementation((pid, signal) => {
      if (!replaced) {
        replaced = true;
        writeFileSync(`${file}.replacement`, bytes);
        renameSync(`${file}.replacement`, file);
      }
      return original(pid, signal);
    });
    expect(() => recoverDeadStoreLeases(root)).toThrow("Lease changed");
    expect(readFileSync(file)).toEqual(bytes);
    expect(existsSync(path.join(root, "store-access.lock"))).toBe(true);
  });

  test("refuses symlink leases without changing their targets", () => {
    const root = fixture();
    const target = path.join(root, "other-data");
    writeFileSync(target, "preserve");
    symlinkSync(target, path.join(root, "store-access.lock"));
    expect(() => recoverDeadStoreLeases(root)).toThrow("Unsafe Store path");
    expect(readFileSync(target, "utf8")).toBe("preserve");
  });
});
