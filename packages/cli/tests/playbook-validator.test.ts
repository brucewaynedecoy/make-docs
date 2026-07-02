import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  PLAYBOOK_DIAGNOSTIC_CATALOG,
  PLAYBOOK_KNOWN_EVENTS,
  parseAndValidatePlaybook,
  parsePlaybook,
  validatePlaybook,
  type PlaybookDiagnostic,
  type PlaybookDiagnosticCode,
  type PlaybookDiagnosticSeverity,
} from "../src/playbook";

const SUFFIX_PATH = "docs/assets/playbooks/agent/demo.playbook.md";

const FRONTMATTER = `---
kind: playbook
title: "Demo Playbook"
summary: "A demo playbook exercising the validator."
persona: agent
stack: run
status: accepted
schemaVersion: make-docs.playbook.v1
workflowSchemaVersion: make-docs.workflow.v1
---`;

const DEPENDENCY_TABLE = `| ID | Kind | Requirement | Source | Used By | Fallback |
| --- | --- | --- | --- | --- | --- |
| tooling | cli | required | package install | check-tools | stop with install guidance |
| conventions | reference | preferred | .make-docs/contracts/system | review-gate | continue with reduced guidance |`;

const WORKFLOW_BLOCK = `\`\`\`playbook
workflow:
  id: demo
  state_model: make-docs.workflow-state.v1
  routing: linear
steps:
  - id: check-tools
    title: Check tooling
    executor: cli
    role: check
    activation: sequential
    mode: deterministic
    requires: [tooling]
    operation: playbook.catalog
    validation:
      expect: exit-zero
    routing:
      on_failure: stop
  - id: review-gate
    title: Review before wrap-up
    executor: human
    role: gate
    activation: sequential
    uses: [conventions]
    gate:
      resolved_by: user
      evidence: review-note
      unattended: false
    routing:
      on_success: wrap-up
  - id: wrap-up
    title: Wrap up
    executor: agent
    role: activity
    activation: sequential
    instructions: Summarize the run.
\`\`\``;

interface SectionSpec {
  heading: string;
  content: string;
}

function defaultSections(): SectionSpec[] {
  return [
    { heading: "## Purpose", content: "Explains the demo." },
    { heading: "## When To Use", content: "Use in validator tests." },
    { heading: "## Inputs And Authority", content: "Repository contracts." },
    { heading: "## Dependencies", content: DEPENDENCY_TABLE },
    { heading: "## Workflow Contract", content: WORKFLOW_BLOCK },
    { heading: "## Step Guidance", content: "Follow the steps in order." },
    { heading: "## Gates And Decisions", content: "The review gate stops unattended runs." },
    { heading: "## Outputs And Handoff", content: "A run summary." },
    { heading: "## Validation", content: "The catalog check must exit zero." },
    { heading: "## Packaging Notes", content: "No packaging hints." },
  ];
}

function buildDocument(
  options: {
    frontmatter?: string | null;
    title?: string | null;
    transform?: (sections: SectionSpec[]) => SectionSpec[];
  } = {},
): string {
  const frontmatter = options.frontmatter === undefined ? FRONTMATTER : options.frontmatter;
  const title = options.title === undefined ? "# Demo Playbook" : options.title;
  const sections = (options.transform ?? ((value) => value))(defaultSections());
  const parts: string[] = [];
  if (frontmatter) {
    parts.push(frontmatter);
  }
  if (title) {
    parts.push(title);
  }
  for (const section of sections) {
    parts.push(`${section.heading}\n\n${section.content}`);
  }
  return `${parts.join("\n\n")}\n`;
}

function replaceWorkflow(replacer: (content: string) => string) {
  return (sections: SectionSpec[]): SectionSpec[] =>
    sections.map((section) =>
      section.heading === "## Workflow Contract"
        ? { ...section, content: replacer(section.content) }
        : section,
    );
}

function replaceDependencies(content: string) {
  return (sections: SectionSpec[]): SectionSpec[] =>
    sections.map((section) =>
      section.heading === "## Dependencies" ? { ...section, content } : section,
    );
}

function validateDocumentAt(source: string, sourcePath = SUFFIX_PATH) {
  return parseAndValidatePlaybook({ sourcePath, source });
}

function codesOf(diagnostics: PlaybookDiagnostic[]): string[] {
  return diagnostics.map((diagnostic) => diagnostic.code);
}

function onlyDiagnostic(
  diagnostics: PlaybookDiagnostic[],
  code: PlaybookDiagnosticCode,
): PlaybookDiagnostic {
  const matching = diagnostics.filter((diagnostic) => diagnostic.code === code);
  expect(matching, `expected exactly one ${code}, got ${codesOf(diagnostics).join(", ")}`)
    .toHaveLength(1);
  return matching[0]!;
}

/**
 * Asserts the full five-element diagnostic record (R-MODEL-5): stable code,
 * severity, precise location naming section and source span (and field where
 * stated), a message, and an expected-shape or fix hint.
 */
function expectFullRecord(
  diagnostic: PlaybookDiagnostic,
  code: PlaybookDiagnosticCode,
  severity: PlaybookDiagnosticSeverity,
  options: { field?: string } = {},
): void {
  expect(diagnostic.code).toBe(code);
  expect(diagnostic.severity).toBe(severity);
  expect(diagnostic.message.length).toBeGreaterThan(0);
  expect(diagnostic.hint.length).toBeGreaterThan(0);
  expect(diagnostic.location.section).toBeTruthy();
  expect(diagnostic.location.span).not.toBeNull();
  if (options.field !== undefined) {
    expect(diagnostic.location.field).toBe(options.field);
  }
}

describe("validator entry points", () => {
  test("a conformant playbook validates with zero diagnostics and stays runnable", () => {
    const { model, diagnostics } = validateDocumentAt(buildDocument());
    expect(diagnostics).toEqual([]);
    expect(model.runnable).toBe(true);
  });

  test("validatePlaybook returns only validation-layer diagnostics over a parsed model", () => {
    const parsed = parsePlaybook({
      sourcePath: SUFFIX_PATH,
      source: buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace("    operation: playbook.catalog\n", ""),
        ),
      }),
    });
    expect(parsed.diagnostics).toEqual([]);
    const validation = validatePlaybook(parsed.model);
    expect(codesOf(validation)).toEqual(["PB-WF-005"]);
  });

  test("parseAndValidatePlaybook re-derives runnable over the combined diagnostics", () => {
    // Parses clean; only the consistency layer objects (requires -> optional).
    const source = buildDocument({
      transform: (sections) =>
        replaceWorkflow((content) =>
          content.replace("uses: [conventions]", "requires: [conventions]"),
        )(
          replaceDependencies(
            DEPENDENCY_TABLE.replace("| conventions | reference | preferred |", "| conventions | reference | optional |"),
          )(sections),
        ),
    });
    const parsed = parsePlaybook({ sourcePath: SUFFIX_PATH, source });
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.model.runnable).toBe(true);

    const { model, diagnostics } = validateDocumentAt(source);
    expect(codesOf(diagnostics)).toEqual(["PB-DEP-022"]);
    expect(model.runnable).toBe(false);
  });

  test("a lone warning leaves the model runnable: fail-closed applies to errors only", () => {
    const source = buildDocument({
      transform: replaceDependencies(
        `${DEPENDENCY_TABLE}\n| spare | cli | optional | package install | nobody | continue |`,
      ),
    });
    const { model, diagnostics } = validateDocumentAt(source);
    expect(codesOf(diagnostics)).toEqual(["PB-DEP-004"]);
    expect(diagnostics[0]!.severity).toBe("warning");
    expect(model.runnable).toBe(true);
  });
});

describe("the seven contract catalog codes (R-MODEL-5)", () => {
  test("the catalog fixes the seven contract codes with their contract severities", () => {
    const contractTable: Array<[PlaybookDiagnosticCode, PlaybookDiagnosticSeverity]> = [
      ["PB-DOC-001", "error"],
      ["PB-FM-002", "error"],
      ["PB-DEP-003", "error"],
      ["PB-DEP-004", "warning"],
      ["PB-WF-005", "error"],
      ["PB-WF-006", "error"],
      ["PB-FILE-007", "warning"],
    ];
    for (const [code, severity] of contractTable) {
      expect(PLAYBOOK_DIAGNOSTIC_CATALOG[code].severity).toBe(severity);
      expect(PLAYBOOK_DIAGNOSTIC_CATALOG[code].meaning.length).toBeGreaterThan(0);
      expect(PLAYBOOK_DIAGNOSTIC_CATALOG[code].hint.length).toBeGreaterThan(0);
    }
  });

  test("PB-DOC-001 (error): a required section is missing", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: (sections) => sections.filter((section) => section.heading !== "## Validation"),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-DOC-001");
    expectFullRecord(diagnostic, "PB-DOC-001", "error");
    expect(diagnostic.message).toContain("## Validation");
  });

  test("PB-FM-002 (error): a frontmatter field has an invalid enum value", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({ frontmatter: FRONTMATTER.replace("stack: run", "stack: sideways") }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-FM-002");
    expectFullRecord(diagnostic, "PB-FM-002", "error", { field: "stack" });
  });

  test("PB-DEP-003 (error): a step references an unknown dependency identifier", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace("requires: [tooling]", "requires: [phantom]"),
        ),
      }),
    );
    // The phantom reference also leaves `tooling` unreferenced (PB-DEP-004);
    // both layers report independently.
    const diagnostic = onlyDiagnostic(
      diagnostics.filter((entry) => entry.severity === "error"),
      "PB-DEP-003",
    );
    expectFullRecord(diagnostic, "PB-DEP-003", "error", { field: "steps[0].requires" });
    expect(diagnostic.message).toContain("phantom");
  });

  test("PB-DEP-004 (warning): a declared dependency is never referenced", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceDependencies(
          `${DEPENDENCY_TABLE}\n| spare | cli | optional | package install | nobody | continue |`,
        ),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-DEP-004");
    expectFullRecord(diagnostic, "PB-DEP-004", "warning", { field: "spare.ID" });
    expect(diagnostic.message).toContain("spare");
    expect(diagnostic.location.section).toBe("## Dependencies");
  });

  test("PB-WF-005 (error): a deterministic step declares neither an operation nor a command", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace("    operation: playbook.catalog\n", ""),
        ),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-WF-005");
    expectFullRecord(diagnostic, "PB-WF-005", "error", { field: "steps[0]" });
    expect(diagnostic.message).toContain("check-tools");
  });

  test("PB-WF-006 (error): a routing target is not a defined step identifier", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace("on_success: wrap-up", "on_success: nowhere"),
        ),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-WF-006");
    expectFullRecord(diagnostic, "PB-WF-006", "error", { field: "steps[1].routing.on_success" });
    expect(diagnostic.message).toContain("nowhere");
  });

  test("PB-FILE-007 (warning): a legacy filename should be renamed", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument(),
      "docs/assets/playbooks/agent/demo.md",
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-FILE-007");
    expectFullRecord(diagnostic, "PB-FILE-007", "warning");
    expect(diagnostic.message).toContain("demo.playbook.md");
  });
});

describe("structural layer", () => {
  test("PB-FM-012: frontmatter persona must match the containing folder", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument(),
      "docs/assets/playbooks/author/demo.playbook.md",
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-FM-012");
    expectFullRecord(diagnostic, "PB-FM-012", "error", { field: "persona" });
    expect(diagnostic.message).toContain("agent");
    expect(diagnostic.message).toContain("author");
  });

  test("PB-DOC-013: a present but empty narrative section is an error", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: (sections) =>
          sections.map((section) =>
            section.heading === "## Purpose" ? { ...section, content: "" } : section,
          ),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-DOC-013");
    expectFullRecord(diagnostic, "PB-DOC-013", "error");
    expect(diagnostic.location.section).toBe("## Purpose");
  });
});

describe("registry layer", () => {
  test("PB-DEP-014: kind and requirement values outside the enums are errors", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceDependencies(
          `| ID | Kind | Requirement | Source | Used By | Fallback |
| --- | --- | --- | --- | --- | --- |
| tooling | widget | sometimes | somewhere | check-tools | stop |
| conventions | reference | preferred | .make-docs | review-gate | continue |`,
        ),
      }),
    );
    const enumErrors = diagnostics.filter((diagnostic) => diagnostic.code === "PB-DEP-014");
    expect(enumErrors).toHaveLength(2);
    expectFullRecord(enumErrors[0]!, "PB-DEP-014", "error", { field: "tooling.Kind" });
    expectFullRecord(enumErrors[1]!, "PB-DEP-014", "error", { field: "tooling.Requirement" });
    expect(enumErrors[0]!.message).toContain("widget");
    expect(enumErrors[1]!.message).toContain("sometimes");
  });

  test("the optional asset kind is accepted", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceDependencies(
          DEPENDENCY_TABLE.replace("| conventions | reference |", "| conventions | asset |"),
        ),
      }),
    );
    expect(diagnostics).toEqual([]);
  });

  test("PB-DEP-015: a duplicate dependency ID is an error", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceDependencies(
          `${DEPENDENCY_TABLE}\n| tooling | cli | required | elsewhere | check-tools | stop |`,
        ),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-DEP-015");
    expectFullRecord(diagnostic, "PB-DEP-015", "error", { field: "tooling.ID" });
    expect(diagnostic.message).toContain("more than once");
  });

  test("PB-DEP-015: an empty dependency ID is an error", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceDependencies(
          `${DEPENDENCY_TABLE}\n|  | cli | optional | somewhere | nobody | continue |`,
        ),
      }),
    );
    expect(codesOf(diagnostics)).toContain("PB-DEP-015");
  });
});

describe("workflow layer", () => {
  test("PB-WF-016: a workflow header missing state_model or with invalid routing is an error", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content
            .replace("  state_model: make-docs.workflow-state.v1\n", "")
            .replace("routing: linear", "routing: circular"),
        ),
      }),
    );
    const headerErrors = diagnostics.filter((diagnostic) => diagnostic.code === "PB-WF-016");
    expect(headerErrors).toHaveLength(2);
    expectFullRecord(headerErrors[0]!, "PB-WF-016", "error", { field: "workflow.state_model" });
    expectFullRecord(headerErrors[1]!, "PB-WF-016", "error", { field: "workflow.routing" });
    expect(headerErrors[1]!.message).toContain("circular");
  });

  test("PB-WF-017: a step dimension outside its fixed set is an error", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) => content.replace("executor: cli", "executor: robot")),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-WF-017");
    expectFullRecord(diagnostic, "PB-WF-017", "error", { field: "steps[0].executor" });
    expect(diagnostic.message).toContain("robot");
  });

  test("PB-WF-017: a missing step dimension is an error", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace("    activation: sequential\n    mode: deterministic\n", "    mode: deterministic\n"),
        ),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-WF-017");
    expectFullRecord(diagnostic, "PB-WF-017", "error", { field: "steps[0].activation" });
    expect(diagnostic.message).toContain("missing");
  });

  test("PB-WF-018: a step without id or title is an error", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content
            .replace("  - id: wrap-up\n    title: Wrap up\n", "  - role_note: anonymous\n")
            .replace("on_success: wrap-up\n", "on_success: check-tools\n"),
        ),
      }),
    );
    const missing = diagnostics.filter((diagnostic) => diagnostic.code === "PB-WF-018");
    expect(missing.map((diagnostic) => diagnostic.location.field).sort()).toEqual([
      "steps[2].id",
      "steps[2].title",
    ]);
    expectFullRecord(missing[0]!, "PB-WF-018", "error");
  });

  test("PB-WF-018: an event-bound step must declare an event", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace(
            "  - id: wrap-up\n    title: Wrap up\n    executor: agent\n    role: activity\n    activation: sequential\n",
            "  - id: wrap-up\n    title: Wrap up\n    executor: agent\n    role: activity\n    activation: event-bound\n",
          ),
        ),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-WF-018");
    expectFullRecord(diagnostic, "PB-WF-018", "error", { field: "steps[2].event" });
  });

  test("PB-WF-019: a gate step must declare full gate semantics", () => {
    const noGate = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace(
            "    gate:\n      resolved_by: user\n      evidence: review-note\n      unattended: false\n",
            "",
          ),
        ),
      }),
    );
    const diagnostic = onlyDiagnostic(noGate.diagnostics, "PB-WF-019");
    expectFullRecord(diagnostic, "PB-WF-019", "error", { field: "steps[1].gate" });

    const partialGate = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace("      unattended: false\n", ""),
        ),
      }),
    );
    const partial = onlyDiagnostic(partialGate.diagnostics, "PB-WF-019");
    expectFullRecord(partial, "PB-WF-019", "error", { field: "steps[1].gate.unattended" });
  });

  test("PB-WF-020: more than one invocation form is an error", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace(
            "    instructions: Summarize the run.",
            "    instructions: Summarize the run.\n    operation: work.summarize",
          ),
        ),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-WF-020");
    expectFullRecord(diagnostic, "PB-WF-020", "error", { field: "steps[2]" });
    expect(diagnostic.message).toContain("operation");
    expect(diagnostic.message).toContain("instructions");
  });

  test("PB-WF-020: a command without run is a malformed invocation", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace(
            "    operation: playbook.catalog",
            "    command:\n      shell: bash",
          ),
        ),
      }),
    );
    const codes = codesOf(diagnostics);
    expect(codes).toContain("PB-WF-020");
    // The malformed command still counts as the declared invocation form, so
    // the deterministic-step rule does not double-fire.
    expect(codes).not.toContain("PB-WF-005");
  });
});

describe("orchestration policy shape (R-WF-8)", () => {
  test("a well-shaped policy validates cleanly and is never semantically evaluated", () => {
    const { model, diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace(
            "  routing: linear\n",
            "  routing: linear\n  requires_capabilities: [hooks]\n  prefers_capabilities: [slash-commands]\n  child_playbooks: none\n  concurrency: serial\n",
          ),
        ),
      }),
    );
    expect(diagnostics).toEqual([]);
    const policy = model.workflow!.header.policy!;
    expect(policy.requiresCapabilities.map((entry) => entry.value)).toEqual(["hooks"]);
    expect(policy.childPlaybooks?.value).toBe("none");
    expect(policy.concurrency?.value).toBe("serial");
  });

  test("PB-WF-024: policy enum values outside their sets are shape errors", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace(
            "  routing: linear\n",
            "  routing: linear\n  child_playbooks: sometimes\n  concurrency: eventually\n",
          ),
        ),
      }),
    );
    const shapeErrors = diagnostics.filter((diagnostic) => diagnostic.code === "PB-WF-024");
    expect(shapeErrors).toHaveLength(2);
    expectFullRecord(shapeErrors[0]!, "PB-WF-024", "error", { field: "workflow.child_playbooks" });
    expectFullRecord(shapeErrors[1]!, "PB-WF-024", "error", { field: "workflow.concurrency" });
  });

  test("PB-WF-024: a capability list that is not a list of strings is a shape error", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace(
            "  routing: linear\n",
            "  routing: linear\n  requires_capabilities:\n    hooks: true\n",
          ),
        ),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-WF-024");
    expectFullRecord(diagnostic, "PB-WF-024", "error", {
      field: "workflow.requires_capabilities",
    });
  });
});

describe("cross-reference integrity layer", () => {
  test("PB-WF-021: a duplicate step id is an error", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace("  - id: wrap-up\n", "  - id: check-tools\n"),
        ),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-WF-021");
    expectFullRecord(diagnostic, "PB-WF-021", "error", { field: "steps[2].id" });
    expect(diagnostic.message).toContain("check-tools");
  });
});

describe("consistency layer", () => {
  test("PB-DEP-022: requires may not target an optional dependency", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: (sections) =>
          replaceWorkflow((content) =>
            content.replace("uses: [conventions]", "requires: [conventions]"),
          )(
            replaceDependencies(
              DEPENDENCY_TABLE.replace(
                "| conventions | reference | preferred |",
                "| conventions | reference | optional |",
              ),
            )(sections),
          ),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-DEP-022");
    expectFullRecord(diagnostic, "PB-DEP-022", "error", { field: "steps[1].requires" });
    expect(diagnostic.message).toContain("conventions");
  });

  test("PB-WF-023: event names come from the known event set", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: replaceWorkflow((content) =>
          content.replace(
            "    activation: sequential\n    mode: deterministic\n",
            "    activation: event-bound\n    event: on-flying-pigs\n    mode: deterministic\n",
          ),
        ),
      }),
    );
    const diagnostic = onlyDiagnostic(diagnostics, "PB-WF-023");
    expectFullRecord(diagnostic, "PB-WF-023", "error", { field: "steps[0].event" });
    expect(diagnostic.message).toContain("on-flying-pigs");
  });

  test("known events validate cleanly", () => {
    for (const event of ["on-session-start", "on-pre-commit"]) {
      expect(PLAYBOOK_KNOWN_EVENTS).toContain(event);
      const { diagnostics } = validateDocumentAt(
        buildDocument({
          transform: replaceWorkflow((content) =>
            content.replace(
              "    activation: sequential\n    mode: deterministic\n",
              `    activation: event-bound\n    event: ${event}\n    mode: deterministic\n`,
            ),
          ),
        }),
      );
      expect(diagnostics).toEqual([]);
    }
  });
});

describe("layer independence", () => {
  test("a registry error does not suppress structural, workflow, or consistency diagnostics", () => {
    const { diagnostics } = validateDocumentAt(
      buildDocument({
        transform: (sections) =>
          replaceWorkflow((content) =>
            content.replace("    operation: playbook.catalog\n", ""),
          )(
            replaceDependencies(
              DEPENDENCY_TABLE.replace("| tooling | cli |", "| tooling | widget |"),
            )(
              sections.map((section) =>
                section.heading === "## Purpose" ? { ...section, content: "" } : section,
              ),
            ),
          ),
      }),
    );
    const codes = new Set(codesOf(diagnostics));
    expect(codes.has("PB-DEP-014")).toBe(true); // registry
    expect(codes.has("PB-DOC-013")).toBe(true); // structural
    expect(codes.has("PB-WF-005")).toBe(true); // workflow
  });
});

describe("canonical worked example (R-AUTH-3 parity)", () => {
  const testDir = path.dirname(fileURLToPath(import.meta.url));
  const contractPath = path.resolve(
    testDir,
    "../../..",
    ".make-docs/contracts/system/playbook-contract.md",
  );
  const upstreamContractPath = path.resolve(
    testDir,
    "../../..",
    "packages/docs/template/.make-docs/contracts/system/playbook-contract.md",
  );

  test("validates the contract's worked example with zero errors and zero warnings", () => {
    const contract = readFileSync(contractPath, "utf8");
    const exampleMatch = /`````md\n([\s\S]*?)`````/.exec(contract);
    expect(exampleMatch).not.toBeNull();
    const example = exampleMatch![1]!.trimEnd();

    const source = `---
kind: playbook
title: "Make Docs Lifecycle"
summary: "Canonical worked example from the Playbook contract."
persona: agent
stack: run
status: accepted
schemaVersion: make-docs.playbook.v1
workflowSchemaVersion: make-docs.workflow.v1
---

# Make Docs Lifecycle

## Purpose

Exercises the contract's canonical worked example.

## When To Use

Whenever the validator must prove contract parity.

## Inputs And Authority

The Playbook contract is the authority.

${example}

## Step Guidance

Follow the workflow contract.

## Gates And Decisions

The review gate requires user resolution.

## Outputs And Handoff

A validated catalog.

## Validation

Zero validation errors.

## Packaging Notes

None.
`;

    const { model, diagnostics } = parseAndValidatePlaybook({
      sourcePath: "docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md",
      source,
    });

    expect(diagnostics).toEqual([]);
    expect(model.runnable).toBe(true);
  });

  test("every contract diagnostic-table code is in the exported catalog with the contract severity", () => {
    // Both copies of the contract are machine-checked: the upstream template
    // source of truth and the dogfood instance copy (R-AUTH-1, R-AUTH-3).
    for (const authorityPath of [upstreamContractPath, contractPath]) {
      const contract = readFileSync(authorityPath, "utf8");
      const rows = [...contract.matchAll(/\|\s*(PB-[A-Z]+-\d{3})\s*\|\s*(error|warning)\s*\|/g)];
      expect(rows.length, authorityPath).toBeGreaterThanOrEqual(7);
      for (const [, code, severity] of rows) {
        const descriptor =
          PLAYBOOK_DIAGNOSTIC_CATALOG[code as PlaybookDiagnosticCode];
        expect(descriptor, `catalog is missing ${code}`).toBeDefined();
        expect(descriptor.severity).toBe(severity);
      }
    }
  });

  test("the dogfood contract copy is byte-identical to the upstream template authority", () => {
    expect(readFileSync(contractPath, "utf8")).toBe(readFileSync(upstreamContractPath, "utf8"));
  });
});
