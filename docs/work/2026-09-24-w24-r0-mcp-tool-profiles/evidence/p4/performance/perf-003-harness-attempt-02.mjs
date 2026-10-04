import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import childProcess from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { PROFILE, PROFILES, LIMITS, sha256, stableSerialize, immutableJson, readJson, walkManifest, profileDigest, plannedOrder, statistics, installSpawnBoundary, validateList } from './perf-003-common.mjs';
import { analyze } from './perf-003-analysis.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const productCommit = 'cced2bcbb71a4380e1dfbc10b7e2ef549dc271a2';
const planPath = 'docs/plans/2026-09-24-w24-r0-mcp-tool-profiles/04-compatibility-and-validation.md';
const priorPath = 'docs/work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/p3/source-identity-final.json';
const lockDigest = '562a373c459023633d04e4fec62bf5b3c4d6e9a4e3e4d55aba6fe5130fdff784';

function selfCheck() {
  assert.equal(stableSerialize({ z: 1, a: [{ b: 2, a: 1 }, 3] }), '{"a":[{"a":1,"b":2},3],"z":1}');
  assert.notEqual(stableSerialize([1, 2]), stableSerialize([2, 1]));
  assert.deepEqual(statistics([8, 1, 3, 2, 100]), { count: 5, medianMs: 3, minimumMs: 1, maximumMs: 100, rawMs: [8, 1, 3, 2, 100] });
  assert.equal(statistics([2, 4]).medianMs, 3);
  let clock = 0;
  const observed = [];
  const fakeChild = { pid: 42 };
  const fakeProcess = { spawn(command) { assert.equal(command, 'node'); assert.equal(clock, 1); clock = 2; return fakeChild; } };
  const original = fakeProcess.spawn;
  const restore = installSpawnBoundary(fakeProcess, command => command === 'node', () => ++clock, event => observed.push(event));
  assert.equal(fakeProcess.spawn('node'), fakeChild);
  assert.equal(observed[0].started, 1);
  assert.equal(observed[0].child, fakeChild);
  restore();
  assert.equal(fakeProcess.spawn, original);
  const order = plannedOrder();
  assert.equal(order.length, 30);
  for (let round = 0; round < 5; round++) assert.deepEqual(order.filter(item => item.round === round).map(item => item.profile), [...PROFILES.slice(round), ...PROFILES.slice(0, round)]);
  assert.throws(() => validateList({ tools: [] }, 'tools', 'all', { tools: [] }));
  const raw = { binding: PROFILE, attempt: 0, timerResolution: {}, launches: order.map(item => ({ ...item, valid: true, startupMs: 100 + item.round + PROFILES.indexOf(item.profile), cleanup: { childExited: true }, samples: Array.from({ length: 6 }, (_, pair) => ['tools', 'resources'].map(kind => ({ kind, warmup: pair === 0, elapsedMs: pair + item.round + PROFILES.indexOf(item.profile), uniqueCount: kind === 'tools' ? 43 : 62, utf8Bytes: 123, arraySha256: kind }))).flat() })) };
  const report = analyze(raw);
  assert.equal(report.profiles.all.startup.medianMs, 102);
  assert.deepEqual(report.profiles.core.narrowMinusAll.startupRoundPaired.rawMs, [1, 1, 1, 1, 1]);
  assert.deepEqual(report.profiles.backlog.narrowMinusAll.toolsListRoundMedianPaired.rawMs, [5, 5, 5, 5, 5]);
  assert.equal(report.observationCounts.totalListCalls, 360);
  return { passed: true, checks: ['Stable sorted object keys and preserved array order.', 'Odd/even median, raw values, minimum, maximum, and retained slow sample.', 'Clock read directly before child spawn and original spawn restored.', 'Five exact rotating rounds and 30 planned launches.', 'Wrong list count rejected.', 'Synthetic round-paired startup and round-median warm differences.', 'Synthetic analysis has 360 total list calls.'], serverLaunches: 0, listCalls: 0, note: 'Pure script checks have no performance observation or product outcome.' };
}

function resolvePackage(require, name, entry) {
  const resolved = require.resolve(entry);
  let current = path.dirname(resolved);
  while (current !== path.dirname(current)) {
    const file = path.join(current, 'package.json');
    if (fs.existsSync(file) && readJson(file).name === name) return { name, version: readJson(file).version, manifestSha256: sha256(fs.readFileSync(file)), manifest: file, entrySha256: sha256(fs.readFileSync(resolved)) };
    current = path.dirname(current);
  }
  throw new Error(`Cannot resolve ${name} identity`);
}

function checkPriorIdentity(root, runtimeRoot) {
  const prior = readJson(path.join(root, priorPath));
  for (const [file, expected] of Object.entries(prior.source)) assert.equal(sha256(fs.readFileSync(path.join(root, file))), expected, `P3 source mismatch ${file}`);
  for (const [file, expected] of Object.entries(prior.build)) assert.equal(sha256(fs.readFileSync(path.join(runtimeRoot, file))), expected, `P3 build mismatch ${file}`);
  assert.equal(sha256(fs.readFileSync(path.join(root, 'package-lock.json'))), lockDigest, 'Lockfile mismatch');
  const source = {};
  for (const relative of ['packages/cli/src', 'packages/docs/template']) source[relative] = walkManifest(path.join(root, relative));
  const configurationFiles = Object.fromEntries(['package.json', 'package-lock.json', 'packages/cli/package.json', 'packages/docs/package.json', 'packages/cli/tsconfig.json', 'packages/cli/tsup.config.ts'].filter(file => fs.existsSync(path.join(root, file))).map(file => [file, sha256(fs.readFileSync(path.join(root, file)))]));
  return { productCommit, priorManifestSha256: sha256(fs.readFileSync(path.join(root, priorPath))), priorSource: prior.source, priorBuild: prior.build, fullSource: source, fullBuild: walkManifest(path.join(runtimeRoot, 'packages/cli/dist')), rootLockSha256: lockDigest, configurationFiles, runtimePackageSha256: sha256(fs.readFileSync(path.join(runtimeRoot, 'packages/cli/package.json'))) };
}

function environmentRecord() {
  const power = childProcess.execFileSync('pmset', ['-g'], { encoding: 'utf8' });
  const ps = childProcess.execFileSync('ps', ['-axo', 'pid=,pcpu=,comm='], { encoding: 'utf8' });
  const processes = ps.trim().split('\n').map(line => /^\s*(\d+)\s+(\S+)\s+(.*)$/.exec(line)).filter(Boolean).map(([, pid, cpu, command]) => ({ pid: Number(pid), cpuPercent: Number(cpu), executable: path.basename(command) }));
  const counts = {};
  for (const process of processes) counts[process.executable] = (counts[process.executable] || 0) + 1;
  return { capturedAt: new Date().toISOString(), node: process.version, nodeExecutableSha256: sha256(fs.readFileSync(process.execPath)), platform: process.platform, architecture: process.arch, osRelease: os.release(), cpuModel: os.cpus()[0]?.model, logicalCpus: os.cpus().length, memoryBytes: os.totalmem(), lowPowerMode: Number(/lowpowermode\s+(\d+)/.exec(power)?.[1]), loadAverage: os.loadavg(), freeMemoryBytes: os.freemem(), processSummary: { totalProcesses: processes.length, executableCounts: counts, processesAtOrAboveOnePercentCpu: processes.filter(process => process.cpuPercent >= 1) }, backgroundLoadLimit: 'Other local applications remain active. No parallel phase test, build, or heavy validator is allowed during measured launches.' };
}

function timerResolution() {
  let last = performance.now();
  const positive = [];
  for (let index = 0; index < 10000; index++) { const now = performance.now(); if (now > last) positive.push(now - last); last = now; }
  return { timer: 'Node performance.now monotonic milliseconds', observations: 10000, observedMinimumPositiveIncrementMs: Math.min(...positive), observedMaximumPositiveIncrementMs: Math.max(...positive), note: 'Observed timer increments are an instrument check, not a product latency or guaranteed timer accuracy.' };
}

async function run(config) {
  const root = config.root;
  const runtimeRoot = config.runtimeRoot;
  const output = here;
  const attempt = 2;
  const save = (name, value) => immutableJson(path.join(output, `attempt-02-${name}.json`), value);
  assert.ok(config.stage1Passed === true && config.heavyChecksStopped === true, 'Stage 1 and quiet execution gate required');
  const require = createRequire(path.join(root, 'packages/cli/package.json'));
  const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
  assert.ok(config.originalActivatedAt, 'Correction must retain the original budget activation');
  const activatedAt = config.originalActivatedAt;
  const correctionStartedAt = new Date().toISOString();
  const alreadyElapsedMs = Date.now() - Date.parse(activatedAt);
  const activatedClock = performance.now() - alreadyElapsedMs;
  const localTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'make-docs-w24-p4-perf-003-'));
  const fixture = path.join(localTemp, 'fixture');
  const fixtureHome = path.join(localTemp, 'home');
  const fixtureTemp = path.join(localTemp, 'tmp');
  const replacements = [[fixture, '<fixture>'], [fixtureHome, '<fixture-home>'], [fixtureTemp, '<fixture-temp>'], [localTemp, '<performance-temp>'], [runtimeRoot, '<p3-runtime>'], [config.fixtureSource, '<stage1-fixture>'], [config.contractsTemp, '<stage1-temp>'], [root, '<repo>'], [os.homedir(), '<user-home>'], [os.tmpdir(), '<system-temp>']].filter(([local]) => local).sort((a, b) => b[0].length - a[0].length);
  const sanitize = value => typeof value === 'string' ? replacements.reduce((text, [local, alias]) => text.replaceAll(local, alias), value) : Array.isArray(value) ? value.map(sanitize) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, field]) => [key, sanitize(field)])) : value;
  const safeSave = (name, value) => save(name, sanitize(value));
  const spend = { passes: 0, corrections: 1, reviews: 0, launches: 0, listCalls: 0, externalSpend: 0, paidModelRequests: 0 };
  const raw = { binding: PROFILE, attempt, activatedAt, launches: [], errors: [], exclusions: [], actualOrder: [] };
  let before;
  let activeChild;
  let activeBoundary;
  let restoreSpawn = () => {};
  let failure;
  try {
    fs.cpSync(config.fixtureSource, fixture, { recursive: true, dereference: true, errorOnExist: true });
    fs.mkdirSync(fixtureHome);
    fs.mkdirSync(fixtureTemp);
    const makeReadOnly = directory => { for (const entry of fs.readdirSync(directory, { withFileTypes: true })) { const file = path.join(directory, entry.name); if (entry.isDirectory()) makeReadOnly(file); else fs.chmodSync(file, 0o444); } fs.chmodSync(directory, 0o555); };
    makeReadOnly(fixture);
    const profile = profileDigest(fs.readFileSync(path.join(root, planPath), 'utf8'));
    assert.equal(profile.digest, PROFILE.digest);
    before = checkPriorIdentity(root, runtimeRoot);
    const fixtureBefore = walkManifest(fixture);
    const dependencyRoot = path.join(root, 'node_modules');
    const dependencyBefore = walkManifest(dependencyRoot);
    const tree = childProcess.spawnSync('npm', ['ls', '--all', '--json', '--offline'], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    assert.equal(tree.status, 0, `Dependency identity failed: ${tree.stderr}`);
    const dependencyTree = JSON.parse(tree.stdout);
    safeSave('dependencies', { dependencyTree, stderr: tree.stderr, files: dependencyBefore, sdk: resolvePackage(require, '@modelcontextprotocol/sdk', '@modelcontextprotocol/sdk/client/index.js'), zod: resolvePackage(require, 'zod', 'zod'), package: readJson(path.join(runtimeRoot, 'packages/cli/package.json')) });
    const environment = environmentRecord();
    assert.equal(environment.node, 'v24.19.0');
    assert.equal(environment.platform, 'darwin');
    assert.equal(environment.architecture, 'arm64');
    assert.equal(environment.osRelease, '27.0.0');
    assert.equal(environment.cpuModel, 'Apple M4');
    assert.equal(environment.memoryBytes, 25769803776);
    const expected = readJson(config.expectedListsPath);
    const instrument = Object.fromEntries(['perf-003-common.mjs', 'perf-003-harness-attempt-02.mjs', 'perf-003-analysis.mjs'].map(file => [file, sha256(fs.readFileSync(path.join(here, file)))]));
    const env = { HOME: fixtureHome, LOGNAME: 'fixture', USER: 'fixture', PATH: '/usr/bin:/bin', SHELL: '/bin/zsh', TERM: 'dumb', TMPDIR: fixtureTemp, MAKE_DOCS_HOME: path.join(fixtureHome, 'unconfigured-store'), MAKE_DOCS_CALLER_IDENTITY: '' };
    const stage1Assets = Object.fromEntries(config.stage1EvidencePaths.map(file => [path.relative(root, file), sha256(fs.readFileSync(file))]));
    raw.timerResolution = timerResolution();
    const seam = selfCheck();
    assert.ok(seam.passed);
    const expectedFingerprint = sha256(stableSerialize(expected));
    before.fixture = fixtureBefore;
    before.fixtureProviderResources = walkManifest(path.join(runtimeRoot, 'packages/docs/template'));
    before.runtimeSource = { sourceRoot: root, source: before.fullSource['packages/cli/src'], isolatedBuildCopyHasSource: false, equivalence: 'The isolated runtime is a build/provider/dependency copy. Its 20 built JavaScript hashes exactly match the retained P3 build. The P3 source authority is verified in the active checkout, not at a nonexistent src path in the build copy.' };
    before.dependencies = dependencyBefore;
    before.runtimeDependencies = walkManifest(path.join(runtimeRoot, 'node_modules'));
    before.instrument = instrument;
    before.environment = environment;
    before.configuration = { nodeExecutable: process.execPath, entryPoint: path.join(runtimeRoot, 'packages/cli/dist/index.js'), args: ['mcp', '--profile', '<profile>'], cwd: fixture, resourceOrigin: 'same isolated P3 development-provider system catalog and bytes, plus the copied read-only project fixture, for every variant', env, accessSettings: 'No allowWrite; lists only. No Store, network, inference, or account operation.' };
    const fingerprint = sha256(stableSerialize(sanitize(before)));
    safeSave('manifest', { binding: PROFILE, attempt, activatedAt, correctionStartedAt, correction: { affectedCheck: 'Fingerprint source-root qualification before timing.', priorAttempt: 'attempt-01-problem.json', priorLaunches: 0, priorListCalls: 0, reason: 'An isolated build copy has no src directory. Bind source to the verified active P3 checkout and build/provider/dependencies to the isolated clone.', methodUnchanged: true }, authorization: 'User: Thank you! Please go ahead and implement P4. Scope W24 R0 P4 t5-t6; canonical PERF-003 v1. Root accepts one allowed fingerprint correction without budget extension.', correctnessGate: { stage1Passed: true, stage1EvidenceSha256: stage1Assets, heavyChecksStopped: true, coordinatorConfirmation: config.coordinatorConfirmation }, profileSection: profile, fingerprint, before, expectedListFingerprint: expectedFingerprint, expectedListsPath: config.expectedListsPath, plannedOrder: plannedOrder(), seam: { ...seam, reusedSdkCorrectness: stage1Assets, claims: 'Stage 1 standard SDK list equality and child cleanup; pure instrument/serializer/analysis checks. No discarded fresh-process warmup.' }, timerResolution: raw.timerResolution, measurement: { startup: 'Actual child_process.spawn call through standard StdioClientTransport to client.connect completion after initialize and ready notification.', warm: 'Immediately before each list request to full parsed response; validation, stable serialization, and writes occur after elapsed capture.', warmups: 'One tools list followed by one resources list, both unmeasured.', repetitions: 'Five rounds; rotating six-profile order; five tools/resource pairs per process.', callsOverlap: false }, comparability: { state: 'comparable', reason: 'Same verified P3 code/build, dependency tree, copied fixture, access settings, environment, SDK, timer, serializer, analysis, and machine. Only explicit profile changes. OS/file caches and background machine activity remain uncontrolled.' }, budget: { event: PROFILE.budget, limits: LIMITS, consumed: { ...spend, elapsedMs: performance.now() - activatedClock }, active: true }, limits: ['Local stdio development build only.', 'No installed-host, HTTP, app, token, inference, package installation, or wider platform claim.'] });
    const checkBudget = () => { assert.ok(performance.now() - activatedClock < LIMITS.elapsedMs, '90-minute budget exhausted'); assert.ok(spend.launches <= LIMITS.launches && spend.listCalls <= LIMITS.listCalls, 'Compute budget exceeded'); };
    restoreSpawn = installSpawnBoundary(childProcess, (command, args) => activeBoundary && command === process.execPath && args?.includes('mcp'), () => performance.now(), ({ started, child }) => { assert.equal(activeChild, undefined, 'Overlapping server spawn'); spend.launches++; activeChild = child; activeBoundary.started = started; activeBoundary.child = child; });
    spend.passes = 1;
    for (const item of plannedOrder()) {
      checkBudget();
      const launch = { ...item, samples: [], valid: false, startedAt: new Date().toISOString() };
      raw.actualOrder.push(item);
      const transport = new StdioClientTransport({ command: process.execPath, args: [path.join(runtimeRoot, 'packages/cli/dist/index.js'), 'mcp', '--profile', item.profile], cwd: fixture, env, stderr: 'pipe' });
      const client = new Client({ name: 'make-docs-w24-r0-p4-perf-003', version: '1.0.0' });
      let stderr = '';
      transport.stderr?.on('data', chunk => { stderr += chunk.toString(); });
      activeBoundary = {};
      const bounded = async (promise, timeoutMs, label) => { let timeout; try { return await Promise.race([promise, new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs} ms`)), timeoutMs); })]); } finally { clearTimeout(timeout); } };
      try {
        await bounded(client.connect(transport, { timeout: 30000 }), 30000, 'startup');
        const readyAt = performance.now();
        assert.ok(Number.isFinite(activeBoundary.started), 'Real spawn boundary was not observed');
        launch.startupMs = readyAt - activeBoundary.started;
        launch.pid = activeChild.pid;
        for (let pair = 0; pair < 6; pair++) {
          for (const kind of ['tools', 'resources']) {
            checkBudget();
            spend.listCalls++;
            const started = performance.now();
            const response = await bounded(kind === 'tools' ? client.listTools(undefined, { timeout: 10000 }) : client.listResources(undefined, { timeout: 10000 }), 10000, `${kind}/list`);
            const elapsedMs = performance.now() - started;
            const summary = validateList(response, kind, item.profile, expected[item.profile][kind]);
            const sample = { kind, pair, warmup: pair === 0, elapsedMs: pair === 0 ? null : elapsedMs, ...summary, rawFile: `attempt-02-list-${String(item.launch).padStart(2, '0')}-${pair}-${kind}.json` };
            immutableJson(path.join(output, sample.rawFile), { binding: PROFILE, attempt, ...item, ...sample, response });
            launch.samples.push(sample);
          }
        }
        launch.valid = true;
      } catch (error) {
        launch.error = { message: error.message, stack: sanitize(error.stack) };
        raw.errors.push({ ...item, ...launch.error });
        raw.exclusions.push({ ...item, reason: 'Failed protocol, list correctness, or instrument/fingerprint check. Valid slow samples are never excluded.' });
        throw error;
      } finally {
        const child = activeChild;
        await client.close();
        await transport.close();
        if (child?.exitCode === null && child?.signalCode === null) {
          await new Promise(resolve => { let timer; const finish = () => { clearTimeout(timer); resolve(); }; child.once('close', finish); timer = setTimeout(() => { child.kill('SIGKILL'); setTimeout(finish, 500); }, 500); });
        }
        const childExited = !child || child.exitCode !== null || child.signalCode !== null;
        launch.cleanup = { childExited, exitCode: child?.exitCode, signal: child?.signalCode, transportPidAfterClose: transport.pid, stderr };
        assert.ok(childExited && transport.pid === null, 'Server process cleanup failed');
        activeChild = undefined;
        activeBoundary = undefined;
        raw.launches.push(launch);
        safeSave(`launch-${String(item.launch).padStart(2, '0')}`, launch);
      }
      process.stdout.write(`${item.launch}/30 ${item.profile} round ${item.round + 1}\n`);
    }
    restoreSpawn();
    raw.endedAt = new Date().toISOString();
    safeSave('raw', raw);
    const after = checkPriorIdentity(root, runtimeRoot);
    after.fixture = walkManifest(fixture);
    after.fixtureProviderResources = walkManifest(path.join(runtimeRoot, 'packages/docs/template'));
    after.runtimeSource = { ...before.runtimeSource, source: after.fullSource['packages/cli/src'] };
    after.dependencies = walkManifest(dependencyRoot);
    after.runtimeDependencies = walkManifest(path.join(runtimeRoot, 'node_modules'));
    after.instrument = Object.fromEntries(Object.keys(instrument).map(file => [file, sha256(fs.readFileSync(path.join(here, file)))]));
    after.environment = environmentRecord();
    assert.equal(profileDigest(fs.readFileSync(path.join(root, planPath), 'utf8')).digest, PROFILE.digest);
    for (const field of ['priorSource', 'priorBuild', 'fullSource', 'fullBuild', 'rootLockSha256', 'configurationFiles', 'runtimePackageSha256', 'fixture', 'fixtureProviderResources', 'runtimeSource', 'dependencies', 'runtimeDependencies', 'instrument']) assert.deepEqual(after[field], before[field], `Post-run ${field} fingerprint mismatch`);
    for (const field of ['node', 'nodeExecutableSha256', 'platform', 'architecture', 'osRelease', 'cpuModel', 'logicalCpus', 'memoryBytes', 'lowPowerMode']) assert.deepEqual(after.environment[field], before.environment[field], `Post-run environment ${field} mismatch`);
    safeSave('fingerprint-after', { binding: PROFILE, fingerprint, sourceBuildFixtureDependencyInstrumentUnchanged: true, qualifiedEnvironmentUnchanged: true, after });
    const analysis = analyze(raw);
    safeSave('analysis', analysis);
    spend.reviews = 1;
    checkBudget();
    const elapsedMs = performance.now() - activatedClock;
    const ledger = { binding: PROFILE, budgetEvent: PROFILE.budget, authorizingScope: 'User-authorized W24 R0 P4 implementation', activatedAt, limits: LIMITS, consumed: { ...spend, elapsedMs }, remaining: { passes: LIMITS.passes - spend.passes, corrections: LIMITS.corrections - spend.corrections, reviews: LIMITS.reviews - spend.reviews, elapsedMs: LIMITS.elapsedMs - elapsedMs, launches: LIMITS.launches - spend.launches, listCalls: LIMITS.listCalls - spend.listCalls, externalSpend: 0, paidModelRequests: 0 }, attempts: [{ attempt: 1, scope: 'Activation/fingerprint setup', affectedChecks: ['runtime source-root qualification'], launches: 0, listCalls: 0, outcome: 'blocked', evidence: 'attempt-01-problem.json' }, { attempt, scope: 'One complete same-build six-profile characterization pass after source-root correction', affectedChecks: ['source-root fingerprint', 'tool-definition size', 'fresh-process startup', 'warm tools list', 'warm resources list'], correction: true }], unchangedEvidenceReused: [priorPath, ...Object.keys(stage1Assets)], stopReason: 'Exact declared sample count complete. No unchanged rerun or value-driven extra sample.', escalation: 'None.', activeCorrectionAuthorization: 'The sole correction is spent. No extension or additional rerun.' };
    safeSave('ledger', ledger);
    safeSave('result', { binding: PROFILE, id: 'W24-R0-P4-PERF-003-RESULT-2', attempt, outcome: 'pass', severity: 'minor', reproducibility: 'reproduced', reviewer: '/root/p4_performance', reviewerDisposition: 'Packet binding, exact inventories, sample order, full count, unchanged fingerprint, analysis, budget, raw retention, and child cleanup pass. This is a characterization pass; no latency/token target exists.', fingerprint, raw: 'attempt-02-raw.json', analysis: 'attempt-02-analysis.json', manifest: 'attempt-02-manifest.json', ledger: 'attempt-02-ledger.json', constraints: { correctnessStage1: true, everyListValidated: true, sourceBuildFixtureDependenciesInstrumentUnchanged: true, allChildrenExited: true, callsSequential: true, noParallelPhaseTestsOrBuilds: config.heavyChecksStopped, noStoreNetworkInferenceUserData: true, validSlowSamplesRetained: true, rawEvidenceImmutable: true }, findings: [{ id: 'W24-R0-P4-PERF-003-F1', severity: 'minor', reproducibility: 'not-attempted', observed: 'Initial activation expected source files inside a build/provider-only clone.', expected: 'Bind actual code and runtime roots before timing.', targetClass: 'characterization-baseline', sourceRequirement: 'PERF-003 Evidence Fingerprint and Non-Sacrificable Constraints', owner: '/root/p4_performance', disposition: 'Corrected in attempt2 before the first measured spawn. No samples lost/replaced.', evidence: ['attempt-01-problem.json', 'perf-003-harness.mjs', 'attempt-02-manifest.json'], remediation: 'Bind source to verified active P3 source and build/provider/dependencies to the isolated clone.', laterResult: 'attempt-02-result.json', expiry: 'W24 R0 P4 closeout; retain as history.' }], waivers: [], unavailableEvidence: analysis.modelVisibleTokens, supportedLimit: analysis.supportedLimit, expiry: { boundary: 'W24 R0 P4 closeout; then historical baseline only.', materialTriggers: ['profile meaning', 'runtime/source/build', 'dependencies', 'fixture/configuration', 'machine/OS/power mode', 'host/model/loading boundary', 'instrument', 'analysis'], nextReview: 'A current decision needs changed or expired evidence.', requalificationAuthority: 'Separate owner or later phase authority and a new finite budget.', laterResult: null }, uncertainty: analysis.uncertainties, exclusions: raw.exclusions });
    process.stdout.write(`${JSON.stringify({ outcome: 'pass', launches: spend.launches, listCalls: spend.listCalls, elapsedMs })}\n`);
  } catch (error) {
    failure = error;
    restoreSpawn();
    if (activeChild?.exitCode === null) activeChild.kill('SIGKILL');
    raw.endedAt = new Date().toISOString();
    const elapsedMs = performance.now() - activatedClock;
    const problem = { binding: PROFILE, attempt, outcome: /mismatch|Stage 1|Dependency|budget|absent/i.test(error.message) ? 'blocked' : 'revise', error: { message: error.message, stack: sanitize(error.stack) }, consumed: { ...spend, elapsedMs }, remainingScope: plannedOrder().slice(raw.launches.length), raw, actualFingerprint: before, stopReason: 'Required prerequisite or method check failed. No favorable replacement data, no automatic rerun, and no budget extension.' };
    safeSave('problem', problem);
    process.stderr.write(`${error.stack}\n`);
  } finally {
    restoreSpawn();
    // Retain immutable inputs for review. No background process is retained.
    safeSave('cleanup', { binding: PROFILE, attempt, capturedAt: new Date().toISOString(), allServerProcessesExited: !activeChild || activeChild.exitCode !== null || activeChild.signalCode !== null, fixtureRetainedReadOnly: true, temporaryRuntimeState: localTemp, reason: 'Read-only fixture and isolated empty home retained for evidence review; no server/listener remains.', failure: failure?.message ?? null });
  }
  if (failure) process.exitCode = 1;
}

if (process.argv[2] === '--self-check') {
  const result = selfCheck();
  if (process.argv[3]) immutableJson(process.argv[3], result);
  process.stdout.write(`${JSON.stringify(result)}\n`);
} else {
  assert.ok(process.argv[2], 'Usage: node perf-003-harness.mjs <run-config.json>');
  await run(readJson(process.argv[2]));
}
