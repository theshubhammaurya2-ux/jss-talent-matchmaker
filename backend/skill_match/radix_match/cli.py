"""Run from terminal:
    python -m radix_match.cli samples/candidates/priya_menon.json samples/jd_skills/oracle_app_support.json
"""
import json
import sys
from .models import SkillSource
from .matcher import match


def load(path: str) -> SkillSource:
    with open(path, encoding="utf-8") as f:
        return SkillSource.from_dict(json.load(f))


def main():
    if len(sys.argv) != 3:
        print("Usage: python -m radix_match.cli <candidate.json> <jd.json>")
        sys.exit(1)
    result = match(load(sys.argv[1]), load(sys.argv[2]))
    print(json.dumps(result.to_dict(), indent=2))


if __name__ == "__main__":
    main()
