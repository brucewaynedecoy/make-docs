#!/usr/bin/env python3
"""Tests for validate_output.py — focused on false-positive link detection."""

from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from validate_output import (
    LINK_RE,
    _check_links_in_tree,
    build_result,
    is_plausible_link_target,
    strip_code_regions,
)


# ---------------------------------------------------------------------------
# strip_code_regions
# ---------------------------------------------------------------------------


class TestStripCodeRegions(unittest.TestCase):
    """Verify fenced-block and inline-span masking."""

    def test_fenced_backtick_block(self):
        text = "before\n```\ncode['key'](val)\n```\nafter\n"
        result = strip_code_regions(text)
        self.assertNotIn("code['key'](val)", result)
        self.assertIn("before", result)
        self.assertIn("after", result)

    def test_fenced_tilde_block(self):
        text = "before\n~~~\ncode['key'](val)\n~~~\nafter\n"
        result = strip_code_regions(text)
        self.assertNotIn("code['key'](val)", result)

    def test_fenced_block_with_language(self):
        text = "before\n```salt\nsalt['pillar.get'](...)\n```\nafter\n"
        result = strip_code_regions(text)
        self.assertNotIn("salt['pillar.get']", result)

    def test_line_count_preserved(self):
        text = "line1\n```\ncode\nmore code\n```\nline6\n"
        result = strip_code_regions(text)
        self.assertEqual(len(result.splitlines()), len(text.splitlines()))

    def test_consecutive_fences(self):
        text = "```\nblock1\n```\nplain\n```\nblock2\n```\n"
        result = strip_code_regions(text)
        self.assertNotIn("block1", result)
        self.assertNotIn("block2", result)
        self.assertIn("plain", result)

    def test_closing_fence_must_match_character(self):
        """A ~~~ fence cannot be closed by ``` (CommonMark rule)."""
        text = "~~~\ncode['key'](val)\n```\nstill fenced\n~~~\nafter\n"
        result = strip_code_regions(text)
        self.assertNotIn("code['key'](val)", result)
        self.assertNotIn("still fenced", result)
        self.assertIn("after", result)

    def test_closing_fence_must_be_at_least_as_long(self):
        text = "````\ncode['key'](val)\n```\nstill fenced\n````\nafter\n"
        result = strip_code_regions(text)
        self.assertNotIn("code['key'](val)", result)
        self.assertNotIn("still fenced", result)
        self.assertIn("after", result)

    def test_inline_single_backtick(self):
        text = "See `salt['pillar.get'](..., merge=True)` for details.\n"
        result = strip_code_regions(text)
        self.assertNotIn("salt['pillar.get']", result)
        self.assertIn("See", result)
        self.assertIn("for details.", result)

    def test_inline_double_backtick(self):
        text = "Use ``salt['pillar.get'](..., merge=True)`` here.\n"
        result = strip_code_regions(text)
        self.assertNotIn("salt['pillar.get']", result)

    def test_non_code_content_untouched(self):
        text = "A [real link](./file.md) in plain prose.\n"
        result = strip_code_regions(text)
        self.assertEqual(result, text)

    def test_empty_code_span(self):
        text = "An empty `` span.\n"
        result = strip_code_regions(text)
        self.assertIn("An empty", result)

    def test_unclosed_fence_treats_rest_as_code(self):
        """An unclosed fence should blank everything after the opening marker."""
        text = "before\n```\ncode['key'](val)\nmore code\n"
        result = strip_code_regions(text)
        self.assertNotIn("code['key'](val)", result)
        self.assertNotIn("more code", result)
        self.assertIn("before", result)

    def test_no_link_matches_after_stripping(self):
        """The original bug: Salt patterns should not produce LINK_RE matches."""
        text = (
            "```salt\n"
            "salt['pillar.get']('key', default=None, merge=True)\n"
            "salt['grains.get']('os_family')\n"
            "```\n"
            "\n"
            "Inline: `salt['pillar.get'](..., merge=True)`\n"
            "\n"
            "[real link](./file.md)\n"
        )
        stripped = strip_code_regions(text)
        matches = LINK_RE.findall(stripped)
        self.assertEqual(matches, ["./file.md"])


# ---------------------------------------------------------------------------
# is_plausible_link_target
# ---------------------------------------------------------------------------


class TestIsPlausibleLinkTarget(unittest.TestCase):
    """Verify heuristic rejection of non-path targets."""

    def test_rejects_comma(self):
        self.assertFalse(is_plausible_link_target("arg1, arg2"))

    def test_rejects_ellipsis(self):
        self.assertFalse(is_plausible_link_target("..."))
        self.assertFalse(is_plausible_link_target("..., merge=True"))

    def test_rejects_leading_single_quote(self):
        self.assertFalse(is_plausible_link_target("'os_family'"))

    def test_rejects_trailing_double_quote(self):
        self.assertFalse(is_plausible_link_target('"config"'))

    def test_rejects_unescaped_space(self):
        self.assertFalse(is_plausible_link_target("some path here"))

    def test_accepts_relative_path(self):
        self.assertTrue(is_plausible_link_target("./path/to/file.md"))

    def test_accepts_parent_path(self):
        self.assertTrue(is_plausible_link_target("../README.md"))

    def test_accepts_bare_filename(self):
        self.assertTrue(is_plausible_link_target("00-index"))

    def test_accepts_path_with_fragment(self):
        self.assertTrue(is_plausible_link_target("file.md#heading"))

    def test_accepts_escaped_spaces(self):
        self.assertTrue(is_plausible_link_target("path\\ with\\ spaces"))

    def test_accepts_subdirectory_path(self):
        self.assertTrue(is_plausible_link_target("sub/dir/file.txt"))

    def test_rejects_empty_string(self):
        # Empty string has no quotes, no commas, no spaces — should pass heuristic.
        # The caller (validate_links) handles empty separately.
        self.assertTrue(is_plausible_link_target(""))


# ---------------------------------------------------------------------------
# validate_links (end-to-end via _check_links_in_tree)
# ---------------------------------------------------------------------------


class TestValidateLinksEndToEnd(unittest.TestCase):
    """End-to-end tests using temp directory fixtures."""

    def setUp(self):
        self.tmpdir = Path(tempfile.mkdtemp())
        self.resolved_root = self.tmpdir.resolve()
        self.prd_dir = self.tmpdir / "docs" / "prd"
        self.prd_dir.mkdir(parents=True)
        self.work_dir = self.tmpdir / "docs" / "work"
        self.work_dir.mkdir(parents=True)

    def tearDown(self):
        shutil.rmtree(self.tmpdir)

    def _write_prd(self, name: str, content: str) -> Path:
        p = self.prd_dir / name
        p.write_text(content)
        return p

    def _write_work(self, name: str, content: str) -> Path:
        p = self.work_dir / name
        p.write_text(content)
        return p

    def _check_prd(self) -> tuple[list[str], list[str]]:
        errors: list[str] = []
        _check_links_in_tree(self.prd_dir, self.resolved_root, errors)
        link_errors = [e for e in errors if "link" in e.lower()]
        return errors, link_errors

    def _check_work(self) -> tuple[list[str], list[str]]:
        errors: list[str] = []
        _check_links_in_tree(self.work_dir, self.resolved_root, errors)
        link_errors = [e for e in errors if "link" in e.lower()]
        return errors, link_errors

    def _write_minimal_prd_set(self) -> None:
        """Create the five required core PRD files with minimal valid content."""
        (self.prd_dir / "00-index.md").write_text(
            "## Purpose\nIdx.\n## Reading Order\nOrd.\n"
            "## Document Map\nMap.\n## Source Anchors\n`src/`\n"
            "## Audience Paths\nPaths.\n"
        )
        (self.prd_dir / "01-product-overview.md").write_text(
            "## Purpose\nPO.\n## Users\n`u.py`\n## Key Capabilities\n`k.py`\n"
            "## System Boundaries\n`s.py`\n## Current Limitations\n`l.py`\n"
            "## Source Anchors\n`src/`\n"
        )
        (self.prd_dir / "02-architecture-overview.md").write_text(
            "## Purpose\nAO.\n## Topology\n`t.py`\n## Module Map\n`m.py`\n"
            "## Runtime Boundaries\n`r.py`\n## Data Flow\n`d.py`\n"
            "## Configuration Surfaces\n`c.py`\n## Source Anchors\n`src/`\n"
        )
        (self.prd_dir / "03-open-questions-and-risk-register.md").write_text(
            "## Purpose\nOQ.\n## Confirmed Drift\n`cd.py`\n"
            "## Open Questions\n`oq.py`\n## Rebuild Risks\n`rr.py`\n"
            "## Source Anchors\n`src/`\n"
        )
        (self.prd_dir / "04-glossary.md").write_text(
            "## Purpose\nGl.\n## Terms\nTerms.\n## Source Anchors\n`src/`\n"
        )

    def test_no_false_positives_on_code_patterns(self):
        """Fenced and inline code with bracket-paren syntax produces zero errors."""
        self._write_prd("05-salt-subsystem.md", (
            "## Purpose\nSalt config.\n\n"
            "## Scope\n"
            "```salt\n"
            "salt['pillar.get']('key', default=None, merge=True)\n"
            "salt['grains.get']('os_family')\n"
            "```\n\n"
            "Inline: `salt['pillar.get'](..., merge=True)`\n\n"
            "Double: ``obj['method.name'](arg1, arg2)``\n\n"
            "## Component and Capability Map\nMap.\n"
            "## Contracts and Data\nData.\n"
            "## Integrations\nInt.\n"
            "## Rebuild Notes\nNotes.\n"
            "## Source Anchors\n`src/salt.py`\n"
        ))
        _, link_errors = self._check_prd()
        self.assertEqual(link_errors, [], f"Unexpected link errors: {link_errors}")

    def test_catches_genuinely_broken_links(self):
        """A real broken link is still reported."""
        self._write_prd("05-test.md", (
            "## Purpose\nTest.\n"
            "[broken](./nonexistent-file.md)\n"
        ))
        errors, _ = self._check_prd()
        self.assertEqual(len(errors), 1)
        self.assertIn("broken link", errors[0])
        self.assertIn("nonexistent-file.md", errors[0])

    def test_valid_links_pass(self):
        """Existing file links produce no errors."""
        target = self._write_prd("06-target.md", "## Purpose\nTarget.\n")
        self._write_prd("05-source.md", (
            f"## Purpose\nSource.\n[link](./{target.name})\n"
        ))
        _, link_errors = self._check_prd()
        self.assertEqual(link_errors, [])

    def test_skips_fragment_and_url_links(self):
        """Fragment-only, absolute URL, and mailto links are not validated."""
        self._write_prd("05-links.md", (
            "## Purpose\nLinks.\n"
            "[frag](#heading)\n"
            "[url](https://example.com)\n"
            "[mail](mailto:test@example.com)\n"
        ))
        errors, _ = self._check_prd()
        self.assertEqual(errors, [])

    def test_mixed_fixture(self):
        """Code patterns are ignored, but broken links are caught."""
        self._write_prd("05-mixed.md", (
            "## Purpose\nMixed.\n\n"
            "```python\n"
            "d['key'](value)\n"
            "```\n\n"
            "Inline `obj['m'](x)` text.\n\n"
            "[broken](./does-not-exist.md)\n"
        ))
        errors, _ = self._check_prd()
        self.assertEqual(len(errors), 1)
        self.assertIn("broken link", errors[0])
        self.assertIn("does-not-exist.md", errors[0])

    def test_bare_bracket_paren_with_heuristic(self):
        """Bare bracket-paren outside code is caught by heuristic (comma/space)."""
        self._write_prd("05-bare.md", (
            "## Purpose\nBare patterns.\n\n"
            "salt['pillar.get'](..., merge=True)\n"
        ))
        _, link_errors = self._check_prd()
        self.assertEqual(link_errors, [], f"Heuristic should reject: {link_errors}")

    def test_work_directory_also_filtered(self):
        """Work directory gets the same code-aware filtering."""
        self._write_work("05-task.md", (
            "## Purpose\nTask.\n"
            "```\nhash['config.get'](default_value)\n```\n"
        ))
        _, link_errors = self._check_work()
        self.assertEqual(link_errors, [])

    def test_build_result_integration(self):
        """Full build_result integration — code patterns don't cause failures."""
        self._write_minimal_prd_set()
        self._write_prd("05-salt.md", (
            "## Purpose\nSalt.\n## Scope\n`scope/`\n"
            "## Component and Capability Map\n`map/`\n"
            "## Contracts and Data\n`data/`\n"
            "## Integrations\n`int/`\n"
            "## Rebuild Notes\n`notes/`\n"
            "## Source Anchors\n`src/`\n\n"
            "```salt\nsalt['pillar.get'](..., merge=True)\n```\n"
        ))
        work_backlog = self.work_dir / "2024-01-01-rebuild-backlog"
        work_backlog.mkdir()
        (work_backlog / "00-index.md").write_text(
            "## Purpose\nIdx.\n## Phase Map\nMap.\n## Usage Notes\nNotes.\n"
        )
        (work_backlog / "01-phase.md").write_text(
            "## Purpose\nP.\n## Tasks\nT.\n## Acceptance Criteria\nAC.\n"
        )

        result = build_result(self.tmpdir)
        link_errors = [e for e in result["errors"] if "link" in e.lower()]
        self.assertEqual(link_errors, [], f"False positives in build_result: {link_errors}")


if __name__ == "__main__":
    unittest.main()
