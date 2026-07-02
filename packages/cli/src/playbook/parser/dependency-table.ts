/**
 * Parser stage 4: parse the dependency registry table (R-DEP-1..R-DEP-3).
 *
 * The Markdown table in `## Dependencies` is the dependency registry of
 * record, with exactly the columns `ID`, `Kind`, `Requirement`, `Source`,
 * `Used By`, `Fallback`. This stage produces typed registry records keyed by
 * identifier; enum-value and duplicate-identifier diagnostics belong to the
 * Phase 3 registry validation layer, so raw tokens are preserved on the
 * records. A missing or schema-breaking table emits PB-DEP-009.
 */

import { createPlaybookDiagnostic, type PlaybookDiagnostic } from "../diagnostics";
import {
  PLAYBOOK_DEPENDENCY_KINDS,
  PLAYBOOK_DEPENDENCY_REQUIREMENTS,
  type PlaybookDependency,
  type PlaybookDependencyRegistry,
} from "../model";
import { LineIndex, spannedEnum, type Spanned } from "../source-span";
import type { BodySection } from "./headings";
import type { FencedBlock, ScannedLine } from "./markdown-scan";

const DEPENDENCIES_SECTION = "## Dependencies";
const EXPECTED_COLUMNS = ["id", "kind", "requirement", "source", "used by", "fallback"];
const SEPARATOR_CELL_RE = /^:?-{3,}:?$/;

interface TableCell {
  text: string;
  /** Absolute offset of the trimmed cell text. */
  start: number;
  end: number;
}

function splitTableRow(line: ScannedLine, lineAbsoluteStart: number): TableCell[] {
  const cells: TableCell[] = [];
  const text = line.text;
  const boundaries: number[] = [];
  for (let offset = 0; offset < text.length; offset += 1) {
    if (text[offset] === "|" && text[offset - 1] !== "\\") {
      boundaries.push(offset);
    }
  }
  const cuts = [-1, ...boundaries, text.length];
  for (let position = 0; position < cuts.length - 1; position += 1) {
    const rawStart = cuts[position]! + 1;
    const rawEnd = cuts[position + 1]!;
    const raw = text.slice(rawStart, rawEnd);
    const trimmedLeading = raw.length - raw.trimStart().length;
    const trimmed = raw.trim();
    cells.push({
      text: trimmed,
      start: lineAbsoluteStart + rawStart + trimmedLeading,
      end: lineAbsoluteStart + rawStart + trimmedLeading + trimmed.length,
    });
  }
  if (cells.length > 0 && cells[0]!.text === "" && text.trimStart().startsWith("|")) {
    cells.shift();
  }
  if (cells.length > 0 && cells.at(-1)!.text === "" && text.trimEnd().endsWith("|")) {
    cells.pop();
  }
  return cells;
}

function usedByEntries(cell: TableCell, index: LineIndex): Spanned<string>[] {
  const entries: Spanned<string>[] = [];
  let cursor = 0;
  for (const token of cell.text.split(",")) {
    const leading = token.length - token.trimStart().length;
    const trimmed = token.trim();
    if (trimmed) {
      const start = cell.start + cursor + leading;
      entries.push({ value: trimmed, span: index.spanBetween(start, start + trimmed.length) });
    }
    cursor += token.length + 1;
  }
  return entries;
}

/** Stage 4 entry point. */
export function parseDependencyTableStage(
  bodyOffset: number,
  section: BodySection | null,
  fencedBlocks: FencedBlock[],
  lines: ScannedLine[],
  index: LineIndex,
  diagnostics: PlaybookDiagnostic[],
): PlaybookDependencyRegistry {
  const registry: PlaybookDependencyRegistry = { byId: new Map(), entries: [], span: null };
  if (!section) {
    // A missing `## Dependencies` section is already a PB-DOC-001; do not
    // double-report it as a table problem.
    return registry;
  }

  const sectionLines = lines.filter(
    (line) =>
      bodyOffset + line.start >= section.contentStart &&
      bodyOffset + line.end <= section.contentEnd &&
      !fencedBlocks.some((block) => line.start >= block.openStart && line.start < block.contentEnd),
  );
  const tableLines: ScannedLine[] = [];
  for (const line of sectionLines) {
    if (line.text.trimStart().startsWith("|")) {
      tableLines.push(line);
    } else if (tableLines.length > 0) {
      break;
    }
  }

  if (tableLines.length === 0) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-DEP-009", {
        message: "The `## Dependencies` section does not declare the dependency registry table.",
        section: DEPENDENCIES_SECTION,
        span: index.spanBetween(section.contentStart, section.contentEnd),
      }),
    );
    return registry;
  }

  const headerLine = tableLines[0]!;
  const headerCells = splitTableRow(headerLine, bodyOffset + headerLine.start);
  const headerNames = headerCells.map((cell) => cell.text.toLowerCase());
  const headerSpan = index.spanBetween(bodyOffset + headerLine.start, bodyOffset + headerLine.end);
  if (
    headerNames.length !== EXPECTED_COLUMNS.length ||
    EXPECTED_COLUMNS.some((column, position) => headerNames[position] !== column)
  ) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-DEP-009", {
        message: `The dependency registry table must have exactly the columns ID, Kind, Requirement, Source, Used By, Fallback; found: ${headerCells.map((cell) => cell.text).join(", ") || "(none)"}.`,
        section: DEPENDENCIES_SECTION,
        span: headerSpan,
      }),
    );
    return registry;
  }

  const separatorLine = tableLines[1];
  const separatorCells = separatorLine
    ? splitTableRow(separatorLine, bodyOffset + separatorLine.start)
    : [];
  if (
    !separatorLine ||
    separatorCells.length === 0 ||
    !separatorCells.every((cell) => SEPARATOR_CELL_RE.test(cell.text))
  ) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-DEP-009", {
        message: "The dependency registry table is missing its header separator row.",
        section: DEPENDENCIES_SECTION,
        span: headerSpan,
      }),
    );
    return registry;
  }

  const firstRow = tableLines[0]!;
  const lastRow = tableLines.at(-1)!;
  registry.span = index.spanBetween(bodyOffset + firstRow.start, bodyOffset + lastRow.end);

  for (const rowLine of tableLines.slice(2)) {
    const cells = splitTableRow(rowLine, bodyOffset + rowLine.start);
    const rowSpan = index.spanBetween(bodyOffset + rowLine.start, bodyOffset + rowLine.end);
    if (cells.length !== EXPECTED_COLUMNS.length) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-009", {
          message: `Dependency registry row has ${cells.length} cells; exactly ${EXPECTED_COLUMNS.length} are required.`,
          section: DEPENDENCIES_SECTION,
          span: rowSpan,
        }),
      );
      continue;
    }
    const [idCell, kindCell, requirementCell, sourceCell, usedByCell, fallbackCell] = cells as [
      TableCell,
      TableCell,
      TableCell,
      TableCell,
      TableCell,
      TableCell,
    ];
    const cellSpan = (cell: TableCell) => index.spanBetween(cell.start, cell.end);
    const dependency: PlaybookDependency = {
      id: { value: idCell.text, span: cellSpan(idCell) },
      kind: spannedEnum(kindCell.text, PLAYBOOK_DEPENDENCY_KINDS, cellSpan(kindCell)),
      requirement: spannedEnum(
        requirementCell.text,
        PLAYBOOK_DEPENDENCY_REQUIREMENTS,
        cellSpan(requirementCell),
      ),
      source: { value: sourceCell.text, span: cellSpan(sourceCell) },
      usedBy: usedByEntries(usedByCell, index),
      fallback: { value: fallbackCell.text, span: cellSpan(fallbackCell) },
      referencedBy: [],
      span: rowSpan,
    };
    registry.entries.push(dependency);
    if (dependency.id.value && !registry.byId.has(dependency.id.value)) {
      registry.byId.set(dependency.id.value, dependency);
    }
  }

  return registry;
}
