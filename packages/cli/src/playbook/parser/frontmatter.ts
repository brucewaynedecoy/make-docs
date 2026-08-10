/**
 * Parser stages 1 and 2: split the frontmatter from the body and parse the
 * frontmatter against the Playbook document schema (R-DOC-3, R-DOC-4,
 * PRD 34 R-FM-1, R-MIG-2..3).
 *
 * Fail-soft: a missing or unparseable frontmatter block emits PB-FM-008 and
 * parsing continues over the body; individual field problems emit PB-FM-002
 * without masking each other. The v2 clean break lives here too: the removed
 * v1 keys `schemaVersion`/`workflowSchemaVersion` fail with the pointed
 * PB-FM-026 naming the v2 key, and a document schema identifier other than
 * `make-docs.playbook.v2` fails with the pointed PB-FM-028.
 */

import { parseDocument } from "yaml";
import type { Node } from "yaml";
import {
  createPlaybookDiagnostic,
  type PlaybookDiagnostic,
} from "../diagnostics";
import {
  PLAYBOOK_DOCUMENT_SCHEMA_ID,
  PLAYBOOK_DOCUMENT_STACKS,
  PLAYBOOK_DOCUMENT_STATUSES,
  type PlaybookFrontmatter,
} from "../model";
import {
  LineIndex,
  spannedEnum,
  type SourceSpan,
  type Spanned,
} from "../source-span";
import { mapEntries, nodeToPlain, scalarString, type YamlEntry } from "./yaml-nodes";

const FRONTMATTER_OPEN = "---\n";
const FRONTMATTER_CLOSE = "\n---\n";
const FRONTMATTER_SECTION = "frontmatter";

export interface FrontmatterSplit {
  /** Raw frontmatter text between the fences, or null when absent. */
  frontmatterText: string | null;
  /** Absolute offset of the frontmatter text within the source. */
  frontmatterOffset: number;
  body: string;
  /** Absolute offset of the body within the source. */
  bodyOffset: number;
}

/** Stage 1: read the source and split frontmatter from body. */
export function splitFrontmatter(source: string): FrontmatterSplit {
  if (!source.startsWith(FRONTMATTER_OPEN)) {
    return { frontmatterText: null, frontmatterOffset: 0, body: source, bodyOffset: 0 };
  }
  const closeIndex = source.indexOf(FRONTMATTER_CLOSE, FRONTMATTER_OPEN.length);
  if (closeIndex === -1) {
    return { frontmatterText: null, frontmatterOffset: 0, body: source, bodyOffset: 0 };
  }
  const bodyOffset = closeIndex + FRONTMATTER_CLOSE.length;
  return {
    frontmatterText: source.slice(FRONTMATTER_OPEN.length, closeIndex),
    frontmatterOffset: FRONTMATTER_OPEN.length,
    body: source.slice(bodyOffset),
    bodyOffset,
  };
}

function emptyFrontmatter(span: SourceSpan | null): PlaybookFrontmatter {
  return {
    kind: null,
    title: null,
    summary: null,
    persona: null,
    stack: spannedEnum(null, PLAYBOOK_DOCUMENT_STACKS, null),
    status: spannedEnum(null, PLAYBOOK_DOCUMENT_STATUSES, null),
    schemaVersion: null,
    workflowSchemaVersion: null,
    id: null,
    packagingHints: null,
    raw: {},
    span,
  };
}

function requireString(
  entry: YamlEntry | undefined,
  field: string,
  index: LineIndex,
  frontmatterOffset: number,
  diagnostics: PlaybookDiagnostic[],
  options: { singleLine?: boolean } = {},
): Spanned<string> | null {
  if (!entry) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-FM-002", {
        message: `Required frontmatter field \`${field}\` is missing.`,
        section: FRONTMATTER_SECTION,
        field,
      }),
    );
    return null;
  }
  const scalar = scalarString(entry.node, frontmatterOffset, index);
  if (!scalar || !scalar.value.trim()) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-FM-002", {
        message: `Frontmatter field \`${field}\` must be a non-empty string.`,
        section: FRONTMATTER_SECTION,
        field,
        span: entry.span,
      }),
    );
    return null;
  }
  if (options.singleLine && /\r|\n/.test(scalar.value)) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-FM-002", {
        message: `Frontmatter field \`${field}\` must be a single-line string.`,
        section: FRONTMATTER_SECTION,
        field,
        span: entry.span,
      }),
    );
    return null;
  }
  return { value: scalar.value.trim(), span: scalar.span };
}

function optionalString(
  entry: YamlEntry | undefined,
  frontmatterOffset: number,
  index: LineIndex,
): Spanned<string> | null {
  if (!entry) {
    return null;
  }
  const scalar = scalarString(entry.node, frontmatterOffset, index);
  return scalar && scalar.value.trim() ? { value: scalar.value.trim(), span: scalar.span } : null;
}

/** Stage 2: parse the frontmatter against the document schema. */
export function parseFrontmatterStage(
  split: FrontmatterSplit,
  index: LineIndex,
  diagnostics: PlaybookDiagnostic[],
): PlaybookFrontmatter {
  if (split.frontmatterText === null) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-FM-008", {
        message: "The Playbook is missing its YAML frontmatter block.",
        section: FRONTMATTER_SECTION,
        span: index.spanBetween(0, 0),
      }),
    );
    return emptyFrontmatter(null);
  }

  const frontmatterSpan = index.spanBetween(
    split.frontmatterOffset,
    split.frontmatterOffset + split.frontmatterText.length,
  );
  const document = parseDocument(split.frontmatterText);
  if (document.errors.length > 0) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-FM-008", {
        message: `The YAML frontmatter cannot be parsed: ${document.errors[0]!.message.split("\n")[0]}`,
        section: FRONTMATTER_SECTION,
        span: frontmatterSpan,
      }),
    );
    return emptyFrontmatter(frontmatterSpan);
  }

  const entries = mapEntries(
    (document.contents ?? null) as Node | null,
    split.frontmatterOffset,
    index,
  );
  if (entries.length === 0) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-FM-008", {
        message: "The YAML frontmatter must be a mapping of Playbook fields.",
        section: FRONTMATTER_SECTION,
        span: frontmatterSpan,
      }),
    );
    return emptyFrontmatter(frontmatterSpan);
  }

  const byKey = new Map(entries.map((entry) => [entry.key, entry]));
  const raw: Record<string, unknown> = {};
  for (const entry of entries) {
    raw[entry.key] = entry.value;
  }

  const kind = requireString(byKey.get("kind"), "kind", index, split.frontmatterOffset, diagnostics);
  if (kind && kind.value !== "playbook") {
    diagnostics.push(
      createPlaybookDiagnostic("PB-FM-002", {
        message: `Frontmatter \`kind\` must be \`playbook\`, found \`${kind.value}\`.`,
        section: FRONTMATTER_SECTION,
        field: "kind",
        span: kind.span,
      }),
    );
  }

  const title = requireString(byKey.get("title"), "title", index, split.frontmatterOffset, diagnostics);
  const summary = requireString(byKey.get("summary"), "summary", index, split.frontmatterOffset, diagnostics, {
    singleLine: true,
  });
  const persona = requireString(byKey.get("persona"), "persona", index, split.frontmatterOffset, diagnostics);

  // Clean v2 break (PRD 34 R-FM-1, R-MIG-2): the removed v1 keys fail with
  // the pointed diagnostic naming the v2 key. When the old key is the only
  // declaration, the pointed error replaces the generic missing-field
  // PB-FM-002 so the author sees exactly one actionable message
  // (implementer decision).
  const versionKey = (
    v2Key: "schema" | "workflowSchema",
    v1Key: "schemaVersion" | "workflowSchemaVersion",
  ): Spanned<string> | null => {
    const removed = byKey.get(v1Key);
    if (removed) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-FM-026", {
          message: `Frontmatter key \`${v1Key}\` was removed in schema v2; declare \`${v2Key}\` instead, value unchanged.`,
          section: FRONTMATTER_SECTION,
          field: v1Key,
          span: removed.keySpan ?? removed.span,
        }),
      );
      if (!byKey.has(v2Key)) {
        return null;
      }
    }
    return requireString(byKey.get(v2Key), v2Key, index, split.frontmatterOffset, diagnostics);
  };

  const schemaVersion = versionKey("schema", "schemaVersion");
  const workflowSchemaVersion = versionKey("workflowSchema", "workflowSchemaVersion");

  // The document schema identifier advanced to v2 (PRD 34 R-MIG-3): only the
  // v2 identifier is accepted, and anything else — the v1 identifier above
  // all — fails with the pointed diagnostic naming the v2 identifier.
  if (schemaVersion && schemaVersion.value !== PLAYBOOK_DOCUMENT_SCHEMA_ID) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-FM-028", {
        message: `Frontmatter \`schema\` declares \`${schemaVersion.value}\`; this parser reads only \`${PLAYBOOK_DOCUMENT_SCHEMA_ID}\`.`,
        section: FRONTMATTER_SECTION,
        field: "schema",
        span: schemaVersion.span,
      }),
    );
  }

  const stackField = requireString(byKey.get("stack"), "stack", index, split.frontmatterOffset, diagnostics);
  const stack = spannedEnum(stackField?.value ?? null, PLAYBOOK_DOCUMENT_STACKS, stackField?.span ?? null);
  if (stackField && stack.value === null) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-FM-002", {
        message: `Frontmatter \`stack\` must be one of ${PLAYBOOK_DOCUMENT_STACKS.join(", ")}; found \`${stackField.value}\`.`,
        section: FRONTMATTER_SECTION,
        field: "stack",
        span: stackField.span,
      }),
    );
  }

  const statusField = requireString(byKey.get("status"), "status", index, split.frontmatterOffset, diagnostics);
  const status = spannedEnum(statusField?.value ?? null, PLAYBOOK_DOCUMENT_STATUSES, statusField?.span ?? null);
  if (statusField && status.value === null) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-FM-002", {
        message: `Frontmatter \`status\` must be one of ${PLAYBOOK_DOCUMENT_STATUSES.join(", ")}; found \`${statusField.value}\`.`,
        section: FRONTMATTER_SECTION,
        field: "status",
        span: statusField.span,
      }),
    );
  }

  let packagingHints: Spanned<Record<string, unknown>> | null = null;
  const hintsEntry = byKey.get("packagingHints");
  if (hintsEntry) {
    const plain = nodeToPlain(hintsEntry.node);
    if (plain && typeof plain === "object" && !Array.isArray(plain)) {
      packagingHints = { value: plain as Record<string, unknown>, span: hintsEntry.span };
    } else {
      diagnostics.push(
        createPlaybookDiagnostic("PB-FM-002", {
          message: "Frontmatter `packagingHints` must be a mapping of non-authoritative hints.",
          section: FRONTMATTER_SECTION,
          field: "packagingHints",
          span: hintsEntry.span,
        }),
      );
    }
  }

  return {
    kind,
    title,
    summary,
    persona,
    stack,
    status,
    schemaVersion,
    workflowSchemaVersion,
    id: optionalString(byKey.get("id"), split.frontmatterOffset, index),
    packagingHints,
    raw,
    span: frontmatterSpan,
  };
}
