---
title: "W16 R2 Configuration Convention Overlay Wave Closeout"
kind: "history"
status: "completed"
date: "2026-06-25"
coordinate: "W16 R2"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Closed W16 R2 with final manual-test coverage guidance and validation evidence."
---

# W16 R2 Configuration Convention Overlay Wave Closeout

## Changes

Closed W16 R2 after all four implementation phases completed with local commits, preserving PRD 24's presentation-only configuration boundary and adding final manual-test coverage guidance for configured CLI labels and project-owned config preservation.

### Manual Test Coverage

Manual testing is worthwhile because W16 R2 has a user-observable CLI/admin surface: configured labels appear in command output and `.make-docs/config.yaml` must survive install, sync, backup, and uninstall workflows. Automated tests and smoke-pack cover the mechanics, but a human can still verify the end-to-end command output and preservation behavior from an administrator's point of view.

Suggested UAT scenario:

1. Build the local CLI.
   - Run: `npm run build -w packages/cli`
   - Check: the build completes successfully and writes `packages/cli/dist/index.js`.
2. Create a temporary project with a project-owned config.
   - Run:
     ```sh
     TARGET="$(mktemp -d)"
     mkdir -p "$TARGET/.make-docs"
     cat > "$TARGET/.make-docs/config.yaml" <<'YAML'
     labels:
       documentKinds:
         design: Idea
         prd: Requirement
       coordinates:
         wave: Batch
         phase: Step
     personas:
       - slug: user
         label: Reader
         description: People reading generated docs.
         primitive: user
     YAML
     ```
   - Check: `cat "$TARGET/.make-docs/config.yaml"` shows the configured labels and `Reader` persona.
3. Install make-docs into the temporary project.
   - Run: `node packages/cli/dist/index.js --yes --target "$TARGET"`
   - Check: the output includes configured label summaries such as `Document kind labels:`, `design=Idea`, `prd=Requirement`, `Coordinate labels:`, `wave=Batch`, `phase=Step`, and `Persona labels: user=Reader`.
   - Check: `cat "$TARGET/.make-docs/config.yaml"` still shows the original config.
4. Confirm the manifest does not claim project config as managed package content.
   - Run:
     ```sh
     node -e 'const fs=require("fs"); const m=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); console.log(Boolean(m.files[".make-docs/config.yaml"]), Boolean(m.systemAssetMaterialization.assets[".make-docs/config.yaml"]));' "$TARGET/.make-docs/manifest.json"
     ```
   - Check: output is `false false`.
5. Run lifecycle commands as an administrator would.
   - Run: `node packages/cli/dist/index.js backup --yes --target "$TARGET"`
   - Check: backup completes, `.make-docs/config.yaml` remains in the project, and `.backup/<date>/.make-docs/config.yaml` is not created.
   - Run: `node packages/cli/dist/index.js uninstall --yes --target "$TARGET"`
   - Check: uninstall removes managed make-docs files such as `.make-docs/manifest.json`, preserves `.make-docs/config.yaml`, and reports preserved paths.
6. Report back:
   - Pass: configured labels are visible in CLI summaries, the config file content remains unchanged, the manifest does not track config as managed content, backup does not copy it as managed content, and uninstall preserves it.
   - Fail: include the command, observed output, and whether the problem was label rendering, manifest ownership, backup copying, or uninstall preservation.

### PRD Coverage

No PRD changes were warranted during final wave closeout. The completed implementation stayed inside this historical record (retired action-PRD: `docs/prd/24-revise-configuration-convention-overlay.md`): optional project-owned config, presentation-only rendering, canonical metadata/routing, source-first template rules, and local config preservation.

### Validation

- Phase 1 commit: `4f75f8e`
- Phase 2 commit: `4a98a8f`
- Phase 3 commit: `e313aaa`
- Phase 4 commit: `6916f86`
- `python3 packages/skills/work-on-wave/scripts/wave_status.py docs/work/2026-06-23-w16-r2-configuration-convention-overlay --json`
- `python3 packages/skills/work-on-phase/scripts/phase_gate.py docs/work/2026-06-23-w16-r2-configuration-convention-overlay/04-package-parity-and-closeout.md --commit-policy commit-required`

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-23-w16-r2-configuration-convention-overlay/00-index.md](../../../work/2026-06-23-w16-r2-configuration-convention-overlay/00-index.md) | W16 R2 work backlog now has all phases complete. |
| [docs/assets/archive/history/2026-06-25-w16-r2-configuration-convention-overlay-wave-closeout.md](2026-06-25-w16-r2-configuration-convention-overlay-wave-closeout.md) | Records final wave closeout and manual-test coverage guidance. |

### Developer

None this session.

### User

None this session.
