---
title: "W18 R6 P1 Playbook Contract Authoring"
kind: "history"
status: "completed"
date: "2026-07-01"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R6 P1"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Authored the normative Playbook contract upstream, dogfooded it, wired router and rules discovery, and ran the closeout coverage passes."
---

# W18 R6 P1 Playbook Contract Authoring

## Changes

Implemented W18 R6 Phase 1 by authoring the normative Playbook contract at [packages/docs/template/.make-docs/contracts/system/playbook-contract.md](../../../../packages/docs/template/.make-docs/contracts/system/playbook-contract.md) and dogfooding a byte-identical copy to [.make-docs/contracts/system/playbook-contract.md](../../../../.make-docs/contracts/system/playbook-contract.md) per R-AUTH-1 and R-AUTH-2 of this historical record (retired action-PRD: `docs/prd/34-revise-playbook-contract-and-model.md`). The contract covers the document schema (R-DOC-1 through R-DOC-7), the workflow contract and step model (R-WF-1 through R-WF-8), the dependency registry (R-DEP-1 through R-DEP-5), and the model/validator/diagnostic expectations (R-MODEL-1 through R-MODEL-6), carries all six D6 fixed decisions (the eleven-heading spine, the authoritative-versus-narrative line, the `playbook` info string, the enumerations with the `delegated` default, the single-model rule, and the `operation`-versus-`command` split), and embeds the canonical worked example byte-verbatim from Section 2.6 of the architecture artifact with a deterministic `operation` step, a `human` `gate` step, and an `event-bound` step. Contract discovery was wired through byte-identical upstream/downstream router pairs (`docs/AGENTS.md`+`CLAUDE.md`, `.make-docs/contracts/system/AGENTS.md`+`CLAUDE.md`, `docs/assets/playbooks/AGENTS.md`+`CLAUDE.md`), the contract was added to `ALWAYS_REFERENCE_PATHS` in `packages/cli/src/rules.ts`, and the uninstall test's managed-file count moved from 63 to 64 in `packages/cli/tests/uninstall.test.ts`. All eight tasks in [the Phase 1 backlog file](../../../work/2026-07-01-w18-r6-playbook-contract-and-model/01-playbook-contract-authoring.md) are checked off.

Developer-guide coverage was `update-existing` because the contract itself is the normative document and restating it in a guide would add nothing, but [the Run Playbook runner architecture guide](../../library/developer/playbooks-development-runner-architecture.md) owned a Catalog Contract Validation section describing the now-superseded W18 R4 schema (`<slug>.md` filename, six-field frontmatter) as if it were the contract; the guide gained a contract authority note pointing at the new normative contract, PRD 34 and contract entries in `related` and Related Resources, and a Future Coverage bullet blocked on W18 R6 Phases 2 and 3 for the parser/validator refresh. User-guide coverage was `none` (deferred) for a reader-facing projection of the contract, confirming the phase's t7 decision: R-AUTH-4 makes the guide SHOULD/MAY, a projection now would trail the product surface because the validator and `playbook.validate`/`playbook.catalog` operations land in Phases 2 through 5, and guide coverage routes through the coverage pass after those operations exist; the deferral was persisted as a Future Coverage bullet in [the user running-playbooks guide](../../library/user/playbooks-running-make-docs-workflows.md) so the decision point is durable. PRD coverage was `risk-register-update` because the phase implemented existing PRD 34 requirements without changing the active requirement surface (no change doc, no index change — the index tracks no per-phase status), while risk R-018 in [the open questions and risk register](../../../prd/03-open-questions-and-risk-register.md) directly tracks contract/validator/template-copy parity and its current-state cell now records that Phase 1 landed the contract prose in byte parity with the validator, diagnostic catalog, fixtures, and automated parity checks still open; the item number, Open status, and follow-up were preserved. Manual-test/UAT coverage is deferred until W18 R6 wave completion per user instruction; the natural UAT is a validator run over the default Playbook in both locations once `playbook.validate` exists.

Validation: upstream/downstream diffs are empty for the contract and all three router pairs, `git diff --check` is clean, `check_path_hygiene.py` reports zero errors, and the CLI suite passes 421/422 with the single failure pre-existing — the risk-register consistency test's hardcoded item lists lag `docs/prd/03-open-questions-and-risk-register.md` (known debt, not introduced by this phase or this closeout, and unchanged by the R-018 in-place cell edit).

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../../packages/docs/template/.make-docs/contracts/system/playbook-contract.md](../../../../packages/docs/template/.make-docs/contracts/system/playbook-contract.md) | New upstream normative Playbook contract covering document schema, workflow contract and step model, dependency registry, and model/validator/diagnostic expectations. |
| [../../../../.make-docs/contracts/system/playbook-contract.md](../../../../.make-docs/contracts/system/playbook-contract.md) | Byte-identical dogfood copy of the Playbook contract. |
| [../../../CLAUDE.md](../../../CLAUDE.md) | Added the playbook-contract routing bullet (paired with `docs/AGENTS.md` and the upstream template copies). |
| [../../../../.make-docs/contracts/system/CLAUDE.md](../../../../.make-docs/contracts/system/CLAUDE.md) | Contract-directory router updated for playbook-contract discovery (paired with `AGENTS.md` and the upstream template copies). |
| [../../playbooks/CLAUDE.md](../../playbooks/CLAUDE.md) | Playbooks-directory router updated to point authors at the new contract (paired with `AGENTS.md` and the upstream template copies). |
| [../../../work/2026-07-01-w18-r6-playbook-contract-and-model/01-playbook-contract-authoring.md](../../../work/2026-07-01-w18-r6-playbook-contract-and-model/01-playbook-contract-authoring.md) | Marked Phase 1 tasks t1 through t8 complete. |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Updated the R-018 current-state cell to record the Phase 1 contract landing while keeping the item Open for validator/fixture/parity work. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/playbooks-development-runner-architecture.md](../../library/developer/playbooks-development-runner-architecture.md) | Added the Playbook contract authority note to Catalog Contract Validation, related links to PRD 34 and the contract, and a Future Coverage bullet for the W18 R6 parser/validator phases. |

### User

| Path | Description |
| --- | --- |
| [../../library/user/playbooks-running-make-docs-workflows.md](../../library/user/playbooks-running-make-docs-workflows.md) | Added a Future Coverage bullet persisting the deferred reader-facing contract projection and the filename/validate/catalog refresh blocked on W18 R6 Phases 2 through 5. |
