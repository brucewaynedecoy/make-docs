set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

cli_dir        := "packages/cli"
cli_version    := `node -p "require('./packages/cli/package.json').version"`

default:
    @just --list

build:
    npm run build -w starter-docs

dev:
    npm run dev -w starter-docs

test:
    npm test -w starter-docs

install-cli: build
    cd {{cli_dir}}
    npm run prepack
    npm pack
    npm install -g ./starter-docs-{{cli_version}}.tgz

validate-defaults:
    npm run validate:defaults -w starter-docs

smoke-pack:
    node scripts/smoke-pack.mjs

check-instruction-routers:
    bash scripts/check-instruction-routers.sh

check-wave-numbering:
    bash scripts/check-wave-numbering.sh

validate: test check-instruction-routers check-wave-numbering
