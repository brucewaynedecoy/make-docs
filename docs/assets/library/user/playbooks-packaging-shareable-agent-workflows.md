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

In practice, a user should expect Make Docs to show a package plan before writing generated outputs. If a plan needs review, non-interactive runs should stop before writing.

## Output Choices

The planned output kinds are:

- `plugin`: a harness-specific plugin package or plugin payload.
- `skills-bundle`: a bundle of generated skills for a harness that supports skills.

The planned surface choices are:

- `native`: use the harness's own plugin or skill location.
- `agents-standard`: use a standard agent skill location when the selected harness supports it.
- `auto`: let the harness adapter pick the best valid surface from the user's scope and the harness's rules.

The harness is still a real harness, such as Codex, Claude Code, or a future supported harness. A standard location is a surface that a harness may support, not a separate generic harness.

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

The result is JSON. Save the returned `plan` object and inspect the `status`, `stops`, `review`, and `support` fields before writing.

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

To perform the write, add `--write`. The command writes generated plugin or skills-bundle payloads only when the plan is accepted or deterministic and safe. It stops instead of overwriting modified generated files, and installed outputs require an existing Make Docs manifest so backup and uninstall can track the generated files.

Export-only packages are written under `.make-docs/exports/playbook-packages/**`. They are not treated as installed harness exposures.

## What This Does Not Mean

Packaging is not required for every Playbook. A Playbook can still be run directly by a person, agent, CLI, MCP tool, or future plugin surface.

Packaging also does not mean every workflow bundle becomes its own plugin. A single first-party Make Docs plugin might expose several workflow families, while a user-authored Playbook might become a small standalone skills bundle.

Support is evidence-bound. A generated package should not claim support for a harness until Make Docs has implementation or conformance evidence for that exact output shape.

## Future Coverage

- Blocked by: W18 R5 downstream UX surfaces. Update when: Make Docs ships a friendlier first-class packaging command, MCP tool, or plugin surface beyond the current operation commands. Guide change: replace low-level operation examples with the primary user workflow and keep operation commands as troubleshooting or maintainer detail.
- Blocked by: W18 R5 conformance evidence. Update when: the first generated plugin and skills-bundle outputs are validated. Guide change: add supported harness/output combinations and caveats.

## Related Resources

- [Running Make Docs Playbooks](./playbooks-running-make-docs-workflows.md)
- [Playbook Packaging and Harness Adapters](../developer/playbooks-development-packaging-and-harness-adapters.md)
- [Playbook Packaging and Harness Adapter Registry](../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
