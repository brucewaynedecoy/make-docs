import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { loadSkillRegistry } from "../src/skill-registry";
import type { SkillRegistry } from "../src/skill-registry";

// W34 R0 P4 guard (PRD 08 R-SKILL-BUNDLE-7, PRD 25 Domain and Script
// Classification): a first-party Skill ships no Python and no hand-written
// script. The guard walks `packages/skills/` only. Installed copies such as
// `.agents/skills/` are out of scope: they are dogfood output that `make-docs
// setup skills` refreshes, not Skill source.

// @ts-expect-error Authoring-only JavaScript build helper.
const generator = await import("../scripts/build-backlog-presentation.mjs");

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const SKILLS_ROOT = path.resolve(PACKAGE_ROOT, "../skills");
const BACKLOG_SCRIPTS = "backlog-review/scripts";

type Problem = { path: string; problem: string };

/**
 * Every problem in a Skill source tree and its registry. `skillsRoot` is the
 * real `packages/skills/` or a test copy of it. The backlog-review bundles use
 * the P3 byte-match check, pointed at the same tree.
 */
function findSkillScriptProblems(skillsRoot: string, registry: SkillRegistry): Problem[] {
  const problems: Problem[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(skillsRoot, absolute).split(path.sep).join("/");
      if (entry.isDirectory()) {
        if (entry.name === "__pycache__") problems.push({ path: relative, problem: "pycache-folder" });
        visit(absolute);
        continue;
      }
      if (/\.py$/i.test(entry.name)) problems.push({ path: relative, problem: "python-file" });
      if (/\.pyc$/i.test(entry.name)) problems.push({ path: relative, problem: "python-bytecode" });
      // A Skill `scripts/` folder holds only generated bundles. Only
      // backlog-review has a generator, so a file in any other one is hand-written.
      const parts = relative.split("/");
      if (parts[1] === "scripts" && parts[0] !== "backlog-review" && !entry.name.startsWith(".")) {
        problems.push({ path: relative, problem: "not-generated" });
      }
    }
  };
  visit(skillsRoot);

  const scriptsDir = path.join(skillsRoot, BACKLOG_SCRIPTS);
  const bundleProblems = generator.checkPortableBacklogSkillScripts({
    readFile: (file: string) => readFileSync(path.join(scriptsDir, path.basename(file))),
    listScripts: () => readdirSync(scriptsDir),
  }) as Problem[];
  for (const bundle of bundleProblems) {
    problems.push({ path: `${BACKLOG_SCRIPTS}/${path.basename(bundle.path)}`, problem: bundle.problem });
  }

  for (const skill of registry.skills) {
    for (const value of [skill.entryPoint, ...skill.assets.flatMap((asset) => [asset.source, asset.installPath])]) {
      if (/\.pyc?$/i.test(value)) problems.push({ path: `registry:${skill.name}/${value}`, problem: "registry-python-entry" });
    }
  }
  return problems.sort((left, right) => left.path.localeCompare(right.path) || left.problem.localeCompare(right.problem));
}

const roots: string[] = [];
function copySkills(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-skill-guard-"));
  roots.push(root);
  const copy = path.join(root, "skills");
  cpSync(SKILLS_ROOT, copy, { recursive: true });
  return copy;
}
function plant(root: string, relativePath: string, content = "planted\n"): void {
  const absolute = path.join(root, relativePath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("W34 R0 P4 Skill scripts guard", () => {
  test("packages/skills and the Skill registry have no Python and no hand-written script", () => {
    expect(findSkillScriptProblems(SKILLS_ROOT, loadSkillRegistry(PACKAGE_ROOT))).toEqual([]);
  });

  test("a clean copy of packages/skills passes, so the planted cases below test only the plant", () => {
    expect(findSkillScriptProblems(copySkills(), loadSkillRegistry(PACKAGE_ROOT))).toEqual([]);
  });

  test("fails on a .py file anywhere in a Skill", () => {
    const root = copySkills();
    plant(root, "decompose-codebase/references/helper.py");
    expect(findSkillScriptProblems(root, loadSkillRegistry(PACKAGE_ROOT))).toEqual([
      { path: "decompose-codebase/references/helper.py", problem: "python-file" },
    ]);
  });

  test("fails on a .py file in a Skill scripts folder as Python and as hand-written", () => {
    const root = copySkills();
    plant(root, "cleanup-docs/scripts/check.py");
    expect(findSkillScriptProblems(root, loadSkillRegistry(PACKAGE_ROOT))).toEqual([
      { path: "cleanup-docs/scripts/check.py", problem: "not-generated" },
      { path: "cleanup-docs/scripts/check.py", problem: "python-file" },
    ]);
  });

  test("fails on a .pyc file", () => {
    const root = copySkills();
    plant(root, "archive-docs/references/trace.cpython-314.pyc");
    expect(findSkillScriptProblems(root, loadSkillRegistry(PACKAGE_ROOT))).toEqual([
      { path: "archive-docs/references/trace.cpython-314.pyc", problem: "python-bytecode" },
    ]);
  });

  test("fails on a __pycache__ folder, even an empty one", () => {
    const root = copySkills();
    mkdirSync(path.join(root, "preflight/__pycache__"), { recursive: true });
    expect(findSkillScriptProblems(root, loadSkillRegistry(PACKAGE_ROOT))).toEqual([
      { path: "preflight/__pycache__", problem: "pycache-folder" },
    ]);
  });

  test("fails when the registry declares a .py file", () => {
    const registry = structuredClone(loadSkillRegistry(PACKAGE_ROOT));
    const skill = registry.skills.find((candidate) => candidate.name === "archive-docs")!;
    skill.assets.push({ source: "scripts/trace_relationships.py", installPath: "scripts/trace_relationships.py" });
    expect(findSkillScriptProblems(SKILLS_ROOT, registry)).toEqual([
      { path: "registry:archive-docs/scripts/trace_relationships.py", problem: "registry-python-entry" },
      { path: "registry:archive-docs/scripts/trace_relationships.py", problem: "registry-python-entry" },
    ]);
  });

  test("fails on a hand-written file in a Skill scripts folder that has no generator", () => {
    const root = copySkills();
    plant(root, "decompose-codebase/scripts/check-output.mjs", "export {};\n");
    expect(findSkillScriptProblems(root, loadSkillRegistry(PACKAGE_ROOT))).toEqual([
      { path: "decompose-codebase/scripts/check-output.mjs", problem: "not-generated" },
    ]);
  });

  test("fails on an extra hand-written file in the backlog-review scripts folder", () => {
    const root = copySkills();
    plant(root, `${BACKLOG_SCRIPTS}/helper.mjs`, "export {};\n");
    expect(findSkillScriptProblems(root, loadSkillRegistry(PACKAGE_ROOT))).toEqual([
      { path: `${BACKLOG_SCRIPTS}/helper.mjs`, problem: "not-generated" },
    ]);
  });

  test("fails on a hand edit of a generated backlog-review bundle", () => {
    const root = copySkills();
    const target = path.join(root, BACKLOG_SCRIPTS, "render-report.mjs");
    writeFileSync(target, `${readFileSync(target, "utf8")}// hand edit\n`);
    expect(findSkillScriptProblems(root, loadSkillRegistry(PACKAGE_ROOT))).toEqual([
      { path: `${BACKLOG_SCRIPTS}/render-report.mjs`, problem: "bytes-differ" },
    ]);
  });

  test("ignores hidden files such as .DS_Store in a scripts folder, as the P3 check does", () => {
    const root = copySkills();
    plant(root, "cleanup-docs/scripts/.DS_Store");
    plant(root, `${BACKLOG_SCRIPTS}/.DS_Store`);
    expect(findSkillScriptProblems(root, loadSkillRegistry(PACKAGE_ROOT))).toEqual([]);
  });
});
