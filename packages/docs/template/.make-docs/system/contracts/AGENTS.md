<!-- make-docs:begin -->
# System Contracts Router

This always-local directory routes current Make Docs contracts. A contract defines reusable rules and constraints. Contract bodies are optional local projections.

- Use a valid local contract body first. If it is absent, read `make-docs://system/contract/<posix-relative-path>` with `make-docs resource read`.
- Read `system-resource-contract.md` before you add or change a resource root, catalog entry, identity, or workflow composition.
- Read only the other contract needed for the task.
- Use `.make-docs/system/references/` for explanatory workflow guidance and `.make-docs/system/templates/` for reusable output shapes.
- Use `naive-uat-contract.md` for Unassisted Goal Testing policy. Keep that policy out of routers, prompts, and Skills.
- Do not write generated project documentation here.
- Do not infer optional Skills, plugins, Playbooks, Protocols, or unavailable policy from this router.
<!-- make-docs:end -->
