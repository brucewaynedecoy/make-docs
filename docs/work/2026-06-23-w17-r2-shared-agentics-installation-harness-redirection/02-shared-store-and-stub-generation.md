# P2 Shared Store and Stub Generation

## Tasks

- [x] Add shared agentics path resolution for project and global scopes.
- [x] Generate canonical selected skill payloads under `.make-docs/agentics/skills/<skill-name>/`.
- [x] Generate harness entrypoint stubs under `.claude/skills/<skill-name>/` and `.agents/skills/<skill-name>/`.
- [x] Include canonical payload path, source/provenance, purpose summary, and deterministic operation guidance in generated stubs.
- [x] Preserve no-default-skills behavior for bare install and saved-selection sync.

## Acceptance Criteria

- A selected skill writes one canonical payload per scope.
- Every selected harness receives a text stub.
- No implementation path requires symlinks.

## Validation Notes

Cover project and global scope fixtures for Codex, Claude Code, and both harnesses together.

Completed on 2026-06-27:

- Updated the skill catalog to resolve selected project-scope payloads under `.make-docs/agentics/skills/<skill-name>/` and selected global-scope payloads under the home-scoped `.make-docs/agentics/skills/<skill-name>/`.
- Generated harness `SKILL.md` stubs only under `.claude/skills/<skill-name>/` and `.agents/skills/<skill-name>/`; supporting files remain in the shared payload.
- Added stub text for canonical payload path, skill source, purpose summary, provenance, and deterministic operation guidance.
- Preserved the bare-install no-skill-files behavior and updated smoke-pack expectations for selected-skill installs.
- Updated PRD and guide language so the shipped contract no longer describes duplicated per-harness payloads as the active selected-skill target.

Validation:

- `npm test -w packages/cli -- skill-catalog install cli audit backup uninstall skills-ui lifecycle --reporter=dot`
- `npm run build -w packages/cli`
