# CLI Runtime and Command Boundary

## Installer-Maintainer Role

The TypeScript package CLI keeps ownership of:

- project install and sync;
- reconfigure;
- selected-skills maintenance;
- backup and uninstall;
- audit review and compatibility classification;
- package/template validation;
- migration flows;
- deterministic operation domains;
- required MCP behavior.

## Agent Automation Role

The TypeScript CLI/MCP operation-domain destination owns:

- deterministic inspection;
- validation;
- asset resolution through accepted materialization contracts;
- generation preparation;
- script-replacement helpers;
- typed agent access to make-docs contracts.

## Public Command Guardrails

- Keep the no-command workflow meaningful.
- Do not reintroduce `init`, `update`, `--reconfigure`, or `--skills` as accepted public paths.
- Do not make `npx` command-router-first.
- Ensure package-runner and persistent-install environments expose clear package/runtime output before public support.

## Transition Rule

CLI and MCP dispatch may be thin, but deterministic behavior must live in shared TypeScript operation domains and must not become separate behavior models.
