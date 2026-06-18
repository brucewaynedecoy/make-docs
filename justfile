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
    npm uninstall -g @brucewaynedecoy/make-docs make-docs >/dev/null 2>&1 || true
    bin_path="$(npm prefix -g)/bin/make-docs"; if [ -L "$bin_path" ]; then target="$(readlink "$bin_path")"; case "$target" in *"/node_modules/make-docs/"*|*"/node_modules/@brucewaynedecoy/make-docs/"*) rm "$bin_path";; esac; fi
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
