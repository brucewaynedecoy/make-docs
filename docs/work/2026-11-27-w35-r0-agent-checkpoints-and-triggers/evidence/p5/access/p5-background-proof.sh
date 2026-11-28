#!/bin/sh
# W35 R0 P5: the proof of the background mode of the git hooks inside an agent tool (standing rule 11).
# It makes one temporary project with the real hook blocks, which the real setup installs, a temporary Store at a
# fixed path, and a temporary home folder. It never uses the real Store, it reads no global git config in its own
# git commands, and it installs no hook outside its own folder.
#
# Usage, each from a plain shell and not from the agent tool:
#   sh p5-background-proof.sh prepare <work folder that does not exist yet> <make-docs command, full path> [setup method inputs]
#   sh p5-background-proof.sh hold <work folder> <seconds>
#   sh p5-background-proof.sh read <work folder> <a label for this reading>
#
# With no method inputs, setup connects no agent tool. Give the method inputs of the tool under test to prove
# that tool's own access rule, for example: --codex-method <method>.
set -eu

action=${1:?give an action: prepare, hold, or read}
work=${2:?give the work folder}
case "$work" in /*) ;; *) echo "The work folder must be a full path." >&2; exit 2 ;; esac

MAKE_DOCS_HOME="$work/store"
export MAKE_DOCS_HOME
# An empty value means the real Store, so the run stops when the value is empty.
test -n "$MAKE_DOCS_HOME"

record=docs/work/2042-06-01-w1-r0-aurora

# The folder of the run files of the project: the one folder below git-hook-runs in the temporary Store.
run_dir() {
  for md_dir in "$work"/store/git-hook-runs/*/; do
    if [ -d "$md_dir" ]; then printf '%s\n' "${md_dir%/}"; return 0; fi
  done
  return 1
}

case "$action" in
prepare)
  cli=${3:?give the full path of the make-docs command}
  shift 3
  case "$cli" in /*) ;; *) echo "The make-docs command must be a full path." >&2; exit 2 ;; esac
  [ ! -e "$work" ] || { echo "The work folder exists already: $work" >&2; exit 2; }
  [ -x "$cli" ] || { echo "The make-docs command is not there: $cli" >&2; exit 2; }

  mkdir -p "$work/project" "$work/store" "$work/home"
  : > "$work/empty.gitconfig"
  HOME="$work/home"
  USERPROFILE="$work/home"
  GIT_CONFIG_GLOBAL="$work/empty.gitconfig"
  GIT_CONFIG_SYSTEM="$work/empty.gitconfig"
  GIT_CONFIG_NOSYSTEM=1
  GIT_CEILING_DIRECTORIES="$work"
  export HOME USERPROFILE GIT_CONFIG_GLOBAL GIT_CONFIG_SYSTEM GIT_CONFIG_NOSYSTEM GIT_CEILING_DIRECTORIES

  cd "$work/project"
  git init -q --initial-branch=main
  git config user.name "Proof Author"
  git config user.email "author@example.invalid"
  git config commit.gpgsign false

  if [ "$#" -eq 0 ]; then set -- --codex-method none --claude-code-method none --github-copilot-method none; fi
  "$cli" setup --yes "$@" > "$work/setup.json"

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

  # The real hook blocks, through the real setup.
  "$cli" setup --yes --git-hooks "$@" > "$work/setup-hooks.json"
  git add -A
  git commit -q -m "The files of setup" >/dev/null 2>&1 || :

  # The shell of the agent tool does not have the variable of the temporary Store. So each hook file gets two
  # lines before the Make Docs block that set it. They change no byte of the block. Each hook file also gets one
  # line at its end that records that git ran the hook.
  for name in post-commit post-merge post-rewrite post-checkout; do
    file=".git/hooks/$name"
    [ -f "$file" ] || { echo "Setup wrote no hook file: $file" >&2; exit 1; }
    grep -q 'export MAKE_DOCS_GIT_HOOK_RUN=start' "$file" || { echo "The hook file holds no block of the background mode: $file" >&2; exit 1; }
    {
      sed -n '1p' "$file"
      printf "MAKE_DOCS_HOME='%s'\n" "$work/store"
      printf 'export MAKE_DOCS_HOME\n'
      sed '1d' "$file"
      printf "printf '%%s\\\\n' '%s' >> '%s'\n" "$name" "$work/hooks-ran.txt"
    } > "$file.new"
    mv "$file.new" "$file"
    chmod +x "$file"
  done
  : > "$work/hooks-ran.txt"
  : > "$work/readings.txt"

  cat <<DONE
The project is ready: $work/project
The Store of this proof: $work/store

The proof has three commits. The agent makes each commit itself, as one command of its own, so that the tool
starts the hook and then ends the command. Open the folder $work/project in the agent tool first.

Commit 1, with the Store held, so that the background checkpoint must outlive the command of the tool:
  a. In a plain shell: sh $0 hold $work 60
     It prints "held" and keeps the write lock of the temporary Store for 60 seconds.
  b. At once, ask the agent to change "Build the parser." to "Build parser 1." in $record/01-first.md
     and to run: git add -A && git commit -m "Commit 1"
  c. Wait until the hold ended. Then, in a plain shell: sh $0 read $work after-commit-1

Commit 2, with a free Store:
  d. Ask the agent to change "Build parser 1." to "Build parser 2." and to run: git add -A && git commit -m "Commit 2"
     Ask the agent to report each line that the commit printed.
  e. Wait 10 seconds. Then: sh $0 read $work after-commit-2

Commit 3, with a free Store:
  f. Ask the agent to change "Build parser 2." to "Build parser 3." and to run: git add -A && git commit -m "Commit 3"
     Ask the agent to report each line that the commit printed.
  g. Wait 10 seconds. Then: sh $0 read $work after-commit-3

Each reading is also kept in $work/readings.txt. How to read one reading:
  hooks that git ran     the names in hooks-ran.txt. No name means that the tool did not start the hook.
  started.json           it exists after the wait: the background checkpoint did not end. The tool stopped it.
  last.json              the last background checkpoint that ran to its end: "outcome", "exitCode", "startedAt",
                         "endedAt", "output" (what it would have printed), and "errorOutput".
                         After commit 1, "exitCode" 1 with "store-unavailable" in "errorOutput", and an end about
                         5 seconds after the start, means: the run outlived the command of the tool, waited the
                         normal time for the held Store, and gave up. That is the survival proof.
  foreground.json        it exists, with a time after the commit: this hook ran the checkpoint in the foreground,
                         because the last background run did not end. That is the fallback.
  the store              the text of task T1 in the temporary Store.

Remove the folder $work when the proof is recorded.
DONE
  ;;
hold)
  seconds=${3:?give the seconds to hold the Store}
  [ -f "$work/store/store.db" ] || { echo "The temporary Store is not there: $work/store" >&2; exit 2; }
  # One helper process takes the write lock of the temporary Store, says so, and lets go after the time.
  node -e '
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync(process.argv[1]);
db.exec("BEGIN IMMEDIATE");
console.log("held");
setTimeout(() => { db.exec("COMMIT"); db.close(); console.log("free"); }, Number(process.argv[2]) * 1000);
' "$work/store/store.db" "$seconds"
  ;;
read)
  label=${3:?give a label for this reading}
  {
    printf '=== %s, read at %s ===\n' "$label" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf 'hooks that git ran: %s\n' "$(tr '\n' ' ' < "$work/hooks-ran.txt")"
    if dir=$(run_dir); then
      for name in started.json pending.json working.json last.json foreground.json; do
        if [ -f "$dir/$name" ]; then printf '%s: %s\n' "$name" "$(cat "$dir/$name")"; else printf '%s: none\n' "$name"; fi
      done
    else
      printf 'run files: none. No hook started a checkpoint with this Store.\n'
    fi
    printf 'the store, task T1: '
    node --input-type=module -e '
import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync(process.argv[1], { readOnly: true });
console.log(db.prepare("SELECT body FROM work_units WHERE coordinate = ?").get("W1 R0 P1 T1")?.body ?? "no such unit");
' "$work/store/store.db" 2>/dev/null || printf 'not readable\n'
    printf '\n'
  } | tee -a "$work/readings.txt"
  ;;
*)
  echo "Unknown action: $action. Give prepare, hold, or read." >&2
  exit 2
  ;;
esac
