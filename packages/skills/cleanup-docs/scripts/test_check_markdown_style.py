#!/usr/bin/env python3
"""Tests for check_markdown_style.py."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

import check_markdown_style as checker


class MarkdownStyleTests(unittest.TestCase):
    def findings_for(self, text: str) -> list[checker.Finding]:
        return checker.scan_text(Path("sample.md"), text)

    def test_flags_hard_wrapped_examples(self) -> None:
        text = (
            "`lemme start` runs an agent profile on an inner harness. In v1, Phase 06 wires\n"
            "the CLI surface and a stub execution bridge for validation; the real Claude\n"
            "Code adapter flow lands in Phase 07. The command shape is stable enough to use\n"
            "for profile, config, workdir, and headless-wrapper examples.\n\n"
            "For the Phase 06 stub bridge, use `stub` as the harness. Registered adapters\n"
            "such as `claude-code` and its `claude` alias are accepted by the CLI, but the\n"
            "full adapter execution bridge is later adapter work.\n\n"
            "Use a direct source workdir only when you explicitly accept shared-workdir\n"
            "behavior:\n"
        )

        findings = self.findings_for(text)

        self.assertGreaterEqual(len([item for item in findings if item.rule == "hard-wrap"]), 3)

    def test_flags_list_followed_by_paragraph_without_blank_line(self) -> None:
        findings = self.findings_for("- one\n- two\nNext paragraph starts too soon.\n")

        self.assertEqual([item.rule for item in findings], ["list-spacing"])

    def test_ignores_structural_markdown(self) -> None:
        text = (
            "---\n"
            "title: wrapped\n"
            "summary: This frontmatter line is intentionally long and followed by lower text\n"
            "lowercase should not matter here\n"
            "---\n\n"
            "# Heading\n\n"
            "```md\n"
            "This code line is intentionally long and followed by lower text\n"
            "lowercase code text\n"
            "```\n\n"
            "| Column | Value |\n"
            "| --- | --- |\n"
            "| Long prose cell that wraps in the source | lower cell |\n\n"
            "> Quote text that may be manually wrapped\n"
            "> with another quote line\n\n"
            "- list item continuation\n"
            "  still part of the item\n"
        )

        self.assertEqual(self.findings_for(text), [])

    def test_fix_mode_unwraps_and_inserts_blank_lines(self) -> None:
        fixed = checker.fix_text(
            "A generated paragraph that is long enough to look wrapped in source\n"
            "because the next line keeps the same sentence going.\n\n"
            "- one\n"
            "- two\n"
            "Next paragraph.\n"
        )

        self.assertIn("source because the next line", fixed)
        self.assertIn("- two\n\nNext paragraph.", fixed)

    def test_fix_mode_preserves_frontmatter_and_code_fences(self) -> None:
        text = (
            "---\n"
            "summary: This frontmatter line is long enough to look wrapped\n"
            "because it continues in YAML frontmatter.\n"
            "---\n\n"
            "```md\n"
            "This fenced code line is long enough to look wrapped\n"
            "because code keeps its exact source layout.\n"
            "```\n"
        )

        self.assertEqual(checker.fix_text(text), text)

    def test_fix_mode_preserves_list_continuations(self) -> None:
        text = (
            "- This unordered list item is long enough to look wrapped\n"
            "  because its continuation indentation is semantic.\n"
            "1. This ordered list item is long enough to look wrapped\n"
            "   because its continuation indentation is semantic.\n"
            "- [ ] This task item is long enough to look wrapped\n"
            "  because its continuation indentation is semantic.\n"
            "  - This nested item must stay nested.\n"
        )

        self.assertEqual(checker.fix_text(text), text)

    def test_reports_but_does_not_fix_wrapped_list_continuation(self) -> None:
        text = (
            "- This unordered list item is long enough to look wrapped\n"
            "  because its continuation indentation is semantic.\n"
        )

        findings = checker.scan_text(Path("sample.md"), text)

        self.assertEqual([item.rule for item in findings], ["list-continuation-wrap"])
        self.assertEqual(checker.fix_text(text), text)

    def test_fix_mode_adds_blank_after_list_with_continuation(self) -> None:
        fixed = checker.fix_text(
            "- This unordered list item is long enough to look wrapped\n"
            "  because its continuation indentation is semantic.\n"
            "Next paragraph starts too soon.\n"
        )

        self.assertIn(
            "because its continuation indentation is semantic.\n\nNext paragraph",
            fixed,
        )

    def test_json_output_is_stable(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "sample.md"
            path.write_text("- one\nNext paragraph.\n")
            result = subprocess.run(
                [
                    "python3",
                    str(Path(__file__).with_name("check_markdown_style.py")),
                    "--format",
                    "json",
                    str(path),
                ],
                check=True,
                capture_output=True,
                text=True,
            )

        payload = json.loads(result.stdout)
        self.assertFalse(payload["ok"])
        self.assertEqual(payload["findings"][0]["rule"], "list-spacing")


if __name__ == "__main__":
    unittest.main()
