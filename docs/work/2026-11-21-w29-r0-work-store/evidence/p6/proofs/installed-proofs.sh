#!/bin/bash
# W29 R0 P6 installed proofs: T2 to T5, the MCP check, and the owner samples, on one installed candidate.
# It never touches the real Store: every step sets MAKE_DOCS_HOME and HOME to folders below the work folder,
# and it refuses a work folder inside ~/.make-docs. It never runs setup on the source repository; it clones it.
# Usage: bash installed-proofs.sh <new empty work folder> <installed make-docs bin> <git repo to clone> <pre-Wave CLI entry> <MCP SDK esm dir>
#   The MCP SDK esm dir is the candidate's own dependency: <install>/node_modules/@modelcontextprotocol/sdk/dist/esm
set -u
F=$1; MD=$2; SRC=$3; PRE=$4; SDK=$5
HERE=$(cd "$(dirname "$0")" && pwd)
case "$F" in "$HOME/.make-docs"*) echo "The work folder is inside the real Store." >&2; exit 2;; esac
mkdir -p "$F/home"
export HOME=$F/home CODEX_HOME=$F/home/.codex CLAUDE_CONFIG_DIR=$F/home/.claude
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@e GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@e
NONE=(--codex-method none --claude-code-method none --github-copilot-method none)
SUM=$HERE/sum.mjs
md() { "$MD" "$@" 2>&1 | node "$SUM"; }
rev() { node "$HERE/rev.mjs" "$MD" "$@"; }
step() { echo; echo "### $*"; }
field() { node -e 'const r=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const v=process.argv[2].split(".").reduce((o,k)=>o?.[k],r);console.log(typeof v==="object"?JSON.stringify(v):v)' "$1" "$2"; }
# The fixture backlog: one index and two phase files.
fixture_backlog() {
  local d="$1/docs/work/2042-06-01-w1-r0-aurora"
  mkdir -p "$d"
  printf -- '---\ntitle: "W1 R0 Aurora"\nkind: "work"\nstatus: "active"\ncoordinate: "W1 R0"\n---\n\n# W1 R0 Aurora\n' > "$d/00-index.md"
  printf -- '---\ntitle: "Phase 1: First"\nkind: "work"\nstatus: "active"\ncoordinate: "W1 R0 P1"\n---\n\n# Phase 1: First\n\n## Stage 1 - Build\n\n### Tasks\n\n- [ ] T1: Build the parser.\n- [ ] T2: Write the writer.\n\n### Dependencies\n\n- None.\n\n## Stage 2 - Check\n\n### Tasks\n\n- [ ] T3: Check it.\n\n### Dependencies\n\n- Stage 1.\n- The owner approves this package.\n' > "$d/01-first.md"
  printf -- '---\ntitle: "Phase 2: Second"\nstatus: "active"\ncoordinate: "W1 R0 P2"\n---\n\n# Phase 2: Second\n\n### Blockers\n\n- The owner has not chosen a schema format.\n\n## Stage 1 - Ship\n\n### Tasks\n\n- [ ] T1: Ship it.\n' > "$d/02-second.md"
}
echo "candidate: $("$MD" --version)"

echo; echo "================ T2a: clean fixture project"
export MAKE_DOCS_HOME=$F/store-fixture
mkdir -p "$F/fixture" && cd "$F/fixture" && git init -q -b main && fixture_backlog . && git add -A && git commit -qm init
"$MD" setup --yes "${NONE[@]}" > "$F/t2a-setup.json" 2>&1; echo "setup exit=$? status=$(field "$F/t2a-setup.json" status) store=$(field "$F/t2a-setup.json" store.state)"
step "first work command: work status"; md work status
step "first import: work sync"; md work sync
echo "work files changed by first import: [$(git status --porcelain -- docs/work/2042-06-01-w1-r0-aurora)]"
step "work next --level task"; md work next --level task

echo; echo "================ T2b: temporary copy of the repository"
export MAKE_DOCS_HOME=$F/store-repo
git clone -q --no-hardlinks "$SRC" "$F/repo" && cd "$F/repo"
echo "commit: $(git rev-parse --short=8 HEAD)"
"$MD" setup --yes "${NONE[@]}" > "$F/t2b-setup1.json" 2>&1; echo "setup (no --adopt) status=$(field "$F/t2b-setup1.json" status): $(field "$F/t2b-setup1.json" failedCondition)"
"$MD" setup --yes --adopt "${NONE[@]}" > "$F/t2b-setup2.json" 2>&1; echo "setup --adopt exit=$? status=$(field "$F/t2b-setup2.json" status)"
echo "changed by setup: $(git status --porcelain | tr '\n' ' ')"
git commit -qam "temp: harness methods none"
step "first import"; md work sync
echo "work files changed by first import: [$(git status --porcelain -- docs/work .make-docs/archive/work)]"
step "work status"; md work status

echo; echo "================ T3: two checkouts that share git, one Store"
A=$F/repo; B=$F/repo-b
cd "$A" && fixture_backlog . && git add -A && git commit -qm "aurora backlog"
step "A: a new backlog arrives in git"; md work sync
git worktree add -q "$B" -b team-b && cd "$B"
"$MD" project checkout preview --json > "$F/t3-prev.json" 2>&1
step "B: register a separate checkout"; md project checkout apply --review "$(field "$F/t3-prev.json" separateReviewDigest)"
"$MD" setup --yes --adopt "${NONE[@]}" > "$F/t3-setup.json" 2>&1; echo "B setup --adopt status=$(field "$F/t3-setup.json" status)"
step "B: first sync"; md work sync
BR=$(git -C "$A" branch --show-current)
cd "$A"; R=$(rev "W1 R0 P1 T1")
step "A: claim and close W1 R0 P1 T1 through the store"
"$MD" work claim "W1 R0 P1 T1" --claimant builder-a --task-handle task-a --expected-version "$R" --json > "$F/t3-claim.json"; node "$SUM" < "$F/t3-claim.json" | sed 's/wc-[0-9a-f]*/wc-<id>/'
md work close "W1 R0 P1 T1" --claim-id "$(field "$F/t3-claim.json" claimId)" --expected-version "$(field "$F/t3-claim.json" revision)"
step "A: sync writes the file (write row)"; md work sync; git diff -U0 docs/work | grep '^[-+]-'
git commit -qam "A closes T1"
cd "$B"; git merge -q --no-edit "$BR"
step "B: git brings A's write (same work on both sides)"; md work sync
step "B: a hand edit clears the P2 blocker"
node -e 'const f="docs/work/2042-06-01-w1-r0-aurora/02-second.md";const fs=require("fs");fs.writeFileSync(f,fs.readFileSync(f,"utf8").replace("### Blockers\n\n- The owner has not chosen a schema format.\n\n",""))'
git commit -qam "B clears blocker"
cd "$A"; git merge -q --no-edit team-b
step "A: work next names the pending import (read-only check)"; "$MD" work next --json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s);console.log(r.sync.summary)})'
step "A: sync imports B's edit (import row)"; md work sync
"$MD" work next --json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s);console.log("W1 ready:",r.ready.filter(u=>u.coordinate.startsWith("W1 ")).map(u=>u.coordinate).join(", "))})'
git commit -qam "A imports" > /dev/null 2>&1
cd "$B"; git merge -q --no-edit "$BR"; md work sync > /dev/null
cd "$A"; R=$(rev "W1 R0 P1 T2")
step "A: close W1 R0 P1 T2 and sync, not yet in git"; md work close "W1 R0 P1 T2" --expected-version "$R"; md work sync
cd "$B"
F1=docs/work/2042-06-01-w1-r0-aurora/01-first.md
step "B: hand edit of the same file: both-changed conflict stops"
sed -i '' 's/- \[ \] T3: Check it\./- [ ] T3: Check it twice./' "$F1"
OUT=$("$MD" work sync 2>&1 | node "$SUM"); echo "$OUT"
REVB=$(echo "$OUT" | sed -n 's/^Store: revision \([0-9]*\),.*/\1/p')
step "B: work status shows the conflict and its settle choices"; md work status
step "B: settle with a stale revision is refused"; md work sync --settle "$F1" --keep-store --expected-revision $((REVB-1))
step "B: settle --keep-store"; md work sync --settle "$F1" --keep-store --expected-revision "$REVB"; git diff -U0 "$F1" | grep '^[-+]-'
git commit -qam "B settles"; cd "$A"; git commit -qam "A writes T2"; git merge -q --no-edit team-b; md work sync; cd "$B"; git merge -q --no-edit "$BR"; md work sync > /dev/null
F2=docs/work/2042-06-01-w1-r0-aurora/02-second.md
step "B: a person deletes a work file: file-deleted conflict"; rm "$F2"; md work sync
step "B: settle --restore"; md work sync --settle "$F2" --restore; echo "file back: $(test -f "$F2" && echo yes)"
step "B: delete again, settle --accept-deletion"; rm "$F2"; md work sync > /dev/null; md work sync --settle "$F2" --accept-deletion
git commit -qam "B accepts deletion"
step "A: next sync removes its unchanged copy (remove-copy row)"; cd "$A"; md work sync; git commit -qam "A removes copy"; git merge -q --no-edit team-b; cd "$B"; git merge -q --no-edit "$BR"; md work sync > /dev/null
cd "$A"
printf -- '---\ntitle: "Phase 3: Third"\nkind: "work"\nstatus: "active"\ncoordinate: "W1 R0 P3"\n---\n\n# Phase 3: Third\n\n## Stage 1 - Polish\n\n### Tasks\n\n- [ ] T1: Polish the parser.\n- [ ] T2: Polish the writer.\n' > docs/work/2042-06-01-w1-r0-aurora/03-third.md
git add -A; git commit -qm "A adds P3"; md work sync > /dev/null
R=$(rev "W1 R0 P3 T1")
step "A: claim W1 R0 P3 T1"; "$MD" work claim "W1 R0 P3 T1" --claimant builder-a --task-handle task-a --expected-version "$R" --json > "$F/t3-claim3.json"; node "$SUM" < "$F/t3-claim3.json" | head -1
cd "$B"; git merge -q --no-edit "$BR"; md work sync > /dev/null
F3=docs/work/2042-06-01-w1-r0-aurora/03-third.md
step "B: a hand edit checks the claimed task: claimed conflict"; sed -i '' 's/- \[ \] T1: Polish the parser\./- [x] T1: Polish the parser./' "$F3"; md work sync
step "B: --keep-file is refused for a claimed conflict"; md work sync --settle "$F3" --keep-file
step "A: the holder releases its claim"; cd "$A"; md work release "W1 R0 P3 T1" --claim-id "$(field "$F/t3-claim3.json" claimId)" --expected-version "$(field "$F/t3-claim3.json" revision)"
step "B: the next sync imports the file"; cd "$B"; md work sync
git commit -qam "B checks P3 T1"
cd "$A"; git merge -q --no-edit team-b; md work sync > /dev/null
R=$(rev "W22 R2 P4" phase)
step "A: close a phase of the held W22 R2 backlog (in this temporary clone only)"; md work close "W22 R2 P4" --expected-version "$R"; md work sync
echo "held file changed: [$(git status --porcelain -- docs/work/2026-11-13-w22-r2-portable-checkout-adoption)]"
step "A: work status names the held file"; md work status | grep -i 'held\|Sync check'
HF=$(ls docs/work/2026-11-13-w22-r2-portable-checkout-adoption/04-*.md)
step "A: a settle on a held file is refused"; md work sync --settle "$HF" --keep-store
step "B: a hand edit of a held file is read"; cd "$B"; sed -i '' 's/^title: "\(.*\)"/title: "\1 (edited)"/' docs/work/2026-11-13-w22-r2-portable-checkout-adoption/03-*.md; md work sync
step "B: an unreadable file"; cp "$F3" "$F/third.bak"; printf -- '---\ntitle: "Phase 3\n' > "$F3"; md work sync; md work status | grep -i 'cannot read\|Sync check'; cp "$F/third.bak" "$F3"; md work sync > /dev/null

echo; echo "================ T4: a project without Store access"
git clone -q --no-hardlinks "$SRC" "$F/nostore" && cd "$F/nostore"
pre() { node "$PRE" "$@"; }
norm() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);j.generatedAt="";process.stdout.write(JSON.stringify(j))})'; }
for S in absent nobind; do
  if [ "$S" = absent ]; then export MAKE_DOCS_HOME=$F/t4-absent; else export MAKE_DOCS_HOME=$F/store-fixture; fi
  echo; echo "----- Store state: $S"
  pre backlog snapshot --target-root . --json | norm > "$F/t4-snap-pre.$S"
  "$MD" backlog snapshot --target-root . --json | norm > "$F/t4-snap-cand.$S"
  "$MD" backlog snapshot --work-store --target-root . --json | norm > "$F/t4-snapws-cand.$S"
  cmp -s "$F/t4-snap-pre.$S" "$F/t4-snap-cand.$S" && echo "backlog snapshot: same as the pre-Wave build ($(wc -c < "$F/t4-snap-cand.$S") bytes)" || echo "backlog snapshot: DIFFERS from the pre-Wave build"
  cmp -s "$F/t4-snap-cand.$S" "$F/t4-snapws-cand.$S" && echo "backlog snapshot --work-store: same as the default" || echo "backlog snapshot --work-store: DIFFERS from the default"
  for c in "work item resolve|W29 R0 P4 T3" "work item resolve|docs/work/2026-11-21-w29-r0-work-store/04-work-queue-operations.md" "project paths validate" "check prd" "work evidence read|W29 R0 P4"; do
    IFS='|' read -r cmd arg <<< "$c"
    if [ -n "${arg:-}" ]; then pre $cmd "$arg" > "$F/t4.pre" 2>&1; p=$?; "$MD" $cmd "$arg" > "$F/t4.cand" 2>&1; q=$?; else pre $cmd > "$F/t4.pre" 2>&1; p=$?; "$MD" $cmd > "$F/t4.cand" 2>&1; q=$?; fi
    cmp -s "$F/t4.pre" "$F/t4.cand" && echo "$cmd ${arg:-}: same output and exit ($p $q)" || echo "$cmd ${arg:-}: DIFFERS (exit $p $q)"
  done
  pre project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption --json > "$F/t4-doc.pre" 2>&1
  "$MD" project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption --json > "$F/t4-doc.cand" 2>&1
  node -e 'const fs=require("fs");const a=JSON.parse(fs.readFileSync(process.argv[1],"utf8")),b=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));console.log("project doctor check: findings same:",JSON.stringify(a.findings)===JSON.stringify(b.findings),"files same:",JSON.stringify(a.files)===JSON.stringify(b.files),"checks:",a.checks.map(c=>c.id).join("+"),"->",b.checks.map(c=>c.id).join("+"))' "$F/t4-doc.pre" "$F/t4-doc.cand"
  step "work status"; md work status
  step "work next"; md work next
  echo "project files changed: [$(git status --porcelain)]"
  if [ "$S" = absent ]; then echo "Store made by the read commands: $(test -e "$F/t4-absent" && echo yes || echo no)"; fi
done
step "work evidence read with the config from before W29 (no work block), no Store"
export MAKE_DOCS_HOME=$F/t4-absent-old-config
cp .make-docs/config.yaml "$F/config.bak"
node -e 'const f=".make-docs/config.yaml";const fs=require("fs");fs.writeFileSync(f,fs.readFileSync(f,"utf8").replace(/# Sync reads[\s\S]*$/,""))'
pre work evidence read "W29 R0 P4" --json > "$F/t4.pre" 2>&1; p=$?; "$MD" work evidence read "W29 R0 P4" --json > "$F/t4.cand" 2>&1; q=$?
cmp -s "$F/t4.pre" "$F/t4.cand" && echo "work evidence read: same output and exit ($p $q)" || echo "work evidence read: DIFFERS (exit $p $q)"
cp "$F/config.bak" .make-docs/config.yaml

echo; echo "================ T5: a folder without git"
export MAKE_DOCS_HOME=$F/store-nogit
mkdir -p "$F/nogit" && fixture_backlog "$F/nogit" && cd "$F/nogit"
echo "git: $(git rev-parse --git-dir 2>&1 | head -1)"
"$MD" setup --yes "${NONE[@]}" > "$F/t5-setup.json" 2>&1; echo "setup status=$(field "$F/t5-setup.json" status)"
step "work sync"; md work sync
R=$(rev "W1 R0 P1 T1")
step "work next --level task"; md work next --level task
step "work claim"; "$MD" work claim "W1 R0 P1 T1" --claimant solo --expected-version "$R" --json > "$F/t5-claim.json"; node "$SUM" < "$F/t5-claim.json" | sed 's/wc-[0-9a-f]*/wc-<id>/'
CID=$(field "$F/t5-claim.json" claimId)
step "work report"; "$MD" work report "W1 R0 P1 T1" --claim-id "$CID" --status in-progress --note "Parser reads the front matter." --expected-version "$(field "$F/t5-claim.json" revision)" --json > "$F/t5-rep.json"; node "$SUM" < "$F/t5-rep.json"
step "work close"; md work close "W1 R0 P1 T1" --claim-id "$CID" --expected-version "$(field "$F/t5-rep.json" revision)"
step "work sync"; md work sync; grep -n 'T1:' docs/work/2042-06-01-w1-r0-aurora/01-first.md

echo; echo "================ MCP on the installed package"
export MAKE_DOCS_HOME=$F/store-mcp
mkdir -p "$F/mcpproj" && fixture_backlog "$F/mcpproj" && cd "$F/mcpproj" && git init -q
"$MD" setup system --yes "${NONE[@]}" --generic-mcp-client live-client --target . --json > "$F/mcp-sys.json" 2>&1
"$MD" setup --yes "${NONE[@]}" --generic-mcp-client live-client --json > "$F/mcp-setup.json" 2>&1; echo "setup status=$(field "$F/mcp-setup.json" status)"
node -e 'const r=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));require("fs").writeFileSync(process.argv[2],JSON.stringify(r.genericMcp.configuration.mcpServers["make-docs"].env))' "$F/mcp-sys.json" "$F/mcp-env.json"
md work sync > /dev/null
node "$HERE/mcp-proof.mjs" "$SDK" "$MD" "$F/mcpproj" "$F/mcp-env.json" 2>&1 | sed 's/wc-[0-9a-f]*/wc-<id>/'

echo; echo "================ Owner samples (fixture project)"
export MAKE_DOCS_HOME=$F/store-sample
mkdir -p "$F/sample" && fixture_backlog "$F/sample" && cd "$F/sample" && git init -q
"$MD" setup --yes "${NONE[@]}" > /dev/null 2>&1; md work sync > /dev/null
R=$(rev "W1 R0 P1 T1"); "$MD" work claim "W1 R0 P1 T1" --claimant builder-a --task-handle task-a --expected-version "$R" --json > /dev/null
"$MD" work add "Compare two printers" > /dev/null 2>&1
step "SAMPLE work next --level task"; md work next --level task
step "SAMPLE work status"; md work status
