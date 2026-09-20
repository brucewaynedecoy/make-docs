---
date: "2026-04-28"
client: "Codex Desktop"
repo: "make-docs"
status: "completed"
coordinate: "W14 R1 P4"
summary: "Updated and validated tests for CLI selected-skill simplification."
---

# CLI Skill Selection Simplification - Phase 4 Validation

## Changes

Updated Phase 4 test coverage for the W14 R1 CLI skill-selection simplification. The focused CLI test surface now treats registry skills as one recommended list, stores desired skills in `selectedSkills`, rejects stale `optionalSkills` manifests, rejects the removed `--optional-skills` flag, and verifies `--selected-skills <csv|all|none>` behavior.

```text
make-docs/
└── packages/cli/tests/
    ├── cli.test.ts
    ├── install.test.ts
    ├── skill-catalog.test.ts
    ├── skill-registry.test.ts
    ├── skills-ui.test.ts
    └── wizard.test.ts
```

| Area | Summary |
| --- | --- |
| Registry and catalog | Removed required/optional helper expectations and verified packaged registry skills are selected by defaults. |
| Wizard and skills UI | Reworked tests around one selectable skill list and `Selected skills` summaries. |
| CLI and install | Covered `--selected-skills`, removed `--optional-skills`, stale manifest rejection, and selected-skill cleanup behavior. |
| Validation | Ran the required focused test suites, package build, and diff whitespace check. |

Validation commands run:

```text
npm test -w make-docs -- skill-registry
npm test -w make-docs -- skill-catalog
npm test -w make-docs -- wizard
npm test -w make-docs -- skills-ui
npm test -w make-docs -- cli
npm test -w make-docs -- install
npm run build -w make-docs
git diff --check
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [packages/cli/tests/skill-registry.test.ts](../../../packages/cli/tests/skill-registry.test.ts) | Registry tests for recommended skills without required/optional split helpers. |
| [packages/cli/tests/skill-catalog.test.ts](../../../packages/cli/tests/skill-catalog.test.ts) | Catalog tests for default selected skills and selected-skill asset planning. |
| [packages/cli/tests/wizard.test.ts](../../../packages/cli/tests/wizard.test.ts) | Wizard tests for one selectable skill list and selected-skill review copy. |
| [packages/cli/tests/skills-ui.test.ts](../../../packages/cli/tests/skills-ui.test.ts) | Skills UI tests for selected-skill state and summaries. |
| [packages/cli/tests/cli.test.ts](../../../packages/cli/tests/cli.test.ts) | CLI tests for selected-skill parsing, validation, and removed flag behavior. |
| [packages/cli/tests/install.test.ts](../../../packages/cli/tests/install.test.ts) | Install tests for selected-skill manifests and stale optionalSkills rejection. |

### Developer

None this session.

### User

None this session.
