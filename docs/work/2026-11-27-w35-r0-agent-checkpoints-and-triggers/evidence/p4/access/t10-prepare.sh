#!/bin/sh
# W35 R0 P4 T10: prepare one temporary project for the access proof inside an agent tool.
# It makes a temporary project, a temporary Store at a fixed path, and one test hook after a commit.
# It never uses the real Store, it reads no global git config, and it installs no hook outside its own folder.
#
# Usage: sh t10-prepare.sh <work folder that does not exist yet> <make-docs command, full path> [setup method inputs]
# Example: sh t10-prepare.sh /private/tmp/md-t10 /full/path/to/make-docs
# With no method inputs, setup connects no agent tool. Give the method inputs of the tool under test to prove
# that tool's own access rule, for example: --codex-method <method>.
set -eu

work=${1:?give a work folder that does not exist yet}
cli=${2:?give the full path of the make-docs command}
shift 2

case "$work" in /*) ;; *) echo "The work folder must be a full path." >&2; exit 2 ;; esac
case "$cli" in /*) ;; *) echo "The make-docs command must be a full path." >&2; exit 2 ;; esac
[ ! -e "$work" ] || { echo "The work folder exists already: $work" >&2; exit 2; }
[ -x "$cli" ] || { echo "The make-docs command is not there: $cli" >&2; exit 2; }

mkdir -p "$work/project" "$work/store" "$work/home"
: > "$work/empty.gitconfig"

MAKE_DOCS_HOME="$work/store"
export MAKE_DOCS_HOME
# An empty value means the real Store, so the run stops when the value is empty.
test -n "$MAKE_DOCS_HOME"
GIT_CONFIG_GLOBAL="$work/empty.gitconfig"
GIT_CONFIG_SYSTEM="$work/empty.gitconfig"
GIT_CONFIG_NOSYSTEM=1
GIT_CEILING_DIRECTORIES="$work"
export GIT_CONFIG_GLOBAL GIT_CONFIG_SYSTEM GIT_CONFIG_NOSYSTEM GIT_CEILING_DIRECTORIES

cd "$work/project"
git init -q --initial-branch=main
git config user.name "Proof Author"
git config user.email "author@example.invalid"
git config commit.gpgsign false

if [ "$#" -eq 0 ]; then set -- --codex-method none --claude-code-method none --github-copilot-method none; fi
"$cli" setup --yes "$@" > "$work/setup.json"

record=docs/work/2042-06-01-w1-r0-aurora
mkdir -p "$record"
cat > "$record/00-index.md" <<'INDEX'
---
title: "W1 R0 Aurora"
kind: "work"
status: "active"
coordinate: "W1 R0"
---

# W1 R0 Aurora
INDEX
cat > "$record/01-first.md" <<'PHASE'
---
title: "Phase 1: First"
kind: "work"
status: "active"
coordinate: "W1 R0 P1"
---

# Phase 1: First

## Stage 1 - Build

### Tasks

- [ ] T1: Build the parser.
- [ ] T2: Write the writer.
PHASE

# The first sync, from this shell and not from the agent tool.
"$cli" project checkpoint --json > "$work/first-sync.json"
git add -A
git commit -q -m "The project and its first work files"

# The test hook. It runs the checkpoint as a trigger run, keeps its answer in a file, and always exits 0.
cat > .git/hooks/post-commit <<HOOK
#!/bin/sh
# W35 R0 P4 T10 test hook. It lives only in this temporary project.
MAKE_DOCS_HOME='$work/store'
export MAKE_DOCS_HOME
'$cli' project checkpoint --event commit --json > '$work/hook-answer.json' 2> '$work/hook-errors.txt'
printf '%s\n' "\$?" > '$work/hook-exit.txt'
exit 0
HOOK
chmod +x .git/hooks/post-commit

cat <<DONE
The project is ready: $work/project
The Store of this proof: $work/store

Do these steps inside the agent tool under test:
  1. Open the folder $work/project in the agent tool.
  2. Ask the agent to change "Build the parser." to "Build the new parser." in $record/01-first.md.
  3. Ask the agent to run: git add -A && git commit -m "Change a work file"
     The agent must make the commit itself, so that the tool starts the hook.

Then read these files from a plain shell:
  $work/hook-exit.txt     the exit code of the checkpoint in the hook
  $work/hook-answer.json  the answer of the checkpoint: see the fields syncRan, syncSkipped, authority, and imported
  $work/hook-errors.txt   what the checkpoint wrote to standard error

How to read the answer:
  write      syncRan is true, and imported names the work file
  read only  syncRan is false, and syncSkipped is "read-access-only"
  nothing    authority is not "store", or the file is empty, or the hook did not run (no hook-exit.txt)

Remove the folder $work when the proof is recorded.
DONE
