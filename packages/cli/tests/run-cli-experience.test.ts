import { afterEach, describe, expect, test, vi } from "vitest";
import { resolveRunRenderMode } from "../src/run/render";
import { installSqliteExperimentalWarningFilter, isSqliteExperimentalWarning } from "../src/run/warnings";

describe("W18 R12 P3 CLI experience remediation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("render layer invariance (R-RENDER-1, R-INV-1, R-TEST-4)", () => {
    test("mode selection: --json always JSON, non-TTY defaults JSON, TTY defaults text", () => {
      expect(resolveRunRenderMode({ jsonFlag: true, isTty: true })).toBe("json");
      expect(resolveRunRenderMode({ jsonFlag: true, isTty: false })).toBe("json");
      expect(resolveRunRenderMode({ jsonFlag: false, isTty: false })).toBe("json");
      expect(resolveRunRenderMode({ jsonFlag: false, isTty: true })).toBe("text");
    });
  });

  describe("targeted SQLite warning suppression (R-NOISE-1)", () => {
    test("matches only the SQLite ExperimentalWarning", () => {
      expect(
        isSqliteExperimentalWarning(
          "SQLite is an experimental feature and might change at any time",
          ["ExperimentalWarning"],
        ),
      ).toBe(true);
      const error = new Error("SQLite is an experimental feature and might change at any time");
      error.name = "ExperimentalWarning";
      expect(isSqliteExperimentalWarning(error)).toBe(true);
      expect(
        isSqliteExperimentalWarning(
          "SQLite is an experimental feature and might change at any time",
          [{ type: "ExperimentalWarning" }],
        ),
      ).toBe(true);

      // Other experimental warnings and other warning types still surface.
      expect(
        isSqliteExperimentalWarning("VM Modules is an experimental feature", [
          "ExperimentalWarning",
        ]),
      ).toBe(false);
      expect(
        isSqliteExperimentalWarning(
          "SQLite is an experimental feature and might change at any time",
          ["DeprecationWarning"],
        ),
      ).toBe(false);
    });

    test("the installed filter swallows the SQLite warning and passes every other warning through", async () => {
      const uninstall = installSqliteExperimentalWarningFilter();
      const received: string[] = [];
      const listener = (warning: Error) => {
        received.push(`${warning.name}: ${warning.message}`);
      };
      process.on("warning", listener);
      try {
        process.emitWarning(
          "SQLite is an experimental feature and might change at any time",
          "ExperimentalWarning",
        );
        process.emitWarning("something else is deprecated", "DeprecationWarning");
        await new Promise((resolve) => setImmediate(resolve));
        expect(received).toEqual(["DeprecationWarning: something else is deprecated"]);
      } finally {
        process.removeListener("warning", listener);
        uninstall();
      }
    });
  });
});
