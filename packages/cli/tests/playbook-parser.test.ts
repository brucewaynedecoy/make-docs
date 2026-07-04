import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  PLAYBOOK_STEP_STATUSES,
  detectPlaybookFileForm,
  parsePlaybook,
  playbookSlugFromPath,
  type PlaybookDiagnostic,
} from "../src/playbook";

const SUFFIX_PATH = "docs/assets/playbooks/agent/demo.playbook.md";

const FRONTMATTER = `---
kind: playbook
title: "Demo Playbook"
summary: "A demo playbook exercising the parser."
persona: agent
stack: run
status: accepted
schema: make-docs.playbook.v2
workflowSchema: make-docs.workflow.v1
---`;

const DEPENDENCIES_BLOCK = `\`\`\`playbook
dependencies:
  - id: tooling
    kind: cli
    requirement: required
    source: package install
    used_by: [check-tools]
    fallback: stop with install guidance
  - id: conventions
    kind: reference
    requirement: preferred
    source: .make-docs/contracts/system
    used_by: [review-gate]
    fallback: continue with reduced guidance
\`\`\``;

const V1_DEPENDENCY_TABLE = `| ID | Kind | Requirement | Source | Used By | Fallback |
| --- | --- | --- | --- | --- | --- |
| tooling | cli | required | package install | check-tools | stop with install guidance |`;

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
    { heading: "## When To Use", content: "Use in parser tests." },
    { heading: "## Inputs", content: "Repository contracts." },
    { heading: "## Dependencies", content: DEPENDENCIES_BLOCK },
    { heading: "## Workflow", content: WORKFLOW_BLOCK },
    { heading: "## Step Guidance", content: "Follow the steps in order." },
    { heading: "## Gates", content: "The review gate stops unattended runs." },
    { heading: "## Outputs", content: "A run summary." },
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

function parseDocumentAt(source: string, sourcePath = SUFFIX_PATH) {
  return parsePlaybook({ sourcePath, source });
}

function codesOf(diagnostics: PlaybookDiagnostic[]): string[] {
  return diagnostics.map((diagnostic) => diagnostic.code);
}

function errorsOf(diagnostics: PlaybookDiagnostic[]): PlaybookDiagnostic[] {
  return diagnostics.filter((diagnostic) => diagnostic.severity === "error");
}

describe("playbook model shape", () => {
  test("encodes the shared eight-value step status vocabulary once", () => {
    expect(PLAYBOOK_STEP_STATUSES).toEqual([
      "pending",
      "running",
      "blocked",
      "waiting-for-user",
      "completed",
      "failed",
      "skipped",
      "cancelled",
    ]);
  });

  test("parses a conformant playbook into a fully resolved model with zero diagnostics", () => {
    const source = buildDocument();
    const { model, diagnostics } = parseDocumentAt(source);

    expect(diagnostics).toEqual([]);
    expect(model.runnable).toBe(true);

    expect(model.identity.canonicalRef).toBe("agent/demo");
    expect(model.identity.slug).toBe("demo");
    expect(model.identity.fileForm).toBe("playbook-suffix");
    expect(model.identity.sourcePath).toBe(SUFFIX_PATH);
    expect(model.identity.sourceDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(model.identity.schemaVersion).toBe("make-docs.playbook.v2");
    expect(model.identity.workflowSchemaVersion).toBe("make-docs.workflow.v1");
    expect(model.identity.persona).toBe("agent");
    expect(model.identity.directoryPersona).toBe("agent");
    expect(model.identity.stack).toBe("run");
    expect(model.identity.status).toBe("accepted");

    expect([...model.dependencies.byId.keys()]).toEqual(["tooling", "conventions"]);
    const tooling = model.dependencies.byId.get("tooling")!;
    expect(tooling.kind.value).toBe("cli");
    expect(tooling.requirement.value).toBe("required");
    expect(tooling.usedBy.map((entry) => entry.value)).toEqual(["check-tools"]);
    expect(tooling.fallback.value).toBe("stop with install guidance");
    // With no declared `probe`, the resolved probe defaults to the id
    // (PRD 40 R-DEP-2).
    expect(tooling.probe.value).toBe("tooling");
    expect(tooling.probeDeclared).toBe(false);

    const workflow = model.workflow!;
    expect(workflow.header.id?.value).toBe("demo");
    expect(workflow.header.stateModel?.value).toBe("make-docs.workflow-state.v1");
    expect(workflow.header.routing.value).toBe("linear");
    expect(workflow.steps).toHaveLength(3);

    const [checkTools, reviewGate, wrapUp] = workflow.steps;
    expect(checkTools!.mode.value).toBe("deterministic");
    expect(checkTools!.invocations).toHaveLength(1);
    expect(checkTools!.invocations[0]!.form).toBe("operation");
    expect(checkTools!.invocations[0]!.operation?.value).toBe("playbook.catalog");
    expect(checkTools!.routing?.onFailure?.kind).toBe("stop");
    expect(checkTools!.routing?.onFailure?.resolved).toBe(true);
    expect(checkTools!.validation?.expect?.value).toBe("exit-zero");

    // Dependency references are linked registry records, not bare strings.
    expect(checkTools!.requires).toHaveLength(1);
    expect(checkTools!.requires[0]!.registryEntry).toBe(tooling);
    expect(tooling.referencedBy).toEqual(["check-tools"]);

    // Mode defaults to `delegated` when unspecified.
    expect(reviewGate!.mode.value).toBe("delegated");
    expect(reviewGate!.mode.span).toBeNull();
    expect(reviewGate!.gate?.resolvedBy?.value).toBe("user");
    expect(reviewGate!.gate?.evidence?.value).toBe("review-note");
    expect(reviewGate!.gate?.unattended?.value).toBe(false);
    expect(reviewGate!.routing?.onSuccess?.stepId).toBe("wrap-up");
    expect(reviewGate!.routing?.onSuccess?.resolved).toBe(true);

    expect(wrapUp!.invocations[0]!.form).toBe("instructions");
    expect(wrapUp!.invocations[0]!.instructions?.value).toBe("Summarize the run.");

    // Narrative-section presence map covers every narrative section.
    for (const presence of Object.values(model.narrativeSections)) {
      expect(presence.present).toBe(true);
      expect(presence.nonEmpty).toBe(true);
      expect(presence.span).not.toBeNull();
    }
  });

  test("workflow routing defaults to linear when unspecified", () => {
    const source = buildDocument({
      transform: (sections) =>
        sections.map((section) =>
          section.heading === "## Workflow"
            ? { ...section, content: section.content.replace("  routing: linear\n", "") }
            : section,
        ),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    expect(errorsOf(diagnostics)).toEqual([]);
    expect(model.workflow!.header.routing.value).toBe("linear");
    expect(model.workflow!.header.routing.raw).toBeNull();
  });

  test("source spans point at the exact source text", () => {
    const source = buildDocument();
    const { model } = parseDocumentAt(source);
    const tooling = model.dependencies.byId.get("tooling")!;
    const idSpan = tooling.id.span!;
    expect(source.slice(idSpan.start.offset, idSpan.end.offset)).toBe("tooling");
    expect(idSpan.start.line).toBeGreaterThan(1);
    expect(source.split("\n")[idSpan.start.line - 1]).toContain("id: tooling");

    const stepId = model.workflow!.steps[0]!.id!;
    expect(source.slice(stepId.span!.start.offset, stepId.span!.end.offset)).toBe("check-tools");
  });

  test("narrative free text carries no machine meaning", () => {
    const base = parseDocumentAt(buildDocument());
    const altered = parseDocumentAt(
      buildDocument({
        transform: (sections) =>
          sections.map((section) =>
            section.heading === "## Step Guidance"
              ? { ...section, content: "Completely different prose with operation: fake.op inside." }
              : section,
          ),
      }),
    );
    expect(altered.diagnostics).toEqual([]);
    expect(altered.model.identity.sourceDigest).not.toBe(base.model.identity.sourceDigest);
    expect(altered.model.workflow!.steps.map((step) => step.id?.value)).toEqual(
      base.model.workflow!.steps.map((step) => step.id?.value),
    );
    expect([...altered.model.dependencies.byId.keys()]).toEqual([
      ...base.model.dependencies.byId.keys(),
    ]);
  });

  test("explicit frontmatter id overrides the derived canonical ref", () => {
    const source = buildDocument({
      frontmatter: FRONTMATTER.replace("---\nkind:", "---\nid: custom/ref\nkind:"),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    expect(diagnostics).toEqual([]);
    expect(model.identity.canonicalRef).toBe("custom/ref");
  });
});

describe("playbook file detection", () => {
  test("detects the playbook suffix and the deprecated plain form", () => {
    expect(detectPlaybookFileForm("docs/assets/playbooks/agent/x.playbook.md", null)).toBe(
      "playbook-suffix",
    );
    expect(detectPlaybookFileForm("docs/assets/playbooks/agent/x.md", "playbook")).toBe(
      "deprecated-plain",
    );
    expect(detectPlaybookFileForm("docs/assets/playbooks/agent/x.md", "design")).toBe(
      "not-playbook",
    );
    expect(playbookSlugFromPath("docs/assets/playbooks/agent/x.playbook.md")).toBe("x");
    expect(playbookSlugFromPath("docs/assets/playbooks/agent/x.md")).toBe("x");
  });

  test("emits PB-FILE-007 for the deprecated plain form and stays runnable", () => {
    const { model, diagnostics } = parseDocumentAt(
      buildDocument(),
      "docs/assets/playbooks/agent/demo.md",
    );
    expect(codesOf(diagnostics)).toEqual(["PB-FILE-007"]);
    expect(diagnostics[0]!.severity).toBe("warning");
    expect(model.identity.fileForm).toBe("deprecated-plain");
    // A warning is not an error: fail-closed applies to errors only.
    expect(model.runnable).toBe(true);
  });

  test("does not emit PB-FILE-007 for the suffix form", () => {
    const { diagnostics } = parseDocumentAt(buildDocument());
    expect(codesOf(diagnostics)).not.toContain("PB-FILE-007");
  });
});

describe("required heading spine", () => {
  test("a missing required section is a PB-DOC-001 error", () => {
    const source = buildDocument({
      transform: (sections) => sections.filter((section) => section.heading !== "## Validation"),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    const docErrors = diagnostics.filter((diagnostic) => diagnostic.code === "PB-DOC-001");
    expect(docErrors).toHaveLength(1);
    expect(docErrors[0]!.message).toContain("## Validation");
    expect(model.runnable).toBe(false);
    expect(model.narrativeSections.validation.present).toBe(false);
  });

  test("an out-of-order required section is a PB-DOC-001 error", () => {
    const source = buildDocument({
      transform: (sections) => {
        const reordered = [...sections];
        const validation = reordered.splice(8, 1)[0]!;
        reordered.push(validation);
        return reordered;
      },
    });
    const { diagnostics } = parseDocumentAt(source);
    expect(codesOf(diagnostics)).toContain("PB-DOC-001");
    expect(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PB-DOC-001" && diagnostic.message.includes("out of order"),
      ),
    ).toBe(true);
  });

  test("an unknown section before or between required sections is a PB-DOC-001 error", () => {
    const source = buildDocument({
      transform: (sections) => [
        ...sections.slice(0, 2),
        { heading: "## Surprise", content: "Not allowed here." },
        ...sections.slice(2),
      ],
    });
    const { diagnostics } = parseDocumentAt(source);
    const unknown = diagnostics.filter(
      (diagnostic) => diagnostic.code === "PB-DOC-001" && diagnostic.message.includes("Surprise"),
    );
    expect(unknown).toHaveLength(1);
    expect(unknown[0]!.severity).toBe("error");
  });

  test("an unknown section after the required spine is allowed and ignored", () => {
    const source = buildDocument({
      transform: (sections) => [
        ...sections,
        { heading: "## Appendix", content: "Extra notes after the spine." },
      ],
    });
    const { model, diagnostics } = parseDocumentAt(source);
    expect(diagnostics).toEqual([]);
    expect(model.runnable).toBe(true);
  });

  test("a missing title heading is a PB-DOC-001 error", () => {
    const { diagnostics } = parseDocumentAt(buildDocument({ title: null }));
    expect(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PB-DOC-001" && diagnostic.message.includes("# <Title>"),
      ),
    ).toBe(true);
  });
});

describe("frontmatter schema", () => {
  test("missing fields and invalid enums each emit PB-FM-002 in one pass", () => {
    const source = buildDocument({
      frontmatter: `---
kind: playbook
title: "Demo Playbook"
persona: agent
stack: sideways
status: accepted
schema: make-docs.playbook.v2
workflowSchema: make-docs.workflow.v1
---`,
    });
    const { model, diagnostics } = parseDocumentAt(source);
    const frontmatterErrors = diagnostics.filter((diagnostic) => diagnostic.code === "PB-FM-002");
    expect(frontmatterErrors.length).toBe(2);
    expect(frontmatterErrors.map((diagnostic) => diagnostic.location.field).sort()).toEqual([
      "stack",
      "summary",
    ]);
    expect(model.runnable).toBe(false);
    expect(model.identity.stack).toBeNull();
    expect(model.frontmatter.stack.raw).toBe("sideways");
  });

  test("a multi-line summary is a PB-FM-002 error", () => {
    const source = buildDocument({
      frontmatter: FRONTMATTER.replace(
        'summary: "A demo playbook exercising the parser."',
        "summary: |\n  Line one.\n  Line two.",
      ),
    });
    const { diagnostics } = parseDocumentAt(source);
    expect(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PB-FM-002" && diagnostic.location.field === "summary",
      ),
    ).toBe(true);
  });

  test("a wrong kind value is a PB-FM-002 error", () => {
    const source = buildDocument({
      frontmatter: FRONTMATTER.replace("kind: playbook", "kind: design"),
    });
    const { diagnostics } = parseDocumentAt(source);
    expect(
      diagnostics.some(
        (diagnostic) => diagnostic.code === "PB-FM-002" && diagnostic.location.field === "kind",
      ),
    ).toBe(true);
  });

  test("a missing frontmatter block emits PB-FM-008 and parsing continues", () => {
    const { model, diagnostics } = parseDocumentAt(buildDocument({ frontmatter: null }));
    expect(codesOf(diagnostics)).toContain("PB-FM-008");
    // Body parsing continued: the workflow block still produced steps.
    expect(model.workflow?.steps).toHaveLength(3);
    expect(model.runnable).toBe(false);
  });
});

function withDependencies(content: string) {
  return (sections: SectionSpec[]) =>
    sections.map((section) =>
      section.heading === "## Dependencies" ? { ...section, content } : section,
    );
}

describe("dependencies block (PRD 40 R-DEP-1..2)", () => {
  test("a missing dependencies block is a PB-DEP-009 error", () => {
    const source = buildDocument({
      transform: withDependencies("Dependencies are described in prose only."),
    });
    const { diagnostics } = parseDocumentAt(source);
    expect(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PB-DEP-009" &&
          diagnostic.message.includes("fenced `playbook` dependencies block"),
      ),
    ).toBe(true);
  });

  test("unparseable dependencies YAML is a PB-DEP-009 error and parses no entries", () => {
    const source = buildDocument({
      transform: withDependencies("```playbook\ndependencies: [unclosed\n```"),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    expect(codesOf(diagnostics)).toContain("PB-DEP-009");
    expect(model.dependencies.entries).toHaveLength(0);
  });

  test("a non-list dependencies value is a PB-DEP-009 error", () => {
    const source = buildDocument({
      transform: withDependencies("```playbook\ndependencies:\n  tooling: cli\n```"),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    expect(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PB-DEP-009" && diagnostic.message.includes("YAML list"),
      ),
    ).toBe(true);
    expect(model.dependencies.entries).toHaveLength(0);
  });

  test("an entry missing required fields is diagnosed while other entries still parse", () => {
    const source = buildDocument({
      transform: withDependencies(
        DEPENDENCIES_BLOCK.replace(
          "```playbook\ndependencies:",
          "```playbook\ndependencies:\n  - id: broken\n    kind: cli",
        ),
      ),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    const missing = diagnostics.filter(
      (diagnostic) =>
        diagnostic.code === "PB-DEP-009" && diagnostic.message.includes("missing required field"),
    );
    expect(missing.map((diagnostic) => diagnostic.location.field).sort()).toEqual([
      "broken.fallback",
      "broken.requirement",
      "broken.source",
      "broken.used_by",
    ]);
    expect(model.dependencies.entries.map((entry) => entry.id.value)).toEqual([
      "broken",
      "tooling",
      "conventions",
    ]);
  });

  test("an unknown entry field is a PB-DEP-009 error", () => {
    const source = buildDocument({
      transform: withDependencies(
        DEPENDENCIES_BLOCK.replace("    source: package install", "    probes: nope\n    source: package install"),
      ),
    });
    const { diagnostics } = parseDocumentAt(source);
    expect(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PB-DEP-009" &&
          diagnostic.message.includes("unknown field `probes`"),
      ),
    ).toBe(true);
  });

  test("more than one playbook fence in the section is a PB-DEP-009 error", () => {
    const source = buildDocument({
      transform: withDependencies(
        `${DEPENDENCIES_BLOCK}\n\n\`\`\`playbook\ndependencies: []\n\`\`\``,
      ),
    });
    const { diagnostics } = parseDocumentAt(source);
    expect(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PB-DEP-009" && diagnostic.message.includes("exactly one"),
      ),
    ).toBe(true);
  });

  test("unknown kind and requirement tokens are preserved raw for the validator", () => {
    const source = buildDocument({
      transform: withDependencies(`\`\`\`playbook
dependencies:
  - id: tooling
    kind: widget
    requirement: sometimes
    source: somewhere
    used_by: [check-tools]
    fallback: stop
  - id: conventions
    kind: reference
    requirement: preferred
    source: .make-docs
    used_by: [review-gate]
    fallback: continue
\`\`\``),
    });
    const { model } = parseDocumentAt(source);
    const tooling = model.dependencies.byId.get("tooling")!;
    expect(tooling.kind.value).toBeNull();
    expect(tooling.kind.raw).toBe("widget");
    expect(tooling.requirement.value).toBeNull();
    expect(tooling.requirement.raw).toBe("sometimes");
  });

  test("a declared probe is parsed with its span and marks the entry declared", () => {
    const source = buildDocument({
      transform: withDependencies(
        DEPENDENCIES_BLOCK.replace(
          "    source: package install",
          "    probe: tooling-cli\n    source: package install",
        ),
      ),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    expect(diagnostics).toEqual([]);
    const tooling = model.dependencies.byId.get("tooling")!;
    expect(tooling.probe.value).toBe("tooling-cli");
    expect(tooling.probeDeclared).toBe(true);
    expect(source.slice(tooling.probe.span!.start.offset, tooling.probe.span!.end.offset)).toBe(
      "tooling-cli",
    );
    // `source` prose stays pure provenance; the probe never derives from it.
    expect(tooling.source.value).toBe("package install");
  });

  test("probe defaults to the id even when source prose names another binary (F1 regression)", () => {
    // The UAT repro (PRD 40 R-FIX-1): `git` with source prose that does not
    // begin with the binary name must still probe `git`.
    const source = buildDocument({
      transform: (sections) =>
        sections.map((section) => {
          if (section.heading === "## Dependencies") {
            return {
              ...section,
              content: `\`\`\`playbook
dependencies:
  - id: git
    kind: cli
    requirement: required
    source: system install of git
    used_by: [check-tools]
    fallback: stop with install guidance
\`\`\``,
            };
          }
          if (section.heading === "## Workflow") {
            return {
              ...section,
              content: section.content
                .replace("requires: [tooling]", "requires: [git]")
                .replace("uses: [conventions]", ""),
            };
          }
          return section;
        }),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    expect(errorsOf(diagnostics)).toEqual([]);
    const git = model.dependencies.byId.get("git")!;
    expect(git.probe.value).toBe("git");
    expect(git.probeDeclared).toBe(false);
    expect(git.source.value).toBe("system install of git");
  });

  test("used_by is a typed YAML list", () => {
    const source = buildDocument();
    const { model } = parseDocumentAt(source);
    const tooling = model.dependencies.byId.get("tooling")!;
    expect(tooling.usedBy.map((entry) => entry.value)).toEqual(["check-tools"]);
    expect(tooling.usedBy[0]!.span).not.toBeNull();
  });
});

describe("pointed old-form diagnostics (PRD 40 R-MIG-2..3)", () => {
  test("a v1 dependency table is a PB-DEP-025 error naming the dependencies block", () => {
    const source = buildDocument({ transform: withDependencies(V1_DEPENDENCY_TABLE) });
    const { model, diagnostics } = parseDocumentAt(source);
    const pointed = diagnostics.filter((diagnostic) => diagnostic.code === "PB-DEP-025");
    expect(pointed).toHaveLength(1);
    expect(pointed[0]!.message).toContain(
      "replaced by the `dependencies` YAML block in schema v2",
    );
    // The old form never parses to a model, and the missing-block PB-DEP-009
    // is suppressed in favor of the pointed diagnostic.
    expect(model.dependencies.entries).toHaveLength(0);
    expect(codesOf(diagnostics)).not.toContain("PB-DEP-009");
    expect(model.runnable).toBe(false);
  });

  test("each removed v1 frontmatter key is a PB-FM-026 error naming the v2 key", () => {
    const source = buildDocument({
      frontmatter: FRONTMATTER.replace(
        "schema: make-docs.playbook.v2\nworkflowSchema: make-docs.workflow.v1",
        "schemaVersion: make-docs.playbook.v1\nworkflowSchemaVersion: make-docs.workflow.v1",
      ),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    const pointed = diagnostics.filter((diagnostic) => diagnostic.code === "PB-FM-026");
    expect(pointed.map((diagnostic) => diagnostic.location.field).sort()).toEqual([
      "schemaVersion",
      "workflowSchemaVersion",
    ]);
    expect(pointed[0]!.message).toContain("declare `schema` instead");
    expect(pointed[1]!.message).toContain("declare `workflowSchema` instead");
    // The pointed error replaces the generic missing-field PB-FM-002.
    expect(codesOf(diagnostics)).not.toContain("PB-FM-002");
    expect(model.runnable).toBe(false);
  });

  test("a removed v1 key alongside the v2 key still fails pointed", () => {
    const source = buildDocument({
      frontmatter: FRONTMATTER.replace(
        "workflowSchema: make-docs.workflow.v1",
        "workflowSchema: make-docs.workflow.v1\nschemaVersion: make-docs.playbook.v1",
      ),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    expect(codesOf(diagnostics)).toEqual(["PB-FM-026"]);
    // The v2 key still parses; the old key must simply go.
    expect(model.identity.schemaVersion).toBe("make-docs.playbook.v2");
    expect(model.runnable).toBe(false);
  });

  test("every v1 heading spelling is a PB-DOC-027 error naming the v2 heading for its slot", () => {
    const renames: Array<[string, string, string]> = [
      ["## Inputs", "## Inputs And Authority", "## Inputs"],
      ["## Workflow", "## Workflow Contract", "## Workflow"],
      ["## Gates", "## Gates And Decisions", "## Gates"],
      ["## Outputs", "## Outputs And Handoff", "## Outputs"],
    ];
    for (const [v2Heading, v1Heading, replacement] of renames) {
      const source = buildDocument({
        transform: (sections) =>
          sections.map((section) =>
            section.heading === v2Heading ? { ...section, heading: v1Heading } : section,
          ),
      });
      const { model, diagnostics } = parseDocumentAt(source);
      const pointed = diagnostics.filter((diagnostic) => diagnostic.code === "PB-DOC-027");
      expect(pointed, v1Heading).toHaveLength(1);
      expect(pointed[0]!.message).toContain(`\`${v1Heading}\` heading was renamed in schema v2`);
      expect(pointed[0]!.message).toContain(`use \`${replacement}\``);
      expect(model.runnable, v1Heading).toBe(false);
    }
  });

  test("a v1 schema identifier is a PB-FM-028 error naming the v2 identifier", () => {
    const source = buildDocument({
      frontmatter: FRONTMATTER.replace(
        "schema: make-docs.playbook.v2",
        "schema: make-docs.playbook.v1",
      ),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    expect(codesOf(diagnostics)).toEqual(["PB-FM-028"]);
    expect(diagnostics[0]!.message).toContain("reads only `make-docs.playbook.v2`");
    expect(model.runnable).toBe(false);
  });

  test("a workflow-shaped fence under ## Dependencies is a PB-DOC-029 error", () => {
    const source = buildDocument({
      transform: withDependencies("```playbook\nworkflow:\n  id: misplaced\n```"),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    const mismatched = diagnostics.filter((diagnostic) => diagnostic.code === "PB-DOC-029");
    expect(mismatched).toHaveLength(1);
    expect(mismatched[0]!.message).toContain("must declare `dependencies`");
    expect(model.dependencies.entries).toHaveLength(0);
  });

  test("a dependencies-shaped fence under ## Workflow is a PB-DOC-029 error", () => {
    const source = buildDocument({
      transform: (sections) =>
        sections.map((section) =>
          section.heading === "## Workflow"
            ? { ...section, content: "```playbook\ndependencies: []\n```" }
            : section,
        ),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    const mismatched = diagnostics.filter((diagnostic) => diagnostic.code === "PB-DOC-029");
    expect(mismatched).toHaveLength(1);
    expect(mismatched[0]!.message).toContain("belongs inside `## Dependencies`");
    expect(model.workflow).toBeNull();
  });
});

describe("workflow contract block", () => {
  test("a yaml info string does not count: zero playbook blocks is a PB-WF-010 error", () => {
    const source = buildDocument({
      transform: (sections) =>
        sections.map((section) =>
          section.heading === "## Workflow"
            ? { ...section, content: section.content.replace("```playbook", "```yaml") }
            : section,
        ),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    expect(codesOf(diagnostics)).toContain("PB-WF-010");
    expect(model.workflow).toBeNull();
    expect(model.runnable).toBe(false);
  });

  test("more than one playbook block is a PB-WF-010 error", () => {
    const source = buildDocument({
      transform: (sections) =>
        sections.map((section) =>
          section.heading === "## Workflow"
            ? {
                ...section,
                content: `${section.content}\n\n\`\`\`playbook\nworkflow:\n  id: second\nsteps:\n  - id: extra\n\`\`\``,
              }
            : section,
        ),
    });
    const { diagnostics } = parseDocumentAt(source);
    expect(
      diagnostics.some(
        (diagnostic) => diagnostic.code === "PB-WF-010" && diagnostic.message.includes("2"),
      ),
    ).toBe(true);
  });

  test("unparseable workflow YAML is a PB-WF-011 error", () => {
    const source = buildDocument({
      transform: (sections) =>
        sections.map((section) =>
          section.heading === "## Workflow"
            ? { ...section, content: "```playbook\nworkflow: [unclosed\n```" }
            : section,
        ),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    expect(codesOf(diagnostics)).toContain("PB-WF-011");
    expect(model.workflow).toBeNull();
  });

  test("a workflow block without steps is a PB-WF-011 error", () => {
    const source = buildDocument({
      transform: (sections) =>
        sections.map((section) =>
          section.heading === "## Workflow"
            ? { ...section, content: "```playbook\nworkflow:\n  id: demo\n```" }
            : section,
        ),
    });
    const { diagnostics } = parseDocumentAt(source);
    expect(
      diagnostics.some(
        (diagnostic) => diagnostic.code === "PB-WF-011" && diagnostic.location.field === "steps",
      ),
    ).toBe(true);
  });

  test("invalid step dimension tokens are preserved raw for the validator", () => {
    const source = buildDocument({
      transform: (sections) =>
        sections.map((section) =>
          section.heading === "## Workflow"
            ? { ...section, content: section.content.replace("executor: cli", "executor: robot") }
            : section,
        ),
    });
    const { model } = parseDocumentAt(source);
    const step = model.workflow!.steps[0]!;
    expect(step.executor.value).toBeNull();
    expect(step.executor.raw).toBe("robot");
    expect(step.executor.span).not.toBeNull();
  });
});

describe("cross-reference resolution", () => {
  test("an unknown dependency identifier is a PB-DEP-003 error", () => {
    const source = buildDocument({
      transform: (sections) =>
        sections.map((section) =>
          section.heading === "## Workflow"
            ? {
                ...section,
                content: section.content.replace("requires: [tooling]", "requires: [phantom]"),
              }
            : section,
        ),
    });
    const { model, diagnostics } = parseDocumentAt(source);
    const unknown = diagnostics.filter((diagnostic) => diagnostic.code === "PB-DEP-003");
    expect(unknown).toHaveLength(1);
    expect(unknown[0]!.message).toContain("phantom");
    expect(unknown[0]!.location.field).toBe("steps[0].requires");
    expect(unknown[0]!.location.span).not.toBeNull();
    expect(model.workflow!.steps[0]!.requires[0]!.registryEntry).toBeNull();
    expect(model.runnable).toBe(false);
  });

  test("an unresolved routing target is a PB-WF-006 error", () => {
    const source = buildDocument({
      transform: (sections) =>
        sections.map((section) =>
          section.heading === "## Workflow"
            ? {
                ...section,
                content: section.content.replace("on_success: wrap-up", "on_success: nowhere"),
              }
            : section,
        ),
    });
    const { diagnostics } = parseDocumentAt(source);
    const unresolved = diagnostics.filter((diagnostic) => diagnostic.code === "PB-WF-006");
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0]!.message).toContain("nowhere");
  });

  test("multiple independent problems yield multiple diagnostics in one pass", () => {
    const source = buildDocument({
      frontmatter: FRONTMATTER.replace("stack: run", "stack: sideways"),
      transform: (sections) =>
        sections
          .filter((section) => section.heading !== "## Packaging Notes")
          .map((section) =>
            section.heading === "## Workflow"
              ? {
                  ...section,
                  content: section.content.replace("requires: [tooling]", "requires: [phantom]"),
                }
              : section,
          ),
    });
    const { diagnostics } = parseDocumentAt(source);
    const codes = new Set(codesOf(diagnostics));
    expect(codes.has("PB-FM-002")).toBe(true);
    expect(codes.has("PB-DOC-001")).toBe(true);
    expect(codes.has("PB-DEP-003")).toBe(true);
  });
});

describe("canonical worked example", () => {
  const testDir = path.dirname(fileURLToPath(import.meta.url));
  const contractPath = path.resolve(
    testDir,
    "../../..",
    ".make-docs/contracts/system/playbook-contract.md",
  );

  test("parses the contract's worked example with zero errors", () => {
    const contract = readFileSync(contractPath, "utf8");
    const exampleMatch = /`````md\n([\s\S]*?)`````/.exec(contract);
    expect(exampleMatch).not.toBeNull();
    const example = exampleMatch![1]!.trimEnd();
    expect(example).toContain("## Dependencies");
    expect(example).toContain("## Workflow");
    expect(example).toContain("```playbook");
    expect(example).toContain("dependencies:");
    expect(example).toContain("probe: make-docs");

    const source = `---
kind: playbook
title: "Make Docs Lifecycle"
summary: "Canonical worked example from the Playbook contract."
persona: agent
stack: run
status: accepted
schema: make-docs.playbook.v2
workflowSchema: make-docs.workflow.v1
---

# Make Docs Lifecycle

## Purpose

Exercises the contract's canonical worked example.

## When To Use

Whenever the parser must prove R-WF-7 conformance.

## Inputs

The Playbook contract is the authority.

${example}

## Step Guidance

Follow the workflow contract.

## Gates

The review gate requires user resolution.

## Outputs

A validated catalog.

## Validation

Zero parse errors.

## Packaging Notes

None.
`;

    const { model, diagnostics } = parsePlaybook({
      sourcePath: "docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md",
      source,
    });

    expect(errorsOf(diagnostics)).toEqual([]);
    expect(diagnostics).toEqual([]);
    expect(model.runnable).toBe(true);
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
    // The contract example declares the probe explicitly (PRD 40 R-DEP-2):
    // `source` is provenance prose, the probe is the binary checks verify.
    const cli = model.dependencies.byId.get("make-docs-cli")!;
    expect(cli.probe.value).toBe("make-docs");
    expect(cli.probeDeclared).toBe(true);
  });
});
