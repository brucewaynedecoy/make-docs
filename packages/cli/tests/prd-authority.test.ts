import { mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { callMakeDocsMcpTool } from "../src/mcp/tools";
import { createExecutionContext } from "../src/operations/context";
import { invokeOperation } from "../src/operations/registry";
import { validatePrdAuthority } from "../src/operations/prd";
import { runRunCommand } from "../src/run/cli";
import { cleanupTempDir, createTempDir } from "./helpers";

function writeMarkdown(root: string, relativePath: string, lines: string[]): void {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${lines.join("\n")}\n`, "utf8");
}

function writeStructured(root: string, relativePath: string, contents: string): void {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, contents, "utf8");
}

describe("authoritative PRD validation", () => {
  const tempRoots: string[] = [];
  const priorExitCode = process.exitCode;

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = priorExitCode;
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("passes surgical updates, Requirement History, and genuinely new capability PRDs", () => {
    const root = createTempDir("make-docs-prd-authority-pass-");
    tempRoots.push(root);
    writeMarkdown(root, "docs/prd/00-index.md", [
      "# Product Requirements Index",
      "",
      "| PRD | Kind |",
      "| --- | --- |",
      "| [01 Accounts](01-accounts.md) | capability |",
    ]);
    writeMarkdown(root, "docs/prd/01-accounts.md", [
      "---",
      "kind: prd",
      "status: active",
      "---",
      "",
      "# 01 Accounts",
      "",
      "## Requirements",
      "",
      "Accounts use the current authentication contract.",
      "",
      "## Requirement History",
      "",
      "- 2026-08-08 W18 R16: replaced the prior contract; provenance: [former record](15-revise-authentication.md).",
    ]);
    writeMarkdown(root, "docs/prd/02-offline-sync.md", [
      "# 02 Update Delivery",
      "",
      "## Requirements",
      "",
      "The product synchronizes queued work when connectivity returns.",
      "",
      "```markdown",
      "# 99 Revise This Example",
      "## Baseline Being Revised or Removed",
      "[example](99-revise-example.md)",
      "```",
    ]);
    writeMarkdown(root, "docs/assets/archive/history/legacy.md", [
      "# Legacy provenance",
      "",
      "See [the former revision](../../../prd/15-revise-authentication.md).",
    ]);
    writeMarkdown(root, "docs/designs/migration.md", [
      "# Migration design",
      "",
      "## Migration Provenance",
      "",
      "The design came from [the former change record](../prd/15-revise-authentication.md).",
    ]);
    writeStructured(
      root,
      "docs/artifacts/lineage.yaml",
      [
        "lineage:",
        "  sourcePrds:",
        "    - docs/prd/15-revise-authentication.md",
        "notes: docs/prd/15-revise-authentication.md",
        "",
      ].join("\n"),
    );

    const report = validatePrdAuthority(root);

    expect(report.status).toBe("passed");
    expect(report.diagnostics).toEqual([]);
    expect(report.prdFilesScanned).toBe(3);
  });

  test("rejects every retired editorial PRD shape with stable diagnostic codes", () => {
    const root = createTempDir("make-docs-prd-authority-fail-");
    tempRoots.push(root);
    writeMarkdown(root, "docs/prd/00-index.md", [
      "# Product Requirements Index",
      "",
      "| PRD | Kind |",
      "| --- | --- |",
      "| [12 Revise Search](12-revise-search.md) | revision |",
    ]);
    writeMarkdown(root, "docs/prd/12-revise-search.md", [
      "# 12 Revise Search",
      "",
      "## Baseline Being Revised or Removed",
      "",
      "The former search contract.",
    ]);
    writeMarkdown(root, "docs/prd/13-capability.md", [
      "---",
      "kind: enhancement",
      "coordinate: W18 R16",
      "---",
      "",
      "# 13 Capability",
    ]);
    writeMarkdown(root, "docs/plans/current.md", [
      "---",
      "source:",
      "  type: prd",
      "  path: docs/prd/12-revise-search.md",
      "---",
      "",
      "# Current plan",
      "",
      "Source authority: [revision PRD](../prd/12-revise-search.md).",
    ]);

    const report = validatePrdAuthority(root);

    expect(report.status).toBe("failed");
    expect(new Set(report.diagnostics.map((diagnostic) => diagnostic.code))).toEqual(
      new Set([
        "PRD-AUTH-001",
        "PRD-AUTH-002",
        "PRD-AUTH-003",
        "PRD-AUTH-004",
        "PRD-AUTH-005",
        "PRD-AUTH-006",
      ]),
    );
    expect(report.diagnostics).toEqual(
      [...report.diagnostics].sort(
        (left, right) =>
          left.path.localeCompare(right.path) ||
          left.line - right.line ||
          left.code.localeCompare(right.code),
      ),
    );
  });

  test.each([
    "add",
    "enhance",
    "remove",
    "deprecate",
    "reconcile",
    "reconciliation",
  ])(
    "rejects the %s editorial filename family case-insensitively",
    (verb) => {
      const root = createTempDir(`make-docs-prd-authority-${verb}-`);
      tempRoots.push(root);
      writeMarkdown(root, `docs/prd/20-${verb}-thing.md`, [`# 20 ${verb} Thing`]);
      expect(validatePrdAuthority(root).diagnostics).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: "PRD-AUTH-001" })]),
      );
    },
  );

  test.each([
    "add",
    "enhance",
    "remove",
    "deprecate",
    "reconcile",
    "reconciliation",
  ])("rejects the %s editorial H1 subject", (verb) => {
    const root = createTempDir(`make-docs-prd-authority-h1-${verb}-`);
    tempRoots.push(root);
    writeMarkdown(root, "docs/prd/20-capability.md", [`# 20 ${verb} Thing`]);
    expect(validatePrdAuthority(root).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "PRD-AUTH-002" })]),
    );
  });

  test("allows ambiguous product nouns in capability filenames and H1 subjects", () => {
    const root = createTempDir("make-docs-prd-authority-product-nouns-");
    tempRoots.push(root);
    writeMarkdown(root, "docs/prd/20-update-delivery.md", ["# 20 Update Delivery"]);
    writeMarkdown(root, "docs/prd/21-replacement-policy.md", ["# 21 Replacement Policy"]);
    writeMarkdown(root, "docs/prd/22-migration-safety.md", ["# 22 Migration Safety"]);

    const report = validatePrdAuthority(root);

    expect(report.status).toBe("passed");
    expect(report.diagnostics).toEqual([]);
  });

  test("checks only explicit authority contexts and canonical archive provenance", () => {
    const root = createTempDir("make-docs-prd-authority-contexts-");
    tempRoots.push(root);
    writeMarkdown(root, "docs/prd/00-index.md", [
      "# Product Requirements Index",
      "",
      "## Document Map",
      "",
      "| Document | Kind |",
      "| --- | --- |",
      "| [Old](12-revise-search.md) | capability |",
    ]);
    writeMarkdown(root, "docs/work/current.md", [
      "# Current work",
      "",
      "## Source PRD Docs",
      "",
      "- [Active editorial target](../prd/12-revise-search.md)",
      "- [Archived editorial target](../assets/archive/prds/2026/12-revise-search.md)",
    ]);
    writeMarkdown(root, "docs/designs/migration.md", [
      "# Migration notes",
      "",
      "## Migration Provenance",
      "",
      "[Former record](../prd/12-revise-search.md)",
    ]);
    writeMarkdown(root, "docs/history/current.md", [
      "# Misplaced active authority",
      "",
      "## Source PRD Docs",
      "",
      "[Former record](../prd/12-revise-search.md)",
    ]);
    writeMarkdown(root, "docs/assets/archive/current.md", [
      "# Archived record",
      "",
      "## Source PRD Docs",
      "",
      "[Former record](../../prd/12-revise-search.md)",
    ]);

    const report = validatePrdAuthority(root);
    const authorityLinkDiagnostics = report.diagnostics.filter(
      (diagnostic) => diagnostic.code === "PRD-AUTH-005",
    );

    expect(authorityLinkDiagnostics.map((diagnostic) => diagnostic.path)).toEqual([
      "docs/history/current.md",
      "docs/prd/00-index.md",
      "docs/work/current.md",
      "docs/work/current.md",
    ]);
    expect(authorityLinkDiagnostics.some((diagnostic) => diagnostic.message.includes("archive/prds"))).toBe(true);
  });

  test("scopes kind validation to top-level frontmatter and the index Document Map", () => {
    const root = createTempDir("make-docs-prd-authority-kind-scope-");
    tempRoots.push(root);
    writeMarkdown(root, "docs/prd/00-index.md", [
      "# Product Requirements Index",
      "",
      "## Unrelated Matrix",
      "",
      "| Document | Kind |",
      "| --- | --- |",
      "| Example | revision |",
      "",
      "## Document Map",
      "",
      "| Document | Kind |",
      "| --- | --- |",
      "| Capability | addition |",
      "",
      "| Status | Notes |",
      "| --- | --- |",
      "| revision | unrelated second table |",
    ]);
    writeMarkdown(root, "docs/prd/01-capability.md", [
      "---",
      "kind: enhancement",
      "metadata:",
      "  kind: revision",
      "---",
      "",
      "# 01 Capability",
      "",
      "kind: removal",
    ]);

    const kinds = validatePrdAuthority(root).diagnostics.filter(
      (diagnostic) => diagnostic.code === "PRD-AUTH-003",
    );

    expect(kinds.map((diagnostic) => [diagnostic.path, diagnostic.line])).toEqual([
      ["docs/prd/00-index.md", 13],
      ["docs/prd/01-capability.md", 2],
    ]);
  });

  test("checks named JSON, JSONL, and YAML authority fields without scanning arbitrary prose", () => {
    const root = createTempDir("make-docs-prd-authority-structured-");
    tempRoots.push(root);
    writeStructured(
      root,
      "docs/conformance/map.json",
      JSON.stringify({
        sourcePrds: ["docs/prd/12-revise-search.md"],
        comment: "docs/prd/13-revise-comments.md",
      }),
    );
    writeStructured(
      root,
      "docs/conformance/map.yaml",
      "authority_path: docs/assets/archive/prds/2026/14-revise-archive.md\n",
    );
    writeStructured(
      root,
      "docs/conformance/map.jsonl",
      [
        JSON.stringify({ source_prd: "docs/prd/15-revise-jsonl.md" }),
        JSON.stringify({ note: "docs/prd/16-revise-note.md" }),
        "",
      ].join("\n"),
    );
    writeStructured(
      root,
      "docs/conformance/provenance.yaml",
      "provenance:\n  source_prds:\n    - docs/prd/17-revise-history.md\n",
    );
    writeStructured(
      root,
      "docs/assets/archive/conformance.yaml",
      "sourcePrds:\n  - docs/prd/18-revise-archived-source.md\n",
    );

    const diagnostics = validatePrdAuthority(root).diagnostics.filter(
      (diagnostic) => diagnostic.code === "PRD-AUTH-005",
    );

    expect(diagnostics.map((diagnostic) => diagnostic.path)).toEqual([
      "docs/conformance/map.json",
      "docs/conformance/map.jsonl",
      "docs/conformance/map.yaml",
    ]);
  });

  test("distinguishes an absent PRD set from invalid and escaping target roots", () => {
    const missing = path.join(createTempDir("make-docs-prd-authority-missing-parent-"), "missing");
    tempRoots.push(path.dirname(missing));
    const missingReport = validatePrdAuthority(missing);
    expect(missingReport).toEqual(
      expect.objectContaining({
        status: "failed",
        targetRootStatus: "invalid",
        prdSetStatus: "absent",
      }),
    );
    expect(missingReport.diagnostics[0]?.code).toBe("PRD-AUTH-007");

    const fileRoot = createTempDir("make-docs-prd-authority-file-root-");
    tempRoots.push(fileRoot);
    writeStructured(fileRoot, "project.txt", "not a directory\n");
    expect(validatePrdAuthority(path.join(fileRoot, "project.txt")).diagnostics[0]?.code).toBe(
      "PRD-AUTH-007",
    );

    const empty = createTempDir("make-docs-prd-authority-empty-");
    tempRoots.push(empty);
    expect(validatePrdAuthority(empty)).toEqual(
      expect.objectContaining({ status: "passed", prdSetStatus: "absent" }),
    );

    const root = createTempDir("make-docs-prd-authority-symlink-root-");
    const outside = createTempDir("make-docs-prd-authority-symlink-outside-");
    tempRoots.push(root, outside);
    mkdirSync(path.join(root, "docs"), { recursive: true });
    mkdirSync(path.join(outside, "prd"), { recursive: true });
    symlinkSync(path.join(outside, "prd"), path.join(root, "docs", "prd"), "dir");
    const escapingReport = validatePrdAuthority(root);
    expect(escapingReport.prdSetStatus).toBe("unsafe");
    expect(escapingReport.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "PRD-AUTH-008" })]),
    );
  });

  test("rejects an exact docs/prd root symlink even when it resolves inside the project", () => {
    const root = createTempDir("make-docs-prd-authority-internal-symlink-");
    tempRoots.push(root);
    mkdirSync(path.join(root, "docs", "stored-prds"), { recursive: true });
    symlinkSync("stored-prds", path.join(root, "docs", "prd"), "dir");

    const report = validatePrdAuthority(root);

    expect(report.prdSetStatus).toBe("unsafe");
    expect(report.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "PRD-AUTH-008",
          path: "docs/prd",
          message: expect.stringContaining("symbolic link"),
        }),
      ]),
    );
  });

  test("operation, MCP, JSON CLI, and human CLI share the structured result and CLI failure", async () => {
    const root = createTempDir("make-docs-prd-authority-surfaces-");
    tempRoots.push(root);
    writeMarkdown(root, "docs/prd/99-REMOVE-legacy.md", ["# 99 REMOVE Legacy"]);

    const invocation = await invokeOperation(
      "prd.authority.validate",
      { targetRoot: root },
      createExecutionContext({ surface: "test", writesAllowed: false }),
    );
    expect(invocation.value).toEqual(
      expect.objectContaining({ status: "failed", targetRoot: root }),
    );

    const mcp = await callMakeDocsMcpTool("make_docs_prd_authority_validate", {
      targetRoot: root,
    });
    expect(JSON.stringify(mcp)).toContain("PRD-AUTH-001");

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await runRunCommand(["prd", "authority", "validate", "--target-root", root, "--json"]);
    const json = JSON.parse(writeSpy.mock.calls.map(([chunk]) => String(chunk)).join(""));
    expect(json.status).toBe("failed");
    expect(process.exitCode).toBe(1);

    process.exitCode = 0;
    writeSpy.mockClear();
    await runRunCommand(["prd", "authority", "validate", "--target-root", root], {
      isTty: true,
    });
    const human = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
    expect(human).toContain("PRD authority validation: failed");
    expect(human).toContain("PRD-AUTH-001");
    expect(process.exitCode).toBe(1);
  });
});
