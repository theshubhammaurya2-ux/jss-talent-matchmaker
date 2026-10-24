"""Optional batch JD analysis against the hackathon's sample files.

Usage (safest preview): python -m radix_jd.batch --dry-run
Actual analysis makes one Gemini call per JD. Default limited to 3 JDs.
"""
import argparse
import json
import re
from pathlib import Path
from .documents import JDDocumentError, extract_text
from .llm import JDLLMError, analyze_jd
from .quality import quality_report


def candidates(directory: Path, *, limit: int) -> list[Path]:
    if not directory.is_dir():
        raise ValueError(f"No such JD folder: {directory}")
    found = sorted(p for p in directory.iterdir() if p.is_file() and p.suffix.lower() in {'.pdf', '.docx'})
    if not found:
        raise ValueError("No PDF or DOCX JDs found in the selected folder.")
    return found[:limit]


def safe_stem(filename: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "_", Path(filename).stem.lower()).strip("_")
    return value[:80] or "jd"


def main() -> None:
    parser = argparse.ArgumentParser(description="Batch-review RADIX JDs (AI calls require API key)")
    parser.add_argument("--directory", type=Path, default=Path("samples/JDs/PDF"))
    parser.add_argument("--output-dir", type=Path, default=Path("outputs/batch"))
    parser.add_argument("--limit", type=int, default=3, help="Number of files to process (1-6 recommended)")
    parser.add_argument("--dry-run", action="store_true", help="Preview files without making AI calls")
    args = parser.parse_args()
    if args.limit <= 0:
        parser.error("--limit must be positive")
    try:
        files = candidates(args.directory, limit=args.limit)
    except ValueError as exc:
        parser.error(str(exc))
    print(f"Selected {len(files)} job description(s):")
    for file in files:
        print(f"  - {file.name}")
    if args.dry_run:
        print("DRY RUN: no Gemini calls made and no files created.")
        return
    args.output_dir.mkdir(parents=True, exist_ok=True)
    summary = []
    for file in files:
        try:
            text = extract_text(file.name, file.read_bytes())
            result = analyze_jd(file.name, text)
            qa = quality_report(result, text)
            slug = safe_stem(file.name)
            (args.output_dir / f"{slug}.json").write_text(
                json.dumps(result.model_dump(), indent=2, ensure_ascii=False), encoding="utf-8")
            (args.output_dir / f"{slug}.quality.json").write_text(
                json.dumps(qa, indent=2, ensure_ascii=False), encoding="utf-8")
            summary.append({"file": file.name, "status": "success", "company": result.company,
                            "role": result.role, "skills": len(result.skills),
                            "coverage_hints": len(qa["coverage_hints"])})
            print(f"SUCCESS {file.name}: {len(result.skills)} skills")
        except (JDDocumentError, JDLLMError, OSError) as exc:
            summary.append({"file": file.name, "status": "failed", "reason": str(exc)})
            print(f"FAILED {file.name}: {exc}")
    (args.output_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"Summary written to {args.output_dir / 'summary.json'}")
    if any(row["status"] == "failed" for row in summary):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
