from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class DocumentBase(BaseModel):
    original_filename: str = Field(..., description="Original name of the uploaded file")
    file_extension: str = Field(..., description="File extension without dot (e.g., pdf, docx, txt)")
    content_type: str = Field(..., description="MIME content type")
    file_size: int = Field(..., description="File size in bytes")
    sha256_hash: str = Field(..., description="Cryptographic SHA-256 digest")
    extraction_status: str = Field(..., description="Status of text extraction: pending, completed, or failed")


class DocumentResponse(DocumentBase):
    id: str = Field(..., description="Unique document UUID")
    stored_filename: str = Field(..., description="Server storage filename")
    character_count: Optional[int] = Field(0, description="Total characters extracted")
    word_count: Optional[int] = Field(0, description="Total words extracted")
    extraction_error: Optional[str] = Field(None, description="Error message if extraction failed")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class DocumentDetailResponse(DocumentResponse):
    storage_path: str = Field(..., description="Path to physical stored file")
    extracted_text: Optional[str] = Field(None, description="Full extracted text content")


class DocumentTextResponse(BaseModel):
    id: str = Field(..., description="Unique document UUID")
    original_filename: str = Field(..., description="Original name of the uploaded file")
    extraction_status: str = Field(..., description="Extraction status")
    character_count: int = Field(0, description="Total character count")
    word_count: int = Field(0, description="Total word count")
    extracted_text: Optional[str] = Field(None, description="Extracted text content")
    extraction_error: Optional[str] = Field(None, description="Extraction error if failed")

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    items: List[DocumentResponse] = Field(..., description="List of document records")
    total: int = Field(..., description="Total count matching criteria")
    limit: int = Field(..., description="Page limit")
    offset: int = Field(..., description="Page offset")


class DocumentUploadResponse(BaseModel):
    success: bool = True
    message: str = "Document successfully ingested and processed."
    document: DocumentResponse

