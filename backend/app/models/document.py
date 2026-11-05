import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String, Integer, Text, DateTime, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.knowledge import (
        DocumentSegment,
        EntityMention,
        ExtractedFact,
        ExtractionRun,
    )


class Document(Base):
    """
    SQLAlchemy 2.0 model representing an ingested institutional record.
    Tracks file provenance, storage location, cryptographic integrity,
    and extracted textual content.
    """
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    file_extension: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    character_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)
    word_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)
    extraction_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
    )
    extraction_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
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

    # Relationships
    segments: Mapped[List["DocumentSegment"]] = relationship(
        "DocumentSegment",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentSegment.sequence_number",
    )
    entity_mentions: Mapped[List["EntityMention"]] = relationship(
        "EntityMention",
        back_populates="document",
        cascade="all, delete-orphan",
    )
    facts: Mapped[List["ExtractedFact"]] = relationship(
        "ExtractedFact",
        back_populates="document",
        cascade="all, delete-orphan",
    )
    extraction_runs: Mapped[List["ExtractionRun"]] = relationship(
        "ExtractionRun",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="ExtractionRun.created_at.desc()",
    )

    def __repr__(self) -> str:
        return f"<Document id={self.id} filename={self.original_filename} status={self.extraction_status}>"
