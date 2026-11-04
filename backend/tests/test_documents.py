import io
import hashlib
import docx
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.document import Document
from app.core.config import settings


def make_valid_pdf(text: str = "Relay Executive Handover Protocol") -> bytes:
    """Generates a structurally valid PDF byte stream containing test text."""
    stream_content = f"BT\n/F1 12 Tf\n100 700 Td\n({text}) Tj\nET\n".encode("utf-8")
    length = len(stream_content)
    obj1 = b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
    obj2 = b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
    obj3 = b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n"
    obj4 = b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
    obj5 = f"5 0 obj << /Length {length} >> stream\n".encode("utf-8") + stream_content + b"endstream\nendobj\n"
    header = b"%PDF-1.4\n"
    pos1 = len(header)
    pos2 = pos1 + len(obj1)
    pos3 = pos2 + len(obj2)
    pos4 = pos3 + len(obj3)
    pos5 = pos4 + len(obj4)
    xref_pos = pos5 + len(obj5)
    xref = f"xref\n0 6\n0000000000 65535 f \n{pos1:010d} 00000 n \n{pos2:010d} 00000 n \n{pos3:010d} 00000 n \n{pos4:010d} 00000 n \n{pos5:010d} 00000 n \n".encode("utf-8")
    trailer = f"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("utf-8")
    return header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer


def make_valid_docx(title: str, body: str, table_data: list[list[str]]) -> bytes:
    """Generates a valid DOCX byte stream with paragraphs and a table."""
    doc = docx.Document()
    doc.add_heading(title, level=1)
    doc.add_paragraph(body)
    if table_data:
        rows = len(table_data)
        cols = len(table_data[0])
        table = doc.add_table(rows=rows, cols=cols)
        for r_idx, row in enumerate(table_data):
            for c_idx, val in enumerate(row):
                table.rows[r_idx].cells[c_idx].text = val
    stream = io.BytesIO()
    doc.save(stream)
    return stream.getvalue()


def test_upload_txt_document(client: TestClient, db_session: Session):
    content = b"Chief Scientific Officer Handover\nDr. Eleanor Vance to Dr. Marcus Thorne."
    expected_hash = hashlib.sha256(content).hexdigest()

    response = client.post(
        "/api/v1/documents",
        files={"file": ("handover.txt", io.BytesIO(content), "text/plain")},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    doc = data["document"]
    assert doc["original_filename"] == "handover.txt"
    assert doc["file_extension"] == "txt"
    assert doc["file_size"] == len(content)
    assert doc["sha256_hash"] == expected_hash
    assert doc["extraction_status"] == "completed"
    assert doc["character_count"] == len(content.decode("utf-8").strip())
    assert doc["word_count"] == len(content.decode("utf-8").split())

    # Verify DB persistence
    db_doc = db_session.scalar(select(Document).where(Document.id == doc["id"]))
    assert db_doc is not None
    assert db_doc.extracted_text == content.decode("utf-8").strip()
    assert Path(db_doc.storage_path).exists()


def test_upload_docx_document(client: TestClient, db_session: Session):
    title = "Vendor Services Agreement"
    body = "Section 8.2: Automatic 12-month extension activates on November 15."
    table_data = [["Signatory", "Role"], ["Dr. Vance", "Outgoing CSO"]]
    docx_bytes = make_valid_docx(title, body, table_data)

    response = client.post(
        "/api/v1/documents",
        files={"file": ("contract.docx", io.BytesIO(docx_bytes), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )

    assert response.status_code == 201
    doc = response.json()["document"]
    assert doc["file_extension"] == "docx"
    assert doc["extraction_status"] == "completed"

    # Verify text contains heading, paragraph, and table values
    db_doc = db_session.scalar(select(Document).where(Document.id == doc["id"]))
    assert db_doc is not None
    assert "Vendor Services Agreement" in db_doc.extracted_text
    assert "Section 8.2: Automatic 12-month extension" in db_doc.extracted_text
    assert "Signatory | Role" in db_doc.extracted_text
    assert "Dr. Vance | Outgoing CSO" in db_doc.extracted_text


def test_upload_pdf_document(client: TestClient, db_session: Session):
    pdf_text = "FDA Form 1572 Principal Investigator"
    pdf_bytes = make_valid_pdf(pdf_text)

    response = client.post(
        "/api/v1/documents",
        files={"file": ("fda_1572.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )

    assert response.status_code == 201
    doc = response.json()["document"]
    assert doc["file_extension"] == "pdf"
    assert doc["extraction_status"] == "completed"

    db_doc = db_session.scalar(select(Document).where(Document.id == doc["id"]))
    assert db_doc is not None
    assert pdf_text in db_doc.extracted_text


def test_upload_unsupported_extension(client: TestClient):
    response = client.post(
        "/api/v1/documents",
        files={"file": ("malicious.exe", io.BytesIO(b"MZ executable data"), "application/octet-stream")},
    )
    assert response.status_code == 400
    assert "Unsupported file format '.exe'" in response.json()["detail"]


def test_upload_empty_file(client: TestClient):
    response = client.post(
        "/api/v1/documents",
        files={"file": ("empty.txt", io.BytesIO(b""), "text/plain")},
    )
    assert response.status_code == 400
    assert "empty (0 bytes)" in response.json()["detail"]


def test_upload_oversized_file(client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "MAX_FILE_SIZE_BYTES", 50)
    oversized_content = b"A" * 60

    response = client.post(
        "/api/v1/documents",
        files={"file": ("large.txt", io.BytesIO(oversized_content), "text/plain")},
    )
    assert response.status_code == 413
    assert "exceeds maximum limit" in response.json()["detail"]


def test_upload_corrupted_pdf_handles_gracefully(client: TestClient, db_session: Session):
    corrupt_bytes = b"Not a real PDF header or stream %PDF-invalid"

    response = client.post(
        "/api/v1/documents",
        files={"file": ("corrupt.pdf", io.BytesIO(corrupt_bytes), "application/pdf")},
    )

    assert response.status_code == 201
    doc = response.json()["document"]
    assert doc["extraction_status"] == "failed"
    assert doc["extraction_error"] is not None

    db_doc = db_session.scalar(select(Document).where(Document.id == doc["id"]))
    assert db_doc is not None
    assert db_doc.extraction_status == "failed"
    assert db_doc.extracted_text is None


def test_get_document_metadata_and_not_found(client: TestClient):
    content = b"Charter record content"
    post_res = client.post(
        "/api/v1/documents",
        files={"file": ("charter.txt", io.BytesIO(content), "text/plain")},
    )
    doc_id = post_res.json()["document"]["id"]

    # Valid GET
    get_res = client.get(f"/api/v1/documents/{doc_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == doc_id
    assert data["original_filename"] == "charter.txt"
    assert data["extracted_text"] == "Charter record content"

    # Non-existent ID
    bad_res = client.get("/api/v1/documents/non-existent-uuid-000")
    assert bad_res.status_code == 404


def test_get_document_text(client: TestClient):
    content = b"Line 1\nLine 2\nLine 3"
    post_res = client.post(
        "/api/v1/documents",
        files={"file": ("lines.txt", io.BytesIO(content), "text/plain")},
    )
    doc_id = post_res.json()["document"]["id"]

    text_res = client.get(f"/api/v1/documents/{doc_id}/text")
    assert text_res.status_code == 200
    data = text_res.json()
    assert data["id"] == doc_id
    assert data["extracted_text"] == "Line 1\nLine 2\nLine 3"
    assert data["character_count"] == len("Line 1\nLine 2\nLine 3")
    assert data["word_count"] == 6

    # 404 for missing
    assert client.get("/api/v1/documents/fake-id/text").status_code == 404


def test_list_documents_pagination_and_filtering(client: TestClient):
    # Upload 2 TXT and 1 PDF
    client.post("/api/v1/documents", files={"file": ("doc1.txt", io.BytesIO(b"Doc 1"), "text/plain")})
    client.post("/api/v1/documents", files={"file": ("doc2.txt", io.BytesIO(b"Doc 2"), "text/plain")})
    client.post("/api/v1/documents", files={"file": ("doc3.pdf", io.BytesIO(make_valid_pdf("Doc 3")), "application/pdf")})

    # List all
    all_res = client.get("/api/v1/documents")
    assert all_res.status_code == 200
    assert all_res.json()["total"] == 3
    assert len(all_res.json()["items"]) == 3

    # Pagination: limit 1, offset 1
    page_res = client.get("/api/v1/documents?limit=1&offset=1")
    assert len(page_res.json()["items"]) == 1
    assert page_res.json()["total"] == 3

    # Filter by extension: pdf
    pdf_res = client.get("/api/v1/documents?extension=pdf")
    assert pdf_res.json()["total"] == 1
    assert pdf_res.json()["items"][0]["file_extension"] == "pdf"

    # Filter by extension: txt
    txt_res = client.get("/api/v1/documents?extension=txt")
    assert txt_res.json()["total"] == 2

    # Filter by status: completed
    status_res = client.get("/api/v1/documents?status=completed")
    assert status_res.json()["total"] == 3


def test_download_document(client: TestClient):
    content = b"Confidential transition notes for review."
    post_res = client.post(
        "/api/v1/documents",
        files={"file": ("notes.txt", io.BytesIO(content), "text/plain")},
    )
    doc_id = post_res.json()["document"]["id"]

    dl_res = client.get(f"/api/v1/documents/{doc_id}/download")
    assert dl_res.status_code == 200
    assert dl_res.content == content

    # 404 for non-existent
    assert client.get("/api/v1/documents/missing-uuid/download").status_code == 404


def test_delete_document(client: TestClient, db_session: Session):
    content = b"Temporary document to be purged."
    post_res = client.post(
        "/api/v1/documents",
        files={"file": ("temporary.txt", io.BytesIO(content), "text/plain")},
    )
    doc_id = post_res.json()["document"]["id"]

    # Retrieve storage path from DB
    doc = db_session.scalar(select(Document).where(Document.id == doc_id))
    storage_path = Path(doc.storage_path)
    assert storage_path.exists()

    # Delete
    del_res = client.delete(f"/api/v1/documents/{doc_id}")
    assert del_res.status_code == 204

    # Verify DB record gone
    assert db_session.scalar(select(Document).where(Document.id == doc_id)) is None

    # Verify physical file removed
    assert not storage_path.exists()

    # Deleting again returns 404
    assert client.delete(f"/api/v1/documents/{doc_id}").status_code == 404

