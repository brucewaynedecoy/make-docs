set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

default:
    @just --list

build:
    npm run build -w starter-docs

dev:
    npm run dev -w starter-docs

test:
    npm test -w starter-docs

validate-defaults:
    npm run validate:defaults -w starter-docs

smoke-pack:
    node scripts/smoke-pack.mjs

check-instruction-routers:
    bash scripts/check-instruction-routers.sh

check-wave-numbering:
    bash scripts/check-wave-numbering.sh

validate: test check-instruction-routers check-wave-numbering
