/**
 * W34 R0 P1 ported tests (A2).
 *
 * Each case here is one test method of a Python test file that W34 R0 P4
 * removes. The case title is `<Python class>.<Python method>`, so the
 * evidence map from each Python method to its vitest case is one to one.
 * Each case keeps the Python inputs and expected findings. A rule name is
 * now a rule ID with its prefix, such as `markdown-style.block-spacing` for
 * `block-spacing`.
 *
 * - `packages/skills/decompose-codebase/scripts/test_validate_output.py`: 46 cases.
 * - `packages/skills/cleanup-docs/scripts/test_check_markdown_style.py`: 11 cases.
 * - `packages/skills/archive-docs/scripts/test_trace_relationships.py`: 1 case.
 */
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LINK_RE,
  checkLinksInTree,
  isPlausibleLinkTarget,
  stripCodeRegions,
  validateDecompositionOutput,
  type DecompositionValidationResult,
} from "../src/operations/decomposition/output";
import {
  fixMarkdownStyle,
  scanMarkdownStyle,
  splitLines,
  type MarkdownStyleFinding,
  type MarkdownStyleValidateResult,
} from "../src/operations/project/markdown-style";
import {
  buildHistoryCoordinateRelationships,
  buildRelatedRelationships,
  discoverArtifacts,
  resolveLink,
} from "../src/operations/project/relations";
import { runProjectCommand } from "../src/run/root-operations";
import { HARNESS_CALLER_IDENTITY_ENV } from "../src/harness-access/contract";

async function captureStdout(run: () => Promise<void>): Promise<string> {
  const chunks: string[] = [];
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  });
  try {
    await run();
  } finally {
    spy.mockRestore();
  }
  return chunks.join("");
}

function write(file: string, text: string): string {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
  return file;
}

const errorsOf = (result: DecompositionValidationResult) => result.findings.map((finding) => finding.message);
const ok = (result: DecompositionValidationResult) => result.status === "passed";

// ---------------------------------------------------------------------------
// test_validate_output.py: TestStripCodeRegions (13)
// ---------------------------------------------------------------------------

describe("test_validate_output.py TestStripCodeRegions", () => {
  it("TestStripCodeRegions.test_fenced_backtick_block", () => {
    const result = stripCodeRegions("before\n```\ncode['key'](val)\n```\nafter\n");
    expect(result).not.toContain("code['key'](val)");
    expect(result).toContain("before");
    expect(result).toContain("after");
  });

  it("TestStripCodeRegions.test_fenced_tilde_block", () => {
    expect(stripCodeRegions("before\n~~~\ncode['key'](val)\n~~~\nafter\n")).not.toContain("code['key'](val)");
  });

  it("TestStripCodeRegions.test_fenced_block_with_language", () => {
    expect(stripCodeRegions("before\n```salt\nsalt['pillar.get'](...)\n```\nafter\n")).not.toContain("salt['pillar.get']");
  });

  it("TestStripCodeRegions.test_line_count_preserved", () => {
    const text = "line1\n```\ncode\nmore code\n```\nline6\n";
    expect(splitLines(stripCodeRegions(text))).toHaveLength(splitLines(text).length);
  });

  it("TestStripCodeRegions.test_consecutive_fences", () => {
    const result = stripCodeRegions("```\nblock1\n```\nplain\n```\nblock2\n```\n");
    expect(result).not.toContain("block1");
    expect(result).not.toContain("block2");
    expect(result).toContain("plain");
  });

  it("TestStripCodeRegions.test_closing_fence_must_match_character", () => {
    // A ~~~ fence cannot be closed by ``` (CommonMark rule).
    const result = stripCodeRegions("~~~\ncode['key'](val)\n```\nstill fenced\n~~~\nafter\n");
    expect(result).not.toContain("code['key'](val)");
    expect(result).not.toContain("still fenced");
    expect(result).toContain("after");
  });

  it("TestStripCodeRegions.test_closing_fence_must_be_at_least_as_long", () => {
    const result = stripCodeRegions("````\ncode['key'](val)\n```\nstill fenced\n````\nafter\n");
    expect(result).not.toContain("code['key'](val)");
    expect(result).not.toContain("still fenced");
    expect(result).toContain("after");
  });

  it("TestStripCodeRegions.test_inline_single_backtick", () => {
    const result = stripCodeRegions("See `salt['pillar.get'](..., merge=True)` for details.\n");
    expect(result).not.toContain("salt['pillar.get']");
    expect(result).toContain("See");
    expect(result).toContain("for details.");
  });

  it("TestStripCodeRegions.test_inline_double_backtick", () => {
    expect(stripCodeRegions("Use ``salt['pillar.get'](..., merge=True)`` here.\n")).not.toContain("salt['pillar.get']");
  });

  it("TestStripCodeRegions.test_non_code_content_untouched", () => {
    const text = "A [real link](./file.md) in plain prose.\n";
    expect(stripCodeRegions(text)).toBe(text);
  });

  it("TestStripCodeRegions.test_empty_code_span", () => {
    expect(stripCodeRegions("An empty `` span.\n")).toContain("An empty");
  });

  it("TestStripCodeRegions.test_unclosed_fence_treats_rest_as_code", () => {
    const result = stripCodeRegions("before\n```\ncode['key'](val)\nmore code\n");
    expect(result).not.toContain("code['key'](val)");
    expect(result).not.toContain("more code");
    expect(result).toContain("before");
  });

  it("TestStripCodeRegions.test_no_link_matches_after_stripping", () => {
    const text =
      "```salt\n" +
      "salt['pillar.get']('key', default=None, merge=True)\n" +
      "salt['grains.get']('os_family')\n" +
      "```\n" +
      "\n" +
      "Inline: `salt['pillar.get'](..., merge=True)`\n" +
      "\n" +
      "[real link](./file.md)\n";
    expect([...stripCodeRegions(text).matchAll(LINK_RE)].map((match) => match[1])).toEqual(["./file.md"]);
  });
});

// ---------------------------------------------------------------------------
// test_validate_output.py: TestIsPlausibleLinkTarget (12)
// ---------------------------------------------------------------------------

describe("test_validate_output.py TestIsPlausibleLinkTarget", () => {
  it("TestIsPlausibleLinkTarget.test_rejects_comma", () => expect(isPlausibleLinkTarget("arg1, arg2")).toBe(false));
  it("TestIsPlausibleLinkTarget.test_rejects_ellipsis", () => {
    expect(isPlausibleLinkTarget("...")).toBe(false);
    expect(isPlausibleLinkTarget("..., merge=True")).toBe(false);
  });
  it("TestIsPlausibleLinkTarget.test_rejects_leading_single_quote", () => expect(isPlausibleLinkTarget("'os_family'")).toBe(false));
  it("TestIsPlausibleLinkTarget.test_rejects_trailing_double_quote", () => expect(isPlausibleLinkTarget('"config"')).toBe(false));
  it("TestIsPlausibleLinkTarget.test_rejects_unescaped_space", () => expect(isPlausibleLinkTarget("some path here")).toBe(false));
  it("TestIsPlausibleLinkTarget.test_accepts_relative_path", () => expect(isPlausibleLinkTarget("./path/to/file.md")).toBe(true));
  it("TestIsPlausibleLinkTarget.test_accepts_parent_path", () => expect(isPlausibleLinkTarget("../README.md")).toBe(true));
  it("TestIsPlausibleLinkTarget.test_accepts_bare_filename", () => expect(isPlausibleLinkTarget("00-index")).toBe(true));
  it("TestIsPlausibleLinkTarget.test_accepts_path_with_fragment", () => expect(isPlausibleLinkTarget("file.md#heading")).toBe(true));
  it("TestIsPlausibleLinkTarget.test_accepts_escaped_spaces", () => expect(isPlausibleLinkTarget("path\\ with\\ spaces")).toBe(true));
  it("TestIsPlausibleLinkTarget.test_accepts_subdirectory_path", () => expect(isPlausibleLinkTarget("sub/dir/file.txt")).toBe(true));
  it("TestIsPlausibleLinkTarget.test_rejects_empty_string", () => {
    // The empty string passes the heuristic. The link rule skips it first.
    expect(isPlausibleLinkTarget("")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// test_validate_output.py: TestValidateLinksEndToEnd (21)
// ---------------------------------------------------------------------------

describe("test_validate_output.py TestValidateLinksEndToEnd", () => {
  let tmpdir: string;
  let resolvedRoot: string;
  let prdDir: string;
  let workDir: string;

  beforeEach(() => {
    tmpdir = mkdtempSync(path.join(os.tmpdir(), "w34-p1-validate-"));
    resolvedRoot = realpathSync(tmpdir);
    prdDir = path.join(tmpdir, "docs", "prd");
    workDir = path.join(tmpdir, "docs", "work");
    mkdirSync(prdDir, { recursive: true });
    mkdirSync(workDir, { recursive: true });
  });
  afterEach(() => rmSync(tmpdir, { recursive: true, force: true }));

  const writePrd = (name: string, content: string) => write(path.join(prdDir, name), content);
  const writeWork = (name: string, content: string) => write(path.join(workDir, name), content);
  const checkTree = (dir: string) => {
    const errors = checkLinksInTree(dir, resolvedRoot, [], tmpdir).map((finding) => finding.message);
    return { errors, linkErrors: errors.filter((error) => error.toLowerCase().includes("link")) };
  };

  function writeMinimalPrdSet(): void {
    writePrd("00-index.md", "## Purpose\nIdx.\n## Reading Order\nOrd.\n## Document Map\nMap.\n## Source Anchors\n`src/`\n## Audience Paths\nPaths.\n");
    writePrd(
      "01-product-overview.md",
      "## Purpose\nPO.\n## Users\n`u.py`\n## Key Capabilities\n`k.py`\n## System Boundaries\n`s.py`\n## Current Limitations\n`l.py`\n## Source Anchors\n`src/`\n",
    );
    writePrd(
      "02-architecture-overview.md",
      "## Purpose\nAO.\n## Topology\n`t.py`\n## Module Map\n`m.py`\n## Runtime Boundaries\n`r.py`\n## Data Flow\n`d.py`\n## Configuration Surfaces\n`c.py`\n## Source Anchors\n`src/`\n",
    );
    writePrd(
      "03-open-questions-and-risk-register.md",
      "## Purpose\nOQ.\n## Confirmed Drift\n`cd.py`\n## Open Questions\n`oq.py`\n## Rebuild Risks\n`rr.py`\n## Source Anchors\n`src/`\n",
    );
    writePrd("04-glossary.md", "## Purpose\nGl.\n## Terms\nTerms.\n## Source Anchors\n`src/`\n");
  }

  function writeMinimalWorkDirectory(directoryName = "2024-01-01-w5-r4-sample-backlog"): string {
    const backlog = path.join(workDir, directoryName);
    write(path.join(backlog, "00-index.md"), "## Purpose\nIdx.\n## Phase Map\nMap.\n## Usage Notes\nNotes.\n");
    write(
      path.join(backlog, "01-foundation.md"),
      "## Purpose\nP.\n## Overview\nO.\n## Source PRD Docs\n- [PRD Index](../../prd/00-index.md)\n## Stage 1 - Foundation\n### Tasks\n- [ ] t1: T.\n### Acceptance criteria\n- A.\n### Dependencies\n- None.\n",
    );
    return backlog;
  }

  const phase = (stages: string) =>
    "## Purpose\nP.\n## Overview\nO.\n## Source PRD Docs\n- [PRD Index](../../prd/00-index.md)\n" + stages;

  it("TestValidateLinksEndToEnd.test_no_false_positives_on_code_patterns", () => {
    writePrd(
      "05-salt-subsystem.md",
      "## Purpose\nSalt config.\n\n## Scope\n```salt\nsalt['pillar.get']('key', default=None, merge=True)\nsalt['grains.get']('os_family')\n```\n\n" +
        "Inline: `salt['pillar.get'](..., merge=True)`\n\nDouble: ``obj['method.name'](arg1, arg2)``\n\n" +
        "## Component and Capability Map\nMap.\n## Contracts and Data\nData.\n## Integrations\nInt.\n## Rebuild Notes\nNotes.\n## Source Anchors\n`src/salt.py`\n",
    );
    expect(checkTree(prdDir).linkErrors).toEqual([]);
  });

  it("TestValidateLinksEndToEnd.test_catches_genuinely_broken_links", () => {
    writePrd("05-test.md", "## Purpose\nTest.\n[broken](./nonexistent-file.md)\n");
    const { errors } = checkTree(prdDir);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("broken link");
    expect(errors[0]).toContain("nonexistent-file.md");
    expect(checkLinksInTree(prdDir, resolvedRoot, [], tmpdir)[0]).toMatchObject({ ruleId: "decomposition.link.broken", path: "docs/prd/05-test.md" });
  });

  it("TestValidateLinksEndToEnd.test_valid_links_pass", () => {
    writePrd("06-target.md", "## Purpose\nTarget.\n");
    writePrd("05-source.md", "## Purpose\nSource.\n[link](./06-target.md)\n");
    expect(checkTree(prdDir).linkErrors).toEqual([]);
  });

  it("TestValidateLinksEndToEnd.test_skips_fragment_and_url_links", () => {
    writePrd("05-links.md", "## Purpose\nLinks.\n[frag](#heading)\n[url](https://example.com)\n[mail](mailto:test@example.com)\n");
    expect(checkTree(prdDir).errors).toEqual([]);
  });

  it("TestValidateLinksEndToEnd.test_mixed_fixture", () => {
    writePrd("05-mixed.md", "## Purpose\nMixed.\n\n```python\nd['key'](value)\n```\n\nInline `obj['m'](x)` text.\n\n[broken](./does-not-exist.md)\n");
    const { errors } = checkTree(prdDir);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("broken link");
    expect(errors[0]).toContain("does-not-exist.md");
  });

  it("TestValidateLinksEndToEnd.test_bare_bracket_paren_with_heuristic", () => {
    writePrd("05-bare.md", "## Purpose\nBare patterns.\n\nsalt['pillar.get'](..., merge=True)\n");
    expect(checkTree(prdDir).linkErrors).toEqual([]);
  });

  it("TestValidateLinksEndToEnd.test_work_directory_also_filtered", () => {
    writeWork("05-task.md", "## Purpose\nTask.\n```\nhash['config.get'](default_value)\n```\n");
    expect(checkTree(workDir).linkErrors).toEqual([]);
  });

  it("TestValidateLinksEndToEnd.test_build_result_accepts_phase_local_task_ids_across_stages", () => {
    writeMinimalPrdSet();
    const backlog = writeMinimalWorkDirectory();
    write(
      path.join(backlog, "01-foundation.md"),
      phase(
        "## Stage 1 - Foundation\n### Tasks\n- [ ] t1: First task.\n- [x] t2: Second task.\n### Acceptance criteria\n- First acceptance.\n### Dependencies\n- None.\n" +
          "## Stage 2 - Follow-up\n### Tasks\n- [ ] t3: Third task.\n### Acceptance criteria\n- Third acceptance.\n### Dependencies\n- Stage 1.\n",
      ),
    );
    const result = validateDecompositionOutput(tmpdir);
    expect(ok(result), errorsOf(result).join("\n")).toBe(true);
  });

  it("TestValidateLinksEndToEnd.test_build_result_accepts_upper_and_mixed_case_task_ids", () => {
    // W31 R0 P1: t and T name the same task ID (PRD 14 R-COORD-22).
    writeMinimalPrdSet();
    for (const [first, second, third] of [["T", "T", "T"], ["T", "t", "T"], ["t", "T", "t"]] as const) {
      rmSync(path.join(workDir, "2024-01-01-w5-r4-sample-backlog"), { recursive: true, force: true });
      const backlog = writeMinimalWorkDirectory();
      write(
        path.join(backlog, "01-foundation.md"),
        phase(
          `## Stage 1 - Foundation\n### Tasks\n- [ ] ${first}1: First task.\n- [x] ${second}2: Second task.\n### Acceptance criteria\n- First acceptance.\n### Dependencies\n- None.\n` +
            `## Stage 2 - Follow-up\n### Tasks\n- [ ] ${third}3: Third task.\n### Acceptance criteria\n- Third acceptance.\n### Dependencies\n- Stage 1.\n`,
        ),
      );
      const result = validateDecompositionOutput(tmpdir);
      expect(ok(result), `${first}${second}${third}: ${errorsOf(result).join("\n")}`).toBe(true);
    }
  });

  it("TestValidateLinksEndToEnd.test_build_result_rejects_duplicate_task_ids_across_case", () => {
    writeMinimalPrdSet();
    const backlog = writeMinimalWorkDirectory();
    write(
      path.join(backlog, "01-foundation.md"),
      phase("## Stage 1 - Foundation\n### Tasks\n- [ ] t1: First task.\n- [ ] T1: Same task again.\n### Acceptance criteria\n- A.\n### Dependencies\n- None.\n"),
    );
    const result = validateDecompositionOutput(tmpdir);
    expect(ok(result)).toBe(false);
    expect(errorsOf(result).some((error) => error.includes("duplicate task id T1")), errorsOf(result).join("\n")).toBe(true);
    expect(result.findings.find((finding) => finding.ruleId === "decomposition.task-id.duplicate")).toMatchObject({ line: 10 });
  });

  it("TestValidateLinksEndToEnd.test_build_result_rejects_numbered_task_items", () => {
    writeMinimalPrdSet();
    const backlog = writeMinimalWorkDirectory();
    write(path.join(backlog, "01-foundation.md"), phase("## Stage 1 - Foundation\n### Tasks\n1. T.\n### Acceptance criteria\n- A.\n### Dependencies\n- None.\n"));
    const result = validateDecompositionOutput(tmpdir);
    expect(ok(result)).toBe(false);
    expect(errorsOf(result).some((error) => error.includes("must use '- [ ] TN: ...' or '- [x] TN: ...'"))).toBe(true);
    expect(result.findings.map((finding) => finding.ruleId)).toContain("decomposition.task-id.line-format");
  });

  it("TestValidateLinksEndToEnd.test_build_result_rejects_missing_task_ids", () => {
    writeMinimalPrdSet();
    const backlog = writeMinimalWorkDirectory();
    write(path.join(backlog, "01-foundation.md"), phase("## Stage 1 - Foundation\n### Tasks\n- [ ] Missing task id.\n### Acceptance criteria\n- A.\n### Dependencies\n- None.\n"));
    const result = validateDecompositionOutput(tmpdir);
    expect(ok(result)).toBe(false);
    expect(errorsOf(result).some((error) => error.includes("must use '- [ ] TN: ...' or '- [x] TN: ...'"))).toBe(true);
  });

  it("TestValidateLinksEndToEnd.test_build_result_rejects_acceptance_checkboxes", () => {
    writeMinimalPrdSet();
    const backlog = writeMinimalWorkDirectory();
    write(path.join(backlog, "01-foundation.md"), phase("## Stage 1 - Foundation\n### Tasks\n- [ ] t1: T.\n### Acceptance criteria\n- [ ] A.\n### Dependencies\n- None.\n"));
    const result = validateDecompositionOutput(tmpdir);
    expect(ok(result)).toBe(false);
    expect(errorsOf(result).some((error) => error.includes("must be plain bullets, not checkboxes"))).toBe(true);
    expect(result.findings.map((finding) => finding.ruleId)).toContain("decomposition.acceptance.checkbox");
  });

  it("TestValidateLinksEndToEnd.test_build_result_rejects_upper_case_task_id_in_acceptance", () => {
    writeMinimalPrdSet();
    const backlog = writeMinimalWorkDirectory();
    write(path.join(backlog, "01-foundation.md"), phase("## Stage 1 - Foundation\n### Tasks\n- [ ] T1: T.\n### Acceptance criteria\n- T1: A.\n### Dependencies\n- None.\n"));
    const result = validateDecompositionOutput(tmpdir);
    expect(ok(result)).toBe(false);
    expect(errorsOf(result).some((error) => error.includes("must not use task ids"))).toBe(true);
    expect(result.findings.map((finding) => finding.ruleId)).toContain("decomposition.acceptance.task-id");
  });

  it("TestValidateLinksEndToEnd.test_build_result_rejects_task_id_reset_in_later_stage", () => {
    writeMinimalPrdSet();
    const backlog = writeMinimalWorkDirectory();
    write(
      path.join(backlog, "01-foundation.md"),
      phase(
        "## Stage 1 - Foundation\n### Tasks\n- [ ] t1: First task.\n### Acceptance criteria\n- First acceptance.\n### Dependencies\n- None.\n" +
          "## Stage 2 - Follow-up\n### Tasks\n- [ ] t1: Reset task.\n### Acceptance criteria\n- Second acceptance.\n### Dependencies\n- Stage 1.\n",
      ),
    );
    const result = validateDecompositionOutput(tmpdir);
    expect(ok(result)).toBe(false);
    expect(errorsOf(result).some((error) => error.includes("expected T2 but found T1"))).toBe(true);
    expect(result.findings.map((finding) => finding.ruleId)).toEqual(expect.arrayContaining(["decomposition.task-id.sequence", "decomposition.task-id.duplicate"]));
  });

  it("TestValidateLinksEndToEnd.test_build_result_integration", () => {
    writeMinimalPrdSet();
    write(path.join(prdDir, "AGENTS.md"), "Router.\n");
    write(path.join(workDir, "AGENTS.md"), "Router.\n");
    writePrd(
      "05-salt.md",
      "## Purpose\nSalt.\n## Scope\n`scope/`\n## Component and Capability Map\n`map/`\n## Contracts and Data\n`data/`\n## Integrations\n`int/`\n## Rebuild Notes\n`notes/`\n## Source Anchors\n`src/`\n\n```salt\nsalt['pillar.get'](..., merge=True)\n```\n",
    );
    writeMinimalWorkDirectory();
    const result = validateDecompositionOutput(tmpdir);
    expect(errorsOf(result).filter((error) => error.toLowerCase().includes("link"))).toEqual([]);
    expect(ok(result), errorsOf(result).join("\n")).toBe(true);
  });

  it("TestValidateLinksEndToEnd.test_build_result_accepts_current_archive_namespace", () => {
    writeMinimalPrdSet();
    writeMinimalWorkDirectory();
    write(path.join(tmpdir, ".make-docs/archive/prds/2024-01-01/00-index.md"), "Archived.\n");
    const result = validateDecompositionOutput(tmpdir);
    expect(ok(result), errorsOf(result).join("\n")).toBe(true);
  });

  it("TestValidateLinksEndToEnd.test_build_result_rejects_loose_files_in_current_archive", () => {
    writeMinimalPrdSet();
    writeMinimalWorkDirectory();
    write(path.join(tmpdir, ".make-docs/archive/prds/loose.md"), "Invalid loose PRD archive.\n");
    const result = validateDecompositionOutput(tmpdir);
    expect(ok(result)).toBe(false);
    expect(errorsOf(result).some((error) => error.includes("dated directories only"))).toBe(true);
    expect(result.findings.map((finding) => finding.ruleId)).toContain("decomposition.archive.loose-file");
  });

  it("TestValidateLinksEndToEnd.test_build_result_rejects_legacy_archive_namespace", () => {
    writeMinimalPrdSet();
    writeMinimalWorkDirectory();
    mkdirSync(path.join(prdDir, "archive", "2024-01-01"), { recursive: true });
    const result = validateDecompositionOutput(tmpdir);
    expect(ok(result)).toBe(false);
    expect(errorsOf(result).some((error) => error.includes("legacy archive namespace is no longer supported"))).toBe(true);
    expect(result.findings.map((finding) => finding.ruleId)).toContain("decomposition.prd.legacy-archive");
  });

  it("TestValidateLinksEndToEnd.test_build_result_rejects_legacy_single_file_backlog", () => {
    writeMinimalPrdSet();
    writeWork("2024-01-01-rebuild-backlog.md", "## Purpose\nLegacy.\n## Dependency Order\nOrder.\n## Phases\nP.\n## Acceptance Criteria\nA.\n");
    const result = validateDecompositionOutput(tmpdir);
    expect(ok(result)).toBe(false);
    expect(errorsOf(result).some((error) => error.includes("backlog entries must be directories named YYYY-MM-DD-w{W}-r{R}-<slug>"))).toBe(true);
    expect(result.findings.map((finding) => finding.ruleId)).toContain("decomposition.work.loose-file");
  });

  it("TestValidateLinksEndToEnd.test_build_result_rejects_legacy_backlog_directory_naming", () => {
    writeMinimalPrdSet();
    writeMinimalWorkDirectory("2024-01-01-rebuild-backlog");
    const result = validateDecompositionOutput(tmpdir);
    expect(ok(result)).toBe(false);
    expect(errorsOf(result).some((error) => error.includes("work directories must use YYYY-MM-DD-w{W}-r{R}-<slug> naming"))).toBe(true);
    expect(result.findings.map((finding) => finding.ruleId)).toContain("decomposition.work.folder-name");
  });
});

// ---------------------------------------------------------------------------
// test_check_markdown_style.py: MarkdownStyleTests (11)
// ---------------------------------------------------------------------------

describe("test_check_markdown_style.py MarkdownStyleTests", () => {
  const findingsFor = (text: string): MarkdownStyleFinding[] => scanMarkdownStyle("sample.md", text);
  const rulesFor = (text: string) => findingsFor(text).map((finding) => finding.ruleId);

  it("MarkdownStyleTests.test_flags_block_boundary_violations", () => {
    const findings = findingsFor(
      "# Heading\nParagraph starts too soon.\nNext paragraph line is wrapped.\n- list starts too soon\n```md\ncode starts too soon\n```\n<!-- comment starts too soon -->\n",
    );
    expect(findings.slice(0, 4).map((finding) => finding.ruleId)).toEqual([
      "markdown-style.block-spacing",
      "markdown-style.block-spacing",
      "markdown-style.block-spacing",
      "markdown-style.block-spacing",
    ]);
    expect(findings[0]!.blockType).toBe("heading->paragraph");
    expect(findings.slice(0, 4).every((finding) => finding.fixable)).toBe(true);
  });

  it("MarkdownStyleTests.test_flags_list_followed_by_paragraph_or_heading_without_blank_line", () => {
    expect(rulesFor("- one\n- two\nNext paragraph starts too soon.\n")).toEqual(["markdown-style.block-spacing"]);
    expect(rulesFor("- one\n## Heading starts too soon\n")).toEqual(["markdown-style.block-spacing"]);
  });

  it("MarkdownStyleTests.test_flags_code_fence_followed_by_paragraph_without_blank_line", () => {
    const findings = findingsFor("```md\ncode\n```\nParagraph starts too soon.\n");
    expect(findings.map((finding) => finding.ruleId)).toEqual(["markdown-style.block-spacing"]);
    expect(findings[0]!.blockType).toBe("code-fence->paragraph");
  });

  it("MarkdownStyleTests.test_flags_wrapped_top_level_paragraphs", () => {
    const findings = findingsFor(
      "Stand up the shared substrate every later phase depends on: the\nCargo workspace and per-crate manifests, the pinned Rust toolchain,\nthe typed error model plus event tracing subscriber.\n\n" +
        "Plan source: [Plan Phase 01](../../plans\n/2026-05-01-w1-r0-lemme-cli-v1-baseline\n/01-bootstrap-and-foundation.md).\n",
    );
    expect(findings.map((finding) => finding.ruleId)).toEqual(["markdown-style.paragraph-wrap", "markdown-style.paragraph-wrap"]);
    expect(findings[0]!.startLine).toBe(1);
    expect(findings[0]!.endLine).toBe(3);
    expect(findings.every((finding) => finding.fixable)).toBe(true);
  });

  it("MarkdownStyleTests.test_fix_mode_spaces_blocks_before_unwrapping_paragraphs", () => {
    expect(
      fixMarkdownStyle(
        "# Heading\nA generated paragraph that is long enough to look wrapped in source\nbecause the next line keeps the same sentence going.\n- one\nNext paragraph.\n",
      ),
    ).toBe(
      "# Heading\n\nA generated paragraph that is long enough to look wrapped in source because the next line keeps the same sentence going.\n\n- one\n\nNext paragraph.\n",
    );
  });

  it("MarkdownStyleTests.test_fix_mode_preserves_frontmatter_and_code_fences", () => {
    const text =
      "---\nsummary: This frontmatter line is long enough to look wrapped\nbecause it continues in YAML frontmatter.\n---\n\n" +
      "```md\nThis fenced code line is long enough to look wrapped\nbecause code keeps its exact source layout.\n```\n";
    expect(fixMarkdownStyle(text)).toBe(text);
    expect(findingsFor(text)).toEqual([]);
  });

  it("MarkdownStyleTests.test_fix_mode_preserves_tables_blockquotes_comments_and_lists", () => {
    const text =
      "| Column | Value |\n| --- | --- |\n| Long prose cell that wraps in the source | lower cell |\n\n" +
      "> Quote text that may be manually wrapped\n> with another quote line\n\n" +
      "<!-- comment line that may look wrapped\nbut should remain untouched -->\n\n" +
      "- This unordered list item is long enough to look wrapped\n  because its continuation indentation is semantic.\n" +
      "1. This ordered list item is long enough to look wrapped\n   because its continuation indentation is semantic.\n" +
      "- [ ] This task item is long enough to look wrapped\n  because its continuation indentation is semantic.\n  - This nested item must stay nested.\n";
    expect(fixMarkdownStyle(text)).toBe(text);
  });

  it("MarkdownStyleTests.test_html_comment_bang_close_does_not_hide_following_text", () => {
    expect(rulesFor("<!-- note --!>\nParagraph one.\nParagraph two.\n")).toEqual(["markdown-style.block-spacing", "markdown-style.paragraph-wrap"]);
  });

  it("MarkdownStyleTests.test_reports_but_does_not_fix_wrapped_list_continuation", () => {
    const text = "- This unordered list item is long enough to look wrapped\n  because its continuation indentation is semantic.\n";
    const findings = findingsFor(text);
    expect(findings.map((finding) => finding.ruleId)).toEqual(["markdown-style.list-continuation-wrap"]);
    expect(findings[0]!.fixable).toBe(false);
    expect(fixMarkdownStyle(text)).toBe(text);
  });

  describe("command output", () => {
    let root: string;
    beforeEach(() => {
      root = mkdtempSync(path.join(os.tmpdir(), "w34-p1-markdown-cli-"));
      write(path.join(root, "sample.md"), "# Heading\nParagraph one\nParagraph two\n");
      vi.stubEnv(HARNESS_CALLER_IDENTITY_ENV, "");
    });
    afterEach(() => {
      vi.unstubAllEnvs();
      rmSync(root, { recursive: true, force: true });
      process.exitCode = 0;
    });

    it("MarkdownStyleTests.test_json_output_schema_and_order_are_stable", async () => {
      // The script ran with `--format json <file>`. The command runs with `--json --path <file>`.
      const payload = JSON.parse(
        await captureStdout(() => runProjectCommand(["markdown", "validate", "--path", "sample.md", "--target-root", root, "--json"])),
      ) as MarkdownStyleValidateResult;
      expect(payload.status).toBe("findings");
      expect(payload.findings.map((item) => item.ruleId)).toEqual(["markdown-style.block-spacing", "markdown-style.paragraph-wrap"]);
      // The script's snake_case keys are camelCase, and `rule` is `ruleId`.
      expect(new Set(Object.keys(payload.findings[0]!))).toEqual(
        new Set(["path", "startLine", "endLine", "ruleId", "message", "fixable", "confidence", "blockType", "preview"]),
      );
    });

    it("MarkdownStyleTests.test_text_output_groups_by_file_and_rule", async () => {
      const text = await captureStdout(() => runProjectCommand(["markdown", "validate", "--path", "sample.md", "--target-root", root]));
      expect(text).toContain("\nsample.md\n");
      expect(text).toContain("  markdown-style.block-spacing (");
      expect(text).toContain("  markdown-style.paragraph-wrap (");
      expect(text.indexOf("markdown-style.block-spacing (")).toBeLessThan(text.indexOf("markdown-style.paragraph-wrap ("));
    });
  });
});

// ---------------------------------------------------------------------------
// test_trace_relationships.py: CurrentLayoutTest (1)
// ---------------------------------------------------------------------------

describe("test_trace_relationships.py CurrentLayoutTest", () => {
  it("CurrentLayoutTest.test_history_and_custom_audience_relationships", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "w34-p1-trace-"));
    try {
      const files: Record<string, string> = {
        "docs/plans/2026-09-09-w19-r4-example/00-overview.md": "# Plan\n",
        "docs/assets/maintainer/guide.md": "---\nrelated:\n  - ../../plans/2026-09-09-w19-r4-example/\n---\n",
        "docs/assets/reviewer/custom.md": "---\nrelated:\n  - ../../plans/2026-09-09-w19-r4-example/\n---\n",
        ".make-docs/archive/history/done.md": "---\ncoordinate: W19 R4\n---\nPast work.\n",
        "docs/assets/library/developer/old.md": "Legacy.\n",
        // Input change: guide folders come from the effective Persona set
        // (PRD 39 R-SKILL-CHECK-3), so the custom `reviewer` folder is a
        // configured Persona. The script read every `docs/assets/` folder.
        ".make-docs/config.yaml": "personas:\n  - slug: reviewer\n    label: Reviewer\n    description: Reviews the docs.\n    primitive: user\n",
      };
      for (const [name, text] of Object.entries(files)) write(path.join(root, name), text);
      const artifacts = discoverArtifacts(root);
      expect(artifacts.has(".make-docs/archive/history/done.md")).toBe(true);
      expect(artifacts.has("docs/assets/reviewer/custom.md")).toBe(true);
      expect(artifacts.has("docs/assets/library/developer/old.md")).toBe(false);
      expect(buildRelatedRelationships(artifacts, root)).toBe(2);
      expect(buildHistoryCoordinateRelationships(artifacts, root)).toBeGreaterThan(0);
      expect(resolveLink(root, "docs/plans/2026-09-09-w19-r4-example/00-overview.md", "../../../.make-docs/archive/history/done.md")).toBe(
        ".make-docs/archive/history/done.md",
      );
      expect(resolveLink(root, "docs/assets/maintainer/guide.md", "../../../../outside.md")).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
