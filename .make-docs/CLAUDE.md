<!-- make-docs:begin -->
# Make Docs System Router

This directory owns the resource catalog, the always-local router skeleton, project settings, manifest records, and source evidence.

- Read `.make-docs/system-resources.catalog.json` for the current resource inventory and `.make-docs/system-resources.schema.json` for its shape.
- Use `.make-docs/system/contracts/`, `.make-docs/system/prompts/`, `.make-docs/system/references/`, and `.make-docs/system/templates/` for the four current resource types.
- Use a valid local resource body first. If the body is absent, read its stable `make-docs://system/<type>/<posix-relative-path>` URI with `make-docs resource read`.
- Resource selection controls optional bodies only. It does not remove this router, `.make-docs/system/`, or any typed router.
- The installed provider supplies resource bytes when no valid local body exists. A local body must retain recorded provider and hash evidence.
- Use `.make-docs/agentics/` only for explicitly selected Skill files governed by accepted product authority.
- Keep project state in `.make-docs/manifest.json`, `.make-docs/conflicts/`, and project config. Do not copy runtime state into `docs/assets/`.
- Do not put project designs, plans, PRDs, work backlogs, archives, artifacts, guides, testing evidence, or other authored project documents here.
- Do not infer optional Skills, plugins, Playbooks, Protocols, or unavailable policy from this router.
<!-- make-docs:end -->
