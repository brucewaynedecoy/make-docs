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
WORK_DIR_RE = re.compile(r"^\d{4}-\d{2}-\d{2}-w\d+-r\d+-[a-z0-9][a-z0-9-]*$")
WORK_PHASE_FILE_RE = re.compile(r"^(0[1-9]|[1-9]\d)-[a-z0-9][a-z0-9-]*\.md$")
ARCHIVE_DIR_RE = re.compile(r"^\d{4}-\d{2}-\d{2}(?:-\d{2})?$")
ANCHOR_RE = re.compile(r"`[^`\n]*(?:/|\\)[^`\n]*`|`[^`\n]*\.[A-Za-z0-9_-]+(?::\d+(?::\d+)?)?`")
LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
FENCE_RE = re.compile(r"^(`{3,}|~{3,})")
INLINE_CODE_RE = re.compile(r"(`{1,2})(?!`)(.+?)(?<!`)\1(?!`)")
UNESCAPED_SPACE_RE = re.compile(r"(?<!\\) ")
INSTRUCTION_FILES = {"AGENTS.md", "CLAUDE.md"}

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

BACKLOG_INDEX_RULE = {
    "required": ["Purpose", "Phase Map", "Usage Notes"],
    "anchor_sections": [],
}

BACKLOG_PHASE_RULE = {
    "required": ["Purpose", "Overview", "Source PRD Docs"],
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


def strip_code_regions(text: str) -> str:
    """Remove content inside fenced code blocks and inline code spans.

    Returns text with code regions replaced so that LINK_RE cannot match
    programming syntax that resembles Markdown links.  Line count is
    preserved (fenced-block lines become empty) so that downstream error
    reporting stays aligned with the original file.
    """
    lines = text.splitlines(keepends=True)
    result: list[str] = []
    in_fence = False
    fence_marker = ""
    for line in lines:
        stripped = line.lstrip()
        if not in_fence:
            m = FENCE_RE.match(stripped)
            if m:
                in_fence = True
                fence_marker = m.group(1)[0] * len(m.group(1))
                result.append("\n")
                continue
        else:
            m = FENCE_RE.match(stripped)
            # CommonMark: closing fence must use the same character and be at least as long.
            if m and m.group(1)[0] == fence_marker[0] and len(m.group(1)) >= len(fence_marker):
                in_fence = False
                fence_marker = ""
                result.append("\n")
                continue
            result.append("\n")
            continue
        result.append(INLINE_CODE_RE.sub("", line))
    return "".join(result)


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
    if not archive_root.exists():
        return
    if not archive_root.is_dir():
        errors.append(f"{archive_root}: docs/assets/archive/prds must be a directory")
        return
    for entry in sorted(archive_root.iterdir()):
        if entry.name.startswith("."):
            continue
        if entry.is_file():
            errors.append(f"{entry}: docs/assets/archive/prds must contain dated directories only")
            continue
        if not entry.is_dir():
            errors.append(f"{entry}: unexpected entry in docs/assets/archive/prds")
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
        if child.name.startswith(".") or child.name in INSTRUCTION_FILES:
            continue
        if child.name == "archive":
            errors.append(
                f"{child}: legacy archive namespace is no longer supported; use docs/assets/archive/prds/"
            )
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
        if path.name in INSTRUCTION_FILES:
            continue
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


def validate_work_phase_doc(
    path: Path,
    text: str,
    sections: dict[str, str],
    errors: list[str],
) -> None:
    validate_required_sections(path, sections, BACKLOG_PHASE_RULE["required"], errors)

    if not any(title.startswith("Stage ") for title in sections):
        errors.append(f"{path}: work phase must contain at least one '## Stage ...' section")

    for heading in ("### Tasks", "### Acceptance criteria", "### Dependencies"):
        if heading not in text:
            errors.append(f"{path}: missing required work-phase subsection '{heading}'")


def validate_assets_archive(repo_root: Path, errors: list[str]) -> None:
    validate_archive_root(repo_root / "docs" / "assets" / "archive" / "prds", errors)


def validate_backlog(repo_root: Path, errors: list[str]) -> None:
    work_root = repo_root / "docs" / "work"
    if not work_root.exists():
        errors.append(f"{work_root}: missing docs/work directory")
        return

    entries = [
        entry
        for entry in sorted(work_root.iterdir())
        if not entry.name.startswith(".") and entry.name not in INSTRUCTION_FILES
    ]
    if not entries:
        errors.append(f"{work_root}: no work backlog directory found")
        return

    valid_entries = 0
    for entry in entries:
        if entry.is_file():
            errors.append(
                f"{entry}: backlog entries must be directories named YYYY-MM-DD-w{{W}}-r{{R}}-<slug>"
            )
            continue

        if entry.is_dir():
            if not WORK_DIR_RE.match(entry.name):
                errors.append(
                    f"{entry}: work directories must use YYYY-MM-DD-w{{W}}-r{{R}}-<slug> naming"
                )
                continue
            valid_entries += 1
            index_file = entry / "00-index.md"
            if not index_file.is_file():
                errors.append(f"{index_file}: work directory must contain 00-index.md")
            else:
                sections = parse_sections(index_file.read_text())
                validate_required_sections(index_file, sections, BACKLOG_INDEX_RULE["required"], errors)
            phase_file_count = 0
            for nested in sorted(entry.iterdir()):
                if nested.name.startswith(".") or nested.name in INSTRUCTION_FILES:
                    continue
                if nested == index_file:
                    continue
                if nested.is_dir():
                    errors.append(f"{nested}: work directories must not contain nested directories")
                    continue
                if nested.suffix != ".md":
                    errors.append(f"{nested}: work directory entries must be markdown files")
                    continue
                if not WORK_PHASE_FILE_RE.match(nested.name):
                    errors.append(f"{nested}: work phase files must use 01-<slug>.md style naming")
                    continue
                phase_file_count += 1
                text = nested.read_text()
                sections = parse_sections(text)
                validate_work_phase_doc(nested, text, sections, errors)
            if phase_file_count == 0:
                errors.append(
                    f"{entry}: work directory must contain at least one phase file using 01-<slug>.md naming"
                )
            continue

        errors.append(f"{entry}: unexpected entry in docs/work")

    if valid_entries == 0:
        errors.append(f"{work_root}: no valid work backlog directory found")


def is_plausible_link_target(target: str) -> bool:
    """Return False if *target* cannot be a filesystem path.

    Acts as a safety net for bracket-paren code patterns that survive
    code-region stripping (e.g. unbalanced backticks in source material).
    """
    if "," in target:
        return False
    if "..." in target:
        return False
    if target and (target[0] in "'\"" or target[-1] in "'\""):
        return False
    if UNESCAPED_SPACE_RE.search(target):
        return False
    return True


def _check_links_in_tree(
    root: Path,
    repo_root_resolved: Path,
    errors: list[str],
    exclude_prefixes: Iterable[Path] = (),
) -> None:
    for path in markdown_files(root, exclude_prefixes=exclude_prefixes):
        text = strip_code_regions(path.read_text())
        for raw_target in LINK_RE.findall(text):
            target = raw_target.strip()
            if not target or target.startswith("#") or "://" in target or target.startswith("mailto:"):
                continue
            if not is_plausible_link_target(target):
                continue
            target_path = target.split("#", 1)[0]
            resolved = (path.parent / target_path).resolve()
            if not is_relative_to(resolved, repo_root_resolved):
                errors.append(f"{path}: link escapes repo root -> {raw_target}")
                continue
            if not resolved.exists():
                errors.append(f"{path}: broken link -> {raw_target}")


def validate_links(repo_root: Path, errors: list[str]) -> None:
    prd_root = repo_root / "docs" / "prd"
    work_root = repo_root / "docs" / "work"
    resolved_root = repo_root.resolve()
    _check_links_in_tree(prd_root, resolved_root, errors, exclude_prefixes=[prd_root / "archive"])
    _check_links_in_tree(work_root, resolved_root, errors)


def build_result(repo_root: Path) -> dict[str, object]:
    errors: list[str] = []

    validate_prd_structure(repo_root, errors)
    validate_prd_docs(repo_root, errors)
    validate_assets_archive(repo_root, errors)
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
