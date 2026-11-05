import io
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.knowledge import (
    DocumentSegment,
    ExtractedEntity,
    EntityMention,
    ExtractedFact,
    FactCitation,
    EntityRelationship,
    ExtractionRun,
)
from app.schemas.knowledge import (
    EntityCategory,
    FactCategory,
    RelationType,
    FactVerificationStatus,
)
from app.schemas.extraction import (
    DocumentExtractionPayload,
    RawEntityExtraction,
    RawEntityMention,
    RawFactExtraction,
    RawRelationshipExtraction,
    RawCitationReference,
)
from app.integrations.llm.base import (
    LLMStructuredResponse,
    LLMQuotaError,
    LLMUnavailableError,
    LLMAuthError,
    LLMResponseValidationError,
    LLMTimeoutError,
)
from app.services.extraction_service import (
    ExtractionOrchestrator,
    DocumentNotEligibleError,
    ExtractionProviderError,
    ExtractionQuotaError,
    ExtractionAuthError,
    ExtractionSchemaError,
)
from app.api.intelligence import get_extraction_orchestrator
from app.main import app


# =============================================================================
# Helper Fixtures & Builders
# =============================================================================

def _create_mock_document(
    db: Session,
    filename: str = "handover_memo.txt",
    text: str = "Relay handover memorandum.",
    status: str = "completed",
    error: str = None,
) -> Document:
    """Creates a document directly in the database for pipeline testing."""
    doc = Document(
        id=str(uuid.uuid4()),
        original_filename=filename,
        stored_filename=f"{uuid.uuid4()}_{filename}",
        file_extension="txt",
        content_type="text/plain",
        file_size=len(text.encode("utf-8")),
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        storage_path=f"/tmp/{filename}",
        extracted_text=text,
        character_count=len(text),
        word_count=len(text.split()),
        extraction_status=status,
        extraction_error=error,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def _create_mock_segment(
    db: Session,
    doc_id: str,
    content: str,
    seq: int = 0,
    source_label: str = "Page 1, Paragraph 1",
) -> DocumentSegment:
    """Creates a segment directly in the database."""
    seg = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=doc_id,
        sequence_number=seq,
        segment_type="paragraph",
        source_label=source_label,
        content=content,
        char_offset_start=0,
        char_offset_end=len(content),
    )
    db.add(seg)
    db.commit()
    db.refresh(seg)
    return seg


class MockLLMProvider:
    """Mock LLM provider returning predetermined structured extraction payloads."""

    def __init__(self, payload: DocumentExtractionPayload = None, exc: Exception = None):
        self.payload = payload or DocumentExtractionPayload()
        self.exc = exc
        self.default_model = "gemini-3.5-flash"
        self.provider_name = "gemini"

    def generate_structured(self, **kwargs) -> LLMStructuredResponse[DocumentExtractionPayload]:
        if self.exc:
            raise self.exc
        return LLMStructuredResponse[DocumentExtractionPayload](
            data=self.payload,
            content=self.payload.model_dump_json(),
            model=kwargs.get("model", self.default_model),
            finish_reason="STOP",
            prompt_tokens=350,
            completion_tokens=120,
        )


# =============================================================================
# 1. Successful End-to-End Extraction & Knowledge Verification
# =============================================================================

def test_end_to_end_extraction_success(client: TestClient, db_session: Session):
    # 1. Ingest synthetic multi-segment document
    seg1_text = "Executive Transition: Dr. Aris Thorne formally transfers leadership of Project Titan to Sarah Chen."
    seg2_text = "The governance board approved renewing the cloud vendor contract for 12 months by EOQ Q3."
    full_text = f"{seg1_text}\n\n{seg2_text}"

    doc = _create_mock_document(db_session, "handover.txt", full_text)
    seg1 = _create_mock_segment(db_session, doc.id, seg1_text, seq=0, source_label="Page 1, Paragraph 1")
    seg2 = _create_mock_segment(db_session, doc.id, seg2_text, seq=1, source_label="Page 1, Paragraph 2")

    # 2. Build mock extraction payload with facts, citations, entities, and relationships
    payload = DocumentExtractionPayload(
        entities=[
            RawEntityExtraction(
                name="Dr. Aris Thorne",
                category=EntityCategory.PERSON,
                mentions=[RawEntityMention(segment_id=seg1.id, surface_text="Dr. Aris Thorne")],
            ),
            RawEntityExtraction(
                name="Sarah Chen",
                category=EntityCategory.PERSON,
                mentions=[RawEntityMention(segment_id=seg1.id, surface_text="Sarah Chen")],
            ),
            RawEntityExtraction(
                name="Project Titan",
                category=EntityCategory.PROJECT,
                mentions=[RawEntityMention(segment_id=seg1.id, surface_text="Project Titan")],
            ),
        ],
        relationships=[
            RawRelationshipExtraction(
                source_entity_name="Dr. Aris Thorne",
                target_entity_name="Sarah Chen",
                relation_type=RelationType.TRANSFERS_TO,
                confidence=0.98,
            )
        ],
        facts=[
            RawFactExtraction(
                category=FactCategory.DECISION,
                statement="Cloud vendor contract renewed for 12 months.",
                citations=[
                    RawCitationReference(
                        segment_id=seg2.id,
                        quote="renewing the cloud vendor contract for 12 months",
                    )
                ],
                confidence=0.95,
            ),
            RawFactExtraction(
                category=FactCategory.RESPONSIBILITY,
                statement="Leadership handover may require transitional grace period.",
                is_inference=True,
                citations=[
                    RawCitationReference(
                        segment_id=seg1.id,
                        quote="Dr. Aris Thorne formally transfers leadership of Project Titan to Sarah Chen",
                    )
                ],
                confidence=0.88,
            ),
        ],
    )

    mock_provider = MockLLMProvider(payload=payload)
    app.dependency_overrides[get_extraction_orchestrator] = lambda: ExtractionOrchestrator(llm_provider=mock_provider)

    try:
        # 3. Trigger extraction endpoint
        response = client.post(f"/api/v1/documents/{doc.id}/extract")
        assert response.status_code == 200
        res_data = response.json()

        assert res_data["success"] is True
        assert res_data["status"] == "completed"
        assert res_data["document_id"] == doc.id
        assert res_data["run_id"] is not None
        summary = res_data["summary"]
        assert summary["facts_count"] == 2
        assert summary["entities_count"] == 3
        assert summary["relationships_count"] == 1
        assert summary["citations_verified"] == 2
        assert summary["citations_rejected"] == 0

        # 4. Verify ExtractionRun telemetry record in DB
        run = db_session.query(ExtractionRun).filter(ExtractionRun.id == res_data["run_id"]).first()
        assert run is not None
        assert run.status == "completed"
        assert run.facts_extracted == 2
        assert run.entities_extracted == 3
        assert run.relationships_extracted == 1
        assert run.citations_verified == 2
        assert run.prompt_tokens == 350
        assert run.completion_tokens == 120
        assert run.execution_duration_ms is not None
        assert run.execution_duration_ms >= 0

        # 5. Query knowledge retrieval endpoint
        knowledge_res = client.get(f"/api/v1/documents/{doc.id}/knowledge")
        assert knowledge_res.status_code == 200
        k_data = knowledge_res.json()

        assert k_data["document_id"] == doc.id
        assert k_data["facts_count"] == 2
        assert k_data["entities_count"] == 3
        assert k_data["relationships_count"] == 1
        assert len(k_data["facts"]) == 2
        assert len(k_data["entities"]) == 3
        assert len(k_data["relationships"]) == 1

        # Check evidence grounding of the decision fact
        decision_fact = next(f for f in k_data["facts"] if f["category"] == "decision")
        assert decision_fact["verification_status"] == "evidence-backed"
        assert len(decision_fact["citations"]) == 1
        cit = decision_fact["citations"][0]
        assert cit["verification_status"] == "valid"
        assert cit["char_start"] is not None
        assert cit["char_end"] > cit["char_start"]
        assert seg2_text[cit["char_start"]:cit["char_end"]] == cit["verbatim_quote"]

        # Check inferred fact verification status
        inferred_fact = next(f for f in k_data["facts"] if f["category"] == "responsibility")
        assert inferred_fact["verification_status"] == "inferred"
        assert inferred_fact["verification_status"] != "evidence-backed"

        # Check entity and relationship
        thorne_entity = next(e for e in k_data["entities"] if e["canonical_name"] == "aris thorne")
        assert len(thorne_entity["mentions"]) == 1
        assert k_data["relationships"][0]["relation_type"] == "TRANSFERS_TO"

    finally:
        app.dependency_overrides.pop(get_extraction_orchestrator, None)


# =============================================================================
# 2. Rejected Citations Handling
# =============================================================================

def test_extraction_rejected_citations_handled(client: TestClient, db_session: Session):
    seg_text = "Quarterly results review was conducted."
    doc = _create_mock_document(db_session, "memo.txt", seg_text)
    seg = _create_mock_segment(db_session, doc.id, seg_text, seq=0, source_label="Page 1, Paragraph 1")

    # Model proposes an ungrounded quotation that doesn't exist in text
    payload = DocumentExtractionPayload(
        facts=[
            RawFactExtraction(
                category=FactCategory.COMMITMENT,
                statement="Fabricated budget promise without source grounding.",
                citations=[
                    RawCitationReference(
                        segment_id=seg.id,
                        quote="This quote does not exist anywhere in the text",
                    )
                ],
            )
        ]
    )

    mock_provider = MockLLMProvider(payload=payload)
    app.dependency_overrides[get_extraction_orchestrator] = lambda: ExtractionOrchestrator(llm_provider=mock_provider)

    try:
        response = client.post(f"/api/v1/documents/{doc.id}/extract")
        assert response.status_code == 200
        data = response.json()
        assert data["summary"]["citations_verified"] == 0
        assert data["summary"]["citations_rejected"] == 1

        # Check knowledge endpoint
        k_res = client.get(f"/api/v1/documents/{doc.id}/knowledge")
        assert k_res.status_code == 200
        fact = k_res.json()["facts"][0]
        assert fact["verification_status"] == "rejected"
        assert len(fact["citations"]) == 1
        cit = fact["citations"][0]
        assert cit["verification_status"] == "rejected"
        assert cit["rejection_reason"] == "Quote not found in segment content"
        assert cit["source_location"] == "Page 1, Paragraph 1"
        assert "REJECTED:" not in cit["source_location"]
        assert cit["char_start"] is None
        assert cit["char_end"] is None

    finally:
        app.dependency_overrides.pop(get_extraction_orchestrator, None)


# =============================================================================
# 3. Idempotency & Changed Statement Preservation
# =============================================================================

def test_extraction_idempotency_and_changed_statement(client: TestClient, db_session: Session):
    seg1 = "Contract renewal for 12 months."
    seg2 = "Contract extended to 24 months."
    doc = _create_mock_document(db_session, "amendment.txt", f"{seg1}\n{seg2}")
    s1 = _create_mock_segment(db_session, doc.id, seg1, seq=0)
    s2 = _create_mock_segment(db_session, doc.id, seg2, seq=1)

    payload_v1 = DocumentExtractionPayload(
        facts=[
            RawFactExtraction(
                category=FactCategory.DECISION,
                statement="Contract renewal for 12 months.",
                citations=[RawCitationReference(segment_id=s1.id, quote="Contract renewal for 12 months.")],
            )
        ]
    )

    mock_provider = MockLLMProvider(payload=payload_v1)
    app.dependency_overrides[get_extraction_orchestrator] = lambda: ExtractionOrchestrator(llm_provider=mock_provider)

    try:
        # Run 1
        res1 = client.post(f"/api/v1/documents/{doc.id}/extract")
        assert res1.status_code == 200
        facts_count_1 = db_session.query(ExtractedFact).filter(ExtractedFact.document_id == doc.id).count()
        assert facts_count_1 == 1

        # Idempotent re-run with exact same payload
        res1_retry = client.post(f"/api/v1/documents/{doc.id}/extract")
        assert res1_retry.status_code == 200
        assert db_session.query(ExtractedFact).filter(ExtractedFact.document_id == doc.id).count() == facts_count_1

        # Run 2: Changed statement
        payload_v2 = DocumentExtractionPayload(
            facts=[
                RawFactExtraction(
                    category=FactCategory.DECISION,
                    statement="Contract extended to 24 months.",
                    citations=[RawCitationReference(segment_id=s2.id, quote="Contract extended to 24 months.")],
                )
            ]
        )
        mock_provider.payload = payload_v2
        res2 = client.post(f"/api/v1/documents/{doc.id}/extract")
        assert res2.status_code == 200

        # Both historical statements must coexist
        facts = db_session.query(ExtractedFact).filter(ExtractedFact.document_id == doc.id).all()
        assert len(facts) == 2
        statements = {f.statement for f in facts}
        assert "Contract renewal for 12 months." in statements
        assert "Contract extended to 24 months." in statements

    finally:
        app.dependency_overrides.pop(get_extraction_orchestrator, None)


# =============================================================================
# 4. Error Cases & HTTP Status Code Mapping
# =============================================================================

def test_extraction_missing_document_404(client: TestClient):
    random_id = str(uuid.uuid4())
    res = client.post(f"/api/v1/documents/{random_id}/extract")
    assert res.status_code == 404
    assert f"Document with ID '{random_id}' not found" in res.json()["error"]


def test_extraction_document_not_eligible_400(client: TestClient, db_session: Session):
    # Case 1: Status is pending
    doc_pending = _create_mock_document(db_session, "pending.txt", "Some text", status="pending")
    res1 = client.post(f"/api/v1/documents/{doc_pending.id}/extract")
    assert res1.status_code == 400
    assert "not eligible" in res1.json()["error"]

    # Case 2: Status is failed
    doc_failed = _create_mock_document(db_session, "failed.txt", "Some text", status="failed", error="Corrupt PDF")
    res2 = client.post(f"/api/v1/documents/{doc_failed.id}/extract")
    assert res2.status_code == 400
    assert "Corrupt PDF" in res2.json()["error"]

    # Case 3: Completed status but 0 segments
    doc_empty = _create_mock_document(db_session, "empty.txt", "", status="completed")
    res3 = client.post(f"/api/v1/documents/{doc_empty.id}/extract")
    assert res3.status_code == 400
    assert "no structured segments" in res3.json()["error"]


def test_concurrent_extraction_conflict_409(client: TestClient, db_session: Session):
    doc = _create_mock_document(db_session, "concurrent.txt", "Sample text")
    _create_mock_segment(db_session, doc.id, "Sample text")

    # Simulate an active running extraction lease started 15 seconds ago
    active_run = ExtractionRun(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        provider_name="gemini",
        model_name="gemini-3.5-flash",
        prompt_version="v1",
        prompt_hash="hash1",
        status="running",
        started_at=datetime.now(timezone.utc) - timedelta(seconds=15),
    )
    db_session.add(active_run)
    db_session.commit()

    res = client.post(f"/api/v1/documents/{doc.id}/extract")
    assert res.status_code == 409
    assert "already running" in res.json()["error"]


def test_provider_quota_error_429(client: TestClient, db_session: Session):
    doc = _create_mock_document(db_session, "quota.txt", "Sample text")
    _create_mock_segment(db_session, doc.id, "Sample text")

    mock_provider = MockLLMProvider(exc=LLMQuotaError("Resource has been exhausted (rate limit)"))
    app.dependency_overrides[get_extraction_orchestrator] = lambda: ExtractionOrchestrator(llm_provider=mock_provider)

    try:
        res = client.post(f"/api/v1/documents/{doc.id}/extract")
        assert res.status_code == 429
        assert "quota exceeded" in res.json()["error"]

        # Verify ExtractionRun marked failed in DB
        run = db_session.query(ExtractionRun).filter(ExtractionRun.document_id == doc.id).first()
        assert run is not None
        assert run.status == "failed"
        assert run.error_stage == "llm_generation"
    finally:
        app.dependency_overrides.pop(get_extraction_orchestrator, None)


def test_provider_unavailable_error_502(client: TestClient, db_session: Session):
    doc = _create_mock_document(db_session, "unavailable.txt", "Sample text")
    _create_mock_segment(db_session, doc.id, "Sample text")

    mock_provider = MockLLMProvider(exc=LLMUnavailableError("503 Service Unavailable"))
    app.dependency_overrides[get_extraction_orchestrator] = lambda: ExtractionOrchestrator(llm_provider=mock_provider)

    try:
        res = client.post(f"/api/v1/documents/{doc.id}/extract")
        assert res.status_code == 502
        assert "provider failure" in res.json()["error"]

        run = db_session.query(ExtractionRun).filter(ExtractionRun.document_id == doc.id).first()
        assert run.status == "failed"
        assert run.error_stage == "llm_generation"
    finally:
        app.dependency_overrides.pop(get_extraction_orchestrator, None)


def test_provider_schema_validation_error_502(client: TestClient, db_session: Session):
    doc = _create_mock_document(db_session, "bad_schema.txt", "Sample text")
    _create_mock_segment(db_session, doc.id, "Sample text")

    mock_provider = MockLLMProvider(exc=LLMResponseValidationError("JSON does not conform to Pydantic schema"))
    app.dependency_overrides[get_extraction_orchestrator] = lambda: ExtractionOrchestrator(llm_provider=mock_provider)

    try:
        res = client.post(f"/api/v1/documents/{doc.id}/extract")
        assert res.status_code == 502
        assert "schema validation" in res.json()["error"]

        run = db_session.query(ExtractionRun).filter(ExtractionRun.document_id == doc.id).first()
        assert run.status == "failed"
        assert run.error_stage == "schema_validation"
    finally:
        app.dependency_overrides.pop(get_extraction_orchestrator, None)


def test_provider_auth_error_500(client: TestClient, db_session: Session):
    doc = _create_mock_document(db_session, "auth_err.txt", "Sample text")
    _create_mock_segment(db_session, doc.id, "Sample text")

    mock_provider = MockLLMProvider(exc=LLMAuthError("Gemini API key is not configured."))
    app.dependency_overrides[get_extraction_orchestrator] = lambda: ExtractionOrchestrator(llm_provider=mock_provider)

    try:
        res = client.post(f"/api/v1/documents/{doc.id}/extract")
        assert res.status_code == 500
        assert "authentication failed" in res.json()["error"]

        run = db_session.query(ExtractionRun).filter(ExtractionRun.document_id == doc.id).first()
        assert run.status == "failed"
    finally:
        app.dependency_overrides.pop(get_extraction_orchestrator, None)


def test_telemetry_error_message_sanitization(client: TestClient, db_session: Session):
    doc = _create_mock_document(db_session, "sanitize.txt", "Sample text")
    _create_mock_segment(db_session, doc.id, "Sample text")

    leaked_key = "AIzaSyD1234567890abcdefghijklmnopqrstuv"
    raw_error = f"API call failed with key {leaked_key} and bearer eyJhbGciOiJIUzI1NiIsInR5cCI6"
    mock_provider = MockLLMProvider(exc=LLMUnavailableError(raw_error))
    app.dependency_overrides[get_extraction_orchestrator] = lambda: ExtractionOrchestrator(llm_provider=mock_provider)

    try:
        res = client.post(f"/api/v1/documents/{doc.id}/extract")
        assert res.status_code == 502

        run = db_session.query(ExtractionRun).filter(ExtractionRun.document_id == doc.id).first()
        assert leaked_key not in run.error_message
        assert "[REDACTED_API_KEY]" in run.error_message
        assert "[REDACTED_BEARER]" in run.error_message
    finally:
        app.dependency_overrides.pop(get_extraction_orchestrator, None)


def test_provider_timeout_error_502(client: TestClient, db_session: Session):
    doc = _create_mock_document(db_session, "timeout.txt", "Timeout sample text")
    _create_mock_segment(db_session, doc.id, "Timeout sample text")

    mock_provider = MockLLMProvider(exc=LLMTimeoutError("Gemini request timed out after 30s"))
    app.dependency_overrides[get_extraction_orchestrator] = lambda: ExtractionOrchestrator(llm_provider=mock_provider)

    try:
        res = client.post(f"/api/v1/documents/{doc.id}/extract")
        assert res.status_code == 502
        assert "provider failure" in res.json()["error"]

        run = db_session.query(ExtractionRun).filter(ExtractionRun.document_id == doc.id).first()
        assert run is not None
        assert run.status == "failed"
        assert run.error_stage == "llm_generation"
    finally:
        app.dependency_overrides.pop(get_extraction_orchestrator, None)


def test_persistence_failure_rollback_and_telemetry_failed(client: TestClient, db_session: Session):
    doc = _create_mock_document(db_session, "persist_fail.txt", "Sample persist text")
    seg = _create_mock_segment(db_session, doc.id, "Sample persist text")

    payload = DocumentExtractionPayload(
        entities=[RawEntityExtraction(name="Temporary Entity", category=EntityCategory.PERSON)],
        facts=[RawFactExtraction(category=FactCategory.DECISION, statement="Temporary statement")],
    )
    mock_provider = MockLLMProvider(payload=payload)
    orchestrator = ExtractionOrchestrator(llm_provider=mock_provider)

    # Force persistence service to fail inside persist_relationships
    with patch.object(
        orchestrator.persistence_service,
        "persist_relationships",
        side_effect=RuntimeError("Simulated database write crash"),
    ):
        app.dependency_overrides[get_extraction_orchestrator] = lambda: orchestrator
        try:
            res = client.post(f"/api/v1/documents/{doc.id}/extract")
            assert res.status_code == 500

            # Atomic rollback: no partial entities or facts remain
            assert db_session.query(ExtractedEntity).filter(ExtractedEntity.name == "Temporary Entity").count() == 0
            assert db_session.query(ExtractedFact).filter(ExtractedFact.statement == "Temporary statement").count() == 0

            # ExtractionRun is marked failed with diagnostics
            run = db_session.query(ExtractionRun).filter(ExtractionRun.document_id == doc.id).first()
            assert run is not None
            assert run.status == "failed"
            assert run.error_stage == "relationship_persistence"
            assert "Simulated database write crash" in run.error_message
        finally:
            app.dependency_overrides.pop(get_extraction_orchestrator, None)


def test_extraction_person_name_normalization_preserves_jr_sr(client: TestClient, db_session: Session):
    text = "Partners: Dr. Robert Smith Jr., Ph.D. and Robert Smith Senior, MD were present."
    doc = _create_mock_document(db_session, "smiths.txt", text)
    seg = _create_mock_segment(db_session, doc.id, text)

    payload = DocumentExtractionPayload(
        entities=[
            RawEntityExtraction(
                name="Dr. Robert Smith Jr., Ph.D.",
                category=EntityCategory.PERSON,
                mentions=[RawEntityMention(segment_id=seg.id, surface_text="Dr. Robert Smith Jr., Ph.D.")],
            ),
            RawEntityExtraction(
                name="Robert Smith Senior, MD",
                category=EntityCategory.PERSON,
                mentions=[RawEntityMention(segment_id=seg.id, surface_text="Robert Smith Senior, MD")],
            ),
        ]
    )
    mock_provider = MockLLMProvider(payload=payload)
    app.dependency_overrides[get_extraction_orchestrator] = lambda: ExtractionOrchestrator(llm_provider=mock_provider)

    try:
        res = client.post(f"/api/v1/documents/{doc.id}/extract")
        assert res.status_code == 200
        assert res.json()["summary"]["entities_count"] == 2

        k_res = client.get(f"/api/v1/documents/{doc.id}/knowledge")
        assert k_res.status_code == 200
        canonical_names = {e["canonical_name"] for e in k_res.json()["entities"]}
        assert "robert smith jr" in canonical_names
        assert "robert smith sr" in canonical_names
    finally:
        app.dependency_overrides.pop(get_extraction_orchestrator, None)


# =============================================================================
# 5. Telemetry & Cross-Document Query Endpoints
# =============================================================================

def test_get_extraction_run_endpoint(client: TestClient, db_session: Session):
    doc = _create_mock_document(db_session, "run_test.txt", "Run test text")
    run = ExtractionRun(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        provider_name="gemini",
        model_name="gemini-3.5-flash",
        prompt_version="v1",
        prompt_hash="hash123",
        status="completed",
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        execution_duration_ms=450,
        prompt_tokens=200,
        completion_tokens=50,
        facts_extracted=3,
        entities_extracted=2,
        relationships_extracted=1,
        citations_verified=3,
        citations_rejected=0,
    )
    db_session.add(run)
    db_session.commit()

    # Success
    res = client.get(f"/api/v1/extraction-runs/{run.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == run.id
    assert data["status"] == "completed"
    assert data["execution_duration_ms"] == 450
    assert data["prompt_tokens"] == 200

    # Not found
    res_404 = client.get(f"/api/v1/extraction-runs/{uuid.uuid4()}")
    assert res_404.status_code == 404


def test_list_document_extractions_endpoint(client: TestClient, db_session: Session):
    doc = _create_mock_document(db_session, "history.txt", "History text")
    run1 = ExtractionRun(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        provider_name="gemini",
        model_name="gemini-3.5-flash",
        prompt_version="v1",
        prompt_hash="hash1",
        status="completed",
        started_at=datetime.now(timezone.utc) - timedelta(minutes=5),
    )
    run2 = ExtractionRun(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        provider_name="gemini",
        model_name="gemini-3.5-flash",
        prompt_version="v1",
        prompt_hash="hash1",
        status="completed",
        started_at=datetime.now(timezone.utc),
    )
    db_session.add_all([run1, run2])
    db_session.commit()

    res = client.get(f"/api/v1/documents/{doc.id}/extractions")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


def test_list_facts_filtering_and_pagination(client: TestClient, db_session: Session):
    doc = _create_mock_document(db_session, "facts_filter.txt", "Facts filter text")
    f1 = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        category="decision",
        statement="Decision statement Alpha",
        verification_status="evidence-backed",
        confidence_score=0.9,
    )
    f2 = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        category="risk",
        statement="Risk statement Beta",
        verification_status="inferred",
        confidence_score=0.8,
    )
    db_session.add_all([f1, f2])
    db_session.commit()

    # Filter by category
    res_dec = client.get(f"/api/v1/facts?category=decision&document_id={doc.id}")
    assert res_dec.status_code == 200
    assert res_dec.json()["total"] == 1
    assert res_dec.json()["items"][0]["statement"] == "Decision statement Alpha"

    # Filter by verification_status
    res_inf = client.get(f"/api/v1/facts?verification_status=inferred&document_id={doc.id}")
    assert res_inf.status_code == 200
    assert res_inf.json()["total"] == 1
    assert res_inf.json()["items"][0]["statement"] == "Risk statement Beta"


def test_list_entities_filtering_and_search(client: TestClient, db_session: Session):
    e1 = ExtractedEntity(
        id=str(uuid.uuid4()),
        name="Eleanor Vance",
        canonical_name="eleanor vance",
        category="person",
    )
    e2 = ExtractedEntity(
        id=str(uuid.uuid4()),
        name="Project Apollo",
        canonical_name="project apollo",
        category="project",
    )
    db_session.add_all([e1, e2])
    db_session.commit()

    # Search query
    res = client.get("/api/v1/entities?search=Eleanor")
    assert res.status_code == 200
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["canonical_name"] == "eleanor vance"

    # Category filter
    res_cat = client.get("/api/v1/entities?category=project")
    assert res_cat.status_code == 200
    assert res_cat.json()["total"] == 1
    assert res_cat.json()["items"][0]["canonical_name"] == "project apollo"


# =============================================================================
# 6. Singular Endpoint Aliases
# =============================================================================

def test_singular_endpoint_aliases(client: TestClient, db_session: Session):
    doc = _create_mock_document(db_session, "singular.txt", "Some text")
    _create_mock_segment(db_session, doc.id, "Some text")

    payload = DocumentExtractionPayload(
        facts=[
            RawFactExtraction(
                category=FactCategory.DECISION,
                statement="Some text decision",
                citations=[RawCitationReference(segment_id=doc.segments[0].id, quote="Some text")],
            )
        ]
    )
    mock_provider = MockLLMProvider(payload=payload)
    app.dependency_overrides[get_extraction_orchestrator] = lambda: ExtractionOrchestrator(llm_provider=mock_provider)

    try:
        # Test POST /api/v1/document/{id}/extract
        res_post = client.post(f"/api/v1/document/{doc.id}/extract")
        assert res_post.status_code == 200
        run_id = res_post.json()["run_id"]

        # Test GET /api/v1/document/{id}/knowledge
        res_know = client.get(f"/api/v1/document/{doc.id}/knowledge")
        assert res_know.status_code == 200
        assert res_know.json()["document_id"] == doc.id

        # Test GET /api/v1/extraction-run/{id}
        res_run = client.get(f"/api/v1/extraction-run/{run_id}")
        assert res_run.status_code == 200
        assert res_run.json()["id"] == run_id

        # Test GET /api/v1/document/{id}/extractions
        res_runs = client.get(f"/api/v1/document/{doc.id}/extractions")
        assert res_runs.status_code == 200
        assert res_runs.json()["total"] >= 1

    finally:
        app.dependency_overrides.pop(get_extraction_orchestrator, None)
