import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";
import { normalizeRelativePath, readTextFile } from "../../utils";
import { findRepoRoot, repoRelativePath } from "../shared";
import { OperationError, type JsonValue } from "../types";
import type {
  OperationDomainDescriptor,
  OperationResult,
} from "../types";

export const PLAYBOOKS_RELATIVE_DIR = "docs/assets/playbooks";
export const PLAYBOOK_STACKS = ["build", "run"] as const;

export type PlaybookStack = (typeof PLAYBOOK_STACKS)[number];
export type PlaybookSelectionMode = "explicit-path" | "qualified-ref" | "bare-ref";

export interface PlaybookCatalogEntry {
  path: string;
  persona: string;
  slug: string;
  ref: string;
  stack: PlaybookStack;
  title: string;
  summary: string;
  status: string;
}

export interface PlaybookCatalog {
  repoRoot: string;
  playbooksDir: string;
  entries: PlaybookCatalogEntry[];
  diagnostics: Array<{ path: string; message: string }>;
}

export interface PlaybookResolution {
  repoRoot: string;
  ref: string;
  requestedStack: PlaybookStack | null;
  mode: PlaybookSelectionMode;
  entry: PlaybookCatalogEntry;
  candidates: PlaybookCatalogEntry[];
}

export const playbookDomain: OperationDomainDescriptor = {
  name: "playbook",
  summary: "Run Playbook resolver, catalog, capability, and state operations.",
  commands: [
    {
      name: "playbook-catalog",
      summary: "List valid playbooks with persona, slug, stack, title, and summary metadata.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "playbook-resolve",
      summary: "Resolve an explicit path, persona/slug, or unique bare playbook reference.",
      mutates: false,
      renderModes: ["json"],
    },
  ],
};

export function buildPlaybookCatalog(input: {
  repoRoot?: string;
} = {}): PlaybookCatalog {
  const repoRoot = findRepoRoot(input.repoRoot);
  const playbooksDir = path.join(repoRoot, PLAYBOOKS_RELATIVE_DIR);
  const entries: PlaybookCatalogEntry[] = [];
  const diagnostics: PlaybookCatalog["diagnostics"] = [];

  if (!existsSync(playbooksDir)) {
    return {
      repoRoot,
      playbooksDir: PLAYBOOKS_RELATIVE_DIR,
      entries,
      diagnostics,
    };
  }

  for (const persona of sortedDirectoryNames(playbooksDir)) {
    const personaDir = path.join(playbooksDir, persona);
    for (const fileName of sortedMarkdownFiles(personaDir)) {
      const filePath = path.join(personaDir, fileName);
      const parsed = parsePlaybookFile(filePath, repoRoot);
      if (parsed.entry) {
        entries.push(parsed.entry);
      }
      diagnostics.push(...parsed.diagnostics);
    }
  }

  return {
    repoRoot,
    playbooksDir: PLAYBOOKS_RELATIVE_DIR,
    entries: entries.sort((left, right) => left.ref.localeCompare(right.ref)),
    diagnostics,
  };
}

export function resolvePlaybook(input: {
  repoRoot?: string;
  ref: string;
  requestedStack?: string | null;
}): PlaybookResolution {
  const repoRoot = findRepoRoot(input.repoRoot);
  const ref = normalizeReference(input.ref);
  const requestedStack = parseRequestedStack(input.requestedStack);

  if (isExplicitPath(ref)) {
    const entry = parseExplicitPlaybookPath(repoRoot, ref);
    assertRequestedStack(entry, requestedStack);
    return {
      repoRoot,
      ref,
      requestedStack,
      mode: "explicit-path",
      entry,
      candidates: [entry],
    };
  }

  const catalog = buildPlaybookCatalog({ repoRoot });
  const qualified = parseQualifiedRef(ref);
  if (qualified) {
    const match = catalog.entries.find(
      (entry) => entry.persona === qualified.persona && entry.slug === qualified.slug,
    );
    if (!match) {
      throw new OperationError(`No playbook found for qualified ref \`${ref}\`.`);
    }
    assertRequestedStack(match, requestedStack);
    return {
      repoRoot,
      ref,
      requestedStack,
      mode: "qualified-ref",
      entry: match,
      candidates: [match],
    };
  }

  const normalized = normalizeBareToken(ref);
  const candidates = catalog.entries.filter(
    (entry) => entry.slug === ref || normalizeBareToken(entry.title) === normalized,
  );
  if (candidates.length === 0) {
    throw new OperationError(`No playbook found for bare ref \`${ref}\`.`);
  }

  const stackMatches = requestedStack
    ? candidates.filter((candidate) => candidate.stack === requestedStack)
    : candidates;
  if (stackMatches.length === 0) {
    throw new OperationError(
      `Playbook ref \`${ref}\` does not match requested stack \`${requestedStack}\`. Candidates: ${formatCandidates(candidates)}.`,
    );
  }
  if (stackMatches.length > 1) {
    throw new OperationError(
      `Ambiguous playbook ref \`${ref}\`; provide persona/slug and, if needed, a stack. Candidates: ${formatCandidates(stackMatches)}.`,
    );
  }

  return {
    repoRoot,
    ref,
    requestedStack,
    mode: "bare-ref",
    entry: stackMatches[0]!,
    candidates,
  };
}

export function readPlaybookCatalog(input: { repoRoot?: string } = {}): OperationResult<JsonValue> {
  return {
    value: buildPlaybookCatalog(input) as unknown as JsonValue,
    provenance: {
      domain: "playbook",
      operation: "playbook-catalog",
      source: "shared",
      target: input.repoRoot,
    },
  };
}

export function readPlaybookResolution(input: {
  repoRoot?: string;
  ref: string;
  requestedStack?: string | null;
}): OperationResult<JsonValue> {
  return {
    value: resolvePlaybook(input) as unknown as JsonValue,
    provenance: {
      domain: "playbook",
      operation: "playbook-resolve",
      source: "shared",
      target: input.ref,
    },
  };
}

function parsePlaybookFile(
  filePath: string,
  repoRoot: string,
): { entry: PlaybookCatalogEntry | null; diagnostics: Array<{ path: string; message: string }> } {
  const relativePath = repoRelativePath(filePath, repoRoot) ?? normalizeRelativePath(filePath);
  const diagnostics: Array<{ path: string; message: string }> = [];
  const metadata = parseFrontmatter(readTextFile(filePath));
  if (!metadata) {
    return {
      entry: null,
      diagnostics: [{ path: relativePath, message: "Playbook file is missing YAML frontmatter." }],
    };
  }

  const pathParts = normalizeRelativePath(relativePath).split("/");
  const persona = pathParts.at(-2) ?? "";
  const slug = path.basename(filePath, ".md");
  const kind = stringField(metadata, "kind");
  const stack = stringField(metadata, "stack");
  const title = stringField(metadata, "title");
  const summary = stringField(metadata, "summary");
  const status = stringField(metadata, "status") ?? "unknown";

  if (kind !== "playbook") {
    diagnostics.push({ path: relativePath, message: "Playbook frontmatter must declare kind: playbook." });
  }
  if (!title) {
    diagnostics.push({ path: relativePath, message: "Playbook frontmatter must include title." });
  }
  if (!summary) {
    diagnostics.push({ path: relativePath, message: "Playbook frontmatter must include summary." });
  }
  if (!PLAYBOOK_STACKS.includes(stack as PlaybookStack)) {
    diagnostics.push({ path: relativePath, message: "Playbook frontmatter must declare stack: build or stack: run." });
  }
  if (stringField(metadata, "persona") !== persona) {
    diagnostics.push({ path: relativePath, message: "Playbook persona frontmatter must match its directory." });
  }
  if (path.dirname(relativePath) !== `${PLAYBOOKS_RELATIVE_DIR}/${persona}`) {
    diagnostics.push({
      path: relativePath,
      message: `Playbook must live directly under ${PLAYBOOKS_RELATIVE_DIR}/<persona>/<slug>.md.`,
    });
  }

  if (diagnostics.length > 0) {
    return { entry: null, diagnostics };
  }

  return {
    entry: {
      path: relativePath,
      persona,
      slug,
      ref: `${persona}/${slug}`,
      stack: stack as PlaybookStack,
      title: title!,
      summary: summary!,
      status,
    },
    diagnostics: [],
  };
}

function parseExplicitPlaybookPath(repoRoot: string, value: string): PlaybookCatalogEntry {
  const filePath = path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
  if (!existsSync(filePath)) {
    throw new OperationError(`Playbook path does not exist: ${value}`);
  }
  if (!statSync(filePath).isFile()) {
    throw new OperationError(`Playbook path is not a file: ${value}`);
  }
  const parsed = parsePlaybookFile(filePath, repoRoot);
  if (!parsed.entry) {
    throw new OperationError(
      `Invalid playbook metadata for ${value}: ${parsed.diagnostics.map((diagnostic) => diagnostic.message).join(" ")}`,
    );
  }
  return parsed.entry;
}

function parseFrontmatter(markdown: string): Record<string, unknown> | null {
  if (!markdown.startsWith("---\n")) {
    return null;
  }
  const frontmatterEnd = markdown.indexOf("\n---\n", "---\n".length);
  if (frontmatterEnd === -1) {
    return null;
  }
  const frontmatterText = markdown.slice("---\n".length, frontmatterEnd);
  const document = parseDocument(frontmatterText);
  if (document.errors.length > 0) {
    return null;
  }
  const value = document.toJSON();
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function sortedDirectoryNames(directory: string): string[] {
  return readdirSync(directory)
    .filter((entry) => statSync(path.join(directory, entry)).isDirectory())
    .sort((left, right) => left.localeCompare(right));
}

function sortedMarkdownFiles(directory: string): string[] {
  return readdirSync(directory)
    .filter((entry) => entry.endsWith(".md") && statSync(path.join(directory, entry)).isFile())
    .sort((left, right) => left.localeCompare(right));
}

function stringField(value: Record<string, unknown>, key: string): string | null {
  const field = value[key];
  return typeof field === "string" && field.trim() ? field.trim() : null;
}

function normalizeReference(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new OperationError("Playbook ref is required.");
  }
  return normalizeRelativePath(trimmed);
}

function parseRequestedStack(value: string | null | undefined): PlaybookStack | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (!PLAYBOOK_STACKS.includes(value as PlaybookStack)) {
    throw new OperationError("Requested playbook stack must be `build` or `run`.");
  }
  return value as PlaybookStack;
}

function isExplicitPath(value: string): boolean {
  return path.isAbsolute(value) ||
    value.startsWith(".") ||
    value.endsWith(".md") ||
    value.startsWith(`${PLAYBOOKS_RELATIVE_DIR}/`);
}

function parseQualifiedRef(value: string): { persona: string; slug: string } | null {
  const parts = value.split("/");
  return parts.length === 2 && !value.endsWith(".md")
    ? { persona: parts[0]!, slug: parts[1]! }
    : null;
}

function normalizeBareToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function assertRequestedStack(entry: PlaybookCatalogEntry, requestedStack: PlaybookStack | null): void {
  if (requestedStack && entry.stack !== requestedStack) {
    throw new OperationError(
      `Playbook \`${entry.ref}\` has stack \`${entry.stack}\`, but \`${requestedStack}\` was requested.`,
    );
  }
}

function formatCandidates(candidates: PlaybookCatalogEntry[]): string {
  return candidates
    .map((candidate) => `${candidate.ref} (${candidate.stack})`)
    .join(", ");
}
