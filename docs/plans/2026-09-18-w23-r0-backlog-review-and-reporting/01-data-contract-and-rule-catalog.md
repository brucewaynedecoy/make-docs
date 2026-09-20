---
title: "W23 R0 P1 Data Contract and Rule Catalog"
kind: "plan"
status: "draft"
coordinate: "W23 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-09-18-backlog-review-and-reporting.md"
---

# W23 R0 P1 Data Contract and Rule Catalog

## Purpose

Settle the factual source model before implementation. Define what the deterministic operation can prove, what the Skill may infer, and how both methods stay aligned.

## Outcome

P1 produces an accepted versioned snapshot schema, report model boundary, diagnostic catalog, rule map, and fixture matrix. No CLI, MCP, or installed Skill change begins before these contracts are reviewable.

## Scope

- Define the current frontmatter work-index and phase standard as the only fully supported semantic source shape.
- Define partial current-format records and inventory-only unsupported records without legacy body parsing.
- Inventory current task, status, dependency, blocker, closeout, source-link, and Git evidence shapes.
- Preserve raw values and provenance before deriving normalized facts.
- Define capability availability and typed partial-result behavior.
- Define stable diagnostics for unsafe, missing, malformed, duplicate, broken-link, conflicting, and unavailable evidence.
- Define the deterministic and agentic rule catalog, including explicit one-sided reasons.
- Define the report layer that adds inference and recommendation without changing snapshot facts.
- Define the exclusive report-layer `waveStatus` enum and the separate agent-written `statusReason`.
- Define the four fixed portfolio tally fields, their full-record scope, and their sum invariant.
- Define archive scope, directory-derived creation date, deterministic last-updated evidence, and stable sort fallbacks for every record.
- Define six synthetic fixture groups: canonical current record, mixed portfolio, source-shape limits, conflicts and links, dates and capabilities, and safety and human errors.

## Accepted Snapshot Contract

The operation returns this value inside the shared `OperationResult` wrapper:

```ts
interface BacklogSnapshotV1 {
  schemaVersion: 1;
  generatedAt: string;
  targetRoot: string;
  project: {
    id: string | null;
    name: string | null;
    manifestPath: string | null;
  };
  gitRevision: string | null;
  capabilities: {
    repositoryFiles: Capability;
    git: Capability;
    store: Capability;
    sourceLinks: Capability;
  };
  recordCounts: {
    found: number;
    live: number;
    archived: number;
  };
  records: WorkRecord[];
  diagnostics: BacklogDiagnostic[];
}

interface Capability {
  state:
    | "available"
    | "partial"
    | "unavailable"
    | "denied"
    | "not-a-repository"
    | "not-used";
  diagnosticCodes: string[];
}

interface WorkRecord {
  recordPath: string;
  scope: "live" | "archived";
  sourceShape: {
    state: "supported" | "partial" | "unsupported";
    standard: "current-frontmatter" | null;
    diagnosticCodes: string[];
  };
  discoveredFiles: string[];
  coordinate: SourcedValue<string | null>;
  title: SourcedValue<string | null>;
  recordedStatus: SourcedValue<string | null>;
  createdAt: CreatedAtFact;
  lastUpdatedAt: LastUpdatedAtFact;
}

interface SourcedValue<T> {
  value: T;
  evidence: EvidenceReference[];
}

interface EvidenceReference {
  path: string;
  line: number | null;
  field: string | null;
  commit: string | null;
}

interface CreatedAtFact {
  value: string | null;
  precision: "date" | null;
  source: "directory-name" | "unavailable";
  evidence: EvidenceReference[];
  diagnosticCodes: string[];
}

interface LastUpdatedAtFact {
  value: string | null;
  precision: "date" | "second" | "millisecond" | null;
  source:
    | "working-tree-mtime"
    | "git-commit"
    | "filesystem-mtime"
    | "created-at-fallback"
    | "unavailable";
  evidence: EvidenceReference[];
  diagnosticCodes: string[];
}

interface BacklogDiagnostic {
  code: string;
  ruleId: string;
  severity: "error" | "warning" | "info";
  recordPath: string | null;
  path: string | null;
  line: number | null;
  message: string;
  reason: string;
  remediation: string;
}
```

`generatedAt` uses an ISO 8601 UTC time. Date-only evidence uses `YYYY-MM-DD`. Time evidence uses an ISO 8601 UTC time and states its precision. Every defined key is present. Unknown scalar values are `null`. Empty collections are `[]`. `recordPath` is the record identity. `recordCounts.found` equals `recordCounts.live + recordCounts.archived`. The operation does not probe the Store only to fill `capabilities.store`; that capability is normally `not-used`. A breaking shape or meaning change requires a new schema version. The source-shape inventory will add phase, task, dependency, blocker, closeout, and source-link fields to `WorkRecord` without changing this accepted core.

`sourceShape.state` is `supported` for a valid current-frontmatter record, `partial` when current frontmatter is present but malformed or incomplete, and `unsupported` when required frontmatter is absent. `discoveredFiles` contains the repository-relative paths of discovered top-level Markdown files. Unsupported records retain inventory facts and counts but do not expose interpreted phase or body facts.

## Decision Rules

- A value is a deterministic fact only when the operation can point to its source or a stable Git result.
- Every material scalar fact uses a sourced value or a named evidence-bearing fact type.
- Every defined key is present. Unknown scalars are `null`, and empty collections are `[]`.
- Every rule has one stable `BACKLOG-RULE-###` identity and one stable diagnostic code. Deterministic codes use `BACKLOG-VAL-###`. Agent-only codes use `BACKLOG-AGENT-###` and are not emitted as snapshot facts.
- The same diagnostic code can identify the same condition on several records. Its meaning and default severity remain stable. Human message and remediation text can improve without changing that meaning.
- `error` means no safe requested snapshot can be returned. `warning` means the snapshot is usable but a record is incomplete, unsupported, or conflicting. `info` means a safe fallback replaced optional evidence. Store `not-used` is normal and emits no diagnostic.
- Diagnostics never assign report status, filter membership, color, priority, or recommendation.
- Full semantic parsing supports only the current frontmatter standard. Work indexes and phases must declare `kind: work`, a matching coordinate, title, and status in readable YAML frontmatter.
- Current-format records with malformed or incomplete frontmatter are partial. They expose only safely parsed current-format facts and stable diagnostics.
- Records without required frontmatter are unsupported but remain inventory-only records in live or archived counts. The operation does not interpret their legacy body conventions.
- Unsupported inventory facts are limited to record path, scope, a directory coordinate when parseable, creation date, last-updated evidence, and discovered top-level Markdown files. Title and recorded status are `null`. Interpreted phase and related collections are empty.
- Private source readers use one adapter boundary. Version 1 provides the current-frontmatter reader and unsupported inventory reader. Future legacy readers must preserve the public snapshot contract.
- The current-frontmatter reader follows the phase map. It reports numbered current-frontmatter phase files that are not linked, but it does not silently add them to the interpreted phase set.
- `recordPath` is the record identity. A coordinate is a sourced fact and can conflict or repeat.
- `recordCounts.found` equals `recordCounts.live + recordCounts.archived`.
- A breaking snapshot shape or meaning change requires a new schema version.
- A conflict remains a conflict until accepted authority resolves it.
- File age and coordinate order are signals, not priority decisions.
- Completed tasks do not prove closeout, owner acceptance, commit, release, or archival.
- Recorded status does not erase contradictory phase or task evidence.
- Agent conclusions name their evidence class and limit.
- Every included wave has exactly one `waveStatus`: `attention`, `current`, `conflict`, `deferred`, `complete`, or `history`.
- `statusReason` explains the classification. It never controls filter membership or color.
- Attention findings remain independent from wave status.
- Every discovered live record receives a `waveStatus` before tally calculation, even when the presentation summarizes that record.
- Archive location decides the archived tally. A record cannot count as both archived and historical.
- The shared report model retains every discovered live and archived record. Presentation filters do not remove records from the model.
- `workRecordsFound` equals `workRecordsStillInScope + historicalRecords + archivedRecords`.
- `createdAt` comes from the dated work-directory name.
- `lastUpdatedAt` considers only the work record directory and linked phase files. It excludes linked product source files and report generation time.
- A changed or untracked scoped file makes `lastUpdatedAt` the newest modification time among changed or untracked scoped files.
- A clean scoped record makes `lastUpdatedAt` the latest Git committer date that affected a scoped file.
- Git absence, denial, a non-repository location, or missing usable history falls back to the newest modification time among all scoped record files. Missing usable file time falls back to `createdAt`.
- The snapshot names whether `lastUpdatedAt` came from working-tree modification time, Git commit evidence, filesystem modification time, or the created-date fallback. Each fallback emits a stable diagnostic.
- Equal primary sort values use wave coordinate, then record path, in ascending order.
- Each rule-catalog entry records title, rule class, source class, deterministic support, agent instruction location, judgment requirement, diagnostic code, default severity, focused fixtures or tests, parity mapping, and any one-sided reason.
- Static deterministic fixtures use fixed dates and expected structured results. Tests create isolated temporary Git repositories or directories for dirty state, commit time, file-time fallbacks, unsafe roots, and path escape cases.
- Agent-response fixtures verify required meaning, not exact prose. They require the subject, context, effect, known limit, next action, and required or optional human action.

## Verification

- Schema examples validate without implementation code.
- Every diagnostic has a stable identifier, trigger, evidence class, and expected human meaning.
- Every agent rule maps to deterministic support or records why judgment prevents deterministic support.
- Fixtures cover every fixed wave status, flexible status reasons, and source conflict class.
- Examples prove that an attention finding does not add a current wave to the `attention` filter.
- Examples prove that detailed-list limits do not change the four portfolio tallies.
- Schema examples reject tally values that do not satisfy the sum invariant.
- Fixtures prove each `lastUpdatedAt` evidence path, fallback diagnostic, and stable sort tie.
- Fixtures prove that linked product source changes and report generation time do not change `lastUpdatedAt`.
- The six fixture groups cover canonical current parsing, every report status and archived scope, partial and unsupported records, conflicts and link failures, timestamp and capability fallbacks, unsafe paths, hostile text, and human error explanations.
- Deterministic golden results use fixed inputs. Agent-response checks allow natural wording while verifying required meaning and machine-result fidelity.
- Review confirms that no Store fact is required for the core snapshot.
