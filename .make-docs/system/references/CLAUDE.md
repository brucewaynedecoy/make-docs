<!-- make-docs:begin -->
# System References Router

This always-local directory routes Make Docs references. A reference explains a workflow or gives context without replacing its governing contract. Reference bodies are optional local projections.

- Use a valid local reference body first. If it is absent, read `make-docs://system/reference/<posix-relative-path>` with `make-docs resource read`.
- Read only the specific reference needed for the task.
- Use these resources to resolve structure, lifecycle, and workflow questions instead of restating those rules in routers.
- Use `lifecycle.md` for the lifecycle arc and `naive-uat-workflow.md` to compose the governing contract, prompts, and scenario template.
- Use `.make-docs/system/contracts/coverage-pass-contract.md` for shared coverage-pass rules.
- Use `path-and-link-hygiene.md` for project-relative path rules, relative Markdown links, safe placeholders, and full-path exceptions.
- Do not treat this directory as an output target or modify a resource body unless the user asks.
- Do not infer optional Skills, plugins, Playbooks, Protocols, or unavailable policy from this router.
<!-- make-docs:end -->
