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

- `make-docs run uat persona resolve`
- `make-docs run uat target validate`
- `make-docs run uat scenario validate`
- `make-docs run uat evidence-reference validate`
- `make-docs run uat finding validate`
- `make-docs run uat result validate`

Pass the workflow records to those operations. Use their results in the governing workflow.
This Skill is a CLI entry point. The shared resources and operations own the workflow rules.
