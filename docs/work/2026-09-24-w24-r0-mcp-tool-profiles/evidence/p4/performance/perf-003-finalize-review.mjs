import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { readJson, sha256, immutableJson, PROFILE, LIMITS } from './perf-003-common.mjs';

// Append review disposition. Do not launch a server or change the frozen method.
const directory = path.dirname(new URL(import.meta.url).pathname);
const reviewFile = path.resolve(directory, '../review/performance-review-cycle-2.json');
const review = readJson(reviewFile);
const ledger = readJson(path.join(directory, 'attempt-02-ledger.json'));
const result = readJson(path.join(directory, 'attempt-02-result.json'));
const first = readJson(path.join(directory, 'attempt-01-problem.json'));
assert.deepEqual(ledger.binding, PROFILE);
assert.deepEqual(result.binding, PROFILE);
assert.equal(ledger.consumed.reviews, 1);
assert.equal(ledger.consumed.launches, 30);
assert.equal(ledger.consumed.listCalls, 360);
assert.equal(first.consumed.launches, 0);
assert.equal(first.consumed.listCalls, 0);
assert.equal(first.outcome, 'revise');
assert.equal(review.reviewCycle, 2);
assert.equal(review.disposition, 'pass within local characterization scope');
assert.ok(review.checks.validSamples && review.checks.fingerprintUnchanged && review.checks.allChildrenExited && review.checks.noRerun);
const root = directory.slice(0, directory.indexOf('/docs/work/'));
for (const [relative, digest] of Object.entries(review.inputs)) assert.equal(sha256(fs.readFileSync(path.join(root, relative))), digest, `Review input changed: ${relative}`);
const finalizedAt = new Date().toISOString();
const elapsedMs = Date.parse(finalizedAt) - Date.parse(ledger.activatedAt);
assert.ok(elapsedMs >= ledger.consumed.elapsedMs && elapsedMs < LIMITS.elapsedMs);
const finalLedger = {
  ...ledger, finalizedAt, supersedesForCurrentBudget: 'attempt-02-ledger.json',
  consumed: { ...ledger.consumed, reviews: 2, elapsedMs },
  remaining: { ...ledger.remaining, reviews: 0, elapsedMs: LIMITS.elapsedMs - elapsedMs },
  attempts: ledger.attempts.map(attempt => attempt.attempt === 1 ? { ...attempt, outcome: first.outcome } : attempt),
  reviewCycles: [{ cycle: 1, reviewer: '/root/p4_performance', disposition: 'pass', evidence: 'attempt-02-result.json' }, { cycle: 2, reviewer: '/root/p4_contracts', disposition: 'pass', evidence: '../review/performance-review-cycle-2.json', sha256: sha256(fs.readFileSync(reviewFile)) }],
  reportQualification: 'The original first-attempt problem emits revise. The earlier ledger called it blocked. This final ledger records the exact retained revise outcome. No method or sample changed.',
  stopReason: 'Declared measured sample count and both allowed review cycles complete. The pass and sole correction are spent. No unchanged rerun, additional review cycle, or budget extension.',
};
const finalResult = {
  ...result, finalizedAt, currentResultRecord: 'attempt-02-result-final.json', priorResult: 'attempt-02-result.json', ledger: 'attempt-02-ledger-final.json',
  reviewerDisposition: 'Both allowed reviews pass the exact local PERF-003 characterization. The independent review checks list counts/bytes/hashes, sample order, medians/ranges/raw values, fingerprint, cleanup, binding, and original budget. No server rerun occurs during review.',
  independentReview: { reviewer: '/root/p4_contracts', cycle: 2, outcome: 'pass', evidence: '../review/performance-review-cycle-2.json', sha256: sha256(fs.readFileSync(reviewFile)) },
  findings: result.findings.map(finding => ({ ...finding, attempts: ['attempt-01-problem.json', 'attempt-02-manifest.json'], affectedScope: 'Pre-measurement source-root fingerprint qualification only; zero measured samples in attempt1.', disposition: 'Closed by the one allowed source-root correction and independent review2. Initial retained outcome is revise; corrected packet passes. No samples lost, replaced, or added.', laterResult: 'attempt-02-result-final.json' })),
  reportQualification: finalLedger.reportQualification,
};
immutableJson(path.join(directory, 'attempt-02-ledger-final.json'), finalLedger);
immutableJson(path.join(directory, 'attempt-02-result-final.json'), finalResult);
process.stdout.write(`${JSON.stringify({ outcome: finalResult.outcome, elapsedMs, reviews: 2, remainingReviews: 0, launches: 30, listCalls: 360 })}\n`);
