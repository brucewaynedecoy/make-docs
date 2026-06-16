# make-docs Build OS Toolkit CLI Import Strategy

> Filename: `2026-06-04-make-docs-buildos-toolkit-cli-import-strategy.md`.
> This design is a maintainer handoff for applying the Build OS toolkit CLI standard upstream in make-docs before importing managed assets back into this repository.

## Purpose

Give make-docs maintainers a concrete strategy for adopting the same packaged toolkit approach that Build OS is using for deterministic logic.
The goal is to make future Build OS imports cleaner while avoiding direct edits to make-docs-owned assets in this repository.

## Context

This Build OS repository contains make-docs-managed areas under `docs/`, `.make-docs/`, `system/docs/`, and `system/.make-docs/`.
The current Build OS work intentionally avoids changing make-docs-owned assets, references, templates, contracts, and generated artifacts in place.

The planned direction for make-docs is to eventually provide a custom Build OS installer so there is no `system/.make-docs/` directory in deployed instances.
make-docs-owned assets, scripts, references, contracts, and templates that currently sit under `system/assets/` should ultimately roll into appropriate `system/.os/` subdirectories.
Those changes should happen upstream in make-docs first, then be imported back into Build OS.

## Decision

Apply the toolkit standard in make-docs as an upstream maintainer change before importing the result into this repository.
The make-docs implementation should mirror these Build OS decisions where applicable:

| Area | Build OS decision to mirror |
| --- | --- |
| Toolkit source | First-party deterministic toolkit source lives in a clear root toolkit namespace. |
| Scripts | Scripts become thin wrappers, command routers, compatibility surfaces, or command documentation. |
| Language | Go is the default for new durable deterministic CLI logic. |
| Dependencies | Standard library first, with explicit rationale and license notes for third-party or native dependencies. |
| Runtime | Local-only by default, with service calls requiring design approval and opt-in flags. |
| Naming | Use `buildos` for Build OS identity-bearing machine names and `buildos-*` for Build OS toolkit binaries. |

The upstream make-docs design should decide whether its own generic toolkit binaries use make-docs-specific names or Build OS-specific names.
Build OS-specific installer and operating-layer tooling should use `buildos` naming.

No make-docs-owned assets should be edited directly in this Build OS phase.
That includes `.make-docs/`, `docs/assets/`, `system/.make-docs/`, and `system/docs/assets/`.

## Alternatives Considered

**Edit Build OS imported make-docs assets directly.**
Rejected because local edits would drift from the upstream source and make future imports harder to reason about.

**Wait until the full installer design is ready.**
Rejected because the deterministic toolkit standard is needed now for W1 R0 P3, and the standard can be adopted before final installer packaging decisions.

**Keep make-docs scripts separate from the Build OS toolkit strategy.**
Rejected because the same enterprise and non-technical-user concerns apply to deterministic installer, import, validation, and conversion logic.

## Consequences

Build OS can proceed with `toolkits/` and `buildos-intake` without modifying imported make-docs-owned assets.
make-docs maintainers get a reusable implementation target for future upstream work.

When make-docs later ships the custom Build OS installer and reorganized assets, Build OS should import those upstream changes into the top-level `.make-docs/` and `docs/` directories and into the nested `system/.make-docs/` and `system/docs/` directories as appropriate.
The import should also reconcile any transition from `system/.make-docs/` toward `system/.os/` ownership.

## Intended Follow-On

- Route: `maintainer-handoff`
- Next Prompt: upstream make-docs design and implementation planning.
- Why: make-docs-owned assets must change upstream and be imported back later rather than being patched directly inside this Build OS repository.
- Coordinate Handoff: Keep this Build OS W1 R2 prerequisite scoped to documentation, PRD reconciliation, and toolkit scaffold. Perform make-docs asset movement and installer work in the make-docs repository first.
