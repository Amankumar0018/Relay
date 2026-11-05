from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator


class SegmentType(str, Enum):
    PAGE = "page"
    SECTION = "section"
    PARAGRAPH = "paragraph"
    TABLE = "table"
    TEXT_BLOCK = "text_block"


class EntityCategory(str, Enum):
    PERSON = "person"
    ROLE = "role"
    ORGANIZATION = "organization"
    PROJECT = "project"
    INITIATIVE = "initiative"
    VENDOR = "vendor"
    COMMITTEE = "committee"
    ASSET = "asset"


class EntityResolutionStatus(str, Enum):
    PENDING = "pending"
    RESOLVED = "resolved"
    AMBIGUOUS = "ambiguous"


class FactCategory(str, Enum):
    DECISION = "decision"
    RESPONSIBILITY = "responsibility"
    COMMITMENT = "commitment"
    DEADLINE = "deadline"
    RISK = "risk"


class FactVerificationStatus(str, Enum):
    EVIDENCE_BACKED = "evidence-backed"
    HUMAN_VERIFIED = "human-verified"
    INFERRED = "inferred"
    CONFLICTING = "conflicting"
    PENDING_REVIEW = "pending-review"
    REJECTED = "rejected"


class RiskSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RelationType(str, Enum):
    TRANSFERS_TO = "TRANSFERS_TO"
    REPORTS_TO = "REPORTS_TO"
    OWNS = "OWNS"
    BLOCKS = "BLOCKS"
    CONTRADICTS = "CONTRADICTS"
    SUPERSEDES = "SUPERSEDES"


class VerificationAction(str, Enum):
    VERIFIED = "verified"
    REJECTED = "rejected"
    EDITED = "edited"
    FLAGGED_CONFLICT = "flagged_conflict"


# -------------------------------------------------------------------------
# DocumentSegment Schemas
# -------------------------------------------------------------------------

class DocumentSegmentBase(BaseModel):
    segment_type: str = Field(..., description="Segment type: page, section, paragraph, table, text_block")
    sequence_number: int = Field(..., ge=0, description="0-based sequential ordering within document")
    page_number: Optional[int] = Field(None, ge=1, description="1-based page number for PDF, None for unpaginated")
    section_title: Optional[str] = Field(None, max_length=255, description="Title or heading of the section")
    source_label: Optional[str] = Field(None, max_length=100, description="Human-readable location label")
    content: str = Field(..., min_length=1, description="Original extracted text content of this segment")
    char_offset_start: int = Field(..., ge=0, description="0-based start character offset in document")
    char_offset_end: int = Field(..., ge=0, description="0-based end character offset (exclusive) in document")


class DocumentSegmentCreate(DocumentSegmentBase):
    document_id: str = Field(..., description="Foreign key UUID referencing parent document")


class DocumentSegmentResponse(DocumentSegmentBase):
    id: str = Field(..., description="Unique segment UUID")
    document_id: str = Field(..., description="Parent document UUID")
    created_at: datetime = Field(..., description="Creation timestamp")

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------------------
# ExtractedEntity Schemas
# -------------------------------------------------------------------------

class ExtractedEntityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Display name of the entity")
    canonical_name: str = Field(..., min_length=1, max_length=255, description="Normalized name for cross-document deduplication")
    category: str = Field(..., description="Category: person, role, organization, project, initiative, vendor, committee, asset")
    description: Optional[str] = Field(None, description="Optional description or contextual summary")


class ExtractedEntityCreate(ExtractedEntityBase):
    pass


class ExtractedEntityResponse(ExtractedEntityBase):
    id: str = Field(..., description="Unique entity UUID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------------------
# EntityMention Schemas
# -------------------------------------------------------------------------

class EntityMentionBase(BaseModel):
    surface_text: str = Field(..., min_length=1, max_length=255, description="Exact surface text in the source")
    char_offset_start: int = Field(..., ge=0, description="0-based start offset in document")
    char_offset_end: int = Field(..., ge=0, description="0-based end offset (exclusive) in document")
    confidence_score: Optional[float] = Field(1.0, ge=0.0, le=1.0, description="Extraction confidence score")
    resolution_status: str = Field("resolved", description="Resolution status: pending, resolved, ambiguous")


class EntityMentionCreate(EntityMentionBase):
    entity_id: str = Field(..., description="Referenced canonical entity UUID")
    document_id: str = Field(..., description="Referenced document UUID")
    segment_id: Optional[str] = Field(None, description="Optional referenced document segment UUID")


class EntityMentionResponse(EntityMentionBase):
    id: str = Field(..., description="Unique mention UUID")
    entity_id: str = Field(..., description="Referenced canonical entity UUID")
    document_id: str = Field(..., description="Referenced document UUID")
    segment_id: Optional[str] = Field(None, description="Referenced document segment UUID")
    created_at: datetime = Field(..., description="Creation timestamp")

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------------------
# FactCitation Schemas
# -------------------------------------------------------------------------

class FactCitationBase(BaseModel):
    verbatim_quote: str = Field(..., min_length=1, description="Exact verbatim quote from source text")
    source_location: Optional[str] = Field(None, max_length=255, description="Human-readable citation label (e.g. Page 2, Section 1)")
    char_start: Optional[int] = Field(None, ge=0, description="Start character offset")
    char_end: Optional[int] = Field(None, ge=0, description="End character offset")
    verification_status: str = Field("valid", description="Citation status: valid, rejected")
    rejection_reason: Optional[str] = Field(None, description="Explicit failure reason if rejected")

    @model_validator(mode="after")
    def validate_offsets(self) -> "FactCitationBase":
        start = self.char_start
        end = self.char_end
        if (start is None and end is not None) or (start is not None and end is None):
            raise ValueError("char_start and char_end must both be provided or both be null")
        if start is not None and end is not None:
            if end <= start:
                raise ValueError("char_end must be strictly greater than char_start")
        return self


class FactCitationCreate(FactCitationBase):
    fact_id: str = Field(..., description="Referenced extracted fact UUID")
    document_segment_id: Optional[str] = Field(None, description="Optional referenced segment UUID")


class FactCitationResponse(FactCitationBase):
    id: str = Field(..., description="Unique citation UUID")
    fact_id: str = Field(..., description="Referenced extracted fact UUID")
    document_segment_id: Optional[str] = Field(None, description="Referenced document segment UUID")
    created_at: datetime = Field(..., description="Creation timestamp")

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------------------
# FactVerificationLog Schemas
# -------------------------------------------------------------------------

class FactVerificationLogBase(BaseModel):
    action: str = Field(..., description="Action taken: verified, rejected, edited, flagged_conflict")
    previous_status: str = Field(..., description="Status prior to action")
    new_status: str = Field(..., description="Status after action")
    reviewer_id: Optional[str] = Field(None, max_length=100, description="Identifier of reviewer or system agent")
    notes: Optional[str] = Field(None, description="Reviewer justification or notes")


class FactVerificationLogCreate(FactVerificationLogBase):
    fact_id: str = Field(..., description="Referenced extracted fact UUID")


class FactVerificationLogResponse(FactVerificationLogBase):
    id: str = Field(..., description="Unique log UUID")
    fact_id: str = Field(..., description="Referenced extracted fact UUID")
    created_at: datetime = Field(..., description="Creation timestamp")

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------------------
# ExtractedFact Schemas
# -------------------------------------------------------------------------

class ExtractedFactBase(BaseModel):
    category: str = Field(..., description="Fact category: decision, responsibility, commitment, deadline, risk")
    statement: str = Field(..., min_length=1, description="Concise factual assertion")
    deadline: Optional[datetime] = Field(None, description="Commitment deadline or milestone date if applicable")
    severity: Optional[str] = Field(None, description="Risk severity: low, medium, high, critical")
    verification_status: str = Field("evidence-backed", description="Status: evidence-backed, human-verified, inferred, conflicting, pending-review, rejected")
    confidence_score: float = Field(1.0, ge=0.0, le=1.0, description="Model extraction confidence score")
    reviewer_notes: Optional[str] = Field(None, description="Human auditor or Switch reviewer notes")


class ExtractedFactCreate(ExtractedFactBase):
    document_id: str = Field(..., description="Source document UUID")
    primary_entity_id: Optional[str] = Field(None, description="Associated primary canonical entity UUID")


class ExtractedFactResponse(ExtractedFactBase):
    id: str = Field(..., description="Unique fact UUID")
    document_id: str = Field(..., description="Source document UUID")
    primary_entity_id: Optional[str] = Field(None, description="Associated primary entity UUID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class ExtractedFactDetailResponse(ExtractedFactResponse):
    citations: List[FactCitationResponse] = Field(default_factory=list, description="Grounding citations")
    verification_logs: List[FactVerificationLogResponse] = Field(default_factory=list, description="Human audit verification history")

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------------------
# EntityRelationship Schemas
# -------------------------------------------------------------------------

class EntityRelationshipBase(BaseModel):
    relation_type: str = Field(..., description="Relationship type: TRANSFERS_TO, REPORTS_TO, OWNS, BLOCKS, CONTRADICTS")
    confidence_score: float = Field(1.0, ge=0.0, le=1.0, description="Relationship confidence score")


class EntityRelationshipCreate(EntityRelationshipBase):
    source_entity_id: str = Field(..., description="Source canonical entity UUID")
    target_entity_id: str = Field(..., description="Target canonical entity UUID")
    document_id: Optional[str] = Field(None, description="Optional source document UUID")


class EntityRelationshipResponse(EntityRelationshipBase):
    id: str = Field(..., description="Unique relationship UUID")
    source_entity_id: str = Field(..., description="Source canonical entity UUID")
    target_entity_id: str = Field(..., description="Target canonical entity UUID")
    document_id: Optional[str] = Field(None, description="Source document UUID")
    created_at: datetime = Field(..., description="Creation timestamp")

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------------------
# ExtractedEntityDetailResponse
# -------------------------------------------------------------------------

class ExtractedEntityDetailResponse(ExtractedEntityResponse):
    mentions: List[EntityMentionResponse] = Field(default_factory=list, description="All surface mentions across documents")

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------------------
# ExtractionRun Schemas
# -------------------------------------------------------------------------

class ExtractionRunStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ExtractionRunBase(BaseModel):
    provider_name: str = Field(default="gemini", max_length=50, description="LLM provider name")
    model_name: str = Field(..., max_length=100, description="Model identifier used for extraction")
    prompt_version: str = Field(..., max_length=50, description="Version tag of the prompt used")
    prompt_hash: str = Field(..., max_length=64, description="SHA-256 hash of extraction prompt")
    status: str = Field(default="running", max_length=30, description="Execution status: running, completed, failed")
    retry_count: int = Field(default=0, ge=0, description="Retry count")
    started_at: datetime = Field(..., description="Run start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Run completion timestamp")
    execution_duration_ms: Optional[int] = Field(None, ge=0, description="Execution duration in milliseconds")
    prompt_tokens: Optional[int] = Field(None, ge=0, description="Input prompt tokens consumed")
    completion_tokens: Optional[int] = Field(None, ge=0, description="Output completion tokens consumed")
    facts_extracted: int = Field(default=0, ge=0, description="Total facts extracted")
    entities_extracted: int = Field(default=0, ge=0, description="Total canonical entities extracted/resolved")
    relationships_extracted: int = Field(default=0, ge=0, description="Total entity relationships mapped")
    citations_verified: int = Field(default=0, ge=0, description="Count of citations successfully grounded")
    citations_rejected: int = Field(default=0, ge=0, description="Count of ungrounded or invalid citations rejected")
    error_stage: Optional[str] = Field(None, max_length=50, description="Pipeline stage where failure occurred")
    error_message: Optional[str] = Field(None, description="Detailed diagnostic error message")


class ExtractionRunCreate(ExtractionRunBase):
    document_id: str = Field(..., description="Source document UUID")


class ExtractionRunResponse(ExtractionRunBase):
    id: str = Field(..., description="Unique extraction run UUID")
    document_id: str = Field(..., description="Source document UUID")
    created_at: datetime = Field(..., description="Creation timestamp")

    model_config = ConfigDict(from_attributes=True)
