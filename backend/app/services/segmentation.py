import io
import re
import logging
from dataclasses import dataclass
from typing import List, Optional

from app.schemas.knowledge import SegmentType
from app.services.extractor import ExtractionError

logger = logging.getLogger(__name__)


@dataclass
class RawSegment:
    """Intermediate segment representation prior to global offset computation."""
    content: str
    segment_type: str
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    source_label: Optional[str] = None


@dataclass
class DocumentSegmentData:
    """Fully resolved segment data with 0-based document-relative offsets."""
    content: str
    segment_type: str
    sequence_number: int
    char_offset_start: int
    char_offset_end: int
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    source_label: Optional[str] = None


@dataclass
class DocumentParseResult:
    """Result of parsing and segmenting an institutional document."""
    extracted_text: str
    character_count: int
    word_count: int
    segments: List[DocumentSegmentData]


class DocumentParserService:
    """
    Parses and segments uploaded documents (PDF, DOCX, TXT) into structured,
    ordered, evidence-grounded segments with verified character offsets.
    """

    @classmethod
    def parse(cls, file_bytes: bytes, file_extension: str) -> DocumentParseResult:
        """
        Parses and segments document bytes according to file format.
        Raises ExtractionError if document is malformed or extraction fails.
        """
        ext = file_extension.lower().lstrip(".")
        if ext == "pdf":
            return cls._parse_pdf(file_bytes)
        elif ext == "docx":
            return cls._parse_docx(file_bytes)
        elif ext == "txt":
            return cls._parse_txt(file_bytes)
        else:
            raise ExtractionError(f"Unsupported file extension for segmentation: .{ext}")

    @classmethod
    def _parse_pdf(cls, file_bytes: bytes) -> DocumentParseResult:
        """
        Extracts PDF text page-by-page, preserving 1-based page numbers
        and document reading order.
        """
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
                    reader.decrypt("")
                except Exception:
                    raise ExtractionError("PDF is encrypted and password protected.")

            raw_segments: List[RawSegment] = []
            for page_idx, page in enumerate(reader.pages):
                page_num = page_idx + 1
                try:
                    page_text = page.extract_text()
                except Exception as p_err:
                    logger.warning("Error extracting text from PDF page %d: %s", page_num, p_err)
                    page_text = ""

                if page_text and page_text.strip():
                    raw_segments.append(
                        RawSegment(
                            content=page_text.strip(),
                            segment_type=SegmentType.PAGE.value,
                            page_number=page_num,
                            section_title=None,
                            source_label=f"Page {page_num}",
                        )
                    )

            return cls._assemble_segments(raw_segments)
        except PdfReadError as exc:
            raise ExtractionError(f"Malformed or invalid PDF structure: {exc}") from exc
        except Exception as exc:
            if isinstance(exc, ExtractionError):
                raise
            raise ExtractionError(f"PDF extraction error: {exc}") from exc

    @classmethod
    def _parse_docx(cls, file_bytes: bytes) -> DocumentParseResult:
        """
        Extracts DOCX content preserving document reading order across headings,
        paragraphs, and tables.
        """
        try:
            import docx
            from docx.opc.exceptions import PackageNotFoundError
            from docx.text.paragraph import Paragraph
            from docx.table import Table
        except ImportError as exc:
            raise ExtractionError("python-docx is not installed.") from exc

        try:
            stream = io.BytesIO(file_bytes)
            doc = docx.Document(stream)
            raw_segments: List[RawSegment] = []
            active_section_title: Optional[str] = None
            para_idx = 0
            table_idx = 0

            # Traverse body children in exact document sequence
            for child in doc.element.body:
                if child.tag.endswith("p"):
                    p = Paragraph(child, doc)
                    text = p.text.strip()
                    if not text:
                        continue

                    style_name = p.style.name if p.style else ""
                    is_heading = (
                        style_name.lower().startswith("heading")
                        or style_name.lower() in ["title", "subtitle"]
                    )

                    if is_heading:
                        active_section_title = text
                        raw_segments.append(
                            RawSegment(
                                content=text,
                                segment_type=SegmentType.SECTION.value,
                                page_number=None,
                                section_title=text,
                                source_label=f"{style_name}: {text[:50]}" if len(text) > 50 else f"{style_name}: {text}",
                            )
                        )
                    else:
                        para_idx += 1
                        label = (
                            f"Paragraph {para_idx}"
                            if not active_section_title
                            else f"{active_section_title}, Para {para_idx}"
                        )
                        raw_segments.append(
                            RawSegment(
                                content=text,
                                segment_type=SegmentType.PARAGRAPH.value,
                                page_number=None,
                                section_title=active_section_title,
                                source_label=label,
                            )
                        )

                elif child.tag.endswith("tbl"):
                    tbl = Table(child, doc)
                    table_lines = []
                    for row in tbl.rows:
                        row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                        if row_cells:
                            table_lines.append(" | ".join(row_cells))

                    if table_lines:
                        table_idx += 1
                        table_content = "\n".join(table_lines)
                        label = (
                            f"Table {table_idx}"
                            if not active_section_title
                            else f"{active_section_title}, Table {table_idx}"
                        )
                        raw_segments.append(
                            RawSegment(
                                content=table_content,
                                segment_type=SegmentType.TABLE.value,
                                page_number=None,
                                section_title=active_section_title,
                                source_label=label,
                            )
                        )

            return cls._assemble_segments(raw_segments)
        except (PackageNotFoundError, Exception) as exc:
            if isinstance(exc, ExtractionError):
                raise
            raise ExtractionError(f"Malformed or invalid DOCX document: {exc}") from exc

    @classmethod
    def _parse_txt(cls, file_bytes: bytes) -> DocumentParseResult:
        """
        Extracts TXT content with paragraph segmentation separated by double newlines.
        Preserves UTF-8 and latin-1 fallback decoding.
        """
        try:
            decoded = file_bytes.decode("utf-8").replace("\r\n", "\n")
        except UnicodeDecodeError:
            try:
                decoded = file_bytes.decode("latin-1").replace("\r\n", "\n")
            except Exception as exc:
                raise ExtractionError(f"Failed to decode text file: {exc}") from exc

        # Split into paragraph blocks by 2 or more newlines
        blocks = re.split(r"\n\s*\n+", decoded.strip())
        raw_segments: List[RawSegment] = []
        for idx, block in enumerate(blocks):
            cleaned = block.strip()
            if cleaned:
                raw_segments.append(
                    RawSegment(
                        content=cleaned,
                        segment_type=SegmentType.PARAGRAPH.value,
                        page_number=None,
                        section_title=None,
                        source_label=f"Paragraph {idx + 1}",
                    )
                )

        return cls._assemble_segments(raw_segments)

    @staticmethod
    def _assemble_segments(raw_segments: List[RawSegment]) -> DocumentParseResult:
        """
        Stitches segment contents with standard '\\n\\n' separators, computing
        exact document-relative 0-based character offsets for each segment.
        Verifies that full_text[char_offset_start:char_offset_end] == segment.content.
        """
        if not raw_segments:
            return DocumentParseResult(
                extracted_text="",
                character_count=0,
                word_count=0,
                segments=[],
            )

        full_text_parts: List[str] = []
        processed_segments: List[DocumentSegmentData] = []
        current_offset = 0

        for seq_num, raw in enumerate(raw_segments):
            if seq_num > 0:
                separator = "\n\n"
                full_text_parts.append(separator)
                current_offset += len(separator)

            start_offset = current_offset
            full_text_parts.append(raw.content)
            current_offset += len(raw.content)
            end_offset = current_offset

            processed_segments.append(
                DocumentSegmentData(
                    content=raw.content,
                    segment_type=raw.segment_type,
                    sequence_number=seq_num,
                    char_offset_start=start_offset,
                    char_offset_end=end_offset,
                    page_number=raw.page_number,
                    section_title=raw.section_title,
                    source_label=raw.source_label,
                )
            )

        full_text = "".join(full_text_parts)
        char_count = len(full_text)
        word_count = len(full_text.split())

        # Exact offset verification guarantee
        for seg in processed_segments:
            slice_text = full_text[seg.char_offset_start:seg.char_offset_end]
            if slice_text != seg.content:
                raise ExtractionError(
                    f"Segmentation offset verification failed at sequence {seg.sequence_number}: "
                    f"expected '{seg.content[:30]}...', got '{slice_text[:30]}...'"
                )

        return DocumentParseResult(
            extracted_text=full_text,
            character_count=char_count,
            word_count=word_count,
            segments=processed_segments,
        )
