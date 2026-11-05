import io
import docx
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.document import Document
from app.models.knowledge import DocumentSegment
from app.services.segmentation import DocumentParserService
from app.services.extractor import ExtractionError
from app.services.document_service import DocumentService


def make_multi_page_pdf(pages_text: list[str]) -> bytes:
    """Builds a valid multi-page PDF byte stream with the given page strings."""
    objects = []
    objects.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    N = len(pages_text)
    kids_refs = " ".join(f"{3 + 2 * i} 0 R" for i in range(N))
    font_id = 3 + 2 * N
    objects.append(f"2 0 obj << /Type /Pages /Kids [{kids_refs}] /Count {N} >> endobj\n".encode("utf-8"))

    for i, text in enumerate(pages_text):
        page_obj_id = 3 + 2 * i
        contents_obj_id = 4 + 2 * i
        if text:
            stream_content = f"BT\n/F1 12 Tf\n100 700 Td\n({text}) Tj\nET\n".encode("utf-8")
            stream_bytes = (
                f"{contents_obj_id} 0 obj << /Length {len(stream_content)} >> stream\n".encode("utf-8")
                + stream_content
                + b"endstream\nendobj\n"
            )
            page_obj = (
                f"{page_obj_id} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
                f"/Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {contents_obj_id} 0 R >> endobj\n".encode("utf-8")
            )
        else:
            stream_bytes = f"{contents_obj_id} 0 obj << /Length 0 >> stream\nendstream\nendobj\n".encode("utf-8")
            page_obj = f"{page_obj_id} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> >> endobj\n".encode("utf-8")
        objects.append(page_obj)
        objects.append(stream_bytes)

    font_obj = f"{font_id} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n".encode("utf-8")
    objects.append(font_obj)

    header = b"%PDF-1.4\n"
    body = b""
    offsets = [0]
    curr = len(header)
    for obj in objects:
        offsets.append(curr)
        body += obj
        curr += len(obj)

    xref_pos = len(header) + len(body)
    total_objs = len(objects) + 1
    xref = f"xref\n0 {total_objs}\n0000000000 65535 f \n".encode("utf-8")
    for off in offsets[1:]:
        xref += f"{off:010d} 00000 n \n".encode("utf-8")
    trailer = f"trailer << /Size {total_objs} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("utf-8")
    return header + body + xref + trailer


# -------------------------------------------------------------------------
# PDF Parsing & Segmentation Tests
# -------------------------------------------------------------------------

def test_pdf_multi_page_segmentation():
    """Verify that multi-page PDFs produce distinct page-level segments with exact 1-based page numbers."""
    pages = [
        "Executive Summary: Dr. Vance transitions to Chief Scientific Advisor.",
        "Operational Continuity: Research infrastructure handover to Dr. Thorne.",
        "Key Decisions: Regulatory compliance filings scheduled for Q4.",
    ]
    pdf_bytes = make_multi_page_pdf(pages)
    result = DocumentParserService.parse(pdf_bytes, "pdf")

    assert len(result.segments) == 3
    for idx, seg in enumerate(result.segments):
        assert seg.sequence_number == idx
        assert seg.segment_type == "page"
        assert seg.page_number == idx + 1
        assert seg.source_label == f"Page {idx + 1}"
        assert seg.content == pages[idx]
        # Verify exact offset slicing
        assert result.extracted_text[seg.char_offset_start:seg.char_offset_end] == seg.content


def test_pdf_empty_pages_handling():
    """Verify that empty pages do not corrupt 1-based page numbering for subsequent pages."""
    pages = [
        "Page One Active Text",
        "",  # Empty page 2
        "Page Three Active Text",
    ]
    pdf_bytes = make_multi_page_pdf(pages)
    result = DocumentParserService.parse(pdf_bytes, "pdf")

    assert len(result.segments) == 2
    seg1, seg2 = result.segments
    assert seg1.page_number == 1
    assert seg1.content == "Page One Active Text"
    assert seg2.page_number == 3
    assert seg2.content == "Page Three Active Text"
    assert result.extracted_text[seg1.char_offset_start:seg1.char_offset_end] == seg1.content
    assert result.extracted_text[seg2.char_offset_start:seg2.char_offset_end] == seg2.content


def test_pdf_malformed_handling():
    """Malformed or invalid PDF bytes must raise ExtractionError cleanly."""
    corrupt_bytes = b"%PDF-1.4\nCorrupt trailer and broken objects %%EOF"
    with pytest.raises(ExtractionError):
        DocumentParserService.parse(corrupt_bytes, "pdf")


# -------------------------------------------------------------------------
# DOCX Parsing & Segmentation Tests
# -------------------------------------------------------------------------

def test_docx_mixed_content_ordering_and_tables():
    """Verify DOCX preserves heading context, table structures, and exact reading order."""
    doc = docx.Document()
    doc.add_heading("Continuity Blueprint", level=1)
    doc.add_paragraph("This memo defines governance transfers for Project Relay.")

    # Add a table
    table = doc.add_table(rows=2, cols=2)
    table.rows[0].cells[0].text = "Role"
    table.rows[0].cells[1].text = "Owner"
    table.rows[1].cells[0].text = "Security Lead"
    table.rows[1].cells[1].text = "Sarah Chen"

    doc.add_paragraph("All infrastructure credentials must be revoked immediately upon departure.")

    stream = io.BytesIO()
    doc.save(stream)
    docx_bytes = stream.getvalue()

    result = DocumentParserService.parse(docx_bytes, "docx")
    assert len(result.segments) == 4

    # 1. Heading
    seg0 = result.segments[0]
    assert seg0.segment_type == "section"
    assert seg0.section_title == "Continuity Blueprint"
    assert seg0.content == "Continuity Blueprint"
    assert seg0.page_number is None

    # 2. Paragraph following heading
    seg1 = result.segments[1]
    assert seg1.segment_type == "paragraph"
    assert seg1.section_title == "Continuity Blueprint"
    assert "governance transfers" in seg1.content

    # 3. Table preserving pipe format
    seg2 = result.segments[2]
    assert seg2.segment_type == "table"
    assert seg2.section_title == "Continuity Blueprint"
    assert "Role | Owner" in seg2.content
    assert "Security Lead | Sarah Chen" in seg2.content

    # 4. Paragraph following table
    seg3 = result.segments[3]
    assert seg3.segment_type == "paragraph"
    assert seg3.section_title == "Continuity Blueprint"
    assert "infrastructure credentials" in seg3.content

    # Verify all offsets
    for seg in result.segments:
        assert result.extracted_text[seg.char_offset_start:seg.char_offset_end] == seg.content


def test_docx_empty_document():
    """An empty DOCX produces zero segments and empty string without error."""
    doc = docx.Document()
    stream = io.BytesIO()
    doc.save(stream)

    result = DocumentParserService.parse(stream.getvalue(), "docx")
    assert result.segments == []
    assert result.extracted_text == ""
    assert result.character_count == 0


def test_docx_malformed_handling():
    """Malformed DOCX bytes must raise ExtractionError."""
    with pytest.raises(ExtractionError):
        DocumentParserService.parse(b"PK\x03\x04not a valid docx zip", "docx")


# -------------------------------------------------------------------------
# TXT Parsing & Segmentation Tests
# -------------------------------------------------------------------------

def test_txt_paragraph_segmentation():
    """TXT documents split on double newlines and preserve single internal line breaks."""
    text = (
        "Paragraph One.\nStill Paragraph One.\n\n"
        "Paragraph Two starts here.\n\n\n"
        "Paragraph Three is the final block."
    )
    result = DocumentParserService.parse(text.encode("utf-8"), "txt")

    assert len(result.segments) == 3
    assert result.segments[0].content == "Paragraph One.\nStill Paragraph One."
    assert result.segments[1].content == "Paragraph Two starts here."
    assert result.segments[2].content == "Paragraph Three is the final block."

    for idx, seg in enumerate(result.segments):
        assert seg.sequence_number == idx
        assert seg.segment_type == "paragraph"
        assert seg.page_number is None
        assert result.extracted_text[seg.char_offset_start:seg.char_offset_end] == seg.content


def test_txt_unicode_support():
    """Verify Unicode handling with non-ASCII and accented characters."""
    text = "Handover Protocol: Dr. Müller handed over to Dr. Renée Dupont. — Section §4."
    result = DocumentParserService.parse(text.encode("utf-8"), "txt")

    assert len(result.segments) == 1
    assert result.segments[0].content == text
    assert result.extracted_text[result.segments[0].char_offset_start:result.segments[0].char_offset_end] == text


def test_txt_latin1_fallback():
    """Verify fallback decoding when file is encoded in latin-1."""
    text = "Rapport de continuité: Équipe de transition."
    latin1_bytes = text.encode("latin-1")
    result = DocumentParserService.parse(latin1_bytes, "txt")

    assert len(result.segments) == 1
    assert "continuité" in result.segments[0].content


# -------------------------------------------------------------------------
# Ingestion, Persistence & API Tests
# -------------------------------------------------------------------------

def test_upload_persists_segments_and_serves_via_api(client: TestClient, db_session: Session):
    """Uploading a document persists segments transactionally and serves them via GET /segments."""
    pages = ["Page 1: Protocol Initiated.", "Page 2: Roles Transferred."]
    pdf_bytes = make_multi_page_pdf(pages)

    response = client.post(
        "/api/v1/documents",
        files={"file": ("handover.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    assert response.status_code == 201
    doc_data = response.json()["document"]
    doc_id = doc_data["id"]

    # Verify segments in DB
    db_segments = list(
        db_session.scalars(
            select(DocumentSegment)
            .where(DocumentSegment.document_id == doc_id)
            .order_by(DocumentSegment.sequence_number.asc())
        ).all()
    )
    assert len(db_segments) == 2
    assert db_segments[0].page_number == 1
    assert db_segments[0].content == pages[0]
    assert db_segments[1].page_number == 2
    assert db_segments[1].content == pages[1]

    # Verify segments endpoint
    seg_response = client.get(f"/api/v1/documents/{doc_id}/segments")
    assert seg_response.status_code == 200
    segments_json = seg_response.json()
    assert len(segments_json) == 2
    assert segments_json[0]["sequence_number"] == 0
    assert segments_json[0]["page_number"] == 1
    assert segments_json[0]["source_label"] == "Page 1"
    assert segments_json[1]["sequence_number"] == 1
    assert segments_json[1]["page_number"] == 2
    assert segments_json[1]["source_label"] == "Page 2"


def test_resegmentation_idempotency(db_session: Session):
    """Reprocessing an existing document replaces segments idempotently without duplicates."""
    text = "First paragraph block.\n\nSecond paragraph block."
    # Direct service ingestion
    doc = Document(
        original_filename="resegment_test.txt",
        stored_filename="resegment_test_stored.txt",
        file_extension="txt",
        content_type="text/plain",
        file_size=len(text),
        sha256_hash="hash123",
        storage_path="data/uploads/resegment_test_temp.txt",
        extracted_text=text,
        extraction_status="completed",
    )
    # Write physical file
    Path(doc.storage_path).parent.mkdir(parents=True, exist_ok=True)
    with open(doc.storage_path, "wb") as f:
        f.write(text.encode("utf-8"))

    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    try:
        # Initial segmentation
        segments1 = DocumentService.segment_document(db_session, doc.id)
        assert len(segments1) == 2

        # Second re-segmentation should NOT create duplicate sequence numbers
        segments2 = DocumentService.segment_document(db_session, doc.id)
        assert len(segments2) == 2
        assert [s.sequence_number for s in segments2] == [0, 1]

        # Verify DB count
        total_in_db = db_session.scalar(
            select(DocumentSegment).where(DocumentSegment.document_id == doc.id)
        )
        assert total_in_db is not None
    finally:
        if Path(doc.storage_path).exists():
            Path(doc.storage_path).unlink()


def test_document_deletion_cascades_to_segments(client: TestClient, db_session: Session):
    """Deleting a document cascades and deletes all associated segments."""
    text = "Sample text for cascade deletion test."
    response = client.post(
        "/api/v1/documents",
        files={"file": ("cascade.txt", io.BytesIO(text.encode("utf-8")), "text/plain")},
    )
    assert response.status_code == 201
    doc_id = response.json()["document"]["id"]

    # Verify segment exists
    seg = db_session.scalar(select(DocumentSegment).where(DocumentSegment.document_id == doc_id))
    assert seg is not None

    # Delete document via API
    del_resp = client.delete(f"/api/v1/documents/{doc_id}")
    assert del_resp.status_code == 204

    # Verify segments are deleted
    remaining = list(
        db_session.scalars(select(DocumentSegment).where(DocumentSegment.document_id == doc_id)).all()
    )
    assert len(remaining) == 0


def test_failed_extraction_leaves_no_segments(client: TestClient, db_session: Session):
    """Uploading a corrupted document results in extraction_status='failed' and zero segments."""
    corrupt_pdf = b"%PDF-1.4\ncorrupt header and unreadable body"
    response = client.post(
        "/api/v1/documents",
        files={"file": ("corrupt.pdf", io.BytesIO(corrupt_pdf), "application/pdf")},
    )
    assert response.status_code == 201
    doc_data = response.json()["document"]
    assert doc_data["extraction_status"] == "failed"

    # Segments should be empty
    db_segments = list(
        db_session.scalars(
            select(DocumentSegment).where(DocumentSegment.document_id == doc_data["id"])
        ).all()
    )
    assert len(db_segments) == 0
