<!-- make-docs:begin -->
# System References Router

This directory stores Make Docs references. A reference explains a workflow or gives context without replacing its governing contract.

- Read only the specific reference file needed for the task.
- Use these files to resolve structure, lifecycle, and workflow questions instead of restating those rules in routers.
- Use `lifecycle.md` for the lifecycle arc, default stage ordering, derive-from-backlog principle, and skip/reorder/revisit handling.
- Use `naive-uat-workflow.md` to compose the Naive-UAT contract, prompts, and scenario template.
- Use `.make-docs/contracts/system/coverage-pass-contract.md` for shared coverage-pass skeleton, verdict mapping, persona-target separation, history idempotency, and close-of-pass validation rules.
- Use `path-and-link-hygiene.md` for repo-relative path rules, relative Markdown links, sanitized placeholders, and full-path exceptions.
- Read first-class prompt resources by stable `make-docs://system/prompt/<posix-relative-path>` URI with `make-docs resource read`. Do not store prompts below the reference root.
- Do not treat this directory as an output target.
- Do not modify reference files unless the user explicitly asks.
<!-- make-docs:end -->
