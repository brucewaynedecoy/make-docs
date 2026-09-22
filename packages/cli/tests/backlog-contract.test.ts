import { execFileSync } from "node:child_process";
import { existsSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  AgentResponseSemanticExpectationSchema,
  BACKLOG_RULE_CATALOG_ID,
  BACKLOG_RULE_CATALOG_VERSION,
  BACKLOG_RULES,
  BACKLOG_SOURCE_READER_ADAPTER_CONTRACTS,
  BacklogReportV1Schema,
  BacklogSnapshotV1Schema,
  BacklogSourceReaderAdapterContractSchema,
  BacklogSourceReaderInputSchema,
  BacklogSourceReaderResultV1Schema,
  CurrentPhaseFrontmatterSchema,
  CurrentWorkIndexFrontmatterSchema,
  PhaseMapAuthoritySchema,
  WaveStatusSchema,
  backlogRuleCatalogDigest,
} from "../src/operations/work/backlog";
import {
  BACKLOG_FIXTURE_GROUP_NAMES,
  TEMPORARY_EVIDENCE_TIMES,
  WAVE_STATUSES,
  backlogContractFixtureGroups,
  canonicalCurrentRecordFixture,
  conflictsAndLinksFixture,
  createTemporaryBacklogEvidenceFixture,
  datesAndCapabilitiesFixture,
  expectedCompactChatPresentation,
  expectedHtmlPresentation,
  mixedPortfolioFixture,
  safetyAndHumanErrorsFixture,
  sourceReaderAdapterFixture,
  sourceShapeLimitsFixture,
} from "./fixtures/backlog-contract";

const clone = <T>(value: T): T => structuredClone(value);

describe("backlog contract fixture inventory", () => {
  it("defines the six accepted synthetic fixture groups without project content", () => {
    expect(backlogContractFixtureGroups.map((group) => group.name)).toEqual(
      BACKLOG_FIXTURE_GROUP_NAMES,
    );
    expect(new Set(BACKLOG_FIXTURE_GROUP_NAMES).size).toBe(6);

    const serialized = JSON.stringify(backlogContractFixtureGroups);
    expect(serialized).toContain("Aurora Notes");
    expect(serialized).not.toContain("Make Docs");
    expect(serialized).not.toContain("W23 R0");
  });

});

const pathIsInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
};

describe("temporary repository and path evidence harness", () => {
  it("creates a fixed Git commit with changed and untracked scoped files", () => {
    const fixture = createTemporaryBacklogEvidenceFixture();
    try {
      const commitDate = execFileSync("git", ["log", "-1", "--format=%cI"], {
        cwd: fixture.gitRoot,
        encoding: "utf8",
      }).trim();
      const status = execFileSync(
        "git",
        ["status", "--short", "--untracked-files=all"],
        { cwd: fixture.gitRoot, encoding: "utf8" },
      );

      expect(new Date(commitDate).toISOString()).toBe(
        new Date(TEMPORARY_EVIDENCE_TIMES.commit).toISOString(),
      );
      expect(status).toContain(
        " M docs/work/2042-06-01-w7-r1-temporary-evidence/00-index.md",
      );
      expect(status).toContain(
        "?? docs/work/2042-06-01-w7-r1-temporary-evidence/02-untracked-phase.md",
      );
    } finally {
      fixture.cleanup();
    }
  });

  it("uses fixed file times for changed and untracked Git evidence", () => {
    const fixture = createTemporaryBacklogEvidenceFixture();
    try {
      const changed = statSync(fixture.trackedIndexPath).mtime.toISOString();
      const untracked = statSync(fixture.untrackedPhasePath).mtime.toISOString();

      expect(changed).toBe(
        new Date(TEMPORARY_EVIDENCE_TIMES.changed).toISOString(),
      );
      expect(untracked).toBe(
        new Date(TEMPORARY_EVIDENCE_TIMES.untracked).toISOString(),
      );
      expect(Date.parse(untracked)).toBeGreaterThan(Date.parse(changed));
    } finally {
      fixture.cleanup();
    }
  });

  it("creates a non-Git directory with a deterministic filesystem fallback", () => {
    const fixture = createTemporaryBacklogEvidenceFixture();
    try {
      expect(existsSync(path.join(fixture.filesystemRoot, ".git"))).toBe(false);
      const newest = fixture.filesystemPaths
        .map((filePath) => statSync(filePath).mtime)
        .sort((left, right) => right.getTime() - left.getTime())[0];
      expect(newest.toISOString()).toBe(
        new Date(TEMPORARY_EVIDENCE_TIMES.filesystemNewest).toISOString(),
      );
    } finally {
      fixture.cleanup();
    }
  });

  it("creates real symlink and traversal escapes outside the safe root", () => {
    const fixture = createTemporaryBacklogEvidenceFixture();
    try {
      const symlinkTarget = realpathSync(fixture.unsafeSymlinkPath);
      const traversalTarget = realpathSync(fixture.traversalPath);

      expect(symlinkTarget).toBe(realpathSync(fixture.outsideRoot));
      expect(traversalTarget).toBe(realpathSync(fixture.outsideFilePath));
      expect(pathIsInside(realpathSync(fixture.safeRoot), symlinkTarget)).toBe(false);
      expect(pathIsInside(realpathSync(fixture.safeRoot), traversalTarget)).toBe(false);
    } finally {
      fixture.cleanup();
    }
  });
});

describe("current frontmatter source contracts", () => {
  it("accepts valid work and phase frontmatter and preserves optional current fields", () => {
    expect(
      CurrentWorkIndexFrontmatterSchema.parse({
        ...canonicalCurrentRecordFixture.workIndexFrontmatter,
        source: { type: "design", path: "docs/designs/synthetic.md" },
        currentExtension: "preserved",
      }),
    ).toMatchObject({ currentExtension: "preserved" });
    expect(
      CurrentPhaseFrontmatterSchema.safeParse(
        canonicalCurrentRecordFixture.phaseFrontmatter,
      ).success,
    ).toBe(true);
  });

  it.each([
    ["missing kind", { title: "Missing kind", status: "active", coordinate: "W1 R1" }],
    ["wrong kind", { title: "Wrong kind", kind: "design", status: "active", coordinate: "W1 R1" }],
    ["missing title", { kind: "work", status: "active", coordinate: "W1 R1" }],
    ["missing status", { title: "Missing status", kind: "work", coordinate: "W1 R1" }],
    ["invalid wave coordinate", { title: "Bad coordinate", kind: "work", status: "active", coordinate: "wave-one" }],
  ])("rejects an invalid work index: %s", (_name, value) => {
    expect(CurrentWorkIndexFrontmatterSchema.safeParse(value).success).toBe(false);
  });

  it("rejects a wave coordinate in phase frontmatter", () => {
    expect(
      CurrentPhaseFrontmatterSchema.safeParse({
        ...canonicalCurrentRecordFixture.phaseFrontmatter,
        coordinate: "W1 R1",
      }).success,
    ).toBe(false);
  });
});

describe("private source-reader adapter and phase-map authority", () => {
  it("defines the current-frontmatter and inventory-only reader contracts", () => {
    expect(BACKLOG_SOURCE_READER_ADAPTER_CONTRACTS).toHaveLength(2);
    for (const contract of BACKLOG_SOURCE_READER_ADAPTER_CONTRACTS) {
      expect(BacklogSourceReaderAdapterContractSchema.safeParse(contract).success).toBe(
        true,
      );
      expect(contract.interpretsLegacyBody).toBe(false);
    }
    expect(
      BACKLOG_SOURCE_READER_ADAPTER_CONTRACTS.map((contract) => contract.readerId),
    ).toEqual(["current-frontmatter-v1", "unsupported-inventory-v1"]);
  });

  it("validates bounded reader inputs and versioned reader results", () => {
    expect(
      BacklogSourceReaderInputSchema.safeParse(sourceReaderAdapterFixture.currentInput)
        .success,
    ).toBe(true);
    expect(
      BacklogSourceReaderInputSchema.safeParse(
        sourceReaderAdapterFixture.unsupportedInput,
      ).success,
    ).toBe(true);
    expect(
      BacklogSourceReaderResultV1Schema.safeParse(
        sourceReaderAdapterFixture.currentResult,
      ).success,
    ).toBe(true);
    expect(
      BacklogSourceReaderResultV1Schema.safeParse(
        sourceReaderAdapterFixture.unsupportedResult,
      ).success,
    ).toBe(true);

    const missingRequiredDiagnostic = {
      ...clone(sourceReaderAdapterFixture.unsupportedResult),
      diagnostics: [],
    };
    expect(
      BacklogSourceReaderResultV1Schema.safeParse(missingRequiredDiagnostic)
        .success,
    ).toBe(false);
  });

  it("keeps interpreted phases inside the phase map and unlinked phases outside it", () => {
    expect(
      PhaseMapAuthoritySchema.safeParse(
        sourceReaderAdapterFixture.canonicalPhaseMapAuthority,
      ).success,
    ).toBe(true);
    expect(
      PhaseMapAuthoritySchema.safeParse(
        sourceReaderAdapterFixture.unlinkedPhaseMapAuthority,
      ).success,
    ).toBe(true);

    const invalid = {
      ...clone(sourceReaderAdapterFixture.unlinkedPhaseMapAuthority),
      interpretedPhasePaths: [
        ...sourceReaderAdapterFixture.unlinkedPhaseMapAuthority
          .unlinkedCurrentPhasePaths,
      ],
    };
    expect(PhaseMapAuthoritySchema.safeParse(invalid).success).toBe(false);

    const resultWithoutInterpretedPhase = {
      ...clone(sourceReaderAdapterFixture.currentResult),
      phaseMapAuthority: {
        ...clone(sourceReaderAdapterFixture.currentResult.phaseMapAuthority),
        interpretedPhasePaths: [],
      },
    };
    expect(
      BacklogSourceReaderResultV1Schema.safeParse(resultWithoutInterpretedPhase)
        .success,
    ).toBe(false);

    const unsupportedWithAuthority = {
      ...clone(sourceReaderAdapterFixture.unsupportedResult),
      phaseMapAuthority: clone(
        sourceReaderAdapterFixture.canonicalPhaseMapAuthority,
      ),
    };
    expect(
      BacklogSourceReaderResultV1Schema.safeParse(unsupportedWithAuthority).success,
    ).toBe(false);
  });

  it("rejects phase-map paths outside the record directory", () => {
    expect(
      PhaseMapAuthoritySchema.safeParse({
        ...sourceReaderAdapterFixture.canonicalPhaseMapAuthority,
        linkedPhasePaths: ["docs/work/outside-record.md"],
        interpretedPhasePaths: ["docs/work/outside-record.md"],
      }).success,
    ).toBe(false);

    expect(
      BacklogSourceReaderInputSchema.safeParse({
        ...sourceReaderAdapterFixture.currentInput,
        discoveredFiles: ["docs/work/outside-record.md"],
      }).success,
    ).toBe(false);

    expect(
      BacklogSourceReaderInputSchema.safeParse({
        ...sourceReaderAdapterFixture.currentInput,
        indexPath: `${sourceReaderAdapterFixture.currentInput.recordPath}/01-not-index.md`,
      }).success,
    ).toBe(false);

    expect(
      BacklogSourceReaderInputSchema.safeParse({
        ...sourceReaderAdapterFixture.currentInput,
        discoveredFiles: [
          `${sourceReaderAdapterFixture.currentInput.recordPath}/nested/phase.md`,
        ],
      }).success,
    ).toBe(false);

    expect(
      PhaseMapAuthoritySchema.safeParse({
        ...sourceReaderAdapterFixture.canonicalPhaseMapAuthority,
        indexPath: `${sourceReaderAdapterFixture.currentInput.recordPath}/01-not-index.md`,
      }).success,
    ).toBe(false);
  });
});

describe("version 1 snapshot schema", () => {
  it.each([
    ["canonical", canonicalCurrentRecordFixture.snapshot],
    ["mixed portfolio", mixedPortfolioFixture.snapshot],
    ["source-shape limits", sourceShapeLimitsFixture.snapshot],
    ["conflicts and links", conflictsAndLinksFixture.snapshot],
    ["dates and capabilities", datesAndCapabilitiesFixture.snapshot],
  ])("accepts the %s fixed snapshot", (_name, snapshot) => {
    expect(BacklogSnapshotV1Schema.safeParse(snapshot).success).toBe(true);
  });

  it("requires all versioned keys and rejects unknown keys", () => {
    const missingDiagnostics = clone(canonicalCurrentRecordFixture.snapshot) as Record<
      string,
      unknown
    >;
    delete missingDiagnostics.diagnostics;
    expect(BacklogSnapshotV1Schema.safeParse(missingDiagnostics).success).toBe(false);

    const unknownRootKey = {
      ...canonicalCurrentRecordFixture.snapshot,
      normalizedStatus: "active",
    };
    expect(BacklogSnapshotV1Schema.safeParse(unknownRootKey).success).toBe(false);

    const unknownRecordKey = clone(canonicalCurrentRecordFixture.snapshot);
    const recordWithUnknown = {
      ...unknownRecordKey.records[0],
      waveStatus: "current",
    };
    unknownRecordKey.records = [recordWithUnknown] as typeof unknownRecordKey.records;
    expect(BacklogSnapshotV1Schema.safeParse(unknownRecordKey).success).toBe(false);
  });

  it("uses null for unknown scalars and arrays for collections", () => {
    const invalidNullCollection = clone(canonicalCurrentRecordFixture.snapshot);
    invalidNullCollection.records[0].blockers = null as never;
    expect(BacklogSnapshotV1Schema.safeParse(invalidNullCollection).success).toBe(false);

    const invalidMissingScalar = clone(canonicalCurrentRecordFixture.snapshot) as {
      gitRevision?: string | null;
    };
    delete invalidMissingScalar.gitRevision;
    expect(BacklogSnapshotV1Schema.safeParse(invalidMissingScalar).success).toBe(false);
  });

  it("enforces record count sums, returned-record counts, and unique recordPath identity", () => {
    const invalidSum = clone(mixedPortfolioFixture.snapshot);
    invalidSum.recordCounts.found += 1;
    expect(BacklogSnapshotV1Schema.safeParse(invalidSum).success).toBe(false);

    const invalidScopes = clone(mixedPortfolioFixture.snapshot);
    invalidScopes.recordCounts.live -= 1;
    invalidScopes.recordCounts.archived += 1;
    expect(BacklogSnapshotV1Schema.safeParse(invalidScopes).success).toBe(false);

    const duplicate = clone(canonicalCurrentRecordFixture.snapshot);
    duplicate.records.push(clone(duplicate.records[0]));
    duplicate.recordCounts = { found: 2, live: 2, archived: 0 };
    expect(BacklogSnapshotV1Schema.safeParse(duplicate).success).toBe(false);
  });

  it("limits unsupported records to inventory facts", () => {
    const valid = BacklogSnapshotV1Schema.safeParse(sourceShapeLimitsFixture.snapshot);
    expect(valid.success).toBe(true);

    const unsupported = clone(sourceShapeLimitsFixture.snapshot);
    unsupported.records[1].title = {
      value: "A body-derived legacy title",
      evidence: [
        {
          path: `${unsupported.records[1].recordPath}/00-index.md`,
          line: 1,
          field: null,
          commit: null,
        },
      ],
    };
    expect(BacklogSnapshotV1Schema.safeParse(unsupported).success).toBe(false);
  });

  it("requires source-shape diagnostics for partial and unsupported records", () => {
    const partialWithoutDiagnostic = clone(sourceShapeLimitsFixture.snapshot);
    partialWithoutDiagnostic.records[0].sourceShape.diagnosticCodes = [];
    expect(BacklogSnapshotV1Schema.safeParse(partialWithoutDiagnostic).success).toBe(
      false,
    );

    const unsupportedWithoutDiagnostic = clone(sourceShapeLimitsFixture.snapshot);
    unsupportedWithoutDiagnostic.records[1].sourceShape.diagnosticCodes = [];
    expect(
      BacklogSnapshotV1Schema.safeParse(unsupportedWithoutDiagnostic).success,
    ).toBe(false);
  });

  it("requires a diagnostic for every last-updated fallback source", () => {
    for (const recordIndex of [2, 3, 4]) {
      const withoutFallbackDiagnostic = clone(datesAndCapabilitiesFixture.snapshot);
      withoutFallbackDiagnostic.records[recordIndex].lastUpdatedAt.diagnosticCodes = [];
      expect(
        BacklogSnapshotV1Schema.safeParse(withoutFallbackDiagnostic).success,
      ).toBe(false);
    }
  });

  it("uses only phase-map-linked phase facts and keeps unlinked evidence diagnostic-only", () => {
    const parsed = BacklogSnapshotV1Schema.parse(
      canonicalCurrentRecordFixture.snapshot,
    );
    expect(parsed.records[0].phases).toHaveLength(1);
    expect(parsed.records[0].phases[0].phaseMapLinked).toBe(true);
    expect(
      parsed.records[0].phases.some(
        (phase) => phase.phasePath === sourceShapeLimitsFixture.unlinkedPhase.path,
      ),
    ).toBe(false);
    expect(sourceShapeLimitsFixture.unlinkedPhase).toMatchObject({
      expectedDiagnosticCode: "BACKLOG-VAL-007",
      interpreted: false,
    });
  });

  it("keeps task, recorded-status, closeout, and link conflicts as separate evidence", () => {
    const parsed = BacklogSnapshotV1Schema.parse(conflictsAndLinksFixture.snapshot);
    expect(parsed.records[0].recordedStatus.value).toBe("complete");
    expect(parsed.records[0].closeout).toBeNull();
    expect(parsed.diagnostics.map((item) => item.code)).toEqual([
      "BACKLOG-VAL-008",
      "BACKLOG-VAL-009",
      "BACKLOG-VAL-016",
    ]);
  });

  it("treats Store not-used as normal and rejects a diagnostic on that state", () => {
    const valid = clone(canonicalCurrentRecordFixture.snapshot);
    expect(valid.capabilities.store).toEqual({ state: "not-used", diagnosticCodes: [] });
    expect(BacklogSnapshotV1Schema.safeParse(valid).success).toBe(true);

    valid.capabilities.store.diagnosticCodes = ["BACKLOG-VAL-010"];
    expect(BacklogSnapshotV1Schema.safeParse(valid).success).toBe(false);
  });
});

describe("version 1 report schema", () => {
  it("requires a short role-ordered and source-backed project lead", () => {
    const parsed = BacklogReportV1Schema.parse(mixedPortfolioFixture.report);
    expect(parsed.projectLead?.sentences.map((sentence) => sentence.role)).toEqual([
      "purpose",
      "currentObjective",
    ]);

    const wrongOrder = clone(mixedPortfolioFixture.report);
    if (!wrongOrder.projectLead) throw new Error("Synthetic report needs a project lead.");
    wrongOrder.projectLead.sentences.reverse();
    expect(BacklogReportV1Schema.safeParse(wrongOrder).success).toBe(false);

    const unknownEvidence = clone(mixedPortfolioFixture.report);
    if (!unknownEvidence.projectLead) throw new Error("Synthetic report needs a project lead.");
    unknownEvidence.projectLead.sentences[0].evidenceSourceIds = ["missing-source"];
    expect(BacklogReportV1Schema.safeParse(unknownEvidence).success).toBe(false);

    const omitted = { ...clone(mixedPortfolioFixture.report), projectLead: null };
    expect(BacklogReportV1Schema.safeParse(omitted).success).toBe(true);
  });

  it("covers every fixed wave status and permits flexible evidence-backed reasons", () => {
    const parsed = BacklogReportV1Schema.parse(mixedPortfolioFixture.report);
    const liveRecords = parsed.records.filter((record) => record.scope === "live");
    expect(liveRecords.map((record) => record.waveStatus)).toEqual(WAVE_STATUSES);
    expect(new Set(liveRecords.map((record) => record.statusReason)).size).toBe(6);
    expect(WaveStatusSchema.options).toEqual(WAVE_STATUSES);

    const revisedReason = clone(mixedPortfolioFixture.report);
    revisedReason.records[0].statusReason =
      "A new agent-written reason that keeps the fixed attention status";
    expect(BacklogReportV1Schema.safeParse(revisedReason).success).toBe(true);
  });

  it("keeps attention findings independent from wave status", () => {
    const parsed = BacklogReportV1Schema.parse(mixedPortfolioFixture.report);
    const finding = parsed.attentionFindings[0];
    const record = parsed.records.find(
      (candidate) => candidate.recordPath === finding.recordPath,
    );
    expect(record?.waveStatus).toBe("current");
    expect(finding.claim.class).toBe("inference");
  });

  it("requires every wave-specific report action to match one included record", () => {
    const parsed = BacklogReportV1Schema.parse(mixedPortfolioFixture.report);
    expect(parsed.attentionFindings.map((finding) => finding.recordPath)).toEqual([
      parsed.records[1]?.recordPath,
      null,
    ]);
    expect(parsed.recommendationOrder).toMatchObject([
      {
        rank: 1,
        recordPath: parsed.records[2]?.recordPath,
      },
    ]);

    const missingAttentionRecord = clone(mixedPortfolioFixture.report);
    missingAttentionRecord.attentionFindings[0].recordPath =
      "docs/work/2042-06-30-w9-r9-missing";
    const attentionResult = BacklogReportV1Schema.safeParse(missingAttentionRecord);
    expect(attentionResult.success).toBe(false);
    if (attentionResult.success) throw new Error("Expected an invalid Attention reference.");
    expect(attentionResult.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["attentionFindings", 0, "recordPath"],
          message:
            "A wave-specific Attention item must refer to exactly one included report record.",
        }),
      ]),
    );

    const missingNextRecord = clone(mixedPortfolioFixture.report);
    missingNextRecord.recommendationOrder[0].recordPath =
      "docs/work/2042-06-30-w9-r9-missing";
    const nextResult = BacklogReportV1Schema.safeParse(missingNextRecord);
    expect(nextResult.success).toBe(false);
    if (nextResult.success) throw new Error("Expected an invalid Next reference.");
    expect(nextResult.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["recommendationOrder", 0, "recordPath"],
          message: "Every Next item must refer to exactly one included report record.",
        }),
      ]),
    );
  });

  it("requires report dates to match the source snapshot exactly", () => {
    const valid = BacklogReportV1Schema.parse(mixedPortfolioFixture.report);
    for (const reportRecord of valid.records) {
      const snapshotRecord = valid.snapshot.records.find(
        (record) => record.recordPath === reportRecord.recordPath,
      );
      expect(reportRecord.createdAt).toEqual(snapshotRecord?.createdAt);
      expect(reportRecord.lastUpdatedAt).toEqual(snapshotRecord?.lastUpdatedAt);
    }

    const createdAtDrift = clone(mixedPortfolioFixture.report);
    createdAtDrift.records[0].createdAt = {
      ...createdAtDrift.records[0].createdAt,
      value: "2042-01-01",
    };
    expect(BacklogReportV1Schema.safeParse(createdAtDrift).success).toBe(false);

    const lastUpdatedDrift = clone(mixedPortfolioFixture.report);
    lastUpdatedDrift.records[0].lastUpdatedAt = {
      ...lastUpdatedDrift.records[0].lastUpdatedAt,
      value: "2042-01-01",
      precision: "date",
      source: "created-at-fallback",
      diagnosticCodes: ["BACKLOG-VAL-011"],
    };
    expect(BacklogReportV1Schema.safeParse(lastUpdatedDrift).success).toBe(false);
  });

  it("requires an evidence-backed status reason even for an archived null status", () => {
    const parsed = BacklogReportV1Schema.parse(mixedPortfolioFixture.report);
    const archived = parsed.records.find((record) => record.scope === "archived");
    expect(archived?.waveStatus).toBeNull();
    expect(archived?.statusReason).not.toBe("");
    expect(archived?.statusEvidence.length).toBeGreaterThan(0);

    const missingReason = clone(mixedPortfolioFixture.report);
    const archivedRecord = missingReason.records.find(
      (record) => record.scope === "archived",
    );
    if (!archivedRecord) throw new Error("Synthetic archived record is missing.");
    archivedRecord.statusReason = "";
    archivedRecord.statusEvidence = [];
    expect(BacklogReportV1Schema.safeParse(missingReason).success).toBe(false);
  });

  it("uses all report records for tallies even when presentation shows fewer records", () => {
    const parsed = BacklogReportV1Schema.parse(mixedPortfolioFixture.report);
    expect(parsed.records).toHaveLength(7);
    expect(mixedPortfolioFixture.presentationLimit).toBe(3);
    expect(parsed.tallies).toEqual(mixedPortfolioFixture.expectedTallies);
  });

  it("rejects tally drift, missing records, and live records without classification", () => {
    const tallyDrift = clone(mixedPortfolioFixture.report);
    tallyDrift.tallies.workRecordsStillInScope -= 1;
    expect(BacklogReportV1Schema.safeParse(tallyDrift).success).toBe(false);

    const missingRecord = clone(mixedPortfolioFixture.report);
    missingRecord.records.pop();
    expect(BacklogReportV1Schema.safeParse(missingRecord).success).toBe(false);

    const unclassified = clone(mixedPortfolioFixture.report);
    unclassified.records[0].waveStatus = null;
    unclassified.records[0].statusReason = "";
    unclassified.records[0].statusEvidence = [];
    expect(BacklogReportV1Schema.safeParse(unclassified).success).toBe(false);
  });

  it("keeps report decisions outside the deterministic snapshot", () => {
    const snapshotRecord = canonicalCurrentRecordFixture.snapshot.records[0] as unknown as Record<
      string,
      unknown
    >;
    expect(snapshotRecord).not.toHaveProperty("waveStatus");
    expect(snapshotRecord).not.toHaveProperty("statusReason");
    expect(snapshotRecord).not.toHaveProperty("recommendations");
  });
});

describe("bounded presentation models for guided review", () => {
  it.each([
    ["compact chat", expectedCompactChatPresentation.records],
    ["HTML", expectedHtmlPresentation.waves],
  ])("preserves every normalized report record in the %s model", (_name, records) => {
    expect(records.map((record) => record.recordPath)).toEqual(
      mixedPortfolioFixture.report.records.map((record) => record.recordPath),
    );
    for (const record of records) {
      const source = mixedPortfolioFixture.report.records.find(
        (candidate) => candidate.recordPath === record.recordPath,
      );
      expect(record).toMatchObject({
        scope: source?.scope,
        createdAt: source?.createdAt,
        lastUpdatedAt: source?.lastUpdatedAt,
        waveStatus: source?.waveStatus,
        statusReason: source?.statusReason,
        statusEvidence: source?.statusEvidence,
      });
    }
  });

  it("preserves fixed tally meaning in both presentation models", () => {
    expect(expectedCompactChatPresentation.tallies).toEqual(
      mixedPortfolioFixture.report.tallies,
    );
    expect(expectedHtmlPresentation.tallies).toEqual(
      mixedPortfolioFixture.report.tallies,
    );
    expect(expectedHtmlPresentation.waves).toHaveLength(
      mixedPortfolioFixture.report.tallies.workRecordsFound,
    );
  });

  it("uses the settled HTML filter order and In Scope default", () => {
    expect(expectedHtmlPresentation.filters).toEqual([
      "In Scope",
      "Attention",
      "Current",
      "Conflict",
      "Deferred",
      "Complete",
      "History",
      "Archived",
      "All",
    ]);
    expect(expectedHtmlPresentation.defaultFilter).toBe("In Scope");
  });

  it("uses the settled HTML sort options, default order, and tie breakers", () => {
    expect(expectedHtmlPresentation.sort.options).toEqual([
      { field: "createdAt", label: "Created date" },
      { field: "coordinate", label: "Coordinate" },
      { field: "lastUpdatedAt", label: "Last updated" },
    ]);
    expect(expectedHtmlPresentation.sort.default).toEqual({
      field: "lastUpdatedAt",
      direction: "descending",
      label: "Newest first",
    });
    expect(expectedHtmlPresentation.sort.tieBreakers).toEqual([
      { field: "coordinate", direction: "ascending" },
      { field: "recordPath", direction: "ascending" },
    ]);
  });

  it.each([
    ["compact chat", expectedCompactChatPresentation.fixtureExamples],
    ["HTML", expectedHtmlPresentation.fixtureExamples],
  ])("covers every synthetic fixture class in the %s model with source evidence", (_name, examples) => {
    expect(examples.map((example) => example.fixtureGroup)).toEqual(
      BACKLOG_FIXTURE_GROUP_NAMES,
    );
    for (const example of examples) {
      expect(example.label).not.toBe("");
      expect(example.evidence.length).toBeGreaterThan(0);
    }
  });
});

describe("date, capability, and stable-sort fixtures", () => {
  it("covers every accepted lastUpdatedAt source and its fallback diagnostics", () => {
    const parsed = BacklogSnapshotV1Schema.parse(datesAndCapabilitiesFixture.snapshot);
    expect(parsed.records.map((record) => record.lastUpdatedAt.source)).toEqual([
      "working-tree-mtime",
      "git-commit",
      "filesystem-mtime",
      "created-at-fallback",
      "unavailable",
    ]);
    expect(datesAndCapabilitiesFixture.timestampCases).toEqual([
      { source: "working-tree-mtime", value: "2042-06-14T10:00:00Z", diagnosticCodes: [] },
      { source: "git-commit", value: "2042-06-13T10:00:00Z", diagnosticCodes: [] },
      { source: "filesystem-mtime", value: "2042-06-12T10:00:00Z", diagnosticCodes: ["BACKLOG-VAL-010"] },
      { source: "created-at-fallback", value: "2042-06-11", diagnosticCodes: ["BACKLOG-VAL-011"] },
      { source: "unavailable", value: null, diagnosticCodes: ["BACKLOG-VAL-011"] },
    ]);
  });

  it("records deterministic coordinate and recordPath tie breakers", () => {
    const fixture = datesAndCapabilitiesFixture.stableSortTie;
    const sorted = [...fixture.records]
      .sort((left, right) =>
        left.recordPath.localeCompare(right.recordPath),
      )
      .sort((left, right) => left.coordinate.localeCompare(right.coordinate));
    expect(sorted.map((record) => record.recordPath)).toEqual(
      fixture.expectedRecordPaths,
    );
  });
});

describe("rule and diagnostic catalog", () => {
  it("has stable catalog identity, complete entries, and one-to-one rule codes", () => {
    expect(BACKLOG_RULE_CATALOG_ID).toBe("make-docs.backlog-review-rules.v1");
    expect(BACKLOG_RULE_CATALOG_VERSION).toBe(1);

    const ids = BACKLOG_RULES.map((rule) => rule.id);
    const codes = BACKLOG_RULES.map((rule) => rule.diagnosticCode);
    expect(new Set(ids).size).toBe(BACKLOG_RULES.length);
    expect(new Set(codes).size).toBe(BACKLOG_RULES.length);

    for (const rule of BACKLOG_RULES) {
      expect(rule.id).toMatch(/^BACKLOG-RULE-\d{3}$/);
      expect(rule.title).not.toBe("");
      expect(rule.trigger).not.toBe("");
      expect(rule.evidenceClass).not.toBe("");
      expect(rule.humanMeaning).not.toBe("");
      expect(rule.safeNextAction).not.toBe("");
      expect(rule.agentInstructionLocation).not.toBe("");
      expect(rule.focusedTests.length).toBeGreaterThan(0);
      expect(rule.parityMapping).not.toBe("");
      expect(["error", "warning", "info"]).toContain(rule.defaultSeverity);

      if (rule.deterministicSupport === "agent-only") {
        expect(rule.diagnosticCode).toMatch(/^BACKLOG-AGENT-\d{3}$/);
        expect(rule.judgmentRequired).toBe(true);
        expect(rule.oneSidedReason).not.toBeNull();
      } else {
        expect(rule.diagnosticCode).toMatch(/^BACKLOG-VAL-\d{3}$/);
      }
    }
  });

  it("produces a deterministic catalog digest", () => {
    const digest = backlogRuleCatalogDigest();
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(backlogRuleCatalogDigest()).toBe(digest);
  });

  it("keeps diagnostics from assigning status, color, priority, or recommendation", () => {
    for (const diagnostic of conflictsAndLinksFixture.snapshot.diagnostics) {
      expect(diagnostic).not.toHaveProperty("waveStatus");
      expect(diagnostic).not.toHaveProperty("color");
      expect(diagnostic).not.toHaveProperty("priority");
      expect(diagnostic).not.toHaveProperty("recommendation");
    }
  });
});

describe("human error meaning contract", () => {
  it.each(safetyAndHumanErrorsFixture.semanticExpectations)(
    "accepts structured meaning for $subject without fixing exact prose",
    (expectation) => {
      expect(AgentResponseSemanticExpectationSchema.safeParse(expectation).success).toBe(
        true,
      );

      const paraphrase = {
        ...expectation,
        whatHappened: `In plain language: ${expectation.whatHappened}`,
        context: `For this request, ${expectation.context}`,
        nextAction: `A useful next step is: ${expectation.nextAction}`,
      };
      expect(AgentResponseSemanticExpectationSchema.safeParse(paraphrase).success).toBe(
        true,
      );
      expect(paraphrase.diagnosticCodes).toEqual(expectation.diagnosticCodes);
      expect(paraphrase.humanAction.state).toBe(expectation.humanAction.state);
    },
  );

  it("rejects a raw-code-only response that omits human meaning", () => {
    expect(
      AgentResponseSemanticExpectationSchema.safeParse({
        subject: "BACKLOG-VAL-001",
        whatHappened: "BACKLOG-VAL-001",
        diagnosticCodes: ["BACKLOG-VAL-001"],
      }).success,
    ).toBe(false);
  });

  it("keeps hostile source text inert and unchanged", () => {
    const parsed = BacklogSnapshotV1Schema.safeParse({
      ...canonicalCurrentRecordFixture.snapshot,
      diagnostics: [safetyAndHumanErrorsFixture.unsafeDiagnostic],
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.diagnostics[0].message).toBe(
      safetyAndHumanErrorsFixture.hostileText,
    );
  });
});
