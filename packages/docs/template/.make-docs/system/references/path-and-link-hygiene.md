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

- Use `docs/assets/project/**` for optional, non-authoritative source and analysis inputs.
- Use `.make-docs/archive/**` for Make Docs-managed archive and provenance records.
- Use `docs/assets/<persona-slug>/**` for Persona-scoped reader assets. Use `docs/assets/<persona-slug>/testing/**` for Unassisted Goal Testing packets, runs, findings, and approved evidence.
- Treat `docs/assets/archive/**`, `docs/assets/artifacts/**`, `docs/artifacts/**`, `docs/assets/library/**`, and `docs/assets/playbooks/**` as legacy migration inputs, not current shipped targets.
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

Use `make-docs project path-hygiene validate` to audit local documentation. The default content scope needs neither the Store nor an installation manifest. It checks `docs/`, root routers and `README.md`, and local `.make-docs/system/` bodies. Repeated `--path <project-relative-file-or-directory>` arguments replace the default roots. Use `--include-skills` to include installed Skill text. It skips symbolic links, backup payloads, and operational directories. Explicit linked or unsafe paths are errors.

Use `--scope managed` for installation checks. This requires Store inventory. An explicit `--manifest` selects legacy inventory only. Do not combine either with `--path`, or combine a manifest with content scope. A content scan is not installation evidence.

Output defaults to JSON. Use `--format text` for a readable report. Exit codes are 0 for clean results, 1 for findings, and 2 for input or file errors.

Use `make-docs project path-hygiene repair` to preview repairs. Add `--apply` to write them. Repairs change only current-project absolute paths, preserve allow comments and line endings, and keep Markdown links relative to their document. Other findings require manual review. CLI and MCP use the same operations; MCP writes require its normal write permission.

If the CLI is absent, review paths manually and report that the automated check did not run. Do not install a Python helper or create operational state for this check.

## Effective Audiences and First Assets

The only built-in Personas and primitives are `user` and `maintainer`. Both roles can be filled by humans or agents. The defaults are User (People or agents that use the project.) and Maintainer (People or agents that build, operate, maintain, or extend the project.). Each entry has `slug`, `label`, `description`, and `primitive`. Merge `.make-docs/config.yaml` entries by slug with these defaults. Built-in display fields may be omitted and inherited; supplied primitive mappings must stay fixed. Custom entries need all four fields and one of the two primitives. Absent, empty, or comment-only config and an absent or empty Persona list keep both defaults. Explicit null, wrong types, invalid YAML, duplicate/unsafe slugs, or invalid primitives are errors; do not rewrite the file to hide them. Reserve `project`, `archive`, `artifacts`, `library`, and `playbooks` as structural names. Legacy custom-name conflicts need an explicit new slug and retained-content map; never discard them silently.

`make-docs project persona list --target-root <project> --json` reads the effective set and display-field origins without Store access or project writes. Without the CLI, use the same visible defaults and local config. Audience selection does not prove tester qualification.

Fresh setup leaves `docs/assets/` absent. Create its needed shared or audience content paths on first use, with only the root instruction filenames declared by `Asset router files:` in the always-present docs router. Do not infer a harness from your own actor identity. Missing or invalid declarations require an explicit project choice for router creation; ordinary content work can continue. `make-docs project surface ensure assets` creates or safely adopts root routers through normal Store-backed ownership review. The retained `artifacts` selector ensures that same root and reports `docs/assets/project/` as a destination; it does not create an empty child or old `docs/artifacts/`.

## Reviewed Layout Recovery

Use `make-docs project layout preview` to inspect all affected files and empty directories, exact source-to-destination choices, content identities, link repairs, and blockers. Repeated `--map <source>=<destination>` options specify bounded project-relative choices. Preview is read-only. `make-docs project layout prepare --review <digest> --mode cli|manual` rechecks the digest and saves the complete operation intent and recovery evidence in the Store before any project mutation. Preparation returns an operation ID and releases its live process lock; pending Store intent still blocks conflicting supported writes.

Use `make-docs project layout apply <operation-id>` for CLI mode. For manual mode, follow the prepared instructions yourself or through an agent, then run `make-docs project layout verify <operation-id>`. Both paths verify the recorded source, destination, and link expectations. Changed bytes, collisions, ambiguous audiences, unsafe paths, missing links, new source files, or unexplained leftovers keep the operation pending. Use `make-docs project state status` and `make-docs project state recover` for the next safe action. No local receipt, queue, marker, or second state engine is permitted.

Old artifact homes move to `docs/assets/project/`. Adopted archives move to `.make-docs/archive/`. Proved Library audiences move to their effective Persona paths; map former default `developer` to `maintainer` only with proof, never infer `agent` as `maintainer`, and review custom mappings explicitly. Retired Playbooks move to `.make-docs/archive/legacy-playbooks/` as inactive history. Remove only exactly reviewed obsolete empty directories after rechecking them; preserve current required typed system-router directories. Preserve substantive historical bytes and project ownership. Record mechanical old/new link edits and verify their targets before source cleanup. Named archival and backup exclusions must be non-active provenance, not a way to keep active old families.
