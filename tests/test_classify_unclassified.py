"""Tests for tools/classify_unclassified.py — consolidated taxonomy classifier."""

import sys
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path

sys.path.insert(0, "tools")


class ClassifyUnclassifiedTest(unittest.TestCase):
    """Verify the consolidated classifier produces expected categories."""

    def setUp(self):
        self._import_classify()

    def _import_classify(self):
        """Import the module fresh for each test."""
        # Clear any cached import
        for mod_name in list(sys.modules.keys()):
            if 'classify_unclassified' in mod_name:
                del sys.modules[mod_name]
        from tools import classify_unclassified
        self.classify = classify_unclassified.classify

    # ── v3 explicit mapping tests (most authoritative) ────────────────────

    def test_explicit_mapping_architecture(self):
        """Known architecture → Neural Networks / Core Models."""
        result = self.classify("ResNet-50")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Neural Networks")

    def test_explicit_mapping_optimizer(self):
        """Known optimizer → Optimization Algorithms."""
        result = self.classify("AdamW")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Optimization Algorithms")

    def test_explicit_mapping_dataset(self):
        """Known dataset → Data Processing / Data Pipeline."""
        result = self.classify("ImageNet")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Data Processing")

    def test_explicit_mapping_tool(self):
        """Known tool → Machine Learning Frameworks."""
        result = self.classify("PyTorch")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Machine Learning Frameworks")

    def test_explicit_mapping_ai_platform(self):
        """Known AI platform → AI Applications."""
        result = self.classify("Midjourney")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "AI Applications")

    def test_explicit_mapping_statistics(self):
        """Known statistical concept → Statistical Methods."""
        result = self.classify("Benjamini-Hochberg Procedure")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Statistical Methods")

    def test_explicit_mapping_ethics(self):
        """Known ethics/regulation term → Ethics & Governance."""
        result = self.classify("CCPA for AI")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Ethics & Governance")

    def test_explicit_mapping_rl(self):
        """Known RL term → Reinforcement Learning."""
        result = self.classify("MADDPG")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Reinforcement Learning")

    # ── v1 pattern-list fallback tests ────────────────────────────────────

    def test_pattern_mobilenet(self):
        """MobileNet variant triggers v1 pattern arch match."""
        result = self.classify("MobileNetV3")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Neural Networks")

    def test_pattern_dataset(self):
        """Known dataset name triggers v1 pattern dataset match."""
        result = self.classify("Cityscapes dataset")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Data Processing")

    def test_pattern_tool(self):
        """Known tool name triggers v1 pattern tool match."""
        result = self.classify("Scikit-learn classifier")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Machine Learning Frameworks")

    def test_pattern_math(self):
        """Known math concept triggers v1 pattern math match."""
        result = self.classify("Bayesian inference methods")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Statistical Methods")

    def test_pattern_vendor_word_boundary(self):
        """Vendor name only matches as a whole word (word-boundary fix)."""
        # 'arm' as a substring in 'warmup' should NOT trigger vendor match
        result = self.classify("Warmup scheduling")
        self.assertIsNone(result)

    # ── v2 suffix/regex fallback tests ────────────────────────────────────

    def test_suffix_transformer(self):
        """Title ending in 'Former' triggers v2 arch match."""
        result = self.classify("Random-Former")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Neural Networks")

    def test_suffix_gpt(self):
        """Title with GPT prefix triggers v2 arch match."""
        result = self.classify("GPT-7")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Neural Networks")

    def test_suffix_set(self):
        """Title ending in 'Set' triggers v2 dataset match."""
        result = self.classify("AwesomeDataset")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Data Processing")

    # ── Edge cases ────────────────────────────────────────────────────────

    def test_with_parenthetical(self):
        """Parenthetical should be stripped for matching."""
        result = self.classify("FlashAttention-2 (memory efficient)")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Model Optimization")

    def test_case_insensitive(self):
        """Classification should be case-insensitive."""
        result = self.classify("adamw")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Optimization Algorithms")

    def test_unknown_term(self):
        """Unknown terms should return None."""
        result = self.classify("Xyz1234NonExistentTerm")
        self.assertIsNone(result)

    def test_flashattention_model_optimization(self):
        """FlashAttention should be Model Optimization (reviewer fix)."""
        result = self.classify("FlashAttention")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Model Optimization")

    def test_makecom_ml_frameworks(self):
        """Make.com should be ML Frameworks (reviewer fix)."""
        result = self.classify("Make.com")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Machine Learning Frameworks")

    # ── Strategy ordering ─────────────────────────────────────────────────

    def test_strategy_ordering_v3_first(self):
        """Explicit mapping (v3) should be tried before patterns (v1)."""
        # 'Adam' is in both explicit optimizers and v1 patterns
        result = self.classify("Adam")
        self.assertIsNotNone(result)
        # Should resolve to Optimization (v3 explicit wins over v1 pattern)
        self.assertEqual(result[0], "Optimization Algorithms")

    def test_v2_fallback(self):
        """v2 should work when v3 and v1 reject the term."""
        # "Cross-Former" isn't in TERM_MAP (v3) and doesn't contain v1 arch keywords
        # It hits the v2 -Former\b suffix pattern
        result = self.classify("Cross-Former")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "Neural Networks")


if __name__ == "__main__":
    unittest.main()
