/**
 * Parser stage 4: parse the fenced dependencies block (PRD 34 R-DEP-1..3).
 *
 * The `## Dependencies` section carries exactly one fenced block with info
 * string `playbook` and top-level key `dependencies` — the same fence
 * discipline as the workflow contract block, distinguished by its top-level
 * key. Each entry declares `id`, `kind`, `requirement`, optional `probe`
 * (the only field dependency checks may target, defaulting to `id`),
 * `source` (human provenance prose nothing parses for machine meaning),
 * `used_by` (a typed YAML list), and `fallback`. Enum-value, duplicate-id,
 * and probe-pattern diagnostics belong to the Phase 3 registry validation
 * layer, so raw tokens are preserved on the records.
 *
 * Clean v2 break (PRD 34 R-MIG-1..2): the v1 Markdown table parser is
 * deleted; a table under `## Dependencies` fails with the pointed PB-DEP-025
 * naming the fenced block, a fence whose top-level key does not match the
 * section fails with PB-DOC-029, and a missing or malformed block emits
 * PB-DEP-009.
 */

import { isSeq, parseDocument } from "yaml";
import type { Node } from "yaml";
import { createPlaybookDiagnostic, type PlaybookDiagnostic } from "../diagnostics";
import {
  PLAYBOOK_DEPENDENCIES_BLOCK_KEY,
  PLAYBOOK_DEPENDENCY_KINDS,
  PLAYBOOK_DEPENDENCY_REQUIREMENTS,
  PLAYBOOK_WORKFLOW_BLOCK_INFO,
  type PlaybookDependency,
  type PlaybookDependencyRegistry,
} from "../model";
import { LineIndex, spannedEnum, type SourceSpan, type Spanned } from "../source-span";
import type { BodySection } from "./headings";
import type { FencedBlock, ScannedLine } from "./markdown-scan";
import { mapEntries, scalarString, seqItems, stringList, type YamlEntry } from "./yaml-nodes";

const DEPENDENCIES_SECTION = "## Dependencies";

/** The complete v2 per-entry field set (PRD 34 R-DEP-2). */
const ENTRY_FIELDS = [
  "id",
  "kind",
  "requirement",
  "probe",
  "source",
  "used_by",
  "fallback",
] as const;
const KNOWN_ENTRY_FIELDS = new Set<string>(ENTRY_FIELDS);
/** Required per-entry fields beyond `id` (whose absence is PB-DEP-015 territory). */
const REQUIRED_ENTRY_FIELDS = ["kind", "requirement", "source", "used_by", "fallback"] as const;

function entryMap(entries: YamlEntry[]): Map<string, YamlEntry> {
  return new Map(entries.map((entry) => [entry.key, entry]));
}

/**
 * Detects the removed v1 Markdown table: any table line in the section
 * outside fenced blocks (R-MIG-2). Returns the span of the table lines.
 */
function findV1Table(
  bodyOffset: number,
  section: BodySection,
  fencedBlocks: FencedBlock[],
  lines: ScannedLine[],
  index: LineIndex,
): SourceSpan | null {
  const tableLines = lines.filter(
    (line) =>
      bodyOffset + line.start >= section.contentStart &&
      bodyOffset + line.end <= section.contentEnd &&
      line.text.trimStart().startsWith("|") &&
      !fencedBlocks.some((block) => line.start >= block.openStart && line.start < block.contentEnd),
  );
  if (tableLines.length === 0) {
    return null;
  }
  const first = tableLines[0]!;
  const last = tableLines.at(-1)!;
  return index.spanBetween(bodyOffset + first.start, bodyOffset + last.end);
}

/** Stage 4 entry point. */
export function parseDependenciesBlockStage(
  source: string,
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
    // double-report it as a block problem.
    return registry;
  }

  const sectionSpan = index.spanBetween(section.contentStart, section.contentEnd);

  // Pointed old-form error first (PRD 34 R-MIG-2): a v1 Markdown table names
  // its v2 replacement and never parses to registry records.
  const tableSpan = findV1Table(bodyOffset, section, fencedBlocks, lines, index);
  if (tableSpan) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-DEP-025", {
        message:
          "The v1 dependency Markdown table was replaced by the `dependencies` YAML block in schema v2; declare dependencies as one fenced `playbook` block with a top-level `dependencies:` list.",
        section: DEPENDENCIES_SECTION,
        span: tableSpan,
      }),
    );
  }

  const blocks = fencedBlocks.filter(
    (block) =>
      block.info === PLAYBOOK_WORKFLOW_BLOCK_INFO &&
      bodyOffset + block.openStart >= section.contentStart &&
      bodyOffset + block.openStart < section.contentEnd,
  );

  if (blocks.length === 0) {
    if (!tableSpan) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-009", {
          message:
            "The `## Dependencies` section does not declare the fenced `playbook` dependencies block.",
          section: DEPENDENCIES_SECTION,
          span: sectionSpan,
        }),
      );
    }
    return registry;
  }

  if (blocks.length > 1) {
    const extra = blocks[1]!;
    diagnostics.push(
      createPlaybookDiagnostic("PB-DEP-009", {
        message: `Found ${blocks.length} \`playbook\` fenced blocks inside \`## Dependencies\`; exactly one is required (R-DEP-1).`,
        section: DEPENDENCIES_SECTION,
        span: index.spanBetween(bodyOffset + extra.openStart, bodyOffset + extra.openEnd),
      }),
    );
  }

  const block = blocks[0]!;
  const contentBase = bodyOffset + block.contentStart;
  const content = source.slice(contentBase, bodyOffset + block.contentEnd);
  const blockSpan = index.spanBetween(contentBase, bodyOffset + block.contentEnd);

  const document = parseDocument(content);
  if (document.errors.length > 0) {
    for (const error of document.errors) {
      const [errorStart, errorEnd] = error.pos;
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-009", {
          message: `The dependencies block is not parseable YAML: ${error.message.split("\n")[0]}`,
          section: DEPENDENCIES_SECTION,
          span: index.spanBetween(contentBase + errorStart, contentBase + errorEnd),
        }),
      );
    }
    return registry;
  }

  const rootEntries = mapEntries((document.contents ?? null) as Node | null, contentBase, index);
  const byKey = entryMap(rootEntries);
  const dependenciesEntry = byKey.get(PLAYBOOK_DEPENDENCIES_BLOCK_KEY);

  // Fence/section agreement (PRD 34 R-DEP-1): the block in `## Dependencies`
  // is distinguished by its top-level `dependencies` key; anything else is a
  // section-mismatch error.
  if (!dependenciesEntry) {
    const foundKeys = rootEntries.map((entry) => `\`${entry.key}\``).join(", ") || "(none)";
    diagnostics.push(
      createPlaybookDiagnostic("PB-DOC-029", {
        message: `The \`playbook\` fence inside \`## Dependencies\` declares top-level key ${foundKeys}; this section's block must declare \`dependencies\`.`,
        section: DEPENDENCIES_SECTION,
        span: blockSpan,
      }),
    );
    return registry;
  }
  for (const entry of rootEntries) {
    if (entry.key !== PLAYBOOK_DEPENDENCIES_BLOCK_KEY) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DOC-029", {
          message: `The \`playbook\` fence inside \`## Dependencies\` also declares top-level key \`${entry.key}\`; this section's block declares only \`dependencies\`.`,
          section: DEPENDENCIES_SECTION,
          span: entry.keySpan ?? entry.span,
        }),
      );
    }
  }

  registry.span = blockSpan;

  const items = seqOrEmpty(dependenciesEntry, contentBase, index, diagnostics);
  for (const [position, item] of items.entries()) {
    const fields = mapEntries(item.node, contentBase, index);
    const entrySpan = item.span ?? blockSpan;
    if (fields.length === 0) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-009", {
          message: `Dependency entry ${position + 1} must be a mapping of dependency fields (${ENTRY_FIELDS.join(", ")}).`,
          section: DEPENDENCIES_SECTION,
          span: entrySpan,
        }),
      );
      continue;
    }
    registry.entries.push(
      parseEntry(fields, entrySpan, position, contentBase, index, diagnostics),
    );
  }

  for (const dependency of registry.entries) {
    if (dependency.id.value && !registry.byId.has(dependency.id.value)) {
      registry.byId.set(dependency.id.value, dependency);
    }
  }

  return registry;
}

function seqOrEmpty(
  entry: YamlEntry,
  contentBase: number,
  index: LineIndex,
  diagnostics: PlaybookDiagnostic[],
): Array<{ node: Node | null; span: SourceSpan | null }> {
  // A bare `dependencies:` declares an empty registry, matching the v1
  // zero-row table (implementer decision); a non-sequence value is malformed.
  if (entry.node === null || entry.value === null) {
    return [];
  }
  const items = seqItemsOf(entry.node, contentBase, index);
  if (items === null) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-DEP-009", {
        message: "The `dependencies` key must carry a YAML list of dependency entries.",
        section: DEPENDENCIES_SECTION,
        span: entry.span,
      }),
    );
    return [];
  }
  return items;
}

function parseEntry(
  fields: YamlEntry[],
  entrySpan: SourceSpan,
  position: number,
  contentBase: number,
  index: LineIndex,
  diagnostics: PlaybookDiagnostic[],
): PlaybookDependency {
  const byKey = entryMap(fields);
  const idField = byKey.get("id");
  const idScalar = idField ? scalarString(idField.node, contentBase, index) : null;
  const id: Spanned<string> = idScalar ?? { value: "", span: idField?.span ?? entrySpan };
  const label = id.value || `entry ${position + 1}`;

  // Strict field discipline, matching the v1 exact-columns rule: unknown
  // fields are errors rather than silently ignored (implementer decision).
  for (const field of fields) {
    if (!KNOWN_ENTRY_FIELDS.has(field.key)) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-009", {
          message: `Dependency \`${label}\` declares unknown field \`${field.key}\`; fields are ${ENTRY_FIELDS.join(", ")}.`,
          section: DEPENDENCIES_SECTION,
          field: `${label}.${field.key}`,
          span: field.keySpan ?? field.span,
        }),
      );
    }
  }
  for (const required of REQUIRED_ENTRY_FIELDS) {
    if (!byKey.has(required)) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-009", {
          message: `Dependency \`${label}\` is missing required field \`${required}\`.`,
          section: DEPENDENCIES_SECTION,
          field: `${label}.${required}`,
          span: entrySpan,
        }),
      );
    }
  }

  const scalarField = (key: string): Spanned<string> | null => {
    const entry = byKey.get(key);
    return entry ? scalarString(entry.node, contentBase, index) : null;
  };

  const kindScalar = scalarField("kind");
  const requirementScalar = scalarField("requirement");
  const sourceScalar = scalarField("source");
  const fallbackScalar = scalarField("fallback");
  const usedByEntry = byKey.get("used_by");

  // `probe` resolves at parse time (PRD 34 R-DEP-2): the declared value when
  // present, else the dependency `id` — downstream check generation reads the
  // resolved value and never re-derives it.
  const probeScalar = scalarField("probe");

  return {
    id,
    kind: spannedEnum(
      kindScalar?.value ?? null,
      PLAYBOOK_DEPENDENCY_KINDS,
      kindScalar?.span ?? null,
    ),
    requirement: spannedEnum(
      requirementScalar?.value ?? null,
      PLAYBOOK_DEPENDENCY_REQUIREMENTS,
      requirementScalar?.span ?? null,
    ),
    probe: probeScalar ?? { value: id.value, span: id.span },
    probeDeclared: probeScalar !== null,
    source: sourceScalar ?? { value: "", span: null },
    usedBy: usedByEntry ? stringList(usedByEntry.node, contentBase, index) : [],
    fallback: fallbackScalar ?? { value: "", span: null },
    referencedBy: [],
    span: entrySpan,
  };
}

/**
 * Returns sequence items, or null when the node is not a sequence.
 * `seqItems` alone returns [] for non-sequences, which would silently accept
 * a mapping-shaped `dependencies` value.
 */
function seqItemsOf(
  node: Node,
  contentBase: number,
  index: LineIndex,
): Array<{ node: Node | null; span: SourceSpan | null }> | null {
  if (!isSeq(node)) {
    return null;
  }
  return seqItems(node, contentBase, index);
}
