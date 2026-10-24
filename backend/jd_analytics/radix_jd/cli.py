"""Command-line test runner; supports keyless PDF/DOCX text extraction."""
import argparse
import json
from pathlib import Path
from .documents import extract_text
from .llm import analyze_jd
from .quality import quality_report


def main():
    parser = argparse.ArgumentParser(description="RADIX Role 1 — JD Analytics")
    parser.add_argument("--file", required=True, type=Path, help="Path to PDF/DOCX JD")
    parser.add_argument("--text-only", action="store_true", help="Extract text without calling AI")
    parser.add_argument("--output", type=Path, help="Write structured JSON or text to a file")
    parser.add_argument("--report", type=Path, help="Save a skill coverage/quality report as JSON (requires AI)")
    args = parser.parse_args()
    raw = args.file.read_bytes()
    text = extract_text(args.file.name, raw)
    if args.text_only:
        if args.report:
            parser.error("--report cannot be used together with --text-only")
        result = text
    else:
        analysis = analyze_jd(args.file.name, text)
        result = json.dumps(analysis.model_dump(), indent=2, ensure_ascii=False)
        if args.report:
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(
                json.dumps(quality_report(analysis, text), indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            print(f"Quality report saved: {args.report}")
    print(result if len(result) < 12000 else result[:12000] + "\n[output shortened]")
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(result + "\n", encoding="utf-8")
        print(f"Saved: {args.output}")

if __name__ == "__main__":
    main()
