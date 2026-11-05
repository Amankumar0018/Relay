import pytest
from pydantic import ValidationError

from app.schemas.knowledge import FactCategory, EntityCategory, RelationType, RiskSeverity
from app.schemas.extraction import (
    RawCitationReference,
    RawFactExtraction,
    RawEntityMention,
    RawEntityExtraction,
    RawRelationshipExtraction,
    DocumentExtractionPayload,
)
from app.prompts.extraction import (
    EXTRACTION_PROMPT_VERSION,
    EXTRACTION_PROMPT_HASH,
    compute_prompt_hash,
    format_extraction_prompt,
)


def test_valid_extraction_payload():
    """Verify that a fully populated extraction payload parses cleanly."""
    payload = {
        "facts": [
            {
                "category": "decision",
                "statement": "Migrate core infrastructure to AWS by end of Q4.",
                "deadline_text": "end of Q4",
                "severity": None,
                "confidence": 0.95,
                "citations": [
                    {
                        "segment_id": "seg-101",
                        "quote": "We have decided to migrate our core infrastructure to AWS by end of Q4.",
                        "source_context": "Section 2.1: Infrastructure Roadmap",
                    }
                ],
                "is_inference": False,
            },
            {
                "category": "risk",
                "statement": "Key-person dependency on lead architect.",
                "deadline_text": None,
                "severity": "high",
                "confidence": 0.88,
                "citations": [
                    {
                        "segment_id": "seg-102",
                        "quote": "Single point of failure exists around architectural governance.",
                    }
                ],
                "is_inference": True,
            },
        ],
        "entities": [
            {
                "name": "Aris Thorne",
                "category": "person",
                "description": "Outgoing Lead Architect",
                "mentions": [
                    {
                        "segment_id": "seg-101",
                        "surface_text": "Dr. Aris Thorne",
                        "context": "Dr. Aris Thorne announced the transition plan.",
                    }
                ],
            },
            {
                "name": "Project Titan",
                "category": "project",
                "description": "Core cloud migration initiative",
                "mentions": [
                    {
                        "segment_id": "seg-102",
                        "surface_text": "Titan",
                    }
                ],
            },
        ],
        "relationships": [
            {
                "source_entity_name": "Aris Thorne",
                "target_entity_name": "Project Titan",
                "relation_type": "OWNS",
                "confidence": 0.9,
                "justification": "Aris Thorne led Project Titan during initial deployment.",
                "citations": [
                    {
                        "segment_id": "seg-101",
                        "quote": "Dr. Aris Thorne led the Titan team through deployment.",
                    }
                ],
            }
        ],
    }

    parsed = DocumentExtractionPayload(**payload)
    assert len(parsed.facts) == 2
    assert parsed.facts[0].category == FactCategory.DECISION
    assert parsed.facts[1].severity == RiskSeverity.HIGH
    assert len(parsed.entities) == 2
    assert parsed.entities[0].category == EntityCategory.PERSON
    assert len(parsed.relationships) == 1
    assert parsed.relationships[0].relation_type == RelationType.OWNS


def test_empty_extraction_payload():
    """Verify that an empty payload with no findings is valid."""
    parsed = DocumentExtractionPayload()
    assert parsed.facts == []
    assert parsed.entities == []
    assert parsed.relationships == []


def test_invalid_fact_category():
    """Verify rejection of unapproved fact categories."""
    with pytest.raises(ValidationError) as exc:
        RawFactExtraction(
            category="recommendation",  # Not a valid FactCategory
            statement="Should upgrade servers.",
            confidence=0.9,
        )
    assert "category" in str(exc.value)


def test_invalid_entity_category():
    """Verify rejection of unapproved entity categories."""
    with pytest.raises(ValidationError) as exc:
        RawEntityExtraction(
            name="Alpha Team",
            category="squad",  # Not a valid EntityCategory
        )
    assert "category" in str(exc.value)


def test_invalid_relationship_type():
    """Verify rejection of unapproved relationship types."""
    with pytest.raises(ValidationError) as exc:
        RawRelationshipExtraction(
            source_entity_name="Alice",
            target_entity_name="Bob",
            relation_type="DISLIKES",  # Not a valid RelationType
            confidence=0.8,
        )
    assert "relation_type" in str(exc.value)


def test_confidence_bounds():
    """Verify confidence values must strictly reside between 0.0 and 1.0."""
    # Test confidence < 0
    with pytest.raises(ValidationError):
        RawFactExtraction(
            category="decision",
            statement="Valid statement",
            confidence=-0.1,
        )

    # Test confidence > 1
    with pytest.raises(ValidationError):
        RawFactExtraction(
            category="decision",
            statement="Valid statement",
            confidence=1.05,
        )


def test_empty_statement_rejection():
    """Verify rejection of empty or whitespace-only fact statements."""
    with pytest.raises(ValidationError):
        RawFactExtraction(
            category="decision",
            statement="",
        )

    with pytest.raises(ValidationError):
        RawFactExtraction(
            category="decision",
            statement="   \n\t  ",
        )


def test_empty_entity_name_rejection():
    """Verify rejection of empty or whitespace-only entity names."""
    with pytest.raises(ValidationError):
        RawEntityExtraction(
            name="   ",
            category="person",
        )


def test_empty_quote_rejection():
    """Verify rejection of empty or whitespace-only quotes in citations."""
    with pytest.raises(ValidationError):
        RawCitationReference(
            segment_id="seg-1",
            quote="    ",
        )


def test_missing_required_fields():
    """Verify rejection when mandatory fields are omitted."""
    # Missing statement
    with pytest.raises(ValidationError):
        RawFactExtraction(category="decision")

    # Missing segment_id
    with pytest.raises(ValidationError):
        RawCitationReference(quote="Exact text")


def test_extra_forbidden_fields():
    """Verify extra fields are strictly forbidden by ConfigDict(extra='forbid')."""
    with pytest.raises(ValidationError) as exc:
        RawFactExtraction(
            category="decision",
            statement="Valid statement",
            invented_field="hallucinated",
        )
    assert "extra_forbidden" in str(exc.value) or "Extra inputs are not permitted" in str(exc.value)


def test_prompt_version_and_deterministic_hash():
    """Verify prompt version stability and deterministic prompt template hashing."""
    assert EXTRACTION_PROMPT_VERSION == "relay-extraction-v1"
    assert len(EXTRACTION_PROMPT_HASH) == 64  # SHA-256 hex string

    # Recomputing with same defaults returns identical hash
    hash_recomputed = compute_prompt_hash()
    assert hash_recomputed == EXTRACTION_PROMPT_HASH

    # Ensure document data is NOT embedded in the template hash
    formatted_doc_a = format_extraction_prompt("Doc A", [{"id": "1", "content": "Hello"}])
    formatted_doc_b = format_extraction_prompt("Doc B", [{"id": "2", "content": "World"}])
    assert formatted_doc_a != formatted_doc_b

    # The template hash remains invariant regardless of dynamic document content
    assert compute_prompt_hash() == EXTRACTION_PROMPT_HASH


def test_prompt_hash_sensitive_to_template_changes():
    """Verify that any modification to system instruction or prompt template alters the hash."""
    base_hash = compute_prompt_hash()
    modified_sys_hash = compute_prompt_hash(system_instruction="Modified instruction")
    modified_user_hash = compute_prompt_hash(user_prompt_template="Modified template: {document_title}")
    assert base_hash != modified_sys_hash
    assert base_hash != modified_user_hash
    assert modified_sys_hash != modified_user_hash
