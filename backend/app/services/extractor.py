import io
import logging
from typing import Tuple
from pathlib import Path

logger = logging.getLogger(__name__)


class ExtractionError(Exception):
    """Raised when text extraction from a document fails."""
    pass


class TextExtractor:
    """
    Extracts text from supported file types (PDF, DOCX, TXT).
    Normalizes whitespace and extracts both linear prose and tabular structures.
    """

    @classmethod
    def extract(cls, file_bytes: bytes, file_extension: str) -> Tuple[str, int, int]:
        """
        Extract text from file bytes based on the file extension.
        Returns (extracted_text, character_count, word_count).
        Raises ExtractionError if processing fails.
        """
        ext = file_extension.lower().lstrip(".")
        if ext == "txt":
            text = cls._extract_txt(file_bytes)
        elif ext == "pdf":
            text = cls._extract_pdf(file_bytes)
        elif ext == "docx":
            text = cls._extract_docx(file_bytes)
        else:
            raise ExtractionError(f"Unsupported file extension for extraction: .{ext}")

        text = text.strip()
        char_count = len(text)
        word_count = len(text.split())
        return text, char_count, word_count

    @staticmethod
    def _extract_txt(file_bytes: bytes) -> str:
        """Decodes raw text bytes with encoding fallbacks."""
        try:
            return file_bytes.decode("utf-8").replace("\r\n", "\n")
        except UnicodeDecodeError:
            try:
                return file_bytes.decode("latin-1").replace("\r\n", "\n")
            except Exception as exc:
                raise ExtractionError(f"Failed to decode text file: {exc}") from exc

    @staticmethod
    def _extract_pdf(file_bytes: bytes) -> str:
        """Extracts text from PDF documents using pypdf."""
        try:
            from pypdf import PdfReader
            from pypdf.errors import PdfReadError
        except ImportError as exc:
            raise ExtractionError("pypdf is not installed.") from exc

        try:
            stream = io.BytesIO(file_bytes)
            reader = PdfReader(stream)

            if reader.is_encrypted:
                try:
                    # Attempt decrypt with empty password for unencrypted permissions
                    reader.decrypt("")
                except Exception:
                    raise ExtractionError("PDF is encrypted and password protected.")

            extracted_pages = []
            for page_num, page in enumerate(reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        extracted_pages.append(page_text.strip())
                except Exception as p_err:
                    logger.warning("Error extracting text from PDF page %d: %s", page_num, p_err)

            return "\n\n".join(extracted_pages)
        except PdfReadError as exc:
            raise ExtractionError(f"Malformed or invalid PDF structure: {exc}") from exc
        except Exception as exc:
            if isinstance(exc, ExtractionError):
                raise
            raise ExtractionError(f"PDF extraction error: {exc}") from exc

    @staticmethod
    def _extract_docx(file_bytes: bytes) -> str:
        """Extracts text and table content from DOCX files using python-docx."""
        try:
            import docx
            from docx.opc.exceptions import PackageNotFoundError
        except ImportError as exc:
            raise ExtractionError("python-docx is not installed.") from exc

        try:
            stream = io.BytesIO(file_bytes)
            doc = docx.Document(stream)
            content_blocks = []

            # Extract body paragraphs
            for p in doc.paragraphs:
                if p.text and p.text.strip():
                    content_blocks.append(p.text.strip())

            # Extract tables
            for table in doc.tables:
                table_lines = []
                for row in table.rows:
                    row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_cells:
                        table_lines.append(" | ".join(row_cells))
                if table_lines:
                    content_blocks.append("\n".join(table_lines))

            return "\n\n".join(content_blocks)
        except (PackageNotFoundError, Exception) as exc:
            raise ExtractionError(f"Malformed or invalid DOCX document: {exc}") from exc

