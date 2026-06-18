export const MANAGED_BLOCK_BEGIN = "<!-- make-docs:begin -->";
export const MANAGED_BLOCK_END = "<!-- make-docs:end -->";

export type ManagedBlockMarkers = {
  begin: string;
  end: string;
};

export type ManagedBlockState = "absent" | "valid" | "malformed";

export type ManagedBlockAction = "inserted" | "updated" | "reasserted" | "noop";

export type ManagedBlockInsertPosition = "append" | "prepend";

export type ParsedManagedBlock = {
  state: ManagedBlockState;
  body: string | null;
  prefix: string;
  suffix: string;
};

export type UpsertManagedBlockOptions = {
  markers?: ManagedBlockMarkers;
  insertPosition?: ManagedBlockInsertPosition;
};

export type UpsertManagedBlockResult = {
  content: string;
  action: ManagedBlockAction;
  changed: boolean;
  previousState: ManagedBlockState;
  previousBody: string | null;
};

type MarkerSpan = {
  end: number;
  start: number;
};

const DEFAULT_MARKERS: ManagedBlockMarkers = {
  begin: MANAGED_BLOCK_BEGIN,
  end: MANAGED_BLOCK_END,
};

export function renderManagedBlock(
  body: string,
  markers: ManagedBlockMarkers = DEFAULT_MARKERS,
): string {
  return `${markers.begin}\n${normalizeManagedBlockBody(body)}${markers.end}`;
}

export function parseManagedBlock(
  content: string,
  markers: ManagedBlockMarkers = DEFAULT_MARKERS,
): ParsedManagedBlock {
  const beginSpans = findMarkerSpans(content, markers.begin);
  const endSpans = findMarkerSpans(content, markers.end);

  if (beginSpans.length === 0 && endSpans.length === 0) {
    return {
      body: null,
      prefix: content,
      state: "absent",
      suffix: "",
    };
  }

  const hasSingleValidPair =
    beginSpans.length === 1 &&
    endSpans.length === 1 &&
    beginSpans[0].start < endSpans[0].start;

  if (hasSingleValidPair) {
    const beginSpan = beginSpans[0];
    const endSpan = endSpans[0];

    return {
      body: stripOpeningLineBreak(content.slice(beginSpan.end, endSpan.start)),
      prefix: content.slice(0, beginSpan.start),
      state: "valid",
      suffix: content.slice(endSpan.end),
    };
  }

  const markerSpans = [...beginSpans, ...endSpans].sort(
    (left, right) => left.start - right.start || left.end - right.end,
  );
  const firstMarker = markerSpans[0];
  const lastMarker = markerSpans[markerSpans.length - 1];
  const suffixStart =
    beginSpans.length > 0 && endSpans.length === 0 ? content.length : lastMarker.end;

  return {
    body: null,
    prefix: content.slice(0, firstMarker.start),
    state: "malformed",
    suffix: content.slice(suffixStart),
  };
}

export function upsertManagedBlock(
  content: string,
  body: string,
  options: UpsertManagedBlockOptions = {},
): UpsertManagedBlockResult {
  const markers = options.markers ?? DEFAULT_MARKERS;
  const insertPosition = options.insertPosition ?? "append";
  const parsed = parseManagedBlock(content, markers);
  const nextBlock = renderManagedBlock(body, markers);

  if (parsed.state === "absent") {
    const nextContent = insertManagedBlock(content, nextBlock, insertPosition);

    return {
      action: "inserted",
      changed: true,
      content: nextContent,
      previousBody: null,
      previousState: parsed.state,
    };
  }

  const nextContent = `${parsed.prefix}${nextBlock}${parsed.suffix}`;

  if (nextContent === content) {
    return {
      action: "noop",
      changed: false,
      content,
      previousBody: parsed.body,
      previousState: parsed.state,
    };
  }

  return {
    action: parsed.state === "malformed" ? "reasserted" : "updated",
    changed: true,
    content: nextContent,
    previousBody: parsed.body,
    previousState: parsed.state,
  };
}

function findMarkerSpans(content: string, marker: string): MarkerSpan[] {
  if (marker.length === 0) {
    throw new Error("Managed block markers must not be empty.");
  }

  const spans: MarkerSpan[] = [];
  let searchStart = 0;

  while (searchStart <= content.length) {
    const start = content.indexOf(marker, searchStart);

    if (start === -1) {
      break;
    }

    const end = start + marker.length;
    spans.push({ end, start });
    searchStart = end;
  }

  return spans;
}

function insertManagedBlock(
  content: string,
  block: string,
  position: ManagedBlockInsertPosition,
): string {
  if (content.length === 0) {
    return `${block}\n`;
  }

  if (position === "prepend") {
    return `${block}\n${content}`;
  }

  return content.endsWith("\n") ? `${content}${block}\n` : `${content}\n${block}\n`;
}

function normalizeManagedBlockBody(body: string): string {
  if (body.length === 0 || body.endsWith("\n")) {
    return body;
  }

  return `${body}\n`;
}

function stripOpeningLineBreak(body: string): string {
  if (body.startsWith("\r\n")) {
    return body.slice(2);
  }

  if (body.startsWith("\n")) {
    return body.slice(1);
  }

  return body;
}
