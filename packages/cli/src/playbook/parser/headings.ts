/**
 * Parser stage 3: locate the required headings and verify presence and order
 * (R-DOC-5, R-DOC-7).
 *
 * The body must carry the eleven-heading spine: `# <Title>` followed by the
 * ten required `##` sections in fixed order. Unknown `##` sections placed
 * after the required spine are allowed and ignored; an unknown section before
 * or between required sections, and any missing, duplicated, or out-of-order
 * required section, is a PB-DOC-001 error. This stage also records the
 * narrative-section presence map; it never extracts meaning from narrative
 * free text (R-DOC-6).
 */

import { createPlaybookDiagnostic, type PlaybookDiagnostic } from "../diagnostics";
import {
  PLAYBOOK_NARRATIVE_SECTIONS,
  PLAYBOOK_REQUIRED_H2_HEADINGS,
  type PlaybookNarrativeSectionKey,
  type PlaybookNarrativeSectionMap,
  type PlaybookRequiredH2Heading,
} from "../model";
import { LineIndex, type SourceSpan } from "../source-span";
import { scanFencedBlocks, scanLines, type FencedBlock, type ScannedLine } from "./markdown-scan";

const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;
const DOCUMENT_SECTION = "document";

export interface BodySection {
  heading: string;
  level: number;
  headingSpan: SourceSpan;
  /** Absolute offset range of the section content (heading exclusive). */
  contentStart: number;
  contentEnd: number;
  nonEmpty: boolean;
}

export interface HeadingScan {
  title: BodySection | null;
  sections: BodySection[];
  /** Required `##` sections found, keyed by canonical heading text. */
  requiredSections: Map<PlaybookRequiredH2Heading, BodySection>;
  narrativeSections: PlaybookNarrativeSectionMap;
  /** Fenced blocks of the body, reused by later stages. */
  fencedBlocks: FencedBlock[];
  /** Body lines, offsets relative to the body text. */
  lines: ScannedLine[];
}

function sectionSpan(section: BodySection, index: LineIndex): SourceSpan {
  return index.spanBetween(section.headingSpan.start.offset, section.contentEnd);
}

/** Stage 3 entry point. Offsets in the returned scan are absolute. */
export function scanHeadingsStage(
  body: string,
  bodyOffset: number,
  index: LineIndex,
  diagnostics: PlaybookDiagnostic[],
): HeadingScan {
  const lines = scanLines(body);
  const fencedBlocks = scanFencedBlocks(lines);
  const headings: Array<{ line: ScannedLine; level: number; text: string }> = [];

  for (const line of lines) {
    const match = HEADING_RE.exec(line.text);
    if (!match) {
      continue;
    }
    const insideFence = fencedBlocks.some(
      (block) => line.start >= block.openStart && line.start < block.contentEnd,
    );
    if (insideFence) {
      continue;
    }
    headings.push({ line, level: match[1]!.length, text: match[2]! });
  }

  const sections: BodySection[] = [];
  const topLevel = headings.filter((heading) => heading.level <= 2);
  for (let position = 0; position < topLevel.length; position += 1) {
    const heading = topLevel[position]!;
    const next = topLevel[position + 1];
    const contentStart = bodyOffset + heading.line.end;
    const contentEnd = bodyOffset + (next ? next.line.start : body.length);
    const content = body.slice(heading.line.end, next ? next.line.start : body.length);
    sections.push({
      heading: heading.text,
      level: heading.level,
      headingSpan: index.spanBetween(bodyOffset + heading.line.start, bodyOffset + heading.line.end),
      contentStart,
      contentEnd,
      nonEmpty: content.trim().length > 0,
    });
  }

  const h1Sections = sections.filter((section) => section.level === 1);
  const h2Sections = sections.filter((section) => section.level === 2);
  const title = h1Sections[0] ?? null;

  if (!title) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-DOC-001", {
        message: "The Playbook body is missing its `# <Title>` heading.",
        section: DOCUMENT_SECTION,
        span: index.spanBetween(bodyOffset, bodyOffset),
      }),
    );
  } else {
    const firstH2 = h2Sections[0];
    if (firstH2 && firstH2.headingSpan.start.offset < title.headingSpan.start.offset) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DOC-001", {
          message: "The `# <Title>` heading must come before every `##` section.",
          section: DOCUMENT_SECTION,
          span: title.headingSpan,
        }),
      );
    }
    for (const extra of h1Sections.slice(1)) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DOC-001", {
          message: `Unexpected additional top-level heading \`# ${extra.heading}\`; a Playbook has exactly one \`# <Title>\`.`,
          section: DOCUMENT_SECTION,
          span: extra.headingSpan,
        }),
      );
    }
  }

  const requiredOrder = PLAYBOOK_REQUIRED_H2_HEADINGS;
  const requiredSections = new Map<PlaybookRequiredH2Heading, BodySection>();
  const unknownSections: BodySection[] = [];
  let highestSeenIndex = -1;

  for (const section of h2Sections) {
    const requiredIndex = requiredOrder.indexOf(section.heading as PlaybookRequiredH2Heading);
    if (requiredIndex === -1) {
      unknownSections.push(section);
      continue;
    }
    const canonical = requiredOrder[requiredIndex]!;
    if (requiredSections.has(canonical)) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DOC-001", {
          message: `Required section \`## ${canonical}\` appears more than once.`,
          section: `## ${canonical}`,
          span: section.headingSpan,
        }),
      );
      continue;
    }
    requiredSections.set(canonical, section);
    if (requiredIndex < highestSeenIndex) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DOC-001", {
          message: `Required section \`## ${canonical}\` is out of order.`,
          section: `## ${canonical}`,
          span: section.headingSpan,
        }),
      );
    } else {
      highestSeenIndex = requiredIndex;
    }
  }

  for (const heading of requiredOrder) {
    if (!requiredSections.has(heading)) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DOC-001", {
          message: `Required section \`## ${heading}\` is missing.`,
          section: `## ${heading}`,
          span: index.spanBetween(bodyOffset + body.length, bodyOffset + body.length),
        }),
      );
    }
  }

  const spineComplete = requiredSections.size === requiredOrder.length;
  const lastRequiredStart = Math.max(
    -1,
    ...[...requiredSections.values()].map((section) => section.headingSpan.start.offset),
  );
  for (const unknown of unknownSections) {
    const afterSpine = spineComplete && unknown.headingSpan.start.offset > lastRequiredStart;
    if (!afterSpine) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DOC-001", {
          message: `Unknown section \`## ${unknown.heading}\` appears before or between required sections; unknown sections are only allowed after the required spine.`,
          section: `## ${unknown.heading}`,
          span: unknown.headingSpan,
        }),
      );
    }
  }

  const narrativeSections = {} as PlaybookNarrativeSectionMap;
  for (const key of Object.keys(PLAYBOOK_NARRATIVE_SECTIONS) as PlaybookNarrativeSectionKey[]) {
    const heading = PLAYBOOK_NARRATIVE_SECTIONS[key];
    const section = requiredSections.get(heading) ?? null;
    narrativeSections[key] = {
      heading,
      present: section !== null,
      nonEmpty: section?.nonEmpty ?? false,
      span: section ? sectionSpan(section, index) : null,
    };
  }

  return {
    title,
    sections,
    requiredSections,
    narrativeSections,
    fencedBlocks,
    lines,
  };
}
