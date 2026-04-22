#!/usr/bin/env python3
"""Scan a docs/ tree and build a relationship graph between artifacts.

Supports the archive-docs skill by automating relationship tracing
across designs, plans, work backlogs, and guides.

Python 3.9+ — stdlib only, no external dependencies.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ARTIFACT_DIRS: dict[str, str] = {
    ".assets/history": "history_record",
    "designs": "design",
    "plans": "plan",
    "work": "work",
    "guides/developer": "developer_guide",
    "guides/user": "user_guide",
}

LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")
DATE_PREFIX_RE = re.compile(r"^\d{4}-\d{2}-\d{2}-")
WAVE_PREFIX_RE = re.compile(r"^w\d+-r\d+-")
HISTORY_COORDINATE_RE = re.compile(r"\bW(\d+)\s+R(\d+)", re.IGNORECASE)
LEGACY_HISTORY_WR_RE = re.compile(r"w(\d+)-r(\d+)")
COORDINATE_RE = re.compile(r"^coordinate:\s*[\"']?([^\"'\n]+)[\"']?", re.MULTILINE)
ROUTER_FILENAMES = {"AGENTS.md", "CLAUDE.md"}
RELATED_BLOCK_RE = re.compile(
    r"^related:\s*\n((?:\s*-\s*.+\n?)+)", re.MULTILINE
)
RELATED_ITEM_RE = re.compile(r"^\s*-\s*(.+)", re.MULTILINE)
FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def extract_slug(name: str) -> str:
    """Strip date and wave prefixes, leaving the descriptive slug."""
    slug = DATE_PREFIX_RE.sub("", name)
    slug = WAVE_PREFIX_RE.sub("", slug)
    slug = slug.removesuffix(".md")
    # Also strip trailing slash for directory names
    slug = slug.rstrip("/")
    return slug


def classify_artifact(rel_path: str) -> str | None:
    """Return artifact type string or None if not in a known directory."""
    for prefix, kind in ARTIFACT_DIRS.items():
        if rel_path.startswith(prefix + "/"):
            return kind
    return None


def discover_artifacts(doc_root: Path) -> dict[str, dict[str, Any]]:
    """Walk known subdirectories and collect artifacts."""
    artifacts: dict[str, dict[str, Any]] = {}

    for sub, kind in ARTIFACT_DIRS.items():
        subdir = doc_root / sub
        if not subdir.is_dir():
            continue

        for entry in sorted(subdir.iterdir()):
            if entry.is_file() and entry.suffix == ".md":
                if entry.name in ROUTER_FILENAMES:
                    continue
                rel = str(entry.relative_to(doc_root))
                artifacts[rel] = _new_artifact(kind)
            elif entry.is_dir():
                # Directory-style artifact (plans, work)
                rel = str(entry.relative_to(doc_root)) + "/"
                artifacts[rel] = _new_artifact(kind)
                # Also index child markdown files for link extraction
                for md in sorted(entry.rglob("*.md")):
                    child_rel = str(md.relative_to(doc_root))
                    if child_rel not in artifacts:
                        artifacts[child_rel] = _new_artifact(kind)

    return artifacts


def _new_artifact(kind: str) -> dict[str, Any]:
    return {
        "type": kind,
        "upstream": [],
        "downstream": [],
        "lateral": [],
    }


def extract_links(text: str) -> list[str]:
    """Return all relative link targets from markdown text."""
    targets: list[str] = []
    for _, href in LINK_RE.findall(text):
        # Skip absolute URLs and anchors
        if href.startswith(("http://", "https://", "#", "mailto:")):
            continue
        targets.append(href)
    return targets


def extract_related(text: str) -> list[str]:
    """Extract `related:` list items from YAML frontmatter."""
    fm_match = FRONTMATTER_RE.match(text)
    if not fm_match:
        return []
    frontmatter = fm_match.group(1)
    block = RELATED_BLOCK_RE.search(frontmatter)
    if not block:
        return []
    return [m.strip() for m in RELATED_ITEM_RE.findall(block.group(1))]


def extract_history_coordinate(text: str, file_name: str) -> tuple[str, str] | None:
    """Extract W/R from history frontmatter, falling back to legacy filenames."""
    fm_match = FRONTMATTER_RE.match(text)
    if fm_match:
        coordinate_match = COORDINATE_RE.search(fm_match.group(1))
        if coordinate_match:
            wr_match = HISTORY_COORDINATE_RE.search(coordinate_match.group(1))
            if wr_match:
                return wr_match.group(1), wr_match.group(2)

    legacy_match = LEGACY_HISTORY_WR_RE.search(file_name)
    if legacy_match:
        return legacy_match.group(1), legacy_match.group(2)

    return None


def resolve_link(source_file: str, href: str, doc_root: Path) -> str | None:
    """Resolve a relative link to a doc-root-relative path, or None."""
    try:
        source = doc_root / source_file
        base = source.parent if source.is_file() else source
        resolved = (base / href).resolve()
        rel = resolved.relative_to(doc_root.resolve())
        result = str(rel)
        if resolved.is_dir():
            result += "/"
        return result
    except (ValueError, OSError):
        return None


# ---------------------------------------------------------------------------
# Relationship builders
# ---------------------------------------------------------------------------

UPSTREAM_MAP = {"work": "plan", "plan": "design"}
DOWNSTREAM_MAP = {"design": "plan", "plan": "work"}


def build_link_relationships(
    artifacts: dict[str, dict[str, Any]], doc_root: Path
) -> int:
    """Parse files for markdown links and record upstream/downstream."""
    count = 0
    artifact_keys = set(artifacts.keys())

    for art_path, art in list(artifacts.items()):
        kind = art["type"]
        # Read all markdown files under this artifact
        full = doc_root / art_path.rstrip("/")
        md_files: list[Path] = []
        if full.is_file() and full.suffix == ".md":
            md_files.append(full)
        elif full.is_dir():
            md_files.extend(sorted(full.rglob("*.md")))

        for md in md_files:
            try:
                text = md.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            src_rel = str(md.relative_to(doc_root))

            for href in extract_links(text):
                target = resolve_link(src_rel, href, doc_root)
                if target is None or target not in artifact_keys:
                    continue

                target_kind = artifacts[target]["type"]

                # Upstream: work->plan, plan->design
                if UPSTREAM_MAP.get(kind) == target_kind:
                    _add_rel(art, "upstream", target, "link", src_rel)
                    _add_rel(artifacts[target], "downstream", art_path, "link", src_rel)
                    count += 1
                # Downstream: design->plan, plan->work
                elif DOWNSTREAM_MAP.get(kind) == target_kind:
                    _add_rel(art, "downstream", target, "link", src_rel)
                    _add_rel(artifacts[target], "upstream", art_path, "link", src_rel)
                    count += 1

    return count


def build_lateral_relationships(
    artifacts: dict[str, dict[str, Any]], doc_root: Path
) -> int:
    """Parse guide frontmatter `related:` entries."""
    count = 0
    artifact_keys = set(artifacts.keys())

    for art_path, art in list(artifacts.items()):
        if art["type"] not in ("developer_guide", "user_guide"):
            continue
        full = doc_root / art_path
        if not full.is_file():
            continue
        try:
            text = full.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue

        for related in extract_related(text):
            target = resolve_link(art_path, related, doc_root)
            if target and target in artifact_keys:
                _add_rel(art, "lateral", target, "link", art_path)
                _add_rel(artifacts[target], "lateral", art_path, "link", art_path)
                count += 1

    return count


def build_history_record_associations(
    artifacts: dict[str, dict[str, Any]], doc_root: Path
) -> int:
    """Match history record coordinates to plans/work in the same wave/revision."""
    count = 0
    records = {k: v for k, v in artifacts.items() if v["type"] == "history_record"}
    others = {k: v for k, v in artifacts.items() if v["type"] in ("plan", "work")}

    for record_path, record_art in records.items():
        full = doc_root / record_path
        if not full.is_file():
            continue
        try:
            text = full.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue

        coordinate = extract_history_coordinate(text, Path(record_path).name)
        if not coordinate:
            continue

        wave, revision = coordinate
        wr_re = re.compile(rf"w{re.escape(wave)}-r{re.escape(revision)}")
        for other_path, other_art in others.items():
            if wr_re.search(Path(other_path.rstrip("/")).name):
                _add_rel(record_art, "lateral", other_path, "link", record_path)
                _add_rel(other_art, "lateral", record_path, "link", record_path)
                count += 1

    return count


def build_heuristic_relationships(
    artifacts: dict[str, dict[str, Any]],
) -> int:
    """Match artifacts by slug when no explicit link exists."""
    count = 0
    slug_map: dict[str, list[str]] = {}

    for art_path in artifacts:
        name = Path(art_path.rstrip("/")).name
        slug = extract_slug(name)
        if slug:
            slug_map.setdefault(slug, []).append(art_path)

    for slug, paths in slug_map.items():
        if len(paths) < 2:
            continue
        for i, a in enumerate(paths):
            for b in paths[i + 1 :]:
                a_art = artifacts[a]
                b_art = artifacts[b]
                # Skip if already linked
                if _already_linked(a_art, b):
                    continue
                direction = _heuristic_direction(a_art["type"], b_art["type"])
                _add_rel(a_art, direction, b, "heuristic", a)
                _add_rel(b_art, _inverse(direction), a, "heuristic", b)
                count += 1

    return count


def _heuristic_direction(src_type: str, tgt_type: str) -> str:
    if UPSTREAM_MAP.get(src_type) == tgt_type:
        return "upstream"
    if DOWNSTREAM_MAP.get(src_type) == tgt_type:
        return "downstream"
    return "lateral"


def _inverse(direction: str) -> str:
    return {"upstream": "downstream", "downstream": "upstream"}.get(
        direction, "lateral"
    )


def _already_linked(art: dict[str, Any], target: str) -> bool:
    for direction in ("upstream", "downstream", "lateral"):
        for rel in art[direction]:
            if rel["target"] == target:
                return True
    return False


def _add_rel(
    art: dict[str, Any],
    direction: str,
    target: str,
    via: str,
    source_file: str,
) -> None:
    for existing in art[direction]:
        if existing["target"] == target:
            return  # deduplicate
    art[direction].append(
        {"target": target, "via": via, "source_file": source_file}
    )


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------


def format_text(data: dict[str, Any]) -> str:
    lines: list[str] = []
    for path, art in sorted(data["artifacts"].items()):
        lines.append(f"\n{path}  ({art['type']})")
        for direction in ("upstream", "downstream", "lateral"):
            for rel in art[direction]:
                lines.append(
                    f"  {direction:>12} -> {rel['target']}  [{rel['via']}]"
                )
    s = data["summary"]
    lines.append(
        f"\nTotal artifacts: {s['total_artifacts']}  |  "
        f"Relationships: {s['relationships_found']}  |  "
        f"Heuristic: {s['heuristic_matches']}"
    )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="Trace relationships between doc artifacts."
    )
    parser.add_argument(
        "--doc-root", default="docs/", help="Root docs directory (default: docs/)"
    )
    parser.add_argument(
        "--target",
        default=None,
        help="Show relationships for a single artifact path only.",
    )
    parser.add_argument(
        "--format",
        choices=["json", "text"],
        default="json",
        dest="fmt",
        help="Output format (default: json).",
    )
    args = parser.parse_args(argv)

    doc_root = Path(args.doc_root).resolve()
    if not doc_root.is_dir():
        print(f"Error: doc root '{doc_root}' is not a directory.", file=sys.stderr)
        sys.exit(1)

    artifacts = discover_artifacts(doc_root)

    link_count = build_link_relationships(artifacts, doc_root)
    link_count += build_lateral_relationships(artifacts, doc_root)
    link_count += build_history_record_associations(artifacts, doc_root)
    heuristic_count = build_heuristic_relationships(artifacts)

    # Filter to target if requested
    if args.target:
        target = args.target
        if target in artifacts:
            artifacts = {target: artifacts[target]}
        else:
            # Try prefix match
            matches = {k: v for k, v in artifacts.items() if k.startswith(target)}
            if matches:
                artifacts = matches
            else:
                print(f"Warning: no artifact matching '{target}'.", file=sys.stderr)
                artifacts = {}

    total_rels = sum(
        len(a["upstream"]) + len(a["downstream"]) + len(a["lateral"])
        for a in artifacts.values()
    )

    data: dict[str, Any] = {
        "artifacts": artifacts,
        "summary": {
            "total_artifacts": len(artifacts),
            "relationships_found": total_rels,
            "heuristic_matches": heuristic_count,
        },
    }

    if args.fmt == "json":
        print(json.dumps(data, indent=2))
    else:
        print(format_text(data))


if __name__ == "__main__":
    main()
