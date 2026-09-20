import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, readlinkSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { isScalar, parseDocument, visit } from 'yaml';
import { loadMakeDocsConfig } from './config.js';
import { getRetiredResourceReplacement } from './retired-resource-paths.js';

export interface LayoutFileState {
  kind: 'missing' | 'directory' | 'file' | 'symlink';
  digest?: string;
  mode?: number;
  target?: string;
  contentBase64?: string;
}
export interface LayoutEntry {
  path: string;
  state: LayoutFileState;
  disposition: 'preserve' | 'move' | 'remove-empty' | 'blocked';
  destination?: string;
  provenance: string;
}
export interface LayoutChange {
  path: string;
  before: LayoutFileState;
  after: LayoutFileState;
  reason: string;
}
export interface LayoutLinkEdit {
  source: string;
  destination: string;
  before: string;
  after: string;
  target: string;
}
export interface LayoutPlan {
  schemaVersion: 1;
  projectRoot: string;
  digest: string;
  configDigest: string;
  mappings: string[];
  scopeRoots: string[];
  entries: LayoutEntry[];
  changes: LayoutChange[];
  blockers: string[];
  linkEdits: LayoutLinkEdit[];
  expectedBefore: Record<string, LayoutFileState>;
  expectedAfter: Record<string, LayoutFileState>;
  linkSources: string[];
  metadataEdits: Array<{ path: string; field: string; before: string; after: string }>;
  exclusions: Array<{ path: string; reason: string }>;
}
export interface LayoutVerification {
  blockers: string[];
  evidence: { phase: 'before' | 'after' | 'progress'; pathsChecked: number; linksChecked: number; digest: string };
}
const MISSING: LayoutFileState = { kind: 'missing' };
const OLD_TYPES = ['contracts', 'prompts', 'references', 'templates', 'scripts'];
const ROOT_LINK_DOCUMENTS = ['README.md', 'AGENTS.md', 'CLAUDE.md', 'GEMINI.md'];
const hash = (value: string | Buffer): string => createHash('sha256').update(value).digest('hex');
const depth = (value: string): number => value.split('/').length;
const inside = (value: string, root: string): boolean => value === root || value.startsWith(`${root}/`);
const unique = (values: string[]): string[] => [...new Set(values)].sort();

/** Reject lexical and filesystem escapes. Symlinks are recorded, never traversed. */
export function isLayoutRelativePath(value: string): boolean {
  return value.length > 0 && !path.isAbsolute(value) && !value.includes('\\') && !value.includes('\0')
    && value.split('/').every((part) => part !== '' && part !== '.' && part !== '..');
}
function readState(root: string, relative: string): LayoutFileState {
  if (!isLayoutRelativePath(relative)) throw new Error(`Unsafe layout path: ${relative}`);
  const parts = relative.split('/');
  for (let n = 1; n < parts.length; n++) {
    try {
      const parent = lstatSync(path.join(root, ...parts.slice(0, n)));
      if (parent.isSymbolicLink() || !parent.isDirectory()) throw new Error(`Unsafe layout parent: ${parts.slice(0, n).join('/')}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return MISSING;
      throw error;
    }
  }
  let stat;
  try { stat = lstatSync(path.join(root, relative)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return MISSING; throw error; }
  const mode = stat.mode & 0o777;
  if (stat.isSymbolicLink()) return { kind: 'symlink', target: readlinkSync(path.join(root, relative)), mode };
  if (stat.isDirectory()) return { kind: 'directory', mode };
  if (stat.isFile()) {
    const bytes = readFileSync(path.join(root, relative));
    return { kind: 'file', digest: hash(bytes), mode, contentBase64: bytes.toString('base64') };
  }
  throw new Error(`Unsupported layout file kind: ${relative}`);
}
function snapshot(root: string, relative: string, result: Record<string, LayoutFileState>): void {
  if (result[relative]) return;
  const state = readState(root, relative);
  result[relative] = state;
  if (state.kind === 'directory') {
    for (const name of readdirSync(path.join(root, relative)).sort()) snapshot(root, `${relative}/${name}`, result);
  }
}
function identity(state: LayoutFileState): string {
  return JSON.stringify({ kind: state.kind, digest: state.digest, mode: state.mode, target: state.target });
}
function same(a: LayoutFileState, b: LayoutFileState): boolean { return identity(a) === identity(b); }
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`).join(',')}}`;
  return JSON.stringify(value);
}
export function layoutPlanDigest(plan: Omit<LayoutPlan, 'digest'> | LayoutPlan): string {
  const { digest: _digest, ...body } = plan as LayoutPlan;
  return hash(canonical(body));
}
function ancestorDirs(relative: string): string[] {
  const pieces = relative.split('/');
  return pieces.slice(0, -1).map((_, i) => pieces.slice(0, i + 1).join('/'));
}
function markdownFiles(root: string, relative: string, result: string[]): void {
  const state = readState(root, relative);
  if (state.kind === 'file' && relative.endsWith('.md')) result.push(relative);
  if (state.kind === 'directory') for (const name of readdirSync(path.join(root, relative)).sort()) markdownFiles(root, `${relative}/${name}`, result);
}
interface Mapping { source: string; destination: string; explicit: boolean; }
function mappedPath(source: string, mappings: Mapping[]): string {
  const mapping = mappings.filter((entry) => inside(source, entry.source)).sort((a, b) => b.source.length - a.source.length)[0];
  return mapping ? mapping.destination + source.slice(mapping.source.length) : source;
}
/** Read-only preview. It never opens the Store or creates project files. */
export function previewProjectLayout(projectRoot: string, requestedMappings: string[] = []): LayoutPlan {
  const root = realpathSync(projectRoot);
  if (!lstatSync(root).isDirectory()) throw new Error('Layout target must be an existing directory.');
  const blockers: string[] = [];
  const before: Record<string, LayoutFileState> = {};
  const scopes = ['docs/assets', 'docs/artifacts', '.make-docs/archive', ...OLD_TYPES.map((type) => `.make-docs/${type}`)];
  for (const scope of scopes) snapshot(root, scope, before);
  const configState = readState(root, '.make-docs/config.yaml');
  before['.make-docs/config.yaml'] = configState;
  const configDigest = hash(identity(configState));
  const configured = loadMakeDocsConfig(root);
  if (!configured.valid) blockers.push(...configured.diagnostics.map((diagnostic) => diagnostic.message));
  const personaSlugs = new Set(configured.config.personas.map((persona) => persona.slug));
  const mappings: Mapping[] = [];
  const isLegacySource = (source: string): boolean => ['docs/artifacts', ...['archive', 'artifacts', 'library', 'playbooks'].map((name) => `docs/assets/${name}`), ...OLD_TYPES.map((type) => `.make-docs/${type}/system`)].some((scope) => inside(source, scope));
  const isDestination = (destination: string): boolean => {
    if (inside(destination, '.make-docs/archive')) return true;
    if (OLD_TYPES.some((type) => inside(destination, `.make-docs/system/${type}`))) return true;
    const match = /^docs\/assets\/([^/]+)(?:\/|$)/.exec(destination);
    return Boolean(match && (match[1] === 'project' || personaSlugs.has(match[1]!)));
  };
  for (const raw of unique(requestedMappings)) {
    const equals = raw.indexOf('=');
    const source = raw.slice(0, equals), destination = raw.slice(equals + 1);
    if (equals < 1 || !isLayoutRelativePath(source) || !isLayoutRelativePath(destination) || !isLegacySource(source) || !isDestination(destination)
      || inside(destination, source) || inside(source, destination)) {
      blockers.push(`Invalid layout mapping: ${raw}. Use a legacy source and a distinct canonical destination.`); continue;
    }
    if (mappings.some((mapping) => mapping.source === source)) { blockers.push(`Conflicting mappings for ${source}.`); continue; }
    if (!before[source] || before[source]?.kind === 'missing') { blockers.push(`Mapping source does not exist: ${source}.`); continue; }
    mappings.push({ source, destination, explicit: true });
  }
  for (const [source, destination] of [
    ['docs/artifacts', 'docs/assets/project'], ['docs/assets/artifacts', 'docs/assets/project'],
    ['docs/assets/archive', '.make-docs/archive'], ['docs/assets/playbooks', '.make-docs/archive/legacy-playbooks'],
    ['docs/assets/library/user', 'docs/assets/user'],
  ]) {
    if (!mappings.some((mapping) => mapping.source === source) && before[source!]?.kind !== 'missing' && before[source!]) mappings.push({ source: source!, destination: destination!, explicit: false });
  }
  // A name alone cannot prove that developer/agent was the former shipped audience.
  const library = 'docs/assets/library';
  if (before[library]?.kind === 'directory') for (const name of readdirSync(path.join(root, library)).sort()) {
    const source = `${library}/${name}`;
    if (!mappings.some((mapping) => inside(source, mapping.source)) && before[source]?.kind !== 'directory') {
      blockers.push(`Unmapped Library content: ${source}. Review an explicit configured-audience destination.`);
    } else if (!mappings.some((mapping) => inside(source, mapping.source)) && Object.keys(before).some((p) => p.startsWith(`${source}/`) && ['file', 'symlink'].includes(before[p]!.kind))) {
      blockers.push(`Audience provenance requires review: ${source}. Supply an explicit configured-audience mapping; its name alone is insufficient.`);
    }
  }
  for (const type of OLD_TYPES) {
    const source = `.make-docs/${type}/system`;
    for (const entry of Object.keys(before).filter((name) => inside(name, source) && ['file', 'symlink'].includes(before[name]!.kind))) {
      if (!mappings.some((mapping) => inside(entry, mapping.source))) blockers.push(`Old system resource needs a reviewed disposition: ${entry}.`);
      const destination = mappedPath(entry, mappings);
      const replacement = getRetiredResourceReplacement(destination);
      if (replacement) blockers.push(`Retired system resource name must not be recreated: ${entry} -> ${destination}. Review an exact mapping to ${replacement}, or archive the legacy content.`);
    }
  }
  const after: Record<string, LayoutFileState> = { ...before };
  const entries: LayoutEntry[] = [];
  const reasons = new Map<string, string>();
  const moves = new Map<string, string>();
  for (const source of Object.keys(before).sort()) {
    const state = before[source]!;
    const destination = mappedPath(source, mappings);
    const legacy = isLegacySource(source) || source === library;
    if (state.kind === 'missing') continue;
    const mapping = mappings.filter((entry) => inside(source, entry.source)).sort((a, b) => b.source.length - a.source.length)[0];
    const provenance = mapping?.explicit ? `Explicit reviewed mapping ${mapping.source}=${mapping.destination}` : mapping ? `Recognized legacy cohort ${mapping.source}; inventoried bytes and relative paths` : legacy ? 'Legacy content without a complete reviewed disposition' : 'Unchanged project material';
    if (legacy && state.kind === 'symlink') {
      blockers.push(`Symbolic link needs a separate reviewed disposition: ${source}. Layout migration does not move or create symbolic links.`);
      entries.push({ path: source, state, disposition: 'blocked', provenance });
      continue;
    }
    if (source !== destination && state.kind !== 'directory') {
      if (!before[destination]) before[destination] = readState(root, destination);
      const prior = after[destination] ?? before[destination]!;
      if (prior.kind !== 'missing') {
        if (!same(prior, state)) blockers.push(`Destination conflict: ${source} -> ${destination}. Existing bytes or kind differ.`);
        else if (!mapping?.explicit) blockers.push(`Identical destination needs explicit provenance review: ${source} -> ${destination}. Supply an explicit mapping to confirm this duplicate.`);
      }
      after[destination] = state;
      after[source] = MISSING;
      moves.set(source, destination);
      reasons.set(source, `Move reviewed source to ${destination}`);
      reasons.set(destination, `Preserve bytes from ${source}`);
      entries.push({ path: source, state, disposition: 'move', destination, provenance });
    } else entries.push({ path: source, state, disposition: legacy && state.kind !== 'directory' ? 'blocked' : 'preserve', provenance });
  }
  // Prune only inventoried directories that will be empty. Preserve empty active audience dirs.
  for (const source of Object.keys(before).sort((a, b) => depth(b) - depth(a) || a.localeCompare(b))) {
    if (before[source]!.kind !== 'directory') continue;
    const removable = isLegacySource(source) || source === library || OLD_TYPES.some((type) => source === `.make-docs/${type}`);
    if (removable && !Object.keys(after).some((p) => p.startsWith(`${source}/`) && after[p]!.kind !== 'missing')) {
      after[source] = MISSING; reasons.set(source, 'Remove the exact reviewed empty legacy directory');
      const entry = entries.find((value) => value.path === source)!; entry.disposition = 'remove-empty';
    }
  }
  for (const destination of moves.values()) for (const parent of ancestorDirs(destination)) {
    if (!before[parent]) before[parent] = readState(root, parent);
    const current = after[parent] ?? before[parent]!;
    if (current.kind !== 'directory' && current.kind !== 'missing') blockers.push(`Destination parent is not a directory: ${parent}.`);
    if (current.kind === 'missing') { after[parent] = { kind: 'directory', mode: 0o755 }; reasons.set(parent, 'Create a parent for reviewed content'); }
  }
  // Every changed destination tree is in the final read-back inventory, including pre-existing children.
  for (const mapping of mappings) {
    const scope = mapping.destination.startsWith('docs/assets/') ? mapping.destination.split('/').slice(0, 3).join('/')
      : mapping.destination.startsWith('.make-docs/system/') ? mapping.destination.split('/').slice(0, 3).join('/') : '.make-docs/archive';
    scopes.push(scope);
    const extra: Record<string, LayoutFileState> = {}; snapshot(root, scope, extra);
    for (const [name, state] of Object.entries(extra)) { if (!before[name]) before[name] = state; if (!after[name]) after[name] = state; }
  }
  const linkFiles: string[] = [];
  markdownFiles(root, 'docs', linkFiles);
  markdownFiles(root, '.make-docs/system', linkFiles);
  markdownFiles(root, '.make-docs/archive', linkFiles);
  for (const document of ROOT_LINK_DOCUMENTS) markdownFiles(root, document, linkFiles);
  for (const source of moves.keys()) if (source.endsWith('.md')) linkFiles.push(source);
  const exclusions: LayoutPlan['exclusions'] = [{ path: '.make-docs/backup', reason: 'R3 retained rollback payloads; non-active Store-linked backup history, never a source for active layout discovery' }, { path: '.git', reason: 'Version history, not an active project document tree' }];
  const metadataEdits: LayoutPlan['metadataEdits'] = [];
  const linkEdits: LayoutLinkEdit[] = [];
  const linkSources: string[] = [];
  for (const source of unique(linkFiles)) {
    const state = before[source] ?? readState(root, source);
    if (state.kind !== 'file') continue;
    const destination = moves.get(source) ?? source;
    let text = Buffer.from(state.contentBase64!, 'base64').toString('utf8');
    const repaired = repairLinks(text, source, destination, mappings, root, after, linkEdits, blockers, exclusions, metadataEdits);
    // Bind all visible Markdown to review, including files with no rewritten links.
    const { contentBase64: _body, ...fingerprint } = state;
    before[source] ??= fingerprint;
    after[source] ??= fingerprint;
    if (repaired !== text) {
      before[source] = state;
      const bytes = Buffer.from(repaired);
      after[destination] = { ...state, digest: hash(bytes), contentBase64: bytes.toString('base64') };
      reasons.set(destination, `Repair reviewed links from ${source}`);
      linkSources.push(source);
    }
  }
  for (const [source, destination] of moves) {
    const state = after[destination]!;
    if (state.kind === 'symlink') {
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(source), state.target!));
      if (path.posix.isAbsolute(state.target!) || !isLayoutRelativePath(resolved)) blockers.push(`Symlink escapes project scope: ${source}.`);
      else {
        const target = mappedPath(resolved, mappings);
        const targetState = after[target] ?? readState(root, target);
        if (targetState.kind === 'missing') blockers.push(`Symlink target is absent after migration: ${source} -> ${target}.`);
        after[destination] = { ...state, target: path.posix.relative(path.posix.dirname(destination), target) || '.' };
      }
    }
  }
  for (const edit of linkEdits) {
    if (!before[edit.target]) before[edit.target] = readState(root, edit.target);
    if (!after[edit.target]) after[edit.target] = before[edit.target]!;
  }
  for (const [name, state] of Object.entries(before)) after[name] ??= state;
  const changes = unique([...Object.keys(before), ...Object.keys(after)]).filter((name) => !same(before[name] ?? MISSING, after[name] ?? MISSING)).map((name) => ({ path: name, before: before[name] ?? MISSING, after: after[name] ?? MISSING, reason: reasons.get(name) ?? 'Apply the reviewed layout' }));
  changes.sort((a, b) => {
    const rank = (change: LayoutChange): number => change.after.kind === 'directory' ? 0 : change.after.kind !== 'missing' ? 1 : change.before.kind !== 'directory' ? 2 : 3;
    return rank(a) - rank(b) || (rank(a) >= 2 ? depth(b.path) - depth(a.path) : depth(a.path) - depth(b.path)) || a.path.localeCompare(b.path);
  });
  const plan: LayoutPlan = { schemaVersion: 1, projectRoot: root, digest: '', configDigest, mappings: unique(requestedMappings), scopeRoots: unique(scopes), entries, changes, blockers: unique(blockers), linkEdits, expectedBefore: before, expectedAfter: after, linkSources: unique(linkFiles), metadataEdits, exclusions };
  plan.digest = layoutPlanDigest(plan);
  return plan;
}
function repairLinks(text: string, source: string, destination: string, mappings: Mapping[], root: string, after: Record<string, LayoutFileState>, edits: LayoutLinkEdit[], blockers: string[], exclusions: LayoutPlan['exclusions'], metadataEdits: LayoutPlan['metadataEdits']): string {
  const replace = (raw: string): string => {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(raw)) return raw;
    const suffixAt = raw.search(/[?#]/), rawPath = suffixAt < 0 ? raw : raw.slice(0, suffixAt), suffix = suffixAt < 0 ? '' : raw.slice(suffixAt);
    let decoded: string;
    try { decoded = decodeURIComponent(rawPath); } catch { return raw; }
    if (!decoded || path.posix.isAbsolute(decoded)) return raw;
    const oldTarget = path.posix.normalize(path.posix.join(path.posix.dirname(source), decoded));
    if (!isLayoutRelativePath(oldTarget)) return raw;
    let target = mappedPath(oldTarget, mappings);
    // These aliases name formerly shipped paths, not arbitrary project source files.
    const systemAlias = /^\.make-docs\/(contracts|prompts|references|templates|scripts)\/system\/(.+)$/.exec(oldTarget);
    const routerAlias = /^docs\/assets\/(?:artifacts|library)\/(AGENTS|CLAUDE|GEMINI)\.md$/.exec(oldTarget);
    const systemTarget = systemAlias ? `.make-docs/system/${systemAlias[1]}/${systemAlias[2]}` : undefined;
    const alias = systemTarget ? getRetiredResourceReplacement(systemTarget) ?? systemTarget
      : routerAlias ? `docs/assets/${routerAlias[1]}.md`
      : oldTarget === 'docs/assets/references/execution-workflow.md' ? '.make-docs/system/references/execution-workflow.md'
      : getRetiredResourceReplacement(oldTarget);
    const explicitlyMapped = mappings.some((mapping) => mapping.explicit && inside(oldTarget, mapping.source));
    if (alias && !explicitlyMapped && readState(root, oldTarget).kind === 'missing' && (after[alias] ?? readState(root, alias)).kind !== 'missing') target = alias;
    if (target === oldTarget && source === destination) return raw;
    const targetState = after[target] ?? readState(root, target);
    if (targetState.kind === 'missing') {
      const historical = inside(source, 'docs/assets/archive') || inside(source, '.make-docs/archive') || inside(source, 'docs/assets/playbooks')
        || (inside(destination, '.make-docs/archive') && mappings.some((mapping) => mapping.explicit && inside(source, mapping.source) && inside(mapping.destination, '.make-docs/archive')));
      if (historical && readState(root, oldTarget).kind === 'missing') {
        exclusions.push({ path: source, reason: `Pre-existing absent historical link target ${oldTarget}; original link ${raw}; no live routing authority` });
        return raw;
      }
      blockers.push(`Moved link target is absent: ${source}: ${raw} -> ${target}.`); return raw;
    }
    let replacement = path.posix.relative(path.posix.dirname(destination), target) || '.';
    if (rawPath.includes('%')) replacement = replacement.split('/').map(encodeURIComponent).join('/');
    replacement += suffix;
    if (replacement !== raw || target !== oldTarget) edits.push({ source, destination, before: raw, after: replacement, target });
    return replacement;
  };
  const inline = (value: string): string => value.replace(/(!?\[[^\]\n]*\]\()(?:<([^>\n]+)>|([^\s)]+))([^\n)]*\))/g, (_all, lead: string, angle: string | undefined, bare: string | undefined, tail: string) => `${lead}${angle === undefined ? replace(bare!) : `<${replace(angle)}>`}${tail}`)
    .replace(/^(\s*\[[^\]\n]+\]:\s*)(?:<([^>\n]+)>|(\S+))(.*)$/gm, (_all, lead: string, angle: string | undefined, bare: string | undefined, tail: string) => `${lead}${angle === undefined ? replace(bare!) : `<${replace(angle)}>`}${tail}`);
  const frontmatter = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(text);
  let header = '', body = text;
  if (frontmatter) {
    const yaml = frontmatter[2]!;
    const document = parseDocument(yaml);
    const patches: Array<{ start: number; end: number; value: string }> = [];
    const oldAudience = /^docs\/assets\/library\/([^/]+)\//.exec(source)?.[1];
    const newAudience = /^docs\/assets\/([^/]+)\//.exec(destination)?.[1];
    const persona = document.get('persona', true);
    if (oldAudience && newAudience && newAudience !== oldAudience && isScalar(persona)) {
      if (persona.value !== oldAudience) blockers.push(`Persona metadata conflicts with reviewed audience: ${source}.`);
      else if (persona.range) {
        patches.push({ start: persona.range[0], end: persona.range[1], value: JSON.stringify(newAudience) });
        metadataEdits.push({ path: destination, field: 'persona', before: oldAudience, after: newAudience });
      }
    }
    visit(document, { Scalar(_key, node) {
      if (typeof node.value !== 'string' || !node.range || node === persona) return;
      const value = /^(?:\.\.?\/)/.test(node.value) ? replace(node.value) : inline(node.value);
      if (value !== node.value) patches.push({ start: node.range[0], end: node.range[1], value: JSON.stringify(value) });
    } });
    let updated = yaml;
    for (const patch of patches.sort((a, b) => b.start - a.start)) updated = updated.slice(0, patch.start) + patch.value + updated.slice(patch.end);
    header = frontmatter[1]! + updated + frontmatter[3]!;
    body = text.slice(frontmatter[0].length);
  }
  // Code and comments are historical/example bytes, not live links.
  const protectedRanges: Array<[number, number]> = [];
  const protectedPattern = /(^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\2[^\n]*(?:\n|$))|(`+)[^`]*?\3|<!--[\s\S]*?-->/gm;
  for (const match of body.matchAll(protectedPattern)) protectedRanges.push([match.index!, match.index! + match[0].length]);
  let result = '', offset = 0;
  for (const [start, end] of protectedRanges) { result += inline(body.slice(offset, start)) + body.slice(start, end); offset = end; }
  return header + result + inline(body.slice(offset));
}
/** Verify saved expectations; destination names never establish source provenance. */
export function verifyProjectLayout(projectRoot: string, plan: LayoutPlan, phase: 'before' | 'after' | 'progress' = 'after', temporaryFiles: Record<string, LayoutFileState> = {}): LayoutVerification {
  const blockers: string[] = [];
  const root = realpathSync(projectRoot);
  if (root !== plan.projectRoot) blockers.push('Prepared layout belongs to a different checkout.');
  if (plan.schemaVersion !== 1 || layoutPlanDigest(plan) !== plan.digest) blockers.push('Prepared layout digest does not match its contents.');
  const expected = phase === 'before' ? plan.expectedBefore : plan.expectedAfter;
  const actual: Record<string, LayoutFileState> = {};
  try {
    for (const scope of plan.scopeRoots) snapshot(root, scope, actual);
    const currentLinks: string[] = [];
    for (const scope of ['docs', '.make-docs/system', '.make-docs/archive', ...ROOT_LINK_DOCUMENTS]) markdownFiles(root, scope, currentLinks);
    for (const relative of unique(currentLinks)) actual[relative] ??= readState(root, relative);
    // Only the Store service supplies these exact inode/payload-proven current states.
    // Check all same-parent stage names, so an unrecorded lookalike cannot hide outside docs.
    for (const parent of unique(plan.changes.map((change) => path.posix.dirname(change.path)))) {
      if (parent !== '.' && readState(root, parent).kind !== 'directory') continue;
      for (const name of readdirSync(path.join(root, parent))) if (/^\.make-docs-.*\.tmp$/.test(name)) {
        const relative = parent === '.' ? name : `${parent}/${name}`;
        actual[relative] = readState(root, relative);
      }
    }
    const allowedTemps = new Set<string>();
    for (const [relative, state] of Object.entries(temporaryFiles)) {
      const validName = /^\.make-docs-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[1-9][0-9]*\.tmp$/.test(path.posix.basename(relative));
      const knownParent = plan.changes.some((change) => path.posix.dirname(change.path) === path.posix.dirname(relative));
      if (phase !== 'progress' || !isLayoutRelativePath(relative) || !validName || !knownParent
        || relative in plan.expectedBefore || relative in plan.expectedAfter || state.kind !== 'file'
        || !state.digest || !Number.isInteger(state.mode)) {
        blockers.push(`Invalid temporary-file proof: ${relative}.`); continue;
      }
      actual[relative] ??= readState(root, relative);
      if (!same(state, actual[relative]!)) blockers.push(`Owned temporary file changed: ${relative}.`);
      else allowedTemps.add(relative);
    }
    for (const relative of Object.keys(expected)) actual[relative] ??= readState(root, relative);
    for (const relative of unique([...Object.keys(expected), ...Object.keys(actual)])) {
      if (allowedTemps.has(relative)) continue;
      const matches = phase === 'progress'
        ? same(plan.expectedBefore[relative] ?? MISSING, actual[relative] ?? MISSING) || same(plan.expectedAfter[relative] ?? MISSING, actual[relative] ?? MISSING)
        : same(expected[relative] ?? MISSING, actual[relative] ?? MISSING);
      if (!matches) blockers.push(`Layout ${phase} state differs: ${relative}.`);
    }
    if (phase === 'after') for (const edit of plan.linkEdits) {
      if (readState(root, edit.target).kind === 'missing') blockers.push(`Verified link target is missing: ${edit.destination} -> ${edit.target}.`);
    }
  } catch (error) { blockers.push(error instanceof Error ? error.message : String(error)); }
  return { blockers: unique(blockers), evidence: { phase, pathsChecked: Object.keys(actual).length, linksChecked: phase === 'after' ? plan.linkEdits.length : 0, digest: plan.digest } };
}
