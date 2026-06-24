#!/usr/bin/env python3
"""Summarize existing guides before closeout guide decisions."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

import persona_schema


FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)
TITLE_RE = re.compile(r"^title:\s*[\"']?([^\"'\n]+)[\"']?", re.MULTILINE)
PERSONA_RE = re.compile(r"^persona:\s*[\"']?([^\"'\n]+)[\"']?", re.MULTILINE)
RELATED_BLOCK_RE = re.compile(r"^related:\s*\n((?:\s*-\s*.+\n?)+)", re.MULTILINE)
RELATED_ITEM_RE = re.compile(r"^\s*-\s*(.+)", re.MULTILINE)
TOKEN_RE = re.compile(r"[a-z0-9]{3,}")


def tokenize(value: str) -> set[str]:
    return set(TOKEN_RE.findall(value.lower()))


def parse_frontmatter(text: str) -> dict[str, Any]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        return {"title": None, "persona": None, "related": []}
    frontmatter = match.group(1)
    title_match = TITLE_RE.search(frontmatter)
    persona_match = PERSONA_RE.search(frontmatter)
    related_match = RELATED_BLOCK_RE.search(frontmatter)
    return {
        "title": title_match.group(1).strip() if title_match else None,
        "persona": persona_match.group(1).strip() if persona_match else None,
        "related": [
            item.strip().strip("\"'")
            for item in RELATED_ITEM_RE.findall(related_match.group(1) if related_match else "")
        ],
    }


def legacy_persona_for_path(relative_path: str) -> str | None:
    if "/developer/" in f"/{relative_path}":
        return "developer"
    if "/user/" in f"/{relative_path}":
        return "user"
    return None


def guide_summary(repo_root: Path, path: Path, query_tokens: set[str]) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8", errors="replace")
    frontmatter = parse_frontmatter(text)
    headings = [match.group(1).strip() for match in re.finditer(r"^##+\s+(.+)$", text, re.MULTILINE)]
    rel = path.relative_to(repo_root).as_posix()
    persona = frontmatter.get("persona") or legacy_persona_for_path(rel)
    persona_entry = persona_schema.persona_map().get(persona or "")
    own_tokens = tokenize(f"{rel} {frontmatter.get('title') or ''} {' '.join(headings)}")
    overlap = sorted(query_tokens.intersection(own_tokens))
    return {
        "path": rel,
        "audience": persona or "unknown",
        "persona": persona,
        "primitive": persona_entry.get("primitive") if persona_entry else None,
        "title": frontmatter.get("title") or next((line[2:].strip() for line in text.splitlines() if line.startswith("# ")), path.stem),
        "related": frontmatter.get("related", []),
        "headings": headings[:12],
        "overlap": overlap,
        "score": len(overlap),
        "personaValidationErrors": persona_schema.validate_persona_scoped_doc(repo_root, path, frontmatter),
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
    guide_dirs = [
        repo_root / "docs" / "guides" / "developer",
        repo_root / "docs" / "guides" / "user",
    ]
    asset_guides = repo_root / "docs" / "assets" / "guides"
    if asset_guides.is_dir():
        guide_dirs.extend(path for path in sorted(asset_guides.iterdir()) if path.is_dir())
    for subdir in guide_dirs:
        if not subdir.is_dir():
            continue
        for path in sorted(subdir.glob("*.md")):
            if path.name in {"AGENTS.md", "CLAUDE.md"}:
                continue
            guides.append(guide_summary(repo_root, path, query_tokens))
    guides.sort(key=lambda item: (-item["score"], item["path"]))
    return guides


def collect_persona_scoped_docs(repo_root: Path) -> list[Path]:
    paths: list[Path] = []
    for root in [
        repo_root / "docs" / "assets" / "guides",
        repo_root / "docs" / "assets" / "playbooks",
    ]:
        if not root.is_dir():
            continue
        for path in sorted(root.glob("*/*.md")):
            if path.name in {"AGENTS.md", "CLAUDE.md"}:
                continue
            paths.append(path)
    return paths


def persona_validation_report(repo_root: Path) -> dict[str, Any]:
    errors: list[dict[str, Any]] = []
    schema_errors = persona_schema.validate_personas(persona_schema.DEFAULT_PERSONAS)
    if schema_errors:
        errors.append({"path": None, "errors": schema_errors})
    for path in collect_persona_scoped_docs(repo_root):
        frontmatter = parse_frontmatter(path.read_text(encoding="utf-8", errors="replace"))
        path_errors = persona_schema.validate_persona_scoped_doc(repo_root, path, frontmatter)
        if path_errors:
            errors.append({"path": path.relative_to(repo_root).as_posix(), "errors": path_errors})
    return {
        "status": "passed" if not errors else "failed",
        "errors": errors,
    }


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
                "coverageAxes": persona_schema.coverage_axes(),
                "repoRoot": str(repo_root),
                "queryTokens": sorted(query_tokens),
                "personas": persona_schema.DEFAULT_PERSONAS,
                "personaValidation": persona_validation_report(repo_root),
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
