import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { isMap, isScalar, isSeq, parseAllDocuments } from "yaml";
import type { Node, Pair, YAMLMap, YAMLSeq } from "yaml";

export const PRD_AUTHORITY_DIAGNOSTIC_CODES = [
  "PRD-AUTH-001",
  "PRD-AUTH-002",
  "PRD-AUTH-003",
  "PRD-AUTH-004",
  "PRD-AUTH-005",
  "PRD-AUTH-006",
  "PRD-AUTH-007",
  "PRD-AUTH-008",
] as const;

export type PrdAuthorityDiagnosticCode = (typeof PRD_AUTHORITY_DIAGNOSTIC_CODES)[number];

export interface PrdAuthorityDiagnostic {
  code: PrdAuthorityDiagnosticCode;
  severity: "error";
  path: string;
  line: number;
  message: string;
  remediation: string;
}

export interface PrdAuthorityValidationReport {
  status: "passed" | "failed";
  targetRoot: string;
  targetRootStatus: "valid" | "invalid";
  prdRoot: string;
  prdSetStatus: "present" | "absent" | "unsafe";
  prdFilesScanned: number;
  markdownFilesScanned: number;
  structuredFilesScanned: number;
  linksScanned: number;
  diagnostics: PrdAuthorityDiagnostic[];
}

/** Finite editorial stems that cannot also name a product capability subject. */
const FILENAME_EDITORIAL_STEMS = [
  "revise",
  "revision",
  "add",
  "addition",
  "enhance",
  "enhancement",
  "remove",
  "removal",
  "deprecate",
  "deprecation",
  "reconcile",
  "reconciliation",
] as const;

const H1_EDITORIAL_STEMS = [
  "revise",
  "revision",
  "add",
  "addition",
  "enhance",
  "enhancement",
  "remove",
  "removal",
  "deprecate",
  "deprecation",
  "reconcile",
  "reconciliation",
] as const;

/** Index kinds are controlled vocabulary, so ambiguous product nouns are safe to retire here. */
const INDEX_EDITORIAL_KINDS = new Set<string>([
  ...FILENAME_EDITORIAL_STEMS,
  "update",
  "replace",
  "replacement",
  "migrate",
  "migration",
]);
const H1_EDITORIAL_SUBJECTS = new Set<string>(H1_EDITORIAL_STEMS);
const ACTION_PRD_FILE_PATTERN = new RegExp(
  `^\\d{2,}-(?:${FILENAME_EDITORIAL_STEMS.join("|")})(?:-|\\.)`,
  "i",
);

const RETIRED_CHANGE_HEADINGS = new Set([
  "change type",
  "capability addition or enhancement",
  "affected baseline docs",
  "baseline being revised or removed",
  "required baseline annotations",
]);

const AUTHORITY_SECTION_HEADINGS = new Set([
  "source prd docs",
  "source prds",
  "source prd documents",
  "prd authority",
  "product authority",
  "current prd authority",
  "authoritative prds",
  "authoritative prd docs",
  "source authority",
  "authority sources",
  "active authority baseline",
]);

const PROVENANCE_SECTION_HEADINGS = new Set([
  "requirement history",
  "provenance",
  "lineage",
  "source anchors",
  "design provenance",
  "migration provenance",
  "migration history",
  "historical provenance",
  "archive provenance",
]);

/** Keys are normalized by removing punctuation and lowercasing. */
const STRUCTURED_AUTHORITY_FIELD_KEYS = new Set([
  "source",
  "sources",
  "sourcepath",
  "sourcepaths",
  "sourceprd",
  "sourceprds",
  "sourceprdpath",
  "sourceprdpaths",
  "sourceprddoc",
  "sourceprddocs",
  "authority",
  "authorities",
  "authoritypath",
  "authoritypaths",
  "authorityprd",
  "authorityprds",
  "prd",
  "prds",
  "prdpath",
  "prdpaths",
  "prddoc",
  "prddocs",
]);

const STRUCTURED_AUTHORITY_CONTAINER_KEYS = new Set([
  "source",
  "sources",
  "sourceprd",
  "sourceprds",
  "authority",
  "authorities",
  "authorityprd",
  "authorityprds",
  "prd",
  "prds",
]);

const STRUCTURED_PROVENANCE_CONTAINER_KEYS = new Set([
  "requirementhistory",
  "provenance",
  "lineage",
  "designprovenance",
  "migrationprovenance",
  "migrationhistory",
  "historicalprovenance",
  "archiveprovenance",
]);

const STRUCTURED_EXTENSIONS = new Set([".json", ".jsonl", ".yaml", ".yml"]);
const SKIPPED_SCAN_DIRECTORIES = new Set([".git", "node_modules", "dist", "coverage"]);

interface ScanRoot {
  status: "present" | "absent" | "unsafe";
  realPath: string | null;
  reason?: string;
}

interface AuthorityReference {
  target: string;
  line: number;
  context: "frontmatter" | "structured";
}

interface HeadingContext {
  level: number;
  title: string;
}

function posixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function normalizedHeading(value: string): string {
  return value
    .replace(/[`*_]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizedFieldName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function lineNumber(contents: string, index: number): number {
  return contents.slice(0, index).split("\n").length;
}

function isWithinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function inspectScanRoot(targetRoot: string, requestedRoot: string): ScanRoot {
  if (!existsSync(requestedRoot)) {
    return { status: "absent", realPath: null };
  }
  try {
    if (lstatSync(requestedRoot).isSymbolicLink()) {
      return {
        status: "unsafe",
        realPath: null,
        reason: "is a symbolic link",
      };
    }
    const realPath = realpathSync(requestedRoot);
    if (!isWithinRoot(targetRoot, realPath)) {
      return {
        status: "unsafe",
        realPath: null,
        reason: `resolves outside target root to ${realPath}`,
      };
    }
    if (!statSync(realPath).isDirectory()) {
      return { status: "unsafe", realPath: null, reason: "is not a directory" };
    }
    return { status: "present", realPath };
  } catch (error) {
    return {
      status: "unsafe",
      realPath: null,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

function listFiles(
  root: string | null,
  accepts: (fileName: string) => boolean,
  skipDirectories = false,
): string[] {
  if (!root) {
    return [];
  }
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory).sort()) {
      if (skipDirectories && SKIPPED_SCAN_DIRECTORIES.has(entry)) {
        continue;
      }
      const absolutePath = path.join(directory, entry);
      const stats = lstatSync(absolutePath);
      if (stats.isSymbolicLink()) {
        continue;
      }
      if (stats.isDirectory()) {
        visit(absolutePath);
      } else if (stats.isFile() && accepts(entry)) {
        files.push(absolutePath);
      }
    }
  };
  visit(root);
  return files;
}

function markdownFiles(root: string | null): string[] {
  return listFiles(root, (fileName) => fileName.toLowerCase().endsWith(".md"));
}

function structuredFiles(root: string): string[] {
  return listFiles(
    root,
    (fileName) => STRUCTURED_EXTENSIONS.has(path.extname(fileName).toLowerCase()),
    true,
  );
}

function fencedLineMask(lines: string[]): boolean[] {
  const mask: boolean[] = [];
  let fence: "```" | "~~~" | null = null;
  for (const [index, line] of lines.entries()) {
    const marker = line.trimStart().match(/^(```|~~~)/)?.[1] as "```" | "~~~" | undefined;
    mask[index] = fence !== null || marker !== undefined;
    if (marker && fence === null) {
      fence = marker;
    } else if (marker && marker === fence) {
      fence = null;
    }
  }
  return mask;
}

function markdownTableCells(line: string): string[] {
  return line.trimStart().startsWith("|")
    ? line
        .trim()
        .split("|")
        .slice(1, -1)
        .map((cell) => unquote(cell))
    : [];
}

function isTableSeparator(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")));
}

function h1Subject(value: string): string {
  return normalizedHeading(value)
    .replace(/^prd\s+\d+\s*[:.\-–—]?\s*/, "")
    .replace(/^\d+\s*[:.\-–—]?\s*/, "");
}

function unquote(value: string): string {
  return normalizedHeading(value.trim().replace(/^["']|["']$/g, ""));
}

function editorialKind(value: string): string | null {
  const normalized = unquote(value);
  if (INDEX_EDITORIAL_KINDS.has(normalized)) {
    return normalized;
  }
  return normalized
    .split(/[^a-z]+/)
    .find((part) => INDEX_EDITORIAL_KINDS.has(part)) ?? null;
}

function isCanonicalArchiveSource(relativePath: string): boolean {
  const normalized = posixPath(relativePath).toLowerCase();
  return normalized.startsWith("docs/assets/archive/");
}

function resolveMarkdownTarget(
  targetRoot: string,
  sourcePath: string,
  rawTarget: string,
): string | null {
  const withoutWrapper = rawTarget.trim().replace(/^<|>$/g, "");
  const clean = withoutWrapper.split("#", 1)[0]!.split("?", 1)[0]!;
  if (!clean || /^[a-z][a-z0-9+.-]*:/i.test(clean) || clean.startsWith("#")) {
    return null;
  }
  let decoded = clean;
  try {
    decoded = decodeURIComponent(clean);
  } catch {
    // Invalid percent escaping is outside this validator's authority.
  }
  return decoded.startsWith("/")
    ? path.resolve(targetRoot, `.${decoded}`)
    : path.resolve(path.dirname(sourcePath), decoded);
}

function resolveAuthorityFieldTarget(
  targetRoot: string,
  sourcePath: string,
  rawTarget: string,
): string | null {
  const normalized = rawTarget.trim().replace(/^["'`]|["'`]$/g, "");
  if (/^(?:docs\/prd|docs\/assets\/archive\/prds)\//i.test(normalized)) {
    return path.resolve(targetRoot, normalized);
  }
  return resolveMarkdownTarget(targetRoot, sourcePath, normalized);
}

function isActionPrdTarget(targetRoot: string, absoluteTarget: string): boolean {
  const targetRelative = posixPath(path.relative(targetRoot, absoluteTarget)).toLowerCase();
  const inAuthorityTree =
    targetRelative.startsWith("docs/prd/") ||
    targetRelative.startsWith("docs/assets/archive/prds/");
  return inAuthorityTree && ACTION_PRD_FILE_PATTERN.test(path.basename(targetRelative));
}

function addDiagnostic(
  diagnostics: PrdAuthorityDiagnostic[],
  diagnostic: PrdAuthorityDiagnostic,
): void {
  if (
    diagnostics.some(
      (entry) =>
        entry.code === diagnostic.code &&
        entry.path === diagnostic.path &&
        entry.line === diagnostic.line &&
        entry.message === diagnostic.message,
    )
  ) {
    return;
  }
  diagnostics.push(diagnostic);
}

function collectScalarReferences(
  node: Node | null,
  contents: string,
  lineOffset: number,
  context: AuthorityReference["context"],
): AuthorityReference[] {
  if (isScalar(node) && typeof node.value === "string") {
    return [
      {
        target: node.value,
        line: lineNumber(contents, node.range?.[0] ?? 0) + lineOffset,
        context,
      },
    ];
  }
  if (isSeq(node)) {
    return ((node as YAMLSeq).items as Array<Node | null>).flatMap((item) =>
      collectScalarReferences(item, contents, lineOffset, context),
    );
  }
  return [];
}

function yamlAuthorityReferences(
  contents: string,
  context: AuthorityReference["context"],
  lineOffset = 0,
  topLevelPathIsAuthority = false,
): AuthorityReference[] {
  const references: AuthorityReference[] = [];
  const visit = (
    node: Node | null,
    ancestry: string[],
    inAuthorityContainer: boolean,
  ): void => {
    if (isSeq(node)) {
      for (const item of (node as YAMLSeq).items as Array<Node | null>) {
        visit(item, ancestry, inAuthorityContainer);
      }
      return;
    }
    if (!isMap(node)) {
      return;
    }
    for (const pair of (node as YAMLMap).items as Pair[]) {
      const keyNode = pair.key as Node | null;
      if (!isScalar(keyNode)) {
        continue;
      }
      const key = normalizedFieldName(String(keyNode.value));
      const valueNode = (pair.value ?? null) as Node | null;
      const nextAncestry = [...ancestry, key];
      const inProvenance = nextAncestry.some((part) =>
        STRUCTURED_PROVENANCE_CONTAINER_KEYS.has(part),
      );
      if (inProvenance) {
        continue;
      }

      const isTopLevelPath =
        topLevelPathIsAuthority && ancestry.length === 0 && ["path", "paths"].includes(key);
      const isNestedAuthorityPath =
        inAuthorityContainer && ["path", "paths"].includes(key);
      const isNamedAuthorityField = STRUCTURED_AUTHORITY_FIELD_KEYS.has(key);

      if (isTopLevelPath || isNestedAuthorityPath) {
        references.push(...collectScalarReferences(valueNode, contents, lineOffset, context));
      } else if (isNamedAuthorityField && !isMap(valueNode)) {
        references.push(...collectScalarReferences(valueNode, contents, lineOffset, context));
      }

      const nextContainer =
        inAuthorityContainer || STRUCTURED_AUTHORITY_CONTAINER_KEYS.has(key);
      visit(valueNode, nextAncestry, nextContainer);
    }
  };

  for (const document of parseAllDocuments(contents, { prettyErrors: false })) {
    if (document.errors.length === 0) {
      visit((document.contents ?? null) as Node | null, [], false);
    }
  }
  return references;
}

function markdownFrontmatter(lines: string[]): { contents: string; endLineIndex: number } | null {
  if (lines[0]?.trim() !== "---") {
    return null;
  }
  const endLineIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (endLineIndex < 0) {
    return null;
  }
  return { contents: lines.slice(1, endLineIndex).join("\n"), endLineIndex };
}

function validateAuthorityReference(
  diagnostics: PrdAuthorityDiagnostic[],
  targetRoot: string,
  sourcePath: string,
  relativePath: string,
  reference: AuthorityReference,
): void {
  const resolved = resolveAuthorityFieldTarget(targetRoot, sourcePath, reference.target);
  if (!resolved || !isActionPrdTarget(targetRoot, resolved)) {
    return;
  }
  const targetRelative = posixPath(path.relative(targetRoot, resolved));
  addDiagnostic(diagnostics, {
    code: "PRD-AUTH-005",
    severity: "error",
    path: relativePath,
    line: reference.line,
    message: `Active ${reference.context} authority field treats editorial PRD \`${targetRelative}\` as an authority target.`,
    remediation:
      "Point the authority field at the updated capability-named PRD. Keep former paths only in canonical archive or standardized provenance contexts.",
  });
}

function markdownHeadingContexts(
  lines: string[],
  fencedLines: boolean[],
): HeadingContext[][] {
  const contexts: HeadingContext[][] = [];
  const stack: HeadingContext[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!fencedLines[index]) {
      const heading = lines[index]!.match(/^(#{1,6})\s+(.+?)\s*$/);
      if (heading) {
        const level = heading[1]!.length;
        while (stack.at(-1) && stack.at(-1)!.level >= level) {
          stack.pop();
        }
        stack.push({ level, title: normalizedHeading(heading[2]!) });
      }
    }
    contexts[index] = [...stack];
  }
  return contexts;
}

function isIndexDocumentMapContext(
  relativePath: string,
  contexts: HeadingContext[],
): boolean {
  return (
    /^docs\/prd\/(?:.*\/)?\d{2,}-index\.md$/i.test(relativePath) &&
    contexts.some((heading) => heading.level === 2 && heading.title === "document map")
  );
}

function validateIndexDocumentMapKinds(
  diagnostics: PrdAuthorityDiagnostic[],
  relativePath: string,
  lines: string[],
  fencedLines: boolean[],
): void {
  let inDocumentMap = false;
  let kindColumn: number | null = null;
  for (let index = 0; index < lines.length; index += 1) {
    if (fencedLines[index]) {
      continue;
    }
    const heading = lines[index]!.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      const level = heading[1]!.length;
      if (level <= 2) {
        inDocumentMap = level === 2 && normalizedHeading(heading[2]!) === "document map";
      }
      kindColumn = null;
      continue;
    }
    if (!inDocumentMap) {
      continue;
    }
    const cells = markdownTableCells(lines[index]!);
    if (cells.length === 0) {
      kindColumn = null;
      continue;
    }
    if (kindColumn === null) {
      const candidate = cells.findIndex((cell) =>
        ["kind", "document kind", "type"].includes(cell),
      );
      if (candidate >= 0) {
        kindColumn = candidate;
      }
      continue;
    }
    if (isTableSeparator(cells)) {
      continue;
    }
    const retiredKind = cells[kindColumn] ? editorialKind(cells[kindColumn]!) : null;
    if (retiredKind) {
      addDiagnostic(diagnostics, {
        code: "PRD-AUTH-003",
        severity: "error",
        path: relativePath,
        line: index + 1,
        message: `Active PRD index declares retired editorial kind \`${retiredKind}\`.`,
        remediation:
          "Use a product-authority kind such as `capability`, and express change history inside the owning PRD.",
      });
    }
  }
}

function emptyReport(
  targetRoot: string,
  targetRootStatus: PrdAuthorityValidationReport["targetRootStatus"],
  prdSetStatus: PrdAuthorityValidationReport["prdSetStatus"],
  diagnostics: PrdAuthorityDiagnostic[],
): PrdAuthorityValidationReport {
  return {
    status: diagnostics.length === 0 ? "passed" : "failed",
    targetRoot,
    targetRootStatus,
    prdRoot: path.join(targetRoot, "docs", "prd"),
    prdSetStatus,
    prdFilesScanned: 0,
    markdownFilesScanned: 0,
    structuredFilesScanned: 0,
    linksScanned: 0,
    diagnostics,
  };
}

/** Validates product PRD authority without modifying the target project. */
export function validatePrdAuthority(targetRootInput: string): PrdAuthorityValidationReport {
  const requestedTargetRoot = path.resolve(targetRootInput);
  const diagnostics: PrdAuthorityDiagnostic[] = [];
  if (!existsSync(requestedTargetRoot)) {
    addDiagnostic(diagnostics, {
      code: "PRD-AUTH-007",
      severity: "error",
      path: ".",
      line: 1,
      message: `Target root does not exist: ${requestedTargetRoot}`,
      remediation: "Pass an existing project directory with `--target-root`.",
    });
    return emptyReport(requestedTargetRoot, "invalid", "absent", diagnostics);
  }

  let targetRoot: string;
  try {
    targetRoot = realpathSync(requestedTargetRoot);
    if (!statSync(targetRoot).isDirectory()) {
      throw new Error("target root is not a directory");
    }
  } catch (error) {
    addDiagnostic(diagnostics, {
      code: "PRD-AUTH-007",
      severity: "error",
      path: ".",
      line: 1,
      message: `Target root is invalid: ${error instanceof Error ? error.message : String(error)}`,
      remediation: "Pass a readable project directory with `--target-root`.",
    });
    return emptyReport(requestedTargetRoot, "invalid", "absent", diagnostics);
  }

  const requestedPrdRoot = path.join(targetRoot, "docs", "prd");
  const requestedDocsRoot = path.join(targetRoot, "docs");
  const prdScanRoot = inspectScanRoot(targetRoot, requestedPrdRoot);
  const docsScanRoot = inspectScanRoot(targetRoot, requestedDocsRoot);
  if (prdScanRoot.status === "unsafe") {
    addDiagnostic(diagnostics, {
      code: "PRD-AUTH-008",
      severity: "error",
      path: "docs/prd",
      line: 1,
      message: `PRD scan root is unsafe: ${prdScanRoot.reason ?? "unknown boundary error"}.`,
      remediation: "Use a real directory contained by the target root; do not point `docs/prd` outside the project.",
    });
  }
  if (docsScanRoot.status === "unsafe") {
    addDiagnostic(diagnostics, {
      code: "PRD-AUTH-008",
      severity: "error",
      path: "docs",
      line: 1,
      message: `Documentation scan root is unsafe: ${docsScanRoot.reason ?? "unknown boundary error"}.`,
      remediation: "Use a real documentation directory contained by the target root.",
    });
  }

  const prdFiles = markdownFiles(prdScanRoot.realPath);
  for (const absolutePath of prdFiles) {
    const relativePath = posixPath(path.relative(targetRoot, absolutePath));
    const fileName = path.basename(absolutePath);
    const contents = readFileSync(absolutePath, "utf8");
    const lines = contents.split(/\r?\n/);
    const fencedLines = fencedLineMask(lines);
    const frontmatter = markdownFrontmatter(lines);

    if (ACTION_PRD_FILE_PATTERN.test(fileName)) {
      addDiagnostic(diagnostics, {
        code: "PRD-AUTH-001",
        severity: "error",
        path: relativePath,
        line: 1,
        message: `Active PRD filename \`${fileName}\` encodes an editorial operation.`,
        remediation:
          "Move the current requirement into its owning product PRD, or create a capability-named PRD only when the subject is genuinely new.",
      });
    }

    if (frontmatter) {
      for (let index = 1; index < frontmatter.endLineIndex; index += 1) {
        const coordinate = lines[index]!.match(/^coordinate\s*:/i);
        if (coordinate) {
          addDiagnostic(diagnostics, {
            code: "PRD-AUTH-006",
            severity: "error",
            path: relativePath,
            line: index + 1,
            message: "Active product PRD uses a work-revision coordinate as document identity.",
            remediation:
              "Remove top-level `coordinate`; retain W/R/P coordinates only in Requirement History entries and source links.",
          });
        }
        const kind = lines[index]!.match(/^kind\s*:\s*(.+?)\s*$/i);
        const retiredKind = kind ? editorialKind(kind[1]!) : null;
        if (retiredKind) {
          addDiagnostic(diagnostics, {
            code: "PRD-AUTH-003",
            severity: "error",
            path: relativePath,
            line: index + 1,
            message: `Active PRD frontmatter declares retired editorial kind \`${retiredKind}\`.`,
            remediation:
              "Use a product-authority kind such as `prd`, and express change history inside the owning PRD.",
          });
        }
      }
    }

    const h1Start = frontmatter ? frontmatter.endLineIndex + 1 : 0;
    const firstH1Index = lines.findIndex(
      (line, index) => index >= h1Start && !fencedLines[index] && /^#\s+\S/.test(line),
    );
    if (firstH1Index >= 0) {
      const subject = h1Subject(lines[firstH1Index]!.replace(/^#\s+/, ""));
      const firstWord = subject.match(/^[a-z]+/)?.[0];
      if (firstWord && H1_EDITORIAL_SUBJECTS.has(firstWord)) {
        addDiagnostic(diagnostics, {
          code: "PRD-AUTH-002",
          severity: "error",
          path: relativePath,
          line: firstH1Index + 1,
          message: `Active PRD H1 begins with prohibited editorial term \`${firstWord}\`.`,
          remediation: "Title the PRD for the product capability or authority it owns.",
        });
      }
    }

    for (let index = 0; index < lines.length; index += 1) {
      if (fencedLines[index]) {
        continue;
      }
      const heading = lines[index]!.match(/^#{2,6}\s+(.+?)\s*$/);
      if (heading && RETIRED_CHANGE_HEADINGS.has(normalizedHeading(heading[1]!))) {
        addDiagnostic(diagnostics, {
          code: "PRD-AUTH-004",
          severity: "error",
          path: relativePath,
          line: index + 1,
          message: `Heading \`${heading[1]}\` belongs to a retired editorial change-record template.`,
          remediation:
            "State the current normative requirement inline and preserve prior iterations under `## Requirement History`.",
        });
      }
    }

    if (/^\d{2,}-index\.md$/i.test(fileName)) {
      validateIndexDocumentMapKinds(diagnostics, relativePath, lines, fencedLines);
    }
  }

  let linksScanned = 0;
  const markdownDocs = markdownFiles(docsScanRoot.realPath);
  for (const absolutePath of markdownDocs) {
    const relativePath = posixPath(path.relative(targetRoot, absolutePath));
    if (isCanonicalArchiveSource(relativePath)) {
      continue;
    }
    const contents = readFileSync(absolutePath, "utf8");
    const lines = contents.split(/\r?\n/);
    const fencedLines = fencedLineMask(lines);
    const contexts = markdownHeadingContexts(lines, fencedLines);
    const frontmatter = markdownFrontmatter(lines);
    if (frontmatter) {
      const references = yamlAuthorityReferences(
        frontmatter.contents,
        "frontmatter",
        1,
        true,
      );
      linksScanned += references.length;
      for (const reference of references) {
        validateAuthorityReference(
          diagnostics,
          targetRoot,
          absolutePath,
          relativePath,
          reference,
        );
      }
    }

    const linkPattern = /(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^)]*["'])?\)/g;
    for (let index = 0; index < lines.length; index += 1) {
      if (fencedLines[index]) {
        continue;
      }
      const lineContexts = contexts[index] ?? [];
      const isProvenance = lineContexts.some((heading) =>
        PROVENANCE_SECTION_HEADINGS.has(heading.title),
      );
      const isAuthority =
        lineContexts.some((heading) => AUTHORITY_SECTION_HEADINGS.has(heading.title)) ||
        isIndexDocumentMapContext(relativePath, lineContexts);
      if (!isAuthority || isProvenance) {
        continue;
      }
      for (const match of lines[index]!.matchAll(linkPattern)) {
        linksScanned += 1;
        const resolved = resolveMarkdownTarget(targetRoot, absolutePath, match[1]!);
        if (!resolved || !isActionPrdTarget(targetRoot, resolved)) {
          continue;
        }
        const targetRelative = posixPath(path.relative(targetRoot, resolved));
        addDiagnostic(diagnostics, {
          code: "PRD-AUTH-005",
          severity: "error",
          path: relativePath,
          line: index + 1,
          message: `Active Markdown authority link treats editorial PRD \`${targetRelative}\` as an authority target.`,
          remediation:
            "Link to the updated capability-named PRD. Keep former links only in canonical archive or standardized provenance contexts.",
        });
      }
    }
  }

  const structuredDocs = structuredFiles(targetRoot);
  for (const absolutePath of structuredDocs) {
    const relativePath = posixPath(path.relative(targetRoot, absolutePath));
    if (isCanonicalArchiveSource(relativePath)) {
      continue;
    }
    const contents = readFileSync(absolutePath, "utf8");
    const references: AuthorityReference[] = [];
    if (path.extname(absolutePath).toLowerCase() === ".jsonl") {
      for (const [index, line] of contents.split(/\r?\n/).entries()) {
        if (line.trim()) {
          references.push(...yamlAuthorityReferences(line, "structured", index));
        }
      }
    } else {
      references.push(...yamlAuthorityReferences(contents, "structured"));
    }
    linksScanned += references.length;
    for (const reference of references) {
      validateAuthorityReference(
        diagnostics,
        targetRoot,
        absolutePath,
        relativePath,
        reference,
      );
    }
  }

  diagnostics.sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.line - right.line ||
      left.code.localeCompare(right.code),
  );
  return {
    status: diagnostics.length === 0 ? "passed" : "failed",
    targetRoot: requestedTargetRoot,
    targetRootStatus: "valid",
    prdRoot: path.join(requestedTargetRoot, "docs", "prd"),
    prdSetStatus: prdScanRoot.status,
    prdFilesScanned: prdFiles.length,
    markdownFilesScanned: markdownDocs.length,
    structuredFilesScanned: structuredDocs.length,
    linksScanned,
    diagnostics,
  };
}

export function isActionPrefixedPrdFilename(fileName: string): boolean {
  return ACTION_PRD_FILE_PATTERN.test(fileName);
}
