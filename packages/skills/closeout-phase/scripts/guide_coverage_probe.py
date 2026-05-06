#!/usr/bin/env python3
"""Summarize existing guides before closeout guide decisions."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)
TITLE_RE = re.compile(r"^title:\s*[\"']?([^\"'\n]+)[\"']?", re.MULTILINE)
RELATED_BLOCK_RE = re.compile(r"^related:\s*\n((?:\s*-\s*.+\n?)+)", re.MULTILINE)
RELATED_ITEM_RE = re.compile(r"^\s*-\s*(.+)", re.MULTILINE)
TOKEN_RE = re.compile(r"[a-z0-9]{3,}")


def tokenize(value: str) -> set[str]:
    return set(TOKEN_RE.findall(value.lower()))


def parse_frontmatter(text: str) -> dict[str, Any]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        return {"title": None, "related": []}
    frontmatter = match.group(1)
    title_match = TITLE_RE.search(frontmatter)
    related_match = RELATED_BLOCK_RE.search(frontmatter)
    return {
        "title": title_match.group(1).strip() if title_match else None,
        "related": [
            item.strip().strip("\"'")
            for item in RELATED_ITEM_RE.findall(related_match.group(1) if related_match else "")
        ],
    }


def guide_summary(repo_root: Path, path: Path, query_tokens: set[str]) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8", errors="replace")
    frontmatter = parse_frontmatter(text)
    headings = [match.group(1).strip() for match in re.finditer(r"^##+\s+(.+)$", text, re.MULTILINE)]
    rel = path.relative_to(repo_root).as_posix()
    own_tokens = tokenize(f"{rel} {frontmatter.get('title') or ''} {' '.join(headings)}")
    overlap = sorted(query_tokens.intersection(own_tokens))
    return {
        "path": rel,
        "audience": "developer" if "/developer/" in f"/{rel}" else "user",
        "title": frontmatter.get("title") or next((line[2:].strip() for line in text.splitlines() if line.startswith("# ")), path.stem),
        "related": frontmatter.get("related", []),
        "headings": headings[:12],
        "overlap": overlap,
        "score": len(overlap),
    }


def changed_terms(repo_root: Path, changed_files_json: str | None, explicit_terms: list[str]) -> set[str]:
    terms = tokenize(" ".join(explicit_terms))
    if not changed_files_json:
        return terms
    data = json.loads(Path(changed_files_json).read_text(encoding="utf-8"))
    for file in data.get("files", []):
        terms.update(tokenize(file.get("path", "")))
    return terms


def collect_guides(repo_root: Path, query_tokens: set[str]) -> list[dict[str, Any]]:
    guides: list[dict[str, Any]] = []
    for subdir in [repo_root / "docs" / "guides" / "developer", repo_root / "docs" / "guides" / "user"]:
        if not subdir.is_dir():
            continue
        for path in sorted(subdir.glob("*.md")):
            if path.name in {"AGENTS.md", "CLAUDE.md"}:
                continue
            guides.append(guide_summary(repo_root, path, query_tokens))
    guides.sort(key=lambda item: (-item["score"], item["path"]))
    return guides


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=".", help="Repository root.")
    parser.add_argument("--changed-files-json", help="JSON output from closeout_probe.py.")
    parser.add_argument("--term", action="append", default=[], help="Extra search term for guide overlap.")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    query_tokens = changed_terms(repo_root, args.changed_files_json, args.term)
    guides = collect_guides(repo_root, query_tokens)
    print(
        json.dumps(
            {
                "repoRoot": str(repo_root),
                "queryTokens": sorted(query_tokens),
                "guides": guides,
                "candidates": [guide for guide in guides if guide["score"] > 0][:10],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
