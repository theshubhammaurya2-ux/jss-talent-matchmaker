import unittest
from talent_check import candidate_level, run_talent_check


class TalentCheckTests(unittest.TestCase):
    def test_confidence_points_and_clamp(self):
        skills = [
            {"category_code": "COD", "confidence": "high"},
            {"category_code": "COD", "confidence": "medium"},
            {"category_code": "COD", "confidence": "low"},
        ]
        self.assertEqual(candidate_level(skills, "COD"), 6)
        self.assertEqual(candidate_level([], "COD"), 1)
        self.assertEqual(candidate_level(skills * 5, "COD"), 10)

    def test_readiness_and_gap_breakdown(self):
        profile = {"name": "Test Candidate", "skills": [
            {"skill_name": "Python", "category_code": "COD", "confidence": "high"}
        ]}
        company = {"company": "Example Co", "required_levels": {"COD": 6, "DSA": 2}}
        result = run_talent_check(profile, company)
        self.assertEqual(result["readiness_score"], 50)
        self.assertEqual(result["categories_below_bar"], 2)
        self.assertEqual(result["total_categories"], 2)
        self.assertTrue(next(row for row in result["skillset_gap"] if row["category_code"] == "COD")["gap"])

    def test_result_contains_12_skillsets_for_supplied_data(self):
        profile = {"name": "No Skills", "skills": []}
        company = {"company": "Example Co", "required_levels": {code: 5 for code in [
            "DSA", "COD", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS"
        ]}}
        result = run_talent_check(profile, company)
        self.assertEqual(len(result["skillset_gap"]), 12)
        self.assertEqual(result["readiness_score"], 20)


if __name__ == "__main__":
    unittest.main()
