<!-- make-docs:begin -->
# Make Docs System Router

This directory owns the current resource catalog, four resource roots, setup routers, selected Skill files, project settings, manifest records, and source evidence.

- Read `.make-docs/system-resources.catalog.json` for the current resource inventory and `.make-docs/system-resources.schema.json` for its shape.
- Use `.make-docs/contracts/system/` for contracts.
- Read prompts by stable `make-docs://system/prompt/<posix-relative-path>` URI with `make-docs resource read`; a local projection is optional.
- Use `.make-docs/references/system/` for references.
- Use `.make-docs/templates/system/` for templates.
- Give all four resource types the same catalog standing and stable `make-docs://system/<type>/<posix-relative-path>` identity.
- Use the installed provider by default. It is the installed source that supplies resource bytes. A local `.make-docs/system/**` projection is optional and must retain recorded source and hash evidence.
- Use `.make-docs/scripts/system/` for deterministic helper scripts when they exist; `.make-docs/scripts/check_path_hygiene.py` remains a local bootstrap helper during migration.
- Use `.make-docs/agentics/` only for explicitly selected Skill files governed by accepted PRDs.
- Do not put project designs, plans, PRDs, work backlogs, archives, artifacts, guides, testing evidence, or other authored project documents here.
- Keep project state in `.make-docs/manifest.json`, `.make-docs/conflicts/`, and project config. General lifecycle run state and work-execution evidence live in the machine Store at `~/.make-docs/`. Do not copy runtime state into `docs/assets/`.
- Physically preserved Playbook or Protocol files are legacy migration inputs. Their presence does not make them current resources or product capabilities.
<!-- make-docs:end -->
