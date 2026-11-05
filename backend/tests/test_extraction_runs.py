import hashlib
import uuid
from datetime import datetime, timezone
import pytest
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.document import Document
from app.models.knowledge import ExtractionRun
from app.schemas.knowledge import (
    ExtractionRunStatus,
    ExtractionRunBase,
    ExtractionRunCreate,
    ExtractionRunResponse,
)


def create_sample_document(db: Session, filename: str = "telemetry_test.pdf") -> Document:
    """Helper to persist a test document."""
    doc = Document(
        original_filename=filename,
        stored_filename=f"test_{filename}_{uuid.uuid4().hex[:8]}",
        file_extension="pdf",
        content_type="application/pdf",
        file_size=2048,
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        storage_path=f"data/uploads/{filename}",
        extracted_text="Section 1: Executive handover memo. Details on Project Titan.",
        character_count=61,
        word_count=9,
        extraction_status="completed",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def test_extraction_run_creation_and_defaults(db_session: Session):
    """Verify default field values, nullability, and primary key generation."""
    doc = create_sample_document(db_session)
    dummy_hash = hashlib.sha256(b"v1_system_prompt_template").hexdigest()

    run = ExtractionRun(
        document_id=doc.id,
        provider_name="gemini",
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash=dummy_hash,
    )
    db_session.add(run)
    db_session.commit()
    db_session.refresh(run)

    assert run.id is not None
    assert len(run.id) == 36
    assert run.document_id == doc.id
    assert run.status == "running"
    assert run.retry_count == 0
    assert run.facts_extracted == 0
    assert run.entities_extracted == 0
    assert run.relationships_extracted == 0
    assert run.citations_verified == 0
    assert run.citations_rejected == 0
    assert run.started_at is not None
    assert run.created_at is not None
    assert run.completed_at is None
    assert run.execution_duration_ms is None
    assert run.prompt_tokens is None
    assert run.completion_tokens is None
    assert run.error_stage is None
    assert run.error_message is None
    assert repr(run) == f"<ExtractionRun id={run.id} doc={doc.id} model=gemini-2.5-flash status=running>"


def test_extraction_run_success_completion_telemetry(db_session: Session):
    """Verify persisting full telemetry metrics upon successful run completion."""
    doc = create_sample_document(db_session)
    prompt_hash = hashlib.sha256(b"v1.0_prompt_template").hexdigest()

    run = ExtractionRun(
        document_id=doc.id,
        provider_name="gemini",
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash=prompt_hash,
        status=ExtractionRunStatus.COMPLETED.value,
        retry_count=1,
        completed_at=datetime.now(timezone.utc),
        execution_duration_ms=1840,
        prompt_tokens=420,
        completion_tokens=185,
        facts_extracted=5,
        entities_extracted=4,
        relationships_extracted=3,
        citations_verified=5,
        citations_rejected=1,
    )
    db_session.add(run)
    db_session.commit()
    db_session.refresh(run)

    assert run.status == "completed"
    assert run.retry_count == 1
    assert run.execution_duration_ms == 1840
    assert run.prompt_tokens == 420
    assert run.completion_tokens == 185
    assert run.facts_extracted == 5
    assert run.entities_extracted == 4
    assert run.relationships_extracted == 3
    assert run.citations_verified == 5
    assert run.citations_rejected == 1


def test_extraction_run_failure_telemetry(db_session: Session):
    """Verify error stage and diagnostic error recording upon extraction failure."""
    doc = create_sample_document(db_session)
    prompt_hash = hashlib.sha256(b"v1.0_prompt_template").hexdigest()

    run = ExtractionRun(
        document_id=doc.id,
        provider_name="gemini",
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash=prompt_hash,
        status=ExtractionRunStatus.FAILED.value,
        retry_count=3,
        completed_at=datetime.now(timezone.utc),
        execution_duration_ms=5400,
        error_stage="json_parse",
        error_message="Invalid JSON payload returned by LLM after 3 retries",
    )
    db_session.add(run)
    db_session.commit()
    db_session.refresh(run)

    assert run.status == "failed"
    assert run.error_stage == "json_parse"
    assert "Invalid JSON" in run.error_message
    assert run.facts_extracted == 0


def test_extraction_runs_cascade_delete_with_document(db_session: Session):
    """Verify that deleting a document cascades and deletes all associated extraction runs."""
    doc = create_sample_document(db_session)
    prompt_hash = hashlib.sha256(b"template").hexdigest()

    run1 = ExtractionRun(
        document_id=doc.id,
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash=prompt_hash,
        status="completed",
    )
    run2 = ExtractionRun(
        document_id=doc.id,
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash=prompt_hash,
        status="failed",
    )
    db_session.add_all([run1, run2])
    db_session.commit()

    run1_id = run1.id
    run2_id = run2.id

    # Verify runs exist in session
    assert db_session.get(ExtractionRun, run1_id) is not None
    assert db_session.get(ExtractionRun, run2_id) is not None

    # Delete parent document
    db_session.delete(doc)
    db_session.commit()

    # Verify both runs were cascaded and removed
    assert db_session.get(ExtractionRun, run1_id) is None
    assert db_session.get(ExtractionRun, run2_id) is None


def test_extraction_run_foreign_key_violation(db_session: Session):
    """Verify foreign key enforcement when inserting a run with non-existent document ID."""
    non_existent_id = str(uuid.uuid4())
    run = ExtractionRun(
        document_id=non_existent_id,
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash="dummy_hash",
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(run)
            db_session.flush()


def test_document_extraction_runs_relationship_order(db_session: Session):
    """Verify that document.extraction_runs provides all historical runs in descending chronological order."""
    doc = create_sample_document(db_session)
    prompt_hash = hashlib.sha256(b"template").hexdigest()

    run_first = ExtractionRun(
        document_id=doc.id,
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash=prompt_hash,
        status="failed",
    )
    db_session.add(run_first)
    db_session.commit()

    run_second = ExtractionRun(
        document_id=doc.id,
        model_name="gemini-2.5-flash",
        prompt_version="v1.1",
        prompt_hash=prompt_hash,
        status="completed",
    )
    db_session.add(run_second)
    db_session.commit()

    db_session.refresh(doc)
    assert len(doc.extraction_runs) == 2
    # Verify both runs are associated with the document
    run_ids = [r.id for r in doc.extraction_runs]
    assert run_first.id in run_ids
    assert run_second.id in run_ids


def test_extraction_run_pydantic_schema_validation():
    """Verify Pydantic schema validation for ExtractionRunBase, ExtractionRunCreate, and ExtractionRunResponse."""
    now = datetime.now(timezone.utc)
    prompt_hash = hashlib.sha256(b"prompt").hexdigest()

    create_payload = {
        "document_id": str(uuid.uuid4()),
        "provider_name": "gemini",
        "model_name": "gemini-2.5-flash",
        "prompt_version": "v1.0",
        "prompt_hash": prompt_hash,
        "status": "completed",
        "retry_count": 0,
        "started_at": now,
        "completed_at": now,
        "execution_duration_ms": 1200,
        "prompt_tokens": 500,
        "completion_tokens": 120,
        "facts_extracted": 3,
        "entities_extracted": 2,
        "relationships_extracted": 1,
        "citations_verified": 3,
        "citations_rejected": 0,
    }

    create_schema = ExtractionRunCreate(**create_payload)
    assert create_schema.document_id == create_payload["document_id"]
    assert create_schema.execution_duration_ms == 1200

    response_payload = {
        **create_payload,
        "id": str(uuid.uuid4()),
        "created_at": now,
    }
    response_schema = ExtractionRunResponse(**response_payload)
    assert response_schema.id == response_payload["id"]
    assert response_schema.prompt_tokens == 500


def test_extraction_run_check_constraint_invalid_status(db_session: Session):
    """Verify check constraint blocks unapproved status values."""
    doc = create_sample_document(db_session)
    run = ExtractionRun(
        document_id=doc.id,
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash="dummy_hash",
        status="invalid_status",
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(run)
            db_session.flush()


def test_extraction_run_check_constraint_negative_retry(db_session: Session):
    """Verify check constraint blocks negative retry counts."""
    doc = create_sample_document(db_session)
    run = ExtractionRun(
        document_id=doc.id,
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash="dummy_hash",
        retry_count=-1,
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(run)
            db_session.flush()


def test_extraction_run_check_constraint_negative_metrics(db_session: Session):
    """Verify check constraint blocks negative durations or token counts."""
    doc = create_sample_document(db_session)

    # Negative execution duration
    run_neg_dur = ExtractionRun(
        document_id=doc.id,
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash="dummy_hash",
        execution_duration_ms=-100,
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(run_neg_dur)
            db_session.flush()

    # Negative prompt tokens
    run_neg_prompt = ExtractionRun(
        document_id=doc.id,
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash="dummy_hash",
        prompt_tokens=-1,
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(run_neg_prompt)
            db_session.flush()

    # Negative completion tokens
    run_neg_comp = ExtractionRun(
        document_id=doc.id,
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash="dummy_hash",
        completion_tokens=-5,
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(run_neg_comp)
            db_session.flush()


def test_extraction_run_check_constraint_negative_counts(db_session: Session):
    """Verify check constraint blocks negative entity/fact/citation counts."""
    doc = create_sample_document(db_session)

    for field in [
        "facts_extracted",
        "entities_extracted",
        "relationships_extracted",
        "citations_verified",
        "citations_rejected",
    ]:
        kwargs = {
            "document_id": doc.id,
            "model_name": "gemini-2.5-flash",
            "prompt_version": "v1.0",
            "prompt_hash": "dummy_hash",
            field: -1,
        }
        run_invalid = ExtractionRun(**kwargs)
        with pytest.raises(IntegrityError):
            with db_session.begin_nested():
                db_session.add(run_invalid)
                db_session.flush()


def test_extraction_run_boundary_zero_and_preservation(db_session: Session):
    """Verify that zero values are accepted and multiple runs are preserved while document exists."""
    doc = create_sample_document(db_session)

    run1 = ExtractionRun(
        document_id=doc.id,
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash="dummy_hash",
        status="running",
        retry_count=0,
        execution_duration_ms=0,
        prompt_tokens=0,
        completion_tokens=0,
        facts_extracted=0,
    )
    run2 = ExtractionRun(
        document_id=doc.id,
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash="dummy_hash",
        status="failed",
        error_stage="prompt_prep",
        error_message="Test failure",
    )
    run3 = ExtractionRun(
        document_id=doc.id,
        model_name="gemini-2.5-flash",
        prompt_version="v1.0",
        prompt_hash="dummy_hash",
        status="completed",
        facts_extracted=5,
    )
    db_session.add_all([run1, run2, run3])
    db_session.commit()

    db_session.refresh(doc)
    assert len(doc.extraction_runs) == 3
    statuses = {r.status for r in doc.extraction_runs}
    assert statuses == {"running", "failed", "completed"}
