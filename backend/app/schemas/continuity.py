from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator

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
    ARCHIVED = "archived"


class KnowledgeConflictBase(BaseModel):
    conflict_type: str = Field(..., description="Classification of conflict or gap")
    severity: str = Field("medium", description="Severity: low, medium, high, critical")
    status: str = Field("open", description="Status: open, resolved, dismissed, archived")
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
    approval_token: Optional[str] = Field(None, description="One-time human approval token required for resolution")


class ConflictApprovalRequestCreate(BaseModel):
    proposed_status: str = Field("resolved", description="Proposed status: resolved or dismissed")
    resolution_notes: str = Field(..., min_length=3, description="Justification for resolving the discrepancy")
    requesting_agent: Optional[str] = Field("relay-knowledge-extractor", description="Agent requesting resolution")


class ConflictApprovalRequestResponse(BaseModel):
    id: str = Field(..., description="Approval request UUID")
    conflict_id: str = Field(..., description="Target conflict UUID")
    requesting_agent: str = Field(..., description="Requesting agent name")
    proposed_status: str = Field(..., description="Proposed resolution status")
    resolution_notes: str = Field(..., description="Agent resolution justification")
    status: str = Field(..., description="Request status: pending, approved, rejected, consumed")
    expires_at: datetime = Field(..., description="Expiration timestamp")
    created_at: datetime = Field(..., description="Request creation timestamp")
    message: str = Field(..., description="Status summary for user/channel")

    model_config = ConfigDict(from_attributes=True)


class ConflictHumanAdjudicateRequest(BaseModel):
    request_id: str = Field(..., description="UUID of the ConflictApprovalToken")
    decision: str = Field(..., description="'approved' or 'rejected'")
    approver_id: Optional[str] = Field(None, description="Optional human identity; strictly overridden by verified session")
    session_token: Optional[str] = Field(None, description="Mattermost session token or Personal Access Token (PAT)", repr=False)
    login_id: Optional[str] = Field(None, description="Optional Mattermost username or email for direct human credential authentication")
    password: Optional[str] = Field(None, description="Optional Mattermost password for direct human credential authentication", repr=False)
    approver_auth_type: Optional[str] = Field(None, description="Verification type: mattermost_session, mattermost_credentials, or switch_operator_secret")
    decision_notes: Optional[str] = Field(None, description="Optional notes from human reviewer")


class MattermostLoginRequest(BaseModel):
    login_id: str = Field(..., description="Mattermost username or email")
    password: str = Field(..., description="Mattermost account password", repr=False)


class MattermostLoginResponse(BaseModel):
    success: bool
    user_id: str
    username: str
    email: Optional[str] = None
    token: str = Field(..., repr=False)
    verified_approver_id: str
    message: str


class ConflictResolutionAuditResponse(BaseModel):
    id: str = Field(..., description="Audit record UUID")
    conflict_id: str = Field(..., description="Target conflict UUID")
    decision: str = Field(..., description="Decision made: approved, rejected")
    approver_id: str = Field(..., description="Identity of the human approver")
    approver_auth_type: str = Field(..., description="Authentication method verified")
    resolution_notes: Optional[str] = Field(None, description="Resolution notes")
    timestamp: datetime = Field(..., description="Audit timestamp")

    model_config = ConfigDict(from_attributes=True)


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
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Structured chapter-specific metadata")


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
    document_filename: str = Field(..., description="Source document filename")
    source_document: Optional[str] = Field(None, description="Source document title or filename")
    source_document_title: Optional[str] = Field(None, description="Alias for source document title")
    segment_id: Optional[str] = Field(None, description="UUID of the supporting document segment")
    document_segment_id: Optional[str] = Field(None, description="Alias for segment UUID")
    source_location: str = Field(..., description="Segment or page location")
    verbatim_quote: str = Field(..., description="Exact supporting quotation")
    quote: Optional[str] = Field(None, description="Alias for verbatim quote")
    char_start: Optional[int] = None
    char_end: Optional[int] = None
    fact_id: Optional[str] = None
    fact_statement: Optional[str] = None

    @model_validator(mode="after")
    def sync_citation_aliases(self) -> "QACitation":
        if self.quote is None and self.verbatim_quote is not None:
            self.quote = self.verbatim_quote
        elif self.verbatim_quote is None and self.quote is not None:
            self.verbatim_quote = self.quote

        if self.segment_id is None and self.document_segment_id is not None:
            self.segment_id = self.document_segment_id
        elif self.document_segment_id is None and self.segment_id is not None:
            self.document_segment_id = self.segment_id

        if self.source_document is None and self.document_filename is not None:
            self.source_document = self.document_filename
        if self.source_document_title is None and self.document_filename is not None:
            self.source_document_title = self.document_filename
        return self


class QAResponse(BaseModel):
    question: str
    answer: str
    has_sufficient_evidence: bool = True
    is_grounded: bool = True
    is_grounding: bool = True
    missing_evidence: bool = False
    confidence_score: float = Field(0.0, ge=0.0, le=1.0)
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    citations: List[QACitation] = Field(default_factory=list)
    supporting_facts_count: int = 0
    conflicts_detected: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def sync_response_grounding(self) -> "QAResponse":
        grounded = bool(self.has_sufficient_evidence and self.is_grounded and self.is_grounding)
        self.is_grounded = grounded
        self.is_grounding = grounded
        self.has_sufficient_evidence = grounded
        self.missing_evidence = not grounded

        if self.confidence == 0.0 and self.confidence_score > 0.0:
            self.confidence = self.confidence_score
        elif self.confidence_score == 0.0 and self.confidence > 0.0:
            self.confidence_score = self.confidence
        return self


class QAHistoryResponse(BaseModel):
    items: List[QAResponse] = Field(default_factory=list)
    total: int = Field(0, ge=0)

    model_config = ConfigDict(from_attributes=True)

