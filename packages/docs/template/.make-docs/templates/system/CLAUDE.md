<!-- make-docs:begin -->
# Templates Router

This directory contains template system resources. A template is a reusable output shape.

- Copy the relevant template shape into the target output file; do not write outputs here.
- Use `design.md` for design docs, `guide-developer.md` or `guide-user.md` for guides, and the matching `plan-*`, `prd-*`, or `work-*` template for the target artifact.
- Use `naive-uat-scenario.md` for the canonical PRD scenario and its operator and tester views.
- Resolve workflow questions in `.make-docs/references/system/` and contract questions in `.make-docs/contracts/system/`, then continue in the target output directory router.
- Use `.make-docs/prompts/system/` for first-class prompts.
- Do not modify template files unless the user explicitly asks.
<!-- make-docs:end -->
