#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

warnings=0

report_warning() {
  printf 'WARNING: %s\n' "$1" >&2
  warnings=1
}

check_directory() {
  local dir="$1"

  if [[ ! -d "$dir" ]]; then
    return
  fi

  local waves=""

  for entry in "$dir"/*/; do
    [[ -d "$entry" ]] || continue
    local name
    name="$(basename "$entry")"

    local wave_rev
    wave_rev="$(echo "$name" | grep -oE 'w[0-9]+-r[0-9]+' | head -1)" || true

    if [[ -z "$wave_rev" ]]; then
      continue
    fi

    local existing
    existing="$(echo "$waves" | grep "^${wave_rev}:" | head -1)" || true

    if [[ -n "$existing" ]]; then
      local prev_name="${existing#*:}"
      report_warning "$dir has duplicate $wave_rev: $prev_name and $name"
    else
      waves="${waves}${wave_rev}:${name}"$'\n'
    fi
  done
}

for base in . packages/docs/template; do
  check_directory "$base/docs/plans"
  check_directory "$base/docs/work"
done

if (( warnings )); then
  echo "Wave numbering check completed with warnings (review duplicates above)."
  exit 0
fi

echo "Wave numbering check passed."
