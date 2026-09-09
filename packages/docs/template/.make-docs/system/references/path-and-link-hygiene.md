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

- Use `docs/artifacts/**` for optional, non-authoritative source and analysis inputs.
- Use `.make-docs/archive/**` for Make Docs-managed archive and provenance records.
- Use `docs/assets/<persona-slug>/**` for Persona-scoped reader assets. Use `docs/assets/<persona-slug>/testing/**` for Unassisted Goal Testing packets, runs, findings, and approved evidence.
- Treat `docs/assets/archive/**`, `docs/assets/archive/history/**`, `docs/assets/artifacts/**`, `docs/assets/library/**`, and `docs/assets/playbooks/**` as legacy migration inputs, not current shipped targets.
- Current selected local resource projections live under `.make-docs/system/<resource-type>/**`. Installed-provider resources remain available without a local projection.
- Routers, scripts, selected agentic payloads, declarative config, and backup or conflict file copies are not content-resource types.
- Make Docs installation and operation state belongs only in the global Make Docs Store, managed through the CLI. Applied ownership, hashes, migration receipts, locks, conflict decisions, and recovery metadata must not live in project folders.
- `.make-docs/manifest.json` and `.make-docs/state/` are legacy CLI transfer inputs only. Never recreate them or replace them with another local operational record.
- Keep declarative project identity and desired settings in config. Project knowledge, history breadcrumbs, optional work status, and approved backup, archive, or conflict file copies remain local. File copies do not authorize recovery; verified Store records do.
- Ordinary project work can continue when the CLI is unavailable or optional lifecycle capture fails. Report unavailable capture. Never claim success, write directly to the Store, queue a later write, or create local fallback state. Required Store recording for CLI-managed changes remains mandatory.
- A local `.make-docs/system/**` resource projection is optional. Its absence does not reduce installed-provider availability.

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

## Template Link Placeholders

- Use a recognized whole-link token such as `{{SOURCE_PRD_LINK_ONE}}` when a raw template cannot know the final relative target.
- Replace the token with one complete Markdown link such as `[Product Overview](../../prd/01-product-overview.md)` during generation.
- A raw-template check may defer only recognized whole-link tokens. It must still reject broken concrete links and malformed partial-link placeholders.
- A generated-document check must reject every unresolved link token and every link whose final target is missing.

## Approved URI Schemes

- Use `https:` or `http:` only for an external web resource.
- Use `mailto:` only for an external email address.
- Use `make-docs:` only for a cataloged `make-docs://system/<type>/<posix-relative-path>` resource identity.
- Reject all other URI schemes in generated documentation.

## Validation

Use `.make-docs/scripts/check_path_hygiene.py` to audit local documentation content. It needs neither the CLI nor the Store and does not read or create an installation manifest. By default it checks `docs/`, root routers and `README.md`, and selected local `.make-docs/system/` bodies. Use repeated `--path <project-relative-file-or-directory>` arguments for a narrower reviewed scope or a custom docs root. Use `--include-skills` to include installed Skill text. It skips symbolic links, backup payloads, and operational directories. The inventory selects content for a check; it is not ownership or installation evidence. The script reports real checkout paths, user-home paths, local temporary paths, and absolute local Markdown links. Run it before finalizing broad documentation updates or when repairing path hygiene drift.
