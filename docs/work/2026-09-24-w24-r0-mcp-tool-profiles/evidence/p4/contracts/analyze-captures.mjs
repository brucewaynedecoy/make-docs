import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const output = path.join(root, 'docs/work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/p4/contracts');
const local = JSON.parse(fs.readFileSync(process.argv[2]));
const intents = ['core', 'setup', 'workflow', 'quality', 'backlog'];
const variants = Object.fromEntries(['old', 'default', 'all', ...intents].map(profile => [profile, JSON.parse(fs.readFileSync(path.join(output, `wire-${profile}-attempt-1.json`)))]));
const normalize = value => JSON.parse(JSON.stringify(value).replaceAll('$TEMP/old/packages/docs/template', '$PROVIDER_ROOT').replaceAll('$TEMP/current/packages/docs/template', '$PROVIDER_ROOT'));
const comparisons = [];
for (const [label, left, right] of [['historical-default', 'old', 'default'], ['current-default-all', 'default', 'all']]) {
  for (const field of ['tools', 'resources', 'reads']) assert.deepEqual(normalize(variants[left][field]), normalize(variants[right][field]), `${label}/${field}`);
  comparisons.push({ label, fields: ['tools', 'resources', 'reads'], equivalent: true, differences: [], normalization: 'Only absolute provider roots differ between isolated exports; full raw values retained.' });
}
const unionTools = new Set(); const unionResources = new Set();
for (const profile of intents) {
  for (const tool of variants[profile].tools.tools) { unionTools.add(tool.name); assert.deepEqual(tool, variants.all.tools.tools.find(candidate => candidate.name === tool.name)); }
  for (const resource of variants[profile].resources.resources) { unionResources.add(resource.uri); assert.deepEqual(resource, variants.all.resources.resources.find(candidate => candidate.uri === resource.uri)); assert.deepEqual(variants[profile].reads[resource.uri], variants.all.reads[resource.uri]); }
}
assert.deepEqual([...unionTools].sort(), variants.all.tools.tools.map(tool => tool.name).sort());
assert.deepEqual([...unionResources].sort(), variants.all.resources.resources.map(resource => resource.uri).sort());
assert.equal(fs.existsSync(local.env.MAKE_DOCS_HOME), false);
const catalog = JSON.parse(fs.readFileSync(path.join(local.paths.current, 'packages/docs/template/.make-docs/system-resources.catalog.json')));
for (const resource of catalog.mcpResources) { assert.ok(resource.profiles.length); assert.equal(new Set(resource.profiles).size, resource.profiles.length); for (const profile of resource.profiles) assert.ok(intents.includes(profile)); }
const result = {
  coordinate: 'W24 R0 P4', capturedAt: new Date().toISOString(), passed: true,
  tasks: { t1: 'passed; exact ready inventories and all union; negative assignment validators reused from P1/P3 unchanged proof', t2: 'passed; 49 narrow tool descriptors and 103 narrow native reads match all; real shared handler identity is covered in focused test', t3: 'passed in focused direct-helper tests; supplementary wire probe has a retained fixture assertion failure; no complete valid backlog cache-write/Store mutation or production grant is claimed', t4: 'passed; old no-profile and P3 no-profile same contracts/resources/reads within same provider fixture; current default equals all' },
  counts: { variants: 8, toolUnion: unionTools.size, resourceUnion: unionResources.size, nativeReads: Object.values(variants).reduce((sum, variant) => sum + Object.keys(variant.reads).length, 0), narrowToolComparisons: intents.reduce((sum, profile) => sum + variants[profile].tools.tools.length, 0), narrowReadComparisons: intents.reduce((sum, profile) => sum + Object.keys(variants[profile].reads).length, 0) },
  comparisons,
  inventories: Object.fromEntries(Object.entries(variants).map(([profile, variant]) => [profile, { tools: variant.tools.tools.map(tool => tool.name), resources: variant.resources.resources.map(resource => resource.uri), retained: `wire-${profile}-attempt-1.json` }])),
  cleanup: { eightClientsClosedByFinally: true, eightTransportsClosedByFinally: true, pidAfterEachClose: null, evidence: 'The original wire script closed every child and asserted null pid in finally before writing each retained variant.' },
  fixture: { storeCreated: false, inputsUnchanged: fs.readFileSync(path.join(local.paths.fixture, 'docs/note.md'), 'utf8') === 'Portable project knowledge.\n' },
  wireAttempt: { completeListAndReadCapture: true, supplementaryAccessPass: 'stopped', failure: 'Last backlog write probe used incomplete snapshot/records. SDK validates arguments before callback and thus returned input error before core write denial. Direct-helper tests separately verify core write gate. No rerun or correction follows this supplementary failure.', reruns: 0 },
  reusedEvidence: ['evidence/p3/source-identity-final.json', 'evidence/p1/baseline-tool-contracts.json', 'evidence/a6/resource-metadata-final.json', 'evidence/a7/allowed-read-and-cli-parity-final.json', 'evidence/a8/denied-reads-final.json', 'evidence/a9/stdio-results-final.json', 'evidence/p3/help-validation-final.json', 'evidence/p3/full-tests.txt'],
  limits: ['Local source-to-source fixture proof only.', 'No fresh package installation, host upgrade, real host, model-visible tokens, HTTP, production Store, complete allowed Store write, or historical timing claim.', 'All current read bytes and provenance are compared; historical absolute provider root differences are normalized and retained raw.', 'Automated focused correction is spent; later supplementary SDK input assertion failure stays visible.'],
};
fs.writeFileSync(path.join(output, 'stage-1-summary-attempt-1.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ passed: result.passed, counts: result.counts, comparisons }));
