set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

cli_dir        := "packages/cli"
cli_version    := `node -p "require('./packages/cli/package.json').version"`

default:
    @just --list

build:
    npm run build -w make-docs

dev:
    npm run dev -w make-docs

test:
    npm test -w make-docs

install-cli-pack:
    cd {{cli_dir}} && npm run prepack
    cd {{cli_dir}} && npm pack
    cd {{cli_dir}} && npm install -g ./make-docs-{{cli_version}}.tgz

install-cli-link: build
    cd {{cli_dir}} && npm run build
    cd {{cli_dir}} && npm link

validate-defaults:
    npm run validate:defaults -w make-docs

smoke-pack:
    node scripts/smoke-pack.mjs

check-instruction-routers:
    bash scripts/check-instruction-routers.sh

check-wave-numbering:
    bash scripts/check-wave-numbering.sh

validate: test check-instruction-routers check-wave-numbering
