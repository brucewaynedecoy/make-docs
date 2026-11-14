---
title: "Portable Checkout Adoption"
kind: "design"
status: "draft"
coordinate: "W22 R2"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "reorder"
  reason: "The canonical risk register records the reported gap at intake; normative PRD changes wait for the change plan."
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "The active PRD set owns setup, Store state, config, and managed-file review."
  coordinate_handoff: "W22 R1 repaired moved-checkout setup. W22 R2 owns the related second-machine adoption correction, subject to the planner's coordinate check."
---

# Portable Checkout Adoption

## Purpose

Define how setup attaches a checked-in Make Docs project to a configured Store on a second machine. Preserve the project's declared identity and local content while establishing new, proved checkout ownership.

## Context

In 2.0.6, a clone can contain a valid `.make-docs/config.yaml` with a `projectId`, routers, and all four local system resource types while the machine's Store has no installed ledger for that checkout. The owner reports that setup calls this a fresh install and classifies the files as a recognizable installation with no manifest. The owner saw 17 conflicts: 14 routers and three resources. The cause of the three resource byte differences is not yet known. The failed setup ran before `checkout_register_preview`. A checkout row without a ledger may explain why preview then said `bound` while state status said `unregistered`. The exact Store row state remains unverified.

An isolated test of the installed 2.0.6 CLI used Store A, a committed project with all four resource types, a clone, and a separate configured Store B. One changed managed block and one changed resource caused two `skip-conflict` actions. Non-interactive `setup --yes` returned `blocked` with `ambiguous-ownership`. The same choices with `--dry-run` returned `planned` and told the user to run setup. The clone stayed clean in git. Exact shipped files completed setup and also stayed clean in git. In this fixture, state status said `ownership-unverified` and checkout registration preview said `blocked` both before and after the failed setup. It did not reproduce the owner's `unregistered` and `bound` pair. The fixture used no harness methods, so the saved MCP method default also remains untested.

The existing [Store design](2026-09-09-store-owned-installation-and-migration-state.md) separates portable project identity from Store-owned checkout identity. [PRD 38](../prd/38-global-store-and-project-state.md) requires a separate reviewed checkout registration. [PRD 24](../prd/24-project-configuration-and-convention-overlay.md) makes project config the desired-setting authority. [PRD 05](../prd/05-installation-profile-and-manifest-lifecycle.md) and [PRD 07](../prd/07-cli-command-surface-and-lifecycle.md) require a path-scoped conflict disposition before apply. This design fills the adoption path without treating the project ID or matching file bytes as prior local ownership.

[D-050](../prd/03-open-questions-and-risk-register.md#d-050-second-machine-setup-cannot-adopt-a-portable-checkout) records the reported gap now, as the risk-register rule requires. This intake entry is the only departure from the default lifecycle order. Normative PRD changes wait for the change plan.

## Human Experience Intent

Impact: `direct`

Affected humans: Maintainers who clone a Make Docs project onto another machine.

Human goal or effect: Connect the clone to the machine's Store without changing checked-in project content or losing local choices.

Experience promises:

- Status and setup identify the checkout as a project that needs local adoption and name one usable next command.
- Setup shows the saved project choices and a per-path diff summary before it applies changes.
- A non-interactive adoption with saved choices and a keep disposition can finish with no project-file change.
- Dry run shows the same conflicts and blocked or ready result as an apply with the same choices.

Complexity kept out of the human path:

- The user does not need to edit Store rows, remove the project ID, or answer an interactive prompt to keep existing files.
- The user does not need to decide whether a changed resource came from an older package before safe adoption.

Evidence required:

- A two-Store clone test that compares project files and git status before and after adoption.
- CLI and operation results for status, preview, dry run, interactive review, non-interactive apply, and repeat run.
- A review of the displayed path summaries and next action for the reported conflict set.

## Performance Evidence Candidates

The current candidate is the time and file I/O used to scan a local projection during adoption. Its base maintenance action is `none`, and its performance applicability is `not-needed`. The protected outcome is safe completion of setup on the reported checkout. No accepted latency target, comparable baseline, or performance claim can change the current ownership decision. The failure cost of a slow scan is lower than the cost of a wrong ownership claim. The scan is bounded to the explicit target and selected resource paths. PRD 39 owns setup behavior at W22 R2. Functional and safety proof is still required. No `PERF-###` profile or performance gate is created from this candidate.

## Decision

### Recognize portable, unregistered checkouts

Setup validates the explicit target's config before manifest lookup and fresh-install classification. A valid project ID with no installed ledger for the target in the current Store is a `portable-checkout-unregistered` setup state. The checkout binding may be absent or present without a ledger. Neither case is a first install or proof of an existing local installation. Legacy compatibility classification remains available for actual legacy inputs and does not override this state.

`project state status` may retain the stable `unregistered` result code. Status and `checkout_register_preview` must expose binding state separately from installed-ledger state and name `make-docs setup --adopt` as the next action when adoption is needed. A preview may report `bound` for an existing target checkout row, but must also say that no installation ledger exists. Both operations remain read-only. A Store record for another checkout with the same project ID does not become a move or an inherited installation.

### Make adoption an explicit setup mode

Plain `make-docs setup` stops before any write when it sees this state. Interactive setup offers **Adopt this checkout**, **Continue with normal setup**, and **Cancel**. It shows the plan for the selected path before apply. Non-interactive plain `setup --yes` returns a blocked result with `make-docs setup --adopt --yes` in `nextAction`. Dry run offers the same interactive choice or returns the same blocked result without writing. Plain setup cannot silently treat this checkout as fresh.

A local legacy installation manifest follows its existing reviewed migration path. It is an installed-record signal, so the portable checkout choice gate does not replace the pre-v2 warning.

Adoption requires `--adopt` and `--yes` in non-interactive mode. The mode preserves the declared project ID, creates a distinct checkout ID only when no target binding exists, and records only the reviewed current checkout. If a failed prior setup left a valid target binding with no ledger, adoption reuses that checkout ID after identity and operation-state proof. It does not copy another checkout's ledger or history. It refuses malformed or conflicting config, unsafe paths, an active writer, pending recovery, or a competing target claim.

Adoption reads desired capabilities, harness methods, Skills, and resource projection from validated project config. Explicit CLI selections override saved intent through the normal reviewed setup path. Machine config limits allowed methods; `maximumMethod` alone is not a choice. If project config specifies `mcp` and machine config permits it, setup uses `mcp` without requiring redundant method flags. If a needed choice is absent or contradicts machine limits, setup asks in interactive mode and stops with a specific missing-choice result in non-interactive mode.

When config has no resource projection choice, adoption inventories canonical resource paths for each of the four types. A complete, recognized local set becomes a recovered projection candidate in the reviewed adoption plan. `--adopt` explicitly accepts that current layout when the user applies a complete plan with `--yes`; no ordinary setup path infers the selection. A partial or ambiguous set requires an interactive choice or `--project-resources`. An explicit config or CLI selection always wins over file presence. The plan states whether each choice came from config, CLI, or the recovered layout.

### Establish ownership from current evidence

Adoption compares selected files with trusted shipped package bodies and hashes, using the correct package version and resource URI. An exact full-file match can enter the new ledger as managed. For a shared instruction file, only the marked Make Docs block is compared and adopted; text outside the block stays project-owned. A changed, mixed, unknown, or unproved file remains project-owned by default. The plan lists its path, ownership class, source comparison, and bounded diff before apply. It does not label a changed file managed merely because it has a Make Docs marker or lives under `.make-docs/system/`.

Add a non-interactive `--conflicts keep|overwrite` resolution for reviewable selected paths. `keep` records a project-owned disposition and leaves bytes unchanged. In adoption mode, keep is the default for divergent paths; `--adopt` is the explicit authorization for that baseline, and `--conflicts keep` states the same choice. Outside adoption, a non-interactive run requires the flag when reviewable conflicts exist. There, `overwrite` is an explicit export-and-replace choice for valid changed paths. In adoption mode, batch `overwrite` is allowed only where prior local evidence proves clean managed ownership. An unproved adoption path cannot be overwritten through this batch flag; a separate explicit export-then-replace review can handle it. Resolve each path in the frozen plan even when the CLI presents one batch choice. Reject incomplete or contradictory maps. Recheck source versions, selected paths, Store state, and the proposed ledger under the project and Store locks before mutation.

### Align dry run and apply

Interactive dry run collects conflict choices before it reports the final plan. It performs no project or Store mutation. Non-interactive dry run uses the same explicit flags as apply. Both forms report unresolved conflicts as blocked and show the same next action. A dry-run `ready` result means the reviewed plan has no unresolved choice; apply still rechecks the snapshot.

### Prove the second-machine path

The regression fixture installs with Store A, commits the project, clones it into a fresh path, and uses an empty but configured Store B. It captures the exact Store and target roots, checkout rows, status, and registration preview before setup, after a blocked setup, and after adoption. It proves plain setup, `setup --yes`, and dry run make no project or Store write before the path choice. It proves interactive setup offers all three choices and shows the selected plan. It runs `setup --adopt --yes` with saved project choices and the recovered complete local resource selection. It checks that the original project ID remains, a distinct checkout ID is registered or an existing valid target ID is reused, the Store A record is not copied, and all tracked bytes and git status remain unchanged. This is a 2.0.7 release check. Variant checks cover explicit `--conflicts keep`, changed routers, the three changed resources, invalid config, missing choices, competing bindings, stale review, dry run, and status/preview agreement. The three reported resource differences remain unknown until their bytes and source version are inspected; the safe keep rule does not depend on that cause.

## Alternatives Considered

- Treat the clone as a fresh install. This hides the portable identity and can turn checked-in files into conflicts or unwanted changes.
- Infer ownership from a project ID, marker, or directory location. None proves local installation ownership.
- Make `--conflicts overwrite` replace every conflict. This would cross the existing proof boundary for changed or unknown project files.
- Require an interactive prompt for every adoption. This leaves automation unable to keep reviewed project files safely.

## Consequences

Adoption needs one shared state model for setup, status, and checkout preview. The planner needs a path-level keep disposition that can establish a Store baseline without writing project files. Package hash comparison must account for exact resource version and block ownership. The CLI and operation projections must return the same state and next action. New Store writes still use the existing recovery and lock rules. The current 2.0.6 behavior remains a confirmed report until a packaged two-Store reproduction verifies each detail.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs: [Store-owned installation and migration state](2026-09-09-store-owned-installation-and-migration-state.md), [CLI conflict resolution](2026-05-06-cli-conflict-resolution.md), and [setup interview and recovery correction](2026-09-15-setup-interview-and-recovery-correction.md).

Reason: Second-machine adoption crosses checkout registration, setup classification, conflict review, and saved selections. A focused design keeps the prior move and migration decisions clear.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read`.
- Why: The active PRD set owns setup, Store state, config, and managed-file review.
- Coordinate Handoff: W22 R1 repaired moved-checkout setup. W22 R2 owns the related second-machine adoption correction, subject to the planner's coordinate check.
