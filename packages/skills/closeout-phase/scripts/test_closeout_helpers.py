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
import persona_schema
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
    def test_default_personas_define_coverage_axes(self) -> None:
        self.assertEqual(persona_schema.validate_personas(persona_schema.DEFAULT_PERSONAS), [])
        axes = persona_schema.coverage_axes()

        self.assertEqual(axes["verdicts"], ["create", "update-existing", "link-only", "none"])
        self.assertEqual(axes["personaTargets"], ["agent", "developer", "user"])

    def test_custom_personas_use_same_schema(self) -> None:
        custom = [
            {
                "slug": "support-lead",
                "label": "Support Lead",
                "description": "Support leaders reviewing docs for customer-facing workflows.",
                "primitive": "maintainer",
            }
        ]

        self.assertEqual(persona_schema.validate_personas(custom), [])

    def test_invalid_persona_schema_values_fail(self) -> None:
        invalid = [
            {
                "slug": "Support Lead",
                "label": "Support Lead",
                "description": "Invalid slug and primitive.",
                "primitive": "operator",
            },
            {
                "slug": "Support Lead",
                "label": "Duplicate",
                "description": "Duplicate invalid slug.",
                "primitive": "user",
            },
        ]

        errors = persona_schema.validate_personas(invalid)

        self.assertTrue(any("lowercase kebab-case" in error for error in errors))
        self.assertTrue(any("primitive" in error for error in errors))
        self.assertTrue(any("unique" in error for error in errors))

    def test_scores_guides_against_changed_file_terms(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            guide = root / "docs" / "assets" / "library" / "developer" / "closeout-fast-path.md"
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

        self.assertEqual(guides[0]["path"], "docs/assets/library/developer/closeout-fast-path.md")
        self.assertEqual(guides[0]["persona"], "developer")
        self.assertEqual(guides[0]["primitive"], "maintainer")
        self.assertGreater(guides[0]["score"], 0)
        self.assertEqual(guides[0]["related"], ["../user/closeout.md"])

    def test_scores_persona_scoped_guides_from_assets_tree(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            guide = root / "docs" / "assets" / "library" / "developer" / "closeout-fast-path.md"
            guide.parent.mkdir(parents=True)
            guide.write_text(
                "---\n"
                "title: Closeout Fast Path\n"
                "persona: developer\n"
                "---\n\n"
                "# Closeout Fast Path\n\n"
                "## Validation\n",
                encoding="utf-8",
            )

            guides = guide_coverage_probe.collect_guides(root, {"closeout"})

        self.assertEqual(guides[0]["path"], "docs/assets/library/developer/closeout-fast-path.md")
        self.assertEqual(guides[0]["persona"], "developer")
        self.assertEqual(guides[0]["personaValidationErrors"], [])

    def test_missing_persona_frontmatter_fails_for_persona_scoped_docs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            guide = root / "docs" / "assets" / "library" / "developer" / "missing-persona.md"
            guide.parent.mkdir(parents=True)
            guide.write_text("# Missing Persona\n", encoding="utf-8")

            report = guide_coverage_probe.persona_validation_report(root)

        self.assertEqual(report["status"], "failed")
        self.assertTrue(any("missing persona frontmatter" in error for item in report["errors"] for error in item["errors"]))

    def test_unknown_persona_frontmatter_fails_for_persona_scoped_docs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            guide = root / "docs" / "assets" / "library" / "developer" / "unknown-persona.md"
            guide.parent.mkdir(parents=True)
            guide.write_text(
                "---\n"
                "title: Unknown Persona\n"
                "persona: reviewer\n"
                "---\n\n"
                "# Unknown Persona\n",
                encoding="utf-8",
            )

            report = guide_coverage_probe.persona_validation_report(root)

        self.assertEqual(report["status"], "failed")
        self.assertTrue(any("unknown persona" in error for item in report["errors"] for error in item["errors"]))

    def test_custom_persona_frontmatter_passes_for_matching_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            guide = root / "docs" / "assets" / "library" / "support-lead" / "handoff.md"
            guide.parent.mkdir(parents=True)
            guide.write_text(
                "---\n"
                "title: Support Handoff\n"
                "persona: support-lead\n"
                "---\n\n"
                "# Support Handoff\n",
                encoding="utf-8",
            )
            personas = [
                {
                    "slug": "support-lead",
                    "label": "Support Lead",
                    "description": "Support leaders reviewing user-facing workflow docs.",
                    "primitive": "maintainer",
                }
            ]

            report = guide_coverage_probe.persona_validation_report(root, personas)

        self.assertEqual(report["status"], "passed")

    def test_custom_persona_schema_errors_fail_report(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            personas = [
                {
                    "slug": "Support Lead",
                    "label": "Support Lead",
                    "description": "Invalid custom persona.",
                    "primitive": "operator",
                },
                {
                    "slug": "Support Lead",
                    "label": "Duplicate Support Lead",
                    "description": "Duplicate custom persona.",
                    "primitive": "user",
                },
            ]

            report = guide_coverage_probe.persona_validation_report(root, personas)

        self.assertEqual(report["status"], "failed")
        schema_errors = [error for item in report["errors"] for error in item["errors"]]
        self.assertTrue(any("lowercase kebab-case" in error for error in schema_errors))
        self.assertTrue(any("primitive" in error for error in schema_errors))
        self.assertTrue(any("unique" in error for error in schema_errors))

    def test_path_frontmatter_drift_fails_for_persona_scoped_docs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            playbook = root / "docs" / "assets" / "playbooks" / "agent" / "lifecycle.md"
            playbook.parent.mkdir(parents=True)
            playbook.write_text(
                "---\n"
                "title: Lifecycle\n"
                "persona: developer\n"
                "---\n\n"
                "# Lifecycle\n",
                encoding="utf-8",
            )

            report = guide_coverage_probe.persona_validation_report(root)

        self.assertEqual(report["status"], "failed")
        self.assertTrue(any("does not match path" in error for item in report["errors"] for error in item["errors"]))


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
        self.assertNotIn("npm test -w packages/cli -- consistency install skill-catalog skill-registry", hints)

    def test_make_docs_validation_requires_node_workspace_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "package.json").write_text('{"name":"make-docs"}\n', encoding="utf-8")

            hints = closeout_probe.validation_hints(
                [{"path": "packages/skills/closeout-phase/SKILL.md", "category": "skill"}],
                root,
            )

        self.assertIn("npm test -w packages/cli -- consistency install skill-catalog skill-registry", hints)


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
