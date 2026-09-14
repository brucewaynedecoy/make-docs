/** Test layer: unit. */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { assertDisposableSetupAccessLabRoot } from "../src/conformance/support-lab.js";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function temporaryLabRoot(): { parent: string; session: string } {
  const parent = mkdtempSync(path.join(os.tmpdir(), "make-docs-support-lab-test-"));
  roots.push(parent);
  return {
    parent,
    session: path.join(parent, "make-docs-conformance-lab", "session"),
  };
}

describe("W19 R6 setup-access lab boundary", () => {
  it("accepts only an absent or empty disposable lab session", () => {
    const { session } = temporaryLabRoot();
    const repo = path.resolve(process.cwd());
    expect(() => assertDisposableSetupAccessLabRoot(session, repo)).not.toThrow();
    mkdirSync(session, { recursive: true });
    expect(() => assertDisposableSetupAccessLabRoot(session, repo)).not.toThrow();

    writeFileSync(path.join(session, "user-content.txt"), "preserve me\n");
    expect(() => assertDisposableSetupAccessLabRoot(session, repo)).toThrow("must be absent or empty");
  });

  it("rejects the real home, every real-home child, and every real-home parent", () => {
    const repo = path.resolve(process.cwd());
    const home = path.resolve(os.homedir());
    for (const unsafe of [home, path.join(home, "make-docs-conformance-lab", "session")]) {
      expect(() => assertDisposableSetupAccessLabRoot(unsafe, repo)).toThrow("real home boundary");
    }
    expect(() => assertDisposableSetupAccessLabRoot(path.dirname(home), repo)).toThrow();
  });

  it("rejects the repository, repository children, repository parents, and unnamed lab roots", () => {
    const repo = path.resolve(process.cwd());
    const { parent } = temporaryLabRoot();
    for (const unsafe of [repo, path.join(repo, "make-docs-conformance-lab", "session")]) {
      expect(() => assertDisposableSetupAccessLabRoot(unsafe, repo)).toThrow("repository");
    }
    expect(() => assertDisposableSetupAccessLabRoot(path.dirname(repo), repo)).toThrow();
    expect(() => assertDisposableSetupAccessLabRoot(path.join(parent, "session"), repo)).toThrow(
      "must be under a directory named `make-docs-conformance-lab`",
    );
  });
});
