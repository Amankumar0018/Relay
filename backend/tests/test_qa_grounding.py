import uuid
import json
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.knowledge import (
    DocumentSegment,
    ExtractedEntity,
    EntityMention,
    ExtractedFact,
    FactCitation,
)
from app.integrations.switch.mcp_server import relay_ask_question
from app.services.qa_service import QuestionAnsweringService


def _setup_project_nova_environment(db: Session) -> dict:
    """Sets up Project Nova document, segments, canonical entities, facts, and citations."""
    doc_id = str(uuid.uuid4())
    seg_id = str(uuid.uuid4())
    entity_nova_id = str(uuid.uuid4())
    entity_priya_id = str(uuid.uuid4())

    doc = Document(
        id=doc_id,
        original_filename="Project Nova Test.txt",
        stored_filename=f"{doc_id}_Project Nova Test.txt",
        file_extension="txt",
        content_type="text/plain",
        file_size=130,
        sha256_hash="sha_nova_test",
        storage_path=f"data/uploads/{doc_id}_Project Nova Test.txt",
        extracted_text="Project Nova is managed by Priya Sharma. The project deadline is December 20, 2026. The pending task is final security testing.",
        extraction_status="completed",
    )
    db.add(doc)

    seg = DocumentSegment(
        id=seg_id,
        document_id=doc_id,
        segment_type="paragraph",
        sequence_number=1,
        page_number=1,
        source_label="Paragraph 1",
        content="Project Nova is managed by Priya Sharma. The project deadline is December 20, 2026. The pending task is final security testing.",
        char_offset_start=0,
        char_offset_end=130,
    )
    db.add(seg)

    ent_nova = ExtractedEntity(
        id=entity_nova_id,
        name="Project Nova",
        canonical_name="Project Nova",
        category="project",
        description="Project Nova initiatives",
    )
    ent_priya = ExtractedEntity(
        id=entity_priya_id,
        name="Priya Sharma",
        canonical_name="Priya Sharma",
        category="person",
        description="Engineering lead",
    )
    db.add_all([ent_nova, ent_priya])

    # Fact 1: Ownership / Lead
    fact1_id = str(uuid.uuid4())
    fact1 = ExtractedFact(
        id=fact1_id,
        document_id=doc_id,
        primary_entity_id=entity_nova_id,
        category="responsibility",
        statement="Priya Sharma manages Project Nova.",
        verification_status="evidence-backed",
        confidence_score=1.0,
    )
    db.add(fact1)
    cit1 = FactCitation(
        id=str(uuid.uuid4()),
        fact_id=fact1_id,
        document_segment_id=seg_id,
        verbatim_quote="Project Nova is managed by Priya Sharma.",
        source_location="Paragraph 1",
        char_start=0,
        char_end=40,
        verification_status="valid",
    )
    db.add(cit1)

    # Fact 2: Deadline
    fact2_id = str(uuid.uuid4())
    fact2 = ExtractedFact(
        id=fact2_id,
        document_id=doc_id,
        primary_entity_id=entity_nova_id,
        category="deadline",
        statement="The deadline for Project Nova is December 20, 2026.",
        verification_status="evidence-backed",
        confidence_score=1.0,
    )
    db.add(fact2)
    cit2 = FactCitation(
        id=str(uuid.uuid4()),
        fact_id=fact2_id,
        document_segment_id=seg_id,
        verbatim_quote="The project deadline is December 20, 2026.",
        source_location="Paragraph 1",
        char_start=41,
        char_end=83,
        verification_status="valid",
    )
    db.add(cit2)

    # Fact 3: Pending Task
    fact3_id = str(uuid.uuid4())
    fact3 = ExtractedFact(
        id=fact3_id,
        document_id=doc_id,
        primary_entity_id=entity_nova_id,
        category="status",
        statement="The pending task for Project Nova is final security testing.",
        verification_status="evidence-backed",
        confidence_score=1.0,
    )
    db.add(fact3)
    cit3 = FactCitation(
        id=str(uuid.uuid4()),
        fact_id=fact3_id,
        document_segment_id=seg_id,
        verbatim_quote="The pending task is final security testing.",
        source_location="Paragraph 1",
        char_start=84,
        char_end=127,
        verification_status="valid",
    )
    db.add(cit3)

    db.commit()

    return {
        "doc_id": doc_id,
        "seg_id": seg_id,
        "fact1_id": fact1_id,
        "fact2_id": fact2_id,
        "fact3_id": fact3_id,
    }


def test_rest_qa_project_nova_question_1_owner(client: TestClient, db_session: Session):
    """Q1: Who manages Project Nova? Verifies segment ID, quote, confidence, and grounding."""
    env = _setup_project_nova_environment(db_session)

    res = client.post("/api/v1/qa/ask", json={"question": "Who manages Project Nova?"})
    assert res.status_code == 200
    data = res.json()

    assert data["has_sufficient_evidence"] is True
    assert data["is_grounded"] is True
    assert data["is_grounding"] is True
    assert data["missing_evidence"] is False
    assert 0.0 < data["confidence_score"] < 1.0  # Not artificially set to 1.0
    assert data["confidence"] == data["confidence_score"]

    assert len(data["citations"]) >= 1
    top_citation = data["citations"][0]
    assert top_citation["segment_id"] == env["seg_id"]
    assert top_citation["document_segment_id"] == env["seg_id"]
    assert top_citation["quote"] == "Project Nova is managed by Priya Sharma."
    assert top_citation["source_document"] == "Project Nova Test.txt"

    assert "Priya Sharma" in data["answer"]


def test_rest_qa_project_nova_question_2_deadline(client: TestClient, db_session: Session):
    """Q2: What is the deadline for Project Nova? Verifies exact date and citation."""
    env = _setup_project_nova_environment(db_session)

    res = client.post("/api/v1/qa/ask", json={"question": "What is the deadline for Project Nova?"})
    assert res.status_code == 200
    data = res.json()

    assert data["is_grounded"] is True
    assert data["is_grounding"] is True
    assert 0.0 < data["confidence_score"] < 1.0

    assert len(data["citations"]) >= 1
    top_citation = data["citations"][0]
    assert top_citation["segment_id"] == env["seg_id"]
    assert "December 20, 2026" in top_citation["quote"]
    assert top_citation["source_document"] == "Project Nova Test.txt"

    assert "December 20, 2026" in data["answer"]


def test_rest_qa_project_nova_question_3_pending_task(client: TestClient, db_session: Session):
    """Q3: What is the pending task for Project Nova? Verifies pending task extraction and segment."""
    env = _setup_project_nova_environment(db_session)

    res = client.post("/api/v1/qa/ask", json={"question": "What is the pending task for Project Nova?"})
    assert res.status_code == 200
    data = res.json()

    assert data["is_grounded"] is True
    assert data["is_grounding"] is True
    assert 0.0 < data["confidence_score"] < 1.0

    assert len(data["citations"]) >= 1
    top_citation = data["citations"][0]
    assert top_citation["segment_id"] == env["seg_id"]
    assert "final security testing" in top_citation["quote"]

    assert "security testing" in data["answer"].lower()


def test_rest_qa_missing_evidence(client: TestClient, db_session: Session):
    """Missing evidence query: verifies is_grounded=False, confidence=0.0, empty citations."""
    _setup_project_nova_environment(db_session)

    res = client.post("/api/v1/qa/ask", json={"question": "What is the budget for Project Quantum Leap?"})
    assert res.status_code == 200
    data = res.json()

    assert data["has_sufficient_evidence"] is False
    assert data["is_grounded"] is False
    assert data["is_grounding"] is False
    assert data["missing_evidence"] is True
    assert data["confidence_score"] == 0.0
    assert data["confidence"] == 0.0
    assert len(data["citations"]) == 0
    assert "Insufficient evidence" in data["answer"]


@pytest.mark.anyio
async def test_mcp_relay_ask_question_grounded_response():
    """Verify MCP relay_ask_question mapping with live REST schema."""
    mock_resp = MagicMock(status_code=200)
    mock_resp.json.return_value = {
        "question": "Who manages Project Nova?",
        "answer": "Priya Sharma manages Project Nova.",
        "has_sufficient_evidence": True,
        "is_grounded": True,
        "is_grounding": True,
        "missing_evidence": False,
        "confidence_score": 0.88,
        "confidence": 0.88,
        "citations": [
            {
                "document_id": "doc-nova",
                "document_filename": "Project Nova Test.txt",
                "source_document": "Project Nova Test.txt",
                "source_document_title": "Project Nova Test.txt",
                "segment_id": "seg-nova-01",
                "document_segment_id": "seg-nova-01",
                "source_location": "Paragraph 1",
                "verbatim_quote": "Project Nova is managed by Priya Sharma.",
                "quote": "Project Nova is managed by Priya Sharma.",
            }
        ],
    }

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp

    with patch("app.integrations.switch.mcp_server._get_client") as mock_get:
        @pytest.fixture
        def cm():
            pass
        from contextlib import asynccontextmanager
        @asynccontextmanager
        async def _cm(*args, **kwargs):
            yield mock_client
        mock_get.side_effect = _cm

        res_str = await relay_ask_question("Who manages Project Nova?")
        res = json.loads(res_str)

        assert res["success"] is True
        assert res["is_grounded"] is True
        assert res["is_grounding"] is True
        assert res["missing_evidence"] is False
        assert res["confidence"] == 0.88
        assert len(res["citations"]) == 1
        assert res["citations"][0]["segment_id"] == "seg-nova-01"
        assert res["citations"][0]["quote"] == "Project Nova is managed by Priya Sharma."
        assert res["citations"][0]["source_document"] == "Project Nova Test.txt"


@pytest.mark.anyio
async def test_mcp_relay_ask_question_missing_evidence():
    """Verify MCP relay_ask_question mapping for ungrounded queries."""
    mock_resp = MagicMock(status_code=200)
    mock_resp.json.return_value = {
        "question": "What is the budget for Project Quantum Leap?",
        "answer": "Insufficient evidence in the deposited records.",
        "has_sufficient_evidence": False,
        "is_grounded": False,
        "is_grounding": False,
        "missing_evidence": True,
        "confidence_score": 0.0,
        "confidence": 0.0,
        "citations": [],
    }

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp

    with patch("app.integrations.switch.mcp_server._get_client") as mock_get:
        from contextlib import asynccontextmanager
        @asynccontextmanager
        async def _cm(*args, **kwargs):
            yield mock_client
        mock_get.side_effect = _cm

        res_str = await relay_ask_question("What is the budget for Project Quantum Leap?")
        res = json.loads(res_str)

        assert res["success"] is True
        assert res["is_grounded"] is False
        assert res["is_grounding"] is False
        assert res["missing_evidence"] is True
        assert res["confidence"] == 0.0
        assert res["citations"] == []
        assert "Insufficient evidence" in res["answer"]
