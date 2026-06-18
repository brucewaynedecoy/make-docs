import { describe, expect, test } from "vitest";

import {
  MANAGED_BLOCK_BEGIN,
  MANAGED_BLOCK_END,
  parseManagedBlock,
  renderManagedBlock,
  upsertManagedBlock,
} from "../src/managed-block";

const BLOCK_BODY = "Use the make-docs routers.\n";

describe("managed block primitive", () => {
  test("inserts a block into an empty file", () => {
    const result = upsertManagedBlock("", BLOCK_BODY);

    expect(result).toEqual({
      action: "inserted",
      changed: true,
      content: `${MANAGED_BLOCK_BEGIN}\n${BLOCK_BODY}${MANAGED_BLOCK_END}\n`,
      previousBody: null,
      previousState: "absent",
    });
  });

  test("appends a missing block without rewriting existing content", () => {
    const content = "project instructions";
    const result = upsertManagedBlock(content, BLOCK_BODY);

    expect(result.content).toBe(
      `project instructions\n${MANAGED_BLOCK_BEGIN}\n${BLOCK_BODY}${MANAGED_BLOCK_END}\n`,
    );
    expect(result.action).toBe("inserted");
    expect(result.changed).toBe(true);
  });

  test("prepends a missing block when requested", () => {
    const content = "project instructions\n";
    const result = upsertManagedBlock(content, BLOCK_BODY, {
      insertPosition: "prepend",
    });

    expect(result.content).toBe(
      `${MANAGED_BLOCK_BEGIN}\n${BLOCK_BODY}${MANAGED_BLOCK_END}\nproject instructions\n`,
    );
  });

  test("no-ops when the body already matches", () => {
    const content = `prefix\n${renderManagedBlock(BLOCK_BODY)}\nsuffix`;
    const result = upsertManagedBlock(content, BLOCK_BODY);

    expect(result).toEqual({
      action: "noop",
      changed: false,
      content,
      previousBody: BLOCK_BODY,
      previousState: "valid",
    });
  });

  test("replaces an edited body while preserving surrounding content", () => {
    const content = `alpha\r\n${MANAGED_BLOCK_BEGIN}\nchanged locally\n${MANAGED_BLOCK_END}\nomega`;
    const result = upsertManagedBlock(content, BLOCK_BODY);

    expect(result.action).toBe("updated");
    expect(result.previousBody).toBe("changed locally\n");
    expect(result.content).toBe(
      `alpha\r\n${MANAGED_BLOCK_BEGIN}\n${BLOCK_BODY}${MANAGED_BLOCK_END}\nomega`,
    );
  });

  test("reasserts a clean block when markers are duplicated", () => {
    const content = `before\n${MANAGED_BLOCK_BEGIN}\none\n${MANAGED_BLOCK_END}\n${MANAGED_BLOCK_BEGIN}\ntwo\n${MANAGED_BLOCK_END}\nafter`;
    const result = upsertManagedBlock(content, BLOCK_BODY);

    expect(result.action).toBe("reasserted");
    expect(result.previousState).toBe("malformed");
    expect(result.content).toBe(
      `before\n${MANAGED_BLOCK_BEGIN}\n${BLOCK_BODY}${MANAGED_BLOCK_END}\nafter`,
    );
  });

  test("reasserts a clean block when the begin marker is unterminated", () => {
    const content = `before\n${MANAGED_BLOCK_BEGIN}\nstale managed body`;
    const result = upsertManagedBlock(content, BLOCK_BODY);

    expect(result.action).toBe("reasserted");
    expect(result.content).toBe(`before\n${MANAGED_BLOCK_BEGIN}\n${BLOCK_BODY}${MANAGED_BLOCK_END}`);
  });

  test("reasserts a clean block when only the end marker is present", () => {
    const content = `before\n${MANAGED_BLOCK_END}\nafter`;
    const result = upsertManagedBlock(content, BLOCK_BODY);

    expect(result.action).toBe("reasserted");
    expect(result.content).toBe(
      `before\n${MANAGED_BLOCK_BEGIN}\n${BLOCK_BODY}${MANAGED_BLOCK_END}\nafter`,
    );
  });

  test("parses a valid block without requiring a trailing file newline", () => {
    const content = `${MANAGED_BLOCK_BEGIN}\n${BLOCK_BODY}${MANAGED_BLOCK_END}`;
    const parsed = parseManagedBlock(content);
    const result = upsertManagedBlock(content, BLOCK_BODY);

    expect(parsed).toEqual({
      body: BLOCK_BODY,
      prefix: "",
      state: "valid",
      suffix: "",
    });
    expect(result.changed).toBe(false);
  });

  test("rejects empty custom markers", () => {
    expect(() =>
      upsertManagedBlock("", BLOCK_BODY, {
        markers: { begin: "", end: MANAGED_BLOCK_END },
      }),
    ).toThrow("Managed block markers must not be empty.");
  });
});
