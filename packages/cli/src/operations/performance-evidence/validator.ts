import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import {
  PERFORMANCE_EVIDENCE_RULE_CATALOG_ID,
  PERFORMANCE_EVIDENCE_RULE_CATALOG_VERSION,
  PERFORMANCE_EVIDENCE_RULES,
  performanceEvidenceRuleCatalogDigest,
} from "./catalog";

export type PerformanceEvidenceValidationStatus = "passed" | "failed" | "blocked" | "refused";
export type PerformanceEvidenceFingerprintComparison =
  | "unchanged"
  | "materially-changed"
  | "not-comparable";

export interface PerformanceEvidenceDiagnostic {
  code: string;
  ruleId: string;
  severity: "error" | "warning" | "info";
  path: string;
  line: number;
  message: string;
  reason: string;
  remediation: string;
}

export interface PerformanceEvidenceCandidate {
  path: string;
  line: number;
  kind: "numeric-unit" | "relative-comparison" | "absolute-performance-language";
  excerpt: string;
}

export interface PerformanceEvidenceProfileSummary {
  id: string;
  version: string;
  path: string;
  line: number;
  targetClass: string;
  canonicalOwner: string;
  fingerprintComparison: PerformanceEvidenceFingerprintComparison;
  fingerprintReason: string;
  resultOutcome: string | null;
  status: "valid" | "invalid";
}

export interface PerformanceEvidenceValidationReport {
  status: PerformanceEvidenceValidationStatus;
  proofState?: "validator-passed";
  targetRoot: string;
  targetRootStatus: "valid" | "missing" | "unreadable" | "unsafe";
  catalog: {
    id: string;
    version: number;
    digest: string;
    ruleCount: number;
  };
  supportedRoots: string[];
  rootsScanned: string[];
  markdownFilesScanned: number;
  candidateCount: number;
  profileCount: number;
  candidates: PerformanceEvidenceCandidate[];
  profiles: PerformanceEvidenceProfileSummary[];
  diagnostics: PerformanceEvidenceDiagnostic[];
  mutation: "none";
  benchmarkExecuted: false;
  retryAuthorized: false;
}

interface MarkdownDocument {
  absolutePath: string;
  relativePath: string;
  body: string;
  lines: string[];
}

interface ParsedProfile {
  id: string;
  headingId: string;
  version: string;
  path: string;
  absolutePath: string;
  line: number;
  endLine: number;
  body: string;
  fields: Record<string, string>;
}

const SUPPORTED_ROOTS = ["docs", ".make-docs/archive/history"] as const;
const EXECUTABLE_TARGET_CLASSES = new Set([
  "hard-product-requirement",
  "engineering-guardrail",
  "characterization-baseline",
  "experiment-or-stretch",
]);
const ALL_TARGET_CLASSES = new Set([
  ...EXECUTABLE_TARGET_CLASSES,
  "deferred-required-outcome",
  "unsupported-assumption",
]);
const OUTCOMES = new Set(["pass", "fail", "revise", "blocked", "waived"]);
const SEVERITIES = new Set(["critical", "major", "moderate", "minor"]);
const REPRODUCIBILITY_STATES = new Set([
  "reproduced",
  "not-reproduced",
  "intermittent",
  "not-attempted",
]);

const NUMERIC_UNIT_PATTERN =
  /\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|seconds?|secs?|minutes?|mins?|hours?|requests?\/s|req\/s|ops\/s|%|percent(?:ile)?|bytes?|kb|mb|gb|tb|cores?|cpus?)\b|\bp(?:50|75|90|95|99|999)\b/i;
const RELATIVE_COMPARISON_PATTERN =
  /\b(?:faster|slower|lower latency|higher throughput|no more than|no less than|at least|at most|within)\b/i;
const ABSOLUTE_PERFORMANCE_PATTERN =
  /\b(?:instant(?:ly)?|real[- ]time|zero[- ]latency|never slows?|always responsive|unlimited capacity)\b/i;
const PROFILE_HEADING_PATTERN = /^(#{1,6})\s+(PERF-\d{3})\b(?:\s+.*)?$/i;
const MARKDOWN_LINK_PATTERN = /\[[^\]]*\]\(([^)]+)\)/g;

const REQUIRED_PROFILE_FIELDS = [
  "profile_id",
  "profile_version",
  "source_digest",
  "title",
  "protected_outcome",
  "source_requirements",
  "canonical_owner",
  "product_maturity",
  "applicability",
  "target_class",
  "risk_and_failure_cost",
  "owner",
  "approver",
  "surface",
  "platform_or_runtime",
  "deployment_or_device_class",
  "scale",
  "account_and_network_state",
  "resource_envelope",
  "exclusions",
  "comparable_baseline",
  "target",
  "unit",
  "direction",
  "tolerance",
  "target_source",
  "target_approval",
  "product_build",
  "dependency_state",
  "configuration",
  "qualified_environment",
  "dataset_or_fixture",
  "workload",
  "concurrency",
  "operation_mix",
  "workload_exclusions",
  "measurement_boundary",
  "instrument_and_version",
  "cold_or_warm_state",
  "warmup_rule",
  "repetitions_or_observation_window",
  "statistic",
  "variance_reporting",
  "uncertainty_reporting",
  "outlier_treatment",
  "comparison_method",
  "raw_evidence_retention",
  "observer_effects",
  "correctness",
  "durability",
  "safety",
  "security",
  "privacy",
  "accessibility",
  "portability",
  "cost",
  "maintainability",
  "fixture_and_measurement_seam",
  "authorizing_plan_or_work_scope",
  "budget_event_id",
  "characterization_pass_limit",
  "materially_distinct_correction_attempt_limit",
  "review_cycle_limit",
  "elapsed_investigation_time_limit",
  "compute_limit",
  "external_resource_spend_limit",
  "unchanged_fingerprint_action",
  "material_change_action",
  "diminishing_return_rule",
  "budget_exhaustion_disposition",
  "pass",
  "fail",
  "revise",
  "blocked",
  "waived",
  "severity_treatment",
  "reproducibility_treatment",
  "finding_route",
  "escalation_route",
  "material_change_triggers",
  "time_or_release_boundary",
  "current_use_invalidation_rule",
  "next_review_condition",
  "requalification_authority",
  "requalification_budget",
  "unchanged_fingerprint_qualification_limit",
  "predecessor",
  "successor",
  "promotion_source",
  "promotion_approval",
  "supersession_reason",
  "plan_and_work_links",
  "result_links",
  "finding_links",
  "obligation_links",
  "history_links",
  "support_links",
  "profile_id_version_and_digest",
  "product_build_and_relevant_code_state",
  "dependency_and_configuration_state",
  "workload_and_fixture_or_dataset",
  "instrument_version",
  "analysis_method",
  "comparability_result_and_reasons",
] as const;

const EXPLICIT_NONE_ALLOWED_PROFILE_FIELDS = new Set([
  "exclusions",
  "comparable_baseline",
  "target",
  "unit",
  "direction",
  "tolerance",
  "target_source",
  "target_approval",
  "workload_exclusions",
  "comparison_method",
  "observer_effects",
  "time_or_release_boundary",
  "predecessor",
  "successor",
  "promotion_source",
  "promotion_approval",
  "supersession_reason",
  "result_links",
  "finding_links",
  "obligation_links",
  "history_links",
  "support_links",
]);

const FINITE_BUDGET_FIELDS = [
  "characterization_pass_limit",
  "materially_distinct_correction_attempt_limit",
  "review_cycle_limit",
  "elapsed_investigation_time_limit",
  "compute_limit",
  "external_resource_spend_limit",
] as const;

export function validatePerformanceEvidence(targetRootInput: string): PerformanceEvidenceValidationReport {
  const targetRoot = path.resolve(targetRootInput);
  const diagnostics: PerformanceEvidenceDiagnostic[] = [];
  const base = () => ({
    targetRoot,
    catalog: {
      id: PERFORMANCE_EVIDENCE_RULE_CATALOG_ID,
      version: PERFORMANCE_EVIDENCE_RULE_CATALOG_VERSION,
      digest: performanceEvidenceRuleCatalogDigest(),
      ruleCount: PERFORMANCE_EVIDENCE_RULES.length,
    },
    supportedRoots: [...SUPPORTED_ROOTS],
    mutation: "none" as const,
    benchmarkExecuted: false as const,
    retryAuthorized: false as const,
  });

  const rootState = inspectTargetRoot(targetRoot, diagnostics);
  if (rootState !== "valid") {
    const status = rootState === "unsafe" ? "refused" : "blocked";
    return {
      ...base(),
      status,
      targetRootStatus: rootState,
      rootsScanned: [],
      markdownFilesScanned: 0,
      candidateCount: 0,
      profileCount: 0,
      candidates: [],
      profiles: [],
      diagnostics,
    };
  }

  const documents: MarkdownDocument[] = [];
  const rootsScanned: string[] = [];
  for (const relativeRoot of SUPPORTED_ROOTS) {
    const absoluteRoot = path.join(targetRoot, relativeRoot);
    const authorityRootState = inspectAuthorityRoot(targetRoot, absoluteRoot, diagnostics);
    if (authorityRootState !== "valid") continue;
    rootsScanned.push(relativeRoot);
    collectMarkdownDocuments(targetRoot, absoluteRoot, documents, diagnostics);
  }

  if (rootsScanned.length === 0) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-004",
      ruleId: "PERF-RULE-004",
      path: ".",
      message: "No supported repository authority root is present.",
      reason: "The validator found neither docs/ nor .make-docs/archive/history/.",
      remediation: "Run this operation from a Make Docs project that contains repository authority.",
    }));
  }

  const candidates = documents.flatMap(inventoryCandidates);
  const parsedProfiles = documents.flatMap(parseProfiles);
  const duplicateProfiles = validateDuplicateProfiles(parsedProfiles, diagnostics);
  const profiles = parsedProfiles.map((profile) =>
    validateProfile(targetRoot, profile, diagnostics, duplicateProfiles.has(profile)),
  );
  validateWorkCriterionTraceability(documents, diagnostics);

  const hasRefusal = diagnostics.some((entry) => entry.code === "PERF-VAL-001" && entry.reason.includes("unsafe"));
  const hasBlocker = diagnostics.some((entry) => entry.code === "PERF-VAL-001" && entry.reason.includes("unreadable"));
  const hasError = diagnostics.some((entry) => entry.severity === "error");
  const status: PerformanceEvidenceValidationStatus = hasRefusal
    ? "refused"
    : hasBlocker
      ? "blocked"
      : hasError
        ? "failed"
        : "passed";

  return {
    ...base(),
    status,
    ...(status === "passed" ? { proofState: "validator-passed" as const } : {}),
    targetRootStatus: status === "refused" ? "unsafe" : status === "blocked" ? "unreadable" : "valid",
    rootsScanned,
    markdownFilesScanned: documents.length,
    candidateCount: candidates.length,
    profileCount: profiles.length,
    candidates,
    profiles,
    diagnostics: diagnostics.sort(compareDiagnostics),
  };
}

function inspectAuthorityRoot(
  targetRoot: string,
  authorityRoot: string,
  diagnostics: PerformanceEvidenceDiagnostic[],
): "valid" | "missing" | "unreadable" | "unsafe" {
  const relativeRoot = path.relative(targetRoot, authorityRoot);
  let currentPath = targetRoot;
  try {
    for (const segment of relativeRoot.split(path.sep).filter(Boolean)) {
      currentPath = path.join(currentPath, segment);
      const stat = lstatSync(currentPath);
      if (stat.isSymbolicLink()) {
        diagnostics.push(diagnostic({
          code: "PERF-VAL-001",
          ruleId: "PERF-RULE-001",
          path: relativePath(targetRoot, currentPath),
          message: "A supported authority root uses a symbolic path.",
          reason: "unsafe authority root",
          remediation: "Replace the link with a repository-owned directory or remove it from the authority path.",
        }));
        return "unsafe";
      }
    }
    const rootStat = lstatSync(authorityRoot);
    if (!rootStat.isDirectory()) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-001",
        ruleId: "PERF-RULE-001",
        path: relativePath(targetRoot, authorityRoot),
        message: "A supported authority root is not a directory.",
        reason: "unreadable authority root",
        remediation: "Restore the expected repository-owned directory before validation.",
      }));
      return "unreadable";
    }
    const physicalTargetRoot = realpathSync(targetRoot);
    const physicalAuthorityRoot = realpathSync(authorityRoot);
    if (!isWithin(physicalTargetRoot, physicalAuthorityRoot)) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-001",
        ruleId: "PERF-RULE-001",
        path: relativePath(targetRoot, authorityRoot),
        message: "A supported authority root resolves outside the project.",
        reason: "unsafe authority root escape",
        remediation: "Use only repository-owned authority directories inside the physical project root.",
      }));
      return "unsafe";
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "missing";
    diagnostics.push(diagnostic({
      code: "PERF-VAL-001",
      ruleId: "PERF-RULE-001",
      path: relativePath(targetRoot, authorityRoot),
      message: "A supported authority root cannot be inspected.",
      reason: `unreadable authority root: ${errorMessage(error)}`,
      remediation: "Restore read access or remove the unreadable authority path.",
    }));
    return "unreadable";
  }
  return "valid";
}

function inspectTargetRoot(
  targetRoot: string,
  diagnostics: PerformanceEvidenceDiagnostic[],
): PerformanceEvidenceValidationReport["targetRootStatus"] {
  if (!existsSync(targetRoot)) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-001",
      ruleId: "PERF-RULE-001",
      path: ".",
      message: "The target root does not exist.",
      reason: "missing target root",
      remediation: "Pass an existing project directory with --target-root.",
    }));
    return "missing";
  }
  try {
    const stat = lstatSync(targetRoot);
    if (stat.isSymbolicLink()) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-001",
        ruleId: "PERF-RULE-001",
        path: ".",
        message: "The target root uses a symbolic path.",
        reason: "unsafe target root",
        remediation: "Use the direct physical project path.",
      }));
      return "unsafe";
    }
    if (!stat.isDirectory()) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-001",
        ruleId: "PERF-RULE-001",
        path: ".",
        message: "The target root is not a directory.",
        reason: "unreadable target root",
        remediation: "Pass a project directory with --target-root.",
      }));
      return "unreadable";
    }
  } catch (error) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-001",
      ruleId: "PERF-RULE-001",
      path: ".",
      message: "The target root cannot be read.",
      reason: `unreadable target root: ${errorMessage(error)}`,
      remediation: "Restore read access, then run validation again.",
    }));
    return "unreadable";
  }
  return "valid";
}

function collectMarkdownDocuments(
  targetRoot: string,
  directory: string,
  documents: MarkdownDocument[],
  diagnostics: PerformanceEvidenceDiagnostic[],
): void {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-001",
      ruleId: "PERF-RULE-001",
      path: relativePath(targetRoot, directory),
      message: "A supported authority directory cannot be read.",
      reason: `unreadable authority path: ${errorMessage(error)}`,
      remediation: "Restore read access or remove the unsupported path before validation.",
    }));
    return;
  }

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const projectPath = relativePath(targetRoot, absolutePath);
    let stat;
    try {
      stat = lstatSync(absolutePath);
    } catch (error) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-001",
        ruleId: "PERF-RULE-001",
        path: projectPath,
        message: "An authority path cannot be inspected.",
        reason: `unreadable authority path: ${errorMessage(error)}`,
        remediation: "Restore read access or remove the unreadable path.",
      }));
      continue;
    }
    if (stat.isSymbolicLink()) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-001",
        ruleId: "PERF-RULE-001",
        path: projectPath,
        message: "A supported authority path is a symbolic link.",
        reason: "unsafe authority path",
        remediation: "Replace the link with repository-owned content or remove it from the authority root.",
      }));
      continue;
    }
    if (stat.isDirectory()) {
      collectMarkdownDocuments(targetRoot, absolutePath, documents, diagnostics);
      continue;
    }
    if (!stat.isFile() || path.extname(entry.name).toLowerCase() !== ".md") continue;
    try {
      const body = readFileSync(absolutePath, "utf8");
      documents.push({
        absolutePath,
        relativePath: projectPath,
        body,
        lines: body.split(/\r?\n/),
      });
    } catch (error) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-001",
        ruleId: "PERF-RULE-001",
        path: projectPath,
        message: "A Markdown authority file cannot be read.",
        reason: `unreadable authority file: ${errorMessage(error)}`,
        remediation: "Restore read access or remove the unreadable file.",
      }));
    }
  }
}

function inventoryCandidates(document: MarkdownDocument): PerformanceEvidenceCandidate[] {
  const candidates: PerformanceEvidenceCandidate[] = [];
  for (const [index, line] of document.lines.entries()) {
    const excerpt = line.trim();
    if (!excerpt || excerpt.startsWith("<!--")) continue;
    if (NUMERIC_UNIT_PATTERN.test(excerpt)) {
      candidates.push({ path: document.relativePath, line: index + 1, kind: "numeric-unit", excerpt });
    }
    if (RELATIVE_COMPARISON_PATTERN.test(excerpt)) {
      candidates.push({ path: document.relativePath, line: index + 1, kind: "relative-comparison", excerpt });
    }
    if (ABSOLUTE_PERFORMANCE_PATTERN.test(excerpt)) {
      candidates.push({ path: document.relativePath, line: index + 1, kind: "absolute-performance-language", excerpt });
    }
  }
  return candidates;
}

function parseProfiles(document: MarkdownDocument): ParsedProfile[] {
  const profiles: ParsedProfile[] = [];
  for (let index = 0; index < document.lines.length; index += 1) {
    const heading = PROFILE_HEADING_PATTERN.exec(document.lines[index]!);
    if (!heading) continue;
    const level = heading[1]!.length;
    let end = document.lines.length;
    for (let cursor = index + 1; cursor < document.lines.length; cursor += 1) {
      const next = /^(#{1,6})\s+/.exec(document.lines[cursor]!);
      if (next && next[1]!.length <= level) {
        end = cursor;
        break;
      }
    }
    const body = document.lines.slice(index, end).join("\n");
    const fields = parseFields(body);
    const headingId = heading[2]!.toUpperCase();
    profiles.push({
      id: stripMarkup(fields.profile_id ?? headingId).toUpperCase(),
      headingId,
      version: stripMarkup(fields.profile_version ?? ""),
      path: document.relativePath,
      absolutePath: document.absolutePath,
      line: index + 1,
      endLine: end,
      body,
      fields,
    });
    index = end - 1;
  }
  return profiles;
}

function validateDuplicateProfiles(
  profiles: ParsedProfile[],
  diagnostics: PerformanceEvidenceDiagnostic[],
): Set<ParsedProfile> {
  const byId = new Map<string, ParsedProfile[]>();
  const duplicateProfiles = new Set<ParsedProfile>();
  for (const profile of profiles.filter((candidate) => !isHistoricalProfilePath(candidate.path))) {
    byId.set(profile.id, [...(byId.get(profile.id) ?? []), profile]);
  }
  for (const [id, matches] of byId) {
    if (!/^PERF-\d{3}$/.test(id) || matches.length < 2) continue;
    for (const profile of matches) {
      duplicateProfiles.add(profile);
      diagnostics.push(diagnostic({
        code: "PERF-VAL-003",
        ruleId: "PERF-RULE-003",
        path: profile.path,
        line: profile.line,
        message: `Profile identity ${id} appears more than once.`,
        reason: "PERF identities are project-wide and append-only.",
        remediation: "Keep one canonical profile and give a materially different profile a new unused ID.",
      }));
    }
  }
  return duplicateProfiles;
}

function validateProfile(
  targetRoot: string,
  profile: ParsedProfile,
  diagnostics: PerformanceEvidenceDiagnostic[],
  duplicateIdentity: boolean,
): PerformanceEvidenceProfileSummary {
  const before = diagnostics.filter((entry) => entry.severity === "error").length;
  const fields = profile.fields;
  if (!/^PERF-\d{3}$/.test(profile.id) || profile.id !== profile.headingId) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-003",
      ruleId: "PERF-RULE-003",
      path: profile.path,
      line: profile.line,
      message: "The profile heading and Profile ID must contain the same PERF-### identity.",
      reason: `heading=${profile.headingId}; field=${profile.id || "missing"}`,
      remediation: "Use one matching three-digit PERF identity in the heading and Identity And Authority table.",
    }));
  }
  if (!/^(?:v)?\d+(?:\.\d+){0,2}$/.test(profile.version)) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-003",
      ruleId: "PERF-RULE-003",
      path: profile.path,
      line: profile.line,
      message: "Profile Version is missing or is not a monotonic numeric version.",
      reason: `profile_version=${profile.version || "missing"}`,
      remediation: "Record a positive numeric version such as 1 or 1.1.",
    }));
  }
  const missing = REQUIRED_PROFILE_FIELDS.filter((field) =>
    EXPLICIT_NONE_ALLOWED_PROFILE_FIELDS.has(field)
      ? isUnresolved(fields[field])
      : isMissing(fields[field]),
  );
  if (missing.length > 0) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-004",
      ruleId: "PERF-RULE-004",
      path: profile.path,
      line: profile.line,
      message: `The profile is missing required values: ${missing.join(", ")}.`,
      reason: "A complete executable profile must replace every required placeholder.",
      remediation: "Complete the canonical profile fields or return the candidate to applicability review.",
    }));
  }

  const targetClass = stripMarkup(fields.target_class ?? "");
  if (!EXECUTABLE_TARGET_CLASSES.has(targetClass)) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-005",
      ruleId: "PERF-RULE-005",
      path: profile.path,
      line: profile.line,
      message: "An executable PERF profile must use one executable target class.",
      reason: `target_class=${targetClass || "missing"}`,
      remediation: "Use the applicability record for deferred or unsupported candidates. Keep PERF profiles for executable classes.",
    }));
  } else if (!isHistoricalProfilePath(profile.path) && !targetClassLocationMatches(targetClass, profile.path)) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-005",
      ruleId: "PERF-RULE-005",
      path: profile.path,
      line: profile.line,
      message: `The ${targetClass} profile is not in an allowed canonical owner location.`,
      reason: `profile_path=${profile.path}`,
      remediation: targetClass === "hard-product-requirement"
        ? "Move the canonical profile to the active PRD that owns the protected outcome."
        : "Move the canonical profile to its accepted plan, work, or project evidence record.",
    }));
  } else {
    const canonicalOwner = stripMarkup(fields.canonical_owner ?? "");
    const canonicalOwnerPath = resolveCanonicalOwnerPath(canonicalOwner, profile.path);
    const ownerMatches = isHistoricalProfilePath(profile.path)
      ? targetClassLocationMatches(targetClass, canonicalOwnerPath ?? "")
      : canonicalOwnerPath === profile.path && targetClassLocationMatches(targetClass, canonicalOwnerPath ?? "");
    if (!isMissing(canonicalOwner) && !ownerMatches) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-005",
        ruleId: "PERF-RULE-005",
        path: profile.path,
        line: profile.line,
        message: "The declared Canonical Owner does not match the profile's allowed authority location.",
        reason: `canonical_owner=${canonicalOwner}; resolved_owner=${canonicalOwnerPath ?? "invalid"}; profile_path=${profile.path}`,
        remediation: "Put the profile in its one canonical owner record and name that same repository-relative file as Canonical Owner.",
      }));
    }
  }

  if (isMissing(fields.approver)) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-006",
      ruleId: "PERF-RULE-006",
      path: profile.path,
      line: profile.line,
      message: "The profile does not name its approver role.",
      reason: "Approval authority is required for acceptance, change, waiver, retirement, or supersession.",
      remediation: "Name the durable approver role without self-approving as the implementation agent.",
    }));
  }
  if (targetClass === "hard-product-requirement" && isMissing(fields.target_approval)) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-006",
      ruleId: "PERF-RULE-006",
      path: profile.path,
      line: profile.line,
      message: "The hard product target has no Target Approval reference.",
      reason: "Only an owner-approved PRD target can carry product authority.",
      remediation: "Link the current owner approval or reclassify the candidate.",
    }));
  }

  validateBudget(profile, diagnostics);
  validateOutcomes(profile, diagnostics);
  validateExpiry(profile, diagnostics);
  validateTraceability(profile, diagnostics);
  validateLinks(targetRoot, profile, diagnostics);
  validateOptionalRecords(profile, diagnostics);

  const fingerprint = classifyFingerprint(fields.comparability_result_and_reasons);
  const after = diagnostics.filter((entry) => entry.severity === "error").length;
  const outcome = stripMarkup(fields.outcome ?? "").toLowerCase();
  return {
    id: profile.id,
    version: profile.version,
    path: profile.path,
    line: profile.line,
    targetClass,
    canonicalOwner: stripMarkup(fields.canonical_owner ?? ""),
    fingerprintComparison: fingerprint.comparison,
    fingerprintReason: fingerprint.reason,
    resultOutcome: OUTCOMES.has(outcome) ? outcome : null,
    status: !duplicateIdentity && after === before ? "valid" : "invalid",
  };
}

function validateBudget(
  profile: ParsedProfile,
  diagnostics: PerformanceEvidenceDiagnostic[],
): void {
  for (const field of FINITE_BUDGET_FIELDS) {
    const value = stripMarkup(profile.fields[field] ?? "");
    if (isMissing(value) || /\b(?:unlimited|unbounded|as needed|self[- ]?renew)\b/i.test(value) || !/\b\d+(?:\.\d+)?\b/.test(value)) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-008",
        ruleId: "PERF-RULE-008",
        path: profile.path,
        line: profile.line,
        message: `The ${field} value is not a finite numeric limit.`,
        reason: `${field}=${value || "missing"}`,
        remediation: "Record one finite limit with its unit. New authority is required to grow it.",
      }));
    }
  }
  for (const field of ["diminishing_return_rule", "budget_exhaustion_disposition"] as const) {
    if (isMissing(profile.fields[field])) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-009",
        ruleId: "PERF-RULE-009",
        path: profile.path,
        line: profile.line,
        message: `The ${field} stop control is missing.`,
        reason: "The evidence packet cannot loop or renew itself.",
        remediation: "State the finite stop condition and bounded disposition.",
      }));
    }
  }
}

function validateOutcomes(
  profile: ParsedProfile,
  diagnostics: PerformanceEvidenceDiagnostic[],
): void {
  const missingOutcomes = [...OUTCOMES].filter((outcome) => isMissing(profile.fields[outcome]));
  if (missingOutcomes.length > 0) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-010",
      ruleId: "PERF-RULE-010",
      path: profile.path,
      line: profile.line,
      message: `Outcome rules are missing: ${missingOutcomes.join(", ")}.`,
      reason: "Each executable profile version must define all five allowed outcomes.",
      remediation: "Define pass, fail, revise, blocked, and waived conditions without adding a sixth outcome.",
    }));
  }
  const recorded = stripMarkup(profile.fields.outcome ?? "").toLowerCase();
  if (recorded && !isMissing(recorded) && !OUTCOMES.has(recorded)) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-010",
      ruleId: "PERF-RULE-010",
      path: profile.path,
      line: profile.line,
      message: `The result outcome ${recorded} is outside the allowed vocabulary.`,
      reason: "Proof states and adjacent test results are not performance outcomes.",
      remediation: "Use pass, fail, revise, blocked, or waived.",
    }));
  }
}

function validateExpiry(
  profile: ParsedProfile,
  diagnostics: PerformanceEvidenceDiagnostic[],
): void {
  const required = [
    "material_change_triggers",
    "current_use_invalidation_rule",
    "next_review_condition",
    "requalification_authority",
    "requalification_budget",
    "unchanged_fingerprint_qualification_limit",
  ] as const;
  const missing = required.filter((field) => isMissing(profile.fields[field]));
  const oneRun = stripMarkup(profile.fields.unchanged_fingerprint_qualification_limit ?? "");
  if (missing.length > 0 || !isSingleBoundedExecution(oneRun)) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-007",
      ruleId: "PERF-RULE-007",
      path: profile.path,
      line: profile.line,
      message: "The expiry or requalification record is incomplete or permits more than one unchanged-fingerprint execution.",
      reason: missing.length > 0 ? `missing=${missing.join(",")}` : `unchanged_limit=${oneRun}`,
      remediation: "Record expiry triggers, separate authority, a new finite budget, and exactly one unchanged-fingerprint qualification execution.",
    }));
  }
  const expiry = stripMarkup(profile.fields.expiry ?? profile.fields.time_or_release_boundary ?? "");
  const date = /\b(\d{4}-\d{2}-\d{2})\b/.exec(expiry)?.[1];
  if (date && date < new Date().toISOString().slice(0, 10)) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-007",
      ruleId: "PERF-RULE-007",
      path: profile.path,
      line: profile.line,
      message: `The recorded evidence expired on ${date}.`,
      reason: "Expired evidence remains history and cannot support a current pass.",
      remediation: "Record separate requalification authority and a new finite budget. Do not infer permission to rerun.",
    }));
  }
}

function validateTraceability(
  profile: ParsedProfile,
  diagnostics: PerformanceEvidenceDiagnostic[],
): void {
  const required = ["source_requirements", "authorizing_plan_or_work_scope", "plan_and_work_links"] as const;
  const missing = required.filter((field) => isMissing(profile.fields[field]));
  if (missing.length > 0) {
    diagnostics.push(diagnostic({
      code: "PERF-VAL-011",
      ruleId: "PERF-RULE-011",
      path: profile.path,
      line: profile.line,
      message: `The profile trace is incomplete: ${missing.join(", ")}.`,
      reason: "Repository records remain the authority for profile meaning and execution scope.",
      remediation: "Link the source authority and the authorizing plan and work records.",
    }));
  }
}

function validateLinks(
  targetRoot: string,
  profile: ParsedProfile,
  diagnostics: PerformanceEvidenceDiagnostic[],
): void {
  for (const match of profile.body.matchAll(MARKDOWN_LINK_PATTERN)) {
    const rawTarget = match[1]!.trim().replace(/^<|>$/g, "");
    if (!rawTarget || rawTarget.startsWith("#") || /^(?:https?:|mailto:|make-docs:)/i.test(rawTarget)) continue;
    let decoded = rawTarget.split("#", 1)[0]!.split("?", 1)[0]!;
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      // Keep the raw target. The missing-path diagnostic below is more useful than a parser failure.
    }
    const resolved = path.resolve(path.dirname(profile.absolutePath), decoded);
    if (!isWithin(targetRoot, resolved)) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-012",
        ruleId: "PERF-RULE-012",
        path: profile.path,
        line: profile.line,
        message: `Evidence link escapes the target root: ${rawTarget}.`,
        reason: "unsafe evidence reference",
        remediation: "Use a repository-relative evidence or authority link.",
      }));
      continue;
    }
    if (!existsSync(resolved)) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-012",
        ruleId: "PERF-RULE-012",
        path: profile.path,
        line: profile.line,
        message: `Evidence link does not resolve: ${rawTarget}.`,
        reason: "missing evidence reference",
        remediation: "Repair the link or record the evidence as missing without favorable inference.",
      }));
      continue;
    }
    try {
      if (
        lstatSync(resolved).isSymbolicLink() ||
        !isWithin(realpathSync(targetRoot), realpathSync(resolved))
      ) {
        diagnostics.push(diagnostic({
          code: "PERF-VAL-012",
          ruleId: "PERF-RULE-012",
          path: profile.path,
          line: profile.line,
          message: `Evidence link uses a symbolic or escaping target: ${rawTarget}.`,
          reason: "unsafe evidence reference",
          remediation: "Use repository-owned evidence without a symbolic-link hop.",
        }));
      }
    } catch (error) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-012",
        ruleId: "PERF-RULE-012",
        path: profile.path,
        line: profile.line,
        message: `Evidence link cannot be inspected: ${rawTarget}.`,
        reason: `unreadable evidence reference: ${errorMessage(error)}`,
        remediation: "Restore readable repository evidence or record the missing state.",
      }));
    }
  }
}

function validateOptionalRecords(
  profile: ParsedProfile,
  diagnostics: PerformanceEvidenceDiagnostic[],
): void {
  const fields = profile.fields;
  if (!isMissing(fields.result_id)) {
    const outcome = stripMarkup(fields.outcome ?? "").toLowerCase();
    if (!OUTCOMES.has(outcome) || isMissing(fields.exact_profile_binding) || isMissing(fields.expiry)) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-011",
        ruleId: "PERF-RULE-011",
        path: profile.path,
        line: profile.line,
        message: "The result record lacks an exact binding, allowed outcome, or expiry.",
        reason: "A result cannot support current use without its exact profile and current-use boundary.",
        remediation: "Complete the result binding, outcome, and expiry. Keep missing evidence visible.",
      }));
    }
  }
  if (!isMissing(fields.finding_id)) {
    const targetClass = stripMarkup(fields.target_class ?? "");
    const severity = stripMarkup(fields.severity ?? "").toLowerCase();
    const reproducibility = stripMarkup(fields.reproducibility_and_attempts ?? "").toLowerCase();
    if (!ALL_TARGET_CLASSES.has(targetClass) || !SEVERITIES.has(severity) || ![...REPRODUCIBILITY_STATES].some((state) => reproducibility.startsWith(state))) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-011",
        ruleId: "PERF-RULE-011",
        path: profile.path,
        line: profile.line,
        message: "The finding record uses an invalid target class, severity, or reproducibility state.",
        reason: "Findings must preserve the controlled vocabulary and attempts.",
        remediation: "Use the contract target class, severity, and reproducibility values.",
      }));
    }
  }
  if (!isMissing(fields.requirement_and_profile)) {
    if (isMissing(fields.owner_and_approver) || isMissing(fields.expiry_or_release_boundary) || isMissing(fields.reevaluation_or_remediation_trigger)) {
      diagnostics.push(diagnostic({
        code: "PERF-VAL-011",
        ruleId: "PERF-RULE-011",
        path: profile.path,
        line: profile.line,
        message: "The waiver record lacks authority, expiry, or a reevaluation trigger.",
        reason: "A waiver cannot be indefinite or self-approved.",
        remediation: "Record the owner and approver, boundary, trigger, and owed-work link when work remains.",
      }));
    }
  }
}

function validateWorkCriterionTraceability(
  documents: MarkdownDocument[],
  diagnostics: PerformanceEvidenceDiagnostic[],
): void {
  for (const document of documents) {
    if (!document.relativePath.startsWith("docs/work/")) continue;
    const profileRanges = parseProfiles(document);
    const candidate = document.lines.findIndex((line, index) => {
      if (!NUMERIC_UNIT_PATTERN.test(line) && !RELATIVE_COMPARISON_PATTERN.test(line)) return false;
      const lineNumber = index + 1;
      if (profileRanges.some((profile) => lineNumber >= profile.line && lineNumber <= profile.endLine)) return false;
      return !/\bPERF-\d{3}\b/.test(line);
    });
    if (candidate < 0) continue;
    diagnostics.push(diagnostic({
      code: "PERF-VAL-014",
      ruleId: "PERF-RULE-014",
      severity: "warning",
      path: document.relativePath,
      line: candidate + 1,
      message: "This work record contains a numeric performance criterion without a PERF-### link.",
      reason: "The validator can detect the missing trace but cannot decide whether the criterion is stricter than product authority.",
      remediation: "Use the agent method to review the criterion. Link the canonical profile when the criterion is executable.",
    }));
  }
}

function parseFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const line of body.split(/\r?\n/)) {
    const cells = line.trim().split("|");
    if (cells.length >= 4 && cells[0] === "" && cells.at(-1) === "") {
      const key = fieldKey(cells[1]!);
      const value = cells.slice(2, -1).join("|").trim();
      if (
        key &&
        key !== "field" &&
        !/^[-:]+$/.test(cells[1]!.trim()) &&
        !(key === "outcome" && fieldKey(value) === "exact_condition")
      ) {
        fields[key] = value;
      }
      const first = stripMarkup(cells[1]!).toLowerCase();
      if (OUTCOMES.has(first)) fields[first] = value;
      continue;
    }
    const bullet = /^\s*-\s+([^:]+):\s*(.*)$/.exec(line);
    if (bullet) fields[fieldKey(bullet[1]!)] = bullet[2]!.trim();
  }
  return fields;
}

function targetClassLocationMatches(targetClass: string, projectPath: string): boolean {
  if (targetClass === "hard-product-requirement") return projectPath.startsWith("docs/prd/");
  return ["docs/plans/", "docs/work/", "docs/assets/", ".make-docs/archive/history/"].some((root) =>
    projectPath.startsWith(root),
  );
}

function resolveCanonicalOwnerPath(value: string, profilePath: string): string | null {
  const normalized = stripMarkup(value);
  const linkTarget = /^\[[^\]]*\]\(([^)]+)\)$/.exec(normalized)?.[1]?.trim() ?? normalized;
  const withoutAnchor = linkTarget.split("#", 1)[0]!.trim();
  if (!withoutAnchor || path.posix.isAbsolute(withoutAnchor) || /^[a-z][a-z0-9+.-]*:/i.test(withoutAnchor)) {
    return null;
  }
  const projectPath = withoutAnchor.startsWith("docs/") || withoutAnchor.startsWith(".make-docs/")
    ? path.posix.normalize(withoutAnchor)
    : path.posix.normalize(path.posix.join(path.posix.dirname(profilePath), withoutAnchor));
  if (projectPath === ".." || projectPath.startsWith("../")) return null;
  return projectPath.replace(/^\.\//, "");
}

function isSingleBoundedExecution(value: string): boolean {
  return /^(?:exactly\s+)?(?:1|one|single)\s+(?:bounded\s+)?(?:execution|run)(?:\s+only)?[.!]?$/i.test(
    value.trim(),
  );
}

function classifyFingerprint(value: string | undefined): {
  comparison: PerformanceEvidenceFingerprintComparison;
  reason: string;
} {
  const normalized = stripMarkup(value ?? "").trim();
  if (/\b(?:materially[- ]changed|material change)\b/i.test(normalized)) {
    return { comparison: "materially-changed", reason: normalized };
  }
  if (/\b(?:unchanged|match|equivalent)\b/i.test(normalized)) {
    return { comparison: "unchanged", reason: normalized };
  }
  return {
    comparison: "not-comparable",
    reason: normalized || "No declared fingerprint comparison and reason is present.",
  };
}

function isMissing(value: string | undefined): boolean {
  if (isUnresolved(value)) return true;
  return /^(?:none|n\/a|not applicable)$/i.test(stripMarkup(value ?? "").trim());
}

function isUnresolved(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = stripMarkup(value).trim();
  return normalized.length === 0 || /\{\{|\}\}|\b(?:tbd|todo|unknown)\b/i.test(normalized);
}

function isHistoricalProfilePath(value: string): boolean {
  return value === ".make-docs/archive/history" || value.startsWith(".make-docs/archive/history/");
}

function stripMarkup(value: string): string {
  return value.trim().replace(/^`+|`+$/g, "").trim();
}

function fieldKey(value: string): string {
  return stripMarkup(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function relativePath(root: string, target: string): string {
  const relative = path.relative(root, target);
  return relative ? relative.split(path.sep).join("/") : ".";
}

function diagnostic(input: Omit<PerformanceEvidenceDiagnostic, "severity" | "line"> & {
  severity?: PerformanceEvidenceDiagnostic["severity"];
  line?: number;
}): PerformanceEvidenceDiagnostic {
  return {
    severity: input.severity ?? "error",
    line: input.line ?? 1,
    ...input,
  };
}

function compareDiagnostics(left: PerformanceEvidenceDiagnostic, right: PerformanceEvidenceDiagnostic): number {
  return left.path.localeCompare(right.path) || left.line - right.line || left.code.localeCompare(right.code);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
