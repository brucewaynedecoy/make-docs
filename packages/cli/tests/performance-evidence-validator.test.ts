import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test, vi } from "vitest";
import { callMakeDocsMcpTool } from "../src/mcp/tools";
import { createExecutionContext } from "../src/operations/context";
import {
  PERFORMANCE_EVIDENCE_RULES,
  validatePerformanceEvidence,
} from "../src/operations/performance-evidence";
import { invokeOperation } from "../src/operations/registry";
import { runRunCommand } from "../src/run/cli";
import { cleanupTempDir, createTempDir } from "./helpers";

const fixturePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures/performance-evidence-validator/profile.md",
);
const profileFixture = readFileSync(fixturePath, "utf8");

const profileCases = [
  ["hard-product-requirement", "docs/prd/10-performance.md", "docs/prd/10-performance.md"],
  ["engineering-guardrail", "docs/work/2026-09-17-example/04-performance.md", "docs/work/2026-09-17-example/04-performance.md"],
  ["characterization-baseline", "docs/plans/2026-09-17-example/04-performance.md", "docs/plans/2026-09-17-example/04-performance.md"],
  ["experiment-or-stretch", "docs/assets/performance/experiment.md", "docs/assets/performance/experiment.md"],
] as const;

const roots: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = 0;
  for (const root of roots.splice(0)) cleanupTempDir(root);
});

function write(root: string, relativePath: string, content: string): void {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
}

function fixtureRoot(): string {
  const root = createTempDir("make-docs-performance-validator-");
  roots.push(root);
  write(root, "docs/prd/01-authority.md", "# Product Authority\n");
  write(root, "docs/work/2026-09-17-example/04-phase.md", "# Phase 4\n\nNo benchmark runs.\n");
  return root;
}

function relativeLink(fromFile: string, toFile: string): string {
  const value = path.posix.relative(path.posix.dirname(fromFile), toFile);
  return value.startsWith(".") ? value : `./${value}`;
}

function renderProfile(
  profilePath: string,
  targetClass = "hard-product-requirement",
  id = "PERF-001",
): string {
  return profileFixture
    .replaceAll("{{PROFILE_ID}}", id)
    .replaceAll("{{TARGET_CLASS}}", targetClass)
    .replaceAll("{{CANONICAL_OWNER}}", profilePath)
    .replaceAll("{{SOURCE_LINK}}", relativeLink(profilePath, "docs/prd/01-authority.md"))
    .replaceAll(
      "{{PLAN_LINK}}",
      relativeLink(profilePath, "docs/work/2026-09-17-example/04-phase.md"),
    );
}

function addResult(profile: string, outcome: string, expiry = "2099-12-31"): string {
  return `${profile}\n#### Result Record\n\n- Result ID: RESULT-001\n- Exact profile binding: PERF-001 version 1 sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n- Outcome: \`${outcome}\`\n- Expiry: ${expiry}\n`;
}

function treeDigest(root: string): string {
  const entries: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join("/");
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) entries.push(`${relative}:${createHash("sha256").update(readFileSync(absolute)).digest("hex")}`);
      else entries.push(`${relative}:${entry.isSymbolicLink() ? "symlink" : "other"}`);
    }
  };
  visit(root);
  return createHash("sha256").update(entries.join("\n")).digest("hex");
}

describe("performance.evidence.validate", () => {
  test.each(profileCases)("passes a complete %s profile in its canonical location", (targetClass, profilePath) => {
    const root = fixtureRoot();
    write(root, profilePath, renderProfile(profilePath, targetClass));

    const report = validatePerformanceEvidence(root);

    expect(report.diagnostics).toEqual([]);
    expect(report.status).toBe("passed");
    expect(report.proofState).toBe("validator-passed");
    expect(report.profiles).toEqual([
      expect.objectContaining({ id: "PERF-001", targetClass, status: "valid" }),
    ]);
    expect(report.candidateCount).toBeGreaterThan(0);
    expect(report.mutation).toBe("none");
    expect(report.benchmarkExecuted).toBe(false);
    expect(report.retryAuthorized).toBe(false);
  });

  test.each(["pass", "fail", "revise", "blocked", "waived"])(
    "accepts the %s result outcome without treating it as proof state",
    (outcome) => {
      const root = fixtureRoot();
      const profilePath = "docs/prd/10-performance.md";
      write(root, profilePath, addResult(renderProfile(profilePath), outcome));

      const report = validatePerformanceEvidence(root);

      expect(report.status).toBe("passed");
      expect(report.proofState).toBe("validator-passed");
      expect(report.profiles[0]?.resultOutcome).toBe(outcome);
    },
  );

  test("fails when Canonical Owner does not name the profile's authority file", () => {
    const root = fixtureRoot();
    const profilePath = "docs/prd/10-performance.md";
    write(
      root,
      profilePath,
      renderProfile(profilePath).replace(
        `| Canonical Owner | ${profilePath} |`,
        "| Canonical Owner | docs/work/2026-09-17-example/04-phase.md |",
      ),
    );

    const report = validatePerformanceEvidence(root);

    expect(report.status).toBe("failed");
    expect(report).not.toHaveProperty("proofState");
    expect(report.profiles[0]?.status).toBe("invalid");
    expect(report.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "PERF-VAL-005", message: expect.stringContaining("Canonical Owner") }),
    ]));
  });

  test("marks every duplicate PERF profile invalid", () => {
    const root = fixtureRoot();
    const first = "docs/prd/10-performance.md";
    const second = "docs/prd/11-performance.md";
    write(root, first, renderProfile(first));
    write(root, second, renderProfile(second));

    const report = validatePerformanceEvidence(root);

    expect(report.status).toBe("failed");
    expect(report.profiles).toHaveLength(2);
    expect(report.profiles.every((profile) => profile.status === "invalid")).toBe(true);
    expect(report.diagnostics.filter((entry) => entry.code === "PERF-VAL-003")).toHaveLength(2);
  });

  test("allows one current profile and its archived prior version", () => {
    const root = fixtureRoot();
    const currentPath = "docs/prd/10-performance.md";
    const historyPath = ".make-docs/archive/history/2026-09-17/docs/prd/10-performance.md";
    write(
      root,
      currentPath,
      renderProfile(currentPath).replace("| Profile Version | `1` |", "| Profile Version | `2` |"),
    );
    write(
      root,
      historyPath,
      renderProfile(historyPath).replace(
        `| Canonical Owner | ${historyPath} |`,
        `| Canonical Owner | ${currentPath} |`,
      ),
    );

    const report = validatePerformanceEvidence(root);

    expect(report.status).toBe("passed");
    expect(report.profiles).toHaveLength(2);
    expect(report.profiles.every((profile) => profile.status === "valid")).toBe(true);
    expect(report.diagnostics.filter((entry) => entry.code === "PERF-VAL-003")).toEqual([]);
  });

  test("fails duplicate identity, wrong owner location, and unresolved required fields", () => {
    const root = fixtureRoot();
    const first = "docs/work/2026-09-17-example/first.md";
    const second = "docs/work/2026-09-17-example/second.md";
    write(root, first, renderProfile(first, "hard-product-requirement"));
    write(
      root,
      second,
      renderProfile(second, "hard-product-requirement").replace(
        "| Owner | Product owner |",
        "| Owner | {{OWNER}} |",
      ),
    );

    const report = validatePerformanceEvidence(root);

    expect(report.status).toBe("failed");
    expect(report).not.toHaveProperty("proofState");
    expect(report.diagnostics.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["PERF-VAL-003", "PERF-VAL-004", "PERF-VAL-005"]),
    );
  });

  test("requires the full scope, protocol, and non-sacrificable constraint shape", () => {
    const root = fixtureRoot();
    const profilePath = "docs/prd/10-performance.md";
    write(
      root,
      profilePath,
      renderProfile(profilePath)
        .replace("| Account And Network State | Local and offline |", "| Account And Network State | {{ACCOUNT_STATE}} |")
        .replace("| Warmup Rule | no warmup for this fixture |", "| Warmup Rule | {{WARMUP_RULE}} |")
        .replace("| Durability | no project file changes |", "| Durability | {{DURABILITY_EVIDENCE}} |"),
    );

    const report = validatePerformanceEvidence(root);

    expect(report.status).toBe("failed");
    expect(report.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "PERF-VAL-004",
        message: expect.stringContaining("account_and_network_state"),
      }),
      expect.objectContaining({ code: "PERF-VAL-004", message: expect.stringContaining("warmup_rule") }),
      expect.objectContaining({ code: "PERF-VAL-004", message: expect.stringContaining("durability") }),
    ]));
  });

  test("rejects none for required approval, expiry, and requalification authority", () => {
    const root = fixtureRoot();
    const profilePath = "docs/prd/10-performance.md";
    const profile = addResult(renderProfile(profilePath), "pass", "none")
      .replace("| Target Approval | Product owner approval 2026-09-17 |", "| Target Approval | none |")
      .replace("| Requalification Authority | separate owner or phase approval |", "| Requalification Authority | none |")
      .replace("| Requalification Budget | new finite budget required |", "| Requalification Budget | none |")
      .concat(
        "\n#### Waiver Record\n\n- Requirement And Profile: PERF-001 target\n- Owner And Approver: Product owner\n- Expiry Or Release Boundary: none\n- Reevaluation Or Remediation Trigger: next release\n",
      );
    write(root, profilePath, profile);

    const report = validatePerformanceEvidence(root);

    expect(report.status).toBe("failed");
    expect(report.diagnostics.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["PERF-VAL-006", "PERF-VAL-007", "PERF-VAL-011"]),
    );
    expect(report.diagnostics.filter((entry) => entry.code === "PERF-VAL-011")).toHaveLength(2);
  });

  test("fails unlimited budgets, repeated unchanged qualification, and an unknown outcome", () => {
    const root = fixtureRoot();
    const profilePath = "docs/prd/10-performance.md";
    const profile = addResult(renderProfile(profilePath), "maybe")
      .replace("| Materially Distinct Correction Attempt Limit | 2 attempts |", "| Materially Distinct Correction Attempt Limit | unlimited |")
      .replace("| Unchanged-Fingerprint Qualification Limit | 1 bounded execution |", "| Unchanged-Fingerprint Qualification Limit | 2 executions | ");
    write(root, profilePath, profile);

    const report = validatePerformanceEvidence(root);

    expect(report.status).toBe("failed");
    expect(report).not.toHaveProperty("proofState");
    expect(report.diagnostics.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["PERF-VAL-007", "PERF-VAL-008", "PERF-VAL-010"]),
    );
  });

  test.each(["more than one execution", "one execution per attempt"])(
    "rejects hidden retry language in the unchanged-fingerprint limit: %s",
    (limit) => {
      const root = fixtureRoot();
      const profilePath = "docs/prd/10-performance.md";
      write(
        root,
        profilePath,
        renderProfile(profilePath).replace(
          "| Unchanged-Fingerprint Qualification Limit | 1 bounded execution |",
          `| Unchanged-Fingerprint Qualification Limit | ${limit} |`,
        ),
      );

      const report = validatePerformanceEvidence(root);

      expect(report.status).toBe("failed");
      expect(report.retryAuthorized).toBe(false);
      expect(report.diagnostics).toEqual(expect.arrayContaining([
        expect.objectContaining({ code: "PERF-VAL-007", reason: expect.stringContaining(limit) }),
      ]));
    },
  );

  test("flags an unlinked work criterion even when another PERF ID appears in the file", () => {
    const root = fixtureRoot();
    const profilePath = "docs/prd/10-performance.md";
    write(root, profilePath, renderProfile(profilePath));
    write(
      root,
      "docs/work/2026-09-17-example/05-mixed-criteria.md",
      "# Mixed Criteria\n\n- PERF-001 owns the 100 ms API criterion.\n- The background job must complete within 2 seconds.\n",
    );

    const report = validatePerformanceEvidence(root);

    expect(report.status).toBe("passed");
    expect(report.diagnostics).toEqual([
      expect.objectContaining({ code: "PERF-VAL-014", line: 4 }),
    ]);
  });

  test("rejects expired evidence and reports no run authority", () => {
    const root = fixtureRoot();
    const profilePath = "docs/prd/10-performance.md";
    write(root, profilePath, addResult(renderProfile(profilePath), "pass", "2020-01-01"));

    const report = validatePerformanceEvidence(root);

    expect(report.status).toBe("failed");
    expect(report.retryAuthorized).toBe(false);
    expect(report.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "PERF-VAL-007", message: expect.stringContaining("expired") })]),
    );
  });

  test.each([
    ["unchanged because declared fields match", "unchanged"],
    ["materially changed because the workload changed", "materially-changed"],
    ["not-comparable because the environment is missing", "not-comparable"],
  ] as const)("reports declared fingerprint %s as %s", (declaration, expected) => {
    const root = fixtureRoot();
    const profilePath = "docs/prd/10-performance.md";
    write(
      root,
      profilePath,
      renderProfile(profilePath).replace(
        "unchanged because all declared fields match the prior evidence record",
        declaration,
      ),
    );

    const report = validatePerformanceEvidence(root);

    expect(report.profiles[0]?.fingerprintComparison).toBe(expected);
    expect(report.retryAuthorized).toBe(false);
  });

  test("fails a broken evidence link and refuses a symlinked authority path", () => {
    const root = fixtureRoot();
    const profilePath = "docs/prd/10-performance.md";
    write(
      root,
      profilePath,
      renderProfile(profilePath).replace("[Owning authority](./01-authority.md)", "[Owning authority](./missing.md)"),
    );
    const broken = validatePerformanceEvidence(root);
    expect(broken.status).toBe("failed");
    expect(broken.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: "PERF-VAL-012" })]));

    const outside = createTempDir("make-docs-performance-validator-outside-");
    roots.push(outside);
    write(outside, "escaped.md", "# Escaped\n");
    symlinkSync(path.join(outside, "escaped.md"), path.join(root, "docs", "escaped.md"));
    const unsafe = validatePerformanceEvidence(root);
    expect(unsafe.status).toBe("refused");
    expect(unsafe).not.toHaveProperty("proofState");
    expect(unsafe.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: "PERF-VAL-001" })]));
  });

  test("refuses a symbolic authority root before it reads outside the project", () => {
    const root = fixtureRoot();
    const outside = createTempDir("make-docs-performance-validator-root-outside-");
    roots.push(outside);
    write(outside, "escaped.md", "# Escaped authority\n\n100 ms\n");
    rmSync(path.join(root, "docs"), { recursive: true, force: true });
    symlinkSync(outside, path.join(root, "docs"));

    const report = validatePerformanceEvidence(root);

    expect(report.status).toBe("refused");
    expect(report).not.toHaveProperty("proofState");
    expect(report.markdownFilesScanned).toBe(0);
    expect(report.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "PERF-VAL-001", reason: "unsafe authority root" }),
    ]));
  });

  test("keeps judgment-only rules explicit and records why they are one-sided", () => {
    const agentOnly = PERFORMANCE_EVIDENCE_RULES.filter((rule) => rule.deterministicSupport === "agent-only");
    expect(agentOnly.map((rule) => rule.id)).toEqual([
      "PERF-RULE-015",
      "PERF-RULE-016",
      "PERF-RULE-017",
    ]);
    for (const rule of PERFORMANCE_EVIDENCE_RULES) {
      expect(rule.diagnosticCode).toMatch(/^PERF-(?:VAL|AGENT)-\d{3}$/);
      expect(rule.parityMapping.length).toBeGreaterThan(0);
      if (rule.deterministicSupport === "agent-only") {
        expect(rule.judgmentRequired).toBe(true);
        expect(rule.oneSidedReason).toEqual(expect.any(String));
      } else {
        expect(rule.oneSidedReason).toBeNull();
      }
    }
  });

  test("projects one read-only result through the core, MCP, JSON CLI, and human CLI", async () => {
    const root = fixtureRoot();
    const profilePath = "docs/prd/10-performance.md";
    write(root, profilePath, renderProfile(profilePath));
    const before = treeDigest(root);

    const invocation = await invokeOperation(
      "performance.evidence.validate",
      { targetRoot: root },
      createExecutionContext({ surface: "test", writesAllowed: false }),
    );
    const mcp = await callMakeDocsMcpTool("make_docs_performance_evidence_validate", {
      targetRoot: root,
    });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await runRunCommand([
      "performance",
      "evidence",
      "validate",
      "--target-root",
      root,
      "--json",
    ]);
    const cli = JSON.parse(writeSpy.mock.calls.map(([chunk]) => String(chunk)).join(""));
    expect(cli).toEqual(invocation.value);
    expect(mcp.result).toEqual(invocation.value);
    expect(process.exitCode).toBe(0);

    writeSpy.mockClear();
    await runRunCommand(
      ["performance", "evidence", "validate", "--target-root", root],
      { isTty: true },
    );
    const human = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
    expect(human).toContain("Performance Evidence validation: passed");
    expect(human).toContain("Proof state: validator-passed");
    expect(human).toContain("No benchmark ran. No project file changed.");
    expect(treeDigest(root)).toBe(before);
  });
});
