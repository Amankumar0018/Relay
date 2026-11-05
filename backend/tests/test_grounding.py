import uuid
import pytest
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.knowledge import DocumentSegment
from app.schemas.knowledge import FactCategory, FactCitationBase
from app.schemas.extraction import (
    RawCitationReference,
    RawFactExtraction,
    DocumentExtractionPayload,
)
from app.schemas.grounding import (
    GroundingStatus,
    GroundingResult,
    FactGroundingResult,
    GroundedExtractionPayload,
)
from app.services.grounding import EvidenceGroundingService


@pytest.fixture
def grounding_service():
    return EvidenceGroundingService()


def _make_document(db: Session, text: str, filename: str = "test.txt") -> Document:
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
        extraction_status="completed",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# =============================================================================
# 1. Whitespace Normalization & Index Mapping Tests
# =============================================================================

def test_normalization_map_multiple_spaces(grounding_service):
    orig = "The    quick   brown     fox"
    norm_str, starts, ends = grounding_service.build_normalized_map(orig)
    assert norm_str == "The quick brown fox"
    # Find "brown fox" in norm_str
    query = "brown fox"
    idx = norm_str.find(query)
    orig_start = starts[idx]
    orig_end = ends[idx + len(query) - 1]
    assert orig[orig_start:orig_end] == "brown     fox"


def test_normalization_map_newlines_and_tabs(grounding_service):
    orig = "Decision:\n\t1. Expand infrastructure.\r\n\t2. Maintain budget."
    norm_str, starts, ends = grounding_service.build_normalized_map(orig)
    assert norm_str == "Decision: 1. Expand infrastructure. 2. Maintain budget."

    query = "1. Expand infrastructure."
    idx = norm_str.find(query)
    orig_start = starts[idx]
    orig_end = ends[idx + len(query) - 1]
    assert orig[orig_start:orig_end] == "1. Expand infrastructure."


def test_normalization_map_leading_trailing_whitespace(grounding_service):
    orig = "   \n\t  Surrounding whitespace.  \r\n  "
    norm_str, starts, ends = grounding_service.build_normalized_map(orig)
    assert norm_str == "Surrounding whitespace."
    orig_start = starts[0]
    orig_end = ends[len(norm_str) - 1]
    assert orig[orig_start:orig_end] == "Surrounding whitespace."


def test_normalization_map_unicode_whitespace(grounding_service):
    orig = "Total:\u00a0$50,000\u2002allocated"
    norm_str, starts, ends = grounding_service.build_normalized_map(orig)
    assert norm_str == "Total: $50,000 allocated"
    query = "$50,000 allocated"
    idx = norm_str.find(query)
    orig_start = starts[idx]
    orig_end = ends[idx + len(query) - 1]
    assert orig[orig_start:orig_end] == "$50,000\u2002allocated"


def test_normalization_map_empty_string(grounding_service):
    norm_str, starts, ends = grounding_service.build_normalized_map("")
    assert norm_str == ""
    assert starts == []
    assert ends == []


# =============================================================================
# 2. Exact Quote Matching (Tier 1) Tests
# =============================================================================

def test_exact_match_single_occurrence(grounding_service):
    content = "The steering committee approved the deployment timeline for Q4."
    quote = "approved the deployment timeline"
    res = grounding_service.match_quote_in_content(content, quote)

    assert res.is_valid is True
    assert res.status == GroundingStatus.VALID_EXACT
    assert res.char_start is not None
    assert res.char_end is not None
    assert content[res.char_start:res.char_end] == quote
    assert res.verbatim_quote == quote


def test_exact_match_offset_invariants(grounding_service):
    content = "Critical milestone scheduled for November 15, 2026."
    quote = "November 15, 2026"
    res = grounding_service.match_quote_in_content(content, quote)

    assert res.is_valid is True
    assert res.char_start >= 0
    assert res.char_end > res.char_start
    assert content[res.char_start:res.char_end] == res.verbatim_quote
    # Verifies compatibility with FactCitationBase schema validator
    citation_schema = FactCitationBase(
        verbatim_quote=res.verbatim_quote,
        char_start=res.char_start,
        char_end=res.char_end,
    )
    assert citation_schema.char_start == res.char_start


# =============================================================================
# 3. Normalized Quote Matching (Tier 2) Tests
# =============================================================================

def test_normalized_match_multiple_spaces_to_single(grounding_service):
    content = "Project Alpha     handover will occur on    Friday."
    quote = "Project Alpha handover will occur on Friday."
    res = grounding_service.match_quote_in_content(content, quote)

    assert res.is_valid is True
    assert res.status == GroundingStatus.VALID_NORMALIZED
    assert res.verbatim_quote == "Project Alpha     handover will occur on    Friday."
    assert content[res.char_start:res.char_end] == res.verbatim_quote


def test_normalized_match_newlines_to_space(grounding_service):
    content = "The Board decided to:\n1. Terminate vendor contract.\n2. Initiate RFP."
    quote = "Terminate vendor contract. 2. Initiate RFP."
    res = grounding_service.match_quote_in_content(content, quote)

    assert res.is_valid is True
    assert res.status == GroundingStatus.VALID_NORMALIZED
    assert res.verbatim_quote == "Terminate vendor contract.\n2. Initiate RFP."
    assert content[res.char_start:res.char_end] == res.verbatim_quote


def test_normalized_match_crlf_and_tabs(grounding_service):
    content = "Budget:\r\n\t$250,000 for cloud migration."
    quote = "Budget: $250,000 for cloud migration."
    res = grounding_service.match_quote_in_content(content, quote)

    assert res.is_valid is True
    assert res.status == GroundingStatus.VALID_NORMALIZED
    assert res.verbatim_quote == "Budget:\r\n\t$250,000 for cloud migration."
    assert content[res.char_start:res.char_end] == res.verbatim_quote


# =============================================================================
# 4. Context Disambiguation Tests
# =============================================================================

def test_disambiguation_exact_duplicate_with_first_context(grounding_service):
    content = (
        "In Q1, the budget was approved by the Board. "
        "Later in Q3, the budget was approved by the Committee."
    )
    quote = "the budget was approved"
    context = "In Q1, the budget was approved by the Board."

    res = grounding_service.match_quote_in_content(content, quote, source_context=context)
    assert res.is_valid is True
    assert res.status == GroundingStatus.VALID_EXACT
    assert res.verbatim_quote == quote
    assert res.char_start == content.find("the budget was approved")


def test_disambiguation_exact_duplicate_with_second_context(grounding_service):
    content = (
        "In Q1, the budget was approved by the Board. "
        "Later in Q3, the budget was approved by the Committee."
    )
    quote = "the budget was approved"
    context = "Later in Q3, the budget was approved by the Committee."

    res = grounding_service.match_quote_in_content(content, quote, source_context=context)
    assert res.is_valid is True
    assert res.status == GroundingStatus.VALID_EXACT
    assert res.verbatim_quote == quote
    expected_start = content.rfind("the budget was approved")
    assert res.char_start == expected_start


def test_disambiguation_normalized_duplicate_with_context(grounding_service):
    content = (
        "Primary risk: system   outage.\n\n"
        "Secondary risk: system\n  outage."
    )
    quote = "system outage."
    context = "Secondary risk: system outage."

    res = grounding_service.match_quote_in_content(content, quote, source_context=context)
    assert res.is_valid is True
    assert res.status == GroundingStatus.VALID_NORMALIZED
    assert res.verbatim_quote == "system\n  outage."
    assert content[res.char_start:res.char_end] == res.verbatim_quote


# =============================================================================
# 5. Ambiguous Matches Rejection Tests
# =============================================================================

def test_ambiguous_match_rejected_when_no_context(grounding_service):
    content = "The policy was updated in 2024. The policy was updated in 2025."
    quote = "The policy was updated"
    res = grounding_service.match_quote_in_content(content, quote, source_context=None)

    assert res.is_valid is False
    assert res.status == GroundingStatus.REJECTED_AMBIGUOUS_MATCH
    assert "no source_context provided" in res.rejection_reason
    assert res.char_start is None
    assert res.char_end is None


def test_ambiguous_match_rejected_when_context_cannot_be_located(grounding_service):
    content = "Target deadline is December 1. Target deadline is December 1."
    quote = "Target deadline"
    # Fabricated context that does not exist in content
    context = "As discussed with leadership during the offsite"

    res = grounding_service.match_quote_in_content(content, quote, source_context=context)
    assert res.is_valid is False
    assert res.status == GroundingStatus.REJECTED_AMBIGUOUS_MATCH
    assert "could not be uniquely disambiguated" in res.rejection_reason


def test_ambiguous_match_rejected_when_context_itself_is_duplicated(grounding_service):
    content = (
        "Project status: active (on track). "
        "Project status: active (on track)."
    )
    quote = "active"
    context = "Project status: active"

    res = grounding_service.match_quote_in_content(content, quote, source_context=context)
    assert res.is_valid is False
    assert res.status == GroundingStatus.REJECTED_AMBIGUOUS_MATCH


# =============================================================================
# 6. Quote Not Found & Invalid Quote Tests
# =============================================================================

def test_quote_not_found(grounding_service):
    content = "All engineering handovers must be completed by November 30."
    quote = "All marketing handovers must be completed"
    res = grounding_service.match_quote_in_content(content, quote)

    assert res.is_valid is False
    assert res.status == GroundingStatus.REJECTED_QUOTE_NOT_FOUND
    assert "Quote not found" in res.rejection_reason
    assert res.char_start is None
    assert res.char_end is None


def test_empty_quote_rejected(grounding_service):
    content = "Valid document segment text."
    res = grounding_service.match_quote_in_content(content, "   ")

    assert res.is_valid is False
    assert res.status == GroundingStatus.REJECTED_EMPTY_QUOTE
    assert "empty or whitespace-only" in res.rejection_reason


# =============================================================================
# 7. Citation Ownership & DB Validation Tests
# =============================================================================

def test_ground_citation_segment_not_found(db_session: Session, grounding_service):
    doc_id = str(uuid.uuid4())
    fake_seg_id = str(uuid.uuid4())
    proposed = RawCitationReference(segment_id=fake_seg_id, quote="Sample quote")

    res = grounding_service.ground_citation(doc_id, proposed, db_session)
    assert res.is_valid is False
    assert res.status == GroundingStatus.REJECTED_SEGMENT_NOT_FOUND
    assert f"DocumentSegment '{fake_seg_id}' does not exist" in res.rejection_reason


def test_ground_citation_foreign_document_rejected(db_session: Session, grounding_service):
    doc1 = _make_document(db_session, "Doc 1 text", "doc1.txt")
    doc2 = _make_document(db_session, "Doc 2 text", "doc2.txt")

    # Segment belongs to doc1
    seg1 = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=doc1.id,
        sequence_number=0,
        segment_type="paragraph",
        content="Confidential financial audit results for 2026.",
        char_offset_start=0,
        char_offset_end=46,
    )
    db_session.add(seg1)
    db_session.commit()

    # Attempt to ground citation in doc2 pointing to seg1 (foreign document)
    proposed = RawCitationReference(
        segment_id=seg1.id,
        quote="Confidential financial audit results",
    )
    res = grounding_service.ground_citation(doc2.id, proposed, db_session)

    assert res.is_valid is False
    assert res.status == GroundingStatus.REJECTED_FOREIGN_DOCUMENT
    assert f"belongs to document '{doc1.id}', not target document '{doc2.id}'" in res.rejection_reason


def test_ground_citation_success_with_db(db_session: Session, grounding_service):
    text = "The security lead must sign off on all production releases."
    doc = _make_document(db_session, text, "policy.txt")

    seg = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        sequence_number=0,
        segment_type="paragraph",
        page_number=3,
        section_title="Release Governance",
        source_label="Page 3, Release Governance",
        content=text,
        char_offset_start=0,
        char_offset_end=len(text),
    )
    db_session.add(seg)
    db_session.commit()

    proposed = RawCitationReference(
        segment_id=seg.id,
        quote="security lead must sign off on all production releases",
    )
    res = grounding_service.ground_citation(doc.id, proposed, db_session)

    assert res.is_valid is True
    assert res.status == GroundingStatus.VALID_EXACT
    assert res.segment_id == seg.id
    assert res.source_location == "Page 3, Release Governance"
    assert seg.content[res.char_start:res.char_end] == res.verbatim_quote


# =============================================================================
# 8. Fact Grounding & Verification Disposition Policy Tests
# =============================================================================

def test_fact_grounding_all_citations_verified(db_session: Session, grounding_service):
    text = "Vendor contract renewed for 12 months."
    doc = _make_document(db_session, text, "contract.txt")

    seg = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        sequence_number=0,
        segment_type="paragraph",
        content=text,
        char_offset_start=0,
        char_offset_end=len(text),
    )
    db_session.add(seg)
    db_session.commit()

    raw_fact = RawFactExtraction(
        category=FactCategory.COMMITMENT,
        statement="Vendor contract was renewed for a period of 12 months.",
        citations=[
            RawCitationReference(segment_id=seg.id, quote="Vendor contract renewed for 12 months.")
        ],
    )

    fact_res = grounding_service.ground_fact(doc.id, raw_fact, db_session)
    assert fact_res.is_supported is True
    assert fact_res.verification_status == "evidence-backed"
    assert fact_res.valid_citation_count == 1
    assert fact_res.rejected_citation_count == 0


def test_fact_grounding_partial_citations_verified(db_session: Session, grounding_service):
    text = "Target migration date: Dec 15."
    doc = _make_document(db_session, text, "plan.txt")

    seg = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        sequence_number=0,
        segment_type="paragraph",
        content=text,
        char_offset_start=0,
        char_offset_end=len(text),
    )
    db_session.add(seg)
    db_session.commit()

    raw_fact = RawFactExtraction(
        category=FactCategory.DEADLINE,
        statement="Cloud migration scheduled for December 15.",
        citations=[
            RawCitationReference(segment_id=seg.id, quote="Target migration date: Dec 15."),
            RawCitationReference(segment_id=seg.id, quote="Invalid hallucinated quote here"),
        ],
    )

    fact_res = grounding_service.ground_fact(doc.id, raw_fact, db_session)
    assert fact_res.is_supported is True
    assert fact_res.verification_status == "evidence-backed"
    assert fact_res.valid_citation_count == 1
    assert fact_res.rejected_citation_count == 1
    assert "Partially supported" in fact_res.disposition_notes


def test_fact_grounding_zero_citations_rejected(db_session: Session, grounding_service):
    text = "Some plain text content."
    doc = _make_document(db_session, text, "unsupported.txt")

    seg = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        sequence_number=0,
        segment_type="paragraph",
        content=text,
        char_offset_start=0,
        char_offset_end=len(text),
    )
    db_session.add(seg)
    db_session.commit()

    # Fact with hallucinated citation that fails grounding
    raw_fact = RawFactExtraction(
        category=FactCategory.DECISION,
        statement="Budget increased by 50% without board approval.",
        citations=[
            RawCitationReference(segment_id=seg.id, quote="Budget increased by 50%")
        ],
        is_inference=False,
    )

    fact_res = grounding_service.ground_fact(doc.id, raw_fact, db_session)
    assert fact_res.is_supported is False
    assert fact_res.verification_status == "rejected"
    assert fact_res.valid_citation_count == 0
    assert fact_res.rejected_citation_count == 1


def test_fact_grounding_inference_flagged_inferred(db_session: Session, grounding_service):
    text = "Text without direct quote."
    doc = _make_document(db_session, text, "inferred.txt")

    # Model marked statement as an explicit inference with 0 citations
    raw_fact = RawFactExtraction(
        category=FactCategory.RISK,
        statement="Team capacity is likely strained due to simultaneous deliverables.",
        citations=[],
        is_inference=True,
    )

    fact_res = grounding_service.ground_fact(doc.id, raw_fact, db_session)
    assert fact_res.is_supported is False
    assert fact_res.verification_status == "inferred"
    assert fact_res.valid_citation_count == 0


def test_fact_grounding_inference_with_citations_cannot_be_evidence_backed(
    db_session: Session, grounding_service
):
    text = "Dr. Thorne mentioned upcoming transition plans during the town hall."
    doc = _make_document(db_session, text, "transition.txt")

    seg = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        sequence_number=0,
        segment_type="paragraph",
        content=text,
        char_offset_start=0,
        char_offset_end=len(text),
    )
    db_session.add(seg)
    db_session.commit()

    # Fact is marked as inference, BUT has a grounded valid citation
    raw_fact = RawFactExtraction(
        category=FactCategory.DECISION,
        statement="Dr. Thorne is preparing to step down from the leadership role.",
        citations=[
            RawCitationReference(
                segment_id=seg.id,
                quote="Dr. Thorne mentioned upcoming transition plans",
            )
        ],
        is_inference=True,
    )

    fact_res = grounding_service.ground_fact(doc.id, raw_fact, db_session)
    # MUST NOT be marked evidence-backed because it is an inference
    assert fact_res.is_supported is False
    assert fact_res.verification_status == "inferred"
    assert fact_res.valid_citation_count == 1
    assert "explicit inference" in fact_res.disposition_notes


# =============================================================================
# 9. Payload Batch Grounding Tests
# =============================================================================

def test_ground_payload_batch(db_session: Session, grounding_service):
    text = "Segment 1 content. Segment 2 content."
    doc = _make_document(db_session, text, "batch.txt")

    seg1 = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        sequence_number=0,
        segment_type="paragraph",
        content="Segment 1 content.",
        char_offset_start=0,
        char_offset_end=18,
    )
    seg2 = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        sequence_number=1,
        segment_type="paragraph",
        content="Segment 2 content.",
        char_offset_start=19,
        char_offset_end=37,
    )
    db_session.add_all([seg1, seg2])
    db_session.commit()

    payload = DocumentExtractionPayload(
        facts=[
            RawFactExtraction(
                category=FactCategory.DECISION,
                statement="Decision from segment 1.",
                citations=[RawCitationReference(segment_id=seg1.id, quote="Segment 1 content.")],
            ),
            RawFactExtraction(
                category=FactCategory.RESPONSIBILITY,
                statement="Responsibility from segment 2.",
                citations=[RawCitationReference(segment_id=seg2.id, quote="Segment 2 content.")],
            ),
            RawFactExtraction(
                category=FactCategory.RISK,
                statement="Unsubstantiated risk claim.",
                citations=[RawCitationReference(segment_id=seg1.id, quote="Nonexistent quote")],
            ),
        ]
    )

    grounded_payload = grounding_service.ground_payload(doc.id, payload, db_session)
    assert grounded_payload.document_id == doc.id
    assert grounded_payload.total_facts == 3
    assert grounded_payload.supported_facts == 2
    assert grounded_payload.rejected_facts == 1
    assert grounded_payload.total_citations_verified == 2
    assert grounded_payload.total_citations_rejected == 1


# =============================================================================
# 10. Direct In-Memory & Database Constraint Integration Tests
# =============================================================================

def test_ground_citation_in_segment_direct(grounding_service):
    seg = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=str(uuid.uuid4()),
        sequence_number=0,
        segment_type="paragraph",
        source_label="Page 1, Intro",
        content="Antigravity framework version 2.0 released today.",
        char_offset_start=0,
        char_offset_end=49,
    )

    # Valid in-memory match
    proposed = RawCitationReference(segment_id=seg.id, quote="framework version 2.0")
    res = grounding_service.ground_citation_in_segment(seg, proposed)
    assert res.is_valid is True
    assert res.status == GroundingStatus.VALID_EXACT
    assert res.source_location == "Page 1, Intro"
    assert seg.content[res.char_start:res.char_end] == res.verbatim_quote

    # Mismatched segment ID
    mismatched = RawCitationReference(segment_id=str(uuid.uuid4()), quote="framework version 2.0")
    res_mismatched = grounding_service.ground_citation_in_segment(seg, mismatched)
    assert res_mismatched.is_valid is False
    assert res_mismatched.status == GroundingStatus.REJECTED_SEGMENT_NOT_FOUND

    # Foreign document ID check
    foreign_doc_id = str(uuid.uuid4())
    res_foreign = grounding_service.ground_citation_in_segment(
        seg, proposed, document_id=foreign_doc_id
    )
    assert res_foreign.is_valid is False
    assert res_foreign.status == GroundingStatus.REJECTED_FOREIGN_DOCUMENT
    assert f"belongs to document '{seg.document_id}'" in res_foreign.rejection_reason


def test_grounded_citation_persists_to_db_cleanly(db_session: Session, grounding_service):
    from app.models.knowledge import ExtractedFact, FactCitation

    text = "The committee designated Sarah Chen as primary escalation contact."
    doc = _make_document(db_session, text, "escalation.txt")

    seg = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        sequence_number=0,
        segment_type="paragraph",
        content=text,
        char_offset_start=0,
        char_offset_end=len(text),
    )
    db_session.add(seg)
    db_session.commit()

    proposed = RawCitationReference(
        segment_id=seg.id,
        quote="Sarah Chen as primary escalation contact",
    )
    res = grounding_service.ground_citation(doc.id, proposed, db_session)
    assert res.is_valid is True

    # Create ExtractedFact and FactCitation using grounded offsets
    fact = ExtractedFact(
        document_id=doc.id,
        category=FactCategory.RESPONSIBILITY.value,
        statement="Sarah Chen is designated as primary escalation contact.",
        verification_status="evidence-backed",
    )
    db_session.add(fact)
    db_session.commit()

    citation = FactCitation(
        fact_id=fact.id,
        document_segment_id=res.segment_id,
        verbatim_quote=res.verbatim_quote,
        source_location=res.source_location,
        char_start=res.char_start,
        char_end=res.char_end,
    )
    db_session.add(citation)
    db_session.commit()
    db_session.refresh(citation)

    # Verify persisted offsets and quote
    assert citation.id is not None
    assert citation.char_start == res.char_start
    assert citation.char_end == res.char_end
    assert citation.verbatim_quote == res.verbatim_quote
    assert seg.content[citation.char_start:citation.char_end] == citation.verbatim_quote
