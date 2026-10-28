import io
import pymupdf
import docx

MAX_FILE_BYTES = 10 * 1024 * 1024

class DocumentError(ValueError):
    pass

def extract_text(filename: str, content: bytes) -> str:
    if len(content) > MAX_FILE_BYTES:
        raise DocumentError(f"File exceeds {MAX_FILE_BYTES} bytes")
        
    ext = filename.lower().split('.')[-1]
    if ext == 'pdf':
        try:
            with pymupdf.open(stream=content, filetype="pdf") as doc:
                return "\n".join([page.get_text() for page in doc])
        except Exception as e:
            raise DocumentError("Invalid or corrupted PDF file.") from e
    elif ext in ['doc', 'docx']:
        try:
            doc = docx.Document(io.BytesIO(content))
            return "\n".join([p.text for p in doc.paragraphs])
        except Exception as e:
            raise DocumentError("Invalid or corrupted Word file.") from e
    else:
        raise DocumentError("Unsupported file type. Use PDF or DOCX.")
