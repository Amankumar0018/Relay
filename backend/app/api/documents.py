import os
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.document_service import DocumentService
from app.schemas.document import (
    DocumentResponse,
    DocumentDetailResponse,
    DocumentTextResponse,
    DocumentListResponse,
    DocumentUploadResponse,
)
from app.schemas.knowledge import DocumentSegmentResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])


@router.post(
    "",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest institutional record document",
    description="Uploads a PDF, DOCX, or TXT file, computes its SHA-256 hash, extracts textual content, segments it into structural blocks, and stores metadata.",
)
@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> DocumentUploadResponse:
    """Ingests, validates, persists, extracts text, and generates segments from an uploaded document."""
    document = await DocumentService.ingest_document(db, file)
    return DocumentUploadResponse(
        success=True,
        message=f"Document '{document.original_filename}' successfully ingested and processed.",
        document=DocumentResponse.model_validate(document),
    )


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List ingested documents",
    description="Returns a paginated list of ingested documents with optional status and extension filtering.",
)
def list_documents(
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(50, ge=1, le=100, description="Page limit"),
    extraction_status: Optional[str] = Query(None, alias="status", description="Filter by status (pending, completed, failed)"),
    file_extension: Optional[str] = Query(None, alias="extension", description="Filter by extension (pdf, docx, txt)"),
    db: Session = Depends(get_db),
) -> DocumentListResponse:
    """Lists document records."""
    items, total = DocumentService.list_documents(
        db,
        offset=offset,
        limit=limit,
        extraction_status=extraction_status,
        file_extension=file_extension,
    )
    return DocumentListResponse(
        items=[DocumentResponse.model_validate(doc) for doc in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{document_id}",
    response_model=DocumentDetailResponse,
    summary="Get document details",
    description="Retrieves metadata and full extracted text for a specific document by UUID.",
)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
) -> DocumentDetailResponse:
    """Retrieves document metadata by ID."""
    doc = DocumentService.get_document(db, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )
    return DocumentDetailResponse.model_validate(doc)


@router.get(
    "/{document_id}/text",
    response_model=DocumentTextResponse,
    summary="Get extracted document text",
    description="Retrieves only the extracted textual content and character/word statistics for a document.",
)
def get_document_text(
    document_id: str,
    db: Session = Depends(get_db),
) -> DocumentTextResponse:
    """Retrieves extracted text for a document."""
    doc = DocumentService.get_document(db, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )
    return DocumentTextResponse(
        id=doc.id,
        original_filename=doc.original_filename,
        extraction_status=doc.extraction_status,
        character_count=doc.character_count or 0,
        word_count=doc.word_count or 0,
        extracted_text=doc.extracted_text,
        extraction_error=doc.extraction_error,
    )


@router.get(
    "/{document_id}/segments",
    response_model=List[DocumentSegmentResponse],
    summary="Get document segments",
    description="Retrieves ordered, structured segments extracted from an institutional record.",
)
def get_document_segments(
    document_id: str,
    db: Session = Depends(get_db),
) -> List[DocumentSegmentResponse]:
    """Retrieves all segments for a document ordered by sequence number."""
    segments = DocumentService.get_document_segments(db, document_id)
    return [DocumentSegmentResponse.model_validate(seg) for seg in segments]


@router.get(
    "/{document_id}/download",
    summary="Download original file",
    description="Streams the original uploaded file from storage.",
)
def download_document(
    document_id: str,
    db: Session = Depends(get_db),
):
    """Streams original document file from local storage."""
    doc = DocumentService.get_document(db, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )

    if not os.path.exists(doc.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found on storage mount.",
        )

    return FileResponse(
        path=doc.storage_path,
        media_type=doc.content_type,
        filename=doc.original_filename,
    )


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete document",
    description="Deletes a document record from the database, cascading to all segments and removing the physical file.",
)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
):
    """Deletes document record and associated file."""
    deleted = DocumentService.delete_document(db, document_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )
    return None
