import { lstatSync, readFileSync, readdirSync, readlinkSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { isDeepStrictEqual } from "node:util";
import { parse, stringify } from "yaml";
import { loadMakeDocsConfigOrThrow } from "./config";
import { planSkillsOnlyInstall } from "./install";
import { createManifest, loadManifest, mintProjectId } from "./manifest";
import { getDesiredSkillAssets } from "./skill-catalog";
import type { EffectiveSkillRegistry } from "./skill-registry";
import { assertEmbeddedSkillPackageDigest, getEmbeddedSkillPackageDigest } from "./skill-resolver";
import {
  canonicalInstallationPath,
  prepareDetachedInstallationOperation,
  readInstallationPathClaims,
  recoverInstallationOperation,
  registerDetachedInstallationOperation,
  type DetachedInstallationPlan,
  type InstallationFileState,
} from "./store/installation-state";
import type { InstallManifest, InstallSelections, ManifestFileEntry, ResolvedFileAsset, ResolvedSkillExposureAsset } from "./types";
import { hashText, readPackageMeta, relativePathToTarget } from "./utils";

const OPERATION = "setup.skills.adopt";
type State = InstallationFileState;
type Snapshot = Record<string, State>;
type Change = DetachedInstallationPlan["changes"][number];
type Claim = ReturnType<typeof readInstallationPathClaims>[number];

export interface SkillAdoptionReview {
  schemaVersion: 1;
  targetRoot: string;
  digest: string;
  packageDigest: string;
  package: { name: string; version: string };
  selections: InstallSelections;
  adoptExisting: string[];
  roots: string[];
  cleanupPaths: string[];
  bootstrapPaths: string[];
  before: Snapshot;
  after: Snapshot;
  alternatives: Record<string, Snapshot>;
  intermediateStates: Record<string, State[]>;
  backups: Array<{ source: string; destination: string; digest: string }>;
  claims: Claim[];
  beforeLedger: InstallManifest | null;
  blockers: string[];
  ownershipChanges: Array<{ path: string; effect: "register" | "update" | "retain" | "remove"; before: ManifestFileEntry | null; after: ManifestFileEntry | null }>;
  plan: DetachedInstallationPlan;
}

const missing = (): State => ({ kind: "missing" });
const normalized = (p: string) => p.split(path.sep).join("/");
const under = (p: string, root: string) => p === root || p.startsWith(root + "/");
const depth = (p: string) => p.split("/").length;
function canonical(value: unknown): string {
  const sort = (v: any): any => Array.isArray(v) ? v.map(sort) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v;
  return JSON.stringify(sort(value));
}
function plain(state: State) { const { contentBase64, payload, ...identity } = state; return identity; }
function same(a: State, b: State) { return canonical(plain(a)) === canonical(plain(b)); }
function file(content: string | Buffer, mode = 0o644): State {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return { kind: "file", digest: hashText(bytes), contentBase64: bytes.toString("base64"), mode };
}
function inspect(root: string, p: string): State {
  const absolute = relativePathToTarget(root, p);
  const st = lstatSync(absolute, { throwIfNoEntry: false });
  if (!st) return missing();
  if (st.isSymbolicLink()) return { kind: "symlink", target: readlinkSync(absolute) };
  if (st.isDirectory()) return { kind: "directory", mode: st.mode & 0o777 };
  if (st.isFile()) return file(readFileSync(absolute), st.mode & 0o777);
  throw new Error(`Unsupported Skill path: ${p}. Preserve it and resolve its type before adoption.`);
}
function snapshot(root: string, roots: string[], exact: string[]): Snapshot {
  const result: Snapshot = {};
  const visit = (p: string) => {
    if (result[p]) return;
    const state = inspect(root, p);
    result[p] = state;
    if (state.kind === "directory") for (const name of readdirSync(relativePathToTarget(root, p)).sort()) visit(p + "/" + name);
  };
  for (const p of roots) visit(p);
  for (const p of exact) if (!result[p]) result[p] = inspect(root, p);
  return result;
}
function checkParents(root: string, roots: string[]): string[] {
  const issues: string[] = [];
  for (const p of roots) {
    let parent = path.dirname(relativePathToTarget(root, p));
    while (parent !== path.dirname(parent)) {
      const st = lstatSync(parent, { throwIfNoEntry: false });
      if (st?.isSymbolicLink()) issues.push(`Unsafe link parent: ${parent}.`);
      if (st && !st.isDirectory()) issues.push(`Non-directory parent: ${parent}.`);
      if (parent === root || parent === os.homedir()) break;
      parent = path.dirname(parent);
    }
  }
  return [...new Set(issues)];
}
function skillRoot(p: string): string | null {
  return p.match(/^(.*(?:^|\/)(?:\.make-docs\/agentics|\.agents|\.claude|\.codex)\/skills\/[^/]+)(?:\/|$)/)?.[1] ?? null;
}
const legacySkillRoot = (p: string) => p.startsWith('.make-docs/agentics/skills/') || (path.isAbsolute(p) && [os.homedir(),canonicalInstallationPath(os.homedir())].some(home=>p.startsWith(normalized(path.join(home,'.make-docs/agentics/skills'))+'/')));
function addParents(map: Snapshot, before: Snapshot, p: string, boundary: string) {
  let parent = normalized(path.dirname(p));
  while (under(parent, boundary)) {
    map[parent] ??= before[parent]?.kind === "directory" ? before[parent] : { kind: "directory", mode: 0o755 };
    if (parent === boundary) break;
    parent = normalized(path.dirname(parent));
  }
}
function setAsset(map: Snapshot, before: Snapshot, asset: ResolvedFileAsset, boundary: string) {
  map[asset.relativePath] = file(asset.content, before[asset.relativePath]?.kind === "file" ? before[asset.relativePath].mode : 0o644);
  addParents(map, before, asset.relativePath, boundary);
}
function changesBetween(before: Snapshot, after: Snapshot): Change[] {
  const remove: Change[] = [], dirs: Change[] = [], files: Change[] = [], links: Change[] = [];
  for (const p of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()) {
    const old = before[p] ?? missing(), next = after[p] ?? missing();
    if (same(old, next)) continue;
    let from = old;
    if (old.kind !== "missing" && (next.kind === "missing" || old.kind !== next.kind || (old.kind === 'symlink' && old.target !== next.target))) {
      remove.push({ path: p, before: old, after: missing() });
      from = missing();
    }
    if (next.kind === "missing") continue;
    const change = { path: p, before: from, after: next };
    (next.kind === "directory" ? dirs : next.kind === "symlink" ? links : files).push(change);
  }
  remove.sort((a, b) => depth(b.path) - depth(a.path) || a.path.localeCompare(b.path));
  dirs.sort((a, b) => depth(a.path) - depth(b.path) || a.path.localeCompare(b.path));
  return [...remove, ...dirs, ...files, ...links];
}

export async function buildSkillAdoptionReview(options: {
  targetDir: string;
  selections: InstallSelections;
  adoptExisting: string[];
  effectiveRegistry: EffectiveSkillRegistry;
}): Promise<SkillAdoptionReview> {
  const targetRoot = canonicalInstallationPath(options.targetDir);
  const configParents = checkParents(targetRoot, [".make-docs/config.yaml"]);
  if (configParents.length) throw new Error(configParents.join("\n"));
  loadMakeDocsConfigOrThrow(targetRoot);
  const beforeLedger = loadManifest(targetRoot);
  const names = [...new Set(options.adoptExisting)].sort();
  const selections = structuredClone(options.selections);
  selections.selectedSkills = [...new Set(selections.selectedSkills)].sort();
  selections.skillHarnesses = {...(selections.skillHarnesses ?? selections.harnesses)};
  if (options.effectiveRegistry.source.kind !== "built-in") throw new Error("Existing-copy adoption requires the built-in first-party registry.");
  const registryNames = new Set(options.effectiveRegistry.registry.skills.map(s => s.name));
  if (!names.length || names.some(name => !registryNames.has(name) || !selections.selectedSkills.includes(name))) throw new Error("Adoption names must be selected first-party Skills. Review --selected-skills and --adopt-existing.");
  const packageDigest = await getEmbeddedSkillPackageDigest();
  const packageMeta = readPackageMeta();
  const assets = await getDesiredSkillAssets(selections, options.effectiveRegistry.registry);
  const exposures = assets.filter((a): a is ResolvedSkillExposureAsset => a.kind === "skill-exposure");
  const payloads = assets.filter((a): a is ResolvedFileAsset => a.kind !== "skill-exposure");
  const roots = [...new Set([...assets.map(a => a.kind === 'skill-exposure' ? a.relativePath : skillRoot(a.relativePath)), ...(beforeLedger?.skillFiles ?? []).map(p => beforeLedger?.files[p]?.skillExposure ? p : skillRoot(p))].filter((p): p is string => p !== null))].sort();
  const legacyContainers = ['.make-docs/agentics', ...(selections.skillScope === 'global' || beforeLedger?.selections.skillScope === 'global' ? [normalized(path.join(os.homedir(),'.make-docs/agentics'))] : [])];
  const unownedLegacy: string[] = [];
  for (const container of legacyContainers) {
    const parentIssues = checkParents(targetRoot,[container]);
    if (parentIssues.length) throw new Error(parentIssues.join('\n'));
    const current = inspect(targetRoot,container);
    if (current.kind === 'missing') continue;
    if (current.kind !== 'directory') throw new Error(`Unsafe retired Skill container: ${container}. Preserve it before layout review.`);
    const inventory = snapshot(targetRoot,[container],[]);
    for (const p of Object.keys(inventory)) if (p !== container && p !== container+'/skills' && !roots.some(r=>legacySkillRoot(r) && under(p,r))) unownedLegacy.push(p);
    // Missing named roots bound empty parent cleanup, not ownership of existing content.
    for (const name of names) { const legacy=container+'/skills/'+name; if (!roots.includes(legacy)) roots.push(legacy); }
  }
  roots.sort();
  const rootParents = checkParents(targetRoot, roots);
  if (rootParents.length) throw new Error(rootParents.join("\n"));
  const normal = await planSkillsOnlyInstall({ targetDir: targetRoot, selections, existingManifest: beforeLedger, remove: false, packageMeta, skillRegistry: options.effectiveRegistry.registry, reviewedSkillAdoption:true });
  const bootstrapPaths = normal.actions.filter(a => a.sourceId?.startsWith("router:")).map(a => a.relativePath).sort();
  const exactPaths = [...bootstrapPaths, ".make-docs/config.yaml"];
  const blockers = checkParents(targetRoot, [...roots, ...exactPaths]);
  if (blockers.length) throw new Error(blockers.join("\n"));
  if (unownedLegacy.length) blockers.push(`Unowned retired Skill content needs explicit disposition before cutover: ${unownedLegacy.join(', ')}. Preserve it; directory location alone does not prove ownership.`);
  const before = snapshot(targetRoot, roots, exactPaths);
  const claims = readInstallationPathClaims(targetRoot, roots);
  for (const claim of claims) if (canonicalInstallationPath(claim.rootPath) !== targetRoot || claim.kind === "pending") blockers.push(`Another ${claim.kind === "pending" ? "pending operation" : "checkout owner"} claims ${claim.path}: ${claim.rootPath}${claim.operationId ? ` (${claim.operationId})` : ""}.`);
  const after: Snapshot = {};
  const cleanupPaths: string[] = [];
  for (const oldRoot of roots.filter(legacySkillRoot)) if (!names.includes(path.basename(oldRoot))) blockers.push(`Legacy Skill ${path.basename(oldRoot)} must be named in --adopt-existing for its reviewed layout cutover.`);
  for (const oldName of beforeLedger?.selections.selectedSkills ?? []) if (!selections.selectedSkills.includes(oldName)) blockers.push(`Adoption cannot also deselect ${oldName}. Use normal setup skills to remove it, then create a new adoption review.`);
  const alternatives: Record<string, Snapshot> = {};
  const known = new Set<string>([...payloads.map(a => a.relativePath), ...exposures.flatMap(a => a.copyMirrorAssets.map(f => f.relativePath)), ...Object.keys(beforeLedger?.files ?? {}).filter(p => skillRoot(p))]);
  for (const [p,entry] of Object.entries(beforeLedger?.files ?? {})) if (entry.skillExposure) {
    const canonicalRoot=entry.skillExposure.canonicalPayloadPath;
    for (const owned of Object.keys(beforeLedger!.files)) if (under(owned,canonicalRoot)) known.add(p+owned.slice(canonicalRoot.length));
  }
  for (const [p, state] of Object.entries(before)) {
    if (!roots.some(root => under(p, root))) continue;
    if (state.kind === "file" && !known.has(p)) blockers.push(`Unknown extra file: ${p}. Preserve it before adoption.`);
    if (state.kind === "symlink") {
      const exposure = exposures.find(e => e.relativePath === p);
      const expectedTarget=beforeLedger?.files[p]?.skillExposure?.symlinkTarget ?? exposure?.skillExposure.symlinkTarget;
      if (!expectedTarget || state.target !== expectedTarget) blockers.push(`Unsafe or wrong-target Skill link: ${p}.`);
    }
    if (state.kind === "directory" && !roots.includes(p) && ![...known].some(f => under(f, p))) blockers.push(`Unknown extra directory: ${p}. Preserve it before adoption.`);
  }
  const adoptedRoots = new Set(exposures.filter(e => names.includes(e.skillExposure.skillName)).flatMap(e => [e.relativePath, e.skillExposure.canonicalPayloadPath]));
  for (const entry of options.effectiveRegistry.registry.skills.filter(s => names.includes(s.name))) {
    for (const root of roots) if (root.endsWith("/" + entry.installName)) adoptedRoots.add(root);
  }
  for (const root of roots) if (before[root]?.kind !== "missing" && !adoptedRoots.has(root) && !Object.keys(beforeLedger?.files ?? {}).some(p=>under(p,root))) {
    blockers.push(`Existing unowned Skill path needs an explicit --adopt-existing selection: ${root}.`);
  }
  // Two independently edited copies cannot be resolved by a same-name choice.
  for (const name of names) {
    const copies = [...adoptedRoots].filter(root => root.endsWith("/" + options.effectiveRegistry.registry.skills.find(e => e.name === name)!.installName));
    const byFile = new Map<string, Set<string>>();
    for (const root of copies) for (const [p, state] of Object.entries(before)) if (under(p, root) && state.kind === "file") {
      const suffix = p.slice(root.length + 1), hashes = byFile.get(suffix) ?? new Set(); hashes.add(state.digest!); byFile.set(suffix, hashes);
    }
    for (const [suffix, hashes] of byFile) if (hashes.size > 1) blockers.push(`Conflicting existing copies for ${name}/${suffix}. Choose one preserved source before adoption.`);
  }
  for (const asset of payloads) setAsset(after, before, asset, skillRoot(asset.relativePath)!);
  const desiredFiles = { ...normal.desiredFiles };
  const copyFallbacks: NonNullable<DetachedInstallationPlan["copyFallbacks"]> = {};
  const symlinkTargets: Record<string, string> = {};
  const beforeSymlinkTargets: Record<string, string> = {};
  for (const [p,state] of Object.entries(before)) if (state.kind === "symlink" && state.target === beforeLedger?.files[p]?.skillExposure?.symlinkTarget) beforeSymlinkTargets[p]=state.target!;
  for (const exposure of exposures) {
    const copy: Snapshot = {};
    for (const asset of exposure.copyMirrorAssets) setAsset(copy, before, asset, exposure.relativePath);
    copy[exposure.relativePath] ??= { kind: "directory", mode: 0o755 };
    const currentCopy = Object.fromEntries(Object.entries(before).filter(([p]) => under(p, exposure.relativePath)));
    const matchesCopy = canonical(Object.fromEntries(Object.entries(currentCopy).map(([p,s]) => [p,plain(s)]))) === canonical(Object.fromEntries(Object.entries(copy).map(([p,s]) => [p,plain(s)])));
    const asCopy = process.env.MAKE_DOCS_DISABLE_SKILL_SYMLINKS === "1" || matchesCopy;
    const entry = desiredFiles[exposure.relativePath];
    const priorFallback = asCopy && matchesCopy ? beforeLedger?.files[exposure.relativePath]?.skillExposure?.fallbackReason : undefined;
    desiredFiles[exposure.relativePath] = { ...entry, skillExposure: { ...exposure.skillExposure, mode: asCopy ? "copy-mirror" : "symlink", ...(priorFallback ? {fallbackReason:priorFallback} : {}) } };
    if (asCopy) Object.assign(after, copy);
    else {
      after[exposure.relativePath] = { kind: "symlink", target: exposure.skillExposure.symlinkTarget };
      symlinkTargets[exposure.relativePath] = exposure.skillExposure.symlinkTarget;
      alternatives[exposure.relativePath] = copy;
      copyFallbacks[exposure.relativePath] = { changes: changesBetween({ [exposure.relativePath]: missing() }, copy), ledgerEntry: { ...entry, skillExposure: { ...exposure.skillExposure, mode: "copy-mirror", fallbackReason: "The reviewed native symlink is unavailable; use its declared copy mirror." } } };
    }
  }
  for (const action of normal.actions) {
    const root = roots.find(p => under(action.relativePath,p)) ?? skillRoot(action.relativePath);
    if (!root) {
      if (action.type === "noop") after[action.relativePath] = before[action.relativePath] ?? inspect(targetRoot, action.relativePath);
      else if (["create", "update", "generate"].includes(action.type) && typeof action.content === "string") after[action.relativePath] = file(action.content, before[action.relativePath]?.mode);
      else if (action.type !== "skip") blockers.push(`Bootstrap path needs normal setup review before adoption: ${action.relativePath}.`);
      continue;
    }
    if (action.type === "skip-conflict") {
      const owned = beforeLedger?.files[action.relativePath];
      const prior = owned?.skillExposure;
      const desired = exposures.find(exposure => exposure.relativePath === action.relativePath);
      const current = before[action.relativePath];
      // Normal setup must refuse retargeting a managed link. This reviewed
      // cutover may replace only its exact recorded legacy exposure.
      const reviewedLegacyRetarget = prior && desired && current?.kind === 'symlink'
        && prior.mode === 'symlink' && current.target === prior.symlinkTarget
        && names.includes(prior.skillName) && beforeLedger?.skillFiles?.includes(action.relativePath)
        && owned.sourceId === desired.sourceId && prior.exposurePath === action.relativePath
        && prior.skillName === desired.skillExposure.skillName && prior.installName === desired.skillExposure.installName
        && prior.harness === desired.skillExposure.harness && prior.scope === desired.skillExposure.scope
        && legacySkillRoot(prior.canonicalPayloadPath) && roots.includes(prior.canonicalPayloadPath)
        && path.resolve(path.dirname(relativePathToTarget(targetRoot,action.relativePath)),prior.symlinkTarget) === path.resolve(targetRoot,prior.canonicalPayloadPath);
      if (!adoptedRoots.has(root) || (owned && !reviewedLegacyRetarget)) blockers.push(`Protected managed or unselected adoption conflict: ${action.relativePath}.`);
    }
    if (action.type === "remove-managed") delete desiredFiles[action.relativePath];
  }
  const configBefore = before[".make-docs/config.yaml"];
  // Identity is allocated only for the saved apply plan. Review names this exact
  // config effect without making a random identity change the review digest.
  const configObject = configBefore.kind === "file" ? parse(Buffer.from(configBefore.contentBase64!, "base64").toString("utf8")) ?? {} : {};
  const projectId = beforeLedger?.projectId ?? (typeof configObject.projectId === "string" ? configObject.projectId : mintProjectId());
  after[".make-docs/config.yaml"] = configObject.projectId ? configBefore : file(stringify({ ...configObject, projectId }), configBefore.mode);
  const inventoryDigest = hashText(canonical({ before, packageDigest, selections, names, claims }));
  const backupRoot = `.make-docs/backup/skill-adoption-${inventoryDigest.slice(0,12)}`;
  const backups: SkillAdoptionReview["backups"] = [];
  for (const [p, old] of Object.entries(before)) if (old.kind === "file" && roots.some(root => under(p, root)) && !same(old, after[p] ?? missing())) {
    const destination = backupRoot + "/" + (path.isAbsolute(p) ? "_global/" + p.replace(/^\/+/, "") : p);
    backups.push({ source: p, destination, digest: old.digest! }); after[destination] = old; addParents(after, before, destination, backupRoot);
  }
  if (backups.length) {
    const existingBackup = inspect(targetRoot, backupRoot);
    if (existingBackup.kind !== "missing") blockers.push(`The reviewed backup destination already exists: ${backupRoot}. Preserve it and create a fresh review.`);
    before[backupRoot] = existingBackup;
  }
  // Every auxiliary parent created by this operation is explicit and recoverable.
  for (const p of Object.keys(after)) {
    let parent = normalized(path.dirname(p));
    while (parent !== "." && parent !== "/" && !roots.some(r => under(parent, r))) {
      if (path.isAbsolute(parent) && !roots.some(r => r.startsWith(parent + "/"))) break;
      if (path.isAbsolute(parent) && parent === os.homedir()) break;
      // The machine Store owns this root and creates its global asset lease
      // before the reviewed callback. It is never an adoption payload step.
      if (path.isAbsolute(parent) && parent === path.join(os.homedir(), ".make-docs")) break;
      const current = inspect(targetRoot, parent); before[parent] ??= current;
      if (current.kind === "missing") after[parent] ??= { kind: "directory", mode: 0o755 };
      else if (current.kind === "directory") after[parent] ??= current;
      else blockers.push(`Unsafe parent for planned output: ${parent}.`);
      parent = normalized(path.dirname(parent));
    }
  }
  // Retired parents are removed only when the complete inspected subtree belongs
  // to this reviewed cutover. Unknown content blocks instead of being pruned.
  const legacyParents = [...new Set(roots.filter(legacySkillRoot).flatMap(p => [normalized(path.dirname(p)),normalized(path.dirname(path.dirname(p)))]))].sort((a,b)=>depth(b)-depth(a));
  for (const parent of legacyParents) {
    const inventory = snapshot(targetRoot,[parent],[]);
    const unknown = Object.keys(inventory).filter(p => p !== parent && !legacyParents.includes(p) && !roots.some(r => under(p,r)));
    if (unknown.length) { blockers.push(`Legacy Skill directory contains unrelated content: ${unknown.join(', ')}. Preserve it before layout cutover.`); continue; }
    Object.assign(before,inventory);
    if (before[parent].kind === 'directory') { after[parent]=missing(); cleanupPaths.push(parent); }
    else if (before[parent].kind !== 'missing') blockers.push(`Unsafe legacy Skill parent: ${parent}.`);
  }
  const files = { ...(beforeLedger?.files ?? {}), ...desiredFiles };
  for (const action of normal.actions) if (action.type === "remove-managed") delete files[action.relativePath];
  for (const p of Object.keys(files)) if (legacySkillRoot(p) || (beforeLedger?.files[p]?.skillExposure && !desiredFiles[p] && after[p]?.kind === 'directory')) delete files[p];
  const skillFiles = [...new Set([...(beforeLedger?.skillFiles ?? []), ...normal.desiredSkillFiles])].filter(p => !!files[p] && !normal.actions.some(a => a.relativePath === p && a.type === "remove-managed"));
  const afterLedger = createManifest(packageMeta, normal.profile, files, skillFiles, beforeLedger?.systemAssetMaterialization ?? normal.systemAssetMaterialization, projectId, normal.routerOwnership!, normal.resourceProjection!);
  const ownershipChanges = [...new Set([...Object.keys(beforeLedger?.files ?? {}), ...Object.keys(files)])].filter(p => roots.some(root => under(p,root))).map(p => ({ path:p, effect: !beforeLedger?.files[p] ? "register" as const : !files[p] ? "remove" as const : isDeepStrictEqual(beforeLedger.files[p], files[p]) ? "retain" as const : "update" as const, before:beforeLedger?.files[p] ?? null, after:files[p] ?? null }));
  const changes = changesBetween(before, after);
  // Existing ancestor directories are pinned inputs, not deletion targets.
  const filtered = changes.filter(c => !(c.after.kind === "missing" && !roots.some(root => under(c.path,root)) && !exactPaths.includes(c.path) && !cleanupPaths.includes(c.path)));
  const backupFirst = (c: Change) => backups.length > 0 && c.before.kind === "missing" && (under(c.path,backupRoot) || (c.after.kind === "directory" && under(backupRoot,c.path)));
  const retiredRemoval = (c: Change) => c.after.kind === 'missing' && (legacySkillRoot(c.path) || cleanupPaths.includes(c.path));
  const filteredChanges = [...filtered.filter(backupFirst), ...filtered.filter(c=>!backupFirst(c) && !retiredRemoval(c)), ...filtered.filter(c=>!backupFirst(c) && retiredRemoval(c))];
  const digestAfter = { ...after, ".make-docs/config.yaml": configObject.projectId ? configBefore : { kind:"file", generatedProjectIdentity:true, existingConfig: configBefore.digest ?? null } };
  const digest = hashText(canonical({ targetRoot, packageDigest, package:packageMeta, selections, names, roots, cleanupPaths, before, after:digestAfter, alternatives, backups, claims, beforeLedger, ownershipChanges, bootstrapPaths, blockers }));
  const intermediateStates: Record<string, State[]> = {};
  for (const change of filteredChanges) (intermediateStates[change.path] ??= []).push(change.before, change.after);
  const review: SkillAdoptionReview = { schemaVersion:1, targetRoot, digest, packageDigest, package:packageMeta, selections, adoptExisting:names, roots, cleanupPaths, bootstrapPaths, before, after, alternatives, intermediateStates, backups, claims, beforeLedger, blockers:[...new Set(blockers)].sort(), ownershipChanges, plan: undefined! };
  review.plan = { schemaVersion:1, reviewDigest:digest, mode:"cli", metadata:undefined, changes:filteredChanges, afterLedger, skillScope:{ roots, symlinkTargets, beforeSymlinkTargets, bootstrapPaths, backupRoots:backups.length ? [backupRoot] : [] }, copyFallbacks };
  review.plan.metadata = { ...review, plan:undefined };
  return review;
}

export function presentSkillAdoptionReview(review: SkillAdoptionReview) {
  const unchanged = !review.plan.changes.length && review.ownershipChanges.every(c=>c.effect === "retain") && isDeepStrictEqual(review.beforeLedger?.selections, review.plan.afterLedger?.selections);
  return {
    schemaVersion:1, status:review.blockers.length ? "blocked" : unchanged ? "unchanged" : "ready", targetRoot:review.targetRoot,
    reviewDigest:review.digest, package:review.package, packageDigest:review.packageDigest,
    scope:review.selections.skillScope, selectedTools:Object.entries(review.selections.skillHarnesses ?? review.selections.harnesses).filter(([,v])=>v).map(([k])=>k), selectedSkills:review.selections.selectedSkills, adoptExisting:review.adoptExisting,
    inventory:Object.entries(review.before).map(([p,s])=>({path:p,...plain(s)})),
    changes:review.plan.changes.map(c=>({path:c.path,before:plain(c.before),after:plain(c.after)})),
    backups:review.backups, recoveryLimits:review.roots.some(legacySkillRoot) ? ["This layout cutover supports forward resume. Rollback that would recreate retired .make-docs/agentics paths is blocked; preserved bytes remain in the reviewed backups and Store."] : [], currentOwner:review.beforeLedger ? {projectId:review.beforeLedger.projectId,checkoutRoot:review.targetRoot} : null, ownership:review.ownershipChanges, claims:review.claims, blockers:review.blockers,
    nextAction:review.blockers.length ? "Preserve blocked inputs and resolve them before a new review." : unchanged ? "These Skill files and ownership already match. No adoption is needed." : `Repeat setup skills with the same target, scope, tools, selected Skills, and --adopt-existing ${review.adoptExisting.join(",")}; replace --dry-run with --review ${review.digest}.`,
  };
}

export function verifySkillAdoption(root: string, metadata: unknown, phase: "before"|"after"|"progress", temporaryFiles?: Snapshot): string[] {
  const review = metadata as SkillAdoptionReview;
  if (!review || review.schemaVersion !== 1 || canonicalInstallationPath(root) !== review.targetRoot) return ["Adoption review belongs to another target."];
  const issues = checkParents(root, review.roots);
  if (issues.length) return issues;
  const expected = phase === "before" ? review.before : review.after;
  const exact = Object.keys(review.before).filter(p => !review.roots.some(r => under(p,r)));
  let current: Snapshot;
  try { current = snapshot(root, [...review.roots, ...(review.cleanupPaths ?? []), ...new Set(review.backups.map(b => b.destination.split("/").slice(0,3).join("/")))], exact); }
  catch (error) { return [String(error)]; }
  const allowed = { ...expected };
  if (phase !== "before") for (const [exposure, copy] of Object.entries(review.alternatives)) {
    if (current[exposure]?.kind === "directory") { for (const p of Object.keys(allowed)) if (under(p,exposure)) delete allowed[p]; Object.assign(allowed,copy); }
  }
  for (const [p,state] of Object.entries(current)) {
    if (temporaryFiles?.[p] && phase === "progress" && same(state,temporaryFiles[p])) continue;
    const matches = same(state,allowed[p] ?? missing()) || (phase === "progress" && (same(state,review.before[p] ?? missing()) || review.intermediateStates[p]?.some(s=>same(state,s))));
    if (!matches) issues.push(`Adoption input/output changed: ${p}.`);
  }
  for (const [p,state] of Object.entries(allowed)) if (!current[p] && state.kind !== "missing" && !(phase === "progress" && ((review.before[p]?.kind ?? "missing") === "missing" || review.intermediateStates[p]?.some(s=>s.kind === "missing")))) issues.push(`Adoption path is missing: ${p}.`);
  return [...new Set(issues)];
}

/** State entry points must register this validator in every fresh process. */
export function verifySkillAdoptionBeforeCleanup(root: string, metadata: unknown): string[] {
  const review = metadata as SkillAdoptionReview;
  if (!review || review.schemaVersion !== 1 || canonicalInstallationPath(root) !== review.targetRoot) return ['Adoption review belongs to another target.'];
  const after = {...review.after};
  for (const [p,before] of Object.entries(review.before)) if (legacySkillRoot(p) || review.cleanupPaths.includes(p)) {
    const current = inspect(root,p);
    if (!same(current,before) && current.kind !== 'missing') return [`Retired source changed before cleanup: ${p}.`];
    after[p] = current;
  }
  return verifySkillAdoption(root,{...review,after},'after');
}

let recoveryRegistered = false;
export function registerSkillAdoptionRecovery(): void {
  if (recoveryRegistered) return;
  registerDetachedInstallationOperation(OPERATION, {
    validate:verifySkillAdoption,
    beforeRetiredCleanup:verifySkillAdoptionBeforeCleanup,
    nextAction:(root,id)=>`Inspect make-docs project state recover ${id} --resume --dry-run --target-root ${JSON.stringify(root)}.`,
  });
  recoveryRegistered = true;
}
registerSkillAdoptionRecovery();

export function applySkillAdoptionReview(review: SkillAdoptionReview, digest: string) {
  if (digest !== review.digest) throw new Error("Adoption review changed. Run a new dry run and review its exact digest.");
  if (review.blockers.length) throw new Error(review.blockers.join("\n"));
  if (presentSkillAdoptionReview(review).status === "unchanged") return { status:"unchanged", reviewDigest:review.digest };
  const prepared = prepareDetachedInstallationOperation(review.targetRoot, OPERATION, () => {
    assertEmbeddedSkillPackageDigest(review.packageDigest);
    if (!isDeepStrictEqual(loadManifest(review.targetRoot),review.beforeLedger)) throw new Error("Installation ownership changed after adoption review.");
    if (!isDeepStrictEqual(readInstallationPathClaims(review.targetRoot,review.roots),review.claims)) throw new Error("Skill ownership or pending operations changed after review.");
    const problems = verifySkillAdoption(review.targetRoot,review,"before");
    if (problems.length) throw new Error(problems.join("\n"));
    return review.plan;
  });
  return { ...recoverInstallationOperation(review.targetRoot, prepared.operationId,"resume",false), reviewDigest:review.digest };
}
