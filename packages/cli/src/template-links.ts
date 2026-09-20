import path from "node:path";
import { parseSystemResourceUri } from "./operations/resource";

export type TemplateLinkDiagnosticCode =
  | "unknown-whole-link-token"
  | "partial-link-token"
  | "unresolved-rendered-link-token"
  | "invalid-link-replacement"
  | "invalid-relative-link"
  | "missing-relative-link-target"
  | "unsupported-uri-scheme"
  | "invalid-external-uri"
  | "invalid-system-resource-uri"
  | "unknown-system-resource-uri";

export interface TemplateLinkDiagnostic {
  code: TemplateLinkDiagnosticCode;
  templatePath: string;
  message: string;
}

export interface TemplateLinkDocument {
  templatePath: string;
  renderedPath: string;
  contents: string;
  allowedWholeLinkTokens?: readonly string[];
  nonLinkTokens?: readonly string[];
  representativeReplacements?: Readonly<Record<string, string>>;
}

export interface ValidateTemplateLinksInput {
  documents: readonly TemplateLinkDocument[];
  targetExists: (projectRelativePath: string) => boolean;
  systemResourceUris: ReadonlySet<string>;
}

const TOKEN_PATTERN = /\{\{([A-Z0-9_]+)\}\}/g;
const MARKDOWN_LINK_PATTERN = /!?\[[^\]\n]*\]\(([^)\n]+)\)/g;
const LINK_NAME_PATTERN = /(?:^|_)(?:LINK|LINKS)(?:$|_)/;
const URI_SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):/i;
export const APPROVED_EXTERNAL_URI_SCHEMES = new Set(["http", "https", "mailto"]);

export function validateTemplateLinks(
  input: ValidateTemplateLinksInput,
): TemplateLinkDiagnostic[] {
  const diagnostics: TemplateLinkDiagnostic[] = [];

  for (const document of input.documents) {
    const allowed = new Set(document.allowedWholeLinkTokens ?? []);
    const nonLinkTokens = new Set(document.nonLinkTokens ?? []);
    const replacements = document.representativeReplacements ?? {};
    const rawTokens = listTokens(document.contents);

    for (const token of rawTokens) {
      if (LINK_NAME_PATTERN.test(token) && !allowed.has(token) && !nonLinkTokens.has(token)) {
        diagnostics.push({
          code: "unknown-whole-link-token",
          templatePath: document.templatePath,
          message: `Unknown whole-link token {{${token}}}.`,
        });
      }
    }

    for (const link of listMarkdownLinks(document.contents)) {
      if (link.full.includes("{{")) {
        diagnostics.push({
          code: "partial-link-token",
          templatePath: document.templatePath,
          message: `Markdown links must not contain partial tokens: ${link.full}`,
        });
        continue;
      }
      validateTarget(document, link.target, input, diagnostics);
    }

    let rendered = document.contents;
    for (const token of allowed) {
      const replacement = replacements[token];
      if (replacement === undefined || listMarkdownLinks(replacement).length === 0) {
        diagnostics.push({
          code: "invalid-link-replacement",
          templatePath: document.templatePath,
          message: `Whole-link token {{${token}}} needs a representative Markdown-link replacement.`,
        });
        continue;
      }
      rendered = rendered.replaceAll(`{{${token}}}`, replacement);
    }

    for (const token of listTokens(rendered)) {
      if (LINK_NAME_PATTERN.test(token) && !nonLinkTokens.has(token)) {
        diagnostics.push({
          code: "unresolved-rendered-link-token",
          templatePath: document.templatePath,
          message: `Rendered output still contains link token {{${token}}}.`,
        });
      }
    }

    for (const link of listMarkdownLinks(rendered)) {
      if (link.full.includes("{{")) {
        diagnostics.push({
          code: "unresolved-rendered-link-token",
          templatePath: document.templatePath,
          message: `Rendered Markdown link still contains a token: ${link.full}`,
        });
        continue;
      }
      validateTarget(document, link.target, input, diagnostics);
    }
  }

  return deduplicateDiagnostics(diagnostics);
}

function listTokens(contents: string): string[] {
  return [...contents.matchAll(TOKEN_PATTERN)].map((match) => match[1]);
}

function listMarkdownLinks(contents: string): Array<{ full: string; target: string }> {
  return [...contents.matchAll(MARKDOWN_LINK_PATTERN)].map((match) => ({
    full: match[0],
    target: match[1].trim().replace(/^<|>$/g, ""),
  }));
}

function validateTarget(
  document: TemplateLinkDocument,
  target: string,
  input: ValidateTemplateLinksInput,
  diagnostics: TemplateLinkDiagnostic[],
): void {
  if (target.startsWith("#")) {
    return;
  }

  const schemeMatch = target.match(URI_SCHEME_PATTERN);
  if (schemeMatch) {
    validateUri(document, target, schemeMatch[1].toLowerCase(), input, diagnostics);
    return;
  }

  const pathOnly = target.split("#", 1)[0].split("?", 1)[0];
  if (!pathOnly) {
    return;
  }
  if (path.posix.isAbsolute(pathOnly)) {
    diagnostics.push({
      code: "invalid-relative-link",
      templatePath: document.templatePath,
      message: `Project-document link must be relative: ${target}`,
    });
    return;
  }

  const resolved = path.posix.normalize(
    path.posix.join(path.posix.dirname(document.renderedPath), pathOnly),
  );
  if (!input.targetExists(resolved)) {
    diagnostics.push({
      code: "missing-relative-link-target",
      templatePath: document.templatePath,
      message: `Rendered relative link target does not exist: ${resolved}`,
    });
  }
}

function validateUri(
  document: TemplateLinkDocument,
  target: string,
  scheme: string,
  input: ValidateTemplateLinksInput,
  diagnostics: TemplateLinkDiagnostic[],
): void {
  if (scheme === "make-docs") {
    const parsed = parseSystemResourceUri(target);
    if (!parsed.ok) {
      diagnostics.push({
        code: "invalid-system-resource-uri",
        templatePath: document.templatePath,
        message: `Invalid Make Docs system-resource URI: ${target}`,
      });
      return;
    }
    if (!input.systemResourceUris.has(parsed.value.uri)) {
      diagnostics.push({
        code: "unknown-system-resource-uri",
        templatePath: document.templatePath,
        message: `Make Docs system-resource URI is absent from the provider inventory: ${target}`,
      });
    }
    return;
  }

  if (!APPROVED_EXTERNAL_URI_SCHEMES.has(scheme)) {
    diagnostics.push({
      code: "unsupported-uri-scheme",
      templatePath: document.templatePath,
      message: `Unsupported Markdown-link URI scheme '${scheme}': ${target}`,
    });
    return;
  }

  try {
    const parsed = new URL(target);
    const valid =
      scheme === "mailto"
        ? parsed.pathname.length > 0
        : parsed.hostname.length > 0 && parsed.username.length === 0 && parsed.password.length === 0;
    if (!valid) {
      throw new Error("URI is incomplete");
    }
  } catch {
    diagnostics.push({
      code: "invalid-external-uri",
      templatePath: document.templatePath,
      message: `Malformed approved external URI: ${target}`,
    });
  }
}

function deduplicateDiagnostics(
  diagnostics: readonly TemplateLinkDiagnostic[],
): TemplateLinkDiagnostic[] {
  const seen = new Set<string>();
  return diagnostics.filter((diagnostic) => {
    const key = `${diagnostic.code}\0${diagnostic.templatePath}\0${diagnostic.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
