#!/usr/bin/env python3
"""Audit selected local documentation for absolute paths without installation state."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
import unittest
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


DEFAULT_ALLOW_TOKEN = "make-docs-path-hygiene: allow"
DEFAULT_TEXT_EXTENSIONS = {".md", ".rst", ".txt"}
SKILL_TEXT_EXTENSIONS = DEFAULT_TEXT_EXTENSIONS | {".json", ".py", ".toml", ".yaml", ".yml"}
PATH_CHARS_RE = re.compile(r"[^\s`\"'<>()\[\]{}]+")
MARKDOWN_LINK_RE = re.compile(r"(!?\[[^\]]+\]\()([^)\s]+)([^)]*\))")
POSIX_HOME_RE = re.compile(r"/(?:Users|home)/[^/\s`\"'<>()\[\]{}]+(?:/[^\s`\"'<>()\[\]{}]+)*")
WSL_HOME_RE = re.compile(r"/mnt/[A-Za-z]/Users/[^/\s`\"'<>()\[\]{}]+(?:/[^\s`\"'<>()\[\]{}]+)*")
WINDOWS_HOME_RE = re.compile(r"[A-Za-z]:\\Users\\[^\\\s`\"'<>()\[\]{}]+(?:\\[^\s`\"'<>()\[\]{}]+)*")
MAC_TEMP_RE = re.compile(r"/(?:private/)?var/folders/[^\s`\"'<>()\[\]{}]+")
SCHEME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:")


@dataclass
class Finding:
    file: str
    line: int
    column: int
    kind: str
    match: str
    suggestion: str | None
    auto_fixable: bool
    allowed: bool
    reason: str | None = None


@dataclass
class ScanResult:
    checked_files: int
    changed_files: list[str]
    findings: list[Finding]
    io_errors: list[str]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--path", action="append", dest="paths", help="Project-relative content file or directory; repeat to select scope")
    parser.add_argument("--repo-root", default=".")
    parser.add_argument("--format", choices=("text", "json"), default="text")
    parser.add_argument("--fix", action="store_true")
    parser.add_argument("--include-skills", action="store_true")
    parser.add_argument("--allow-comment-token", default=DEFAULT_ALLOW_TOKEN)
    parser.add_argument("--self-test", action="store_true")
    return parser.parse_args(argv)


DEFAULT_CONTENT_PATHS = ("README.md", "AGENTS.md", "CLAUDE.md", "docs", ".make-docs/system")
SKILL_CONTENT_PATHS = (".make-docs/agentics/skills", ".agents/skills", ".claude/skills", ".codex/skills")
EXCLUDED_DIRECTORIES = {".git", ".backup", "node_modules", "__pycache__", ".venv"}
EXCLUDED_TOOL_DIRECTORIES = {"backup", "state", "conflicts", "archive"}


def checked_content_path(repo_root: Path, value: str) -> Path:
    relative = Path(value)
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError(f"content path must be project-relative without traversal: {value}")
    current = repo_root
    for part in relative.parts:
        current = current / part
        if current.is_symlink():
            raise ValueError(f"symbolic links are not content targets: {value}")
    if any(part in EXCLUDED_DIRECTORIES for part in relative.parts):
        raise ValueError(f"excluded content path: {value}")
    if any(part == ".make-docs" and i + 1 < len(relative.parts)
           and relative.parts[i + 1] in EXCLUDED_TOOL_DIRECTORIES
           for i, part in enumerate(relative.parts)):
        raise ValueError(f"backup or operational directory is not a content target: {value}")
    if relative.as_posix() == ".make-docs/manifest.json":
        raise ValueError("legacy installation manifest is not a content target")
    return current


def iter_content_paths(repo_root: Path, paths: list[str] | None, include_skills: bool) -> Iterable[str]:
    selected = list(paths) if paths is not None else list(DEFAULT_CONTENT_PATHS)
    if include_skills:
        selected.extend(SKILL_CONTENT_PATHS)
    for value in selected:
        target = checked_content_path(repo_root, value)
        if not target.exists():
            if paths is not None and value in paths:
                raise ValueError(f"content path not found: {value}")
            continue
        if target.is_file():
            yield target.relative_to(repo_root).as_posix()
            continue
        for directory, dirs, files in os.walk(target, followlinks=False):
            base = Path(directory)
            dirs[:] = sorted(name for name in dirs if name not in EXCLUDED_DIRECTORIES
                             and not (base / name).is_symlink()
                             and not (base.name == ".make-docs" and name in EXCLUDED_TOOL_DIRECTORIES)
                             and (include_skills or name != "skills"))
            for name in sorted(files):
                child = base / name
                relative = child.relative_to(repo_root).as_posix()
                if not child.is_symlink() and relative != ".make-docs/manifest.json":
                    yield relative


def is_text_path(path: str, include_skills: bool) -> bool:
    ext = Path(path).suffix.lower()
    extensions = SKILL_TEXT_EXTENSIONS if include_skills else DEFAULT_TEXT_EXTENSIONS
    return ext in extensions


def is_allowed(lines: list[str], line_index: int, token: str) -> tuple[bool, str | None]:
    candidates = [lines[line_index]]
    if line_index > 0:
        candidates.append(lines[line_index - 1])
    for candidate in candidates:
        if token in candidate:
            reason = candidate.split(token, 1)[1].strip(" -:<>")
            return True, reason or "allow comment present"
    return False, None


def markdown_link_destination_at(line: str, start: int, end: int) -> bool:
    for match in MARKDOWN_LINK_RE.finditer(line):
        dest_start, dest_end = match.span(2)
        if dest_start <= start and end <= dest_end:
            return True
    return False


def repo_relative_suggestion(repo_root: str, matched: str, in_link: bool) -> str:
    suffix = matched[len(repo_root) :]
    if suffix.startswith(("/", "\\")):
        suffix = suffix[1:]
    if not suffix:
        return "."
    normalized = suffix.replace("\\", "/")
    return normalized if in_link else f"./{normalized}"


def home_placeholder_suggestion(matched: str) -> str | None:
    if matched.startswith(("/Users/", "/home/")):
        parts = matched.split("/", 3)
        if len(parts) == 4:
            return f"<user-home>/{parts[3]}"
        return "<user-home>"
    wsl = re.match(r"^/mnt/[A-Za-z]/Users/[^/]+(?:/(.*))?$", matched)
    if wsl:
        suffix = wsl.group(1)
        return f"<user-home>/{suffix}" if suffix else "<user-home>"
    windows = re.match(r"^[A-Za-z]:\\Users\\[^\\]+(?:\\(.*))?$", matched)
    if windows:
        suffix = windows.group(1)
        return f"<user-home>\\{suffix}" if suffix else "<user-home>"
    return None


def temp_placeholder_suggestion(matched: str) -> str:
    tail_match = re.match(r"^/(?:private/)?var/folders/[^/]+/[^/]+/(.*)$", matched)
    return f"<temp-dir>/{tail_match.group(1)}" if tail_match else "<temp-dir>/..."


def absolute_markdown_link_findings(line: str) -> list[tuple[int, int, str]]:
    findings: list[tuple[int, int, str]] = []
    for match in MARKDOWN_LINK_RE.finditer(line):
        dest = match.group(2)
        if dest.startswith("//") or SCHEME_RE.match(dest):
            continue
        if dest.startswith("/") or WINDOWS_HOME_RE.match(dest):
            findings.append((match.start(2), match.end(2), dest))
    return findings


def collect_line_findings(
    rel_file: str,
    line: str,
    line_number: int,
    line_index: int,
    lines: list[str],
    repo_root: str,
    allow_token: str,
) -> list[Finding]:
    allowed, reason = is_allowed(lines, line_index, allow_token)
    findings: list[Finding] = []
    spans: list[tuple[int, int]] = []

    search_start = 0
    while True:
        start = line.find(repo_root, search_start)
        if start == -1:
            break
        path_match = PATH_CHARS_RE.match(line, start)
        end = path_match.end() if path_match else start + len(repo_root)
        matched = line[start:end]
        in_link = markdown_link_destination_at(line, start, end)
        suggestion = repo_relative_suggestion(repo_root, matched, in_link)
        findings.append(
            Finding(
                file=rel_file,
                line=line_number,
                column=start + 1,
                kind="repo_root_absolute_path",
                match=matched,
                suggestion=suggestion,
                auto_fixable=True,
                allowed=allowed,
                reason=reason,
            )
        )
        spans.append((start, end))
        search_start = end

    for pattern, kind, suggestion_fn in (
        (WSL_HOME_RE, "wsl_user_home_path", home_placeholder_suggestion),
        (WINDOWS_HOME_RE, "windows_user_home_path", home_placeholder_suggestion),
        (POSIX_HOME_RE, "posix_user_home_path", home_placeholder_suggestion),
        (MAC_TEMP_RE, "macos_temp_path", temp_placeholder_suggestion),
    ):
        for match in pattern.finditer(line):
            start, end = match.span()
            if any(span_start <= start < span_end for span_start, span_end in spans):
                continue
            matched = match.group(0)
            findings.append(
                Finding(
                    file=rel_file,
                    line=line_number,
                    column=start + 1,
                    kind=kind,
                    match=matched,
                    suggestion=suggestion_fn(matched),
                    auto_fixable=False,
                    allowed=allowed,
                    reason=reason,
                )
            )
            spans.append((start, end))

    for start, end, dest in absolute_markdown_link_findings(line):
        if any(span_start <= start < span_end for span_start, span_end in spans):
            continue
        suggestion = dest[1:] if dest.startswith("/") else home_placeholder_suggestion(dest)
        findings.append(
            Finding(
                file=rel_file,
                line=line_number,
                column=start + 1,
                kind="absolute_markdown_link_destination",
                match=dest,
                suggestion=suggestion,
                auto_fixable=False,
                allowed=allowed,
                reason=reason,
            )
        )

    return findings


def fix_repo_root_paths(text: str, repo_root: str) -> str:
    def replace_line(line: str) -> str:
        matches = list(re.finditer(re.escape(repo_root), line))
        if not matches:
            return line
        rebuilt = []
        last = 0
        for match in matches:
            start = match.start()
            path_match = PATH_CHARS_RE.match(line, start)
            end = path_match.end() if path_match else match.end()
            matched = line[start:end]
            rebuilt.append(line[last:start])
            rebuilt.append(repo_relative_suggestion(repo_root, matched, markdown_link_destination_at(line, start, end)))
            last = end
        rebuilt.append(line[last:])
        return "".join(rebuilt)

    return "\n".join(replace_line(line) for line in text.split("\n"))


def scan_file(path: Path, rel_file: str, repo_root: str, allow_token: str, fix: bool) -> tuple[list[Finding], bool]:
    original = path.read_text(encoding="utf-8")
    updated = fix_repo_root_paths(original, repo_root) if fix else original
    changed = updated != original
    if changed:
        path.write_text(updated, encoding="utf-8")
    lines = updated.splitlines()
    findings: list[Finding] = []
    for index, line in enumerate(lines):
        findings.extend(collect_line_findings(rel_file, line, index + 1, index, lines, repo_root, allow_token))
    return findings, changed


def scan_content(
    paths: list[str] | None,
    repo_root: Path,
    include_skills: bool,
    allow_token: str,
    fix: bool,
) -> ScanResult:
    rel_paths = sorted({path for path in iter_content_paths(repo_root, paths, include_skills) if is_text_path(path, include_skills)})
    findings: list[Finding] = []
    io_errors: list[str] = []
    changed_files: list[str] = []
    checked = 0
    repo_root_str = str(repo_root.resolve())
    for rel_path in rel_paths:
        path = checked_content_path(repo_root, rel_path)
        if not path.exists():
            io_errors.append(f"missing content file: {rel_path}")
            continue
        try:
            file_findings, changed = scan_file(path, rel_path, repo_root_str, allow_token, fix)
        except UnicodeDecodeError:
            io_errors.append(f"not valid UTF-8: {rel_path}")
            continue
        except OSError as exc:
            io_errors.append(f"cannot read {rel_path}: {exc}")
            continue
        checked += 1
        findings.extend(file_findings)
        if changed:
            changed_files.append(rel_path)
    return ScanResult(checked, changed_files, findings, io_errors)


def failing_findings(findings: list[Finding]) -> list[Finding]:
    return [finding for finding in findings if not finding.allowed]


def print_text(result: ScanResult) -> None:
    for error in result.io_errors:
        print(f"ERROR: {error}")
    for finding in result.findings:
        status = "allowed" if finding.allowed else "error"
        suggestion = f" -> {finding.suggestion}" if finding.suggestion else ""
        print(
            f"{status}: {finding.file}:{finding.line}:{finding.column}: "
            f"{finding.kind}: {finding.match}{suggestion}"
        )
    errors = len(failing_findings(result.findings))
    allowed = len(result.findings) - errors
    print(
        f"checked_files={result.checked_files} "
        f"changed_files={len(result.changed_files)} "
        f"errors={errors} "
        f"allowed={allowed}"
    )


def print_json(result: ScanResult) -> None:
    errors = len(failing_findings(result.findings))
    allowed = len(result.findings) - errors
    payload = {
        "checked_files": result.checked_files,
        "changed_files": result.changed_files,
        "findings": [asdict(finding) for finding in result.findings],
        "summary": {"errors": errors, "allowed": allowed},
    }
    if result.io_errors:
        payload["io_errors"] = result.io_errors
    print(json.dumps(payload, indent=2, sort_keys=True))


class PathHygieneTests(unittest.TestCase):
    def run_scan(self, body: str, fix: bool = False) -> tuple[ScanResult, Path]:
        root = Path(tempfile.mkdtemp(prefix="path-hygiene-")).resolve()
        docs = root / "docs"
        docs.mkdir()
        target = docs / "example.md"
        target.write_text(body, encoding="utf-8")
        result = scan_content(None, root, False, DEFAULT_ALLOW_TOKEN, fix)
        self.assertFalse((root / ".make-docs").exists())
        return result, target

    def test_repo_root_paths_are_fixable(self) -> None:
        root = Path(tempfile.mkdtemp(prefix="path-hygiene-root-")).resolve()
        docs = root / "docs"
        docs.mkdir()
        target = docs / "example.md"
        target.write_text(f"[Read]({root}/README.md)\nPath `{root}/docs/example.md`\n", encoding="utf-8")
        result = scan_content(None, root, False, DEFAULT_ALLOW_TOKEN, True)
        self.assertEqual([], failing_findings(result.findings))
        self.assertEqual("[Read](README.md)\nPath `./docs/example.md`\n", target.read_text(encoding="utf-8"))
        self.assertEqual(["docs/example.md"], result.changed_files)

    def test_user_home_path_reports_without_fix(self) -> None:
        result, _target = self.run_scan("See `/Users/alice/project/README.md`.\n", fix=True)
        self.assertEqual(1, len(failing_findings(result.findings)))
        self.assertFalse(result.findings[0].auto_fixable)
        self.assertEqual("<user-home>/project/README.md", result.findings[0].suggestion)

    def test_allow_comment_suppresses_failure(self) -> None:
        result, _target = self.run_scan(
            "<!-- make-docs-path-hygiene: allow retained diagnostic evidence -->\n"
            "See `/Users/alice/project/README.md`.\n"
        )
        self.assertEqual([], failing_findings(result.findings))
        self.assertEqual(1, len(result.findings))
        self.assertTrue(result.findings[0].allowed)

    def test_sanitized_placeholders_are_not_flagged(self) -> None:
        result, _target = self.run_scan("Use `<user-home>/project`, `$HOME/project`, and `<repo-root>/README.md`.\n")
        self.assertEqual([], result.findings)

    def test_absolute_markdown_link_is_reported(self) -> None:
        result, _target = self.run_scan("See [docs](/docs/prd/00-index.md).\n")
        self.assertEqual(1, len(failing_findings(result.findings)))
        self.assertEqual("absolute_markdown_link_destination", result.findings[0].kind)
        self.assertEqual("docs/prd/00-index.md", result.findings[0].suggestion)

    def test_scope_excludes_backups_and_links_without_cli_or_store(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            docs = root / "docs"
            docs.mkdir()
            (docs / "note.md").write_text("Project work remains available.\n", encoding="utf-8")
            backup = root / ".make-docs" / "backup"
            backup.mkdir(parents=True)
            saved = backup / "saved.md"
            saved.write_text("/Users/alice/private\n", encoding="utf-8")
            (docs / "linked.md").symlink_to(saved)
            result = scan_content(None, root, False, DEFAULT_ALLOW_TOKEN, True)
            self.assertEqual(1, result.checked_files)
            self.assertEqual([], result.findings)
            self.assertEqual("/Users/alice/private\n", saved.read_text(encoding="utf-8"))
            self.assertFalse((root / ".make-docs" / "state").exists())
            self.assertFalse((root / ".make-docs" / "manifest.json").exists())

    def test_explicit_scope_rejects_escape_links_and_operational_targets(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            (root / "link").symlink_to(root.parent, target_is_directory=True)
            for value in ("../outside.md", str(root / "absolute.md"), "link/file.md", ".make-docs/state", ".make-docs/manifest.json", ".backup", ".git"):
                with self.subTest(value=value), self.assertRaises(ValueError):
                    scan_content([value], root, False, DEFAULT_ALLOW_TOKEN, True)

    def test_custom_content_scope_requires_no_installation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            custom = root / "knowledge"
            custom.mkdir()
            (custom / "note.md").write_text("Project content.\n", encoding="utf-8")
            result = scan_content(["knowledge"], root, False, DEFAULT_ALLOW_TOKEN, False)
            self.assertEqual(1, result.checked_files)
            self.assertEqual(["knowledge"], sorted(p.name for p in root.iterdir()))


def run_self_tests() -> int:
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(PathHygieneTests)
    return 0 if unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful() else 1


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    if args.self_test:
        return run_self_tests()
    repo_root = Path(args.repo_root).resolve()
    try:
        result = scan_content(args.paths, repo_root, args.include_skills, args.allow_comment_token, args.fix)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    if args.format == "json":
        print_json(result)
    else:
        print_text(result)
    if result.io_errors:
        return 2
    return 1 if failing_findings(result.findings) else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
