/**
 * Helpers over the `yaml` AST that keep node ranges so every parsed value can
 * carry a source span (R-MODEL-2).
 */

import { isMap, isScalar, isSeq } from "yaml";
import type { Node, Pair, YAMLMap, YAMLSeq } from "yaml";
import { LineIndex, type SourceSpan, type Spanned } from "../source-span";

export interface YamlEntry {
  key: string;
  keySpan: SourceSpan | null;
  node: Node | null;
  span: SourceSpan | null;
  value: unknown;
}

export function nodeSpan(
  node: Node | null | undefined,
  baseOffset: number,
  index: LineIndex,
): SourceSpan | null {
  if (!node || !node.range) {
    return null;
  }
  const [start, valueEnd] = node.range;
  return index.spanBetween(baseOffset + start, baseOffset + valueEnd);
}

export function nodeToPlain(node: Node | null | undefined): unknown {
  if (node === null || node === undefined) {
    return null;
  }
  return node.toJSON();
}

export function mapEntries(
  node: Node | null | undefined,
  baseOffset: number,
  index: LineIndex,
): YamlEntry[] {
  if (!isMap(node)) {
    return [];
  }
  const entries: YamlEntry[] = [];
  for (const pair of (node as YAMLMap).items as Pair[]) {
    const keyNode = pair.key as Node | null;
    if (!isScalar(keyNode)) {
      continue;
    }
    const valueNode = (pair.value ?? null) as Node | null;
    entries.push({
      key: String(keyNode.value),
      keySpan: nodeSpan(keyNode, baseOffset, index),
      node: valueNode,
      span: nodeSpan(valueNode, baseOffset, index) ?? nodeSpan(keyNode, baseOffset, index),
      value: nodeToPlain(valueNode),
    });
  }
  return entries;
}

export function seqItems(
  node: Node | null | undefined,
  baseOffset: number,
  index: LineIndex,
): Array<{ node: Node | null; span: SourceSpan | null; value: unknown }> {
  if (!isSeq(node)) {
    return [];
  }
  return ((node as YAMLSeq).items as Array<Node | null>).map((item) => ({
    node: item,
    span: nodeSpan(item, baseOffset, index),
    value: nodeToPlain(item),
  }));
}

export function scalarString(
  node: Node | null | undefined,
  baseOffset: number,
  index: LineIndex,
): Spanned<string> | null {
  if (!isScalar(node)) {
    return null;
  }
  const value = node.value;
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    return null;
  }
  return { value: String(value), span: nodeSpan(node, baseOffset, index) };
}

export function scalarBoolean(
  node: Node | null | undefined,
  baseOffset: number,
  index: LineIndex,
): Spanned<boolean> | null {
  if (!isScalar(node) || typeof node.value !== "boolean") {
    return null;
  }
  return { value: node.value, span: nodeSpan(node, baseOffset, index) };
}

/** Accepts a scalar or a sequence of scalars and returns the spanned strings. */
export function stringList(
  node: Node | null | undefined,
  baseOffset: number,
  index: LineIndex,
): Spanned<string>[] {
  const single = scalarString(node, baseOffset, index);
  if (single) {
    return [single];
  }
  return seqItems(node, baseOffset, index)
    .map((item) => scalarString(item.node, baseOffset, index))
    .filter((item): item is Spanned<string> => item !== null);
}
