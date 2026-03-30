#!/usr/bin/env python3
"""Validate decomposition outputs against the decompose-codebase contract."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Iterable


ROOT_FILE_RE = re.compile(r"^(\d{2})-[a-z0-9][a-z0-9-]*\.md$")
ROOT_DIR_RE = re.compile(r"^(\d{2})-[a-z0-9][a-z0-9-]*$")
BACKLOG_FILE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}-rebuild-backlog\.md$")
BACKLOG_DIR_RE = re.compile(r"^\d{4}-\d{2}-\d{2}-rebuild-backlog$")
ARCHIVE_DIR_RE = re.compile(r"^\d{4}-\d{2}-\d{2}(?:-\d{2})?$")
ANCHOR_RE = re.compile(r"`[^`\n]*(?:/|\\)[^`\n]*`|`[^`\n]*\.[A-Za-z0-9_-]+(?::\d+(?::\d+)?)?`")
LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")

CORE_DOC_RULES = {
    "docs/prd/00-index.md": {
        "required": [
            "Purpose",
            "Reading Order",
            "Document Map",
            "Source Anchors",
            "Audience Paths",
        ],
        "anchor_sections": ["Source Anchors"],
    },
    "docs/prd/01-product-overview.md": {
        "required": [
            "Purpose",
            "Users",
            "Key Capabilities",
            "System Boundaries",
            "Current Limitations",
            "Source Anchors",
        ],
        "anchor_sections": [
            "Users",
            "Key Capabilities",
            "System Boundaries",
            "Current Limitations",
            "Source Anchors",
        ],
    },
    "docs/prd/02-architecture-overview.md": {
        "required": [
            "Purpose",
            "Topology",
            "Module Map",
            "Runtime Boundaries",
            "Data Flow",
            "Configuration Surfaces",
            "Source Anchors",
        ],
        "anchor_sections": [
            "Topology",
            "Module Map",
            "Runtime Boundaries",
            "Data Flow",
            "Configuration Surfaces",
            "Source Anchors",
        ],
    },
    "docs/prd/03-open-questions-and-risk-register.md": {
        "required": [
            "Purpose",
            "Confirmed Drift",
            "Open Questions",
            "Rebuild Risks",
            "Source Anchors",
        ],
        "anchor_sections": [
            "Confirmed Drift",
            "Open Questions",
            "Rebuild Risks",
            "Source Anchors",
        ],
    },
    "docs/prd/04-glossary.md": {
        "required": ["Purpose", "Terms", "Source Anchors"],
        "anchor_sections": ["Source Anchors"],
    },
}

SUBSYSTEM_RULE = {
    "required": [
        "Purpose",
        "Scope",
        "Component and Capability Map",
        "Contracts and Data",
        "Integrations",
        "Rebuild Notes",
        "Source Anchors",
    ],
    "anchor_sections": [
        "Scope",
        "Component and Capability Map",
        "Contracts and Data",
        "Integrations",
        "Rebuild Notes",
        "Source Anchors",
    ],
}

REFERENCE_RULE = {
    "required": ["Purpose", "Reference", "Source Anchors"],
    "anchor_sections": ["Reference", "Source Anchors"],
}

BACKLOG_RULE = {
    "required": ["Purpose", "Dependency Order", "Phases", "Acceptance Criteria"],
    "anchor_sections": [],
}

BACKLOG_INDEX_RULE = {
    "required": ["Purpose", "Phase Map", "Usage Notes"],
    "anchor_sections": [],
}

BACKLOG_PHASE_RULE = {
    "required": ["Purpose", "Tasks", "Acceptance Criteria"],
    "anchor_sections": [],
}

REFERENCE_KEYWORDS = (
    "reference",
    "references",
    "api",
    "schema",
    "schemas",
    "config",
    "configuration",
    "contracts",
    "data-model",
    "data-models",
)


def parse_sections(text: str) -> dict[str, str]:
    sections: dict[str, list[str]] = {}
    current: str | None = None
    for line in text.splitlines():
        if line.startswith("## "):
            current = line[3:].strip()
            sections[current] = []
            continue
        if current is not None:
            sections[current].append(line)
    return {title: "\n".join(body).strip() for title, body in sections.items()}


def has_anchor(text: str) -> bool:
    return bool(ANCHOR_RE.search(text))


def is_relative_to(path: Path, base: Path) -> bool:
    try:
        path.relative_to(base)
    except ValueError:
        return False
    return True


def markdown_files(root: Path, exclude_prefixes: Iterable[Path] = ()) -> Iterable[Path]:
    if not root.exists():
        return []
    excluded = [prefix.resolve() for prefix in exclude_prefixes]
    files: list[Path] = []
    for path in sorted(root.rglob("*.md")):
        if not path.is_file():
            continue
        resolved = path.resolve()
        if any(is_relative_to(resolved, prefix) for prefix in excluded):
            continue
        files.append(path)
    return files


def classify_prd_doc(path: Path) -> str:
    relative = path.as_posix()
    if relative in CORE_DOC_RULES:
        return relative
    if "backlog" in path.name.lower():
        return "misplaced_backlog"
    lowered = "/".join(part.lower() for part in path.parts)
    if any(keyword in lowered for keyword in REFERENCE_KEYWORDS):
        return "reference"
    return "subsystem"


def validate_required_sections(
    path: Path,
    sections: dict[str, str],
    required: list[str],
    errors: list[str],
) -> None:
    for heading in required:
        if heading not in sections:
            errors.append(f"{path}: missing required section '## {heading}'")


def validate_anchor_sections(
    path: Path,
    sections: dict[str, str],
    anchor_sections: list[str],
    errors: list[str],
) -> None:
    for heading in anchor_sections:
        body = sections.get(heading)
        if body is None:
            continue
        if not has_anchor(body):
            errors.append(f"{path}: section '## {heading}' does not contain a code anchor")


def validate_archive_root(archive_root: Path, errors: list[str]) -> None:
    for entry in sorted(archive_root.iterdir()):
        if entry.name.startswith("."):
            continue
        if entry.is_file():
            errors.append(f"{entry}: docs/prd/archive must contain dated directories only")
            continue
        if not entry.is_dir():
            errors.append(f"{entry}: unexpected entry in docs/prd/archive")
            continue
        if not ARCHIVE_DIR_RE.match(entry.name):
            errors.append(
                f"{entry}: archive directories must use YYYY-MM-DD or YYYY-MM-DD-XX naming"
            )


def validate_prd_structure(repo_root: Path, errors: list[str]) -> None:
    prd_root = repo_root / "docs" / "prd"
    if not prd_root.exists():
        errors.append(f"{prd_root}: missing docs/prd directory")
        return

    required_core = [
        prd_root / "00-index.md",
        prd_root / "01-product-overview.md",
        prd_root / "02-architecture-overview.md",
        prd_root / "03-open-questions-and-risk-register.md",
        prd_root / "04-glossary.md",
    ]
    for path in required_core:
        if not path.exists():
            errors.append(f"{path}: missing required core PRD file")

    seen_prefixes: dict[int, Path] = {}
    for child in sorted(prd_root.iterdir()):
        if child.name.startswith("."):
            continue
        if child.name == "archive":
            if not child.is_dir():
                errors.append(f"{child}: docs/prd/archive must be a directory")
            else:
                validate_archive_root(child, errors)
            continue
        if child.is_file():
            if child.suffix != ".md":
                errors.append(f"{child}: unexpected non-markdown file in docs/prd root")
                continue
            match = ROOT_FILE_RE.match(child.name)
            if not match:
                errors.append(f"{child}: root PRD file must use NN-slug.md naming")
                continue
            prefix = int(match.group(1))
            if prefix in seen_prefixes:
                errors.append(f"{child}: duplicate top-level PRD prefix {prefix:02d}")
            seen_prefixes[prefix] = child
            if prefix not in {0, 1, 2, 3, 4} and not (5 <= prefix <= 97):
                errors.append(f"{child}: top-level PRD prefix must be 05-97 or a fixed core number")
            if "backlog" in child.name:
                errors.append(f"{child}: rebuild backlog files must live under docs/work, not docs/prd")
            continue

        if child.is_dir():
            match = ROOT_DIR_RE.match(child.name)
            if not match:
                errors.append(f"{child}: PRD subfolders must use NN-slug naming")
                continue
            prefix = int(match.group(1))
            if prefix in seen_prefixes:
                errors.append(f"{child}: duplicate top-level PRD prefix {prefix:02d}")
            seen_prefixes[prefix] = child
            if not (5 <= prefix <= 97):
                errors.append(f"{child}: PRD subfolder prefix must be between 05 and 97")
            for nested in sorted(child.iterdir()):
                if nested.is_dir():
                    errors.append(f"{nested}: nested PRD directories deeper than one level are not allowed")
                    continue
                if nested.suffix != ".md":
                    errors.append(f"{nested}: nested PRD entries must be markdown files")
                    continue
                if not ROOT_FILE_RE.match(nested.name):
                    errors.append(f"{nested}: nested PRD files must use NN-slug.md naming")


def validate_prd_docs(repo_root: Path, errors: list[str]) -> None:
    prd_root = repo_root / "docs" / "prd"
    for path in markdown_files(prd_root, exclude_prefixes=[prd_root / "archive"]):
        sections = parse_sections(path.read_text())
        doc_type = classify_prd_doc(path.relative_to(repo_root))
        if doc_type in CORE_DOC_RULES:
            rule = CORE_DOC_RULES[doc_type]
        elif doc_type == "misplaced_backlog":
            continue
        elif doc_type == "reference":
            rule = REFERENCE_RULE
        else:
            rule = SUBSYSTEM_RULE

        validate_required_sections(path, sections, rule["required"], errors)
        validate_anchor_sections(path, sections, rule["anchor_sections"], errors)


def validate_backlog(repo_root: Path, errors: list[str]) -> None:
    work_root = repo_root / "docs" / "work"
    if not work_root.exists():
        errors.append(f"{work_root}: missing docs/work directory")
        return

    entries = [entry for entry in sorted(work_root.iterdir()) if not entry.name.startswith(".")]
    if not entries:
        errors.append(f"{work_root}: no rebuild backlog file or folder found")
        return

    valid_entries = 0
    for entry in entries:
        if entry.is_file():
            if not BACKLOG_FILE_RE.match(entry.name):
                errors.append(f"{entry}: backlog files must use YYYY-MM-DD-rebuild-backlog.md naming")
                continue
            valid_entries += 1
            sections = parse_sections(entry.read_text())
            validate_required_sections(entry, sections, BACKLOG_RULE["required"], errors)
            continue

        if entry.is_dir():
            if not BACKLOG_DIR_RE.match(entry.name):
                errors.append(f"{entry}: backlog folders must use YYYY-MM-DD-rebuild-backlog naming")
                continue
            valid_entries += 1
            index_file = entry / "00-index.md"
            if not index_file.exists():
                errors.append(f"{index_file}: split backlog folder must contain 00-index.md")
            else:
                sections = parse_sections(index_file.read_text())
                validate_required_sections(index_file, sections, BACKLOG_INDEX_RULE["required"], errors)
            for nested in sorted(entry.iterdir()):
                if nested == index_file:
                    continue
                if nested.is_dir():
                    errors.append(f"{nested}: split backlog folders must not contain nested directories")
                    continue
                if nested.suffix != ".md":
                    errors.append(f"{nested}: split backlog entries must be markdown files")
                    continue
                if not ROOT_FILE_RE.match(nested.name):
                    errors.append(f"{nested}: split backlog phase files must use NN-slug.md naming")
                    continue
                sections = parse_sections(nested.read_text())
                validate_required_sections(nested, sections, BACKLOG_PHASE_RULE["required"], errors)
            continue

        errors.append(f"{entry}: unexpected entry in docs/work")

    if valid_entries == 0:
        errors.append(f"{work_root}: no valid backlog file or folder found")


def validate_links(repo_root: Path, errors: list[str]) -> None:
    prd_root = repo_root / "docs" / "prd"
    work_root = repo_root / "docs" / "work"
    for path in markdown_files(prd_root, exclude_prefixes=[prd_root / "archive"]):
        text = path.read_text()
        for raw_target in LINK_RE.findall(text):
            target = raw_target.strip()
            if not target or target.startswith("#") or "://" in target or target.startswith("mailto:"):
                continue
            target_path = target.split("#", 1)[0]
            resolved = (path.parent / target_path).resolve()
            if not is_relative_to(resolved, repo_root.resolve()):
                errors.append(f"{path}: link escapes repo root -> {raw_target}")
                continue
            if not resolved.exists():
                errors.append(f"{path}: broken link -> {raw_target}")

    for path in markdown_files(work_root):
        text = path.read_text()
        for raw_target in LINK_RE.findall(text):
            target = raw_target.strip()
            if not target or target.startswith("#") or "://" in target or target.startswith("mailto:"):
                continue
            target_path = target.split("#", 1)[0]
            resolved = (path.parent / target_path).resolve()
            if not is_relative_to(resolved, repo_root.resolve()):
                errors.append(f"{path}: link escapes repo root -> {raw_target}")
                continue
            if not resolved.exists():
                errors.append(f"{path}: broken link -> {raw_target}")


def build_result(repo_root: Path) -> dict[str, object]:
    errors: list[str] = []

    validate_prd_structure(repo_root, errors)
    validate_prd_docs(repo_root, errors)
    validate_backlog(repo_root, errors)
    validate_links(repo_root, errors)

    return {
        "repo_root": str(repo_root),
        "ok": not errors,
        "error_count": len(errors),
        "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", required=True, help="Repository root to validate.")
    parser.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
        help="Output format.",
    )
    args = parser.parse_args()

    repo_root = Path(args.repo_root).expanduser().resolve()
    result = build_result(repo_root)
    if args.format == "json":
        print(json.dumps(result, indent=2))
    else:
        if result["ok"]:
            print(f"OK: {repo_root}")
        else:
            print(f"FAILED: {repo_root}")
            for error in result["errors"]:
                print(f"- {error}")
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
