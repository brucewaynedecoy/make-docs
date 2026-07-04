import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { callMakeDocsMcpTool, MAKE_DOCS_MCP_TOOLS } from "../src/mcp/tools";
import { createExecutionContext } from "../src/operations/context";
import { createPlaybookPackagePlan } from "../src/operations/playbook-packaging";
import { hasOperation, invokeOperation, listOperations } from "../src/operations/registry";
import { OperationError } from "../src/operations/types";
import {
  listRunCliSpellings,
  resolveRunOperationPath,
  runRunCommand,
} from "../src/run/cli";
import { resolveRunRenderMode } from "../src/run/render";
import {
  installSqliteExperimentalWarningFilter,
  isSqliteExperimentalWarning,
} from "../src/run/warnings";
import { loadSqliteDriver } from "../src/store";
import { cleanupTempDir, createTempDir, writeMinimalManifest } from "./helpers";

const sqliteAvailable = loadSqliteDriver().available;

const SUPPORT_EVIDENCE_REF =
  "docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md";

const SATISFIED_PRECONDITION_FLAGS = [
  "--precondition",
  "harness-supported=satisfied",
  "--precondition",
  "project-trusted=satisfied",
  "--precondition",
  "symlink-or-copy-mirror=satisfied",
];

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

/** Plain-form packagable playbook with an authored summary (no proposals). */
function writePackagablePlaybook(root: string, slug = "run-stack", title = "Run Stack"): string {
  return writeFile(
    root,
    `docs/assets/playbooks/user/${slug}.md`,
    [
      "---",
      `title: ${title}`,
      "kind: playbook",
      "status: accepted",
      "persona: user",
      "stack: run",
      `summary: ${title} summary.`,
      "---",
      "",
      `# ${title}`,
      "",
      "## Purpose",
      "",
      "Use this playbook when the matching workflow goal is active.",
      "",
      "## Inputs and Authority",
      "",
      "- User request.",
      "",
      "## Procedure",
      "",
      "1. Resolve the playbook.",
      "",
      "## Gates and Decisions",
      "",
      "- Stop when user review is required.",
      "",
      "## Assists",
      "",
      "- Assists are optional unless the playbook says otherwise.",
      "",
      "## Outputs and Handoff",
      "",
      "- Record the expected output or handoff artifact.",
      "",
      "## Validation",
      "",
      "- Confirm the workflow completed or report why it stopped.",
      "",
    ].join("\n"),
  );
}

/** A conformant v2 playbook with a step, a gate, and a follow-on step. */
function progressionPlaybook(): string {
  return [
    "---",
    'title: "Ship"',
    'kind: "playbook"',
    'persona: "user"',
    'status: "accepted"',
    'stack: "run"',
    'summary: "Ship summary."',
    'schema: "make-docs.playbook.v2"',
    'workflowSchema: "make-docs.workflow.v1"',
    "---",
    "",
    "# Ship",
    "",
    "## Purpose",
    "",
    "Ship the documented workflow.",
    "",
    "## When To Use",
    "",
    "Use when the workflow goal is active.",
    "",
    "## Inputs",
    "",
    "- User direction first, then repo-local Make Docs contracts.",
    "",
    "## Dependencies",
    "",
    "```playbook",
    "dependencies:",
    "  - id: make-docs-cli",
    "    kind: cli",
    "    requirement: required",
    "    source: package install",
    "    used_by: [check]",
    "    fallback: stop with install guidance",
    "```",
    "",
    "## Workflow",
    "",
    "```playbook",
    "workflow:",
    "  id: ship",
    "  state_model: make-docs.workflow-state.v1",
    "  routing: linear",
    "steps:",
    "  - id: check",
    "    title: Check the playbook catalog",
    "    executor: cli",
    "    role: check",
    "    activation: sequential",
    "    mode: deterministic",
    "    requires: [make-docs-cli]",
    "    operation: playbook.catalog",
    "  - id: review",
    "    title: Review the catalog output",
    "    executor: human",
    "    role: gate",
    "    activation: sequential",
    "    mode: delegated",
    "    instructions: Review the catalog output and approve or reject.",
    "    gate:",
    "      resolved_by: user",
    "      evidence: review note",
    "      unattended: false",
    "  - id: record",
    "    title: Record the handoff",
    "    executor: agent",
    "    role: activity",
    "    activation: sequential",
    "    instructions: Record the handoff artifact.",
    "```",
    "",
    "## Step Guidance",
    "",
    "Run the steps in order and report the results.",
    "",
    "## Gates",
    "",
    "- Stop at the review gate until the user decides.",
    "",
    "## Outputs",
    "",
    "- Record the handoff artifact.",
    "",
    "## Validation",
    "",
    "- The catalog check exits zero.",
    "",
    "## Packaging Notes",
    "",
    "No packaging hints.",
    "",
  ].join("\n");
}

function captureStdout() {
  const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  return {
    spy,
    output: () => spy.mock.calls.map(([chunk]) => String(chunk)).join(""),
  };
}

async function runCapturing(argv: string[], seams?: { isTty?: boolean }): Promise<string> {
  const stdout = captureStdout();
  try {
    await runRunCommand(argv, seams);
    return stdout.output();
  } finally {
    stdout.spy.mockRestore();
  }
}

const PLAN_ARGS = (root: string) => [
  "package",
  "plan",
  "user/run-stack",
  "--harness",
  "codex",
  "--output-kind",
  "plugin",
  "--surface",
  "native",
  "--scope",
  "project",
  "--support-evidence-ref",
  SUPPORT_EVIDENCE_REF,
  "--repo-root",
  root,
];

const SHIP_ARGS = (root: string) => [
  "package",
  "ship",
  "user/run-stack",
  "--harness",
  "codex",
  "--output-kind",
  "plugin",
  "--surface",
  "native",
  "--scope",
  "project",
  "--support-evidence-ref",
  SUPPORT_EVIDENCE_REF,
  "--repo-root",
  root,
  ...SATISFIED_PRECONDITION_FLAGS,
];

describe("W18 R12 P3 CLI experience remediation", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  describe("render layer invariance (R-RENDER-1, R-INV-1, R-TEST-4)", () => {
    test("mode selection: --json always JSON, non-TTY defaults JSON, TTY defaults text", () => {
      expect(resolveRunRenderMode({ jsonFlag: true, isTty: true })).toBe("json");
      expect(resolveRunRenderMode({ jsonFlag: true, isTty: false })).toBe("json");
      expect(resolveRunRenderMode({ jsonFlag: false, isTty: false })).toBe("json");
      expect(resolveRunRenderMode({ jsonFlag: false, isTty: true })).toBe("text");
    });

    test("non-TTY default and --json output stay byte-identical to the raw operation result", async () => {
      const root = createTempDir("make-docs-render-invariance-");
      tempRoots.push(root);
      writeMinimalManifest(root);
      writePackagablePlaybook(root);

      // Representative read (playbook.catalog) and packaging (package.plan)
      // results: the pre-render-layer CLI printed exactly
      // `JSON.stringify(value, null, 2) + "\n"` — the render layer must not
      // move a byte of it on the non-TTY default or under --json.
      const catalogExpected = `${JSON.stringify(
        (
          await invokeOperation(
            "playbook.catalog",
            { repoRoot: root },
            createExecutionContext({ surface: "cli", writesAllowed: true }),
          )
        ).value,
        null,
        2,
      )}\n`;
      expect(await runCapturing(["playbook", "catalog", "--repo-root", root])).toBe(
        catalogExpected,
      );
      expect(
        await runCapturing(["playbook", "catalog", "--repo-root", root], { isTty: false }),
      ).toBe(catalogExpected);
      expect(
        await runCapturing(["playbook", "catalog", "--repo-root", root, "--json"], {
          isTty: true,
        }),
      ).toBe(catalogExpected);

      const planExpected = `${JSON.stringify(
        (
          await invokeOperation(
            "package.plan",
            {
              repoRoot: root,
              refs: ["user/run-stack"],
              requestedStack: null,
              target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
              supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
              nonInteractive: false,
            },
            createExecutionContext({ surface: "cli", writesAllowed: true }),
          )
        ).value,
        null,
        2,
      )}\n`;
      expect(await runCapturing(PLAN_ARGS(root))).toBe(planExpected);
      expect(await runCapturing([...PLAN_ARGS(root), "--json"], { isTty: true })).toBe(
        planExpected,
      );
    });

    test("TTY default renders human text, not the JSON echo", async () => {
      const root = createTempDir("make-docs-render-text-");
      tempRoots.push(root);
      writePackagablePlaybook(root);

      const output = await runCapturing(["playbook", "catalog", "--repo-root", root], {
        isTty: true,
      });
      expect(output.startsWith("{")).toBe(false);
      expect(output).toContain("Playbook catalog: 1 entry");
      expect(output).toContain("user/run-stack");
    });

    test.skipIf(!sqliteAvailable)(
      "TTY advance renders report, compact status, and ends with the exact next command (R-RENDER-1..2)",
      async () => {
        const root = createTempDir("make-docs-render-advance-");
        tempRoots.push(root);
        writeMinimalManifest(root);
        const storeRoot = path.join(createTempDir("make-docs-render-advance-store-"), "store");
        tempRoots.push(path.dirname(storeRoot));
        writeFile(root, "docs/assets/playbooks/user/ship.playbook.md", progressionPlaybook());
        const shared = ["--repo-root", root, "--store-root", storeRoot, "--run-id", "tty-run"];

        const startText = await runCapturing(
          ["playbook", "start", "user/ship", "--harness", "codex", ...shared],
          { isTty: true },
        );
        // The capability snapshot renders once, at start (R-RENDER-2).
        expect(startText).toContain("Started run tty-run");
        expect(startText).toContain("Capabilities:");

        const advanceText = await runCapturing(
          ["playbook", "advance", "--outcome", "completed", ...shared],
          { isTty: true },
        );
        const lines = advanceText.trimEnd().split("\n");
        // What happened, where the run stands, what to do next — one screen.
        expect(lines[0]).toContain("Advanced step check (deterministic): recorded -> completed");
        expect(advanceText).toContain("Run tty-run | user/ship | status:");
        expect(lines.length).toBeLessThan(24);
        // Ends with the exact next command (the run now sits at the gate).
        expect(lines[lines.length - 1]).toBe(
          "Next: make-docs run playbook gate --run-id tty-run --decision <approve|reject>",
        );
        // Never the full state echo: no capability restatement, no evidence
        // log — the full record is referenced, not repeated (R-RENDER-2, X7).
        expect(advanceText).not.toContain("capabilitySnapshot");
        expect(advanceText).not.toContain("evidenceLog");
        expect(advanceText).toContain("Full record");
        expect(advanceText).toContain("--json");

        // The full record stays reachable via status --json (R-RENDER-2).
        const statusJson = await runCapturing(["playbook", "status", ...shared, "--json"], {
          isTty: true,
        });
        expect(JSON.parse(statusJson)).toEqual(
          expect.objectContaining({ runId: "tty-run", capabilitySnapshot: expect.anything() }),
        );
      },
    );
  });

  describe("package grammar (R-GRAM-1..2, R-TEST-5)", () => {
    test("the preview spelling maps to package.write with the dry-run context, never a new registry id", () => {
      expect(listRunCliSpellings()).toEqual([
        { spelling: "package.preview", operation: "package.write" },
      ]);
      expect(hasOperation("package.preview")).toBe(false);
      expect(resolveRunOperationPath(["package", "preview", "--plan-json", "x"])).toEqual({
        id: "package.preview",
        rest: ["--plan-json", "x"],
      });
      // Derived help discovers the spelling inside the package domain.
      expect(
        MAKE_DOCS_MCP_TOOLS.map((tool) => tool.name),
      ).not.toContain("make_docs_package_preview");
    });

    test("plan --output writes the reviewable plan artifact; stdout is unchanged (X3)", async () => {
      const root = createTempDir("make-docs-plan-output-");
      tempRoots.push(root);
      writeMinimalManifest(root);
      writePackagablePlaybook(root);
      const artifactPath = path.join(root, "artifacts/plan.json");

      const stdout = await runCapturing([...PLAN_ARGS(root), "--output", artifactPath]);
      const printed = JSON.parse(stdout) as { plan: { packageId: string } };
      expect(printed.plan.packageId).toBe("run-stack");

      // The artifact is exactly the `plan` object `write --plan-json` consumes.
      const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as { packageId: string };
      expect(artifact).toEqual(printed.plan);

      // Round-trip: the artifact feeds preview with no jq surgery.
      const previewOutput = await runCapturing([
        "package",
        "preview",
        "--repo-root",
        root,
        "--plan-json",
        artifactPath,
        ...SATISFIED_PRECONDITION_FLAGS,
      ]);
      const preview = JSON.parse(previewOutput) as { status: string; filesWritten: string[] };
      expect(preview.status).toBe("ready");
      expect(preview.filesWritten).toEqual([]);
    });

    test("preview writes nothing under any input, even with every approval granted", async () => {
      const root = createTempDir("make-docs-preview-no-writes-");
      tempRoots.push(root);
      writeMinimalManifest(root);
      writePackagablePlaybook(root);
      const plan = createPlaybookPackagePlan({
        repoRoot: root,
        refs: ["user/run-stack"],
        target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
        supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      }).plan;
      const planPath = writeFile(root, "plan.json", JSON.stringify(plan, null, 2));

      const output = await runCapturing([
        "package",
        "preview",
        "--repo-root",
        root,
        "--plan-json",
        planPath,
        "--reviewed-overwrite",
        "--backup-snapshot-reviewed",
        ...SATISFIED_PRECONDITION_FLAGS,
      ]);
      const parsed = JSON.parse(output) as { status: string; filesWritten: string[]; lines: string[] };
      expect(parsed.status).toBe("ready");
      expect(parsed.filesWritten).toEqual([]);
      expect(parsed.lines).toContain("Writes executed: no");
      expect(existsSync(path.join(root, ".make-docs/agentics"))).toBe(false);
    });

    test("write preserves every fail-before-write stop and the retired --write names the grammar", async () => {
      const root = createTempDir("make-docs-write-stops-");
      tempRoots.push(root);
      writeMinimalManifest(root);
      writePackagablePlaybook(root);
      const plan = createPlaybookPackagePlan({
        repoRoot: root,
        refs: ["user/run-stack"],
        target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
        supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      }).plan;
      const planPath = writeFile(root, "plan.json", JSON.stringify(plan, null, 2));
      const artifact = plan.generatedArtifacts.find(
        (candidate) => candidate.outputKind === "plugin",
      )!;
      // A differing pre-existing generated output: `write` must fail closed
      // before writing (ownership-review-required), exactly as before.
      writeFile(root, `${artifact.path}/.codex-plugin/plugin.json`, '{ "stale": true }\n');

      await expect(
        runRunCommand([
          "package",
          "write",
          "--repo-root",
          root,
          "--plan-json",
          planPath,
          ...SATISFIED_PRECONDITION_FLAGS,
        ]),
      ).rejects.toThrow(/Playbook package write stopped: .*ownership-review-required/);
      expect(readFileSync(path.join(root, `${artifact.path}/.codex-plugin/plugin.json`), "utf8")).toBe(
        '{ "stale": true }\n',
      );

      await expect(
        runRunCommand(["package", "write", "--repo-root", root, "--plan-json", planPath, "--write"]),
      ).rejects.toThrow(
        /`--write` is retired[\s\S]*run package preview[\s\S]*run package write[\s\S]*run package plan --output[\s\S]*run package ship/,
      );
    });
  });

  describe("package.ship composite (R-GRAM-3, R-TEST-6)", () => {
    test("package.ship is registered, adapter-covered, and derived to MCP", () => {
      expect(hasOperation("package.ship")).toBe(true);
      expect(listOperations().find((operation) => operation.id === "package.ship")).toEqual(
        expect.objectContaining({ mutates: "write", status: "active" }),
      );
      expect(MAKE_DOCS_MCP_TOOLS.map((tool) => tool.name)).toContain("make_docs_package_ship");
      expect(resolveRunOperationPath(["package", "ship", "user/run-stack"])).toEqual({
        id: "package.ship",
        rest: ["user/run-stack"],
      });
    });

    test("a zero-unresolved plan ships end-to-end with the classification write recorded", async () => {
      const root = createTempDir("make-docs-ship-happy-");
      tempRoots.push(root);
      writeMinimalManifest(root);
      writePackagablePlaybook(root);

      const output = await runCapturing(SHIP_ARGS(root));
      const shipped = JSON.parse(output) as {
        status: string;
        stage: string;
        guidance: string | null;
        write: { status: string; filesWritten: string[]; manifestUpdated: boolean };
      };
      expect(shipped.status).toBe("shipped");
      expect(shipped.stage).toBe("write");
      expect(shipped.guidance).toBeNull();
      expect(shipped.write.status).toBe("written");
      expect(shipped.write.filesWritten.length).toBeGreaterThan(0);
      expect(shipped.write.manifestUpdated).toBe(true);
      expect(
        existsSync(path.join(root, ".make-docs/agentics/plugins/run-stack/.codex-plugin/plugin.json")),
      ).toBe(true);
    });

    test("ship aborts at the first plan stop, before any disk write, naming the plan command", async () => {
      const root = createTempDir("make-docs-ship-plan-abort-");
      tempRoots.push(root);
      writeMinimalManifest(root);
      writePackagablePlaybook(root);

      // No support evidence: the plan carries a missing-support-evidence stop.
      const argv = SHIP_ARGS(root).filter(
        (arg, index, all) =>
          arg !== "--support-evidence-ref" && all[index - 1] !== "--support-evidence-ref",
      );
      const output = await runCapturing(argv);
      const aborted = JSON.parse(output) as {
        status: string;
        stage: string;
        guidance: string;
        stops: Array<{ reason: string }>;
        preview: unknown;
        write: unknown;
      };
      expect(aborted.status).toBe("aborted");
      expect(aborted.stage).toBe("plan");
      expect(aborted.guidance).toContain("make-docs run package plan");
      expect(aborted.stops.map((stop) => stop.reason)).toContain("missing-support-evidence");
      expect(aborted.preview).toBeNull();
      expect(aborted.write).toBeNull();
      expect(existsSync(path.join(root, ".make-docs/agentics"))).toBe(false);
    });

    test("ship aborts at the first preview stop, before any disk write, naming the preview command", async () => {
      const root = createTempDir("make-docs-ship-preview-abort-");
      tempRoots.push(root);
      writeMinimalManifest(root);
      writePackagablePlaybook(root);
      // A differing pre-existing output trips the pipeline's
      // ownership-review-required stop in the preview leg.
      writeFile(
        root,
        ".make-docs/agentics/plugins/run-stack/.codex-plugin/plugin.json",
        '{ "stale": true }\n',
      );

      const output = await runCapturing(SHIP_ARGS(root));
      const aborted = JSON.parse(output) as {
        status: string;
        stage: string;
        guidance: string;
        stops: Array<{ reason: string }>;
      };
      expect(aborted.status).toBe("aborted");
      expect(aborted.stage).toBe("preview");
      expect(aborted.guidance).toContain("make-docs run package preview");
      expect(aborted.guidance).toContain("make-docs run package write");
      expect(aborted.stops.map((stop) => stop.reason)).toContain("ownership-review-required");
      expect(
        readFileSync(
          path.join(root, ".make-docs/agentics/plugins/run-stack/.codex-plugin/plugin.json"),
          "utf8",
        ),
      ).toBe('{ "stale": true }\n');
    });

    test("the derived MCP ship tool runs the composite under core gating (dry-run)", async () => {
      const root = createTempDir("make-docs-ship-mcp-");
      tempRoots.push(root);
      writeMinimalManifest(root);
      writePackagablePlaybook(root);
      const input = {
        repoRoot: root,
        refs: ["user/run-stack"],
        target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
        supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
        preconditions: {
          "harness-supported": "satisfied",
          "project-trusted": "satisfied",
          "symlink-or-copy-mirror": "satisfied",
        },
      };

      // Core-enforced write gating, like every other write operation.
      await expect(callMakeDocsMcpTool("make_docs_package_ship", input)).rejects.toThrow(
        "Operation `package.ship` mutates state and requires write permission",
      );

      const payload = await callMakeDocsMcpTool("make_docs_package_ship", {
        ...input,
        allowWrite: true,
        dryRun: true,
      });
      const result = payload.result as { status: string; stage: string; write: { status: string } };
      expect(result.status).toBe("planned");
      expect(result.stage).toBe("write");
      expect(result.write.status).toBe("ready");
      expect(existsSync(path.join(root, ".make-docs/agentics"))).toBe(false);
    });
  });

  describe.skipIf(!sqliteAvailable)("run-id prefixes and --last (R-RUNID-1)", () => {
    async function seedRuns(root: string, storeRoot: string, runIds: string[]): Promise<void> {
      for (const runId of runIds) {
        await runRunCommand([
          "playbook",
          "start",
          "user/ship",
          "--harness",
          "codex",
          "--run-id",
          runId,
          "--repo-root",
          root,
          "--store-root",
          storeRoot,
        ]);
      }
    }

    function fixture(): { root: string; storeRoot: string } {
      const root = createTempDir("make-docs-run-id-");
      tempRoots.push(root);
      writeMinimalManifest(root);
      const storeRoot = path.join(createTempDir("make-docs-run-id-store-"), "store");
      tempRoots.push(path.dirname(storeRoot));
      writeFile(root, "docs/assets/playbooks/user/ship.playbook.md", progressionPlaybook());
      return { root, storeRoot };
    }

    test("an unambiguous prefix and --last resolve identically to the full id", async () => {
      const { root, storeRoot } = fixture();
      const stdout = captureStdout();
      await seedRuns(root, storeRoot, ["2026-alpha-run", "zulu-run"]);
      stdout.spy.mockRestore();
      const shared = ["--repo-root", root, "--store-root", storeRoot];

      const byPrefix = JSON.parse(
        await runCapturing(["playbook", "status", "--run-id", "2026-a", ...shared]),
      ) as { runId: string };
      expect(byPrefix.runId).toBe("2026-alpha-run");

      const byFull = JSON.parse(
        await runCapturing(["playbook", "status", "--run-id", "2026-alpha-run", ...shared]),
      ) as { runId: string };
      expect(byFull).toEqual(byPrefix);

      // --last selects the most recent run for the resolved project.
      const byLast = JSON.parse(
        await runCapturing(["playbook", "status", "--last", ...shared]),
      ) as { runId: string };
      expect(byLast.runId).toBe("zulu-run");
    });

    test("an ambiguous prefix fails listing the candidates; --last excludes --run-id", async () => {
      const { root, storeRoot } = fixture();
      const stdout = captureStdout();
      await seedRuns(root, storeRoot, ["pair-one", "pair-two"]);
      stdout.spy.mockRestore();
      const shared = ["--repo-root", root, "--store-root", storeRoot];

      await expect(
        runRunCommand(["playbook", "status", "--run-id", "pair-", ...shared]),
      ).rejects.toThrow(/Run id prefix `pair-` is ambiguous[\s\S]*pair-one[\s\S]*pair-two/);

      // An exact id that is also a prefix of another run resolves exactly.
      const stdout2 = captureStdout();
      await runRunCommand(["playbook", "start", "user/ship", "--harness", "codex", "--run-id", "pair-on", ...shared]);
      stdout2.spy.mockRestore();
      const exact = JSON.parse(
        await runCapturing(["playbook", "status", "--run-id", "pair-on", ...shared]),
      ) as { runId: string };
      expect(exact.runId).toBe("pair-on");

      await expect(
        runRunCommand(["playbook", "status", "--run-id", "pair-one", "--last", ...shared]),
      ).rejects.toThrow(/`--last` cannot be combined with `--run-id`/);

      // A prefix with no match passes through so the operation's own
      // unknown-run error is preserved byte-for-byte (R-INV-1).
      await expect(
        runRunCommand(["playbook", "status", "--run-id", "no-such", ...shared]),
      ).rejects.toThrow("No Playbook run state found for run id `no-such`.");
    });
  });

  describe("flag defaults and precondition config (R-FLAG-1..2)", () => {
    test("--repo-root defaults to the nearest ancestor carrying .make-docs/manifest.json", async () => {
      const root = createTempDir("make-docs-repo-root-default-");
      tempRoots.push(root);
      writeMinimalManifest(root);
      writePackagablePlaybook(root);
      mkdirSync(path.join(root, "docs/work/nested"), { recursive: true });

      const previousCwd = process.cwd();
      process.chdir(path.join(root, "docs/work/nested"));
      try {
        const catalog = JSON.parse(await runCapturing(["playbook", "catalog"])) as {
          repoRoot: string;
          entries: unknown[];
        };
        expect(realpathSync(catalog.repoRoot)).toBe(realpathSync(root));
        expect(catalog.entries).toHaveLength(1);
      } finally {
        process.chdir(previousCwd);
      }
    });

    test("config-supplied preconditions absorb the ceremony and explicit flags override (R-FLAG-2)", async () => {
      const root = createTempDir("make-docs-precondition-config-");
      tempRoots.push(root);
      writeMinimalManifest(root);
      writePackagablePlaybook(root);
      const plan = createPlaybookPackagePlan({
        repoRoot: root,
        refs: ["user/run-stack"],
        target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
        supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      }).plan;
      const planPath = writeFile(root, "plan.json", JSON.stringify(plan, null, 2));

      // Missing config: unknown preconditions stop the pipeline (unchanged).
      const withoutConfig = JSON.parse(
        await runCapturing(["package", "preview", "--repo-root", root, "--plan-json", planPath]),
      ) as { status: string };
      expect(withoutConfig.status).not.toBe("ready");

      writeFile(
        root,
        ".make-docs/config.yaml",
        [
          "packaging:",
          "  preconditions:",
          "    harness-supported: satisfied",
          "    project-trusted: satisfied",
          "    symlink-or-copy-mirror: satisfied",
          "",
        ].join("\n"),
      );

      // Config defaults absorb the --precondition ceremony entirely.
      const absorbed = JSON.parse(
        await runCapturing(["package", "preview", "--repo-root", root, "--plan-json", planPath]),
      ) as { status: string; stops: unknown[] };
      expect(absorbed.status).toBe("ready");
      expect(absorbed.stops).toEqual([]);

      // Explicit flags always override config (convenience, never authority).
      const overridden = JSON.parse(
        await runCapturing([
          "package",
          "preview",
          "--repo-root",
          root,
          "--plan-json",
          planPath,
          "--precondition",
          "project-trusted=unsupported",
        ]),
      ) as { status: string };
      expect(overridden.status).not.toBe("ready");
    });
  });

  describe("targeted SQLite warning suppression (R-NOISE-1)", () => {
    test("matches only the SQLite ExperimentalWarning", () => {
      expect(
        isSqliteExperimentalWarning(
          "SQLite is an experimental feature and might change at any time",
          ["ExperimentalWarning"],
        ),
      ).toBe(true);
      const error = new Error("SQLite is an experimental feature and might change at any time");
      error.name = "ExperimentalWarning";
      expect(isSqliteExperimentalWarning(error)).toBe(true);
      expect(
        isSqliteExperimentalWarning(
          "SQLite is an experimental feature and might change at any time",
          [{ type: "ExperimentalWarning" }],
        ),
      ).toBe(true);

      // Other experimental warnings and other warning types still surface.
      expect(
        isSqliteExperimentalWarning("VM Modules is an experimental feature", [
          "ExperimentalWarning",
        ]),
      ).toBe(false);
      expect(
        isSqliteExperimentalWarning(
          "SQLite is an experimental feature and might change at any time",
          ["DeprecationWarning"],
        ),
      ).toBe(false);
    });

    test("the installed filter swallows the SQLite warning and passes every other warning through", async () => {
      const uninstall = installSqliteExperimentalWarningFilter();
      const received: string[] = [];
      const listener = (warning: Error) => {
        received.push(`${warning.name}: ${warning.message}`);
      };
      process.on("warning", listener);
      try {
        process.emitWarning(
          "SQLite is an experimental feature and might change at any time",
          "ExperimentalWarning",
        );
        process.emitWarning("something else is deprecated", "DeprecationWarning");
        await new Promise((resolve) => setImmediate(resolve));
        expect(received).toEqual(["DeprecationWarning: something else is deprecated"]);
      } finally {
        process.removeListener("warning", listener);
        uninstall();
      }
    });
  });

  describe("derived help and unknown-path guidance carry the new grammar", () => {
    test("run help lists ship and the preview spelling in the package domain", async () => {
      const output = await runCapturing([]);
      expect(output).toContain("package ship");
      expect(output).toContain("package preview");
      expect(output).toContain("package write");
    });

    test("unknown operation errors list the preview spelling among valid operations", async () => {
      await expect(runRunCommand(["package", "fly"])).rejects.toThrow(OperationError);
      await expect(runRunCommand(["package", "fly"])).rejects.toThrow(/package preview/);
      await expect(runRunCommand(["package", "fly"])).rejects.toThrow(/package ship/);
    });
  });
});
