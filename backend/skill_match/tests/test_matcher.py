from radix_match.models import Skill, SkillSource
from radix_match.matcher import match


def S(*pairs, **kw):
    """S(("Python","COD"), ("SQL","SQL"))"""
    return SkillSource(skills=[Skill(n, c, "", kw.get("conf", "high")) for n, c in pairs])


def test_exact_match_is_100():
    assert match(S(("Python", "COD")), S(("Python", "COD"))).match_score == 100


def test_alias_dsa():
    r = match(S(("DSA", "DSA")), S(("Data Structures", "DSA")))
    assert r.match_score == 100 and r.matched_skills[0].match_type == "name_match"


def test_missing_skill_is_reported():
    r = match(S(("Python", "COD")), S(("Python", "COD"), ("Kubernetes", "CLOUD")))
    assert [m.skill_name for m in r.missing_skills] == ["Kubernetes"]


def test_related_skill_gets_partial_credit():
    r = match(S(("Linux", "OS")), S(("Operating Systems", "OS")))
    assert r.match_score == 50 and r.matched_skills[0].match_type == "category_match"


def test_other_category_never_partial():
    r = match(S(("Excel", "OTHER")), S(("Power BI", "OTHER")))
    assert r.match_score == 0


def test_high_importance_gap_costs_more():
    jd = SkillSource(skills=[Skill("A", "COD", "", "high"), Skill("B", "SQL", "", "low")])
    miss_high = match(S(("B", "SQL")), jd).match_score
    miss_low = match(S(("A", "COD")), jd).match_score
    assert miss_low > miss_high


def test_empty_jd_does_not_crash():
    assert match(S(("Python", "COD")), SkillSource(skills=[])).match_score == 0


def test_empty_candidate():
    r = match(SkillSource(skills=[]), S(("Python", "COD")))
    assert r.match_score == 0 and len(r.missing_skills) == 1
