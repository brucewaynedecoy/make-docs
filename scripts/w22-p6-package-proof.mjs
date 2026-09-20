import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  comparePlatformEvidence,
  createCandidateRecord,
  createPlatformEvidence,
  readJsonFiles,
  resolveNpmLaunch,
  verifyCandidateRecord,
  writeJson,
} from "./lib/w22-p6-package-proof.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

function parseOptions(args) {
  const [command, ...rest] = args;
  if (!command || !["candidate", "verify", "compare"].includes(command)) {
    throw new Error("Use candidate, verify, or compare.");
  }
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (!key?.startsWith("--") || !value || value.startsWith("--")) {
      throw new Error(`P6 proof option ${key ?? "(missing)"} needs one value.`);
    }
    options[key.slice(2)] = value;
  }
  return { command, options };
}

function requireOptions(options, names) {
  for (const name of names) {
    if (!options[name]) throw new Error(`P6 proof requires --${name}.`);
  }
}

function findWindowsNpmCommands() {
  if (process.platform !== "win32") return [];
  try {
    return execFileSync("where.exe", ["npm.cmd"], { encoding: "utf8" })
      .split(/\r?\n/u)
      .map((value) => value.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const { command, options } = parseOptions(process.argv.slice(2));

if (command === "candidate") {
  requireOptions(options, ["tarball", "package-json", "source-revision", "output"]);
  const candidate = createCandidateRecord({
    tarballPath: path.resolve(options.tarball),
    packageJsonPath: path.resolve(options["package-json"]),
    sourceRevision: options["source-revision"],
  });
  writeJson(path.resolve(options.output), candidate);
  console.log(`P6 package candidate ${candidate.package.sha256} recorded.`);
}

if (command === "verify") {
  requireOptions(options, ["candidate", "tarball", "platform", "source-matrix", "output"]);
  const candidate = JSON.parse(readFileSync(path.resolve(options.candidate), "utf8"));
  const tarballPath = path.resolve(options.tarball);
  const installRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-p6-install-"));
  let installedPackageRoot = null;
  let packageInstalled = false;
  const sourceMatrixPassed = options["source-matrix"] === "passed";
  let failure = null;
  try {
    verifyCandidateRecord(candidate, tarballPath);
    if (!sourceMatrixPassed) {
      throw new Error("P6 required source safety matrix did not pass.");
    }
    installedPackageRoot = path.join(
      installRoot,
      "node_modules",
      ...candidate.package.name.split("/"),
    );
    const npmLaunch = resolveNpmLaunch({ npmCommandPaths: findWindowsNpmCommands() });
    execFileSync(
      npmLaunch.file,
      [
        ...npmLaunch.prefixArgs,
        "install",
        "--prefix",
        installRoot,
        "--cache",
        path.join(installRoot, ".npm-cache"),
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        tarballPath,
      ],
      { cwd: installRoot, env: process.env, stdio: "inherit" },
    );
    if (!existsSync(installedPackageRoot)) {
      throw new Error(`P6 package install did not create ${installedPackageRoot}.`);
    }
    packageInstalled = true;
    execFileSync(
      process.execPath,
      [
        path.join(scriptDir, "smoke-pack.mjs"),
        "--mode",
        "local",
        "--tarball",
        tarballPath,
        "--installed-package-root",
        installedPackageRoot,
      ],
      { cwd: repoRoot, env: process.env, stdio: "inherit" },
    );
  } catch (error) {
    failure = error instanceof Error ? error : new Error(String(error));
  } finally {
    rmSync(installRoot, { recursive: true, force: true });
  }
  const evidence = createPlatformEvidence({
    platform: options.platform,
    status: failure ? "failed" : "passed",
    candidate,
    packageInstalled,
    sourceMatrixPassed,
    error: failure?.message,
  });
  writeJson(path.resolve(options.output), evidence);
  if (failure) throw failure;
  console.log(`P6 installed package proof passed on ${options.platform}.`);
}

if (command === "compare") {
  requireOptions(options, ["evidence-dir", "output"]);
  const comparison = comparePlatformEvidence(readJsonFiles(path.resolve(options["evidence-dir"])));
  writeJson(path.resolve(options.output), comparison);
  console.log("P6 installed package comparison passed for Windows, macOS, and Linux.");
}
