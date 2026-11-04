import os
import uuid
import hashlib
import logging
import re
from pathlib import Path
from typing import Optional, List, Tuple

from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.core.config import settings
from app.models.document import Document
from app.services.extractor import TextExtractor, ExtractionError

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
    "application/octet-stream",  # Fallback often sent by some clients/curl for binary
}


def sanitize_filename(filename: str) -> str:
    """Removes path traversals, control characters, and reserved characters from a filename."""
    name = Path(filename).name
    # Keep alphanumeric, dashes, underscores, dots
    cleaned = re.sub(r"[^\w\s\.-]", "_", name).strip()
    return cleaned or "unnamed_document"


class DocumentService:
    """
    Orchestrates validation, physical persistence, cryptographic hashing,
    text extraction, and database tracking for uploaded institutional records.
    """

    @classmethod
    def get_upload_dir(cls) -> Path:
        """Returns the resolved upload directory path and ensures it exists."""
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)
        return upload_dir

    @classmethod
    async def ingest_document(
        cls,
        db: Session,
        file: UploadFile,
    ) -> Document:
        """
        Validates, saves, extracts, and registers an uploaded document file.
        """
        original_filename = file.filename or "unnamed_file"
        sanitized_name = sanitize_filename(original_filename)
        ext = Path(sanitized_name).suffix.lower()

        # 1. Extension validation
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            )

        # 2. Content-type check
        content_type = file.content_type or "application/octet-stream"

        # 3. Read content and validate size
        file_bytes = await file.read()
        file_size = len(file_bytes)

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes).",
            )

        if file_size > settings.MAX_FILE_SIZE_BYTES:
            max_mb = settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"File size ({file_size} bytes) exceeds maximum limit of {max_mb} MB.",
            )

        # 4. Cryptographic SHA-256 digest
        sha256_hash = hashlib.sha256(file_bytes).hexdigest()

        # 5. Determine unique storage path
        doc_id = str(uuid.uuid4())
        stored_filename = f"{doc_id}_{sanitized_name}"
        upload_dir = cls.get_upload_dir()
        file_path = upload_dir / stored_filename

        try:
            with open(file_path, "wb") as f:
                f.write(file_bytes)
        except Exception as exc:
            logger.error("Failed to write document to disk at %s: %s", file_path, exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to persist document to storage.",
            ) from exc

        # 6. Extract text content
        extracted_text = None
        extraction_status = "completed"
        extraction_error = None
        char_count = 0
        word_count = 0

        try:
            extracted_text, char_count, word_count = TextExtractor.extract(file_bytes, ext)
        except ExtractionError as e_err:
            logger.warning("Extraction error for document '%s': %s", original_filename, e_err)
            extraction_status = "failed"
            extraction_error = str(e_err)
        except Exception as u_err:
            logger.exception("Unexpected error during text extraction of '%s'", original_filename)
            extraction_status = "failed"
            extraction_error = f"Unexpected extraction error: {u_err}"

        # 7. Record in database
        clean_ext = ext.lstrip(".")
        document = Document(
            id=doc_id,
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_extension=clean_ext,
            content_type=content_type,
            file_size=file_size,
            sha256_hash=sha256_hash,
            storage_path=str(file_path),
            extracted_text=extracted_text,
            character_count=char_count,
            word_count=word_count,
            extraction_status=extraction_status,
            extraction_error=extraction_error,
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        logger.info(
            "Document ingested successfully: id=%s name='%s' size=%d status=%s",
            doc_id,
            original_filename,
            file_size,
            extraction_status,
        )
        return document

    @classmethod
    def get_document(cls, db: Session, document_id: str) -> Optional[Document]:
        """Fetches a document record by UUID."""
        return db.scalar(select(Document).where(Document.id == document_id))

    @classmethod
    def list_documents(
        cls,
        db: Session,
        offset: int = 0,
        limit: int = 50,
        extraction_status: Optional[str] = None,
        file_extension: Optional[str] = None,
    ) -> Tuple[List[Document], int]:
        """
        Queries documents with pagination and optional status/extension filters.
        Returns (list_of_documents, total_count).
        """
        query = select(Document)
        count_query = select(func.count()).select_from(Document)

        if extraction_status:
            query = query.where(Document.extraction_status == extraction_status)
            count_query = count_query.where(Document.extraction_status == extraction_status)

        if file_extension:
            clean_ext = file_extension.lower().lstrip(".")
            query = query.where(Document.file_extension == clean_ext)
            count_query = count_query.where(Document.file_extension == clean_ext)

        total = db.scalar(count_query) or 0
        items = list(
            db.scalars(
                query.order_by(desc(Document.created_at)).offset(offset).limit(limit)
            ).all()
        )
        return items, total

    @classmethod
    def delete_document(cls, db: Session, document_id: str) -> bool:
        """Removes a document from database and deletes its file from storage."""
        doc = cls.get_document(db, document_id)
        if not doc:
            return False

        # Attempt to delete file from disk
        try:
            p = Path(doc.storage_path)
            if p.exists() and p.is_file():
                p.unlink()
        except Exception as exc:
            logger.warning("Could not delete file at %s: %s", doc.storage_path, exc)

        db.delete(doc)
        db.commit()
        return True
