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

const HUMAN_EXPERIENCE_REVIEW_FIELDS = [
  "Promise",
  "Evidence",
  "Observation",
  "Conclusion",
  "Reviewer",
  "Reviewer limit",
  "Disposition",
] as const;

const P4_TESTING_RECORD_FIELDS = [...TESTING_RECORD_FIELDS, "Decision"] as const;

const P4_TESTING_DECISIONS = [
  [
    "Automated Implementation Testing",
    "Does the synthetic transcript satisfy the required technical output shape?",
    "selected",
  ],
  [
    "Performance Testing",
    "Can performance evidence change a current speed, load, cost, or resource decision?",
    "not-needed-now",
  ],
  [
    "Guided Progress Review",
    "Would a short fixture review reveal the incoherent result and useful replacement?",
    "selected",
  ],
  [
    "Unassisted Goal Testing",
    "Can an unassisted attempt reveal a material uncertainty that other current evidence cannot answer?",
    "not-needed-now",
  ],
] as const;

const SYNTHETIC_OBLIGATION_FIELDS = [
  "ID",
  "Title",
  "Status",
  "Summary",
  "Source authority",
  "Owner",
  "Target coordinate",
  "Future trigger",
  "Dependencies",
  "Acceptance exit criteria",
  "Related requirements and findings",
  "History/disposition note",
] as const;

const WORK_FIXTURE_DECISIONS = [
  [
    "direct",
    ["not-needed-now", "not-needed-now", "selected", "not-needed-now"],
    "Testing decision executed",
    "Guided Progress Review",
    "satisfied",
  ],
  [
    "indirect",
    ["not-needed-now", "selected", "not-needed-now", "not-needed-now"],
    "Testing decision executed",
    "Performance Testing",
    "satisfied",
  ],
  [
    "none",
    ["selected", "selected", "not-needed-now", "not-needed-now"],
    "Testing decisions executed",
    "Automated Implementation Testing; Performance Testing",
    "satisfied",
  ],
  [
    "deferred",
    ["not-needed-now", "not-needed-now", "selected", "not-needed-now"],
    "Testing decision executed",
    "Guided Progress Review",
    "material gap",
  ],
  [
    "lost-intent",
    ["selected", "not-needed-now", "not-needed-now", "not-needed-now"],
    "Testing decision executed",
    "Automated Implementation Testing",
    "insufficient evidence",
  ],
] as const;

const WORK_FIXTURE_QUESTIONS = {
  direct: [
    "Can automated proof change the current release-result content decision?",
    "Can performance evidence change a current speed, load, or resource decision?",
    "Can review of the captured result states show whether product, state, and next action appear before detail?",
    "Can a qualified unassisted attempt answer a current uncertainty not covered by P4 review?",
  ],
  indirect: [
    "Can automated logic proof change the current accepted-to-visible effect decision?",
    "Does the restart run meet the accepted 99 percent within 30 seconds threshold without manual replay?",
    "Can guided diagnosis change the current indirect-effect decision?",
    "Can an unassisted attempt reveal uncertainty beyond the measured indirect effect?",
  ],
  none: [
    "Did public output, errors, and exit status stay byte-identical after the extraction?",
    "Did the accepted public timing boundary remain unchanged after the extraction?",
    "Can guided review change the current boundary-preservation decision?",
    "Can an unassisted attempt reveal a changed human path in this none case?",
  ],
  deferred: [
    "Can automated proof run the owed resume path before the endpoint exists?",
    "Can performance evidence change the current upload-failure result decision?",
    "Does current failure-path review show the preserved steps and failed part?",
    "Can an unassisted attempt run the accepted resume goal before the endpoint exists?",
  ],
  "lost-intent": [
    "Do serializer unit tests cover each status enum?",
    "Can performance evidence change the current serializer-shape decision?",
    "Can schema inspection alone answer the operator-understanding goal?",
    "Can an unassisted attempt answer a goal the copied record did not retain?",
  ],
} as const;

const REVIEW_FIXTURES = [
  [
    "direct",
    "[HX-DIR-01](./design.md#human-experience-intent)",
    "satisfied",
    "Accept only the installed terminal-result claim",
  ],
  [
    "indirect",
    "[HX-IND-01](./design.md#human-experience-intent)",
    "satisfied",
    "Accept only the stated reliability",
  ],
  [
    "none",
    "Preserved boundary",
    "satisfied",
    "Accept only the stated preserved boundary",
  ],
  [
    "deferred",
    "[HX-DEF-01](./design.md#human-experience-intent)",
    "material gap",
    "Keep partial capability status",
  ],
  [
    "lost-intent",
    "[HX-LOST-01](./design.md#human-experience-intent)",
    "insufficient evidence",
    "smallest added testing activity",
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
  expectedConclusion = "satisfied",
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
    findings.push("review-conclusion-mismatch:evidence.md");
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

function tableRowsAfterHeader(
  markdown: string,
  headerFirstCell: string,
): string[][] {
  const lines = markdown.split(/\r?\n/u);
  const headerIndex = lines.findIndex((line) =>
    line.startsWith(`| ${headerFirstCell} |`),
  );
  if (headerIndex === -1) {
    return [];
  }

  const rows: string[][] = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.startsWith("|")) {
      break;
    }
    rows.push(
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
  }
  return rows;
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
      const expectedQuestions = WORK_FIXTURE_QUESTIONS[caseName];

      const header = tableRow(work, "Testing type");
      expect(header).toEqual(P4_TESTING_RECORD_FIELDS);
      expect(header?.slice(0, TESTING_RECORD_FIELDS.length)).toEqual(
        TESTING_RECORD_FIELDS,
      );
      for (const [index, testingType] of TESTING_TYPES.entries()) {
        const record = tableRow(work, testingType);
        expect(record, `${caseName}: ${testingType}`).toHaveLength(
          P4_TESTING_RECORD_FIELDS.length,
        );
        expect(record?.[1]).toBe(expectedQuestions[index]);
        expect(record?.[1]).not.toBe(expectedDecisions[index]);
        expect(record?.slice(2, -1).every((cell) => cell.length > 0)).toBe(
          true,
        );
        expect(record?.[P4_TESTING_RECORD_FIELDS.length - 1]).toBe(
          expectedDecisions[index],
        );
      }
      expect(tableRow(work, "Human Experience Review")).toBeNull();
      expect(bodyValue(work, "Human Experience Review")).not.toBeNull();
      expect(bodyValue(evidence, evidenceLabel)).toBe(evidenceDecision);
      expect(
        bodyValue(evidence, "Human Experience Review conclusion"),
      ).toBe(reviewConclusion);
    },
  );

  it.each(REVIEW_FIXTURES)(
    "records a complete per-promise Human Experience Review row for %s evidence",
    (caseName, promise, conclusion, disposition) => {
      const evidence = fixture(caseName, "evidence.md");
      const review = tableRow(evidence, promise);

      expect(tableRow(evidence, "Promise")).toEqual(
        HUMAN_EXPERIENCE_REVIEW_FIELDS,
      );
      expect(review, caseName).toHaveLength(
        HUMAN_EXPERIENCE_REVIEW_FIELDS.length,
      );
      expect(review?.[1].length).toBeGreaterThan(0);
      expect(review?.[2].length).toBeGreaterThan(0);
      expect(review?.[3]).toBe(`\`${conclusion}\``);
      expect(review?.[4].length).toBeGreaterThan(0);
      expect(review?.[5].length).toBeGreaterThan(0);
      expect(review?.[6]).toContain(disposition);
      expect(bodyValue(evidence, "Human Experience Review conclusion")).toBe(
        conclusion,
      );
    },
  );

  it("rejects a technically passing complete-field result with incoherent human paths", () => {
    const design = fixture("p4-review", "design.md");
    const result = fixture("p4-review", "result.md");
    const evidence = fixture("p4-review", "evidence.md");
    const promises = [...design.matchAll(/^- \[(HX-[A-Z]+-\d+)\]/gmu)].map(
      (match) => match[1],
    );
    const reviews = tableRowsAfterHeader(evidence, "Promise");
    const humanFacingOutput =
      result.match(/## Synthetic Command Output\s+```text\n([\s\S]*?)\n```/u)?.[1] ??
      "";

    expect(validateDesignBody(design, "required")).toEqual([]);
    expect(evidence).not.toContain("## Human Experience Intent");
    expect(promises).toEqual([
      "HX-REL-01",
      "HX-STATE-01",
      "HX-REC-01",
    ]);
    expect(bodyValue(result, "Technical result")).toBe("passed");
    expect(bodyValue(evidence, "Technical result")).toBeNull();
    expect(bodyValue(evidence, "Completion claim")).toBe("blocked");
    expect(bodyValue(evidence, "Human Experience Review conclusion")).toBe(
      "material gap",
    );
    expect(tableRow(evidence, "Promise")).toEqual(
      HUMAN_EXPERIENCE_REVIEW_FIELDS,
    );
    expect(reviews).toHaveLength(promises.length);
    expect(reviews.map((review) => review[0])).toEqual(
      promises.map(
        (promise) =>
          `[${promise}](./design.md#human-experience-intent)`,
      ),
    );

    for (const promise of promises) {
      const review = tableRow(
        evidence,
        `[${promise}](./design.md#human-experience-intent)`,
      );
      expect(review, promise).toHaveLength(HUMAN_EXPERIENCE_REVIEW_FIELDS.length);
      expect(review?.[3]).toBe("`material gap`");
      expect(review?.[4].length).toBeGreaterThan(0);
      expect(review?.[5].length).toBeGreaterThan(0);
      expect(review?.[6].length).toBeGreaterThan(0);
    }

    for (const field of [
      "Relationship",
      "Current state",
      "Revision history",
      "Invalid-input error",
      "Retry token",
      "Severity signal",
    ]) {
      expect(tableRow(result, field)?.[2], field).toBe("`passed`");
    }
    expect(tableRow(result, "Relationship")?.[1]).toBe(
      "`rel_7f20 -> rec_9c11`",
    );
    expect(tableRow(result, "Product")).toBeNull();
    expect(tableRow(result, "Current state")?.[1]).toBe(
      tableRow(result, "Revision history")?.[1],
    );
    expect(tableRow(result, "Recovery guidance")).toBeNull();
    expect(humanFacingOutput).not.toContain("next_action:");
    expect(humanFacingOutput).toContain("relationship: rel_7f20 -> rec_9c11");
    const statusLines = humanFacingOutput
      .split(/\r?\n/u)
      .filter((line) => line.startsWith("status: "));
    expect(statusLines).toEqual([
      "status: ACTIVE 2026-09-11T12:00:00Z",
      "status: ACTIVE 2026-09-11T12:00:00Z",
    ]);
    expect(new Set(statusLines).size).toBe(1);
    expect(humanFacingOutput).not.toMatch(/^(state|history):/mu);
    expect(humanFacingOutput).toContain("error: E_RESUME_17");
    expect(humanFacingOutput).toContain("retry_token: retry_4ac2");
    expect(evidence).toContain("[E-P4-01 synthetic result transcript](./result.md)");
  });

  it("keeps evidence reuse, specialist escalation, and not-needed-now decisions separate", () => {
    const result = fixture("p4-review", "result.md");
    const evidence = fixture("p4-review", "evidence.md");

    const header = tableRow(evidence, "Testing type");
    expect(header).toEqual(P4_TESTING_RECORD_FIELDS);
    expect(header?.slice(0, TESTING_RECORD_FIELDS.length)).toEqual(
      TESTING_RECORD_FIELDS,
    );
    for (const [testingType, question, decision] of P4_TESTING_DECISIONS) {
      const record = tableRow(evidence, testingType);
      expect(record, testingType).toHaveLength(P4_TESTING_RECORD_FIELDS.length);
      expect(record?.[1]).toBe(question);
      expect(record?.[1]).not.toBe(decision);
      expect(record?.[P4_TESTING_RECORD_FIELDS.length - 1]).toBe(decision);
    }
    expect(tableRow(evidence, "Performance Testing")?.[11]).toBe(
      "not-needed-now",
    );
    expect(tableRow(evidence, "Unassisted Goal Testing")?.[11]).toBe(
      "not-needed-now",
    );
    expect(tableRow(evidence, "Unassisted Goal Testing")?.[10]).toBe(
      "None in this fixture. A later authority makes a new current decision.",
    );
    expect(
      bodyValue(evidence, "not-needed-now obligation"),
    ).toBe("None. No accepted future performance or unassisted outcome is owed.");

    const reused = tableRow(evidence, "[E-P4-01](./result.md)");
    expect(reused?.[1]).toContain("technical completion");
    expect(reused?.[2]).toContain("without a duplicate run or verdict");
    for (const promise of [
      "HX-REL-01",
      "HX-STATE-01",
      "HX-REC-01",
    ]) {
      expect(
        tableRow(
          evidence,
          `[${promise}](./design.md#human-experience-intent)`,
        )?.[1],
      ).toBe("[E-P4-01](./result.md) fixture transcript");
    }

    const specialist = tableRow(evidence, "Accessibility Review");
    expect(specialist?.[1]).toBe("escalated-separately");
    expect(specialist?.[2]).toContain("color as the only severity signal");
    expect(specialist?.[3]).toBe(
      "[E-P4-01](./result.md) fixture transcript",
    );
    expect(tableRow(result, "Severity signal")?.[1]).toBe("`color:red`");
    expect(result).toContain("severity_signal: color:red");
    expect(result).not.toContain("severity_label:");
    expect(TESTING_TYPES).not.toContain("Accessibility Review");
    expect(tableRow(evidence, "Human Experience Review")).toBeNull();
  });

  it("accepts valid indirect and none proof and preserves all material finding dispositions", () => {
    const evidence = fixture("p4-review", "evidence.md");
    const obligation = fixture("p4-review", "obligation.md");
    const indirect = tableRow(evidence, "Valid indirect");
    const none = tableRow(evidence, "Valid none");

    expect(indirect?.[1]).toBe("`indirect`");
    expect(indirect?.[2]).toContain("99.4 percent");
    expect(indirect?.[3]).toContain("without manual replay");
    expect(indirect?.[4]).toBe("`satisfied`");
    expect(none?.[1]).toBe("`none`");
    expect(none?.[2]).toContain("public output and error bytes");
    expect(none?.[3]).toContain("preserved");
    expect(none?.[4]).toBe("`satisfied`");

    expect(
      tableRow(
        evidence,
        "[HX-REL-01](./design.md#human-experience-intent)",
      )?.[6],
    ).toMatch(/fixture disposition.+remediate.+repeat/iu);
    expect(
      tableRow(
        evidence,
        "[HX-STATE-01](./design.md#human-experience-intent)",
      )?.[6],
    ).toMatch(/fixture disposition example.+bounded caveat.+narrows/iu);
    expect(
      tableRow(
        evidence,
        "[HX-REC-01](./design.md#human-experience-intent)",
      )?.[6],
    ).toMatch(/fixture disposition example.+partial status.+O-901/iu);

    for (const field of [
      "Promise",
      "Evidence limit",
      "Risk",
      "Owner",
      "Follow-on route",
    ]) {
      expect(bodyValue(evidence, field), field).not.toBeNull();
    }
    expect(bodyValue(evidence, "Promise")).toBe("HX-STATE-01");
    expect(bodyValue(evidence, "Owner")).toContain("No owner is assigned");
    expect(bodyValue(evidence, "Follow-on route")).toContain(
      "No task, coordinate, or W20 R1 work is approved",
    );

    for (const field of SYNTHETIC_OBLIGATION_FIELDS) {
      expect(bodyValue(obligation, field), field).not.toBeNull();
    }
    const obligationId = bodyValue(obligation, "ID");
    const obligationTitle = bodyValue(obligation, "Title");
    const obligationStatus = bodyValue(obligation, "Status");
    const obligationHeading = obligation.match(/^# (.+)$/mu)?.[1] ?? null;

    expect(obligationId).toMatch(/^O-\d{3}$/u);
    expect(obligationHeading).toBe(`${obligationId} ${obligationTitle}`);
    expect([
      "Active",
      "Deferred",
      "Fulfilled",
      "Cancelled",
      "Superseded",
    ]).toContain(obligationStatus);
    expect(obligationStatus).toBe("Deferred");
    expect(bodyValue(obligation, "Source authority")).toContain(
      "only inside this fixture world",
    );
    expect(bodyValue(obligation, "Owner")).toContain(
      "only inside this fixture world",
    );
    expect(bodyValue(obligation, "Target coordinate")).toContain(
      "Synthetic owner-routed follow-on",
    );
    expect(bodyValue(obligation, "Target coordinate")).not.toContain("W20 R1");
    expect(bodyValue(obligation, "History/disposition note")).toContain(
      "does not create real owner acceptance, an obligation, or future work",
    );
    expect(parseDocumentMetadata(obligation).frontmatter).toBeNull();

    for (const fileName of [
      "design.md",
      "result.md",
      "evidence.md",
      "obligation.md",
    ]) {
      const filePath = path.join(FIXTURE_ROOT, "p4-review", fileName);
      const markdown = readFileSync(filePath, "utf8");
      for (const target of localMarkdownTargets(markdown)) {
        expect(
          existsSync(path.resolve(path.dirname(filePath), target)),
          `p4-review/${fileName} -> ${target}`,
        ).toBe(true);
      }
    }
  });

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

    expect(propagationReview(documents, "material gap")).toEqual([]);
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
      "The installed command resumes at the failed part and the Human Experience Review conclusion is satisfied.",
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
      "review-conclusion-mismatch:evidence.md",
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
