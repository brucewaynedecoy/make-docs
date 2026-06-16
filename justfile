set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

cli_dir        := "packages/cli"
cli_version    := `node -p "require('./packages/cli/package.json').version"`

default:
    @just --list

build:
    npm run build -w packages/cli

dev:
    npm run dev -w packages/cli

test:
    npm test -w packages/cli

install-cli-pack:
    cd {{cli_dir}} && npm run prepack
    cd {{cli_dir}} && npm pack
    cd {{cli_dir}} && npm install -g ./brucewaynedecoy-make-docs-{{cli_version}}.tgz

install-cli-link: build
    cd {{cli_dir}} && npm run build
    cd {{cli_dir}} && npm link

validate-defaults:
    npm run validate:defaults -w packages/cli

smoke-pack:
    node scripts/smoke-pack.mjs

check-instruction-routers:
    bash scripts/check-instruction-routers.sh

check-wave-numbering:
    bash scripts/check-wave-numbering.sh

validate: test check-instruction-routers check-wave-numbering
