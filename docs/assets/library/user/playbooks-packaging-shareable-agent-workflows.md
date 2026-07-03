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
  - ../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md
  - ../../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md
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

The harness is still a real harness, such as Codex, Claude Code, or a future supported harness. A standard location is a surface that a harness may support, not a separate generic harness.

## What a Generated Package Contains

A written package is a real folder tree in the target harness's own format, not a Make Docs file. Inside it you will find:

- a `SKILL.md` for each packaged Playbook that keeps the workflow's intent, trigger description, step instructions, references, and safety boundaries — the skill is the Playbook restated for the harness, not a summary of it;
- the manifest file the harness expects, such as a plugin manifest, listing the package's skills;
- copies of the Playbook's repository reference material under `references/`, with external sources linked instead of copied;
- runnable dependency checks under `checks/` — small shell scripts you can run yourself (for example `sh checks/<dependency>.sh`) to confirm a required tool is available before using the workflow;
- hook files when a Playbook step is bound to a harness event the target supports;
- registration or marketplace files generated for your review — Make Docs writes them into the package but never registers the package anywhere on your behalf;
- Make Docs tracking records in a `.make-docs/` folder inside the package, covering provenance, dependencies, and lifecycle. These are bookkeeping, not the installable artifact.

Two honest caveats. The harness folder layouts are still provisional: verifying them against the real harnesses is the next W18 R8 phase, so a generated package's support status stays provisional even though its files are real. And Make Docs does not claim a harness actually recognizes a generated package until the W18 R9 conformance work records that evidence against the real harness.

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

The current low-level flow is:

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
  --support-evidence-ref docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md
```

The result is JSON. Save the returned `plan` object and inspect the `status`, `stops`, `review`, and `support` fields before writing. The plan's deterministic derivations include the planned payload file list, and the dry-run rendering prints it as `Planned payload files:` lines, so the full generated tree is reviewable up front.

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

To dry-run a write:

```sh
make-docs run package write \
  --plan-json /path/to/package-plan.json \
  --precondition harness-supported=satisfied \
  --precondition project-trusted=satisfied \
  --precondition symlink-or-copy-mirror=satisfied
```

To perform the write, add `--write`. The command writes generated plugin or skills-bundle payloads only when the plan is accepted or deterministic and safe, and its result lists every payload file it wrote. It stops instead of overwriting modified generated files, it stops when a source Playbook changed after the plan was created (re-run the plan step to review the change), and installed outputs require an existing Make Docs manifest so backup and uninstall can track the generated files.

Export-only packages are written under `.make-docs/exports/playbook-packages/**`. They are not treated as installed harness exposures.

## What This Does Not Mean

Packaging is not required for every Playbook. A Playbook can still be run directly by a person, agent, CLI, MCP tool, or future plugin surface.

Packaging also does not mean every workflow bundle becomes its own plugin. A single first-party Make Docs plugin might expose several workflow families, while a user-authored Playbook might become a small standalone skills bundle.

Support is evidence-bound. A generated package should not claim support for a harness until Make Docs has implementation or conformance evidence for that exact output shape.

## Future Coverage

- Blocked by: a first-class packaging surface beyond the current operation commands. The W18 R8 Phase 2 compiler landed — packages are now real harness-native trees and plans list their files — but no friendlier command has shipped, and the downgrade-versus-stop choice on unsupported behavior exists on the underlying plan operation without a CLI flag. Update when: Make Docs ships a first-class packaging command, MCP-guided flow, or plugin surface, including the CLI flag for that choice. Guide change: replace low-level operation examples with the primary user workflow and keep operation commands as troubleshooting or maintainer detail.
- Blocked by: W18 R8 Phase 3 adapter verification. Update when: the harness folder layouts are verified against the real harnesses and support statuses move past provisional. Guide change: state where each harness's packages land without the provisional caveat.
- Blocked by: W18 R9 conformance evidence. Update when: the first generated plugin and skills-bundle outputs are validated against real harnesses. Guide change: add supported harness/output combinations and caveats.

## Related Resources

- [Running Make Docs Playbooks](./playbooks-running-make-docs-workflows.md)
- [Playbook Packaging and Harness Adapters](../developer/playbooks-development-packaging-and-harness-adapters.md)
- [Playbook Packaging and Harness Adapter Registry](../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md)
