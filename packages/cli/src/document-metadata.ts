export const GENERATED_DOCUMENT_KINDS = [
  "design",
  "plan",
  "prd",
  "work",
  "history",
  "guide",
  "playbook",
] as const;

export const FOLLOW_ON_ROUTES = [
  "baseline-plan",
  "change-plan",
  "prd-generation",
  "work-backlog-generation",
  "implementation-loop",
] as const;

export const LIFECYCLE_DEPARTURES = [
  "none",
  "source-to-design-straddle",
  "skip",
  "reorder",
  "revisit",
] as const;

export const SOURCE_TYPES = [
  "design",
  "plan",
  "prd",
  "work",
  "history",
  "artifact-roadmap",
  "artifact-seed",
  "implementation-closeout",
  "manual-request",
] as const;

export type MetadataScalar = string;
export type MetadataMap = Record<string, MetadataScalar | Record<string, MetadataScalar>>;

export interface ParsedDocumentMetadata {
  body: string;
  frontmatter: MetadataMap | null;
}

export interface FollowOnHandoff {
  route?: string;
  next_prompt?: string;
  why?: string;
  coordinate_handoff?: string;
}

export interface MetadataValidationFinding {
  code:
    | "invalid-kind"
    | "invalid-route"
    | "invalid-source-type"
    | "invalid-lifecycle-departure"
    | "follow-on-metadata-missing"
    | "follow-on-body-missing"
    | "follow-on-route-mismatch"
    | "follow-on-next-prompt-mismatch"
    | "follow-on-why-mismatch"
    | "follow-on-coordinate-handoff-mismatch";
  field: string;
  message: string;
}

const FRONTMATTER_BOUNDARY = "---\n";
const YAML_OBJECT_RE = /^([A-Za-z_][A-Za-z0-9_]*):\s*$/;
const YAML_SCALAR_RE = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.+?)\s*$/;
const YAML_NESTED_SCALAR_RE = /^\s{2}([A-Za-z_][A-Za-z0-9_]*):\s*(.+?)\s*$/;
const INTENDED_FOLLOW_ON_HEADING_RE = /^## Intended Follow-On\s*$/m;
const NEXT_PROMPT_LINK_RE = /\[[^\]]+\]\(([^)]+)\)/;

function stripYamlScalar(value: string): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function normalizeBodyValue(value: string): string {
  return value.trim().replace(/^`|`$/g, "").replace(/\s+/g, " ");
}

function normalizeComparison(value: string | undefined): string {
  return normalizeBodyValue(value ?? "");
}

function metadataObject(value: MetadataScalar | Record<string, MetadataScalar> | undefined) {
  return typeof value === "object" && value !== null ? value : null;
}

function addFinding(
  findings: MetadataValidationFinding[],
  code: MetadataValidationFinding["code"],
  field: string,
  message: string,
): void {
  findings.push({ code, field, message });
}

export function parseDocumentMetadata(markdown: string): ParsedDocumentMetadata {
  if (!markdown.startsWith(FRONTMATTER_BOUNDARY)) {
    return { body: markdown, frontmatter: null };
  }

  const frontmatterEnd = markdown.indexOf("\n---\n", FRONTMATTER_BOUNDARY.length);
  if (frontmatterEnd === -1) {
    return { body: markdown, frontmatter: null };
  }

  const frontmatterText = markdown.slice(FRONTMATTER_BOUNDARY.length, frontmatterEnd);
  const body = markdown.slice(frontmatterEnd + "\n---\n".length);
  const frontmatter: MetadataMap = {};
  let activeObject: Record<string, MetadataScalar> | null = null;

  for (const line of frontmatterText.split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) {
      continue;
    }

    const nested = YAML_NESTED_SCALAR_RE.exec(line);
    if (nested && activeObject) {
      activeObject[nested[1]] = stripYamlScalar(nested[2]);
      continue;
    }

    const object = YAML_OBJECT_RE.exec(line);
    if (object) {
      activeObject = {};
      frontmatter[object[1]] = activeObject;
      continue;
    }

    const scalar = YAML_SCALAR_RE.exec(line);
    if (scalar) {
      activeObject = null;
      frontmatter[scalar[1]] = stripYamlScalar(scalar[2]);
    }
  }

  return { body, frontmatter };
}

export function extractIntendedFollowOn(body: string): FollowOnHandoff | null {
  const heading = INTENDED_FOLLOW_ON_HEADING_RE.exec(body);
  if (!heading) {
    return null;
  }

  const sectionStart = heading.index + heading[0].length;
  const nextHeading = body.slice(sectionStart).search(/^## /m);
  const section =
    nextHeading === -1
      ? body.slice(sectionStart)
      : body.slice(sectionStart, sectionStart + nextHeading);
  const handoff: FollowOnHandoff = {};

  for (const rawLine of section.split("\n")) {
    const line = rawLine.trim();
    if (!line.startsWith("- ")) {
      continue;
    }

    const [, label, value = ""] = /^-\s+([^:]+):\s*(.*)$/.exec(line) ?? [];
    if (!label) {
      continue;
    }

    const normalizedLabel = label.toLowerCase();
    if (normalizedLabel === "route") {
      handoff.route = normalizeBodyValue(value);
    } else if (normalizedLabel === "next prompt" || normalizedLabel === "next step") {
      const link = NEXT_PROMPT_LINK_RE.exec(value);
      handoff.next_prompt = normalizeBodyValue(link?.[1] ?? value);
    } else if (normalizedLabel === "why") {
      handoff.why = normalizeBodyValue(value);
    } else if (normalizedLabel === "coordinate handoff") {
      handoff.coordinate_handoff = normalizeBodyValue(value);
    }
  }

  return handoff;
}

export function validateGeneratedDocumentMetadata(markdown: string): MetadataValidationFinding[] {
  const { body, frontmatter } = parseDocumentMetadata(markdown);
  const findings: MetadataValidationFinding[] = [];

  if (!frontmatter) {
    return findings;
  }

  const kind = typeof frontmatter.kind === "string" ? frontmatter.kind : undefined;
  if (kind && !GENERATED_DOCUMENT_KINDS.includes(kind as (typeof GENERATED_DOCUMENT_KINDS)[number])) {
    addFinding(findings, "invalid-kind", "kind", `Unsupported generated document kind: ${kind}.`);
  }

  const source = metadataObject(frontmatter.source);
  const sourceType = source?.type;
  if (sourceType && !SOURCE_TYPES.includes(sourceType as (typeof SOURCE_TYPES)[number])) {
    addFinding(
      findings,
      "invalid-source-type",
      "source.type",
      `Unsupported generated document source type: ${sourceType}.`,
    );
  }

  const lifecycle = metadataObject(frontmatter.lifecycle);
  const departure = lifecycle?.departure;
  if (
    departure &&
    !LIFECYCLE_DEPARTURES.includes(departure as (typeof LIFECYCLE_DEPARTURES)[number])
  ) {
    addFinding(
      findings,
      "invalid-lifecycle-departure",
      "lifecycle.departure",
      `Unsupported lifecycle departure: ${departure}.`,
    );
  }

  const metadataFollowOn = metadataObject(frontmatter.follow_on);
  const bodyFollowOn = extractIntendedFollowOn(body);

  if (bodyFollowOn && !metadataFollowOn) {
    addFinding(
      findings,
      "follow-on-metadata-missing",
      "follow_on",
      "Body contains an Intended Follow-On section without follow_on metadata.",
    );
    return findings;
  }

  if (metadataFollowOn && !bodyFollowOn) {
    addFinding(
      findings,
      "follow-on-body-missing",
      "## Intended Follow-On",
      "follow_on metadata requires a matching Intended Follow-On body section.",
    );
    return findings;
  }

  if (!metadataFollowOn || !bodyFollowOn) {
    return findings;
  }

  const route = metadataFollowOn.route;
  if (route && !FOLLOW_ON_ROUTES.includes(route as (typeof FOLLOW_ON_ROUTES)[number])) {
    addFinding(findings, "invalid-route", "follow_on.route", `Unsupported follow-on route: ${route}.`);
  }

  const comparisons: Array<
    [keyof FollowOnHandoff, MetadataValidationFinding["code"], string]
  > = [
    ["route", "follow-on-route-mismatch", "follow_on.route"],
    ["next_prompt", "follow-on-next-prompt-mismatch", "follow_on.next_prompt"],
    ["why", "follow-on-why-mismatch", "follow_on.why"],
    [
      "coordinate_handoff",
      "follow-on-coordinate-handoff-mismatch",
      "follow_on.coordinate_handoff",
    ],
  ];

  for (const [key, code, field] of comparisons) {
    const metadataValue = normalizeComparison(metadataFollowOn[key]);
    const bodyValue = normalizeComparison(bodyFollowOn[key]);
    if (metadataValue !== bodyValue) {
      addFinding(findings, code, field, `${field} does not match the Intended Follow-On body.`);
    }
  }

  return findings;
}
