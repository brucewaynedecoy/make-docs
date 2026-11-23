---
name: naive-uat
description: Use Make Docs Unassisted Goal Testing through its shared workflow and typed CLI operations when asked to assess a user goal with a fresh executor.
---

# Unassisted Goal Testing

Read the current workflow with:

```sh
make-docs resource read make-docs://system/reference/naive-uat-workflow.md
```

Follow its linked governing resources. Use the shared CLI operations that it names.
The operation paths are:

- `make-docs check uat persona`
- `make-docs check uat target`
- `make-docs check uat scenario`
- `make-docs check uat evidence`
- `make-docs check uat finding`
- `make-docs check uat result`

Pass the workflow records to those operations. Use their results in the governing workflow.
This Skill is a CLI entry point. The shared resources and operations own the workflow rules.
