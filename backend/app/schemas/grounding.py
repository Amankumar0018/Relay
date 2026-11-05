from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator

from app.schemas.knowledge import FactVerificationStatus


class GroundingStatus(str, Enum):
    """
    Status classification for candidate citation grounding validation.
    """
    VALID_EXACT = "valid_exact"
    VALID_NORMALIZED = "valid_normalized"
    REJECTED_SEGMENT_NOT_FOUND = "rejected_segment_not_found"
    REJECTED_FOREIGN_DOCUMENT = "rejected_foreign_document"
    REJECTED_QUOTE_NOT_FOUND = "rejected_quote_not_found"
    REJECTED_AMBIGUOUS_MATCH = "rejected_ambiguous_match"
    REJECTED_EMPTY_QUOTE = "rejected_empty_quote"


class GroundingResult(BaseModel):
    """
    Grounding result for a single candidate citation.
    Guarantees segment-relative offsets and exact source slice when valid.
    """
    is_valid: bool = Field(..., description="Whether citation was grounded in source text")
    status: GroundingStatus = Field(..., description="Machine-readable status code")
    segment_id: Optional[str] = Field(None, description="DocumentSegment UUID")
    char_start: Optional[int] = Field(None, ge=0, description="0-based segment-relative start offset")
    char_end: Optional[int] = Field(None, ge=0, description="0-based segment-relative end offset (exclusive)")
    verbatim_quote: Optional[str] = Field(None, description="Exact character slice from segment.content[start:end]")
    source_location: Optional[str] = Field(None, description="Human-readable location label")
    rejection_reason: Optional[str] = Field(None, description="Explicit reason if citation rejected")

    @model_validator(mode="after")
    def validate_invariants(self) -> "GroundingResult":
        if self.is_valid:
            if self.char_start is None or self.char_end is None:
                raise ValueError("Valid GroundingResult must have both char_start and char_end")
            if self.char_end <= self.char_start:
                raise ValueError("char_end must be strictly greater than char_start")
            if not self.verbatim_quote:
                raise ValueError("Valid GroundingResult must have a non-empty verbatim_quote")
        else:
            if not self.rejection_reason:
                raise ValueError("Invalid GroundingResult must provide an explicit rejection_reason")
            if self.char_start is not None or self.char_end is not None:
                raise ValueError("Invalid GroundingResult must not have char_start or char_end offsets")
        return self


class FactGroundingResult(BaseModel):
    """
    Grounding evaluation for an extracted fact assertion across all its citations.
    """
    statement: str = Field(..., description="Fact assertion statement")
    category: str = Field(..., description="Fact category")
    is_supported: bool = Field(..., description="Whether fact meets evidence criteria")
    verification_status: FactVerificationStatus = Field(
        ...,
        description="Assigned verification status: evidence-backed, inferred, pending-review, rejected",
    )
    citations: List[GroundingResult] = Field(default_factory=list, description="Grounding results for proposed citations")
    valid_citation_count: int = Field(0, ge=0, description="Number of verified citations")
    rejected_citation_count: int = Field(0, ge=0, description="Number of rejected citations")
    is_inference: bool = Field(False, description="Whether statement was marked as an inference by LLM")
    disposition_notes: Optional[str] = Field(None, description="Audit notes explaining fact disposition")


class GroundedExtractionPayload(BaseModel):
    """
    Container for grounded extraction facts ready for entity resolution and persistence.
    """
    document_id: str = Field(..., description="Document UUID")
    facts: List[FactGroundingResult] = Field(default_factory=list, description="List of grounded facts")
    total_facts: int = Field(0, ge=0, description="Total number of evaluated facts")
    supported_facts: int = Field(0, ge=0, description="Number of evidence-backed facts")
    inferred_facts: int = Field(0, ge=0, description="Number of inferred facts")
    rejected_facts: int = Field(0, ge=0, description="Number of rejected facts")
    total_citations_verified: int = Field(0, ge=0, description="Total verified citations across all facts")
    total_citations_rejected: int = Field(0, ge=0, description="Total rejected citations across all facts")
