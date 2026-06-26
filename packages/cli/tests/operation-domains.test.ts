import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  getOperationDomain,
  listOperationDomains,
  readWorkPhaseState,
} from "../src/operations/index";
import { cleanupTempDir, createTempDir } from "./helpers";

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

describe("operation domain modules", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("declare the initial CLI/MCP operation-domain map", () => {
    expect(listOperationDomains()).toEqual([
      expect.objectContaining({
        name: "closeout",
        commands: [
          expect.objectContaining({ name: "closeout-probe", mutates: false }),
          expect.objectContaining({ name: "closeout-validate", mutates: false }),
          expect.objectContaining({ name: "closeout-history", mutates: true }),
        ],
      }),
      expect.objectContaining({
        name: "work",
        commands: [
          expect.objectContaining({ name: "work-phase-state", mutates: false }),
          expect.objectContaining({ name: "wave-resolve", mutates: false }),
          expect.objectContaining({ name: "wave-status", mutates: false }),
          expect.objectContaining({ name: "phase-plan", mutates: false }),
        ],
      }),
      expect.objectContaining({
        name: "lifecycle",
        commands: [
          expect.objectContaining({ name: "checkpoint", mutates: true }),
          expect.objectContaining({ name: "scope-guard", mutates: false }),
          expect.objectContaining({ name: "phase-gate", mutates: false }),
        ],
      }),
    ]);

    expect(getOperationDomain("work").summary).toContain("Wave");
  });

  test("runs a work-domain operation without CLI parser or MCP transport setup", () => {
    const root = createTempDir("make-docs-operation-domain-");
    tempRoots.push(root);
    execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
    const phasePath = writeFile(
      root,
      "docs/work/2026-06-26-w10-r8-example/01-domain.md",
      [
        "# Phase 01: Domain",
        "",
        "## Tasks",
        "",
        "- [x] t1: Define folders.",
        "- [ ] t2: Add direct tests.",
        "",
        "## Acceptance Criteria",
        "",
        "- Domain tests can run without CLI parser setup.",
        "",
      ].join("\n"),
    );

    const result = readWorkPhaseState(phasePath);

    expect(result.provenance).toEqual({
      domain: "work",
      operation: "work-phase-state",
      source: "shared",
      target: phasePath,
    });
    expect(result.value.coordinate).toEqual({ w: 10, r: 8, p: 1 });
    expect(result.value.uncheckedTasks.map((task) => task.id)).toEqual(["t2"]);
  });
});
