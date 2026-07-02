/**
 * Line and fenced-block scanning primitives shared by the parser stages.
 *
 * Fence awareness matters twice: heading detection must ignore `#` lines
 * inside fenced code, and the workflow stage must find the single fenced
 * block whose info string is exactly `playbook` (R-WF-1).
 */

export interface ScannedLine {
  text: string;
  /** Offset of the first character of the line, relative to the scanned text. */
  start: number;
  /** Offset just past the last character of the line, excluding the newline. */
  end: number;
}

export function scanLines(text: string): ScannedLine[] {
  const lines: ScannedLine[] = [];
  let start = 0;
  while (start <= text.length) {
    let end = text.indexOf("\n", start);
    if (end === -1) {
      end = text.length;
    }
    lines.push({ text: text.slice(start, end), start, end });
    if (end === text.length) {
      break;
    }
    start = end + 1;
  }
  return lines;
}

export interface FencedBlock {
  /** First whitespace-delimited token of the info string, or "" when absent. */
  info: string;
  /** Offset of the opening fence line start. */
  openStart: number;
  /** Offset just past the opening fence line (excluding its newline). */
  openEnd: number;
  /** Offset of the first character of the block content. */
  contentStart: number;
  /** Offset just past the block content (start of the closing fence line). */
  contentEnd: number;
  closed: boolean;
}

interface OpenFence {
  marker: string;
  length: number;
  block: FencedBlock;
}

const FENCE_OPEN_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/;

/**
 * Scans commonmark-style fenced code blocks. Returns every block with the
 * offsets of its content region so YAML node ranges can be mapped back to
 * absolute source positions.
 */
export function scanFencedBlocks(lines: ScannedLine[]): FencedBlock[] {
  const blocks: FencedBlock[] = [];
  let open: OpenFence | null = null;

  for (const line of lines) {
    const match = FENCE_OPEN_RE.exec(line.text);
    if (open) {
      if (
        match &&
        match[1]!.startsWith(open.marker[0]!) &&
        match[1]!.length >= open.length &&
        match[2]!.trim() === ""
      ) {
        open.block.contentEnd = line.start;
        open.block.closed = true;
        open = null;
      }
      continue;
    }
    if (match) {
      const marker = match[1]!;
      const rawInfo = match[2]!.trim();
      if (marker.startsWith("`") && rawInfo.includes("`")) {
        continue;
      }
      const block: FencedBlock = {
        info: rawInfo.split(/\s+/)[0] ?? "",
        openStart: line.start,
        openEnd: line.end,
        contentStart: line.end + 1,
        contentEnd: line.end + 1,
        closed: false,
      };
      blocks.push(block);
      open = { marker, length: marker.length, block };
    }
  }

  if (open) {
    const last = lines.at(-1);
    open.block.contentEnd = last ? last.end : open.block.contentStart;
  }

  return blocks;
}

export function isInsideFence(offset: number, blocks: FencedBlock[]): boolean {
  return blocks.some((block) => offset >= block.openStart && offset < block.contentEnd);
}
