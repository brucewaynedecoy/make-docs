import path from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, test } from "vitest";

import {
  BACKLOG_SNAPSHOT_SCHEMA_VERSION,
  BACKLOG_SNAPSHOT_V1_UPGRADE_MESSAGE,
  BacklogSnapshotV1Schema,
} from "../src/operations/work/backlog/schemas";
import { validateBacklogRebuiltModel } from "../src/operations/work/backlog/agent-contracts";
import { mixedPortfolioFixture } from "./fixtures/backlog-contract";

// W28 R0 P7: the snapshot schema is version 2, and a version 1 snapshot from an older CLI is refused clearly.
const current = structuredClone(mixedPortfolioFixture.snapshot);
const fromOlderCli = { ...structuredClone(current), schemaVersion: 1 };

function messages(result: { success: boolean; error?: { issues: Array<{ message: string }> } }): string[] {
  return result.success ? [] : result.error!.issues.map((issue) => issue.message);
}

describe("backlog snapshot schema version", () => {
  test("is version 2 and accepts a current snapshot", () => {
    expect(BACKLOG_SNAPSHOT_SCHEMA_VERSION).toBe(2);
    expect(current.schemaVersion).toBe(2);
    expect(BacklogSnapshotV1Schema.safeParse(current).success).toBe(true);
  });

  test("refuses a version 1 snapshot with an upgrade-the-CLI message", () => {
    const result = BacklogSnapshotV1Schema.safeParse(fromOlderCli);
    expect(result.success).toBe(false);
    expect(messages(result)).toContain(BACKLOG_SNAPSHOT_V1_UPGRADE_MESSAGE);
    expect(BACKLOG_SNAPSHOT_V1_UPGRADE_MESSAGE).toMatch(/Upgrade the make-docs CLI to 2\.0\.9 or later/);
  });

  test("names an unknown future version instead of the upgrade message", () => {
    const messagesFor = messages(BacklogSnapshotV1Schema.safeParse({ ...current, schemaVersion: 3 }));
    expect(messagesFor.join("\n")).toContain("Unsupported backlog snapshot schemaVersion 3");
    expect(messagesFor).not.toContain(BACKLOG_SNAPSHOT_V1_UPGRADE_MESSAGE);
  });

  test("the CLI agent gate refuses a version 1 latest snapshot with the same message", () => {
    expect(() => validateBacklogRebuiltModel(mixedPortfolioFixture.report, fromOlderCli)).toThrow(BACKLOG_SNAPSHOT_V1_UPGRADE_MESSAGE);
  });

  test("the dependency-free Skill bundle refuses a version 1 snapshot with the same message", async () => {
    const bundle = await import(
      pathToFileURL(path.resolve(__dirname, "../../skills/backlog-review/scripts/agent-contract.mjs")).href
    );
    expect(() => bundle.validateBacklogRebuiltModel(mixedPortfolioFixture.report, fromOlderCli)).toThrow(BACKLOG_SNAPSHOT_V1_UPGRADE_MESSAGE);
    expect(bundle.validateBacklogRebuiltModel(mixedPortfolioFixture.report, current)).toBeTruthy();
  });
});
