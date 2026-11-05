import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import (
    String,
    Integer,
    Float,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.document import Document


class DocumentSegment(Base):
    """
    Structural source-location model representing a discrete segment of an ingested document
    (e.g., page, section, paragraph, table, or text block).
    Preserves exact 0-based character offsets and source labels.
    """
    __tablename__ = "document_segments"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    document_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    segment_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="page, section, paragraph, table, or text_block",
    )
    sequence_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="0-based sequential order within the document",
    )
    page_number: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="1-based page number for paginated docs (PDF); null for docx/txt",
    )
    section_title: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    source_label: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Human-readable location label (e.g., 'Page 2', 'Section 3.1')",
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    char_offset_start: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="0-based start character offset within parent document extracted_text",
    )
    char_offset_end: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="0-based end character offset (exclusive) within parent document extracted_text",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("document_id", "sequence_number", name="uq_document_segments_doc_seq"),
        Index("ix_document_segments_doc_type", "document_id", "segment_type"),
    )

    # Relationships
    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="segments",
    )
    entity_mentions: Mapped[List["EntityMention"]] = relationship(
        "EntityMention",
        back_populates="document_segment",
        cascade="all, delete-orphan",
    )
    citations: Mapped[List["FactCitation"]] = relationship(
        "FactCitation",
        back_populates="document_segment",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<DocumentSegment id={self.id} doc={self.document_id} "
            f"type={self.segment_type} seq={self.sequence_number}>"
        )


class ExtractedEntity(Base):
    """
    Canonical organizational entity representing people, roles, organizations, projects,
    initiatives, vendors, committees, or assets across multiple documents.
    """
    __tablename__ = "extracted_entities"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        comment="Display name of the entity",
    )
    canonical_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        comment="Normalized name for cross-document deduplication",
    )
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="person, role, organization, project, initiative, vendor, committee, asset",
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_extracted_entities_category_canonical", "category", "canonical_name"),
    )

    # Relationships
    mentions: Mapped[List["EntityMention"]] = relationship(
        "EntityMention",
        back_populates="entity",
        cascade="all, delete-orphan",
    )
    facts: Mapped[List["ExtractedFact"]] = relationship(
        "ExtractedFact",
        back_populates="primary_entity",
        foreign_keys="ExtractedFact.primary_entity_id",
    )
    source_relationships: Mapped[List["EntityRelationship"]] = relationship(
        "EntityRelationship",
        foreign_keys="EntityRelationship.source_entity_id",
        back_populates="source_entity",
        cascade="all, delete-orphan",
    )
    target_relationships: Mapped[List["EntityRelationship"]] = relationship(
        "EntityRelationship",
        foreign_keys="EntityRelationship.target_entity_id",
        back_populates="target_entity",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<ExtractedEntity id={self.id} name={self.name} category={self.category}>"


class EntityMention(Base):
    """
    Surface occurrence of an entity in a specific document and segment.
    Preserves exact surface text and character offsets to allow alias resolution
    without premature or erroneous canonical merging.
    """
    __tablename__ = "entity_mentions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    entity_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("extracted_entities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    segment_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("document_segments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    surface_text: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Exact text snippet found in the source document",
    )
    char_offset_start: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    char_offset_end: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    confidence_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        default=1.0,
    )
    resolution_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="resolved",
        index=True,
        comment="pending, resolved, ambiguous",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    entity: Mapped["ExtractedEntity"] = relationship(
        "ExtractedEntity",
        back_populates="mentions",
    )
    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="entity_mentions",
    )
    document_segment: Mapped[Optional["DocumentSegment"]] = relationship(
        "DocumentSegment",
        back_populates="entity_mentions",
    )

    def __repr__(self) -> str:
        return (
            f"<EntityMention id={self.id} text='{self.surface_text}' "
            f"entity_id={self.entity_id} status={self.resolution_status}>"
        )


class ExtractedFact(Base):
    """
    Granular organizational assertion extracted from institutional records.
    Captures decisions, responsibilities, commitments, deadlines, and risks,
    along with verification status and reviewer audit notes.
    """
    __tablename__ = "extracted_facts"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    document_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    primary_entity_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("extracted_entities.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="decision, responsibility, commitment, deadline, risk",
    )
    statement: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Concise, factual assertion statement",
    )
    deadline: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Associated commitment deadline or critical milestone date",
    )
    severity: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        index=True,
        comment="low, medium, high, critical (primarily for risk category)",
    )
    verification_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="evidence-backed",
        index=True,
        comment="evidence-backed, human-verified, inferred, conflicting, pending-review, rejected",
    )
    confidence_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )
    reviewer_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="facts",
    )
    primary_entity: Mapped[Optional["ExtractedEntity"]] = relationship(
        "ExtractedEntity",
        back_populates="facts",
        foreign_keys=[primary_entity_id],
    )
    citations: Mapped[List["FactCitation"]] = relationship(
        "FactCitation",
        back_populates="fact",
        cascade="all, delete-orphan",
    )
    verification_logs: Mapped[List["FactVerificationLog"]] = relationship(
        "FactVerificationLog",
        back_populates="fact",
        cascade="all, delete-orphan",
        order_by="FactVerificationLog.created_at.desc()",
    )

    def __repr__(self) -> str:
        return (
            f"<ExtractedFact id={self.id} category={self.category} "
            f"status={self.verification_status}>"
        )


class FactCitation(Base):
    """
    Grounding evidence quote linking an extracted fact to its exact source
    location within a document and document segment.
    """
    __tablename__ = "fact_citations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    fact_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("extracted_facts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_segment_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("document_segments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    verbatim_quote: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Exact verbatim quotation from the source text",
    )
    source_location: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Human-readable location label (e.g., 'Page 3, Section 2.1')",
    )
    char_start: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Character offset start within the segment or document",
    )
    char_end: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Character offset end within the segment or document",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(
            "(char_start IS NULL AND char_end IS NULL) OR "
            "(char_start IS NOT NULL AND char_end IS NOT NULL AND char_start >= 0 AND char_end > char_start)",
            name="ck_fact_citations_offsets",
        ),
    )

    # Relationships
    fact: Mapped["ExtractedFact"] = relationship(
        "ExtractedFact",
        back_populates="citations",
    )
    document_segment: Mapped[Optional["DocumentSegment"]] = relationship(
        "DocumentSegment",
        back_populates="citations",
    )

    def __repr__(self) -> str:
        return f"<FactCitation id={self.id} fact_id={self.fact_id} loc='{self.source_location}'>"


class EntityRelationship(Base):
    """
    Directed knowledge graph relationship between two canonical entities.
    Captures operational dependencies, reporting lines, handovers, and conflicts.
    """
    __tablename__ = "entity_relationships"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    document_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    source_entity_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("extracted_entities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_entity_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("extracted_entities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    relation_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="TRANSFERS_TO, REPORTS_TO, OWNS, BLOCKS, CONTRADICTS",
    )
    confidence_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_entity_relationships_source_target", "source_entity_id", "target_entity_id"),
    )

    # Relationships
    source_entity: Mapped["ExtractedEntity"] = relationship(
        "ExtractedEntity",
        foreign_keys=[source_entity_id],
        back_populates="source_relationships",
    )
    target_entity: Mapped["ExtractedEntity"] = relationship(
        "ExtractedEntity",
        foreign_keys=[target_entity_id],
        back_populates="target_relationships",
    )
    document: Mapped[Optional["Document"]] = relationship(
        "Document",
    )

    def __repr__(self) -> str:
        return (
            f"<EntityRelationship {self.source_entity_id} "
            f"--[{self.relation_type}]--> {self.target_entity_id}>"
        )


class FactVerificationLog(Base):
    """
    Audit log tracking human verification decisions and status transitions
    for extracted facts (e.g., Switch agent or reviewer confirmations/rejections).
    """
    __tablename__ = "fact_verification_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    fact_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("extracted_facts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="verified, rejected, edited, flagged_conflict",
    )
    previous_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    new_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    reviewer_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Identifier of the human reviewer or system agent",
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    fact: Mapped["ExtractedFact"] = relationship(
        "ExtractedFact",
        back_populates="verification_logs",
    )

    def __repr__(self) -> str:
        return (
            f"<FactVerificationLog id={self.id} fact={self.fact_id} "
            f"action={self.action} {self.previous_status}->{self.new_status}>"
        )
