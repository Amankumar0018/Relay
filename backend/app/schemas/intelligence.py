from typing import List, Optional
from pydantic import BaseModel, Field


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
