#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

errors=0
banned_headings=(
  "## Files"
  "## Templates"
  "## References"
  "## Required Sections"
  "## Required Structure"
  "## PRD Template Files"
  "## Reference Documents"
  "## Structure"
  "## References and Templates"
)

report_error() {
  printf 'ERROR: %s\n' "$1" >&2
  errors=1
}

managed_block() {
  awk '
    /^<!-- make-docs:begin -->$/ {
      begin_count += 1
      if (begin_count > 1 || active) exit 2
      active = 1
      print
      next
    }
    /^<!-- make-docs:end -->$/ {
      end_count += 1
      if (end_count > 1 || !active) exit 2
      print
      active = 0
      next
    }
    active { print }
    END {
      if (begin_count != 1 || end_count != 1 || active) exit 1
    }
  ' "$1"
}

check_managed_block_parser() {
  local fixture_dir valid stray_before stray_after
  fixture_dir="$(mktemp -d)"
  valid="$fixture_dir/valid.md"
  stray_before="$fixture_dir/stray-before.md"
  stray_after="$fixture_dir/stray-after.md"

  printf '%s\n' '<!-- make-docs:begin -->' '# Valid' '<!-- make-docs:end -->' >"$valid"
  printf '%s\n' '<!-- make-docs:end -->' '<!-- make-docs:begin -->' '# Invalid' '<!-- make-docs:end -->' >"$stray_before"
  printf '%s\n' '<!-- make-docs:begin -->' '# Invalid' '<!-- make-docs:end -->' '<!-- make-docs:end -->' >"$stray_after"

  if ! managed_block "$valid" >/dev/null; then
    report_error "managed-block parser rejected its valid fixture"
  fi
  if managed_block "$stray_before" >/dev/null 2>&1; then
    report_error "managed-block parser accepted an end marker before its block"
  fi
  if managed_block "$stray_after" >/dev/null 2>&1; then
    report_error "managed-block parser accepted an end marker after its block"
  fi

  rm -rf "$fixture_dir"
}

line_budget_for() {
  case "$1" in
    ./AGENTS.md|./CLAUDE.md) echo 12 ;;
    ./docs/AGENTS.md|./docs/CLAUDE.md) echo 25 ;;
    *) echo 30 ;;
  esac
}

check_managed_block_parser

while IFS= read -r agent_file; do
  dir="$(dirname "$agent_file")"
  claude_file="$dir/CLAUDE.md"

  if [[ ! -f "$claude_file" ]]; then
    report_error "missing pair for $agent_file"
    continue
  fi

  agent_has_block=0
  claude_has_block=0
  agent_has_end=0
  claude_has_end=0
  grep -Fxq '<!-- make-docs:begin -->' "$agent_file" && agent_has_block=1
  grep -Fxq '<!-- make-docs:begin -->' "$claude_file" && claude_has_block=1
  grep -Fxq '<!-- make-docs:end -->' "$agent_file" && agent_has_end=1
  grep -Fxq '<!-- make-docs:end -->' "$claude_file" && claude_has_end=1

  if (( agent_has_end && !agent_has_block )); then
    report_error "$agent_file contains an end marker outside a managed block"
    continue
  fi
  if (( claude_has_end && !claude_has_block )); then
    report_error "$claude_file contains an end marker outside a managed block"
    continue
  fi

  if (( agent_has_block != claude_has_block )); then
    report_error "$agent_file and $claude_file have different ownership forms"
    continue
  fi

  if (( agent_has_block )); then
    if ! agent_block="$(managed_block "$agent_file")"; then
      report_error "$agent_file does not contain one valid managed block"
      continue
    fi
    if ! claude_block="$(managed_block "$claude_file")"; then
      report_error "$claude_file does not contain one valid managed block"
      continue
    fi
    if [[ "$agent_block" != "$claude_block" ]]; then
      report_error "$agent_file and $claude_file managed blocks differ"
    fi
  else
    agent_block="$(cat "$agent_file")"
    claude_block="$(cat "$claude_file")"
    if [[ "$agent_block" != "$claude_block" ]]; then
      report_error "$agent_file and $claude_file differ"
    fi
  fi

  for file in "$agent_file" "$claude_file"; do
    if [[ "$file" == "$agent_file" ]]; then
      managed_block_contents="$agent_block"
    else
      managed_block_contents="$claude_block"
    fi
    max_lines="$(line_budget_for "$file")"
    line_count="$(printf '%s\n' "$managed_block_contents" | wc -l | tr -d ' ')"
    if (( line_count > max_lines )); then
      report_error "$file managed block has $line_count lines; budget is $max_lines"
    fi

    if [[ "$file" != "./AGENTS.md" && "$file" != "./CLAUDE.md" ]]; then
      for heading in "${banned_headings[@]}"; do
        if grep -Fxq "$heading" <<<"$managed_block_contents"; then
          report_error "$file contains banned heading: $heading"
        fi
      done
    fi
  done
done < <(find . -type f -name AGENTS.md | sort)

while IFS= read -r claude_file; do
  agent_file="$(dirname "$claude_file")/AGENTS.md"
  if [[ ! -f "$agent_file" ]]; then
    report_error "missing pair for $claude_file"
  fi
done < <(find . -type f -name CLAUDE.md | sort)

if (( errors )); then
  exit 1
fi

echo "Instruction router check passed."
