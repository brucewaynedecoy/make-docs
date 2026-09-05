import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  createDefaultMakeDocsConfig,
  formatMakeDocsConfigDiagnostics,
  getMakeDocsConfigPath,
  loadMakeDocsConfig,
  loadMakeDocsConfigOrThrow,
} from "../src/config";

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = path.join(
    os.tmpdir(),
    `make-docs-config-${process.pid}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  tempDirs.push(dir);
  return dir;
}

function writeConfig(targetDir: string, content: string): void {
  const configPath = getMakeDocsConfigPath(targetDir);
  mkdirSync(path.dirname(configPath), { recursive: true });
  writeFileSync(configPath, content, "utf8");
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("make-docs project config", () => {
  test("uses shipped defaults when config is missing", () => {
    const targetDir = createTempDir();
    const loaded = loadMakeDocsConfig(targetDir);

    expect(loaded.present).toBe(false);
    expect(loaded.valid).toBe(true);
    expect(loaded.diagnostics).toEqual([]);
    expect(loaded.config).toEqual(createDefaultMakeDocsConfig());
    expect(loaded.config.personas.map((persona) => persona.slug)).toEqual([
      "agent",
      "developer",
      "user",
    ]);
  });

  test("accepts valid display labels, generated prose defaults, and persona overlays", () => {
    const targetDir = createTempDir();
    writeConfig(
      targetDir,
      `labels:
  lifecycle:
    design: Ideas
  documentKinds:
    prd: Requirement
  coordinates:
    wave: Batch
    phase: Step
generatedProse:
  welcomeHeading: "Project documentation"
harnessCapabilities:
  - harness: codex
    reviewStatus: reviewed
    source: manual-test
    capabilities:
      goal_managed_execution: true
      long_running_runs: true
      resume_after_interrupt: true
      parallel_playbook_runs: false
      subagent_delegation: false
      user_gate_prompts: true
    caveats:
      - "Parallel runs require explicit user approval."
personas:
  - slug: developer
    label: Maintainer
    description: "People maintaining this project."
    primitive: maintainer
  - slug: qa-reviewer
    label: QA Reviewer
    description: "People reviewing validation output."
    primitive: maintainer
`,
    );

    const loaded = loadMakeDocsConfig(targetDir);

    expect(loaded.valid).toBe(true);
    expect(loaded.config.labels.lifecycle.design).toBe("Ideas");
    expect(loaded.config.labels.documentKinds.prd).toBe("Requirement");
    expect(loaded.config.labels.coordinates.wave).toBe("Batch");
    expect(loaded.config.labels.coordinates.phase).toBe("Step");
    expect(loaded.config.generatedProse).toEqual({
      welcomeHeading: "Project documentation",
    });
    expect(loaded.config.harnessCapabilities).toEqual([
      {
        harness: "codex",
        reviewStatus: "reviewed",
        source: "manual-test",
        capabilities: {
          goal_managed_execution: true,
          long_running_runs: true,
          resume_after_interrupt: true,
          subagent_delegation: false,
          user_gate_prompts: true,
        },
        caveats: ["Parallel runs require explicit user approval."],
      },
    ]);
    expect(loaded.config.personas).toContainEqual({
      slug: "developer",
      label: "Maintainer",
      description: "People maintaining this project.",
      primitive: "maintainer",
    });
    expect(loaded.config.personas).toContainEqual({
      slug: "qa-reviewer",
      label: "QA Reviewer",
      description: "People reviewing validation output.",
      primitive: "maintainer",
    });
    expect(loaded.config.personas.map((persona) => persona.slug)).toEqual([
      "agent",
      "developer",
      "user",
      "qa-reviewer",
    ]);
  });

  test("reports malformed YAML with file and root key path", () => {
    const targetDir = createTempDir();
    writeConfig(
      targetDir,
      `labels:
  lifecycle:
    design: [unterminated
`,
    );

    const loaded = loadMakeDocsConfig(targetDir);

    expect(loaded.valid).toBe(false);
    expect(loaded.diagnostics[0]).toMatchObject({
      code: "parse-error",
      filePath: getMakeDocsConfigPath(targetDir),
      keyPath: "<root>",
    });
    expect(formatMakeDocsConfigDiagnostics(loaded)).toContain("<root>");
  });

  test("rejects unknown top-level and display-label keys", () => {
    const targetDir = createTempDir();
    writeConfig(
      targetDir,
      `appearance:
  theme: docs
labels:
  lifecycle:
    idea: Ideas
`,
    );

    const loaded = loadMakeDocsConfig(targetDir);

    expect(loaded.valid).toBe(false);
    expect(loaded.diagnostics.map((diagnostic) => diagnostic.keyPath)).toEqual([
      "appearance",
      "labels.lifecycle.idea",
    ]);
    expect(loaded.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "unknown-key",
      "unknown-key",
    ]);
  });

  test("rejects structural rename attempts", () => {
    const targetDir = createTempDir();
    writeConfig(
      targetDir,
      `paths:
  designs: docs/ideas
labels:
  coordinates:
    wave: Batch
`,
    );

    const loaded = loadMakeDocsConfig(targetDir);

    expect(loaded.valid).toBe(false);
    expect(loaded.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "structural-rename-attempt",
        keyPath: "paths",
      }),
    );
    expect(() => loadMakeDocsConfigOrThrow(targetDir)).toThrow(
      /structural paths, metadata fields, kind values/,
    );
  });

  test("rejects canonical route prompt skill contract and harness rename attempts", () => {
    const targetDir = createTempDir();
    writeConfig(
      targetDir,
      `routeIds:
  design: idea-flow
promptPaths:
  design: .make-docs/prompts/ideas.md
skillNames:
  closeout-phase: finish-step
contractNames:
  guide-contract: library-contract
harnessNames:
  codex: assistant
`,
    );

    const loaded = loadMakeDocsConfig(targetDir);

    expect(loaded.valid).toBe(false);
    expect(loaded.diagnostics.map((diagnostic) => diagnostic.keyPath)).toEqual([
      "routeIds",
      "promptPaths",
      "skillNames",
      "contractNames",
      "harnessNames",
    ]);
    expect(loaded.diagnostics.every(
      (diagnostic) => diagnostic.code === "structural-rename-attempt",
    )).toBe(true);
  });

  test("rejects invalid persona primitive values", () => {
    const targetDir = createTempDir();
    writeConfig(
      targetDir,
      `personas:
  - slug: operator
    label: Operator
    description: "People operating the workflow."
    primitive: admin
`,
    );

    const loaded = loadMakeDocsConfig(targetDir);

    expect(loaded.valid).toBe(false);
    expect(loaded.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "invalid-primitive",
        keyPath: "personas[0].primitive",
      }),
    );
  });

  test("rejects duplicate configured persona slugs", () => {
    const targetDir = createTempDir();
    writeConfig(
      targetDir,
      `personas:
  - slug: reviewer
    label: Reviewer
    description: "People reviewing docs."
    primitive: maintainer
  - slug: reviewer
    label: Second Reviewer
    description: "Duplicate slug."
    primitive: maintainer
`,
    );

    const loaded = loadMakeDocsConfig(targetDir);

    expect(loaded.valid).toBe(false);
    expect(loaded.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "duplicate-persona-slug",
        keyPath: "personas[1].slug",
      }),
    );
  });

  test("rejects invalid harness capability ids and review statuses", () => {
    const targetDir = createTempDir();
    writeConfig(
      targetDir,
      `harnessCapabilities:
  - harness: codex
    reviewStatus: guessed
    capabilities:
      goal_managed_execution: true
      imaginary_capability: true
`,
    );

    const loaded = loadMakeDocsConfig(targetDir);

    expect(loaded.valid).toBe(false);
    expect(loaded.diagnostics).toEqual([
      expect.objectContaining({
        code: "invalid-harness-capability-id",
        keyPath: "harnessCapabilities[0].capabilities.imaginary_capability",
      }),
      expect.objectContaining({
        code: "invalid-review-status",
        keyPath: "harnessCapabilities[0].reviewStatus",
      }),
    ]);
  });
});
