/**
 * The `playbook.validate` and `playbook.catalog` operations (W18 R6 P4,
 * PRD 34 R-MODEL-6).
 *
 * Both operations are thin wrappers over the Playbook core library at
 * `src/playbook/`: this module reads files and enumerates the persona
 * folders, and every parsed fact and every diagnostic comes solely from
 * `parseAndValidatePlaybook` — the operation layer never re-parses Playbook
 * Markdown on its own (R-MODEL-2), and nothing diagnostic-shaped lives only
 * here, so a future language server wrapping the same library produces
 * identical diagnostics (R-MODEL-6).
 *
 * Per PRD 25 the operations sit inside the modular operation-domain boundary
 * so the CLI, the MCP server, and any plugin, skill, or agent surface call
 * the same functions.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  detectPlaybookFileForm,
  parseAndValidatePlaybook,
  playbookSlugFromPath,
  PLAYBOOK_FILE_SUFFIX,
  type ParsePlaybookResult,
  type PlaybookDiagnostic,
  type PlaybookFileForm,
} from "../../playbook";
import { normalizeRelativePath, readTextFile } from "../../utils";
import { findRepoRoot, repoRelativePath } from "../shared";
import { OperationError, type JsonValue, type OperationResult } from "../types";
import { PLAYBOOKS_RELATIVE_DIR } from "./index";

/**
 * Stable operation-registry identifiers, consumed as an external contract
 * (R-SCOPE-2). The identifiers are minted by the operation-registry lineage
 * (`docs/assets/artifacts/cli-command-reorganization.md`, W18 R11) and named
 * by the Playbook contract's Operations and Reuse section; this module only
 * consumes them and never substitutes CLI command strings for them.
 */
export const PLAYBOOK_VALIDATE_OPERATION_ID = "playbook.validate";
export const PLAYBOOK_CATALOG_OPERATION_ID = "playbook.catalog";

/** One reported diagnostic: code, severity, location, message, and fix hint. */
export interface PlaybookValidationDiagnostic {
  code: string;
  severity: "error" | "warning";
  message: string;
  hint: string;
  section: string | null;
  field: string | null;
  span: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  } | null;
}

export interface PlaybookValidationResult {
  path: string;
  ref: string;
  fileForm: PlaybookFileForm;
  runnable: boolean;
  errorCount: number;
  warningCount: number;
  diagnostics: PlaybookValidationDiagnostic[];
}

export interface PlaybookValidationReport {
  repoRoot: string;
  results: PlaybookValidationResult[];
  playbookCount: number;
  errorCount: number;
  warningCount: number;
  valid: boolean;
}

export interface PlaybookContractCatalogEntry {
  /** Canonical reference: explicit frontmatter `id` when present, else `persona/slug` (R-DOC-4). */
  ref: string;
  persona: string | null;
  slug: string;
  path: string;
  /** `playbook-suffix` or the deprecated `deprecated-plain` form (R-DOC-2). */
  fileForm: PlaybookFileForm;
  title: string | null;
  summary: string | null;
  stack: string | null;
  status: string | null;
  schemaVersion: string | null;
  workflowSchemaVersion: string | null;
  runnable: boolean;
  errorCount: number;
  warningCount: number;
}

export interface PlaybookContractCatalog {
  repoRoot: string;
  playbooksDir: string;
  entries: PlaybookContractCatalogEntry[];
  diagnostics: Array<PlaybookValidationDiagnostic & { path: string }>;
}

/**
 * `playbook.validate`: parse and validate one or more Playbooks through the
 * library and report the full diagnostic set. `refs` entries may be explicit
 * paths or canonical `persona/slug` references; with no refs, every detected
 * Playbook under `docs/assets/playbooks/` is validated.
 */
export function validatePlaybooks(input: {
  repoRoot?: string;
  refs?: string[];
} = {}): PlaybookValidationReport {
  const repoRoot = findRepoRoot(input.repoRoot);
  const refs = (input.refs ?? []).map((ref) => ref.trim()).filter(Boolean);
  const files = refs.length > 0
    ? refs.map((ref) => resolvePlaybookFileRef(repoRoot, ref))
    : listDetectedPlaybookFiles(repoRoot).map((candidate) => candidate.relativePath);

  const results = files.map((relativePath) => {
    const parsed = parsePlaybookThroughLibrary(repoRoot, relativePath);
    return buildValidationResult(relativePath, parsed);
  });

  const errorCount = results.reduce((total, result) => total + result.errorCount, 0);
  const warningCount = results.reduce((total, result) => total + result.warningCount, 0);
  return {
    repoRoot,
    results,
    playbookCount: results.length,
    errorCount,
    warningCount,
    valid: errorCount === 0,
  };
}

/**
 * `playbook.catalog`: enumerate Playbooks by canonical `persona/slug`
 * reference with their frontmatter identity, detecting both the
 * `<slug>.playbook.md` suffix form and the deprecated plain form, whose
 * PB-FILE-007 rename diagnostic surfaces in the catalog diagnostics
 * (R-DOC-2, R-DOC-4).
 */
export function catalogPlaybooks(input: { repoRoot?: string } = {}): PlaybookContractCatalog {
  const repoRoot = findRepoRoot(input.repoRoot);
  const entries: PlaybookContractCatalogEntry[] = [];
  const diagnostics: PlaybookContractCatalog["diagnostics"] = [];

  for (const candidate of listDetectedPlaybookFiles(repoRoot)) {
    const { model, diagnostics: fileDiagnostics } = candidate.parsed;
    entries.push({
      ref: model.identity.canonicalRef,
      persona: model.identity.persona ?? model.identity.directoryPersona,
      slug: model.identity.slug,
      path: candidate.relativePath,
      fileForm: model.identity.fileForm,
      title: model.frontmatter.title?.value ?? null,
      summary: model.frontmatter.summary?.value ?? null,
      stack: model.identity.stack,
      status: model.identity.status,
      schemaVersion: model.identity.schemaVersion,
      workflowSchemaVersion: model.identity.workflowSchemaVersion,
      runnable: model.runnable,
      errorCount: countBySeverity(fileDiagnostics, "error"),
      warningCount: countBySeverity(fileDiagnostics, "warning"),
    });
    diagnostics.push(
      ...fileDiagnostics.map((diagnostic) => ({
        path: candidate.relativePath,
        ...toValidationDiagnostic(diagnostic),
      })),
    );
  }

  return {
    repoRoot,
    playbooksDir: PLAYBOOKS_RELATIVE_DIR,
    entries: entries.sort((left, right) => left.ref.localeCompare(right.ref)),
    diagnostics,
  };
}

export function readPlaybookValidation(
  input: Parameters<typeof validatePlaybooks>[0] = {},
): OperationResult<JsonValue> {
  return {
    value: validatePlaybooks(input) as unknown as JsonValue,
    provenance: {
      domain: "playbook",
      operation: PLAYBOOK_VALIDATE_OPERATION_ID,
      source: "shared",
      target: input?.repoRoot,
    },
  };
}

export function readPlaybookContractCatalog(
  input: Parameters<typeof catalogPlaybooks>[0] = {},
): OperationResult<JsonValue> {
  return {
    value: catalogPlaybooks(input) as unknown as JsonValue,
    provenance: {
      domain: "playbook",
      operation: PLAYBOOK_CATALOG_OPERATION_ID,
      source: "shared",
      target: input?.repoRoot,
    },
  };
}

interface DetectedPlaybookFile {
  relativePath: string;
  parsed: ParsePlaybookResult;
}

/**
 * Enumerates `docs/assets/playbooks/<persona>/*.md`, parses every candidate
 * through the library, and keeps the files the library detects as Playbooks:
 * the `<slug>.playbook.md` suffix form and the deprecated plain form with
 * frontmatter `kind: playbook`.
 */
function listDetectedPlaybookFiles(repoRoot: string): DetectedPlaybookFile[] {
  const playbooksDir = path.join(repoRoot, PLAYBOOKS_RELATIVE_DIR);
  if (!existsSync(playbooksDir)) {
    return [];
  }

  const detected: DetectedPlaybookFile[] = [];
  for (const persona of sortedNames(playbooksDir, "directory")) {
    const personaDir = path.join(playbooksDir, persona);
    for (const fileName of sortedNames(personaDir, "markdown")) {
      const relativePath = `${PLAYBOOKS_RELATIVE_DIR}/${persona}/${fileName}`;
      const parsed = parsePlaybookThroughLibrary(repoRoot, relativePath);
      if (parsed.model.identity.fileForm !== "not-playbook") {
        detected.push({ relativePath, parsed });
      }
    }
  }
  return detected;
}

function parsePlaybookThroughLibrary(
  repoRoot: string,
  relativePath: string,
): ParsePlaybookResult {
  return parseAndValidatePlaybook({
    sourcePath: relativePath,
    source: readTextFile(path.join(repoRoot, relativePath)),
  });
}

function resolvePlaybookFileRef(repoRoot: string, ref: string): string {
  const normalized = normalizeRelativePath(ref);
  if (normalized.endsWith(".md")) {
    const filePath = path.isAbsolute(ref) ? ref : path.resolve(repoRoot, normalized);
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      throw new OperationError(`Playbook path does not exist: ${ref}`);
    }
    return repoRelativePath(filePath, repoRoot) ?? normalized;
  }

  const segments = normalized.split("/").filter(Boolean);
  if (segments.length !== 2) {
    throw new OperationError(
      `Playbook ref must be an explicit \`.md\` path or a canonical \`persona/slug\` reference: ${ref}`,
    );
  }
  const [persona, slug] = segments as [string, string];
  const suffixPath = path.join(repoRoot, PLAYBOOKS_RELATIVE_DIR, persona, `${slug}${PLAYBOOK_FILE_SUFFIX}`);
  if (existsSync(suffixPath)) {
    return `${PLAYBOOKS_RELATIVE_DIR}/${persona}/${slug}${PLAYBOOK_FILE_SUFFIX}`;
  }
  const plainRelativePath = `${PLAYBOOKS_RELATIVE_DIR}/${persona}/${slug}.md`;
  const plainPath = path.join(repoRoot, plainRelativePath);
  if (existsSync(plainPath)) {
    const kind = parsePlaybookThroughLibrary(repoRoot, plainRelativePath).model.frontmatter.kind?.value ?? null;
    if (detectPlaybookFileForm(plainRelativePath, kind) === "deprecated-plain") {
      return plainRelativePath;
    }
  }
  throw new OperationError(`No playbook found for ref \`${ref}\`.`);
}

function buildValidationResult(
  relativePath: string,
  parsed: ParsePlaybookResult,
): PlaybookValidationResult {
  const { model, diagnostics } = parsed;
  return {
    path: relativePath,
    ref: model.identity.canonicalRef,
    fileForm: model.identity.fileForm,
    runnable: model.runnable,
    errorCount: countBySeverity(diagnostics, "error"),
    warningCount: countBySeverity(diagnostics, "warning"),
    diagnostics: diagnostics.map(toValidationDiagnostic),
  };
}

function toValidationDiagnostic(diagnostic: PlaybookDiagnostic): PlaybookValidationDiagnostic {
  return {
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
    hint: diagnostic.hint,
    section: diagnostic.location.section,
    field: diagnostic.location.field,
    span: diagnostic.location.span
      ? {
          startLine: diagnostic.location.span.start.line,
          startColumn: diagnostic.location.span.start.column,
          endLine: diagnostic.location.span.end.line,
          endColumn: diagnostic.location.span.end.column,
        }
      : null,
  };
}

function countBySeverity(
  diagnostics: readonly PlaybookDiagnostic[],
  severity: "error" | "warning",
): number {
  return diagnostics.filter((diagnostic) => diagnostic.severity === severity).length;
}

function sortedNames(directory: string, kind: "directory" | "markdown"): string[] {
  return readdirSync(directory)
    .filter((entry) => {
      const stats = statSync(path.join(directory, entry));
      return kind === "directory" ? stats.isDirectory() : stats.isFile() && entry.endsWith(".md");
    })
    .sort((left, right) => left.localeCompare(right));
}

/**
 * Slug helper re-exported for callers that need the catalog's slug
 * derivation; delegates to the library so the suffix rules live once.
 */
export { playbookSlugFromPath };
