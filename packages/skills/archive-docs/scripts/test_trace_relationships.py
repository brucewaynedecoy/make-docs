"""Current archive and audience paths must remain discoverable without CLI state."""
import tempfile
import unittest
from pathlib import Path
from trace_relationships import discover_artifacts, build_lateral_relationships, build_history_record_associations, resolve_link

class CurrentLayoutTest(unittest.TestCase):
    def test_history_and_custom_audience_relationships(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            docs = root / "docs"
            files = {
                "docs/plans/2026-09-09-w19-r4-example/00-overview.md": "# Plan\n",
                "docs/assets/maintainer/guide.md": "---\nrelated:\n  - ../../plans/2026-09-09-w19-r4-example/\n---\n",
                "docs/assets/reviewer/custom.md": "---\nrelated:\n  - ../../plans/2026-09-09-w19-r4-example/\n---\n",
                ".make-docs/archive/history/done.md": "---\ncoordinate: W19 R4\n---\nPast work.\n",
                "docs/assets/library/developer/old.md": "Legacy.\n",
            }
            for name, text in files.items():
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(text)
            artifacts = discover_artifacts(docs)
            self.assertIn("../.make-docs/archive/history/done.md", artifacts)
            self.assertIn("assets/reviewer/custom.md", artifacts)
            self.assertNotIn("assets/library/developer/old.md", artifacts)
            self.assertEqual(build_lateral_relationships(artifacts, docs), 2)
            self.assertGreater(build_history_record_associations(artifacts, docs), 0)
            self.assertEqual(resolve_link("plans/2026-09-09-w19-r4-example/00-overview.md", "../../../.make-docs/archive/history/done.md", docs), "../.make-docs/archive/history/done.md")
            self.assertIsNone(resolve_link("assets/maintainer/guide.md", "../../../../outside.md", docs))

if __name__ == "__main__":
    unittest.main()
