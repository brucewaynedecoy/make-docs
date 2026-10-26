import test from "node:test";
import assert from "node:assert/strict";
import { createP7Meter } from "./w25-p7-meter.mjs";

test("preparatory instrument validates exact monotonic boundaries and strips bodies", () => {
  let clock = 100n;
  const meter = createP7Meter({ fingerprint: { candidate: "test" }, clock: () => clock });
  meter.begin("cold"); clock = 110n; meter.request(1, "work.backlog.snapshot");
  const raw = { content: [{ type: "text", text: "PRIVATE_TEST_BODY" }], _meta: { backlog: { cache: { state: "available", result: { counts: { hits: 2, misses: 1, rejected: 0 } } } } } };
  clock = 140n; meter.response(1, raw); clock = 200n;
  const result = meter.rendered({ host: "test", validatedModel: true, witness: "synthetic instrument check" });
  assert.equal(result.elapsedNs, "100"); assert.equal(result.operationReceipts[0].elapsedNs, "30");
  assert.equal(result.payloadBytes, Buffer.byteLength(JSON.stringify(raw))); assert.deepEqual(result.cacheCounts, { hits: 2, misses: 1, rejected: 0 });
  assert.equal(result.countsAsPerfObservation, false); assert(!JSON.stringify(result).includes("PRIVATE_TEST_BODY"));
});
test("instrument rejects incomplete witnesses, duplicate observations, and budget overflow", () => {
  const meter = createP7Meter({ fingerprint: { candidate: "test" }, clock: () => 1n });
  for (const kind of ["cold", "unchanged", "changed"]) {
    meter.begin(kind); assert.throws(() => meter.rendered({ host: "test", validatedModel: false, witness: "test" }));
    meter.rendered({ host: "test", validatedModel: true, witness: "test" });
  }
  assert.throws(() => meter.begin("cold")); assert.throws(() => meter.begin("fourth"));
});
test("real-host mode cannot start from an unapproved or incomplete fingerprint", () => {
  assert.throws(() => createP7Meter({ mode: "real-host", fingerprint: { fixtureApproved: false } }));
  assert.throws(() => createP7Meter({ mode: "real-host", fingerprint: { fixtureApproved: true } }));
});
test("clock reversal and interruption stay visible rather than discarded", () => {
  let clock = 10n; const meter = createP7Meter({ fingerprint: { candidate: "test" }, clock: () => clock });
  meter.begin("cold"); meter.request(1, "snapshot"); clock = 9n; assert.throws(() => meter.response(1, {}));
  const result = meter.interrupted("invalid clock"); assert.equal(result.comparable, false); assert.equal(meter.results().length, 1);
});
