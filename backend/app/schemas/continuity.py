from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.knowledge import (
    ExtractedFactDetailResponse,
    ExtractedEntityResponse,
    FactCitationResponse,
)


# =============================================================================
# 1. Conflict & Gap Schemas
# =============================================================================

class ConflictType(str, Enum):
    CONTRADICTION = "contradiction"
    SUPERSEDED_DECISION = "superseded_decision"
    OUTDATED_DEADLINE = "outdated_deadline"
    CHANGED_RESPONSIBILITY = "changed_responsibility"
    UNRESOLVED_COMMITMENT = "unresolved_commitment"
    OWNERSHIP_GAP = "ownership_gap"
    KNOWLEDGE_GAP = "knowledge_gap"


class ConflictSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ConflictStatus(str, Enum):
    OPEN = "open"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class KnowledgeConflictBase(BaseModel):
    conflict_type: str = Field(..., description="Classification of conflict or gap")
    severity: str = Field("medium", description="Severity: low, medium, high, critical")
    status: str = Field("open", description="Status: open, resolved, dismissed")
    title: str = Field(..., min_length=1, max_length=255, description="Brief descriptive summary")
    description: str = Field(..., description="Detailed explanation of why this matter requires review")
    fact_a_id: Optional[str] = Field(None, description="Primary supporting fact UUID")
    fact_b_id: Optional[str] = Field(None, description="Contradicting or superseded fact UUID")
    entity_id: Optional[str] = Field(None, description="Referenced entity UUID")
    document_id: Optional[str] = Field(None, description="Referenced document UUID")
    resolution_notes: Optional[str] = Field(None, description="Human auditor justification or resolution explanation")
    resolved_at: Optional[datetime] = Field(None, description="Resolution timestamp")
    resolved_by: Optional[str] = Field(None, description="Identifier of the reviewer who resolved this matter")


class KnowledgeConflictResolve(BaseModel):
    status: str = Field("resolved", description="New status: resolved, dismissed")
    resolution_notes: str = Field(..., min_length=2, description="Auditor explanation or clarification")
    resolved_by: Optional[str] = Field("auditor", description="Reviewer identifier")


class KnowledgeConflictResponse(KnowledgeConflictBase):
    id: str = Field(..., description="Conflict UUID")
    created_at: datetime = Field(..., description="Detection timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    fact_a: Optional[ExtractedFactDetailResponse] = Field(None, description="First supporting fact with citations")
    fact_b: Optional[ExtractedFactDetailResponse] = Field(None, description="Second or contradicting fact with citations")
    entity_name: Optional[str] = Field(None, description="Resolved entity display name")
    document_filename: Optional[str] = Field(None, description="Source document filename")

    model_config = ConfigDict(from_attributes=True)


class ConflictListResponse(BaseModel):
    items: List[KnowledgeConflictResponse] = Field(default_factory=list, description="List of conflict findings")
    total: int = Field(0, ge=0, description="Total matching findings")
    open_count: int = Field(0, ge=0, description="Total open findings")
    critical_count: int = Field(0, ge=0, description="Total critical findings")

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# 2. Continuity Assessment Schemas
# =============================================================================

class OwnedProject(BaseModel):
    entity_id: str
    name: str
    category: str
    description: Optional[str] = None
    risk_level: str = "medium"
    dependencies_count: int = 0


class ReportingRelationship(BaseModel):
    source_entity_id: str
    source_entity_name: str
    target_entity_id: str
    target_entity_name: str
    relation_type: str


class CriticalBlocker(BaseModel):
    fact_id: str
    statement: str
    severity: str
    category: str
    deadline: Optional[datetime] = None
    citations_count: int = 0
    document_filename: Optional[str] = None


class ContinuityOverviewResponse(BaseModel):
    continuity_score: int = Field(..., ge=0, le=100, description="Readiness score out of 100")
    readiness_status: str = Field(..., description="ON_TRACK, ATTENTION_REQUIRED, CRITICAL_RISK")
    total_documents_deposited: int = Field(0, ge=0)
    total_facts_extracted: int = Field(0, ge=0)
    total_entities_indexed: int = Field(0, ge=0)
    active_conflicts_count: int = Field(0, ge=0)
    critical_blockers_count: int = Field(0, ge=0)
    outgoing_leader: Optional[str] = None
    incoming_successor: Optional[str] = None
    owned_projects: List[OwnedProject] = Field(default_factory=list)
    reporting_lines: List[ReportingRelationship] = Field(default_factory=list)
    critical_blockers: List[CriticalBlocker] = Field(default_factory=list)
    open_risks: List[ExtractedFactDetailResponse] = Field(default_factory=list)
    knowledge_gaps: List[KnowledgeConflictResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# 3. Handover Dossier Schemas
# =============================================================================

class DossierChapter(BaseModel):
    chapter_id: str = Field(..., description="Chapter identifier e.g. ch1")
    title: str = Field(..., description="Chapter title")
    summary: str = Field(..., description="Executive narrative synthesis")
    facts: List[ExtractedFactDetailResponse] = Field(default_factory=list, description="Grounding facts")
    citations: List[FactCitationResponse] = Field(default_factory=list, description="Verbatim source evidence citations")
    action_items: List[str] = Field(default_factory=list, description="Prescribed actions")


class HandoverDossierContent(BaseModel):
    executive_summary: str = Field(..., description="High-level transition summary")
    mandate_overview: str = Field(..., description="Mandate, role scope, and governance charter")
    chapters: List[DossierChapter] = Field(default_factory=list, description="Dossier chapters")
    recommended_day_1_to_30_actions: List[str] = Field(default_factory=list, description="Chronological roadmap")


class HandoverDossierCreateRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=255, description="Custom title for dossier")
    target_role: Optional[str] = Field(None, max_length=255, description="Role title e.g. Chief Scientific Officer")
    outgoing_leader_name: Optional[str] = Field(None, max_length=255, description="Outgoing executive display name")
    incoming_leader_name: Optional[str] = Field(None, max_length=255, description="Incoming successor display name")


class HandoverDossierResponse(BaseModel):
    id: str = Field(..., description="Dossier UUID")
    title: str = Field(..., description="Title of the briefing book")
    target_role: Optional[str] = Field(None, description="Target organizational role")
    outgoing_leader: Optional[ExtractedEntityResponse] = None
    incoming_leader: Optional[ExtractedEntityResponse] = None
    status: str = Field("draft", description="draft, generated, finalized")
    version: int = Field(1, ge=1)
    content: HandoverDossierContent = Field(..., description="Structured chapters and actions")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HandoverDossierListResponse(BaseModel):
    items: List[HandoverDossierResponse] = Field(default_factory=list)
    total: int = Field(0, ge=0)

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# 4. Natural-Language Question Answering Schemas
# =============================================================================

class QARequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000, description="Natural-language question from leader")


class QACitation(BaseModel):
    document_id: Optional[str] = None
    document_filename: str
    source_location: str
    verbatim_quote: str
    char_start: Optional[int] = None
    char_end: Optional[int] = None
    fact_id: Optional[str] = None
    fact_statement: Optional[str] = None


class QAResponse(BaseModel):
    question: str
    answer: str
    has_sufficient_evidence: bool = True
    confidence_score: float = Field(1.0, ge=0.0, le=1.0)
    citations: List[QACitation] = Field(default_factory=list)
    supporting_facts_count: int = 0
    conflicts_detected: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


class QAHistoryResponse(BaseModel):
    items: List[QAResponse] = Field(default_factory=list)
    total: int = Field(0, ge=0)

    model_config = ConfigDict(from_attributes=True)

