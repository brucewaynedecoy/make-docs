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

    def rules_for(self, text: str) -> list[str]:
        return [finding.rule for finding in self.findings_for(text)]

    def test_flags_block_boundary_violations(self) -> None:
        text = (
            "# Heading\n"
            "Paragraph starts too soon.\n"
            "Next paragraph line is wrapped.\n"
            "- list starts too soon\n"
            "```md\n"
            "code starts too soon\n"
            "```\n"
            "<!-- comment starts too soon -->\n"
        )

        findings = self.findings_for(text)

        self.assertEqual(
            [finding.rule for finding in findings[:4]],
            ["block-spacing", "block-spacing", "block-spacing", "block-spacing"],
        )
        self.assertEqual(findings[0].block_type, "heading->paragraph")
        self.assertTrue(all(finding.fixable for finding in findings[:4]))

    def test_flags_list_followed_by_paragraph_or_heading_without_blank_line(self) -> None:
        paragraph_rules = self.rules_for("- one\n- two\nNext paragraph starts too soon.\n")
        heading_rules = self.rules_for("- one\n## Heading starts too soon\n")

        self.assertEqual(paragraph_rules, ["block-spacing"])
        self.assertEqual(heading_rules, ["block-spacing"])

    def test_flags_code_fence_followed_by_paragraph_without_blank_line(self) -> None:
        findings = self.findings_for("```md\ncode\n```\nParagraph starts too soon.\n")

        self.assertEqual([finding.rule for finding in findings], ["block-spacing"])
        self.assertEqual(findings[0].block_type, "code-fence->paragraph")

    def test_flags_wrapped_top_level_paragraphs(self) -> None:
        text = (
            "Stand up the shared substrate every later phase depends on: the\n"
            "Cargo workspace and per-crate manifests, the pinned Rust toolchain,\n"
            "the typed error model plus event tracing subscriber.\n\n"
            "Plan source: [Plan Phase 01](../../plans\n"
            "/2026-05-01-w1-r0-lemme-cli-v1-baseline\n"
            "/01-bootstrap-and-foundation.md).\n"
        )

        findings = self.findings_for(text)

        self.assertEqual([finding.rule for finding in findings], ["paragraph-wrap", "paragraph-wrap"])
        self.assertEqual(findings[0].start_line, 1)
        self.assertEqual(findings[0].end_line, 3)
        self.assertTrue(all(finding.fixable for finding in findings))

    def test_fix_mode_spaces_blocks_before_unwrapping_paragraphs(self) -> None:
        fixed = checker.fix_text(
            "# Heading\n"
            "A generated paragraph that is long enough to look wrapped in source\n"
            "because the next line keeps the same sentence going.\n"
            "- one\n"
            "Next paragraph.\n"
        )

        self.assertEqual(
            fixed,
            "# Heading\n\n"
            "A generated paragraph that is long enough to look wrapped in source because the next line keeps the same sentence going.\n\n"
            "- one\n\n"
            "Next paragraph.\n",
        )

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
        self.assertEqual(self.findings_for(text), [])

    def test_fix_mode_preserves_tables_blockquotes_comments_and_lists(self) -> None:
        text = (
            "| Column | Value |\n"
            "| --- | --- |\n"
            "| Long prose cell that wraps in the source | lower cell |\n\n"
            "> Quote text that may be manually wrapped\n"
            "> with another quote line\n\n"
            "<!-- comment line that may look wrapped\n"
            "but should remain untouched -->\n\n"
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

        findings = self.findings_for(text)

        self.assertEqual([finding.rule for finding in findings], ["list-continuation-wrap"])
        self.assertFalse(findings[0].fixable)
        self.assertEqual(checker.fix_text(text), text)

    def test_json_output_schema_and_order_are_stable(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "sample.md"
            path.write_text("# Heading\nParagraph one\nParagraph two\n")
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
        self.assertEqual([item["rule"] for item in payload["findings"]], ["block-spacing", "paragraph-wrap"])
        expected_keys = {
            "path",
            "start_line",
            "end_line",
            "rule",
            "message",
            "fixable",
            "confidence",
            "block_type",
            "preview",
        }
        self.assertEqual(set(payload["findings"][0]), expected_keys)

    def test_text_output_groups_by_file_and_rule(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "sample.md"
            path.write_text("# Heading\nParagraph one\nParagraph two\n")
            result = subprocess.run(
                [
                    "python3",
                    str(Path(__file__).with_name("check_markdown_style.py")),
                    str(path),
                ],
                check=True,
                capture_output=True,
                text=True,
            )

        self.assertIn(str(path), result.stdout)
        self.assertIn("  block-spacing", result.stdout)
        self.assertIn("  paragraph-wrap", result.stdout)


if __name__ == "__main__":
    unittest.main()
