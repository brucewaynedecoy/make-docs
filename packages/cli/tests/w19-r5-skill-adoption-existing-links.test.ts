import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { applySkillAdoptionReview, buildSkillAdoptionReview, presentSkillAdoptionReview } from "../src/skills-adoption";
import { defaultSelections } from "../src/profile";
import { loadEffectiveSkillRegistry } from "../src/skill-registry";
import { applySkillRegistrySelectionMetadata } from "../src/skill-catalog";
import { PACKAGE_ROOT } from "../src/utils";
import { readInstallationManifest } from "../src/store/installation-state";

// W19 R5 P2 (D-053): reviewed adoption must accept native Skill links that already exist.
let temp: string, root: string, store: string, home: string;
const shared = ".agents/skills/preflight";
const native = ".claude/skills/preflight";
const linkTarget = "../../.agents/skills/preflight";

beforeEach(() => {
  temp = fs.mkdtempSync(path.join(os.tmpdir(), "make-docs-existing-links-"));
  root = path.join(temp, "project");
  store = path.join(temp, "store");
  home = path.join(temp, "home");
  fs.mkdirSync(root);
  fs.mkdirSync(home);
  vi.stubEnv("MAKE_DOCS_HOME", store);
  vi.stubEnv("HOME", home);
  vi.spyOn(os, "homedir").mockReturnValue(home);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  fs.rmSync(temp, { recursive: true, force: true });
});

function options() {
  const effectiveRegistry = loadEffectiveSkillRegistry({ packageRoot: PACKAGE_ROOT });
  const selections = defaultSelections();
  selections.skills = true;
  selections.selectedSkills = ["preflight"];
  selections.skillScope = "project";
  selections.harnesses = { codex: true, "claude-code": true };
  return {
    targetDir: root,
    selections: applySkillRegistrySelectionMetadata(selections, effectiveRegistry),
    adoptExisting: ["preflight"],
    effectiveRegistry,
  };
}

/** Write the shipped canonical copy, then expose it through a relative Claude link, like a checked-in project. */
async function existingLinkedCopy(skillBody?: string): Promise<void> {
  const fresh = await buildSkillAdoptionReview(options());
  for (const [relative, state] of Object.entries(fresh.after).sort(([left], [right]) => left.length - right.length)) {
    if (!relative.startsWith(shared)) continue;
    const absolute = path.join(root, relative);
    if (state.kind === "directory") fs.mkdirSync(absolute, { recursive: true, mode: state.mode });
    if (state.kind === "file") {
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, Buffer.from(state.contentBase64!, "base64"), { mode: state.mode });
    }
  }
  if (skillBody !== undefined) fs.writeFileSync(path.join(root, shared, "SKILL.md"), skillBody);
  fs.mkdirSync(path.join(root, ".claude/skills"), { recursive: true });
  fs.symlinkSync(linkTarget, path.join(root, native));
}

describe("reviewed Skill adoption with existing native links (D-053)", () => {
  it("adopts an existing linked copy without the copy-fallback error and keeps the link", async () => {
    await existingLinkedCopy();
    const review = await buildSkillAdoptionReview(options());
    expect(review.blockers).toEqual([]);
    expect(Object.keys(review.plan.copyFallbacks ?? {})).not.toContain(native);

    expect(applySkillAdoptionReview(review, review.digest).status).toBe("completed");
    expect(fs.lstatSync(path.join(root, native)).isSymbolicLink()).toBe(true);
    expect(fs.readlinkSync(path.join(root, native))).toBe(linkTarget);
    expect(readInstallationManifest(root)!.files[native].ownershipClass).toBe("selected-skill");

    const repeat = presentSkillAdoptionReview(await buildSkillAdoptionReview(options()));
    expect(repeat.status).toBe("unchanged");
    expect(repeat.changes).toEqual([]);
  });

  it("refreshes an outdated linked copy with a backup and keeps the link", async () => {
    await existingLinkedCopy("Outdated installed preflight instructions.\n");
    const review = await buildSkillAdoptionReview(options());
    expect(review.blockers).toEqual([]);
    expect(review.backups.map((backup) => backup.source)).toEqual([`${shared}/SKILL.md`]);

    expect(applySkillAdoptionReview(review, review.digest).status).toBe("completed");
    const shipped = Buffer.from((await buildSkillAdoptionReview({ ...options(), targetDir: fs.mkdtempSync(path.join(temp, "fresh-")) })).after[`${shared}/SKILL.md`].contentBase64!, "base64").toString("utf8");
    expect(fs.readFileSync(path.join(root, shared, "SKILL.md"), "utf8")).toBe(shipped);
    expect(fs.readFileSync(path.join(root, native, "SKILL.md"), "utf8")).toBe(shipped);
    expect(fs.lstatSync(path.join(root, native)).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(path.join(root, review.backups[0]!.destination), "utf8")).toBe("Outdated installed preflight instructions.\n");
  });

  it("still declares a copy fallback for a native link that the plan creates", async () => {
    const review = await buildSkillAdoptionReview(options());
    expect(review.blockers).toEqual([]);
    expect(Object.keys(review.plan.copyFallbacks ?? {})).toContain(native);
  });
});
