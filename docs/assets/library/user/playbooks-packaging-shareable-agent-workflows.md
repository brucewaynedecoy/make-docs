---
title: "Packaging Shareable Playbook Workflows"
kind: "guide"
status: "draft"
path: "playbooks"
persona: "user"
order: 110
tags:
  - playbooks
  - packaging
  - plugins
  - skills
applies-to:
  - playbooks
  - plugins
  - skills
related:
  - ./playbooks-running-make-docs-workflows.md
  - ../developer/playbooks-development-packaging-and-harness-adapters.md
  - ../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md
  - ../../../prd/36-playbook-packaging-compiler-and-harness-adapters.md
  - ../../../prd/36-playbook-packaging-compiler-and-harness-adapters.md
  - ../../../prd/39-cli-command-model-and-operation-registry.md
---

# Packaging Shareable Playbook Workflows

This guide explains the v2 model for turning Make Docs Playbooks into shareable agentic outputs. The current package exposes the underlying operation commands for package planning, surface resolution, and accepted package writes; broader user-facing packaging workflows may add friendlier prompts or plugin surfaces later.

## What Packaging Means

A Playbook is the portable source workflow. It stays under `docs/assets/playbooks/<persona>/<slug>.playbook.md` and remains readable Markdown.

Packaging creates a generated output from that source. Depending on the target harness and user choice, the output can be:

- a plugin for a harness that supports plugins;
- a skills bundle for a harness that consumes skills;
- an export-only package that can be reviewed or shared before installation.

The generated output is not the source of truth. Make Docs should be able to trace it back to the Playbook or Playbooks that produced it.

## Why There Is a Review Step

Some packaging work is mechanical. Make Docs can validate metadata, check links, compute source digests, choose supported output kinds, write files, and track ownership.

Some packaging work is semantic. A useful plugin or skill description may need a human or agent to summarize what the Playbook does, choose a good title, split a large workflow into skills, or adapt wording for a particular harness. Those semantic decisions are reviewed package-plan fields, not blind automatic writes.

In practice, a user should expect Make Docs to show a package plan before writing generated outputs. The plan now lists the exact files the package will contain, so you can see the whole generated tree before anything is written. When a Playbook has no authored summary, Make Docs drafts a skill description for it as a proposal — the draft has no authority until you accept the plan. If a plan needs review, non-interactive runs stop before writing.

## Output Choices

The planned output kinds are:

- `plugin`: the richest package the target harness natively supports. For most harnesses that is a plugin; for a harness whose richest native form is something else — for example an extension — the adapter uses that form instead.
- `skills-bundle`: a portable bundle of generated skills using the standard agent skills layout, for sharing across harnesses that consume skills.

Each Playbook in a package becomes exactly one skill. When a Playbook's workflow needs more than a skill — for example a step that should run on a harness event — the package plan says how that behavior is handled on the chosen harness: carried natively, downgraded to a written instruction or documented manual step, or stopped with a clear unsupported-surface message. Nothing is silently dropped; the plan output lists the package's skills and any downgrades so you can review them before writing.

The planned surface choices are:

- `native`: use the harness's own plugin or skill location.
- `agents-standard`: use a standard agent skill location when the selected harness supports it.
- `auto`: let the harness adapter pick the best valid surface from the user's scope and the harness's rules.

The harness is still a real harness — Codex, Claude Code, or Pi today, with future harnesses added the same way. A standard location is a surface that a harness may support, not a separate generic harness. Pi is a little different from the other two: it does not support hooks, and its richest native form is an extension rather than a plugin, so a `plugin` output for Pi becomes an extension and any event-bound step is downgraded to a written instruction or stops with a clear message, exactly as the plan shows.

## What a Generated Package Contains

A written package is a real folder tree in the target harness's own format, not a Make Docs file. Inside it you will find:

- a `SKILL.md` for each packaged Playbook that keeps the workflow's intent, trigger description, step instructions, references, and safety boundaries — the skill is the Playbook restated for the harness, not a summary of it;
- the manifest file the harness expects, such as a plugin manifest, listing the package's skills;
- copies of the Playbook's repository reference material under `references/`, with external sources linked instead of copied;
- runnable dependency checks under `checks/` — small shell scripts you can run yourself (for example `sh checks/<dependency>.sh`) to confirm a required tool is available before using the workflow. A check verifies the dependency's declared probe, and you control it from the Playbook's fenced `dependencies` block: the optional `probe:` field of a dependency entry names the exact binary the check verifies, defaulting to the dependency's `id` when absent — so an entry with `id: github-cli` and `probe: gh` generates a check for `gh`, a plain `id: git` entry generates a check for `git`, and free-text `source` notes like `system install of git` are just provenance prose that never influences what a check probes;
- hook files when a Playbook step is bound to a harness event the target supports;
- registration or marketplace files generated for your review — Make Docs writes them into the package but never registers the package anywhere on your behalf (see Registering a Package Is Manual below);
- Make Docs tracking records in a `.make-docs/` folder inside the package, covering provenance, dependencies, and lifecycle. These are bookkeeping, not the installable artifact.

One honest caveat still applies: Make Docs does not claim a harness actually recognizes a generated package until the W18 R9 conformance work records that evidence against the real harness. See the next section for what each harness's layout verification currently means.

## Where Generated Packages Land

Each harness has its own install locations, and Make Docs now declares them per harness:

- **Codex**: a plugin is a folder containing `.codex-plugin/plugin.json`. It lands at `.codex/plugins/<package-id>` in your project (or `~/.codex/plugins/<package-id>` for global scope), and the package includes a marketplace entry at `.agents/plugins/marketplace.json` that points Codex at that folder — the `.agents/plugins/` directory holds only that marketplace file, never the plugin itself. A skills bundle lands directly at `.agents/skills/<id>/SKILL.md`, where Codex discovers skills.
- **Claude Code**: a plugin lands at `.claude/plugins/<id>/plugin.json` and a skill at `.claude/skills/<id>/SKILL.md`; the portable skills-bundle form uses the same `.agents/skills/<id>/SKILL.md` standard location.
- **Pi**: the native form is an extension at `.pi/extensions/<id>` (with an `extension.json` manifest); the portable form is the standard skills location.
- **Export-only** packages for any harness land under `.make-docs/exports/playbook-packages/` for review or sharing, without touching any harness location.

These layouts are not all equally confirmed, and Make Docs says so per harness. The Codex layout is verified against the documented Codex contract. The Claude Code and Pi layouts are declared but still provisional: the Claude Code shapes await review against the real Claude Code plugin and skill contract, and the Pi paths are inferred rather than confirmed. Provisional means the files are real and the layout is Make Docs' best declared contract, but you should expect it could still change once checked against the actual harness.

Verification also gates support claims automatically: a package cannot claim validated support for a harness whose contract is not verified — Make Docs caps the claim to provisional and stops a write that asserts otherwise. And even a verified layout is not a recognition claim; that evidence bar belongs to the W18 R9 conformance work.

## Registering a Package Is Manual

Make Docs never registers a package with a harness or a marketplace on your behalf. It generates the registration files into the package and stops there — registering is your step:

- For a **Codex plugin**, the package includes a marketplace entry (the `.agents/plugins/marketplace.json` content) that is usable as written — home-directory paths are already lowered to `~` and the entry carries the package version. You place or merge that entry into your Codex marketplace surface yourself.
- The package's `registration/` folder holds every registration file the target harness needs, and the `.make-docs/registration.json` record inside the package describes what they are for.
- Skills-bundle outputs need no registration at all — harnesses discover them directly at the standard skills location.

There is a configuration key for future auto-registration — `settings.marketplaceAutoRegistration` in the machine-level `~/.make-docs/config.json`, off by default — but turning it on does not register anything today. Make Docs recognizes the opt-in and records it, then still refuses: every package write reports the decision and exactly why installation was withheld (opt-in off, scope not global, approval missing, or — always, for now — auto-registration not yet shipped pending conformance evidence). Auto-registration will only ever be possible for global-scope writes you explicitly approve, and it stays disabled until the W18 R9 conformance work proves the install path against real harnesses.

## Uninstalling and Backing Up Installed Packages

Installed packages are tracked in the Make Docs manifest, so removal is safe and scoped:

- Backup copies exactly the generated files Make Docs owns — nothing else is swept up.
- Uninstall removes the package payload and its harness exposure (the symlink or copy mirror), and cleans up harness directories it emptied without deleting directories that still hold anything else.
- Your own files are never touched: user-authored files stay, and a generated file you edited locally is preserved rather than deleted.

This behavior is now proven by tests that write real Codex plugin and Claude Code skills-bundle packages and run the actual uninstall against them. As always, that is Make Docs testing its own behavior — it is not evidence that a harness recognizes the package, which remains the W18 R9 bar.

## What Make Docs Tracks

When Make Docs packages a Playbook, it should track:

- which Playbook source was used;
- the source digest;
- whether the output is a plugin or skills bundle;
- which harness and surface were targeted;
- which files were generated;
- whether files were symlinked, copied, or exported;
- whether any fields were agent-proposed and reviewed;
- what support evidence exists;
- how to audit, back up, update, or uninstall the generated output.

This tracking is what lets Make Docs avoid orphaned files, stale generated outputs, and accidental deletion of user-authored harness files.

## Future Harnesses

Different harnesses may support different places for plugins and skills. Some may prefer their own native folders. Some may also read standard agent skill folders, sometimes only after a project is trusted by the user.

Make Docs handles that through harness adapters. The adapter knows what the harness supports, which locations are valid, what preconditions apply, and whether symlinks or copy mirrors should be used. That keeps future harness support predictable without changing how Playbooks are authored.

## Current Operation Flow

The packaging commands are intent-named: `plan` computes the reviewable plan, `preview` runs the full write pipeline without writing anything, `write` writes, and `ship` runs all three end-to-end. On a terminal each command prints a short summary of its diagnostics with the next command to run; add `--json` (or pipe the output) for the full JSON record.

When there is nothing to review, one command is the whole flow:

```sh
make-docs run package ship \
  --source user/run-stack \
  --harness codex \
  --output-kind plugin \
  --surface native \
  --scope project \
  --support-evidence-ref docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md
```

`ship` plans, previews, and writes in one pass — but only when the plan comes back with zero stops, zero unresolved decisions, and zero unreviewed proposals. Anything that needs human judgment aborts the whole pipeline before a single file is written, and the result names the granular command (`plan`, `preview`, or `write`) to continue with. Ship never relaxes a safety check; it only removes the ceremony from the already-clean path.

When a plan does need review, the step-by-step flow is:

1. Create a package plan.
2. Review any stops or semantic proposals.
3. Resolve the target surface through the harness adapter.
4. Write only when the package plan is safe or approved.

For example, a maintainer can create a package plan:

```sh
make-docs run package plan \
  --source user/run-stack \
  --harness codex \
  --output-kind plugin \
  --surface native \
  --scope project \
  --support-evidence-ref docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md
```

On a terminal the result is a summary with next-step guidance; add `--json` for the full JSON record. Add `--output /path/to/package-plan.json` to save the reviewable `plan` object directly (it is exactly what the write step's `--plan-json` consumes), and inspect the `status`, `stops`, `review`, and `support` fields before writing. The plan's deterministic derivations include the planned payload file list, and the dry-run rendering prints it as `Planned payload files:` lines, so the full generated tree is reviewable up front.

To check where a package would be exposed for a harness:

```sh
make-docs run package surface-resolve \
  --package-id run-stack \
  --harness codex \
  --output-kind plugin \
  --surface native \
  --scope project \
  --precondition harness-supported=satisfied \
  --precondition project-trusted=satisfied \
  --precondition symlink-or-copy-mirror=satisfied
```

To run the full write pipeline with no writes — every diagnostic, stop, and generated-output record, nothing on disk:

```sh
make-docs run package preview \
  --plan-json /path/to/package-plan.json \
  --precondition harness-supported=satisfied \
  --precondition project-trusted=satisfied \
  --precondition symlink-or-copy-mirror=satisfied
```

To perform the write, run `make-docs run package write` with the same flags (the old `--write` flag is retired and fails with guidance naming the new commands), or run `make-docs run package ship` with the plan flags to go plan, preview, write end-to-end — ship completes only when the plan has zero unresolved items and aborts at the first stop with the granular command to continue with. The write command writes generated plugin or skills-bundle payloads only when the plan is accepted or deterministic and safe, and its result lists every payload file it wrote.

The repeated `--precondition` flags can be absorbed as defaults by a `packaging.preconditions` block in the project's `.make-docs/config.yaml`, keyed by precondition id with values `satisfied`, `unknown`, or `unsupported`:

```yaml
packaging:
  preconditions:
    harness-supported: satisfied
    project-trusted: satisfied
    symlink-or-copy-mirror: satisfied
```

With the block in place, `preview`, `write`, and `ship` run without the flags. Config is convenience, never authority: an explicit `--precondition` flag always overrides the config value for its key, and a project without the block behaves exactly as before. It stops instead of overwriting modified generated files, it stops when a source Playbook changed after the plan was created (re-run the plan step to review the change), and installed outputs require an existing Make Docs manifest so backup and uninstall can track the generated files.

Export-only packages are written under `.make-docs/exports/playbook-packages/**`. They are not treated as installed harness exposures.

## What This Does Not Mean

Packaging is not required for every Playbook. A Playbook can still be run directly by a person, agent, CLI, MCP tool, or future plugin surface.

Packaging also does not mean every workflow bundle becomes its own plugin. A single first-party Make Docs plugin might expose several workflow families, while a user-authored Playbook might become a small standalone skills bundle.

Support is evidence-bound. A generated package should not claim support for a harness until Make Docs has implementation or conformance evidence for that exact output shape, and a validated support claim additionally requires the harness contract itself to be verified — an unverified harness can only produce provisional or export-only packages.

Since the Phase 4 work, every support claim is also bound to an exact combination of scenario, harness, surface, scope, output kind, model or provider, and runtime. Some of those pieces can only be filled in by real conformance evidence, which does not exist yet, so today every claim reads provisional — including for the verified Codex layout. Provisional here means: the package is real, the layout is Make Docs' best verified or declared contract, but no recorded run has yet proven the end-to-end outcome for your exact combination. Earlier builds could show a validated claim on the strength of a cited evidence document alone; that was overstated and is now deliberately capped until the W18 R9 evidence exists.

Those support statuses now have one queryable home: a maintainer-kept [conformance registry](../../../../conformance/README.md) in the Make Docs repository records every generated-output combination and derives its status from recorded evidence, so a support claim is looked up rather than asserted in prose. Today that registry records zero combinations as conformance-validated — no recorded run has yet proven that a real harness recognizes and can use a generated package — which is exactly why every claim you see reads provisional. The test scenarios that can produce that proof now exist: four packaging scenarios covering install, discovery, invocation, dependency checks, and clean uninstall are committed in the registry's home, written once per outcome rather than per harness, with Codex as the first harness they are set up to run against. They have not run — each needs a maintainer to operate a real Codex install with network and credentials, and until then every scenario honestly reports blocked rather than passing — so nothing here claims a harness recognizes a generated package yet, and a harness a scenario is not yet set up for (Claude Code, Pi) is reported as an open gap rather than implied to be covered.

<!-- support-claim-state: conformance-validated=0/20 -->

The wording you read here is governed, not just careful. Since the W18 R9 governance work, public support wording states only what a `conformance-validated` tuple proves; until a combination reaches that status, wording must distinguish a Make Docs generated output from a harness-recognized plugin — which is why this guide says "generated plugin" and never "Codex-recognized plugin". If a run ever passes with caveats, those caveats must appear in any claim built on it, and stronger recommendation language requires repeated maintainer-reviewed runs, not just one. A repository check ties this guide's wording to the registry's actual state, so when the first combination is proven against a real harness, this guide must be updated in the same change — the wording can neither run ahead of the evidence nor silently lag behind it.

## Future Coverage

The former bullet on the W18 R12 Phase 2 compiler probe fix is resolved: the `checks/` bullet in What a Generated Package Contains now states that a check verifies the Playbook's declared probe and how to control it from the dependencies block, and the known-defect caveat is removed.

- Blocked by: a first-class packaging surface beyond the current operation commands. The W18 R8 Phase 2 compiler landed — packages are now real harness-native trees and plans list their files — and the W18 R12 Phase 3 grammar landed the intent-named `plan`/`preview`/`write` commands with `ship` as the one-command path for clean plans, but no guided packaging flow has shipped, and the downgrade-versus-stop choice on unsupported behavior still exists on the underlying plan operation without a CLI flag. Update when: Make Docs ships a first-class packaging command, MCP-guided flow, or plugin surface, including the CLI flag for that choice. Guide change: replace low-level operation examples with the primary user workflow and keep operation commands as troubleshooting or maintainer detail.
- Blocked by: W18 R9 conformance evidence and the Claude Code and Pi real-contract reviews. Update when: the first generated plugin and skills-bundle outputs are validated against real harnesses and the Claude Code and Pi layouts move past provisional. Guide change: add supported harness/output combinations with their evidence, drop the per-harness provisional wording in Where Generated Packages Land as each layout is confirmed, and revise Registering a Package Is Manual if the conformance evidence lets the auto-registration opt-in actually ship.

## Related Resources

- [Running Make Docs Playbooks](./playbooks-running-make-docs-workflows.md)
- [Playbook Packaging and Harness Adapters](../developer/playbooks-development-packaging-and-harness-adapters.md)
- [Playbook Packaging and Harness Adapter Registry](../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [36 Playbook Packaging Compiler and Harness Adapters](../../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)
- [39 CLI Command Model and Operation Registry](../../../prd/39-cli-command-model-and-operation-registry.md#package-grammar-and-ship-r-gram)
