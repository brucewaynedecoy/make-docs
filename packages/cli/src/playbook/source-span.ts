/**
 * Source-position primitives for the Playbook library.
 *
 * Every parsed element in the Playbook model carries a source span so
 * diagnostics — and a future language server — can point precisely at the
 * offending text (R-MODEL-2). Positions are 1-based for line and column and
 * carry the absolute character offset into the original source text.
 */

export interface SourcePosition {
  /** Zero-based character offset into the full source text. */
  offset: number;
  /** One-based line number. */
  line: number;
  /** One-based column number. */
  column: number;
}

export interface SourceSpan {
  start: SourcePosition;
  end: SourcePosition;
}

/** A parsed value paired with the span of the source text it came from. */
export interface Spanned<T> {
  value: T;
  /** Null when the value was defaulted rather than read from source text. */
  span: SourceSpan | null;
}

/**
 * An enumeration-typed value that preserves the raw source token. `value` is
 * null when the raw token falls outside the fixed set; the raw token stays
 * available so the workflow-layer validator (Phase 3) can diagnose it.
 */
export interface SpannedEnum<T extends string> {
  value: T | null;
  raw: string | null;
  span: SourceSpan | null;
}

/** Maps absolute character offsets to line/column positions. */
export class LineIndex {
  private readonly lineStarts: number[];
  private readonly length: number;

  constructor(source: string) {
    this.length = source.length;
    this.lineStarts = [0];
    for (let offset = 0; offset < source.length; offset += 1) {
      if (source.charCodeAt(offset) === 10) {
        this.lineStarts.push(offset + 1);
      }
    }
  }

  positionAt(offset: number): SourcePosition {
    const clamped = Math.max(0, Math.min(offset, this.length));
    let low = 0;
    let high = this.lineStarts.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (this.lineStarts[middle]! <= clamped) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }
    return {
      offset: clamped,
      line: low + 1,
      column: clamped - this.lineStarts[low]! + 1,
    };
  }

  spanBetween(startOffset: number, endOffset: number): SourceSpan {
    return {
      start: this.positionAt(startOffset),
      end: this.positionAt(Math.max(startOffset, endOffset)),
    };
  }
}

export function spanned<T>(value: T, span: SourceSpan | null): Spanned<T> {
  return { value, span };
}

export function spannedEnum<T extends string>(
  raw: string | null,
  allowed: readonly T[],
  span: SourceSpan | null,
  defaultValue: T | null = null,
): SpannedEnum<T> {
  if (raw === null) {
    return { value: defaultValue, raw: null, span: null };
  }
  return {
    value: allowed.includes(raw as T) ? (raw as T) : null,
    raw,
    span,
  };
}
