import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { validateDesignBody } from "../src/design-body";
import {
  parseDocumentMetadata,
  validateGeneratedDocumentMetadata,
} from "../src/document-metadata";
import {
  parseManagedBlock,
  renderManagedBlock,
  upsertManagedBlock,
} from "../src/managed-block";
import { TEMPLATE_ROOT } from "../src/utils";

const FIXTURE_ROOT = fileURLToPath(
  new URL("./fixtures/human-experience-propagation/", import.meta.url),
);
const CONTRACT_URI =
  "make-docs://system/contract/human-experience-contract.md";
const REFERENCE_URI =
  "make-docs://system/reference/human-experience.md";

const REFERENCE_POINTER_SURFACES = [
  ".make-docs/system/references/lifecycle.md",
  ".make-docs/system/references/planning-workflow.md",
  ".make-docs/system/references/execution-workflow.md",
  ".make-docs/system/references/prd-change-management.md",
] as const;

const TEMPLATE_POINTER_SURFACES = [
  ".make-docs/system/templates/plan-overview.md",
  ".make-docs/system/templates/plan-prd.md",
  ".make-docs/system/templates/plan-prd-change.md",
  ".make-docs/system/templates/prd-subsystem.md",
  ".make-docs/system/templates/work-index.md",
  ".make-docs/system/templates/work-phase.md",
] as const;

const ROUTED_POINTER_SURFACES = [
  ".make-docs/system/prompts/designs-to-plan.prompt.md",
  ".make-docs/system/prompts/designs-to-plan-change.prompt.md",
  ".make-docs/system/prompts/plan-to-prd-green-field.prompt.md",
  ".make-docs/system/prompts/plan-to-prd-change.prompt.md",
  ".make-docs/system/prompts/prd-to-work-full-prd.prompt.md",
  ".make-docs/system/prompts/prd-to-work-prd-feature.prompt.md",
  ".make-docs/system/prompts/prd-change-to-work.prompt.md",
  "docs/designs/AGENTS.md",
  "docs/plans/AGENTS.md",
  "docs/prd/AGENTS.md",
  "docs/work/AGENTS.md",
] as const;

const PROPAGATION_ARTIFACTS = [
  "design.md",
  "plan.md",
  "prd.md",
  "work.md",
  "evidence.md",
] as const;

type PropagationArtifact = (typeof PROPAGATION_ARTIFACTS)[number];
type FixtureDocuments = Record<PropagationArtifact, string>;

const TESTING_TYPES = [
  "Automated Implementation Testing",
  "Performance Testing",
  "Guided Progress Review",
  "Unassisted Goal Testing",
] as const;

const TESTING_RECORD_FIELDS = [
  "Testing type",
  "Decision informed",
  "Reason now",
  "Product maturity",
  "Scope",
  "Executor",
  "Gate effect",
  "Effort budget",
  "Stop condition",
  "Evidence retained",
  "Rerun trigger",
] as const;

const WORK_FIXTURE_DECISIONS = [
  [
    "direct",
    ["not-needed-now", "not-needed-now", "selected", "not-needed-now"],
    "Testing decision executed",
    "Guided Progress Review",
    "met",
  ],
  [
    "indirect",
    ["not-needed-now", "selected", "not-needed-now", "not-needed-now"],
    "Testing decision executed",
    "Performance Testing",
    "met",
  ],
  [
    "none",
    ["selected", "selected", "not-needed-now", "not-needed-now"],
    "Testing decisions executed",
    "Automated Implementation Testing; Performance Testing",
    "met",
  ],
  [
    "deferred",
    ["not-needed-now", "not-needed-now", "selected", "not-needed-now"],
    "Testing decision executed",
    "Guided Progress Review",
    "partial",
  ],
  [
    "lost-intent",
    ["selected", "not-needed-now", "not-needed-now", "not-needed-now"],
    "Testing decision executed",
    "Automated Implementation Testing",
    "not-reviewed",
  ],
] as const;

const TRACE_FIXTURES = [
  ["direct", [...PROPAGATION_ARTIFACTS]],
  ["indirect", [...PROPAGATION_ARTIFACTS]],
  ["none", ["design.md", "plan.md", "work.md", "evidence.md"]],
  ["deferred", [...PROPAGATION_ARTIFACTS, "obligation.md"]],
  ["lost-intent", [...PROPAGATION_ARTIFACTS]],
] as const;

function fixture(caseName: string, fileName: string): string {
  return readFileSync(path.join(FIXTURE_ROOT, caseName, fileName), "utf8");
}

function propagationFixture(caseName: string): FixtureDocuments {
  return Object.fromEntries(
    PROPAGATION_ARTIFACTS.map((fileName) => [
      fileName,
      fixture(caseName, fileName),
    ]),
  ) as FixtureDocuments;
}

function bodyValue(markdown: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = markdown.match(new RegExp(`^${escaped}:\\s*(.+)$`, "mu"));
  return match?.[1]?.trim().replace(/^`|`$/gu, "") ?? null;
}

function promiseId(markdown: string): string | null {
  return markdown.match(/\[(HX-[A-Z]+-\d+)\]/u)?.[1] ?? null;
}

function propagationReview(
  documents: FixtureDocuments,
  expectedConclusion = "met",
): string[] {
  const findings: string[] = [];
  const expectedGoal = bodyValue(documents["design.md"], "Human goal or effect");
  const expectedPromise = promiseId(documents["design.md"]);
  const expectedRequirement = bodyValue(
    documents["plan.md"],
    "Owning requirement",
  );

  if (!expectedGoal || !expectedPromise || !expectedRequirement) {
    return ["fixture-authority-missing"];
  }

  const goalFields = [
    ["plan.md", "Mapped human goal"],
    ["work.md", "Intended human outcome"],
    ["evidence.md", "Reviewed human goal"],
  ] as const;
  for (const [fileName, label] of goalFields) {
    if (bodyValue(documents[fileName], label) !== expectedGoal) {
      findings.push(`human-goal-lost:${fileName}`);
    }
  }

  for (const fileName of PROPAGATION_ARTIFACTS.slice(1)) {
    if (!documents[fileName].includes(expectedPromise)) {
      findings.push(`promise-lineage-lost:${fileName}`);
    }
  }

  if (!documents["prd.md"].includes(`### ${expectedRequirement}`)) {
    findings.push("owning-requirement-lost:prd.md");
  }
  if (!documents["work.md"].includes(expectedRequirement)) {
    findings.push("owning-requirement-lost:work.md");
  }
  if (!documents["work.md"].includes("](./evidence.md)")) {
    findings.push("evidence-link-missing:work.md");
  }
  if (
    bodyValue(
      documents["evidence.md"],
      "Human Experience Review conclusion",
    ) !== expectedConclusion
  ) {
    findings.push("review-conclusion-not-met:evidence.md");
  }

  return findings;
}

function tableRow(markdown: string, firstCell: string): string[] | null {
  const line = markdown
    .split(/\r?\n/u)
    .find((candidate) => candidate.startsWith(`| ${firstCell} |`));
  return line
    ? line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim())
    : null;
}

function localMarkdownTargets(markdown: string): string[] {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)]
    .map((match) => match[1]?.split("#")[0] ?? "")
    .filter(
      (target) =>
        target.endsWith(".md") &&
        !target.includes("://") &&
        !path.isAbsolute(target),
    );
}

function frontmatter(markdown: string): Record<string, unknown> {
  const parsed = parseDocumentMetadata(markdown).frontmatter;
  if (!parsed) {
    throw new Error("Fixture document has no frontmatter.");
  }
  return parsed as unknown as Record<string, unknown>;
}

describe("Human Experience lifecycle propagation fixtures", () => {
  it.each(["direct", "indirect"])(
    "keeps the %s promise, owner, work, review conclusion, and evidence linked",
    (caseName) => {
      const documents = propagationFixture(caseName);

      expect(validateDesignBody(documents["design.md"], "required")).toEqual(
        [],
      );
      expect(propagationReview(documents)).toEqual([]);

      for (const fileName of PROPAGATION_ARTIFACTS) {
        expect(
          validateGeneratedDocumentMetadata(documents[fileName], {
            humanExperienceMode:
              fileName === "design.md" ? "required" : "if-present",
          }),
          `${caseName}/${fileName}`,
        ).toEqual([]);
      }
    },
  );

  it("ties indirect technical evidence to its measurable human effect", () => {
    const documents = propagationFixture("indirect");

    expect(documents["design.md"]).toContain("within 30 seconds");
    expect(documents["prd.md"]).toContain("99% of accepted jobs");
    expect(documents["evidence.md"]).toContain("99.4% within 30 seconds");
    expect(documents["evidence.md"]).toContain(
      "Operators can trust that accepted work will appear without manual replay.",
    );
  });

  it.each(WORK_FIXTURE_DECISIONS)(
    "records all four current testing decisions for %s work",
    (
      caseName,
      expectedDecisions,
      evidenceLabel,
      evidenceDecision,
      reviewConclusion,
    ) => {
      const work = fixture(caseName, "work.md");
      const evidence = fixture(caseName, "evidence.md");

      expect(tableRow(work, "Testing type")).toEqual(TESTING_RECORD_FIELDS);
      for (const [index, testingType] of TESTING_TYPES.entries()) {
        const record = tableRow(work, testingType);
        expect(record, `${caseName}: ${testingType}`).toHaveLength(
          TESTING_RECORD_FIELDS.length,
        );
        expect(record?.[1]).toBe(expectedDecisions[index]);
        expect(record?.slice(2).every((cell) => cell.length > 0)).toBe(true);
      }
      expect(tableRow(work, "Human Experience Review")).toBeNull();
      expect(bodyValue(work, "Human Experience Review")).not.toBeNull();
      expect(bodyValue(evidence, evidenceLabel)).toBe(evidenceDecision);
      expect(
        bodyValue(evidence, "Human Experience Review conclusion"),
      ).toBe(reviewConclusion);
    },
  );

  it.each(TRACE_FIXTURES)(
    "keeps every local %s fixture link and source path resolvable",
    (caseName, fileNames) => {
      const caseRoot = path.join(FIXTURE_ROOT, caseName);

      for (const fileName of fileNames) {
        const filePath = path.join(caseRoot, fileName);
        const markdown = readFileSync(filePath, "utf8");

        for (const target of localMarkdownTargets(markdown)) {
          expect(
            existsSync(path.resolve(path.dirname(filePath), target)),
            `${caseName}/${fileName} -> ${target}`,
          ).toBe(true);
        }

        const source = frontmatter(markdown).source;
        if (source && typeof source === "object") {
          const sourceRecord = source as Record<string, unknown>;
          if (
            sourceRecord.type !== "manual-request" &&
            typeof sourceRecord.path === "string"
          ) {
            expect(
              existsSync(path.resolve(caseRoot, sourceRecord.path)),
              `${caseName}/${fileName} source -> ${sourceRecord.path}`,
            ).toBe(true);
          }
        }
      }
    },
  );

  it("keeps a none decision as a proved boundary without invented interaction", () => {
    const design = fixture("none", "design.md");
    const plan = fixture("none", "plan.md");
    const work = fixture("none", "work.md");
    const evidence = fixture("none", "evidence.md");
    const preserved = bodyValue(design, "Preserved experience");

    expect(validateDesignBody(design, "required")).toEqual([]);
    expect(preserved).not.toBeNull();
    expect(bodyValue(plan, "Preserved human boundary")).toBe(preserved);
    expect(bodyValue(work, "Preserved human boundary")).toBe(preserved);
    expect(bodyValue(evidence, "Verified human boundary")).toBe(preserved);
    expect(work).toContain("[Evidence](./evidence.md)");
    expect(evidence).toContain("byte-for-byte fixture comparison");
    expect(evidence).not.toMatch(/click|screen|walkthrough/iu);
  });

  it("keeps an accepted deferred outcome discoverable until its exit criteria are met", () => {
    const documents = propagationFixture("deferred");
    const work = fixture("deferred", "work.md");
    const obligation = fixture("deferred", "obligation.md");

    expect(propagationReview(documents, "partial")).toEqual([]);
    expect(frontmatter(documents["plan.md"]).source).toEqual({
      type: "design",
      path: "design.md",
    });
    expect(frontmatter(documents["prd.md"]).source).toEqual({
      type: "plan",
      path: "plan.md",
    });
    expect(frontmatter(documents["work.md"]).source).toEqual({
      type: "prd",
      path: "prd.md",
    });
    expect(documents["plan.md"]).toContain("[Source design](./design.md)");
    expect(documents["prd.md"]).toContain("[Source plan](./plan.md)");
    expect(documents["work.md"]).toContain("[Owning PRD](./prd.md)");
    expect(work).toContain("[O-HX-001](./obligation.md)");
    expect(bodyValue(obligation, "Accepted future outcome")).toBe(
      "A release operator can recover a failed upload without starting the full release again.",
    );
    expect(bodyValue(obligation, "Owner")).toBe("Release tooling maintainer");
    expect(bodyValue(obligation, "Trigger")).toBe(
      "The resumable upload endpoint is available in production.",
    );
    expect(bodyValue(obligation, "Coordinate")).toBe("W20 R1 P2");
    expect(bodyValue(obligation, "Remaining evidence")).toBe(
      "Run the failed-upload recovery path in the installed release command.",
    );
    expect(bodyValue(obligation, "Exit criteria")).toBe(
      "The installed command resumes at the failed part and the Human Experience Review conclusion is met.",
    );
  });

  it("fails semantic review when copied shape loses the human goal and evidence link", () => {
    const documents = propagationFixture("lost-intent");

    expect(validateDesignBody(documents["design.md"], "required")).toEqual(
      [],
    );
    expect(
      validateGeneratedDocumentMetadata(documents["design.md"], {
        humanExperienceMode: "required",
      }),
    ).toEqual([]);
    expect(propagationReview(documents)).toEqual([
      "human-goal-lost:plan.md",
      "human-goal-lost:work.md",
      "human-goal-lost:evidence.md",
      "evidence-link-missing:work.md",
      "review-conclusion-not-met:evidence.md",
    ]);
  });

  it("uses existing metadata and body links for lineage without Human Experience frontmatter", () => {
    const documents = propagationFixture("direct");
    const metadata = Object.fromEntries(
      PROPAGATION_ARTIFACTS.map((fileName) => [
        fileName,
        frontmatter(documents[fileName]),
      ]),
    ) as Record<PropagationArtifact, Record<string, unknown>>;

    for (const fileName of PROPAGATION_ARTIFACTS) {
      expect(metadata[fileName].coordinate).toBe("W20 R0 P3");
      expect(Object.keys(metadata[fileName])).not.toEqual(
        expect.arrayContaining([
          "impact",
          "affected_humans",
          "human_goal",
          "experience_promises",
          "human_experience",
        ]),
      );
    }

    expect(metadata["design.md"].source).toEqual({
      type: "manual-request",
      path: "release-request.md",
    });
    expect(metadata["design.md"].follow_on).toMatchObject({
      route: "baseline-plan",
      coordinate_handoff: "Carry W20 R0 P3 into the release plan.",
    });
    expect(metadata["plan.md"].source).toEqual({
      type: "design",
      path: "design.md",
    });
    expect(metadata["prd.md"].source).toEqual({
      type: "plan",
      path: "plan.md",
    });
    expect(metadata["work.md"].source).toEqual({
      type: "prd",
      path: "prd.md",
    });
    expect(metadata["evidence.md"].source).toEqual({
      type: "work",
      path: "work.md",
    });

    expect(documents["design.md"]).toContain("## Intended Follow-On");
    expect(documents["plan.md"]).toContain("[Source design](./design.md)");
    expect(documents["prd.md"]).toContain("[Source plan](./plan.md)");
    expect(documents["work.md"]).toContain("[Owning PRD](./prd.md)");
    expect(documents["evidence.md"]).toContain("[Planned work](./work.md)");
  });

  it("keeps historical minor edits valid until adoption is required", () => {
    const historical = fixture("historical", "minor-edit.md");
    const before = Buffer.from(historical);

    expect(validateGeneratedDocumentMetadata(historical)).toEqual([]);
    expect(validateDesignBody(historical)).toEqual([]);
    expect(validateDesignBody(historical, "required")).toEqual([
      expect.objectContaining({ code: "hx-section-missing" }),
    ]);
    expect(Buffer.from(historical)).toEqual(before);
  });
});

describe("Human Experience authority discovery and router preservation", () => {
  it.each(REFERENCE_POINTER_SURFACES)(
    "%s points to the local canonical contract and reference",
    (relativePath) => {
      const contents = readFileSync(path.join(TEMPLATE_ROOT, relativePath), "utf8");
      expect(contents).toContain("../contracts/human-experience-contract.md");
      expect(contents).toContain("human-experience.md");
    },
  );

  it.each(TEMPLATE_POINTER_SURFACES)(
    "%s points to the installed canonical contract",
    (relativePath) => {
      const contents = readFileSync(path.join(TEMPLATE_ROOT, relativePath), "utf8");
      expect(contents).toContain(
        ".make-docs/system/contracts/human-experience-contract.md",
      );
    },
  );

  it.each(ROUTED_POINTER_SURFACES)(
    "%s exposes the canonical contract and reference URIs",
    (relativePath) => {
      const contents = readFileSync(path.join(TEMPLATE_ROOT, relativePath), "utf8");
      expect(contents).toContain(CONTRACT_URI);
      expect(contents).toContain(REFERENCE_URI);
    },
  );

  it("updates the real P3 router body while preserving user prefix and suffix", () => {
    const router = readFileSync(path.join(TEMPLATE_ROOT, "docs/work/AGENTS.md"), "utf8");
    const parsedRouter = parseManagedBlock(router);
    expect(parsedRouter.state).toBe("valid");
    if (parsedRouter.body === null) {
      throw new Error("The shipped work router has no managed body.");
    }
    expect(parsedRouter.body).toContain(CONTRACT_URI);
    expect(parsedRouter.body).toContain(REFERENCE_URI);

    const userPrefix = "# Local work rules\n\nKeep this project note.\n";
    const userSuffix = "\n## Local review note\n\nKeep this suffix exact.\n";
    const oldBody = "Old managed router body.\n";
    const existing = `${userPrefix}${renderManagedBlock(oldBody)}${userSuffix}`;
    const result = upsertManagedBlock(existing, parsedRouter.body);
    const parsedResult = parseManagedBlock(result.content);

    expect(result.action).toBe("updated");
    expect(parsedResult.prefix).toBe(userPrefix);
    expect(parsedResult.suffix).toBe(userSuffix);
    expect(parsedResult.body).toBe(parsedRouter.body);
  });
});
