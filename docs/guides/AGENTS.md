# Guides for Devs and Users

Use `docs/guides` only as a router. Do not create generated files directly in this directory.

- Before writing any guide, read `docs/assets/references/guide-contract.md`, inspect existing guides for overlap, and decide whether the right outcome is `developer`, `user`, `both`, `update-existing`, `link-only`, or `none`.
- **User guides** are stored in `docs/guides/user/`. They explain the shipped product from a user's perspective, from novice orientation through advanced workflows. Use `docs/assets/templates/guide-user.md` when creating one.
- **Developer guides** are stored in `docs/guides/developer/`. They help contributors, maintainers, integrators, and operators navigate the codebase, docs, contracts, validation, extension points, and safe-change workflows. Use `docs/assets/templates/guide-developer.md` when creating one.
- Prefer updating an existing guide when it already owns the topic. Use cross-links and `related` frontmatter instead of duplicating full guides across audiences.
- After creating or updating guides, re-check overlapping guides and add reciprocal links, `related` frontmatter, or concise supplemental context when the new work improves their discoverability.
- If current confirmed behavior is useful but downstream work will expand it, write the current coverage now and add `## Future Coverage` for the blocked guide update.
- Do not create design docs, architecture decisions, or PRD risk-register items solely to remember future guide work.
- History records are not guides. Route them through `docs/assets/history/` instead.
- If the `docs/guides/user` or `docs/guides/developer` directories do not exist, create them ONLY when first writing a guide that belongs in the specific sub-folder.

Documentation must be easy to understand, easy to use, and easy to follow, with links to supporting sections or documents where necessary and where possible.
