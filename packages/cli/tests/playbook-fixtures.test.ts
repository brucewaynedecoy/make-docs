/**
 * Fixture-driven Playbook contract coverage (W18 R6 P5, PRD 34 R-TEST-1/2).
 *
 * Exercises the playbook library exclusively through its pure interface
 * (`parseAndValidatePlaybook`): reading the named fixture files under
 * `tests/fixtures/playbooks/` is the only filesystem interaction. Every
 * diagnostic code in the exported catalog has at least one failing fixture
 * that triggers it with its exact code and severity, and a completeness
 * check keeps future codes from shipping uncovered.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  PLAYBOOK_DIAGNOSTIC_CATALOG,
  parseAndValidatePlaybook,
  type PlaybookDiagnostic,
  type PlaybookDiagnosticCode,
} from "../src/playbook";

const FIXTURES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "playbooks",
);

const AGENT_FOLDER = "docs/assets/playbooks/agent";

function loadFixture(relativePath: string): string {
  return readFileSync(path.join(FIXTURES_DIR, relativePath), "utf8");
}

interface FixtureCase {
  /** Fixture file path relative to `tests/fixtures/playbooks/`. */
  file: string;
  /** Virtual source path handed to the pure parser interface. */
  sourcePath?: string;
  /** Codes the fixture may co-emit alongside its target code. */
  allowedCoCodes?: PlaybookDiagnosticCode[];
}

function sourcePathFor(fixture: FixtureCase): string {
  return fixture.sourcePath ?? `${AGENT_FOLDER}/${path.basename(fixture.file)}`;
}

function validateFixture(fixture: FixtureCase) {
  return parseAndValidatePlaybook({
    sourcePath: sourcePathFor(fixture),
    source: loadFixture(fixture.file),
  });
}

function codesOf(diagnostics: PlaybookDiagnostic[]): string[] {
  return diagnostics.map((diagnostic) => diagnostic.code);
}

const VALID_FIXTURES: FixtureCase[] = [
  { file: "valid/demo.playbook.md" },
  { file: "valid/worked-example.playbook.md" },
  { file: "valid/appendix-after-spine.playbook.md" },
];

/**
 * At least one failing fixture per catalog code (R-TEST-1). The Record type
 * is keyed by the full `PlaybookDiagnosticCode` union, so adding a catalog
 * code without a fixture fails compilation as well as the completeness test.
 */
const FAILING_FIXTURES: Record<PlaybookDiagnosticCode, FixtureCase[]> = {
  "PB-DOC-001": [
    { file: "invalid/pb-doc-001-missing-section.playbook.md" },
    { file: "invalid/pb-doc-001-reordered-sections.playbook.md" },
    { file: "invalid/pb-doc-001-unknown-section-interleaved.playbook.md" },
  ],
  "PB-FM-002": [{ file: "invalid/pb-fm-002-missing-and-invalid-fields.playbook.md" }],
  "PB-DEP-003": [
    {
      file: "invalid/pb-dep-003-unknown-dependency.playbook.md",
      // The phantom reference also leaves `tooling` unreferenced.
      allowedCoCodes: ["PB-DEP-004"],
    },
  ],
  "PB-DEP-004": [{ file: "invalid/pb-dep-004-unreferenced-dependency.playbook.md" }],
  "PB-WF-005": [{ file: "invalid/pb-wf-005-deterministic-without-invocation.playbook.md" }],
  "PB-WF-006": [{ file: "invalid/pb-wf-006-unknown-routing-target.playbook.md" }],
  "PB-FILE-007": [
    // A plain `<slug>.md` file with `kind: playbook` (deprecated form).
    { file: "invalid/pb-file-007-legacy-filename.md" },
  ],
  "PB-FM-008": [{ file: "invalid/pb-fm-008-missing-frontmatter.playbook.md" }],
  "PB-DEP-009": [{ file: "invalid/pb-dep-009-wrong-columns.playbook.md" }],
  "PB-WF-010": [
    {
      file: "invalid/pb-wf-010-zero-blocks.playbook.md",
      // With no workflow, every declared dependency is unreferenced.
      allowedCoCodes: ["PB-DEP-004"],
    },
    { file: "invalid/pb-wf-010-two-blocks.playbook.md" },
    {
      file: "invalid/pb-wf-010-yaml-info-string.playbook.md",
      allowedCoCodes: ["PB-DEP-004"],
    },
  ],
  "PB-WF-011": [
    {
      file: "invalid/pb-wf-011-unparseable-workflow.playbook.md",
      allowedCoCodes: ["PB-DEP-004"],
    },
  ],
  "PB-FM-012": [
    {
      // `persona: agent` in frontmatter, validated against the author folder.
      file: "invalid/pb-fm-012-persona-folder-mismatch.playbook.md",
      sourcePath: "docs/assets/playbooks/author/pb-fm-012-persona-folder-mismatch.playbook.md",
    },
  ],
  "PB-DOC-013": [{ file: "invalid/pb-doc-013-empty-narrative-section.playbook.md" }],
  "PB-DEP-014": [{ file: "invalid/pb-dep-014-invalid-kind-and-requirement.playbook.md" }],
  "PB-DEP-015": [{ file: "invalid/pb-dep-015-duplicate-dependency-id.playbook.md" }],
  "PB-WF-016": [{ file: "invalid/pb-wf-016-invalid-workflow-header.playbook.md" }],
  "PB-WF-017": [{ file: "invalid/pb-wf-017-invalid-step-dimension.playbook.md" }],
  "PB-WF-018": [{ file: "invalid/pb-wf-018-missing-step-title.playbook.md" }],
  "PB-WF-019": [{ file: "invalid/pb-wf-019-gate-without-semantics.playbook.md" }],
  "PB-WF-020": [{ file: "invalid/pb-wf-020-multiple-invocation-forms.playbook.md" }],
  "PB-WF-021": [{ file: "invalid/pb-wf-021-duplicate-step-id.playbook.md" }],
  "PB-DEP-022": [{ file: "invalid/pb-dep-022-requires-optional-dependency.playbook.md" }],
  "PB-WF-023": [{ file: "invalid/pb-wf-023-unknown-event.playbook.md" }],
  "PB-WF-024": [{ file: "invalid/pb-wf-024-invalid-orchestration-policy.playbook.md" }],
};

describe("valid fixtures (t1)", () => {
  test.each(VALID_FIXTURES.map((fixture) => [fixture.file, fixture] as const))(
    "%s parses and validates with zero diagnostics",
    (_file, fixture) => {
      const { model, diagnostics } = validateFixture(fixture);
      expect(diagnostics).toEqual([]);
      expect(model.runnable).toBe(true);
      expect(model.identity.fileForm).toBe("playbook-suffix");
    },
  );

  test("the worked-example fixture is the contract Section `Worked Example` equivalent", () => {
    const { model, diagnostics } = validateFixture({
      file: "valid/worked-example.playbook.md",
      sourcePath: `${AGENT_FOLDER}/worked-example.playbook.md`,
    });
    expect(diagnostics).toEqual([]);
    expect(model.workflow!.header.id?.value).toBe("make-docs-lifecycle");
    expect(model.workflow!.steps.map((step) => step.id?.value)).toEqual([
      "validate-catalog",
      "review-gate",
      "enforce-commit-convention",
    ]);
    const eventBound = model.workflow!.steps[2]!;
    expect(eventBound.activation.value).toBe("event-bound");
    expect(eventBound.event?.value).toBe("on-pre-commit");
    expect(eventBound.requires[0]!.registryEntry).toBe(
      model.dependencies.byId.get("make-docs-cli"),
    );
    expect(eventBound.invocations[0]!.operation?.value).toBe("commit.validate-message");
  });
});

describe("every catalog code has a failing fixture (t2)", () => {
  const cases = (Object.entries(FAILING_FIXTURES) as Array<
    [PlaybookDiagnosticCode, FixtureCase[]]
  >).flatMap(([code, fixtures]) => fixtures.map((fixture) => [code, fixture.file, fixture] as const));

  test.each(cases)("%s is triggered by %s with its exact severity", (code, _file, fixture) => {
    const descriptor = PLAYBOOK_DIAGNOSTIC_CATALOG[code];
    const { model, diagnostics } = validateFixture(fixture);

    const matching = diagnostics.filter((diagnostic) => diagnostic.code === code);
    expect(matching.length, `expected ${code}, got [${codesOf(diagnostics).join(", ")}]`)
      .toBeGreaterThanOrEqual(1);
    for (const diagnostic of matching) {
      expect(diagnostic.severity).toBe(descriptor.severity);
      expect(diagnostic.message.length).toBeGreaterThan(0);
      expect(diagnostic.hint.length).toBeGreaterThan(0);
    }

    // The fixture emits nothing beyond its target and declared co-codes.
    const allowed = new Set<string>([code, ...(fixture.allowedCoCodes ?? [])]);
    for (const diagnostic of diagnostics) {
      expect(allowed, `unexpected ${diagnostic.code} from ${fixture.file}`).toContain(
        diagnostic.code,
      );
    }

    // Fail-closed runnability follows the emitted severities exactly.
    const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === "error");
    expect(model.runnable).toBe(!hasErrors);
    if (descriptor.severity === "error") {
      expect(model.runnable).toBe(false);
    }
  });

  test("catalog completeness: every diagnostic code has at least one failing fixture", () => {
    for (const code of Object.keys(PLAYBOOK_DIAGNOSTIC_CATALOG) as PlaybookDiagnosticCode[]) {
      const fixtures = FAILING_FIXTURES[code];
      expect(fixtures, `catalog code ${code} has no failing fixture`).toBeDefined();
      expect(fixtures.length, `catalog code ${code} has no failing fixture`).toBeGreaterThan(0);
    }
    // And no fixture claims a code the catalog does not declare.
    for (const code of Object.keys(FAILING_FIXTURES)) {
      expect(PLAYBOOK_DIAGNOSTIC_CATALOG).toHaveProperty(code);
    }
  });
});

describe("required-heading-order coverage (t3)", () => {
  test("a missing required section names the section", () => {
    const { model, diagnostics } = validateFixture({
      file: "invalid/pb-doc-001-missing-section.playbook.md",
    });
    const missing = diagnostics.filter((diagnostic) => diagnostic.code === "PB-DOC-001");
    expect(missing).toHaveLength(1);
    expect(missing[0]!.message).toContain("## Validation");
    expect(model.narrativeSections.validation.present).toBe(false);
  });

  test("a reordered required section is reported as out of order", () => {
    const { diagnostics } = validateFixture({
      file: "invalid/pb-doc-001-reordered-sections.playbook.md",
    });
    expect(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PB-DOC-001" && diagnostic.message.includes("out of order"),
      ),
    ).toBe(true);
  });

  test("an unknown section interleaved inside the spine is an error", () => {
    const { diagnostics } = validateFixture({
      file: "invalid/pb-doc-001-unknown-section-interleaved.playbook.md",
    });
    const unknown = diagnostics.filter(
      (diagnostic) => diagnostic.code === "PB-DOC-001" && diagnostic.message.includes("Surprise"),
    );
    expect(unknown).toHaveLength(1);
    expect(unknown[0]!.severity).toBe("error");
  });

  test("an unknown section after the required spine is allowed and ignored", () => {
    const { model, diagnostics } = validateFixture({
      file: "valid/appendix-after-spine.playbook.md",
    });
    expect(diagnostics).toEqual([]);
    expect(model.runnable).toBe(true);
  });
});

describe("dependency-table schema coverage (t4)", () => {
  test("wrong columns reject the whole table and parse no entries", () => {
    const { model, diagnostics } = validateFixture({
      file: "invalid/pb-dep-009-wrong-columns.playbook.md",
    });
    expect(codesOf(diagnostics)).toEqual(["PB-DEP-009"]);
    expect(model.dependencies.entries).toHaveLength(0);
  });

  test("invalid kind and requirement enums are diagnosed per cell", () => {
    const { diagnostics } = validateFixture({
      file: "invalid/pb-dep-014-invalid-kind-and-requirement.playbook.md",
    });
    const enumErrors = diagnostics.filter((diagnostic) => diagnostic.code === "PB-DEP-014");
    expect(enumErrors.map((diagnostic) => diagnostic.location.field).sort()).toEqual([
      "tooling.Kind",
      "tooling.Requirement",
    ]);
    expect(enumErrors[0]!.message).toContain("widget");
    expect(enumErrors[1]!.message).toContain("sometimes");
  });

  test("a duplicate dependency ID is diagnosed against the duplicating row", () => {
    const { diagnostics } = validateFixture({
      file: "invalid/pb-dep-015-duplicate-dependency-id.playbook.md",
    });
    const duplicates = diagnostics.filter((diagnostic) => diagnostic.code === "PB-DEP-015");
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]!.message).toContain("tooling");
  });
});

describe("workflow-block coverage (t5)", () => {
  test("zero playbook blocks leaves the model without a workflow", () => {
    const { model, diagnostics } = validateFixture({
      file: "invalid/pb-wf-010-zero-blocks.playbook.md",
    });
    expect(codesOf(diagnostics)).toContain("PB-WF-010");
    expect(model.workflow).toBeNull();
  });

  test("two playbook blocks are rejected", () => {
    const { diagnostics } = validateFixture({
      file: "invalid/pb-wf-010-two-blocks.playbook.md",
    });
    expect(
      diagnostics.some(
        (diagnostic) => diagnostic.code === "PB-WF-010" && diagnostic.message.includes("2"),
      ),
    ).toBe(true);
  });

  test("a yaml info string does not count as the playbook block", () => {
    const { model, diagnostics } = validateFixture({
      file: "invalid/pb-wf-010-yaml-info-string.playbook.md",
    });
    expect(codesOf(diagnostics)).toContain("PB-WF-010");
    expect(model.workflow).toBeNull();
  });

  test("unparseable block content is a PB-WF-011 error", () => {
    const { model, diagnostics } = validateFixture({
      file: "invalid/pb-wf-011-unparseable-workflow.playbook.md",
    });
    expect(codesOf(diagnostics)).toContain("PB-WF-011");
    expect(model.workflow).toBeNull();
  });
});

describe("cross-reference integrity coverage (t6)", () => {
  test("a step reference to an unknown dependency ID is an error", () => {
    const { model, diagnostics } = validateFixture({
      file: "invalid/pb-dep-003-unknown-dependency.playbook.md",
    });
    const unknown = diagnostics.filter((diagnostic) => diagnostic.code === "PB-DEP-003");
    expect(unknown).toHaveLength(1);
    expect(unknown[0]!.message).toContain("phantom");
    expect(model.workflow!.steps[0]!.requires[0]!.registryEntry).toBeNull();
  });

  test("a routing target to an unknown step id is an error", () => {
    const { diagnostics } = validateFixture({
      file: "invalid/pb-wf-006-unknown-routing-target.playbook.md",
    });
    const unresolved = diagnostics.filter((diagnostic) => diagnostic.code === "PB-WF-006");
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0]!.message).toContain("nowhere");
  });

  test("a requires reference targeting an optional dependency is a contradiction", () => {
    const { model, diagnostics } = validateFixture({
      file: "invalid/pb-dep-022-requires-optional-dependency.playbook.md",
    });
    expect(codesOf(diagnostics)).toEqual(["PB-DEP-022"]);
    expect(diagnostics[0]!.message).toContain("conventions");
    expect(model.runnable).toBe(false);
  });

  test("an unreferenced dependency is a warning and the model stays runnable", () => {
    const { model, diagnostics } = validateFixture({
      file: "invalid/pb-dep-004-unreferenced-dependency.playbook.md",
    });
    expect(codesOf(diagnostics)).toEqual(["PB-DEP-004"]);
    expect(diagnostics[0]!.severity).toBe("warning");
    expect(diagnostics[0]!.message).toContain("spare");
    expect(model.runnable).toBe(true);
  });
});

describe("legacy-filename detection (t7)", () => {
  test("a plain <slug>.md with kind: playbook warns and stays runnable", () => {
    const { model, diagnostics } = validateFixture({
      file: "invalid/pb-file-007-legacy-filename.md",
    });
    expect(codesOf(diagnostics)).toEqual(["PB-FILE-007"]);
    expect(diagnostics[0]!.severity).toBe("warning");
    expect(diagnostics[0]!.message).toContain("pb-file-007-legacy-filename.playbook.md");
    expect(model.identity.fileForm).toBe("deprecated-plain");
    expect(model.runnable).toBe(true);
  });
});

describe("fail-soft and fail-closed (t8)", () => {
  test("multiple independent problems yield all their diagnostics in one pass", () => {
    const { model, diagnostics } = validateFixture({ file: "invalid/multi-fault.playbook.md" });
    const codes = new Set(codesOf(diagnostics));
    expect(codes.has("PB-FM-002")).toBe(true); // invalid stack enum
    expect(codes.has("PB-DOC-001")).toBe(true); // missing ## Packaging Notes
    expect(codes.has("PB-DEP-003")).toBe(true); // phantom dependency reference
    expect(model.runnable).toBe(false);
  });

  test("fail-closed: every fixture with at least one error is not runnable", () => {
    for (const fixtures of Object.values(FAILING_FIXTURES)) {
      for (const fixture of fixtures) {
        const { model, diagnostics } = validateFixture(fixture);
        const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === "error");
        expect(model.runnable, fixture.file).toBe(!hasErrors);
      }
    }
  });

  test("warnings alone leave the model runnable", () => {
    for (const file of [
      "invalid/pb-dep-004-unreferenced-dependency.playbook.md",
      "invalid/pb-file-007-legacy-filename.md",
    ]) {
      const { model, diagnostics } = validateFixture({ file });
      expect(diagnostics.length, file).toBeGreaterThan(0);
      expect(diagnostics.every((diagnostic) => diagnostic.severity === "warning"), file).toBe(true);
      expect(model.runnable, file).toBe(true);
    }
  });
});
