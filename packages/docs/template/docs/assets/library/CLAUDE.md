<!-- make-docs:begin -->
# Legacy Library Assets

This directory is a preserved migration input. It is not a current Make Docs target.

- Do not add new shipped-current guide or Persona assets here.
- Preserve project-authored, modified, mixed, unknown, or ambiguous files for reviewed migration.
- Directory placement does not prove Persona, ownership, or current support.
- Use the current `docs/assets/<persona-slug>/` route for Persona-scoped reader assets.
- Use `.make-docs/contracts/system/guide-contract.md` and `.make-docs/contracts/system/coverage-pass-contract.md` for current guide work.
- For each guide pass, choose `developer`, `user`, `both`, `update-existing`, `link-only`, or `none` before writing.
- Always re-check overlapping guides. Add reciprocal links when each guide helps the other audience.
- Use `## Future Coverage` for downstream-dependent guide work. Do not create design docs, architecture decisions, or PRD risk-register items solely to remember future guide work.
- Treat `docs/assets/library/<persona-slug>/` and all other `docs/assets/library/**` paths as legacy inputs. Do not use them for new guides.
- Keep historical files and terms intact unless an authorized migration owns their disposition.
<!-- make-docs:end -->
