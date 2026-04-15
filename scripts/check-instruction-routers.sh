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

line_budget_for() {
  case "$1" in
    ./AGENTS.md|./CLAUDE.md) echo 5 ;;
    ./docs/AGENTS.md|./docs/CLAUDE.md) echo 15 ;;
    *) echo 30 ;;
  esac
}

while IFS= read -r agent_file; do
  dir="$(dirname "$agent_file")"
  claude_file="$dir/CLAUDE.md"

  if [[ ! -f "$claude_file" ]]; then
    report_error "missing pair for $agent_file"
    continue
  fi

  if ! cmp -s "$agent_file" "$claude_file"; then
    report_error "$agent_file and $claude_file differ"
  fi

  for file in "$agent_file" "$claude_file"; do
    max_lines="$(line_budget_for "$file")"
    line_count="$(wc -l < "$file" | tr -d ' ')"
    if (( line_count > max_lines )); then
      report_error "$file has $line_count lines; budget is $max_lines"
    fi

    if [[ "$file" != "./AGENTS.md" && "$file" != "./CLAUDE.md" ]]; then
      for heading in "${banned_headings[@]}"; do
        if grep -Fxq "$heading" "$file"; then
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
