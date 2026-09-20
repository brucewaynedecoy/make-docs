import { isCancel, note, select } from "@clack/prompts";
import type { CompatibilityClassification } from "../compatibility";

/**
 * Pre-v2 detection and the R-MIG-2 warning-and-choice flow (W18 R11 P3).
 *
 * `update`, `setup`, and `setup reconfigure` detect a pre-v2 configuration by
 * fingerprint and, when found, warn about what the hard cutover can break,
 * then offer backing up and installing the latest version (recommended) or
 * cancelling. There are no aliases, so this flow is the only migration path
 * (R-MIG-1, R-MIG-2).
 */

/**
 * D9 implementer freedom — the documented pre-v2 fingerprint set.
 *
 * Detection is a pure function over the compatibility classifier's evidence
 * ({@link CompatibilityClassification}); there is no parallel filesystem
 * scan. An install is pre-v2 when any of these fingerprints is present:
 *
 * - `manifest-schema-version-1` — the project manifest at
 *   `.make-docs/manifest.json` parses and carries `schemaVersion: 1`
 *   (`evidence.manifestTrust.schemaVersion === 1`).
 * - `state-clean-v1` — the classifier resolved the install to the
 *   `clean-v1` source state (a pristine v1-era install).
 * - `state-modified-v1` — the classifier resolved the install to the
 *   `modified-v1` source state (a v1-era install with local edits).
 *
 * Deliberately *not* fingerprints: `missing-manifest-recognizable`,
 * `malformed-manifest`, `partial-install`, and `unknown-shape`. Those states
 * carry no trustworthy version evidence, and guessing "pre-v2" from them
 * would route non-make-docs or broken directories into an upgrade warning
 * they do not own; the classifier's own dispositions govern those cases.
 */
export interface PreV2Detection {
  preV2: boolean;
  fingerprints: string[];
}

export function detectPreV2Install(input: {
  targetDir: string;
  classification: CompatibilityClassification;
}): PreV2Detection {
  const { classification } = input;
  const fingerprints: string[] = [];

  if (classification.evidence.manifestTrust.schemaVersion === 1) {
    fingerprints.push("manifest-schema-version-1");
  }
  if (classification.state === "clean-v1") {
    fingerprints.push("state-clean-v1");
  }
  if (classification.state === "modified-v1") {
    fingerprints.push("state-modified-v1");
  }

  return { preV2: fingerprints.length > 0, fingerprints };
}

export type PreV2Choice = "backup-and-install" | "cancel";

/**
 * R-MIG-2 warning copy (D9 implementer freedom): itemizes the v2 changes
 * that can break a pre-v2 install on upgrade.
 */
export const PRE_V2_BREAKING_CHANGES: readonly string[] = [
  "Command spellings are replaced by the five-command tree (setup, run, mcp, update, uninstall); removed spellings have no aliases.",
  "Project uninstall is renamed: use `make-docs setup remove` (top-level `uninstall` now removes the tool's machine footprint).",
  "Run-state and work-execution evidence relocate to the global store at ~/.make-docs/, keyed by a minted project identifier.",
  "MCP tool names are renamed to registry-derived identifiers.",
  "The project manifest schema is upgraded and a project identifier is minted.",
];

export interface SelfCommandOutput {
  write(text: string): void;
}

export const defaultSelfCommandOutput: SelfCommandOutput = {
  write(text) {
    process.stdout.write(`${text}\n`);
  },
};

/**
 * Presents the R-MIG-2 warning and the backup-or-cancel choice for a
 * detected pre-v2 install. Non-interactive invocations refuse to proceed:
 * they print why and return "cancel" — a pre-v2 install is never silently
 * upgraded.
 */
export async function promptPreV2Choice(input: {
  detection: PreV2Detection;
  interactive: boolean;
  command: string;
  output?: SelfCommandOutput;
}): Promise<PreV2Choice> {
  if (!input.detection.preV2) {
    return "backup-and-install";
  }

  const output = input.output ?? defaultSelfCommandOutput;
  const warningLines = [
    `A pre-v2 make-docs install was detected (fingerprints: ${input.detection.fingerprints.join(", ")}).`,
    "Upgrading is a hard cutover; these changes can break the existing install:",
    ...PRE_V2_BREAKING_CHANGES.map((change) => `- ${change}`),
  ];

  if (!input.interactive) {
    for (const line of warningLines) {
      output.write(line);
    }
    output.write(
      `\`make-docs ${input.command}\` will not silently upgrade a pre-v2 install. ` +
        "Re-run in an interactive terminal to choose between backing up and installing the latest version (recommended) and cancelling, " +
        "or create an explicit backup first with `make-docs setup backup`.",
    );
    return "cancel";
  }

  note(warningLines.join("\n"), `make-docs ${input.command}: pre-v2 install detected`);

  const choice = await select<PreV2Choice>({
    message: "How should make-docs proceed?",
    withGuide: true,
    initialValue: "backup-and-install",
    options: [
      {
        value: "backup-and-install",
        label: "Back up and install the latest version (recommended)",
      },
      {
        value: "cancel",
        label: "Cancel",
      },
    ],
  });

  if (isCancel(choice)) {
    return "cancel";
  }

  return choice;
}
