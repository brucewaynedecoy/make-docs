import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  P6_REQUIRED_PLATFORMS,
  comparePlatformEvidence,
  createCandidateRecord,
  createPlatformEvidence,
  resolveNpmLaunch,
  verifyCandidateRecord,
} from "../lib/w22-p6-package-proof.mjs";

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-p6-proof-"));
  const tarballPath = path.join(root, "candidate.tgz");
  const packageJsonPath = path.join(root, "package.json");
  writeFileSync(tarballPath, "candidate bytes");
  writeFileSync(packageJsonPath, JSON.stringify({ name: "@brucewaynedecoy/make-docs", version: "2.0.0-rc" }));
  return { root, tarballPath, packageJsonPath };
}

test("P6 candidate identity binds source, package metadata, bytes, and size", () => {
  const value = fixture();
  try {
    const candidate = createCandidateRecord({ ...value, sourceRevision: "abc123" });
    assert.equal(candidate.sourceRevision, "abc123");
    assert.equal(candidate.package.filename, "candidate.tgz");
    assert.equal(candidate.package.sha256.length, 64);
    assert.equal(verifyCandidateRecord(candidate, value.tarballPath), candidate);
    writeFileSync(value.tarballPath, "changed bytes");
    assert.throws(() => verifyCandidateRecord(candidate, value.tarballPath), /digest mismatch/);
  } finally {
    rmSync(value.root, { recursive: true, force: true });
  }
});

test("P6 comparison requires one passing result for each real platform", () => {
  const value = fixture();
  try {
    const candidate = createCandidateRecord({ ...value, sourceRevision: "abc123" });
    const records = P6_REQUIRED_PLATFORMS.map((platform) => createPlatformEvidence({
      platform,
      status: "passed",
      candidate,
      packageInstalled: true,
      sourceMatrixPassed: true,
    }));
    const comparison = comparePlatformEvidence(records);
    assert.equal(comparison.status, "passed");
    assert.deepEqual(comparison.platforms.map((item) => item.platform), P6_REQUIRED_PLATFORMS);
    assert.throws(() => comparePlatformEvidence(records.slice(1)), /missing ubuntu-latest/);
    assert.throws(
      () => comparePlatformEvidence([...records, records[0]]),
      /repeats ubuntu-latest/,
    );
    const extractOnly = createPlatformEvidence({
      platform: P6_REQUIRED_PLATFORMS[0],
      status: "passed",
      candidate,
      sourceMatrixPassed: true,
    });
    assert.throws(
      () => comparePlatformEvidence([extractOnly, ...records.slice(1)]),
      /did not execute an isolated installed package/,
    );
    const driftedContract = structuredClone(records[0]);
    driftedContract.installedSmokeContract[0].publicState = "different";
    assert.throws(
      () => comparePlatformEvidence([driftedContract, ...records.slice(1)]),
      /did not produce the required installed public contract/,
    );
  } finally {
    rmSync(value.root, { recursive: true, force: true });
  }
});

test("P6 npm launch keeps direct execution on non-Windows platforms", () => {
  assert.deepEqual(resolveNpmLaunch({ platform: "linux" }), { file: "npm", prefixArgs: [] });
});

test("P6 npm launch runs npm-cli.js through Node on Windows", () => {
  const execPath = String.raw`C:\node\node.exe`;
  const adjacentCli = String.raw`C:\node\node_modules\npm\bin\npm-cli.js`;
  assert.deepEqual(
    resolveNpmLaunch({
      platform: "win32",
      execPath,
      npmExecPath: null,
      npmCommandPaths: [],
      isFile: (candidate) => candidate === adjacentCli,
    }),
    { file: execPath, prefixArgs: [adjacentCli] },
  );

  const wrapper = String.raw`C:\Program Files\nodejs\npm.cmd`;
  const wrapperCli = String.raw`C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js`;
  assert.deepEqual(
    resolveNpmLaunch({
      platform: "win32",
      execPath: String.raw`D:\tools\node.exe`,
      npmExecPath: null,
      npmCommandPaths: [wrapper],
      isFile: (candidate) => candidate === wrapperCli,
    }),
    { file: String.raw`D:\tools\node.exe`, prefixArgs: [wrapperCli] },
  );
});

test("P6 npm launch fails closed when Windows npm-cli.js is absent", () => {
  assert.throws(
    () => resolveNpmLaunch({
      platform: "win32",
      execPath: String.raw`C:\node\node.exe`,
      npmExecPath: null,
      npmCommandPaths: [],
      isFile: () => false,
    }),
    /could not find npm-cli\.js/,
  );
});
