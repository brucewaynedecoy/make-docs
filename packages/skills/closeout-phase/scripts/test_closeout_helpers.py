#!/usr/bin/env python3
"""Tests for closeout-phase fast-path helper scripts."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import closeout_history
import closeout_probe
import closeout_validate
import guide_coverage_probe
import work_phase_state


class WorkPhaseStateTests(unittest.TestCase):
    def test_parses_phase_tasks_acceptance_and_coordinate(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            phase = (
                Path(tmp)
                / "docs"
                / "work"
                / "2026-05-05-w2-r1-example"
                / "03-closeout.md"
            )
            phase.parent.mkdir(parents=True)
            phase.write_text(
                "# Phase Three\n\n"
                "## Stage 1\n\n"
                "### Tasks\n\n"
                "- [x] t1: Finished thing\n"
                "- [ ] t2: Remaining thing\n\n"
                "### Acceptance criteria\n\n"
                "- Plain evidence\n",
                encoding="utf-8",
            )

            result = work_phase_state.parse_phase(phase)

        self.assertEqual(result["title"], "Phase Three")
        self.assertEqual(result["coordinate"], {"w": 2, "r": 1, "p": 3})
        self.assertEqual([task["id"] for task in result["tasks"]], ["t1", "t2"])
        self.assertEqual([task["id"] for task in result["uncheckedTasks"]], ["t2"])
        self.assertFalse(result["acceptanceCriteria"][0]["usesCheckbox"])

    def test_warns_on_task_number_gap_and_acceptance_checkbox(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            phase = Path(tmp) / "docs" / "work" / "2026-05-05-w1-r0-example" / "01-one.md"
            phase.parent.mkdir(parents=True)
            phase.write_text(
                "# Phase One\n\n"
                "## Stage 1\n\n"
                "### Tasks\n\n"
                "- [ ] t2: Skipped ordinal\n\n"
                "### Acceptance criteria\n\n"
                "- [ ] Wrong checkbox\n",
                encoding="utf-8",
            )

            result = work_phase_state.parse_phase(phase)

        self.assertIn("expected task id t1, found t2", result["warnings"])
        self.assertIn("acceptance criteria contains checkbox syntax", result["warnings"])


class GuideCoverageProbeTests(unittest.TestCase):
    def test_scores_guides_against_changed_file_terms(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            guide = root / "docs" / "guides" / "developer" / "closeout-fast-path.md"
            guide.parent.mkdir(parents=True)
            guide.write_text(
                "---\n"
                "title: Closeout Fast Path\n"
                "related:\n"
                "  - ../user/closeout.md\n"
                "---\n\n"
                "# Closeout Fast Path\n\n"
                "## Validation\n",
                encoding="utf-8",
            )
            probe_json = root / "probe.json"
            probe_json.write_text(
                json.dumps({"files": [{"path": "packages/skills/closeout-phase/scripts/closeout_validate.py"}]}),
                encoding="utf-8",
            )

            terms = guide_coverage_probe.changed_terms(root, str(probe_json), ["fast"])
            guides = guide_coverage_probe.collect_guides(root, terms)

        self.assertEqual(guides[0]["path"], "docs/guides/developer/closeout-fast-path.md")
        self.assertGreater(guides[0]["score"], 0)
        self.assertEqual(guides[0]["related"], ["../user/closeout.md"])


class CloseoutProbeTests(unittest.TestCase):
    def test_rust_validation_hints_do_not_include_make_docs_npm_without_node_workspace(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "Cargo.toml").write_text("[workspace]\n", encoding="utf-8")

            hints = closeout_probe.validation_hints(
                [{"path": "crates/demo/src/lib.rs", "category": "code"}],
                root,
            )

        self.assertIn("cargo metadata --format-version 1", hints)
        self.assertIn("cargo test --workspace", hints)
        self.assertIn("git diff --check", hints)
        self.assertNotIn("npm test -w make-docs -- consistency install skill-catalog skill-registry", hints)

    def test_make_docs_validation_requires_node_workspace_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "package.json").write_text('{"name":"make-docs"}\n', encoding="utf-8")

            hints = closeout_probe.validation_hints(
                [{"path": "packages/skills/closeout-phase/SKILL.md", "category": "skill"}],
                root,
            )

        self.assertIn("npm test -w make-docs -- consistency install skill-catalog skill-registry", hints)


class CloseoutValidateTests(unittest.TestCase):
    def test_commands_from_probe_deduplicates_diff_check(self) -> None:
        commands = closeout_validate.commands_from_probe(
            {"validationHints": ["git diff --check", "git diff --check"]}
        )

        self.assertEqual(commands, ["git diff --check"])


class CloseoutHistoryTests(unittest.TestCase):
    def test_phase_history_filename_uses_coordinate_prefix(self) -> None:
        filename = closeout_history.history_filename(
            "phase",
            "2026-05-11",
            "Tool Manifest Crate Closeout",
            {},
            {"coordinate": {"w": 1, "r": 0, "p": 2}},
        )

        self.assertEqual(filename, "2026-05-11-w1-r0-p2-tool-manifest-crate-closeout.md")


if __name__ == "__main__":
    unittest.main()
