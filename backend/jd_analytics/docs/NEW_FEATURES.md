# RADIX Role 1 — Accuracy + integration enhancement

This update builds on the **existing working project**. It preserves the original
`POST /api/jd/analyze` response (`source_type`, `source_file`, `company`, `role`, `skills`).
This is the shared output sent to **Role 5 — Skill Matching**.

## What's new

1. **Quality checker:** detects RADIX categories suggested by the JD text that
   are missing from the extracted `skills` array. These are *hints to review*,
   not facts and **never auto-added** to the official result.
2. **Potential duplicate alerts:** e.g. `SQL` vs `SQL Knowledge`; reports them
   without deleting anything or changing scoring inputs.
3. **New `POST /api/jd/analyze-report`:** same PDF/DOCX upload; response is
   `{ "jd": <original RADIX shape>, "quality_report": { ... } }`.
4. **CLI `--report`:** save QA review alongside output JSON.
5. **Batch CLI:** safe three-JD default to generate JSON outputs and a summary.
6. **React/Tailwind example:** typed API client, upload panel, evidence cards,
   download JSON and a quality report panel. It can pass the official JD JSON
   to Role 5 using the `onAnalyzed(jd)` callback.
7. **Clearer environment configuration:** optional `JD_CORS_ORIGINS` for local
   development frontend ports; PyMuPDF import no longer uses deprecated `fitz`.

## Apply the small update to your existing project (recommended)

Keep your **original** `RADIX_Role1_JD_Analytics` project. It already contains
working `.env` credentials, your output JSON files, and the improved LLM prompt.

1. Stop FastAPI in VS Code with **Ctrl+C**.
2. Make a backup copy of your existing project folder, OR at minimum back up
   `radix_jd/api.py`, `radix_jd/cli.py`, `radix_jd/documents.py`.
3. Extract **RADIX_Role1_Features_Patch.zip** and copy its contents *into* the
   existing `RADIX_Role1_JD_Analytics` folder. Approve overwriting the three
   existing source files named above.
4. **DO NOT change `.env` or `radix_jd/llm.py`**. Neither is in the patch.
5. Test:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Expected on a matching baseline: **12 passed** (not a guarantee for locally
modified code). Run the old tests if you need a regression check.

## Run the quality report (uses one Gemini request)

```powershell
.\.venv\Scripts\python.exe -m radix_jd.cli --file "samples/JDs/PDF/Google LLC - Software Engineer.pdf" --output "outputs/google_swe.json" --report "outputs/google_swe.quality.json"
```

Read `outputs/google_swe.quality.json` for `coverage_hints`,
`possible_duplicates`, category counts and confidence counts. These reports
are kept separate from the JSON shared with Role 5.

## Batch test your supplied JDs

First preview file selection **without sending any API requests**:

```powershell
.\.venv\Scripts\python.exe -m radix_jd.batch --dry-run
```

Analyze the first three sample PDF files (makes 3 Gemini requests):

```powershell
.\.venv\Scripts\python.exe -m radix_jd.batch
```

For all six PDFs (makes 6 Gemini requests; check API quota first):

```powershell
.\.venv\Scripts\python.exe -m radix_jd.batch --limit 6
```

Every resulting JD has its own `*.json`, `*.quality.json`, plus a `summary.json`
in `outputs/batch/`. The `outputs/` directory must remain gitignored.

## Swagger and frontend

Start the server:

```powershell
.\.venv\Scripts\python.exe -m uvicorn radix_jd.api:app --reload --port 8000
```

Open http://127.0.0.1:8000/docs to test `POST /api/jd/analyze-report`.

For your team's React frontend, copy these files into a suitable location:
- `integration/jdAnalyticsClient.ts`
- `integration/JDAnalyticsPanel.tsx`

**Keep both files in the same folder** or adjust the import path. Example:

```tsx
import JDAnalyticsPanel from './components/JDAnalyticsPanel';

export function TalentMatchScreen() {
  return <JDAnalyticsPanel onAnalyzed={(jd) => {
    // jd is exactly the existing RADIX shape used by Role 5.
    console.log(jd.skills);
  }} />;
}
```

Configure the team's frontend environment (example for Vite-based tooling):

```text
VITE_JD_API_URL=http://127.0.0.1:8000
```

The frontend can only call this URL if the Python backend is running **on the
same computer as the browser**. To demo from another device or deploy online,
configure a reachable backend address and allowed frontend CORS origin.
Never put `GEMINI_API_KEY` in the frontend's environment or GitHub repository.

## GitHub handoff and safety

Your team's existing repo contains a React app. Put the Python project inside
an agreed folder, e.g. `backend/jd_analytics/` on your own branch, not in the
`src/` React folder. Run Python commands from the backend folder.

Commit `radix_jd/`, `tests/`, `requirements.txt`, `README.md`, docs and safe
`.env.example`. **Exclude** `.env`, `.venv/`, `outputs/`, caches, and
`llm_backup.py`. The update patch doesn't contain any secrets.

## Limitations

- QA keyword hints are heuristic and require human confirmation; the source
  document may use novel phrasing not covered by patterns.
- The new live-AI feature needs your key and an available model; offline tests
  check correctness with stubs, not actual Gemini extraction quality.
- Sample PDFs containing scanned images are not supported without OCR.
- No production authentication, rate limiting or cloud deployment is included.
