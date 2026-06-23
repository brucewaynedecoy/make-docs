# P2 Shared Store and Stub Generation

## Tasks

- [ ] Add shared agentics path resolution for project and global scopes.
- [ ] Generate canonical selected skill payloads under `.make-docs/agentics/skills/<skill-name>/`.
- [ ] Generate harness entrypoint stubs under `.claude/skills/<skill-name>/` and `.agents/skills/<skill-name>/`.
- [ ] Include canonical payload path, source/provenance, purpose summary, and deterministic operation guidance in generated stubs.
- [ ] Preserve no-default-skills behavior for bare install and saved-selection sync.

## Acceptance Criteria

- A selected skill writes one canonical payload per scope.
- Every selected harness receives a text stub.
- No implementation path requires symlinks.

## Validation Notes

Cover project and global scope fixtures for Codex, Claude Code, and both harnesses together.
