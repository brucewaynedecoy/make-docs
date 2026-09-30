import {
  BacklogReportV1Schema, type BacklogReportV1, type BacklogSnapshotV1,
} from "../../src/operations/work/backlog/schemas";
import { canonicalCurrentRecordFixture, mixedPortfolioFixture, sourceShapeLimitsFixture } from "./backlog-contract";

export const PRESENTATION_SESSION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function fromSnapshot(snapshot: BacklogSnapshotV1): BacklogReportV1 {
  const archived = snapshot.records.filter(record => record.scope === "archived").length;
  return BacklogReportV1Schema.parse({
    schemaVersion: 1, generatedAt: snapshot.generatedAt, targetRoot: snapshot.targetRoot,
    project: snapshot.project, projectLead: null, snapshot,
    tallies: { workRecordsFound: snapshot.records.length, workRecordsStillInScope: snapshot.records.length - archived, historicalRecords: 0, archivedRecords: archived },
    records: snapshot.records.map(record => ({
      recordPath: record.recordPath, scope: record.scope, createdAt: record.createdAt, lastUpdatedAt: record.lastUpdatedAt,
      waveStatus: record.scope === "live" ? "current" : null,
      statusReason: "The synthetic record needs a final review.",
      statusEvidence: [{ path: `${record.recordPath}/00-index.md`, line: 1, field: "status", commit: null }],
      facts: [], inferences: [], recommendations: [],
    })), attentionFindings: [], recommendationOrder: [], diagnostics: snapshot.diagnostics,
  });
}

export const smallPresentationReport = fromSnapshot(structuredClone(canonicalCurrentRecordFixture.snapshot));
const smallRecord = smallPresentationReport.records[0];
const evidence = smallRecord.statusEvidence;
smallRecord.facts = [{ class: "fact", text: "One sourced task is complete.", evidence }];
smallRecord.inferences = [{ class: "inference", text: "Closeout still needs a review.", evidence, confidence: "high", limits: ["This fixture does not prove owner acceptance."] }];
smallRecord.recommendations = [{ class: "recommendation", text: "Check the closeout record.", evidence, rationale: "A complete task does not prove an accepted closeout.", limits: ["Use the current source before acting."] }];
smallPresentationReport.attentionFindings = [{ id: "closeout-check", recordPath: smallRecord.recordPath, claim: smallRecord.inferences[0] }];
smallPresentationReport.recommendationOrder = [{ rank: 1, recordPath: smallRecord.recordPath, claim: smallRecord.recommendations[0] }];

export const limitedPresentationReport = fromSnapshot(structuredClone(sourceShapeLimitsFixture.snapshot));
limitedPresentationReport.records[0].waveStatus = "attention";
limitedPresentationReport.records[0].statusReason = "Only the linked phase can support this review.";
limitedPresentationReport.records[1].statusReason = "Archived inventory only. Its source shape cannot support conclusions.";

export function largePresentationReport(): BacklogReportV1 {
  const report = structuredClone(mixedPortfolioFixture.report) as BacklogReportV1;
  report.records = []; report.snapshot.records = []; report.attentionFindings = []; report.recommendationOrder = [];
  report.projectLead = null;
  for (let group = 0; group < 20; group += 1) {
    const paths = new Map(mixedPortfolioFixture.report.records.map(record => [record.recordPath, `${record.recordPath}-copy-${group}`]));
    const remap = <T>(value: T): T => {
      let json = JSON.stringify(value);
      for (const [before, after] of paths) json = json.replaceAll(before, after);
      return JSON.parse(json);
    };
    const sources = remap(mixedPortfolioFixture.report.snapshot.records);
    sources.forEach((source, index) => { if (source.coordinate.value !== null) source.coordinate.value = `W${100 + group} R${index}`; });
    report.snapshot.records.push(...sources);
    report.records.push(...remap(mixedPortfolioFixture.report.records));
    report.attentionFindings.push(...remap(mixedPortfolioFixture.report.attentionFindings).map(finding => ({ ...finding, id: `${finding.id}-copy-${group}` })));
    report.recommendationOrder.push(...remap(mixedPortfolioFixture.report.recommendationOrder).map(item => ({ ...item, rank: group + 1 })));
  }
  report.snapshot.recordCounts = { found: 140, live: 120, archived: 20 };
  report.tallies = { workRecordsFound: 140, workRecordsStillInScope: 100, historicalRecords: 20, archivedRecords: 20 };
  return BacklogReportV1Schema.parse(report);
}

export const presentationCases = [
  { name: "small", report: smallPresentationReport, expectedTallies: { workRecordsFound: 1, workRecordsStillInScope: 1, historicalRecords: 0, archivedRecords: 0 } },
  { name: "mixed", report: mixedPortfolioFixture.report, expectedTallies: { workRecordsFound: 7, workRecordsStillInScope: 5, historicalRecords: 1, archivedRecords: 1 } },
  { name: "limited", report: limitedPresentationReport, expectedTallies: { workRecordsFound: 2, workRecordsStillInScope: 1, historicalRecords: 0, archivedRecords: 1 } },
  { name: "large", report: largePresentationReport(), expectedTallies: { workRecordsFound: 140, workRecordsStillInScope: 100, historicalRecords: 20, archivedRecords: 20 } },
];
