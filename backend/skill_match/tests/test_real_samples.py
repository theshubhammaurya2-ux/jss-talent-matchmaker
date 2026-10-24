"""Checks the brief's 'definition of done': different candidates -> visibly different results."""
import json, os
from radix_match.models import SkillSource
from radix_match.matcher import match

BASE = os.path.join(os.path.dirname(__file__), "..", "samples")


def load(kind, name):
    with open(os.path.join(BASE, kind, name + ".json"), encoding="utf-8") as f:
        return SkillSource.from_dict(json.load(f))


def score(c, j):
    return match(load("candidates", c), load("jd_skills", j)).match_score


def test_karthik_better_on_data_than_swe():
    assert score("karthik_subramaniam", "google_data_scientist") > score("karthik_subramaniam", "google_swe") + 30


def test_ananya_better_on_swe_than_data():
    assert score("ananya_rao", "google_swe") > score("ananya_rao", "google_data_scientist") + 30


def test_priya_best_fit_is_oracle_support():
    assert score("priya_menon", "oracle_app_support") > score("priya_menon", "google_swe")


def test_rohan_competitive_everywhere():
    assert all(score("rohan_verma", j) >= 40 for j in
               ["google_swe", "microsoft_swe", "google_data_scientist", "oracle_ase"])


def test_scores_are_not_constant():
    scores = {score(c, "google_swe") for c in
              ["karthik_subramaniam", "ananya_rao", "priya_menon", "rohan_verma"]}
    assert len(scores) >= 3
