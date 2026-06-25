#!/usr/bin/env python3
"""Persona schema defaults and validation helpers for coverage probes."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any


PRIMITIVES = {"agent", "maintainer", "user"}
SLUG_RE = re.compile(r"^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$")
DEFAULT_PERSONAS: list[dict[str, str]] = [
    {
        "slug": "agent",
        "label": "Agent",
        "description": "Agents executing make-docs workflows, coverage passes, closeout, and lifecycle tasks.",
        "primitive": "agent",
    },
    {
        "slug": "developer",
        "label": "Developer",
        "description": "Maintainers, contributors, integrators, operators, validation owners, and extension authors.",
        "primitive": "maintainer",
    },
    {
        "slug": "user",
        "label": "User",
        "description": "People using the shipped product, reading task guidance, or adopting a documented workflow.",
        "primitive": "user",
    },
]
VERDICTS = ["create", "update-existing", "link-only", "none"]
PERSONA_SCOPED_ROOTS = ("docs/assets/library", "docs/assets/playbooks")


def validate_personas(personas: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    seen: set[str] = set()
    required = ("slug", "label", "description", "primitive")
    for index, entry in enumerate(personas):
        if not isinstance(entry, dict):
            errors.append(f"personas[{index}] must be an object")
            continue
        for field in required:
            value = entry.get(field)
            if not isinstance(value, str) or not value.strip():
                errors.append(f"personas[{index}].{field} must be a non-empty string")
        slug = entry.get("slug")
        if isinstance(slug, str):
            if not SLUG_RE.fullmatch(slug):
                errors.append(f"personas[{index}].slug must be lowercase kebab-case: {slug}")
            if slug in seen:
                errors.append(f"personas[{index}].slug must be unique: {slug}")
            seen.add(slug)
        primitive = entry.get("primitive")
        if isinstance(primitive, str) and primitive not in PRIMITIVES:
            errors.append(f"personas[{index}].primitive must be one of {sorted(PRIMITIVES)}: {primitive}")
    return errors


def persona_map(personas: list[dict[str, Any]] | None = None) -> dict[str, dict[str, Any]]:
    entries = DEFAULT_PERSONAS if personas is None else personas
    return {entry["slug"]: entry for entry in entries if isinstance(entry.get("slug"), str)}


def coverage_axes(personas: list[dict[str, Any]] | None = None) -> dict[str, list[str]]:
    return {
        "verdicts": VERDICTS,
        "personaTargets": sorted(persona_map(personas).keys()),
    }


def persona_slug_from_path(repo_root: Path, path: Path) -> str | None:
    rel = path.relative_to(repo_root).as_posix()
    for root in PERSONA_SCOPED_ROOTS:
        prefix = f"{root}/"
        if not rel.startswith(prefix):
            continue
        remainder = rel[len(prefix):].split("/")
        if len(remainder) < 2 or remainder[0].endswith(".md"):
            return None
        return remainder[0]
    return None


def validate_persona_scoped_doc(
    repo_root: Path,
    path: Path,
    frontmatter: dict[str, Any],
    personas: list[dict[str, Any]] | None = None,
) -> list[str]:
    expected = persona_slug_from_path(repo_root, path)
    if expected is None:
        return []
    known = persona_map(personas)
    value = frontmatter.get("persona")
    if value is None:
        return [f"{path.relative_to(repo_root).as_posix()}: missing persona frontmatter"]
    if not isinstance(value, str):
        return [f"{path.relative_to(repo_root).as_posix()}: persona must be a single slug string"]
    persona = value.strip().strip("\"'")
    errors: list[str] = []
    if not SLUG_RE.fullmatch(persona):
        errors.append(f"{path.relative_to(repo_root).as_posix()}: persona must be lowercase kebab-case: {persona}")
    if persona not in known:
        errors.append(f"{path.relative_to(repo_root).as_posix()}: unknown persona: {persona}")
    if persona != expected:
        errors.append(
            f"{path.relative_to(repo_root).as_posix()}: persona frontmatter '{persona}' does not match path '{expected}'"
        )
    return errors
