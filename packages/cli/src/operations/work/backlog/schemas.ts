import { z } from "zod";

const text = z.string().trim().min(1);
const nullableText = text.nullable();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const utcTimestamp = z
  .string()
  .datetime({ offset: true })
  .refine((value) => value.endsWith("Z"), "Expected an ISO 8601 UTC time.");
const gitCommit = z.string().regex(/^[a-f0-9]{7,64}$/).nullable();
const sha256Digest = z.string().regex(/^[a-f0-9]{64}$/);
const waveCoordinate = z.string().regex(/^W[1-9]\d* R(?:0|[1-9]\d*)$/);
const phaseCoordinate = z
  .string()
  .regex(/^W[1-9]\d* R(?:0|[1-9]\d*) P[1-9]\d*$/);
const repositoryRelativePath = text.refine(
  (value) =>
    !value.startsWith("/") &&
    !value.startsWith("\\") &&
    !value.includes("\\") &&
    !value.split("/").includes(".."),
  "Expected a safe repository-relative path.",
);

export const DiagnosticSeveritySchema = z.enum(["error", "warning", "info"]);
export const WaveStatusSchema = z.enum([
  "attention",
  "current",
  "conflict",
  "deferred",
  "complete",
  "history",
]);
export const WorkScopeSchema = z.enum(["live", "archived"]);

export const EvidenceReferenceSchema = z
  .object({
    path: repositoryRelativePath,
    line: z.number().int().positive().nullable(),
    field: nullableText,
    commit: gitCommit,
  })
  .strict();

export const NullableSourcedStringSchema = z
  .object({
    value: nullableText,
    evidence: z.array(EvidenceReferenceSchema),
  })
  .strict();

export const SourcedStringSchema = z
  .object({
    value: text,
    evidence: z.array(EvidenceReferenceSchema).min(1),
  })
  .strict();

export const NullableSourcedBooleanSchema = z
  .object({
    value: z.boolean().nullable(),
    evidence: z.array(EvidenceReferenceSchema),
  })
  .strict();

export const SourcedCountSchema = z
  .object({
    value: z.number().int().nonnegative(),
    evidence: z.array(EvidenceReferenceSchema),
  })
  .strict();

export const CreatedAtFactSchema = z
  .object({
    value: dateOnly.nullable(),
    precision: z.literal("date").nullable(),
    source: z.enum(["directory-name", "unavailable"]),
    evidence: z.array(EvidenceReferenceSchema),
    diagnosticCodes: z.array(z.string().regex(/^BACKLOG-VAL-\d{3}$/)),
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.value === null) !== (value.precision === null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "createdAt value and precision must both be known or both be null.",
      });
    }
    if (value.source === "directory-name" && value.value === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A directory-name createdAt source requires a date value.",
      });
    }
    if (value.source === "unavailable" && value.value !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "An unavailable createdAt source cannot carry a date value.",
      });
    }
  });

export const LastUpdatedAtFactSchema = z
  .object({
    value: utcTimestamp.or(dateOnly).nullable(),
    precision: z.enum(["date", "second", "millisecond"]).nullable(),
    source: z.enum([
      "working-tree-mtime",
      "git-commit",
      "filesystem-mtime",
      "created-at-fallback",
      "unavailable",
    ]),
    evidence: z.array(EvidenceReferenceSchema),
    diagnosticCodes: z.array(z.string().regex(/^BACKLOG-VAL-\d{3}$/)),
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.value === null) !== (value.precision === null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "lastUpdatedAt value and precision must both be known or both be null.",
      });
    }
    if (value.source === "unavailable" && value.value !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "An unavailable lastUpdatedAt source cannot carry a value.",
      });
    }
    if (value.source !== "unavailable" && value.value === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A known lastUpdatedAt source requires a value.",
      });
    }
    if (
      (value.source === "filesystem-mtime" ||
        value.source === "created-at-fallback" ||
        value.source === "unavailable") &&
      value.diagnosticCodes.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["diagnosticCodes"],
        message: "A last-updated fallback or unavailable result requires a stable diagnostic.",
      });
    }
    if (value.precision === "date" && value.value !== null && !/^\d{4}-\d{2}-\d{2}$/.test(value.value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date-precision lastUpdatedAt evidence must use YYYY-MM-DD.",
      });
    }
    if (
      (value.precision === "second" || value.precision === "millisecond") &&
      value.value !== null &&
      !value.value.endsWith("Z")
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Time-precision lastUpdatedAt evidence must use an ISO 8601 UTC time.",
      });
    }
  });

export const CapabilityStateSchema = z.enum([
  "available",
  "partial",
  "unavailable",
  "denied",
  "not-a-repository",
  "not-used",
]);

export const BacklogCapabilitySchema = z
  .object({
    state: CapabilityStateSchema,
    diagnosticCodes: z.array(z.string().regex(/^BACKLOG-VAL-\d{3}$/)),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.state === "not-used" && value.diagnosticCodes.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A not-used capability does not emit a diagnostic.",
      });
    }
  });

export const SourceShapeSchema = z
  .object({
    state: z.enum(["supported", "partial", "unsupported"]),
    standard: z.literal("current-frontmatter").nullable(),
    diagnosticCodes: z.array(z.string().regex(/^BACKLOG-VAL-\d{3}$/)),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.state === "unsupported" && value.standard !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "An unsupported record has no recognized source standard.",
      });
    }
    if (value.state !== "unsupported" && value.standard !== "current-frontmatter") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A supported or partial record must name the current frontmatter standard.",
      });
    }
    if (value.state === "supported" && value.diagnosticCodes.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["diagnosticCodes"],
        message: "A supported source shape has no shape diagnostic.",
      });
    }
    if (value.state === "partial" && !value.diagnosticCodes.includes("BACKLOG-VAL-003")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["diagnosticCodes"],
        message: "A partial current-frontmatter record requires BACKLOG-VAL-003.",
      });
    }
    if (value.state === "unsupported" && !value.diagnosticCodes.includes("BACKLOG-VAL-004")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["diagnosticCodes"],
        message: "An unsupported record requires BACKLOG-VAL-004.",
      });
    }
  });

export const WorkTaskFactSchema = z
  .object({
    id: NullableSourcedStringSchema,
    phasePath: repositoryRelativePath,
    text: SourcedStringSchema,
    completed: NullableSourcedBooleanSchema,
    recordedStatus: NullableSourcedStringSchema,
  })
  .strict();

export const WorkRelationshipFactSchema = z
  .object({
    text: SourcedStringSchema,
    target: NullableSourcedStringSchema,
    state: z.enum(["recorded", "resolved", "unresolved", "unknown"]),
    evidence: z.array(EvidenceReferenceSchema).min(1),
  })
  .strict();

export const WorkSourceLinkFactSchema = z
  .object({
    sourcePath: repositoryRelativePath,
    targetPath: repositoryRelativePath.nullable(),
    state: z.enum(["valid", "missing", "unsafe", "unsupported"]),
    evidence: z.array(EvidenceReferenceSchema).min(1),
  })
  .strict();

export const WorkPhaseFactSchema = z
  .object({
    phasePath: repositoryRelativePath,
    phaseMapLinked: z.literal(true),
    coordinate: NullableSourcedStringSchema,
    title: NullableSourcedStringSchema,
    recordedStatus: NullableSourcedStringSchema,
    tasks: z.array(WorkTaskFactSchema),
    dependencies: z.array(WorkRelationshipFactSchema),
    blockers: z.array(WorkRelationshipFactSchema),
    sourceLinks: z.array(WorkSourceLinkFactSchema),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.coordinate.value !== null && !phaseCoordinate.safeParse(value.coordinate.value).success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["coordinate", "value"],
        message: "A phase coordinate must use Wn Rn Pn form.",
      });
    }
    if (value.tasks.some((task) => task.phasePath !== value.phasePath)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tasks"],
        message: "Each task must name its containing phase path.",
      });
    }
  });

export const WorkCloseoutFactSchema = z
  .object({
    tasksComplete: NullableSourcedBooleanSchema,
    closeoutAccepted: NullableSourcedBooleanSchema,
    committed: NullableSourcedBooleanSchema,
    closedHistory: NullableSourcedBooleanSchema,
    released: NullableSourcedBooleanSchema,
    archived: NullableSourcedBooleanSchema,
  })
  .strict();

export const WorkGitEvidenceSchema = z
  .object({
    kind: z.enum([
      "revision",
      "last-updated-commit",
      "working-tree-change",
      "untracked-file",
      "history-unavailable",
    ]),
    path: repositoryRelativePath.nullable(),
    commit: gitCommit,
    committedAt: utcTimestamp.nullable(),
    modifiedAt: utcTimestamp.nullable(),
    evidence: z.array(EvidenceReferenceSchema),
  })
  .strict();

export const BacklogDiagnosticSchema = z
  .object({
    code: z.string().regex(/^BACKLOG-VAL-\d{3}$/),
    ruleId: z.string().regex(/^BACKLOG-RULE-\d{3}$/),
    severity: DiagnosticSeveritySchema,
    recordPath: repositoryRelativePath.nullable(),
    path: repositoryRelativePath.nullable(),
    line: z.number().int().positive().nullable(),
    message: text,
    reason: text,
    remediation: text,
  })
  .strict();

export const TaskCountsSchema = z
  .object({
    total: SourcedCountSchema,
    complete: SourcedCountSchema,
    incomplete: SourcedCountSchema,
    unknown: SourcedCountSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.total.value !== value.complete.value + value.incomplete.value + value.unknown.value) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Task total must equal complete, incomplete, and unknown tasks.",
      });
    }
  });

export const BacklogProjectSchema = z
  .object({
    id: nullableText,
    name: nullableText,
    manifestPath: repositoryRelativePath.nullable(),
  })
  .strict();

export const BacklogRecordCountsSchema = z
  .object({
    found: z.number().int().nonnegative(),
    live: z.number().int().nonnegative(),
    archived: z.number().int().nonnegative(),
  })
  .strict();

export const BacklogWorkRecordV1Schema = z
  .object({
    recordPath: repositoryRelativePath,
    scope: WorkScopeSchema,
    sourceShape: SourceShapeSchema,
    discoveredFiles: z.array(repositoryRelativePath),
    coordinate: NullableSourcedStringSchema,
    title: NullableSourcedStringSchema,
    recordedStatus: NullableSourcedStringSchema,
    createdAt: CreatedAtFactSchema,
    lastUpdatedAt: LastUpdatedAtFactSchema,
    phaseCount: SourcedCountSchema,
    taskCounts: TaskCountsSchema,
    phases: z.array(WorkPhaseFactSchema),
    dependencies: z.array(WorkRelationshipFactSchema),
    blockers: z.array(WorkRelationshipFactSchema),
    closeout: WorkCloseoutFactSchema.nullable(),
    sourceLinks: z.array(WorkSourceLinkFactSchema),
    gitEvidence: z.array(WorkGitEvidenceSchema),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.coordinate.value !== null && !waveCoordinate.safeParse(value.coordinate.value).success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["coordinate", "value"],
        message: "A work coordinate must use Wn Rn form.",
      });
    }

    const tasks = value.phases.flatMap((phase) => phase.tasks);
    const complete = tasks.filter((task) => task.completed.value === true).length;
    const incomplete = tasks.filter((task) => task.completed.value === false).length;
    const unknown = tasks.filter((task) => task.completed.value === null).length;
    if (value.phaseCount.value !== value.phases.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phaseCount", "value"],
        message: "Phase count must equal the interpreted phase collection length.",
      });
    }
    const recordPrefix = `${value.recordPath.replace(/\/$/, "")}/`;
    if (
      value.discoveredFiles.some((file) => {
        if (!file.startsWith(recordPrefix) || !file.endsWith(".md")) {
          return true;
        }
        return file.slice(recordPrefix.length).includes("/");
      })
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discoveredFiles"],
        message: "Discovered files must be top-level Markdown files inside the record directory.",
      });
    }
    if (value.phases.some((phase) => !phase.phasePath.startsWith(recordPrefix))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phases"],
        message: "Interpreted phases must be inside the record directory.",
      });
    }
    if (
      value.lastUpdatedAt.evidence.some((evidence) => !evidence.path.startsWith(recordPrefix)) ||
      value.gitEvidence.some(
        (evidence) => evidence.path !== null && !evidence.path.startsWith(recordPrefix),
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lastUpdatedAt"],
        message: "Last-updated evidence must stay inside the work record directory.",
      });
    }
    if (
      value.taskCounts.total.value !== tasks.length ||
      value.taskCounts.complete.value !== complete ||
      value.taskCounts.incomplete.value !== incomplete ||
      value.taskCounts.unknown.value !== unknown
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["taskCounts"],
        message: "Task counts must match the interpreted phase tasks.",
      });
    }

    if (value.sourceShape.state === "supported") {
      for (const field of ["coordinate", "title", "recordedStatus"] as const) {
        if (value[field].value === null) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field, "value"],
            message: `A supported record requires ${field}.`,
          });
        }
      }
    }

    if (value.sourceShape.state === "unsupported") {
      const interpretedCollections = [
        value.phases,
        value.dependencies,
        value.blockers,
        value.sourceLinks,
        value.gitEvidence,
      ];
      if (
        value.title.value !== null ||
        value.title.evidence.length > 0 ||
        value.recordedStatus.value !== null ||
        value.recordedStatus.evidence.length > 0 ||
        value.closeout !== null ||
        value.phaseCount.value !== 0 ||
        value.taskCounts.total.value !== 0 ||
        interpretedCollections.some((items) => items.length > 0)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "An unsupported record can contain inventory facts only.",
        });
      }
    }
  });

export const BacklogSnapshotV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: utcTimestamp,
    targetRoot: text,
    project: BacklogProjectSchema,
    gitRevision: gitCommit,
    capabilities: z
      .object({
        repositoryFiles: BacklogCapabilitySchema,
        git: BacklogCapabilitySchema,
        store: BacklogCapabilitySchema,
        sourceLinks: BacklogCapabilitySchema,
      })
      .strict(),
    recordCounts: BacklogRecordCountsSchema,
    records: z.array(BacklogWorkRecordV1Schema),
    diagnostics: z.array(BacklogDiagnosticSchema),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.recordCounts.found !== value.recordCounts.live + value.recordCounts.archived) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recordCounts"],
        message: "Found records must equal live plus archived records.",
      });
    }
    const live = value.records.filter((record) => record.scope === "live").length;
    const archived = value.records.filter((record) => record.scope === "archived").length;
    if (
      value.recordCounts.found !== value.records.length ||
      value.recordCounts.live !== live ||
      value.recordCounts.archived !== archived
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["records"],
        message: "Record counts must match the returned record collection and scopes.",
      });
    }
    if (new Set(value.records.map((record) => record.recordPath)).size !== value.records.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["records"],
        message: "Each recordPath must be unique.",
      });
    }
  });

export const BacklogSourceReaderIdSchema = z.enum([
  "current-frontmatter-v1",
  "unsupported-inventory-v1",
]);

export const BacklogSourceReaderInputSchema = z
  .object({
    recordPath: repositoryRelativePath,
    scope: WorkScopeSchema,
    indexPath: repositoryRelativePath.nullable(),
    discoveredFiles: z.array(repositoryRelativePath),
  })
  .strict()
  .superRefine((value, context) => {
    const recordPrefix = `${value.recordPath.replace(/\/$/, "")}/`;
    const expectedIndexPath = `${recordPrefix}00-index.md`;
    if (value.indexPath !== null && value.indexPath !== expectedIndexPath) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["indexPath"],
        message: "A source reader index path must be the record's top-level 00-index.md.",
      });
    }
    if (
      value.discoveredFiles.some((file) => {
        if (!file.startsWith(recordPrefix) || !file.endsWith(".md")) {
          return true;
        }
        return file.slice(recordPrefix.length).includes("/");
      })
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discoveredFiles"],
        message: "A source reader can receive only top-level Markdown files from its record directory.",
      });
    }
  });

export const PhaseMapAuthoritySchema = z
  .object({
    recordPath: repositoryRelativePath,
    indexPath: repositoryRelativePath,
    evidence: z.array(EvidenceReferenceSchema).min(1),
    linkedPhasePaths: z.array(repositoryRelativePath),
    interpretedPhasePaths: z.array(repositoryRelativePath),
    unlinkedCurrentPhasePaths: z.array(repositoryRelativePath),
  })
  .strict()
  .superRefine((value, context) => {
    const unique = (items: string[]) => new Set(items).size === items.length;
    if (
      !unique(value.linkedPhasePaths) ||
      !unique(value.interpretedPhasePaths) ||
      !unique(value.unlinkedCurrentPhasePaths)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phase-map path collections must not contain duplicates.",
      });
    }
    if (value.interpretedPhasePaths.some((path) => !value.linkedPhasePaths.includes(path))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["interpretedPhasePaths"],
        message: "Every interpreted phase must be linked by the work index phase map.",
      });
    }
    if (value.unlinkedCurrentPhasePaths.some((path) => value.interpretedPhasePaths.includes(path))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unlinkedCurrentPhasePaths"],
        message: "An unlinked current phase cannot enter the interpreted phase set.",
      });
    }
    const recordPrefix = `${value.recordPath.replace(/\/$/, "")}/`;
    const paths = [
      value.indexPath,
      ...value.linkedPhasePaths,
      ...value.interpretedPhasePaths,
      ...value.unlinkedCurrentPhasePaths,
    ];
    if (paths.some((path) => !path.startsWith(recordPrefix))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phase-map authority paths must stay inside the work record directory.",
      });
    }
    if (value.indexPath !== `${recordPrefix}00-index.md`) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["indexPath"],
        message: "Phase-map authority must come from the record's top-level 00-index.md.",
      });
    }
  });

export const BacklogSourceReaderAdapterContractSchema = z
  .object({
    contractVersion: z.literal(1),
    readerId: BacklogSourceReaderIdSchema,
    acceptedSourceShape: z.enum(["current-frontmatter", "unsupported-inventory"]),
    outputRecordSchemaVersion: z.literal(1),
    phaseMapAuthority: z.enum(["required", "not-applicable"]),
    interpretsLegacyBody: z.literal(false),
  })
  .strict()
  .superRefine((value, context) => {
    const isCurrent = value.readerId === "current-frontmatter-v1";
    if (
      (isCurrent &&
        (value.acceptedSourceShape !== "current-frontmatter" ||
          value.phaseMapAuthority !== "required")) ||
      (!isCurrent &&
        (value.acceptedSourceShape !== "unsupported-inventory" ||
          value.phaseMapAuthority !== "not-applicable"))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The source reader identity, accepted shape, and phase-map policy must agree.",
      });
    }
  });

export const BACKLOG_SOURCE_READER_ADAPTER_CONTRACTS = Object.freeze([
  {
    contractVersion: 1,
    readerId: "current-frontmatter-v1",
    acceptedSourceShape: "current-frontmatter",
    outputRecordSchemaVersion: 1,
    phaseMapAuthority: "required",
    interpretsLegacyBody: false,
  },
  {
    contractVersion: 1,
    readerId: "unsupported-inventory-v1",
    acceptedSourceShape: "unsupported-inventory",
    outputRecordSchemaVersion: 1,
    phaseMapAuthority: "not-applicable",
    interpretsLegacyBody: false,
  },
] satisfies readonly z.infer<typeof BacklogSourceReaderAdapterContractSchema>[]);

export const BacklogSourceReaderResultV1Schema = z
  .object({
    contractVersion: z.literal(1),
    readerId: BacklogSourceReaderIdSchema,
    record: BacklogWorkRecordV1Schema,
    phaseMapAuthority: PhaseMapAuthoritySchema.nullable(),
    diagnostics: z.array(BacklogDiagnosticSchema),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.readerId === "current-frontmatter-v1") {
      if (value.record.sourceShape.state === "unsupported" || value.phaseMapAuthority === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "The current-frontmatter reader returns a supported or partial record with phase-map authority.",
        });
      } else {
        const interpreted = value.phaseMapAuthority.interpretedPhasePaths;
        const recordPhases = value.record.phases.map((phase) => phase.phasePath);
        if (
          value.phaseMapAuthority.recordPath !== value.record.recordPath ||
          interpreted.length !== recordPhases.length ||
          interpreted.some((path) => !recordPhases.includes(path))
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "The public record phase set must exactly match the reader's phase-map authority result.",
          });
        }
      }
    } else if (
      value.record.sourceShape.state !== "unsupported" ||
      value.phaseMapAuthority !== null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The unsupported-inventory reader returns an unsupported record without interpreted phase authority.",
      });
    }
    const emittedCodes = new Set(value.diagnostics.map((diagnostic) => diagnostic.code));
    const requiredCodes = [
      ...value.record.sourceShape.diagnosticCodes,
      ...value.record.createdAt.diagnosticCodes,
      ...value.record.lastUpdatedAt.diagnosticCodes,
    ];
    if (requiredCodes.some((code) => !emittedCodes.has(code))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["diagnostics"],
        message: "The reader result must emit every diagnostic named by its public record facts.",
      });
    }
  });

export interface BacklogSourceReaderAdapter {
  readonly contract: BacklogSourceReaderAdapterContract;
  read(input: BacklogSourceReaderInput): BacklogSourceReaderResultV1;
}

export const FrontmatterSourceSchema = z
  .object({
    type: text,
    path: repositoryRelativePath,
  })
  .passthrough();

export const CurrentWorkIndexFrontmatterSchema = z
  .object({
    title: text,
    kind: z.literal("work"),
    status: text,
    coordinate: waveCoordinate,
    source: FrontmatterSourceSchema.optional(),
  })
  .passthrough();

export const CurrentPhaseFrontmatterSchema = z
  .object({
    title: text,
    kind: z.literal("work"),
    status: text,
    coordinate: phaseCoordinate,
    source: FrontmatterSourceSchema.optional(),
  })
  .passthrough();

export const FactClaimSchema = z
  .object({
    class: z.literal("fact"),
    text,
    evidence: z.array(EvidenceReferenceSchema).min(1),
  })
  .strict();

export const InferenceClaimSchema = z
  .object({
    class: z.literal("inference"),
    text,
    evidence: z.array(EvidenceReferenceSchema).min(1),
    confidence: z.enum(["low", "medium", "high"]),
    limits: z.array(text),
  })
  .strict();

export const RecommendationClaimSchema = z
  .object({
    class: z.literal("recommendation"),
    text,
    evidence: z.array(EvidenceReferenceSchema),
    rationale: text,
    limits: z.array(text),
  })
  .strict();

export const ReportClaimSchema = z.discriminatedUnion("class", [
  FactClaimSchema,
  InferenceClaimSchema,
  RecommendationClaimSchema,
]);

export const BacklogReportRecordV1Schema = z
  .object({
    recordPath: repositoryRelativePath,
    scope: WorkScopeSchema,
    createdAt: CreatedAtFactSchema,
    lastUpdatedAt: LastUpdatedAtFactSchema,
    waveStatus: WaveStatusSchema.nullable(),
    statusReason: text,
    statusEvidence: z.array(EvidenceReferenceSchema).min(1),
    facts: z.array(FactClaimSchema),
    inferences: z.array(InferenceClaimSchema),
    recommendations: z.array(RecommendationClaimSchema),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.scope === "live" && value.waveStatus === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["waveStatus"],
        message: "Every live record requires one fixed wave status.",
      });
    }
  });

export const BacklogReportTalliesSchema = z
  .object({
    workRecordsFound: z.number().int().nonnegative(),
    workRecordsStillInScope: z.number().int().nonnegative(),
    historicalRecords: z.number().int().nonnegative(),
    archivedRecords: z.number().int().nonnegative(),
  })
  .strict();

export const BacklogAttentionFindingSchema = z
  .object({
    id: text,
    recordPath: repositoryRelativePath.nullable(),
    claim: z.union([FactClaimSchema, InferenceClaimSchema]),
  })
  .strict();

export const BacklogRecommendationOrderItemSchema = z
  .object({
    rank: z.number().int().positive(),
    recordPath: repositoryRelativePath,
    claim: RecommendationClaimSchema,
  })
  .strict();

export const ProjectLeadSourceRoleSchema = z.enum([
  "purpose",
  "currentStatus",
  "currentObjective",
]);

export const ProjectLeadSourceSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
    role: ProjectLeadSourceRoleSchema,
    path: repositoryRelativePath,
    heading: nullableText,
    line: z.number().int().positive().nullable(),
    excerpt: text.max(2_000),
    contentHash: sha256Digest,
  })
  .strict();

export const ProjectLeadSentenceSchema = z
  .object({
    role: ProjectLeadSourceRoleSchema,
    text: text
      .max(320)
      .refine((value) => !/[\r\n]/.test(value), "A project lead sentence must stay on one line."),
    evidenceSourceIds: z
      .array(z.string().regex(/^[a-z][a-z0-9-]{0,63}$/))
      .min(1)
      .max(3),
  })
  .strict();

export const ProjectLeadSchema = z
  .object({
    sources: z.array(ProjectLeadSourceSchema).min(2).max(6),
    sentences: z.array(ProjectLeadSentenceSchema).min(2).max(3),
  })
  .strict()
  .superRefine((value, context) => {
    const sourceIds = value.sources.map((source) => source.id);
    if (new Set(sourceIds).size !== sourceIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sources"],
        message: "Project lead source ids must be unique.",
      });
    }

    const sentenceRoles = value.sentences.map((sentence) => sentence.role);
    if (
      sentenceRoles[0] !== "purpose" ||
      !["currentStatus", "currentObjective"].includes(sentenceRoles[1]) ||
      new Set(sentenceRoles).size !== sentenceRoles.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sentences"],
        message:
          "The project lead must start with purpose, then use current status or objective, without repeating a role.",
      });
    }

    const sourcesById = new Map(value.sources.map((source) => [source.id, source]));
    for (const [index, sentence] of value.sentences.entries()) {
      if (new Set(sentence.evidenceSourceIds).size !== sentence.evidenceSourceIds.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sentences", index, "evidenceSourceIds"],
          message: "Project lead evidence source ids must not repeat.",
        });
      }
      if (
        sentence.evidenceSourceIds.some(
          (sourceId) => sourcesById.get(sourceId)?.role !== sentence.role,
        )
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sentences", index, "evidenceSourceIds"],
          message: "Each project lead sentence must cite supplied context for its own role.",
        });
      }
    }
  });

export const BacklogReportV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: utcTimestamp,
    targetRoot: text,
    project: BacklogProjectSchema,
    projectLead: ProjectLeadSchema.nullable(),
    snapshot: BacklogSnapshotV1Schema,
    tallies: BacklogReportTalliesSchema,
    records: z.array(BacklogReportRecordV1Schema),
    attentionFindings: z.array(BacklogAttentionFindingSchema),
    recommendationOrder: z.array(BacklogRecommendationOrderItemSchema),
    diagnostics: z.array(BacklogDiagnosticSchema),
  })
  .strict()
  .superRefine((value, context) => {
    const found = value.records.length;
    const archived = value.records.filter((record) => record.scope === "archived").length;
    const historical = value.records.filter(
      (record) => record.scope === "live" && record.waveStatus === "history",
    ).length;
    const inScope = value.records.filter(
      (record) => record.scope === "live" && record.waveStatus !== "history",
    ).length;
    if (
      value.tallies.workRecordsFound !== found ||
      value.tallies.workRecordsStillInScope !== inScope ||
      value.tallies.historicalRecords !== historical ||
      value.tallies.archivedRecords !== archived ||
      value.tallies.workRecordsFound !==
        value.tallies.workRecordsStillInScope +
          value.tallies.historicalRecords +
          value.tallies.archivedRecords
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tallies"],
        message: "Report tallies must match their fixed portfolio meanings and sum invariant.",
      });
    }

    const reportPaths = value.records.map((record) => record.recordPath);
    const snapshotPaths = value.snapshot.records.map((record) => record.recordPath);
    if (
      reportPaths.length !== new Set(reportPaths).size ||
      reportPaths.length !== snapshotPaths.length ||
      reportPaths.some((recordPath) => !snapshotPaths.includes(recordPath))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["records"],
        message: "The report must preserve every snapshot record exactly once.",
      });
    }
    const snapshotScopes = new Map(
      value.snapshot.records.map((record) => [record.recordPath, record.scope]),
    );
    if (value.records.some((record) => snapshotScopes.get(record.recordPath) !== record.scope)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["records"],
        message: "Report record scope must match the snapshot.",
      });
    }
    const snapshotRecords = new Map(
      value.snapshot.records.map((record) => [record.recordPath, record]),
    );
    if (
      value.records.some((record) => {
        const snapshotRecord = snapshotRecords.get(record.recordPath);
        return (
          snapshotRecord === undefined ||
          JSON.stringify(record.createdAt) !== JSON.stringify(snapshotRecord.createdAt) ||
          JSON.stringify(record.lastUpdatedAt) !== JSON.stringify(snapshotRecord.lastUpdatedAt)
        );
      })
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["records"],
        message: "Report record dates must exactly preserve their snapshot facts and evidence.",
      });
    }
    if (
      value.tallies.workRecordsFound !== value.snapshot.recordCounts.found ||
      value.targetRoot !== value.snapshot.targetRoot ||
      JSON.stringify(value.project) !== JSON.stringify(value.snapshot.project)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The report identity and total must match its source snapshot.",
      });
    }
    if (
      value.attentionFindings.some(
        (finding) => finding.recordPath !== null && !snapshotPaths.includes(finding.recordPath),
      ) ||
      value.recommendationOrder.some((item) => !snapshotPaths.includes(item.recordPath))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Report findings and recommendations must refer to records in the snapshot.",
      });
    }
    const ranks = value.recommendationOrder.map((item) => item.rank);
    if (
      new Set(ranks).size !== ranks.length ||
      [...ranks].sort((left, right) => left - right).some((rank, index) => rank !== index + 1)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recommendationOrder"],
        message: "Recommendation ranks must be unique and contiguous from one.",
      });
    }
  });

export const AgentResponseSemanticExpectationSchema = z
  .object({
    subject: text,
    whatHappened: text,
    context: text,
    effect: text,
    knownFacts: z.array(text).min(1),
    unknownOrLimited: z.array(text).min(1),
    nextAction: text,
    humanAction: z
      .object({
        state: z.enum(["required", "optional", "none"]),
        action: nullableText,
      })
      .strict(),
    diagnosticCodes: z.array(
      z.string().regex(/^BACKLOG-(?:VAL|AGENT)-\d{3}$/),
    ),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.humanAction.state === "none" && value.humanAction.action !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["humanAction", "action"],
        message: "No human action must use a null action description.",
      });
    }
    if (value.humanAction.state !== "none" && value.humanAction.action === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["humanAction", "action"],
        message: "Required or optional human action needs a plain-language description.",
      });
    }
  });

export type DiagnosticSeverity = z.infer<typeof DiagnosticSeveritySchema>;
export type WaveStatus = z.infer<typeof WaveStatusSchema>;
export type WorkScope = z.infer<typeof WorkScopeSchema>;
export type EvidenceReference = z.infer<typeof EvidenceReferenceSchema>;
export type NullableSourcedString = z.infer<typeof NullableSourcedStringSchema>;
export type SourcedString = z.infer<typeof SourcedStringSchema>;
export type NullableSourcedBoolean = z.infer<typeof NullableSourcedBooleanSchema>;
export type SourcedCount = z.infer<typeof SourcedCountSchema>;
export type CreatedAtFact = z.infer<typeof CreatedAtFactSchema>;
export type LastUpdatedAtFact = z.infer<typeof LastUpdatedAtFactSchema>;
export type CapabilityState = z.infer<typeof CapabilityStateSchema>;
export type BacklogCapability = z.infer<typeof BacklogCapabilitySchema>;
export type SourceShape = z.infer<typeof SourceShapeSchema>;
export type WorkTaskFact = z.infer<typeof WorkTaskFactSchema>;
export type WorkRelationshipFact = z.infer<typeof WorkRelationshipFactSchema>;
export type WorkSourceLinkFact = z.infer<typeof WorkSourceLinkFactSchema>;
export type WorkPhaseFact = z.infer<typeof WorkPhaseFactSchema>;
export type WorkCloseoutFact = z.infer<typeof WorkCloseoutFactSchema>;
export type WorkGitEvidence = z.infer<typeof WorkGitEvidenceSchema>;
export type BacklogDiagnostic = z.infer<typeof BacklogDiagnosticSchema>;
export type TaskCounts = z.infer<typeof TaskCountsSchema>;
export type BacklogProject = z.infer<typeof BacklogProjectSchema>;
export type BacklogRecordCounts = z.infer<typeof BacklogRecordCountsSchema>;
export type BacklogWorkRecordV1 = z.infer<typeof BacklogWorkRecordV1Schema>;
export type BacklogSnapshotV1 = z.infer<typeof BacklogSnapshotV1Schema>;
export type BacklogSourceReaderId = z.infer<typeof BacklogSourceReaderIdSchema>;
export type BacklogSourceReaderInput = z.infer<typeof BacklogSourceReaderInputSchema>;
export type PhaseMapAuthority = z.infer<typeof PhaseMapAuthoritySchema>;
export type BacklogSourceReaderAdapterContract = z.infer<
  typeof BacklogSourceReaderAdapterContractSchema
>;
export type BacklogSourceReaderResultV1 = z.infer<
  typeof BacklogSourceReaderResultV1Schema
>;
export type FrontmatterSource = z.infer<typeof FrontmatterSourceSchema>;
export type CurrentWorkIndexFrontmatter = z.infer<typeof CurrentWorkIndexFrontmatterSchema>;
export type CurrentPhaseFrontmatter = z.infer<typeof CurrentPhaseFrontmatterSchema>;
export type FactClaim = z.infer<typeof FactClaimSchema>;
export type InferenceClaim = z.infer<typeof InferenceClaimSchema>;
export type RecommendationClaim = z.infer<typeof RecommendationClaimSchema>;
export type ReportClaim = z.infer<typeof ReportClaimSchema>;
export type BacklogReportRecordV1 = z.infer<typeof BacklogReportRecordV1Schema>;
export type BacklogReportTallies = z.infer<typeof BacklogReportTalliesSchema>;
export type BacklogAttentionFinding = z.infer<typeof BacklogAttentionFindingSchema>;
export type BacklogRecommendationOrderItem = z.infer<
  typeof BacklogRecommendationOrderItemSchema
>;
export type ProjectLeadSourceRole = z.infer<typeof ProjectLeadSourceRoleSchema>;
export type ProjectLeadSource = z.infer<typeof ProjectLeadSourceSchema>;
export type ProjectLeadSentence = z.infer<typeof ProjectLeadSentenceSchema>;
export type ProjectLead = z.infer<typeof ProjectLeadSchema>;
export type BacklogReportV1 = z.infer<typeof BacklogReportV1Schema>;
export type AgentResponseSemanticExpectation = z.infer<
  typeof AgentResponseSemanticExpectationSchema
>;
