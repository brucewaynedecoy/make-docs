import { describe, expect, test } from "vitest";
import {
  LIFECYCLE_DEPARTURES,
  extractIntendedFollowOn,
  parseDocumentMetadata,
  validateGeneratedDocumentMetadata,
} from "../src/document-metadata";
import { createDefaultMakeDocsConfig } from "../src/config";

function documentWith(frontmatter: string, followOnBody: string): string {
  return `---
title: "Generated Design"
kind: "design"
status: "draft"
${frontmatter.trim()}
---

# Generated Design

## Purpose

Capture the decision.

## Intended Follow-On

${followOnBody.trim()}
`;
}

const matchingFollowOn = `follow_on:
  route: "change-plan"
  next_prompt: ".make-docs/references/system/prompts/designs-to-plan-change.prompt.md"
  why: "The design revises an active PRD contract."
  coordinate_handoff: "Carry W16 R1 into the downstream plan."`;

const matchingFollowOnBody = `- Route: \`change-plan\`
- Next Prompt: [Designs to Plan Change](.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)
- Why: The design revises an active PRD contract.
- Coordinate Handoff: Carry W16 R1 into the downstream plan.`;

describe("generated document metadata validation", () => {
  test("parses generated frontmatter and Intended Follow-On rendering", () => {
    const markdown = documentWith(matchingFollowOn, matchingFollowOnBody);
    const parsed = parseDocumentMetadata(markdown);
    const handoff = extractIntendedFollowOn(parsed.body);

    expect(parsed.frontmatter?.kind).toBe("design");
    expect(parsed.frontmatter?.follow_on).toMatchObject({
      route: "change-plan",
      next_prompt: ".make-docs/references/system/prompts/designs-to-plan-change.prompt.md",
    });
    expect(handoff).toMatchObject({
      route: "change-plan",
      next_prompt: ".make-docs/references/system/prompts/designs-to-plan-change.prompt.md",
      why: "The design revises an active PRD contract.",
      coordinate_handoff: "Carry W16 R1 into the downstream plan.",
    });
    expect(validateGeneratedDocumentMetadata(markdown)).toEqual([]);
  });

  test("reports YAML and body follow-on drift for route, prompt, reason, and coordinate handoff", () => {
    const markdown = documentWith(
      matchingFollowOn,
      `- Route: \`baseline-plan\`
- Next Prompt: [Designs to Plan](.make-docs/references/system/prompts/designs-to-plan.prompt.md)
- Why: The design starts a new PRD contract.
- Coordinate Handoff: Use W17 R0 for the downstream plan.`,
    );

    expect(validateGeneratedDocumentMetadata(markdown).map((finding) => finding.code)).toEqual([
      "follow-on-route-mismatch",
      "follow-on-next-prompt-mismatch",
      "follow-on-why-mismatch",
      "follow-on-coordinate-handoff-mismatch",
    ]);
  });

  test("allows configured labels in body prose while YAML metadata stays canonical", () => {
    const config = createDefaultMakeDocsConfig();
    config.labels.documentKinds.design = "Idea";
    config.personas = config.personas.map((persona) =>
      persona.slug === "user" ? { ...persona, label: "Reader" } : persona,
    );
    const markdown = `---
title: "Generated Guide"
kind: "design"
status: "draft"
persona: "user"
${matchingFollowOn}
---

# Generated Guide

## Summary

- Document kind: Idea
- Persona: Reader

## Intended Follow-On

${matchingFollowOnBody}
`;

    const parsed = parseDocumentMetadata(markdown);

    expect(parsed.frontmatter?.kind).toBe("design");
    expect(parsed.frontmatter?.persona).toBe("user");
    expect(validateGeneratedDocumentMetadata(markdown, { config })).toEqual([]);
  });

  test("reports configured label drift against canonical YAML metadata", () => {
    const config = createDefaultMakeDocsConfig();
    config.labels.documentKinds.design = "Idea";
    config.personas = config.personas.map((persona) =>
      persona.slug === "user" ? { ...persona, label: "Reader" } : persona,
    );
    const markdown = `---
title: "Generated Guide"
kind: "design"
status: "draft"
persona: "user"
${matchingFollowOn}
---

# Generated Guide

## Summary

- Document kind: Requirement
- Persona: Maintainer

## Intended Follow-On

${matchingFollowOnBody}
`;

    expect(
      validateGeneratedDocumentMetadata(markdown, { config }).map(
        (finding) => finding.code,
      ),
    ).toEqual([
      "configured-kind-label-mismatch",
      "configured-persona-label-mismatch",
    ]);
  });

  test("rejects configured display labels as metadata route or persona identifiers", () => {
    const config = createDefaultMakeDocsConfig();
    config.personas = config.personas.map((persona) =>
      persona.slug === "agent" ? { ...persona, label: "Automation Team" } : persona,
    );
    const markdown = documentWith(
      `persona: "Automation Team"
follow_on:
  route: "roadmap"
  next_prompt: ".make-docs/references/system/prompts/designs-to-plan-change.prompt.md"
  why: "The design revises an active PRD contract."
  coordinate_handoff: "Carry W16 R1 into the downstream plan."`,
      `- Route: \`roadmap\`
- Next Prompt: [Designs to Plan Change](.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)
- Why: The design revises an active PRD contract.
- Coordinate Handoff: Carry W16 R1 into the downstream plan.`,
    );

    expect(
      validateGeneratedDocumentMetadata(markdown, { config }).map(
        (finding) => finding.code,
      ),
    ).toEqual(["invalid-persona", "invalid-route"]);
  });

  test("accepts every configured lifecycle departure value as machine-readable metadata", () => {
    for (const departure of LIFECYCLE_DEPARTURES) {
      const markdown = documentWith(
        `${matchingFollowOn}
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "${departure}"
  reason: "Fixture coverage."`,
        matchingFollowOnBody,
      );

      expect(validateGeneratedDocumentMetadata(markdown), departure).toEqual([]);
    }
  });

  test("reports invalid route, lifecycle departure, kind, and source type values", () => {
    const markdown = documentWith(
      `kind: "not-a-kind"
source:
  type: "spreadsheet"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "teleport"
  reason: "Fixture coverage."
follow_on:
  route: "improvise"
  next_prompt: ".make-docs/references/system/prompts/designs-to-plan-change.prompt.md"
  why: "The design revises an active PRD contract."
  coordinate_handoff: "Carry W16 R1 into the downstream plan."`,
      `- Route: \`improvise\`
- Next Prompt: [Designs to Plan Change](.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)
- Why: The design revises an active PRD contract.
- Coordinate Handoff: Carry W16 R1 into the downstream plan.`,
    );

    expect(validateGeneratedDocumentMetadata(markdown).map((finding) => finding.code)).toEqual([
      "invalid-kind",
      "invalid-source-type",
      "invalid-lifecycle-departure",
      "invalid-route",
    ]);
  });

  test("keeps unresolved or deferred advisory handoffs valid when YAML and body agree", () => {
    const markdown = documentWith(
      `follow_on:
  route: "change-plan"
  next_prompt: ".make-docs/references/system/prompts/designs-to-plan-change.prompt.md"
  why: "Deferred until the active PRD owner is confirmed."
  coordinate_handoff: "unresolved; planner must resolve before writing."`,
      `- Route: \`change-plan\`
- Next Prompt: [Designs to Plan Change](.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)
- Why: Deferred until the active PRD owner is confirmed.
- Coordinate Handoff: unresolved; planner must resolve before writing.`,
    );

    expect(validateGeneratedDocumentMetadata(markdown)).toEqual([]);
  });

  test("reports missing metadata or body when only one follow-on surface is present", () => {
    expect(
      validateGeneratedDocumentMetadata(documentWith("", matchingFollowOnBody)).map(
        (finding) => finding.code,
      ),
    ).toEqual(["follow-on-metadata-missing"]);

    expect(
      validateGeneratedDocumentMetadata(`---
title: "Generated Design"
kind: "design"
status: "draft"
${matchingFollowOn}
---

# Generated Design
`).map((finding) => finding.code),
    ).toEqual(["follow-on-body-missing"]);
  });
});
