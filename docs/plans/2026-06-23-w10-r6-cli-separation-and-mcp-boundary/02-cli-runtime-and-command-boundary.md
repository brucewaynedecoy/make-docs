# CLI Runtime and Command Boundary

## Installer-Maintainer Role

The TypeScript npm CLI keeps ownership of:

- project install and sync;
- reconfigure;
- selected-skills maintenance;
- backup and uninstall;
- audit review and compatibility classification;
- package/template validation;
- future migration flows until Rust parity is explicitly planned and validated.

## Agent Automation Role

The Rust CLI/MCP destination owns:

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
- Ensure dual-runtime environments expose clear version/runtime output before public support.

## Transition Rule

TypeScript may bridge setup for Rust or MCP during transition, but bridge behavior must not become a separate long-term behavior model.
