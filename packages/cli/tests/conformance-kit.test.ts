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
 * and prompt rendering exercised in-process (the dry-run pipeline proof runs
 * through the operation core, and generated instruments run over a synthetic
 * fixture tree; no make-docs CLI process and no harness is ever driven).
 * They prove the lab machinery — they are NEVER harness-recognition
 * evidence, and internal tests passing is never evidence that a harness
 * recognizes or can use the output (R-LAYER-2, PRD 36 R-TEST-5).
 */

import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
  PI_HARNESS_CAPABILITY_DESCRIPTOR,
  validateHarnessCapabilityDescriptor,
  type HarnessCapabilityDescriptor,
} from "../src/operations/playbook-packaging";
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

const FIXTURE_LAB_DESCRIPTOR: HarnessCapabilityDescriptor = validateHarnessCapabilityDescriptor({
  harnessId: "fixture-lab",
  supportedPrimitives: ["skill", "plugin"],
  containers: [
    {
      containerId: "fixture-lab-plugin",
      kind: "plugin",
      profile: "native",
      richness: 1,
      hostedPrimitives: ["skill", "plugin"],
      layout: {
        placements: [
          { surface: "native", scope: "project", pathTemplate: "managed/{packageId}" },
        ],
        manifestFilename: "plugin.json",
        skillFileTemplate: "skills/{skillId}/SKILL.md",
        registrationFiles: [],
      },
    },
  ],
  lifecycleEventMap: {},
  supportedExposureModes: ["symlink", "copy-mirror", "export-only"],
  preferredExposureMode: "symlink",
  fallbackExposureMode: "copy-mirror",
  registration: {
    kind: "direct-discovery",
    description: "Fixture harness for kit/instrument tests.",
    autoRegister: false,
  },
  preconditions: [
    { id: "fixture-ready", description: "Fixture harness is always ready.", required: true },
  ],
  verification: {
    status: "provisional",
    reference: "packages/cli/tests/conformance-kit.test.ts (fixture harness)",
    provisionalNotes: ["Fixture descriptor exists to exercise kit generation and instruments."],
    contractDigest: null,
  },
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
});

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
    fixturePlaybooks: ["conformance/fixtures/agent/conformance-skill-probe.playbook.md"],
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
/* Shared expensive fixtures: the real Codex plugin kit generated twice for  */
/* the determinism proof and reused by the content assertions.               */
/* ------------------------------------------------------------------------ */

const pluginSpec = loadPackagingConformanceScenarioSpec(PLUGIN_SPEC_PATH);
const pluginKitPromise: Promise<{ first: GeneratedConformanceKit; second: GeneratedConformanceKit }> =
  (async () => {
    const shared = {
      spec: pluginSpec,
      harness: "codex",
      repoRoot: REPO_ROOT,
      sessionId: "2026-07-06-codex-plugin-marketplace-install",
      cliVersion: "test",
    };
    const first = await generateConformanceKit({
      ...shared,
      sessionRoot: path.join(tempDir("kit-plugin-a-"), "session"),
    });
    const second = await generateConformanceKit({
      ...shared,
      sessionRoot: path.join(tempDir("kit-plugin-b-"), "session"),
    });
    return { first, second };
  })();

describe("kit generation over the committed definitions (R-KIT-1..2)", () => {
  test("generates the fixed session layout outside the repository", async () => {
    const { first: kit } = await pluginKitPromise;
    expect(existsSync(kit.kitDir)).toBe(true);
    expect(existsSync(kit.workspaceDir)).toBe(true);
    expect(existsSync(kit.evidenceDir)).toBe(true);
    expect(kit.kitFiles).toContain("kit/manifest.json");
    expect(kit.kitFiles).toContain("kit/prompts/session-prompt.md");
    expect(kit.kitFiles).toContain("kit/session-steps.sh");
    for (const stage of ["install", "discover", "invoke", "uninstall"]) {
      expect(kit.kitFiles).toContain(`kit/instruments/${stage}.mjs`);
    }
    // Lab-session vocabulary (R-NAME-1): no generated kit path uses "run"
    // for lab operations.
    for (const file of kit.kitFiles) {
      expect(file).not.toMatch(/(^|[/.-])runs?([/.-]|$)/);
    }
  });

  test("materializes the workspace with the D-023 precondition establishment supplied by generation", async () => {
    const { first: kit } = await pluginKitPromise;
    // The workspace is a real Make Docs project (the missing establishment
    // step the executable-by-construction dry-run surfaced).
    expect(existsSync(path.join(kit.workspaceDir, ".make-docs", "manifest.json"))).toBe(true);
    const config = readFileSync(path.join(kit.workspaceDir, ".make-docs", "config.yaml"), "utf8");
    expect(config).toContain("harness-supported: satisfied");
    expect(config).toContain("project-trusted: satisfied");
    expect(config).toContain("symlink-or-copy-mirror: satisfied");
    expect(
      existsSync(
        path.join(kit.workspaceDir, "docs/assets/playbooks/agent/conformance-skill-probe.playbook.md"),
      ),
    ).toBe(true);
  });

  test("generated command sequences carry the D-023 fixes: evidence refs and --yes", async () => {
    const { first: kit } = await pluginKitPromise;
    const installCommands = kit.manifest.sessionSteps.filter(
      (step) => step.barStage === "install" && step.command !== null,
    );
    expect(installCommands.length).toBeGreaterThan(0);
    for (const step of installCommands) {
      expect(step.command).toContain("--support-evidence-ref");
      expect(step.command).toContain("--json");
    }
    const uninstallCommands = kit.manifest.sessionSteps.filter(
      (step) => step.barStage === "uninstall" && step.command !== null,
    );
    expect(uninstallCommands.length).toBeGreaterThan(0);
    for (const step of uninstallCommands) {
      expect(step.command).toContain("--yes");
    }
  });

  test("the session manifest records identity, generation inputs, and the expected-evidence table", async () => {
    const { first: kit } = await pluginKitPromise;
    const manifest = kit.manifest;
    expect(manifest.schemaVersion).toBe(CONFORMANCE_SESSION_MANIFEST_SCHEMA_VERSION);
    expect(manifest.scenarioId).toBe("packaging/plugin-marketplace-install");
    expect(manifest.harness).toBe("codex");
    expect(manifest.registryTupleIds).toEqual(["codex-plugin-native-project"]);
    expect(manifest.generationInputs.cliVersion).toBe("test");
    expect(manifest.generationInputs.descriptorContractDigest).toBe(
      CODEX_HARNESS_CAPABILITY_DESCRIPTOR.verification.contractDigest,
    );
    expect(manifest.evidenceHomes.default).toBe("discarded-with-session");
    expect(manifest.evidenceHomes.retained).toContain("conformance-lab/sessions/");
    for (const stage of ["install", "discover", "invoke", "uninstall"] as const) {
      const expected = manifest.expectedEvidence[stage];
      expect(expected.instrument).toContain(`instruments/${stage === "uninstall" ? "uninstall" : stage}.mjs`);
      expect(expected.outputs.length).toBeGreaterThan(0);
      for (const output of expected.outputs) {
        expect(output.startsWith("evidence/")).toBe(true);
      }
    }
    expect(manifest.preconditions.attestations.map((attestation) => attestation.id)).toEqual([
      "network-available",
      "model-routing-available",
    ]);
    expect(manifest.executionRules.some((rule) => rule.startsWith("R-EXEC-1"))).toBe(true);
  });

  test("kit generation is deterministic: same inputs, byte-identical kit files", async () => {
    const { first, second } = await pluginKitPromise;
    expect(second.kitFiles).toEqual(first.kitFiles);
    for (const file of first.kitFiles) {
      expect(readFileSync(path.join(second.sessionRoot, file), "utf8")).toBe(
        readFileSync(path.join(first.sessionRoot, file), "utf8"),
      );
    }
  });

  test("generated kit files carry no absolute paths and instruments stay offline", async () => {
    const { first: kit } = await pluginKitPromise;
    for (const file of kit.kitFiles) {
      const content = readFileSync(path.join(kit.sessionRoot, file), "utf8");
      expect(content).not.toContain(kit.sessionRoot);
      expect(content).not.toContain(REPO_ROOT);
      if (file.endsWith(".mjs")) {
        expect(content).not.toMatch(/node:https?|node:net|node:dns|fetch\(/);
        expect(content).not.toMatch(/Date\.now|new Date|Math\.random/);
      }
    }
  });
});

describe("prompt rendering (R-PROMPT-1) and the discovery kit (R-DISC-1)", () => {
  test("the session prompt carries the honesty core verbatim and never asks the agent to certify", async () => {
    const { first: kit } = await pluginKitPromise;
    const prompt = readEvidence(kit, "kit/prompts/session-prompt.md");
    for (const rule of CONFORMANCE_PROMPT_HONESTY_RULES) {
      expect(prompt).toContain(rule);
    }
    expect(prompt).toContain(CONFORMANCE_PROMPT_MEASUREMENT_RULE);
    expect(prompt).not.toMatch(/certif/i);
    // Harness specifics come from the descriptor's interrogation block.
    expect(prompt).toContain("codex --version");
    expect(prompt).toContain(".codex/plugins");
  });

  test("the plugin kit renders the discovery kit with the R-021 linkage intact", async () => {
    const { first: kit } = await pluginKitPromise;
    expect(kit.manifest.discoveryKit).not.toBeNull();
    expect(kit.manifest.discoveryKit?.resolvesProbe.registerItem).toBe("R-021");
    const prompt = readEvidence(kit, "kit/prompts/discovery-prompt.md");
    expect(prompt).toContain("R-021");
    expect(prompt).toContain("before any bar assertion");
    expect(prompt).toContain("descriptor");
    expect(prompt).not.toMatch(/certif/i);
    const instrument = readEvidence(kit, "kit/instruments/discovery.mjs");
    expect(instrument).toContain("codex --version");
  });
});

describe("executable-by-construction failure modes (R-KIT-3)", () => {
  test("an uncovered target fails closed naming the gap, before any session artifact", async () => {
    const sessionRoot = path.join(tempDir("kit-uncovered-"), "session");
    await expect(
      generateConformanceKit({
        spec: pluginSpec,
        harness: "pi",
        sessionRoot,
        repoRoot: REPO_ROOT,
        sessionId: "2026-07-06-pi-plugin-marketplace-install",
      }),
    ).rejects.toThrow(/binds no `pi` target/);
    expect(existsSync(sessionRoot)).toBe(false);
  });

  test("a command that the CLI does not accept fails generation closed, naming the element", async () => {
    const document = loadPluginSpecDocument();
    const steps = document.steps as { kind: string; run?: string }[];
    const shipStep = steps.find((step) => step.run?.includes("run package ship"))!;
    shipStep.run = shipStep.run!.replace("run package ship", "run package shipp");
    const spec = validatePackagingConformanceScenarioSpec(document);
    const sessionRoot = path.join(tempDir("kit-badcmd-"), "session");
    await expect(
      generateConformanceKit({
        spec,
        harness: "codex",
        sessionRoot,
        repoRoot: REPO_ROOT,
        sessionId: "2026-07-06-codex-plugin-marketplace-install",
      }),
    ).rejects.toThrow(/does not project onto the registered operation surface/);
    expect(existsSync(sessionRoot)).toBe(false);
  });

  test("an install command without the support-evidence ref fails generation (D-023 class 1)", async () => {
    const document = loadPluginSpecDocument();
    const steps = document.steps as { kind: string; run?: string }[];
    const shipStep = steps.find((step) => step.run?.includes("run package ship"))!;
    shipStep.run = shipStep.run!.replace(
      /--support-evidence-ref \S+ /,
      "",
    );
    const spec = validatePackagingConformanceScenarioSpec(document);
    await expect(
      generateConformanceKit({
        spec,
        harness: "codex",
        sessionRoot: path.join(tempDir("kit-noref-"), "session"),
        repoRoot: REPO_ROOT,
        sessionId: "2026-07-06-codex-plugin-marketplace-install",
      }),
    ).rejects.toThrow(/--support-evidence-ref/);
  });

  test("a non-TTY uninstall command without --yes fails generation (D-023 class 2)", async () => {
    const document = loadPluginSpecDocument();
    const steps = document.steps as { kind: string; run?: string }[];
    const removeStep = steps.find((step) => step.run?.includes("setup remove"))!;
    removeStep.run = removeStep.run!.replace(" --yes", "");
    const spec = validatePackagingConformanceScenarioSpec(document);
    await expect(
      generateConformanceKit({
        spec,
        harness: "codex",
        sessionRoot: path.join(tempDir("kit-noyes-"), "session"),
        repoRoot: REPO_ROOT,
        sessionId: "2026-07-06-codex-plugin-marketplace-install",
      }),
    ).rejects.toThrow(/--yes/);
  });

  test("a session root inside the repository is refused (R-KIT-2)", async () => {
    await expect(
      generateConformanceKit({
        spec: pluginSpec,
        harness: "codex",
        sessionRoot: path.join(REPO_ROOT, "conformance", "never-here"),
        repoRoot: REPO_ROOT,
        sessionId: "2026-07-06-codex-plugin-marketplace-install",
      }),
    ).rejects.toThrow(/inside the repository/);
    expect(existsSync(path.join(REPO_ROOT, "conformance", "never-here"))).toBe(false);
  });

  describe("regenerating into an occupied session root (R-KIT-2, D-028)", () => {
    const sharedFixtureInput = {
      spec: FIXTURE_SPEC,
      harness: "fixture-lab",
      repoRoot: REPO_ROOT,
      sessionId: "2026-07-06-fixture-lab-fixture-instrument-outcome",
      descriptors: [FIXTURE_LAB_DESCRIPTOR],
      cliVersion: "test",
    };

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
      expect(existsSync(path.join(foreign, "precious.txt"))).toBe(true);
    });
  });

  test("a target whose descriptor lacks the interrogation block fails closed (R-HOME-2)", async () => {
    const spec = validatePackagingConformanceScenarioSpec({
      ...(JSON.parse(JSON.stringify(FIXTURE_SPEC)) as Record<string, unknown>),
      packagingExtension: {
        ...(JSON.parse(JSON.stringify(FIXTURE_SPEC.packagingExtension)) as Record<string, unknown>),
        targets: {
          pi: (JSON.parse(JSON.stringify(FIXTURE_SPEC.packagingExtension.targets["fixture-lab"])) as Record<string, unknown>),
        },
      },
    });
    await expect(
      generateConformanceKit({
        spec,
        harness: "pi",
        sessionRoot: path.join(tempDir("kit-nointer-"), "session"),
        repoRoot: REPO_ROOT,
        sessionId: "2026-07-06-pi-fixture-instrument-outcome",
        descriptors: [PI_HARNESS_CAPABILITY_DESCRIPTOR],
      }),
    ).rejects.toThrow(/no lab-facing interrogation block/);
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

describe("first-pass suite generation and the shipped-surface boundary (R-KIT-1, R-HOME-1)", () => {
  test("the full Codex first-pass suite generates into a temp sessions root, nothing under the repository", async () => {
    const sessionsRoot = tempDir("kit-suite-");
    const before = spawnSync("git", ["status", "--porcelain"], { cwd: REPO_ROOT, encoding: "utf8" }).stdout;
    const kits = await generateFirstPassConformanceKitSuite({
      sessionsRoot,
      harness: "codex",
      repoRoot: REPO_ROOT,
      sessionDate: "2026-07-06",
      cliVersion: "test",
    });
    expect(kits).toHaveLength(4);
    for (const kit of kits) {
      expect(kit.sessionRoot.startsWith(sessionsRoot)).toBe(true);
      expect(existsSync(kit.manifestPath)).toBe(true);
    }
    const after = spawnSync("git", ["status", "--porcelain"], { cwd: REPO_ROOT, encoding: "utf8" }).stdout;
    expect(after).toBe(before);
  }, 120_000);

  test("kit generation registered nothing: no operation, no run adapter, no MCP tool (parity preserved vacuously)", () => {
    expect(listConformanceLabShippedSurfaceViolations()).toEqual([]);
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

  test("placement roots derive from the descriptor, never a kit-local table (R-HOME-2)", () => {
    expect(listHarnessPlacementRoots(CODEX_HARNESS_CAPABILITY_DESCRIPTOR)).toEqual([
      ".agents/plugins",
      ".agents/skills",
      ".codex/plugins",
    ]);
  });
});

describe("descriptor interrogation block validation (t1)", () => {
  test("codex carries the block; pi honestly carries none", () => {
    expect(CODEX_HARNESS_CAPABILITY_DESCRIPTOR.labInterrogation).toBeDefined();
    expect(
      CODEX_HARNESS_CAPABILITY_DESCRIPTOR.labInterrogation?.listingCaptures.map(
        (capture) => capture.id,
      ),
    ).toEqual(["skills-directory-listing", "marketplace-manifest-read", "plugin-install-root-listing"]);
    expect(CODEX_HARNESS_CAPABILITY_DESCRIPTOR.labInterrogation?.knownGaps.length).toBeGreaterThan(0);
    expect(PI_HARNESS_CAPABILITY_DESCRIPTOR.labInterrogation).toBeUndefined();
  });

  test("a verified lab claim on a provisional contract is rejected", () => {
    const descriptor = JSON.parse(JSON.stringify(FIXTURE_LAB_DESCRIPTOR)) as HarnessCapabilityDescriptor;
    descriptor.labInterrogation!.listingCaptures[0]!.status = "verified";
    expect(() => validateHarnessCapabilityDescriptor(descriptor)).toThrow(
      /never more confirmed than the packaging contract/,
    );
  });

  test("a non-workspace-relative capture path is rejected", () => {
    const descriptor = JSON.parse(JSON.stringify(FIXTURE_LAB_DESCRIPTOR)) as HarnessCapabilityDescriptor;
    descriptor.labInterrogation!.listingCaptures[0]!.form = {
      kind: "directory-listing",
      path: "/etc",
    };
    expect(() => validateHarnessCapabilityDescriptor(descriptor)).toThrow(/workspace-relative/);
  });
});
