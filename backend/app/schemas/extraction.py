from typing import List, Optional, Any
from pydantic import BaseModel, Field, model_validator, field_validator

from app.schemas.knowledge import (
    FactCategory,
    RiskSeverity,
    EntityCategory,
    RelationType,
)


class StrictExtractionBaseModel(BaseModel):
    """
    Base model that rejects unexpected fields during validation
    while avoiding 'additionalProperties: false' in the emitted JSON schema,
    ensuring 100% compatibility with the Google GenAI API schema parser.
    """
    @model_validator(mode="before")
    @classmethod
    def check_unexpected_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            allowed = set(cls.model_fields.keys())
            unexpected = set(data.keys()) - allowed
            if unexpected:
                raise ValueError(f"Extra inputs are not permitted: {unexpected}")
        return data


class RawCitationReference(StrictExtractionBaseModel):
    """
    Raw evidence quotation and segment identifier as extracted by LLM.
    Important: LLM does not generate trusted database offsets;
    offsets are computed independently by the grounding engine in Phase 3.
    """
    segment_id: str = Field(..., max_length=100, description="Source DocumentSegment UUID or identifier")
    quote: str = Field(..., max_length=5000, description="Exact quotation extracted from source text")
    source_context: Optional[str] = Field(None, max_length=1000, description="Surrounding contextual excerpt")

    @field_validator("segment_id", "quote", mode="after")
    @classmethod
    def validate_non_empty_strings(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field must not be empty or blank whitespace")
        return stripped


class RawFactExtraction(StrictExtractionBaseModel):
    """
    Candidate factual assertion extracted from document segments.
    Evidence-backed status and database persistence are deferred to later phases.
    """
    category: FactCategory = Field(
        ...,
        description="Fact classification: decision, responsibility, commitment, deadline, risk",
    )
    statement: str = Field(..., max_length=2000, description="Extracted factual claim")
    deadline_text: Optional[str] = Field(None, max_length=255, description="Raw deadline expression if applicable")
    severity: Optional[RiskSeverity] = Field(None, description="Risk severity if category is risk: low, medium, high, critical")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Extraction confidence score (0.0 to 1.0)")
    citations: List[RawCitationReference] = Field(
        default_factory=list,
        max_length=50,
        description="Raw supporting citations extracted from source text",
    )
    is_inference: bool = Field(
        default=False,
        description="Flag indicating whether statement is an explicit contextual inference rather than direct fact",
    )

    @field_validator("statement", mode="after")
    @classmethod
    def validate_statement(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Fact statement must not be empty or blank whitespace")
        return stripped


class RawEntityMention(StrictExtractionBaseModel):
    """
    Raw occurrence/mention of an entity found in a specific document segment.
    """
    segment_id: str = Field(..., max_length=100, description="DocumentSegment UUID containing the mention")
    surface_text: str = Field(..., max_length=255, description="Exact surface text naming the entity in the segment")
    context: Optional[str] = Field(None, max_length=1000, description="Surrounding sentence or clause")

    @field_validator("segment_id", "surface_text", mode="after")
    @classmethod
    def validate_non_empty_strings(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field must not be empty or blank whitespace")
        return stripped


class RawEntityExtraction(StrictExtractionBaseModel):
    """
    Candidate entity extracted from document segments.
    Canonical resolution and persistence are deferred to Phase 4.
    """
    name: str = Field(..., max_length=255, description="Canonical or predominant name of the entity")
    category: EntityCategory = Field(
        ...,
        description="Entity type: person, role, organization, project, initiative, vendor, committee, asset",
    )
    description: Optional[str] = Field(None, max_length=1000, description="Brief description or context")
    mentions: List[RawEntityMention] = Field(
        default_factory=list,
        max_length=100,
        description="Surface mentions identified across segments",
    )

    @field_validator("name", mode="after")
    @classmethod
    def validate_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Entity name must not be empty or blank whitespace")
        return stripped


class RawRelationshipExtraction(StrictExtractionBaseModel):
    """
    Directed relationship connecting two extracted entities.
    """
    source_entity_name: str = Field(..., max_length=255, description="Source entity name")
    target_entity_name: str = Field(..., max_length=255, description="Target entity name")
    relation_type: RelationType = Field(
        ...,
        description="Directed relation type: TRANSFERS_TO, REPORTS_TO, OWNS, BLOCKS, CONTRADICTS",
    )
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Relationship confidence score (0.0 to 1.0)")
    justification: Optional[str] = Field(None, max_length=1000, description="Reasoning or evidence explanation")
    citations: List[RawCitationReference] = Field(
        default_factory=list,
        max_length=50,
        description="Raw supporting citations",
    )

    @field_validator("source_entity_name", "target_entity_name", mode="after")
    @classmethod
    def validate_entity_names(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Entity name in relationship must not be empty or blank whitespace")
        return stripped


class DocumentExtractionPayload(StrictExtractionBaseModel):
    """
    Complete candidate extraction payload for a document or batch of segments.
    Enforces strict typing, size limits, and forbidden extra keys.
    """
    facts: List[RawFactExtraction] = Field(
        default_factory=list,
        max_length=500,
        description="List of extracted facts, commitments, decisions, and risks",
    )
    entities: List[RawEntityExtraction] = Field(
        default_factory=list,
        max_length=500,
        description="List of extracted candidate entities",
    )
    relationships: List[RawRelationshipExtraction] = Field(
        default_factory=list,
        max_length=500,
        description="List of directed entity relationships",
    )
