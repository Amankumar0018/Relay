import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.knowledge import ExtractedFact, ExtractedEntity


class KnowledgeConflict(Base):
    """
    Identified cross-document or intra-document discrepancy, contradiction,
    superseded decision, outdated deadline, responsibility mismatch, or knowledge gap.
    Preserves links to source facts, entities, and citations.
    """
    __tablename__ = "knowledge_conflicts"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    conflict_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="contradiction, superseded_decision, outdated_deadline, changed_responsibility, unresolved_commitment, ownership_gap, knowledge_gap",
    )
    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="medium",
        index=True,
        comment="low, medium, high, critical",
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="open",
        index=True,
        comment="open, resolved, dismissed",
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    fact_a_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("extracted_facts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    fact_b_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("extracted_facts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    entity_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("extracted_entities.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    document_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    resolution_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    resolved_by: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(
            "conflict_type IN ('contradiction', 'superseded_decision', 'outdated_deadline', 'changed_responsibility', 'unresolved_commitment', 'ownership_gap', 'knowledge_gap')",
            name="ck_conflicts_type",
        ),
        CheckConstraint(
            "severity IN ('low', 'medium', 'high', 'critical')",
            name="ck_conflicts_severity",
        ),
        CheckConstraint(
            "status IN ('open', 'resolved', 'dismissed')",
            name="ck_conflicts_status",
        ),
        Index("ix_conflicts_type_status", "conflict_type", "status"),
        Index("ix_conflicts_severity_status", "severity", "status"),
    )

    # Relationships
    fact_a: Mapped[Optional["ExtractedFact"]] = relationship(
        "ExtractedFact",
        foreign_keys=[fact_a_id],
    )
    fact_b: Mapped[Optional["ExtractedFact"]] = relationship(
        "ExtractedFact",
        foreign_keys=[fact_b_id],
    )
    entity: Mapped[Optional["ExtractedEntity"]] = relationship(
        "ExtractedEntity",
        foreign_keys=[entity_id],
    )
    document: Mapped[Optional["Document"]] = relationship(
        "Document",
        foreign_keys=[document_id],
    )

    def __repr__(self) -> str:
        return f"<KnowledgeConflict id={self.id} type={self.conflict_type} severity={self.severity} status={self.status}>"


class HandoverDossier(Base):
    """
    Executive Transition Dossier compiled from grounded organizational knowledge.
    Contains chapters detailing mandate overview, ratified decisions, active responsibilities,
    project ownership, key personnel, deadlines, risks, discrepancies, and transition blueprints.
    """
    __tablename__ = "handover_dossiers"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    target_role: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    outgoing_leader_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("extracted_entities.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    incoming_leader_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("extracted_entities.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="draft",
        index=True,
        comment="draft, generated, finalized",
    )
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )
    content_json: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Structured JSON containing chapters, evidence references, and recommendations",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'generated', 'finalized')",
            name="ck_dossiers_status",
        ),
        CheckConstraint(
            "version >= 1",
            name="ck_dossiers_version",
        ),
    )

    # Relationships
    outgoing_leader: Mapped[Optional["ExtractedEntity"]] = relationship(
        "ExtractedEntity",
        foreign_keys=[outgoing_leader_id],
    )
    incoming_leader: Mapped[Optional["ExtractedEntity"]] = relationship(
        "ExtractedEntity",
        foreign_keys=[incoming_leader_id],
    )

    def __repr__(self) -> str:
        return f"<HandoverDossier id={self.id} title='{self.title}' status={self.status} v{self.version}>"


class QuestionAnswerAudit(Base):
    """
    Audit log of evidence-grounded natural-language inquiries asked by incoming leaders.
    Preserves the question, generated response, supporting evidence context, and sufficiency metrics.
    """
    __tablename__ = "qa_audits"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    question: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    answer: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    evidence_context_json: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Serialized facts, citations, and document references used to substantiate the response",
    )
    confidence_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )
    has_sufficient_evidence: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    def __repr__(self) -> str:
        return f"<QuestionAnswerAudit id={self.id} sufficient={self.has_sufficient_evidence} created_at={self.created_at}>"


class ConflictApprovalToken(Base):
    """
    Cryptographic single-use human approval token for conflict resolution.
    Stores ONLY a secure SHA-256 hash of the one-time token.
    Binds the approval request to a specific conflict ID, proposed resolution,
    requesting agent, and expiration timestamp.
    """
    __tablename__ = "conflict_approval_tokens"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    conflict_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("knowledge_conflicts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requesting_agent: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="agent",
    )
    proposed_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="resolved",
    )
    resolution_notes: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        unique=True,
        comment="SHA-256 secure hash of the one-time raw approval token",
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
        comment="pending, approved, rejected, consumed",
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    consumed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    conflict: Mapped["KnowledgeConflict"] = relationship(
        "KnowledgeConflict",
        foreign_keys=[conflict_id],
    )

    def __repr__(self) -> str:
        return f"<ConflictApprovalToken id={self.id} conflict={self.conflict_id} status={self.status}>"


class ConflictResolutionAudit(Base):
    """
    Immutable audit trail recording every human decision, approval, rejection,
    and conflict resolution event with verified reviewer credentials and timestamps.
    """
    __tablename__ = "conflict_resolution_audits"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    conflict_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("knowledge_conflicts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    approval_token_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True,
        index=True,
    )
    decision: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="approved, rejected",
    )
    approver_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Verified human operator or Switch reviewer identity",
    )
    approver_auth_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="switch_operator_secret",
        comment="switch_operator_secret, switch_mattermost_session, etc.",
    )
    resolution_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    token_hash: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    conflict: Mapped["KnowledgeConflict"] = relationship(
        "KnowledgeConflict",
        foreign_keys=[conflict_id],
    )

    def __repr__(self) -> str:
        return f"<ConflictResolutionAudit id={self.id} conflict={self.conflict_id} decision={self.decision} approver={self.approver_id}>"

