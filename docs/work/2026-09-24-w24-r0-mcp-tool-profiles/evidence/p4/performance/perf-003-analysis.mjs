import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { PROFILE, PROFILES, statistics, immutableJson, readJson } from './perf-003-common.mjs';

export function analyze(raw) {
  assert.deepEqual(raw.binding, PROFILE);
  assert.equal(raw.launches.length, 30);
  assert.ok(raw.launches.every(launch => launch.valid && launch.cleanup.childExited));
  const profiles = {};
  for (const profile of PROFILES) {
    const launches = raw.launches.filter(launch => launch.profile === profile).sort((a, b) => a.round - b.round);
    assert.equal(launches.length, 5);
    const startup = launches.map(launch => launch.startupMs);
    const timed = kind => launches.flatMap(launch => launch.samples.filter(sample => sample.kind === kind && !sample.warmup).map(sample => sample.elapsedMs));
    const tools = timed('tools');
    const resources = timed('resources');
    assert.equal(tools.length, 25);
    assert.equal(resources.length, 25);
    const toolDigests = new Set(launches.flatMap(launch => launch.samples.filter(sample => sample.kind === 'tools').map(sample => sample.arraySha256)));
    const resourceDigests = new Set(launches.flatMap(launch => launch.samples.filter(sample => sample.kind === 'resources').map(sample => sample.arraySha256)));
    assert.equal(toolDigests.size, 1);
    assert.equal(resourceDigests.size, 1);
    const firstTool = launches[0].samples.find(sample => sample.kind === 'tools');
    const firstResource = launches[0].samples.find(sample => sample.kind === 'resources');
    profiles[profile] = {
      counts: { tools: firstTool.uniqueCount, resources: firstResource.uniqueCount },
      toolDefinitionUtf8Bytes: firstTool.utf8Bytes,
      toolArraySha256: firstTool.arraySha256,
      resourceArraySha256: firstResource.arraySha256,
      startup: statistics(startup), toolsList: statistics(tools), resourcesList: statistics(resources),
      rounds: launches.map(launch => ({ round: launch.round, launch: launch.launch, startupMs: launch.startupMs, toolsListMedianMs: statistics(launch.samples.filter(sample => sample.kind === 'tools' && !sample.warmup).map(sample => sample.elapsedMs)).medianMs, resourcesListMedianMs: statistics(launch.samples.filter(sample => sample.kind === 'resources' && !sample.warmup).map(sample => sample.elapsedMs)).medianMs })),
    };
  }
  for (const profile of PROFILES) {
    const current = profiles[profile];
    current.narrowMinusAll = {
      toolDefinitionUtf8Bytes: current.toolDefinitionUtf8Bytes - profiles.all.toolDefinitionUtf8Bytes,
      startupRoundPaired: statistics(current.rounds.map((round, index) => round.startupMs - profiles.all.rounds[index].startupMs)),
      toolsListRoundMedianPaired: statistics(current.rounds.map((round, index) => round.toolsListMedianMs - profiles.all.rounds[index].toolsListMedianMs)),
      resourcesListRoundMedianPaired: statistics(current.rounds.map((round, index) => round.resourcesListMedianMs - profiles.all.rounds[index].resourcesListMedianMs)),
    };
  }
  return {
    binding: PROFILE, attempt: raw.attempt, analyzedAt: new Date().toISOString(), profiles,
    actualOrder: raw.launches.map(({ round, position, launch, profile }) => ({ round, position, launch, profile })),
    observationCounts: { freshProcesses: 30, warmups: 60, measuredToolsLists: 150, measuredResourcesLists: 150, totalListCalls: 360 },
    timerResolution: raw.timerResolution,
    uncertainties: ['Only five fresh-process samples and 25 warm-list samples per profile.', 'Operating-system and file caches were not reset.', 'Background activity and thermal state are uncontrolled within one local machine.', 'Warm elapsed time includes SDK serialization, transport, server work, and full response parsing.', 'Round pairing reduces order bias; it does not isolate a causal effect.', 'No confidence interval, population inference, percentile tail, or latency target is authorized.'],
    exclusions: [], modelVisibleTokens: { state: 'unavailable', reason: 'No authorized host diagnostic with known model, tokenizer, loading mode, and observation boundary is available in this local SDK packet.', excludedClaim: 'No model-visible token savings or model inference latency claim.' },
    supportedLimit: 'One local development build, Node 24.19.0, darwin arm64, the recorded machine, read-only fixture, SDK, and stdio workload. Definition bytes are a context proxy.',
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [input, output] = process.argv.slice(2);
  assert.ok(input && output, 'Usage: node perf-003-analysis.mjs <raw.json> <new-analysis.json>');
  immutableJson(output, analyze(readJson(input)));
}
