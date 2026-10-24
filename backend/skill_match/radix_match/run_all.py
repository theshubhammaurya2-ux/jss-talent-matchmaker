"""Score every candidate against every JD and print a table.
    python -m radix_match.run_all
"""
import glob
import os
from .cli import load
from .matcher import match


def main(base="samples"):
    cands = sorted(glob.glob(os.path.join(base, "candidates", "*.json")))
    jds = sorted(glob.glob(os.path.join(base, "jd_skills", "*.json")))
    cs = [load(p) for p in cands]
    js = [load(p) for p in jds]
    labels = [f"{j.company.split()[0]} {j.role.replace('Software Engineer', 'SWE')[:16]}" for j in js]
    w = 26
    print(" " * 22 + "".join(l.ljust(w) for l in labels))
    for c in cs:
        row = c.name.ljust(22)
        for j in js:
            row += f"{match(c, j).match_score}%".ljust(w)
        print(row)


if __name__ == "__main__":
    main()
