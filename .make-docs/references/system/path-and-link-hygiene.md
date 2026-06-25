# Path and Link Hygiene

## Purpose

Use this reference when writing, reviewing, or repairing project documentation that mentions repository files, generated documentation links, local runtime paths, or diagnostic paths.

Documentation should be portable across checkouts, machines, and users. Do not write local checkout paths into project documentation when a project-relative path communicates the same information.

## Project Path Rules

- Use project-relative paths for files inside the repository.
- Prefer paths such as `README.md`, `./README.md`, `docs/prd/00-index.md`, or `src/main.rs`.
- Use relative Markdown links between project documents.
- Do not include real checkout paths such as `/Users/<name>/projects/repo/README.md`, `/home/<name>/projects/repo/README.md`, `C:\Users\<name>\projects\repo\README.md`, or `/mnt/c/Users/<name>/projects/repo/README.md`.
- Do not include machine-local temporary paths such as `/private/var/folders/<id>/...` or `/var/folders/<id>/...` unless they are necessary diagnostic evidence and are sanitized.

## Namespace Hygiene

- Treat `docs/assets/**` as the managed project documentation asset namespace, not a catch-all for runtime state or hidden tool resources.
- Optional pre-design source material lives under `docs/assets/artifacts/**`; top-level `docs/artifacts/**` is a hard-move migration source, not a shipped target.
- Managed archive storage lives under `docs/assets/archive/**`; top-level `docs/archive/**` is not a shipped target.
- History and breadcrumb records live under `docs/assets/archive/history/**` and are created on demand.
- Reader-facing library and playbook assets live under `docs/assets/library/**` and `docs/assets/playbooks/**`.
- System tool resources live under `.make-docs/contracts/system/**`, `.make-docs/references/system/**`, `.make-docs/templates/system/**`, `.make-docs/scripts/system/**`, and `.make-docs/agentics/**`.
- Reusable prompt starters are classified under `.make-docs/references/system/prompts/**`; do not preserve a shipped `.make-docs/prompts/**` family by default.
- Runtime state belongs under `.make-docs/**`, especially `.make-docs/manifest.json` and `.make-docs/conflicts/<run-id>/`.

## Allowed Absolute Path Forms

Absolute paths are allowed only when the path is not a repository file path or when the absolute location is the subject of the documentation. Examples include platform storage locations, external tool conventions, or diagnostic evidence that cannot be made relative.

When an absolute path is warranted, prefer sanitized placeholders:

- `<repo-root>/docs/prd/00-index.md`
- `<user-home>/.config/pile/config.toml`
- `$HOME/.local/share/pile`
- `~/.pile/profiles/default.toml`
- `%APPDATA%\pile\config.toml`
- `<temp-dir>/runtime/trace.log`

If a real absolute path must remain for a specific audit reason, add an inline allow comment on the same line or the previous line:

```markdown
<!-- make-docs-path-hygiene: allow retained diagnostic evidence from user-provided log -->
```

Use the allow comment sparingly. The reason must explain why a project-relative path or sanitized placeholder would lose necessary evidence.

## Repair Policy

- Convert paths under the current repository root to project-relative paths.
- In Markdown link destinations, use plain relative destinations such as `docs/prd/00-index.md`.
- In inline code or prose path literals, use `./docs/prd/00-index.md` when the leading `./` helps signal repository-relative intent.
- Convert user-home examples to placeholders such as `<user-home>`, `$HOME`, or `~` when the exact username is not meaningful.
- Convert temporary path examples to `<temp-dir>/...` when the exact machine-local path is not meaningful.
- Preserve absolute paths only when they describe external behavior or required evidence, and document the exception with the allow comment.

## Validation

Use `.make-docs/scripts/check_path_hygiene.py` to audit Make Docs-managed documentation. The script reports real checkout paths, user-home paths, local temporary paths, and absolute local Markdown links. Run it before finalizing broad documentation updates or when repairing path hygiene drift.
