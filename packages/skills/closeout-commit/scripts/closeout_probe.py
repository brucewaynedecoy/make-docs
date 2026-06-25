#!/usr/bin/env python3
"""Probe closeout context without broad manual repository reads.

The output is intentionally compact JSON so closeout workers can use it as the
first context boundary before deciding which files deserve direct inspection.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path
from typing import Any


COORDINATE_RE = re.compile(r"w(\d+)-r(\d+)", re.IGNORECASE)
PHASE_FILE_RE = re.compile(r"^(0[1-9]|[1-9]\d)-")
TASK_ID_RE = re.compile(r"\bt([1-9]\d*)\b", re.IGNORECASE)
RISK_HEADING_RE = re.compile(r"^###\s+([DQR])-(\d{3})\b", re.MULTILINE)


def run_git(repo_root: Path, args: list[str]) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo_root,
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        return ""
    return result.stdout


def parse_name_status(output: str, staged: bool) -> dict[str, dict[str, Any]]:
    files: dict[str, dict[str, Any]] = {}
    for line in output.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        status = parts[0]
        path = parts[-1]
        files[path] = {
            "path": path,
            "gitStatus": status,
            "staged": staged,
            "unstaged": not staged,
        }
    return files


def parse_status_short(output: str) -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    for line in output.splitlines():
        if not line:
            continue
        if line.startswith("?? "):
            entries.append({"path": line[3:], "index": "?", "workingTree": "?"})
            continue
        if len(line) >= 4:
            entries.append({"path": line[3:], "index": line[0], "workingTree": line[1]})
    return entries


def changed_files(repo_root: Path, scope: str) -> dict[str, dict[str, Any]]:
    status = parse_status_short(run_git(repo_root, ["status", "--short"]))
    staged = parse_name_status(run_git(repo_root, ["diff", "--cached", "--name-status"]), True)
    unstaged = parse_name_status(run_git(repo_root, ["diff", "--name-status"]), False)

    for entry in status:
        if entry["index"] == "?" and entry["workingTree"] == "?":
            unstaged[entry["path"]] = {
                "path": entry["path"],
                "gitStatus": "??",
                "staged": False,
                "unstaged": True,
            }

    selected_scope = scope
    if scope == "auto":
        selected_scope = "staged" if staged else "full"

    merged: dict[str, dict[str, Any]] = {}
    if selected_scope in {"staged", "full"}:
        merged.update(staged)
    if selected_scope in {"unstaged", "full"}:
        for path, data in unstaged.items():
            if path in merged:
                merged[path]["unstaged"] = True
                merged[path]["gitStatus"] = f"{merged[path]['gitStatus']}+{data['gitStatus']}"
            else:
                merged[path] = data

    for path, data in merged.items():
        data["category"] = classify_path(path)
    return merged


def classify_path(path: str) -> str:
    if path.endswith((".test.ts", ".spec.ts", "_test.py", "test_validate_output.py")):
        return "tests"
    if path.startswith(("packages/cli/src/", "packages/cli/bin/")):
        return "code"
    if path.startswith("packages/cli/tests/"):
        return "tests"
    if path.startswith(("packages/skills/", ".agents/skills/", ".claude/skills/")):
        return "skill"
    if path.startswith(("docs/", "packages/docs/template/docs/")):
        return "docs"
    if path.endswith((".json", ".yaml", ".yml", ".toml")):
        return "config"
    if path.endswith((".ts", ".tsx", ".js", ".py", ".rs", ".sh")):
        return "code"
    return "other"


def discover_contracts(repo_root: Path) -> dict[str, Any]:
    candidates = {
        "rootAgentInstructions": ["AGENTS.md", "CLAUDE.md"],
        "historyDir": ["docs/assets/archive/history"],
        "riskRegister": ["docs/prd/03-open-questions-and-risk-register.md"],
        "commitConvention": ["docs/assets/references/commit-message-convention.md"],
        "templateCommitConvention": [
            "packages/docs/template/docs/assets/references/commit-message-convention.md"
        ],
        "guideContract": [".make-docs/contracts/system/guide-contract.md"],
        "developerGuides": ["docs/assets/library/developer"],
        "userGuides": ["docs/assets/library/user"],
    }
    result: dict[str, Any] = {}
    for name, paths in candidates.items():
        existing = [path for path in paths if (repo_root / path).exists()]
        result[name] = {"exists": bool(existing), "paths": existing}
    return result


def extract_coordinates(paths: list[str]) -> list[dict[str, Any]]:
    seen: set[tuple[int | None, int | None, int | None, int | None, str]] = set()
    coordinates: list[dict[str, Any]] = []
    for path in paths:
        w: int | None = None
        r: int | None = None
        p: int | None = None
        t: int | None = None

        wr = COORDINATE_RE.search(path)
        if wr:
            w = int(wr.group(1))
            r = int(wr.group(2))

        name = Path(path).name
        if "/docs/work/" in f"/{path}" or path.startswith("docs/work/"):
            phase_match = PHASE_FILE_RE.match(name)
            if phase_match:
                p = int(phase_match.group(1))

        task_match = TASK_ID_RE.search(path)
        if task_match:
            t = int(task_match.group(1))

        if any(value is not None for value in (w, r, p, t)):
            key = (w, r, p, t, path)
            if key not in seen:
                seen.add(key)
                coordinates.append({"w": w, "r": r, "p": p, "t": t, "source": path})
    return coordinates


def discover_history_candidates(repo_root: Path, coordinates: list[dict[str, Any]]) -> list[str]:
    history_dir = repo_root / "docs" / "assets" / "archive" / "history"
    if not history_dir.is_dir():
        return []
    terms: set[str] = set()
    for coord in coordinates:
        if coord.get("w") is not None and coord.get("r") is not None:
            terms.add(f"w{coord['w']}-r{coord['r']}")
            terms.add(f"W{coord['w']} R{coord['r']}")
    candidates: list[str] = []
    for path in sorted(history_dir.glob("*.md")):
        rel = path.relative_to(repo_root).as_posix()
        text = safe_read(path)
        if not terms or any(term.lower() in f"{rel}\n{text}".lower() for term in terms):
            candidates.append(rel)
    return candidates[:20]


def next_risk_ids(repo_root: Path) -> dict[str, Any]:
    path = repo_root / "docs" / "prd" / "03-open-questions-and-risk-register.md"
    if not path.exists():
        return {"exists": False, "path": None, "next": {}}
    text = safe_read(path)
    highest = {"D": 0, "Q": 0, "R": 0}
    for prefix, number in RISK_HEADING_RE.findall(text):
        highest[prefix] = max(highest[prefix], int(number))
    return {
        "exists": True,
        "path": "docs/prd/03-open-questions-and-risk-register.md",
        "next": {prefix: f"{prefix}-{value + 1:03d}" for prefix, value in highest.items()},
    }


def is_make_docs_node_workspace(repo_root: Path | None, paths: list[str]) -> bool:
    if repo_root is None:
        return any(path.startswith(("packages/cli/", "packages/skills/")) for path in paths)
    package_json = repo_root / "package.json"
    if not package_json.exists():
        return False
    text = safe_read(package_json)
    return "make-docs" in text or any(
        path.startswith(("packages/cli/", "packages/skills/", "package.json", "package-lock.json"))
        for path in paths
    )


def is_rust_workspace(repo_root: Path | None, paths: list[str]) -> bool:
    if repo_root is not None and (repo_root / "Cargo.toml").exists():
        return True
    return any(Path(path).suffix == ".rs" or Path(path).name in {"Cargo.toml", "Cargo.lock"} for path in paths)


def validation_hints(files: list[dict[str, Any]], repo_root: Path | None = None) -> list[str]:
    paths = [file["path"] for file in files]
    categories = {file["category"] for file in files}
    commands: list[str] = []

    if any(path.startswith("packages/skills/decompose-codebase/scripts/") for path in paths):
        commands.append("python3 -B packages/skills/decompose-codebase/scripts/test_validate_output.py")
    if any(path.startswith("packages/skills/closeout-commit/scripts/") for path in paths):
        commands.append("python3 -B packages/skills/closeout-commit/scripts/test_closeout_helpers.py")
    if any(path.startswith("packages/skills/closeout-phase/scripts/") for path in paths):
        commands.append("python3 -B packages/skills/closeout-phase/scripts/test_closeout_helpers.py")
    if is_rust_workspace(repo_root, paths):
        commands.extend(
            [
                "cargo metadata --format-version 1",
                "cargo check --workspace",
                "cargo test --workspace",
                "cargo fmt --all -- --check",
                "cargo clippy --workspace --all-targets -- -D warnings",
                "cargo doc --workspace --no-deps",
                "cargo build --workspace",
            ]
        )
    if categories.intersection({"code", "tests", "skill", "config"}) and is_make_docs_node_workspace(repo_root, paths):
        commands.append("npm test -w packages/cli -- consistency install skill-catalog skill-registry")
    if any(path.startswith(("packages/cli/src/", "packages/cli/tests/")) for path in paths):
        commands.append("npm run build -w packages/cli")
    if any(path.startswith(("docs/", "packages/docs/template/docs/")) for path in paths):
        commands.append("scripts/check-instruction-routers.sh")
    commands.append("git diff --check")

    deduped: list[str] = []
    for command in commands:
        if command not in deduped:
            deduped.append(command)
    return deduped


def safe_read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def build_probe(repo_root: Path, scope: str) -> dict[str, Any]:
    files_by_path = changed_files(repo_root, scope)
    files = [files_by_path[path] for path in sorted(files_by_path)]
    coordinates = extract_coordinates([file["path"] for file in files])
    selected_scope = "staged" if scope == "auto" and any(file["staged"] for file in files) else scope
    if selected_scope == "auto":
        selected_scope = "full"
    return {
        "repoRoot": str(repo_root),
        "scope": selected_scope,
        "statusShort": run_git(repo_root, ["status", "--short"]).splitlines(),
        "files": files,
        "contracts": discover_contracts(repo_root),
        "coordinates": coordinates,
        "historyCandidates": discover_history_candidates(repo_root, coordinates),
        "riskRegister": next_risk_ids(repo_root),
        "validationHints": validation_hints(files, repo_root),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=".", help="Repository root to probe.")
    parser.add_argument(
        "--scope",
        choices=["auto", "staged", "unstaged", "full"],
        default="auto",
        help="Change-set scope to summarize.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON. Present for readability.")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    print(json.dumps(build_probe(repo_root, args.scope), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
