# Contributing to Make Docs

Thanks for helping improve Make Docs. Open an issue before starting a large change so maintainers can agree on its scope.

## Make a change

1. Fork the repository and create a branch for your change.
2. Make the smallest useful change. Update the relevant docs and tests.
3. Run `npm ci`, `npm run build`, `npm test`, and `npm run validate:defaults` from the repository root.
4. Open a pull request against `main`. Explain the change and list the checks you ran.

Make Docs keeps the published CLI in `packages/cli` and its shipped template in `packages/docs/template`. Changes to shipped Make Docs resources belong in the template first. The maintainer repo also uses an installed copy of that template. See [AGENTS.md](AGENTS.md) for that source rule.

Pull requests need a passing **PR merge gate** check. A maintainer must approve before merge. The code owners may ask for changes. Outside contributor workflows need maintainer approval before they run.

Maintainers can follow [RELEASING.md](RELEASING.md) to publish a new npm version.

## Report a security issue

Do not open a public issue for a suspected security flaw. Follow [SECURITY.md](SECURITY.md) instead.
