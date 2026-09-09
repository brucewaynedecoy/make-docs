<!-- make-docs:begin -->
# Make Docs System Router

This directory owns the resource catalog, the always-local router skeleton, declarative project settings, installed content, and source evidence.

- Read `.make-docs/system-resources.catalog.json` for the current resource inventory and `.make-docs/system-resources.schema.json` for its shape.
- Use `.make-docs/system/contracts/`, `.make-docs/system/prompts/`, `.make-docs/system/references/`, and `.make-docs/system/templates/` for the four current resource types.
- Use a valid local resource body first. If the body is absent, read its stable `make-docs://system/<type>/<posix-relative-path>` URI with `make-docs resource read`.
- Resource selection controls optional bodies only. It does not remove this router, `.make-docs/system/`, or any typed router.
- The installed provider supplies resource bytes when no valid local body exists. A local body must retain recorded provider and hash evidence.
- Use `.make-docs/agentics/` only for explicitly selected Skill files governed by accepted product authority.
- Make Docs installation and operation state belongs only in the global Make Docs Store, managed through the CLI. This includes applied hashes, provenance, migration receipts, locks, conflict decisions, and recovery records. Never create project-local operational state or write directly to the Store.
- Treat `.make-docs/manifest.json` and `.make-docs/state/` only as legacy CLI transfer inputs. Do not repair, recreate, or delete them by hand. Use `make-docs project state status` for state and safe next steps.
- Keep declarative identity and desired settings in project config. Local backup, conflict, and archive file copies may remain under their content contracts. Their live recovery metadata belongs in the Store.
- If the CLI is unavailable or optional lifecycle capture fails, continue ordinary project work and report capture as unavailable. Do not claim success, queue a later write, or create a local fallback. Required Store recording for CLI-managed changes remains mandatory; those changes stop safely when recording fails.
- Do not put project designs, plans, PRDs, work backlogs, archives, artifacts, guides, testing evidence, or other authored project documents here.
- Do not infer optional Skills, plugins, Playbooks, Protocols, or unavailable policy from this router.
<!-- make-docs:end -->
