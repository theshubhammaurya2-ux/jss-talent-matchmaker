# RADIX Talent Match — Role 1: JD Analytics

This starter module reads **PDF or DOCX job descriptions**, extracts text, asks a **Gemini LLM** to identify required skills, maps them to the **12 RADIX categories**, and returns the shared JSON handoff for **Role 5 (Skill Matching)**.

It follows the official participant brief's pages 7 and 9–10. This is a working *starter implementation*, not a claimed final AI extraction benchmark. No API key is included. Tests cover local document extraction and schema validation; live AI results must be checked with your own key.

## Project structure

```
radix_jd/documents.py   Reads PDFs/DOCX
radix_jd/models.py      RADIX JSON contract, validators
radix_jd/llm.py         AI extraction prompt and Gemini API call
radix_jd/api.py         FastAPI endpoints for React integration
radix_jd/cli.py         Run manually / save JSON
samples/JDs/            6 sample JDs, PDF + DOCX
outputs/                Your generated output files (created on use)
tests/test_role1.py     Offline tests
```

## 1. Setup on Windows 11 (PowerShell inside VS Code)

Install VS Code's **Python extension** if not already installed. Open this folder in VS Code, then choose `Terminal > New Terminal` and run:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

If `py -3.12` is not recognized, use `python -m venv .venv` instead.
You do **not** need to activate the environment: the commands below use the interpreter directly.

## 2. Confirm raw text extraction — NO API key needed

```powershell
.\.venv\Scripts\python.exe -m radix_jd.cli --file "samples/JDs/PDF/Google LLC - Software Engineer.pdf" --text-only
```

Try Word too:

```powershell
.\.venv\Scripts\python.exe -m radix_jd.cli --file "samples/JDs/Word/Microsoft - Data Analyst.docx" --text-only
```

Run offline tests:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

The milestone checklist's **JD text extraction** is met when PDF and DOCX raw text work with actual sample JDs.

## 3. Connect Gemini for actual LLM skill extraction

Create a file named `.env` in this project folder, using `.env.example` as a template. Obtain an API key from [Google AI Studio](https://aistudio.google.com/apikey). The key stays on the Python backend, **never in React or committed to Git**.

```
GEMINI_API_KEY=your_real_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

The sample model can be changed to a model available to your account. **Pricing, free-tier access and model availability can vary**; check Google AI Studio before using.

Run extraction and write the result:

```powershell
.\.venv\Scripts\python.exe -m radix_jd.cli --file "samples/JDs/PDF/Google LLC - Software Engineer.pdf" --output "outputs/google_swe.json"
```

Run the command with 2 more JDs (e.g., Google Data Scientist and Oracle Associate SWE). Manually compare results to the source. The brief requires valid structured skill lists for **at least 3 JDs** according to the milestone checklist.

## 4. Start the backend for teammate's React app

```powershell
.\.venv\Scripts\python.exe -m uvicorn radix_jd.api:app --reload --port 8000
```

Open http://127.0.0.1:8000/docs for interactive upload/testing. Endpoints:

- `GET /health` — server check
- `POST /api/jd/extract-text` — multipart field **file**; returns raw text, no AI key needed
- `POST /api/jd/analyze` — multipart field **file**; returns structured JD JSON

React example:

```ts
const formData = new FormData();
formData.append('file', uploadedFile);
const response = await fetch('http://localhost:8000/api/jd/analyze', {
  method: 'POST', body: formData,
});
if (!response.ok) throw new Error(await response.text());
const jdResult = await response.json();
// Pass jdResult to your teammate's Role 5 module.
```

Do **not** set `Content-Type` manually for `FormData` (the browser adds the multipart boundary).

## 5. JSON to hand to Role 5

```json
{
  "source_type": "jd",
  "source_file": "Google LLC - Software Engineer.pdf",
  "company": "Google LLC",
  "role": "Software Engineer (SWE)",
  "skills": [
    {
      "skill_name": "Data structures and algorithms",
      "category_code": "DSA",
      "evidence": "Strong grasp of data structures and algorithms",
      "confidence": "high"
    }
  ]
}
```

**Illustrative example only**, not a verified complete extraction.

### Codes
`COD`, `DSA`, `OOD`, `APTI`, `COMM`, `AI`, `CLOUD`, `SQL`, `SWE`, `SYSD`, `NETW`, `OS`, `OTHER`.

Team must agree to this JSON contract at the start. The current output deliberately contains the keys specified in the brief without inventing additional required properties.

## What to watch for

1. **Evidence**: The AI can get categories wrong. Manually check each skill and its supporting wording in the JD.
2. **Nice to Have**: Distinguish optional criteria from required skills. Current prompt excludes optional-only skills; if the team wants them, agree on an extra JSON field before changing code.
3. **PDF quality**: This module reads text-based PDFs. Scanned PDFs with no selectable text need OCR and are not supported yet.
4. **API limits**: If your API key or model fails, the app reports an error instead of returning a fake result.
5. **Data contract**: Always coordinate field names with Role 5 before integration.

### Official milestones for JD Analytics

- **Milestone 5:** JD text extraction — PDF or DOCX, raw text.
- **Milestone 6:** JD skill extraction — structured list for at least 3 of 6 JDs.

Both milestones appear in the provided `RADIX_Talent_Match_Milestone_Checklist.xlsx`.
