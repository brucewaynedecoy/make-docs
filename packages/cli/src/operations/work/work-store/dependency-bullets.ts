/**
 * W29 R0 P3 dependency bullet reader (PRD 52 R-WORK-SYNC-13, the
 * `WORK_DEPENDENCY_PATTERNS` of the P1 rule catalog).
 *
 * One bullet becomes one of: dependencies on named units (with any names that
 * match no unit kept as unresolved coordinates), a gate, a reference, or
 * nothing ("None", "parallel with"). The reader is pure: it gets the owner's
 * coordinate and a lookup for existing coordinates, and it reads no file.
 */

export interface DependencyBulletResult {
  /** Canonical coordinates that exist, in the order the bullet names them. */
  dependencies: string[];
  /** Canonical coordinates that the bullet names, but no unit has. */
  unresolved: string[];
  /** The bullet names no coordinate, or names coordinates with a further condition. */
  gate: boolean;
  /** The bullet is only a file path, code span, or link. */
  reference: boolean;
  /** The bullet says there is no dependency. */
  none: boolean;
}

/** Status and joining words that do not change the match (R-WORK-SYNC-13). */
const FILLER_WORDS = new Set([
  "is", "are", "was", "were", "be", "been", "being", "has", "have", "had", "must", "and", "or", "to", "through",
  "thru", "with", "the", "all", "of", "its", "their", "both", "first", "complete", "completed", "accepted",
  "unlocked", "done", "closed", "finished", "merged", "landed", "phase", "phases", "stage", "stages", "task",
  "tasks", "wave", "waves", "revision", "revisions", "p", "s", "t", "w", "r",
]);

const NONE = /^(?:none|n\/a)\b/i;
const PARALLEL = /\bparallel with\b/i;
const CODE_SPAN = /`[^`]*`/g;
const LINK = /\[([^\]]*)\]\([^)]*\)/g;
const PATH_ONLY = /^(?:\.{0,2}\/)?[\w.-]+(?:\/[\w.-]+)+\/?$/;

interface Context {
  wave: string | null;
  revision: string | null;
  phase: string | null;
}

function contextOf(owner: string): Context {
  const parts = owner.split(" ");
  const wave = /^W[1-9]\d*$/.test(parts[0] ?? "") ? parts[0]! : null;
  const revision = wave && /^R(?:0|[1-9]\d*)$/.test(parts[1] ?? "") ? `${wave} ${parts[1]}` : null;
  const phase = revision && /^P[1-9]\d*$/.test(parts[2] ?? "") ? `${revision} ${parts[2]}` : null;
  return { wave, revision, phase };
}

type Kind = "phase" | "stage" | "task";

const KIND_WORD: Array<{ pattern: RegExp; kind: Kind }> = [
  { pattern: /^(?:Phases?|P)$/, kind: "phase" },
  { pattern: /^(?:Stages?|S)$/i, kind: "stage" },
  { pattern: /^[tT]$/, kind: "task" },
];

function kindOf(word: string): Kind | null {
  return KIND_WORD.find((entry) => entry.pattern.test(word))?.kind ?? null;
}

const RANGE_WORDS = /^(?:to|through|thru|-|–|—)$/i;
const LIST_WORDS = /^(?:,|and|&)$/i;

interface Token {
  text: string;
  start: number;
  end: number;
}

/** Split into words, numbers, and the punctuation that joins lists and ranges. */
function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /[A-Za-z]+[0-9]+|[A-Za-z]+|[0-9]+|[,&–—-]/g;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    tokens.push({ text: match[0], start: match.index, end: match.index + match[0].length });
  }
  return tokens;
}

/** A positive number, written with or without leading zeros, such as `2` or `02`. */
function isNumber(text: string): boolean {
  return /^\d+$/.test(text) && Number(text) > 0;
}

/** Split a joined token such as `P12` or `t3` into its letter part and number. */
function splitJoined(token: string): { letters: string; number: number } | null {
  const match = /^([A-Za-z]+)(\d+)$/.exec(token);
  return match ? { letters: match[1]!, number: Number(match[2]) } : null;
}

/** The words of a text that count for a title match: lower case, no numbers, no status or joining words. */
function titleWords(text: string): string[] {
  return text
    .split(/[^A-Za-z0-9]+/)
    .map((word) => word.toLowerCase())
    .filter((word) => word.length > 0 && !/^\d+$/.test(word) && !FILLER_WORDS.has(word));
}

/**
 * Read one dependency bullet. `owner` is the coordinate of the unit that owns
 * the `### Dependencies` section. `exists` says whether a canonical coordinate
 * names a unit.
 *
 * `titleOf` gives a unit's real title. A bullet that names one unit and adds
 * only that unit's own title, such as "Phase 1 trace and scope." for a phase
 * titled "Phase 1: Trace and Scope", is a dependency: the extra words name the
 * unit, they add no condition. Any other extra words make the bullet a gate.
 * Without `titleOf`, such a bullet is a gate.
 */
export function readDependencyBullet(
  bullet: string,
  owner: string,
  exists: (coordinate: string) => boolean,
  titleOf?: (coordinate: string) => string | null,
): DependencyBulletResult {
  const empty: DependencyBulletResult = { dependencies: [], unresolved: [], gate: false, reference: false, none: false };
  const text = bullet.trim();
  if (NONE.test(text) || PARALLEL.test(text)) return { ...empty, none: true };

  // Link text stays prose; link targets and code spans name no coordinate.
  const withoutCode = text.replace(CODE_SPAN, " ");
  const prose = withoutCode.replace(LINK, (_whole, label: string) => ` ${label} `);
  const named = namedCoordinates(prose, contextOf(owner));

  if (named.coordinates.length === 0) {
    const stripped = text.replace(CODE_SPAN, "").replace(LINK, "").replace(/[\s.,;:()]+/g, "");
    if (stripped === "" || PATH_ONLY.test(text.replace(/[.;]$/, ""))) return { ...empty, reference: true };
    return { ...empty, gate: true };
  }

  // Any word left after removing coordinates and status words is a further condition.
  const leftover = named.leftover
    .split(/[^A-Za-z0-9]+/)
    .filter((word) => word.length > 0 && !FILLER_WORDS.has(word.toLowerCase()));
  if (leftover.length > 0) {
    const named1 = named.coordinates.length === 1 ? named.coordinates[0]! : null;
    const title = named1 && titleOf ? titleOf(named1) : null;
    const want = title ? titleWords(title) : [];
    const have = titleWords(leftover.join(" "));
    const sameTitle = want.length > 0 && want.length === have.length && want.every((word, index) => word === have[index]);
    if (!sameTitle) return { ...empty, gate: true };
  }

  const seen = new Set<string>();
  const result: DependencyBulletResult = { ...empty };
  for (const coordinate of named.coordinates) {
    if (seen.has(coordinate) || coordinate === owner) continue;
    seen.add(coordinate);
    if (exists(coordinate)) result.dependencies.push(coordinate);
    else result.unresolved.push(coordinate);
  }
  return result;
}

/**
 * Find the coordinates that a text names, in order, and the text that is left
 * once they are removed. Full coordinates (`W29 R0 P3 T2`) stand alone. A bare
 * phase resolves in the owner's revision, and a bare stage or task in the
 * owner's phase or in the phase named just before it (`P2 Stage 3`).
 */
function namedCoordinates(text: string, context: Context): { coordinates: string[]; leftover: string } {
  const coordinates: string[] = [];
  const consumed: Array<[number, number]> = [];
  const tokens = tokenize(text);

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!;
    // A full coordinate: W<n> [R<n> [P<n> [S<n> | Stage <n> | T<n>]]].
    const wave = /^W([1-9]\d*)$/.exec(token.text);
    if (wave) {
      let coordinate = `W${wave[1]}`;
      let end = token.end;
      let cursor = index + 1;
      const revision = /^R(0|[1-9]\d*)$/.exec(tokens[cursor]?.text ?? "");
      if (revision) {
        coordinate += ` R${revision[1]}`;
        end = tokens[cursor]!.end;
        cursor += 1;
        const phase = /^P([1-9]\d*)$/.exec(tokens[cursor]?.text ?? "");
        if (phase) {
          coordinate += ` P${phase[1]}`;
          end = tokens[cursor]!.end;
          cursor += 1;
          const child = childOf(tokens, cursor);
          if (child) {
            coordinate += ` ${child.part}`;
            end = child.end;
            cursor = child.next;
          }
        }
      }
      coordinates.push(coordinate);
      consumed.push([token.start, end]);
      index = cursor - 1;
      continue;
    }

    const start = kindStart(tokens, index);
    if (!start) continue;
    // `P2 Stage 3` or `P2 T4`: one stage or task of a named phase in this revision.
    if (start.kind === "phase") {
      const child = childOf(tokens, start.next);
      if (child) {
        coordinates.push(context.revision ? `${context.revision} P${start.number} ${child.part}` : `P${start.number} ${child.part}`);
        consumed.push([token.start, child.end]);
        index = child.next - 1;
        continue;
      }
    }
    // Expand a list or a range: `P1 to P3 and P5`, `Stages 1-3`, `Phases 2 and 3`.
    const numbers: number[] = [start.number];
    let cursor = start.next;
    let end = start.end;
    for (;;) {
      const joiner = tokens[cursor];
      if (!joiner || !(RANGE_WORDS.test(joiner.text) || LIST_WORDS.test(joiner.text))) break;
      const next = numberAfter(tokens, cursor + 1, start.kind);
      if (!next) break;
      if (RANGE_WORDS.test(joiner.text)) {
        const from = numbers[numbers.length - 1]!;
        for (let value = from + 1; value <= next.number; value += 1) numbers.push(value);
      } else {
        numbers.push(next.number);
      }
      end = next.end;
      cursor = next.next;
    }
    for (const value of numbers) {
      if (start.kind === "phase") {
        coordinates.push(context.revision ? `${context.revision} P${value}` : `P${value}`);
      } else {
        const part = start.kind === "stage" ? `S${value}` : `T${value}`;
        coordinates.push(context.phase ? `${context.phase} ${part}` : part);
      }
    }
    consumed.push([token.start, end]);
    index = cursor - 1;
  }

  let leftover = "";
  let cursor = 0;
  for (const [from, to] of consumed) {
    leftover += `${text.slice(cursor, from)} `;
    cursor = to;
  }
  leftover += text.slice(cursor);
  return { coordinates, leftover };
}

/** A stage or task part right after a full phase: `S3`, `Stage 3`, or `T2`. */
function childOf(tokens: Token[], cursor: number): { part: string; end: number; next: number } | null {
  const joined = splitJoined(tokens[cursor]?.text ?? "");
  if (joined && joined.number > 0) {
    if (/^S$/i.test(joined.letters)) return { part: `S${joined.number}`, end: tokens[cursor]!.end, next: cursor + 1 };
    if (/^t$/i.test(joined.letters)) return { part: `T${joined.number}`, end: tokens[cursor]!.end, next: cursor + 1 };
  }
  if (/^Stage$/i.test(tokens[cursor]?.text ?? "") && isNumber(tokens[cursor + 1]?.text ?? "")) {
    return { part: `S${Number(tokens[cursor + 1]!.text)}`, end: tokens[cursor + 1]!.end, next: cursor + 2 };
  }
  return null;
}

/** The start of a bare phase, stage, or task name: `P2`, `Phase 2`, `Stages 1`, `t3`. */
function kindStart(tokens: Token[], index: number): { kind: Kind; number: number; end: number; next: number } | null {
  const token = tokens[index]!;
  const joined = splitJoined(token.text);
  if (joined && joined.number > 0) {
    const kind = /^(?:P|S|t|T)$/.test(joined.letters) ? kindOf(joined.letters) : null;
    if (kind) return { kind, number: joined.number, end: token.end, next: index + 1 };
    return null;
  }
  if (/^(?:Phases?|Stages?)$/i.test(token.text) && isNumber(tokens[index + 1]?.text ?? "")) {
    const kind = /^Phase/i.test(token.text) ? "phase" : "stage";
    return { kind, number: Number(tokens[index + 1]!.text), end: tokens[index + 1]!.end, next: index + 2 };
  }
  return null;
}

/** The number after a list or range word, written bare (`3`) or with its letter (`P3`). */
function numberAfter(tokens: Token[], cursor: number, kind: Kind): { number: number; end: number; next: number } | null {
  const token = tokens[cursor];
  if (!token) return null;
  if (isNumber(token.text)) return { number: Number(token.text), end: token.end, next: cursor + 1 };
  const joined = splitJoined(token.text);
  if (joined && joined.number > 0 && kindOf(joined.letters) === kind) return { number: joined.number, end: token.end, next: cursor + 1 };
  if (/^(?:Phases?|Stages?)$/i.test(token.text) && isNumber(tokens[cursor + 1]?.text ?? "")) {
    const named: Kind = /^Phase/i.test(token.text) ? "phase" : "stage";
    if (named === kind) return { number: Number(tokens[cursor + 1]!.text), end: tokens[cursor + 1]!.end, next: cursor + 2 };
  }
  return null;
}
