/**
 * W18 R13 P2 coverage (PRD 43 R-KIT-1..3, R-INST-1..2, R-PROMPT-1, R-DISC-1,
 * R-HOME-1..2; PRD 44 R-EXEC-1..3, R-NAME-1..2): the generated per-target
 * conformance kit — executable-by-construction generation over the committed
 * definitions and the capability descriptors, the fixed session layout, the
 * D-023 defect classes proven impossible in generated output, deterministic
 * per-stage instrument scripts runnable over a synthetic fixture session,
 * the honesty-core prompt rendering, the discovery kit with its R-021
 * linkage, the session manifest, and the shipped-surface parity assertion
 * (nothing registered, nothing on the CLI tree or MCP).
 *
 * Test layer: unit (R-LAYER-1) — the kit generator, instrument templates,
 * and prompt rendering are exercised in-process. Static command projection
 * and active quiescence are checked on the materialized fixture. Generated
 * instruments run over a synthetic fixture tree. No harness is ever driven.
 * They prove the lab machinery — they are NEVER harness-recognition
 * evidence, and internal tests passing is never evidence that a harness
 * recognizes or can use the output (R-LAYER-2, PRD 36 R-TEST-5).
 */

import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import type { ConformanceLabTarget } from "../src/conformance";
import {
  CONFORMANCE_PROMPT_HONESTY_RULES,
  CONFORMANCE_PROMPT_MEASUREMENT_RULE,
  CONFORMANCE_SESSION_MANIFEST_SCHEMA_VERSION,
  generateConformanceKit,
  generateFirstPassConformanceKitSuite,
  listConformanceLabShippedSurfaceViolations,
  listHarnessPlacementRoots,
  listMakeDocsInvocations,
  loadPackagingConformanceScenarioSpec,
  validatePackagingConformanceScenarioSpec,
  type GeneratedConformanceKit,
  type PackagingConformanceScenarioSpec,
} from "../src/conformance";
import { TEMPLATE_ROOT } from "../src/utils";

const REPO_ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");
const PLUGIN_SPEC_PATH = path.join(
  REPO_ROOT,
  "conformance/scenarios/packaging/plugin-marketplace-install.json",
);

function tempDir(prefix: string): string {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

function loadPluginSpecDocument(): Record<string, unknown> {
  return JSON.parse(readFileSync(PLUGIN_SPEC_PATH, "utf8")) as Record<string, unknown>;
}

/* ------------------------------------------------------------------------ */
/* Synthetic fixture: a harness-free definition + descriptor whose kit and   */
/* instruments run locally (no make-docs commands, no harness).              */
/* ------------------------------------------------------------------------ */

const FIXTURE_LAB_DESCRIPTOR: ConformanceLabTarget = {
  harnessId: "fixture-lab",
  placementRoots: ["managed"],
  verification: { status: "provisional" },
  labInterrogation: {
    versionCommand: null,
    launchCommand: null,
    listingCaptures: [
      {
        id: "managed-listing",
        description: "Recursive listing of the fixture harness's managed root.",
        status: "provisional",
        reference: "packages/cli/tests/conformance-kit.test.ts (fixture harness)",
        form: { kind: "directory-listing", path: "managed" },
      },
    ],
    invocationEvidence: null,
    workspaceNotes: [],
    knownGaps: ["Fixture harness; no real listing or invocation surface exists."],
  },
};

const FIXTURE_SPEC: PackagingConformanceScenarioSpec = validatePackagingConformanceScenarioSpec({
  schemaVersion: "conformance.scenario.v1",
  scenarioId: "packaging/fixture-instrument-outcome",
  scenarioVersion: "1.0.0",
  title: "Fixture: instrument behavior over a synthetic workspace",
  sourceRequirements: ["docs/prd/43-conformance-scenario-model-and-execution-kits.md"],
  safetyMode: "temp-fixture-apply",
  requiresNetwork: false,
  requiresCredentials: false,
  destructive: false,
  prerequisites: ["None; synthetic fixture."],
  steps: [
    {
      kind: "command",
      run: 'WORKSPACE=$(mktemp -d) && mkdir -p "$WORKSPACE/managed" && printf \'user file\\n\' > "$WORKSPACE/user-note.txt"',
      transcript: "context",
      notes: "Synthetic workspace with a user-authored sentinel.",
    },
    {
      kind: "command",
      run: "printf 'artifact\\n' > \"$WORKSPACE/managed/artifact.txt\"",
      transcript: "context",
      barStage: "install",
    },
    {
      kind: "harness-action",
      action: "Observe the fixture harness's listing surface.",
      barStage: "discover",
    },
    {
      kind: "harness-action",
      action: "Invoke the fixture skill in a fresh thread.",
      barStage: "invoke",
    },
    {
      kind: "assertion",
      assert: "The transcript contains MAKE-DOCS-CONFORMANCE-FIXTURE-PROBE-OK.",
      barStage: "invoke",
    },
    {
      kind: "command",
      run: 'rm -f "$WORKSPACE/managed/artifact.txt"',
      transcript: "context",
      barStage: "uninstall",
    },
    {
      kind: "assertion",
      assert: "The managed artifact is removed and the user sentinel survives byte-identical.",
      barStage: "uninstall",
    },
  ],
  expectedEvidence: ["Instrument outputs under evidence/."],
  artifactPolicy: "local-generated",
  supportClaimScope: "scenario-harness-model-provider-runtime",
  packagingExtension: {
    domain: "packaging",
    evidenceBar: {
      install: ["The install command exits 0 and the managed artifact is inventoried."],
      discover: ["The managed listing capture records the artifact."],
      invoke: ["The transcript contains MAKE-DOCS-CONFORMANCE-FIXTURE-PROBE-OK."],
      uninstall: ["The diff shows the managed artifact removed and the user sentinel unchanged."],
    },
    preconditions: [
      {
        id: "fixture-cli",
        kind: "harness-cli",
        description: "Fixture probe.",
        probe: "command-succeeds",
        onUnmet: "blocked",
      },
    ],
    transcriptPolicy: "json-or-non-tty",
    workspacePolicy: "disposable-fixture-workspace",
    fixturePlaybooks: [],
    targets: {
      "fixture-lab": {
        registryTupleIds: ["fixture-lab-tuple"],
        harnessExecution: { mode: "real-harness", simulationMechanics: null },
        preconditionProbes: {
          "fixture-cli": { command: "true", args: [] },
        },
      },
    },
  },
});

async function generateFixtureKit(): Promise<GeneratedConformanceKit> {
  return generateConformanceKit({
    spec: FIXTURE_SPEC,
    harness: "fixture-lab",
    sessionRoot: path.join(tempDir("kit-fixture-"), "session"),
    repoRoot: REPO_ROOT,
    sessionId: "2026-07-06-fixture-lab-fixture-instrument-outcome",
    descriptors: [FIXTURE_LAB_DESCRIPTOR],
    cliVersion: "test",
  });
}

function nodeScript(kit: GeneratedConformanceKit, relative: string, args: string[] = []) {
  return spawnSync(process.execPath, [path.join(kit.sessionRoot, relative), ...args], {
    encoding: "utf8",
  });
}

function readEvidence(kit: GeneratedConformanceKit, relative: string): string {
  return readFileSync(path.join(kit.sessionRoot, relative), "utf8");
}

/* ------------------------------------------------------------------------ */
/* Session-root guards apply to all scenarios, including synthetic targets. */
/* ------------------------------------------------------------------------ */

describe("regenerating into an occupied session root (R-KIT-2, D-028)", () => {
    const sharedFixtureInput = {
      spec: FIXTURE_SPEC,
      harness: "fixture-lab",
      repoRoot: REPO_ROOT,
      sessionId: "2026-07-06-fixture-lab-fixture-instrument-outcome",
      descriptors: [FIXTURE_LAB_DESCRIPTOR],
      cliVersion: "test",
    };

    test("a session root inside the repository is refused (R-KIT-2)", async () => {
      const sessionRoot = path.join(REPO_ROOT, "conformance", "never-here");
      await expect(
        generateConformanceKit({ ...sharedFixtureInput, sessionRoot }),
      ).rejects.toThrow(/inside the repository/);
      expect(existsSync(sessionRoot)).toBe(false);
    });

    test("without --force, an occupied root fails closed and names both escape hatches", async () => {
      const sessionRoot = path.join(tempDir("kit-occupied-"), "session");
      await generateConformanceKit({ ...sharedFixtureInput, sessionRoot });
      const error = await generateConformanceKit({ ...sharedFixtureInput, sessionRoot }).catch(
        (caught) => caught,
      );
      expect(error).toBeInstanceOf(Error);
      const message = (error as Error).message;
      expect(message).toMatch(/already exists and is not empty/);
      expect(message).toMatch(/R-KIT-2/);
      expect(message).toMatch(/--force/);
      expect(message).toMatch(/--disambiguator/);
      expect(message).toMatch(/D-028/);
    });

    test("--force replaces a superseded lab session in place, leaving no stale evidence", async () => {
      const sessionRoot = path.join(tempDir("kit-force-"), "session");
      await generateConformanceKit({ ...sharedFixtureInput, sessionRoot });
      // A stray artifact from the prior round must NOT survive the regenerate:
      // --force starts fresh, it never merges into leftover evidence.
      const staleMarker = path.join(sessionRoot, "evidence", "stale-from-prior-round.txt");
      writeFileSync(staleMarker, "stale");

      const regenerated = await generateConformanceKit({
        ...sharedFixtureInput,
        sessionRoot,
        force: true,
      });
      expect(existsSync(staleMarker)).toBe(false);
      expect(regenerated.sessionRoot).toBe(sessionRoot);
      expect(existsSync(regenerated.manifestPath)).toBe(true);
    });

    test("--force refuses a directory that is not a lab session (footgun guard)", async () => {
      const foreign = tempDir("kit-foreign-");
      writeFileSync(path.join(foreign, "precious.txt"), "do not delete");
      await expect(
        generateConformanceKit({ ...sharedFixtureInput, sessionRoot: foreign, force: true }),
      ).rejects.toThrow(/Refusing to .*force.* remove/);
      // The guard fired before any deletion: the foreign file survives.
      expect(readFileSync(path.join(foreign, "precious.txt"), "utf8")).toBe("do not delete");
    });
  });


describe("instruments over a synthetic session (R-INST-1..2)", () => {
  test("install, discover, invoke, and uninstall instruments produce machine-verifiable, byte-stable outputs", async () => {
    const kit = await generateFixtureKit();

    // install: executes the install commands, capturing exit codes and the
    // placement-root inventory.
    const firstInstall = nodeScript(kit, "kit/instruments/install.mjs");
    expect(firstInstall.status).toBe(0);
    const commandsFirst = readEvidence(kit, "evidence/install/commands.json");
    const inventoryFirst = readEvidence(kit, "evidence/install/placement-inventory.json");
    expect(JSON.parse(commandsFirst).commands[0].exitCode).toBe(0);
    expect(inventoryFirst).toContain("managed/artifact.txt");
    // Byte-stable across repeated runs (R-INST-2 determinism).
    expect(nodeScript(kit, "kit/instruments/install.mjs").status).toBe(0);
    expect(readEvidence(kit, "evidence/install/commands.json")).toBe(commandsFirst);
    expect(readEvidence(kit, "evidence/install/placement-inventory.json")).toBe(inventoryFirst);

    // discover: captures the descriptor-declared listing surfaces.
    expect(nodeScript(kit, "kit/instruments/discover.mjs").status).toBe(0);
    const captures = JSON.parse(readEvidence(kit, "evidence/discover/captures.json"));
    expect(captures.captures.map((capture: { id: string }) => capture.id)).toEqual(["managed-listing"]);
    expect(readEvidence(kit, "evidence/discover/managed-listing.json")).toContain("artifact.txt");

    // invoke: fail-closed without the driver-saved transcript, found with it.
    expect(nodeScript(kit, "kit/instruments/invoke.mjs").status).toBe(0);
    let probe = JSON.parse(readEvidence(kit, "evidence/invoke/probe-assertion.json"));
    expect(probe.exists).toBe(false);
    expect(probe.markers.every((marker: { found: boolean }) => marker.found === false)).toBe(true);
    mkdirSync(path.join(kit.evidenceDir, "invoke"), { recursive: true });
    writeFileSync(
      path.join(kit.evidenceDir, "invoke", "probe-transcript.txt"),
      "fixture thread transcript\nMAKE-DOCS-CONFORMANCE-FIXTURE-PROBE-OK\n",
    );
    expect(nodeScript(kit, "kit/instruments/invoke.mjs").status).toBe(0);
    probe = JSON.parse(readEvidence(kit, "evidence/invoke/probe-assertion.json"));
    expect(probe.exists).toBe(true);
    expect(
      probe.markers.find(
        (marker: { marker: string }) => marker.marker === "MAKE-DOCS-CONFORMANCE-FIXTURE-PROBE-OK",
      ).found,
    ).toBe(true);

    // uninstall: refuses `remove` without a baseline, then records the
    // byte-level before/after diff.
    const withoutBaseline = nodeScript(kit, "kit/instruments/uninstall.mjs", ["remove"]);
    expect(withoutBaseline.status).toBe(1);
    expect(nodeScript(kit, "kit/instruments/uninstall.mjs", ["before"]).status).toBe(0);
    expect(nodeScript(kit, "kit/instruments/uninstall.mjs", ["remove"]).status).toBe(0);
    const diff = JSON.parse(readEvidence(kit, "evidence/uninstall/diff.json"));
    expect(diff.removed).toContain("managed/artifact.txt");
    expect(diff.added).toEqual([]);
    expect(diff.modified).toEqual([]);
    expect(diff.emptyManagedDirs).toContain("managed");
    const removalCommands = JSON.parse(readEvidence(kit, "evidence/uninstall/removal-commands.json"));
    expect(removalCommands.commands[0].exitCode).toBe(0);
    // User content untouched: the sentinel survives in the workspace.
    expect(readFileSync(path.join(kit.workspaceDir, "user-note.txt"), "utf8")).toBe("user file\n");
  });

  test("the uninstall `before` phase captures the workspace's make-docs-managed file set (D-026)", async () => {
    const kit = await generateFixtureKit();
    // Inject a make-docs install manifest so the instrument can read the
    // managed-file set before `setup remove` deletes it.
    mkdirSync(path.join(kit.workspaceDir, ".make-docs"), { recursive: true });
    writeFileSync(
      path.join(kit.workspaceDir, ".make-docs", "manifest.json"),
      JSON.stringify({ files: { "AGENTS.md": {}, "docs/CLAUDE.md": {} }, skillFiles: [] }),
    );
    expect(nodeScript(kit, "kit/instruments/uninstall.mjs", ["before"]).status).toBe(0);
    const before = JSON.parse(readEvidence(kit, "evidence/uninstall/before-inventory.json")) as {
      managedFiles: string[];
    };
    expect(before.managedFiles).toContain("AGENTS.md");
    expect(before.managedFiles).toContain("docs/CLAUDE.md");
  });
});

describe("preflight instrument (register item D-027)", () => {
  function runPreflight(kit: GeneratedConformanceKit, fakeMakeDocsVersion: string) {
    const binDir = tempDir("fake-bin-");
    const fake = path.join(binDir, "make-docs");
    writeFileSync(
      fake,
      `#!/usr/bin/env bash\nif [ "$1" = "--version" ]; then echo "${fakeMakeDocsVersion}"; exit 0; fi\nexit 1\n`,
    );
    chmodSync(fake, 0o755);
    return spawnSync(process.execPath, [path.join(kit.sessionRoot, "kit/instruments/preflight.mjs")], {
      encoding: "utf8",
      env: { ...process.env, PATH: `${binDir}:${process.env.PATH ?? ""}` },
    });
  }

  test("the kit emits a preflight that runs first and bakes the generation version", async () => {
    const kit = await generateFixtureKit();
    expect(kit.kitFiles).toContain("kit/instruments/preflight.mjs");
    expect(readEvidence(kit, "kit/instruments/preflight.mjs")).toContain('const EXPECTED_VERSION = "test";');
    const script = readEvidence(kit, "kit/session-steps.sh");
    expect(script).toContain("node kit/instruments/preflight.mjs");
    expect(script.indexOf("preflight.mjs")).toBeLessThan(script.indexOf("install.mjs"));
  });

  test("refuses (exit 1) when the make-docs on PATH reports a different version", async () => {
    const kit = await generateFixtureKit();
    const result = runPreflight(kit, "9.9.9-wrong");
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/PREFLIGHT FAILED/);
    const preflight = JSON.parse(readEvidence(kit, "evidence/preflight/preflight.json")) as {
      ok: boolean;
      expectedVersion: string;
      actualVersion: string;
    };
    expect(preflight.ok).toBe(false);
    expect(preflight.expectedVersion).toBe("test");
    expect(preflight.actualVersion).toBe("9.9.9-wrong");
  });

  test("passes (exit 0) when the make-docs on PATH matches the generation version", async () => {
    const kit = await generateFixtureKit();
    const result = runPreflight(kit, "test");
    expect(result.status).toBe(0);
    expect((JSON.parse(readEvidence(kit, "evidence/preflight/preflight.json")) as { ok: boolean }).ok).toBe(true);
  });
});

describe("projection helpers", () => {
  test("listMakeDocsInvocations extracts argv from compound shell commands", () => {
    expect(
      listMakeDocsInvocations(
        'cd "$WORKSPACE" && make-docs setup remove --backup --yes < /dev/null',
      ),
    ).toEqual([["setup", "remove", "--backup", "--yes"]]);
    expect(listMakeDocsInvocations("git init && printf 'x\\n' > file")).toEqual([]);
  });
});
