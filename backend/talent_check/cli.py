"""Run Talent Check from candidate JSON using the supplied company snapshot."""
import argparse
import json
from pathlib import Path
from talent_check import run_talent_check

BASE = Path(__file__).resolve().parent


def main() -> None:
    parser = argparse.ArgumentParser(description="Compare a candidate profile with a company skill bar")
    parser.add_argument("--profile", required=True, help="Path to a candidate profile JSON containing name and skills")
    parser.add_argument("--company", required=True, help="Exact company name from data/company_skillsets.json")
    parser.add_argument("--companies-file", default=str(BASE / "data" / "company_skillsets.json"))
    args = parser.parse_args()

    profile = json.loads(Path(args.profile).read_text(encoding="utf-8"))
    records = json.loads(Path(args.companies_file).read_text(encoding="utf-8"))
    company = next((item for item in records if item["company"].casefold() == args.company.casefold()), None)
    if company is None:
        names = ", ".join(item["company"] for item in records)
        parser.error(f"Unknown company {args.company!r}. Available companies: {names}")
    print(json.dumps(run_talent_check(profile, company), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
