from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.knowledge import (
    ExtractedFactDetailResponse,
    ExtractedEntityDetailResponse,
    ExtractedEntityResponse,
    EntityRelationshipResponse,
    ExtractionRunResponse,
)


class PersistenceResult(BaseModel):
    """
    Result contract for atomic knowledge extraction persistence.
    Summarizes telemetry and database record counts.
    """
    run_id: str = Field(..., description="ExtractionRun UUID")
    document_id: str = Field(..., description="Target Document UUID")
    status: str = Field(..., description="Final status of the persistence run (completed, failed)")
    entities_count: int = Field(0, ge=0, description="Count of canonical entities resolved or created")
    mentions_count: int = Field(0, ge=0, description="Count of surface entity mentions persisted")
    facts_count: int = Field(0, ge=0, description="Count of extracted facts persisted")
    relationships_count: int = Field(0, ge=0, description="Count of directed relationships persisted")
    citations_verified: int = Field(0, ge=0, description="Count of verified evidence citations persisted")
    citations_rejected: int = Field(0, ge=0, description="Count of rejected citations handled")
    persisted_entity_ids: List[str] = Field(default_factory=list, description="List of entity UUIDs")
    persisted_fact_ids: List[str] = Field(default_factory=list, description="List of fact UUIDs")
    persisted_relationship_ids: List[str] = Field(default_factory=list, description="List of relationship UUIDs")
    execution_duration_ms: Optional[int] = Field(None, ge=0, description="Execution duration in milliseconds")

    model_config = ConfigDict(from_attributes=True)


class DocumentExtractionResponse(BaseModel):
    """
    API response model for document extraction requests.
    """
    success: bool = Field(True, description="Indicates if extraction was accepted and succeeded")
    message: str = Field(..., description="Human-readable summary message")
    run_id: str = Field(..., description="UUID of the extraction run")
    document_id: str = Field(..., description="UUID of the processed document")
    status: str = Field(..., description="Execution status (completed, running, failed)")
    summary: PersistenceResult = Field(..., description="Detailed extraction result counts and telemetry")
    execution_duration_ms: Optional[int] = Field(None, ge=0, description="Execution duration in milliseconds")

    model_config = ConfigDict(from_attributes=True)


class DocumentKnowledgeResponse(BaseModel):
    """
    Consolidated persistent knowledge representation for a document.
    """
    document_id: str = Field(..., description="UUID of the document")
    document_filename: str = Field(..., description="Original filename of the document")
    facts_count: int = Field(0, ge=0, description="Total facts persisted for this document")
    entities_count: int = Field(0, ge=0, description="Total canonical entities referenced in this document")
    relationships_count: int = Field(0, ge=0, description="Total directed relationships captured in this document")
    facts: List[ExtractedFactDetailResponse] = Field(default_factory=list, description="Extracted facts with citations and audit logs")
    entities: List[ExtractedEntityDetailResponse] = Field(default_factory=list, description="Canonical entities with mentions in this document")
    relationships: List[EntityRelationshipResponse] = Field(default_factory=list, description="Directed knowledge graph relationships")
    latest_run: Optional[ExtractionRunResponse] = Field(None, description="Most recent extraction run telemetry")

    model_config = ConfigDict(from_attributes=True)


class FactListResponse(BaseModel):
    """
    Paginated list of extracted facts across documents.
    """
    items: List[ExtractedFactDetailResponse] = Field(default_factory=list, description="Page of facts")
    total: int = Field(..., ge=0, description="Total matching facts count")
    limit: int = Field(..., ge=1, description="Page limit")
    offset: int = Field(..., ge=0, description="Page offset")

    model_config = ConfigDict(from_attributes=True)


class EntityListResponse(BaseModel):
    """
    Paginated list of canonical organizational entities.
    """
    items: List[ExtractedEntityResponse] = Field(default_factory=list, description="Page of entities")
    total: int = Field(..., ge=0, description="Total matching entities count")
    limit: int = Field(..., ge=1, description="Page limit")
    offset: int = Field(..., ge=0, description="Page offset")

    model_config = ConfigDict(from_attributes=True)


class ExtractionRunListResponse(BaseModel):
    """
    List of extraction runs for a document.
    """
    items: List[ExtractionRunResponse] = Field(default_factory=list, description="List of extraction runs")
    total: int = Field(..., ge=0, description="Total runs count")

    model_config = ConfigDict(from_attributes=True)
