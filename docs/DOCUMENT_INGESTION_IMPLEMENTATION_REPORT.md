# Relay Milestone 1: Document Ingestion Pipeline

**Role:** Senior Backend Engineer & Software Architect  
**Project:** Relay (Organizational Continuity Platform)  
**Milestone:** Real Document Ingestion Pipeline (Phase 1 & Phase 2)  
**Status:** **Completed & Verified** (19/19 Pytest Passing, Docker Restart Resilient, 17/17 Next.js Static Pages Built)

---

## 1. Executive Summary

Milestone 1 introduces the backend document ingestion engine for Relay. The system can now accept, validate, cryptographically fingerprint, physically persist, parse, and query institutional records across **PDF**, **DOCX**, and **TXT** formats within Docker.

### Core Capabilities Delivered:
1. **Multi-Format Ingestion**: Ingests `.pdf`, `.docx`, and `.txt` files through `POST /api/v1/documents`.
2. **Strict Validation**: Enforces extension whitelisting, MIME classification, empty-file rejection (0 bytes), size limits (&le; 25MB), and directory traversal sanitization.
3. **Deterministic Text Extraction**:
   - **`.txt`**: Multi-encoding decoding (UTF-8 with Latin-1 fallback) and newline normalization.
   - **`.pdf`**: Page-by-page extraction via `pypdf`, preserving paragraph boundaries while handling encryption or corruption gracefully.
   - **`.docx`**: Structured extraction via `python-docx` encompassing both linear prose and multi-column tabular cell matrices (`|` delimited).
4. **Physical & Cryptographic Integrity**: Computes SHA-256 digests and persists files to `./backend/data/uploads` on the host, mapped into `/app/data/uploads` inside the container.
5. **Relational Tracking & Retrieval**: Stores metadata and extracted text in SQLite using SQLAlchemy 2.0 (`Document` model), exposed via paginated listing, detail inspection, raw text querying, and file streaming endpoints.
6. **Alembic Migration History**: Initialized Alembic migration environment (`backend/alembic`) with version `c24d6592cc4a_create_documents_table.py`.
7. **Container Restart Resilience**: Verified live by uploading documents, restarting the Docker container (`docker compose restart backend`), and confirming that records and files remain intact.

---

## 2. Codebase Audit & Integration Points

Before modifying any source files, the backend was audited to integrate cleanly with existing conventions:

| Component | Audit Observation | Integration Decision |
|---|---|---|
| **App Entrypoint** | `app/main.py` uses `lifespan` with `init_db()` and `check_db_connection()`. | Added storage directory verification in `lifespan` and updated exception handlers to return standard `error` and `detail` keys. |
| **Database Engine** | `app/core/database.py` uses SQLAlchemy 2.0 `DeclarativeBase` with SQLite WAL mode and foreign key enforcement. | Registered `Document` model on `Base.metadata`. |
| **Settings** | `app/core/config.py` uses `pydantic-settings`. | Added `UPLOAD_DIR`, `MAX_FILE_SIZE_BYTES` (25MB), and `ALLOWED_EXTENSIONS`. |
| **Docker Compose** | Mounts `./backend:/app` with SQLite database at `./relay.db`. | Placed default upload directory at `data/uploads`, ensuring files persist on host storage across container restarts. |
| **Test Suite** | `tests/conftest.py` uses in-memory SQLite with session rollbacks. | Added isolated temporary upload directory fixture via `tmp_path` to prevent test uploads from polluting development storage. |
| **Frontend API** | `frontend/src/lib/api.ts` defines `API_ENDPOINTS.documents`. | Implemented REST routes matching `/api/v1/documents` and typed TypeScript helper functions. |

---

## 3. Database Architecture (SQLAlchemy 2.0 & Alembic)

### 3.1 Document Entity Model
Implemented in `backend/app/models/document.py`:

```python
class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    file_extension: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    character_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)
    word_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)
    extraction_status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    extraction_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
```

### 3.2 Alembic Migration Setup
- Initialized Alembic configuration in `backend/alembic.ini` and `backend/alembic/env.py`.
- Generated and stamped migration: `c24d6592cc4a_create_documents_table.py` with indexes on `id`, `stored_filename`, `file_extension`, `sha256_hash`, `extraction_status`, and `created_at`.

---

## 4. Ingestion & Extraction Pipeline

### 4.1 Dependency Additions
Updated `backend/requirements.txt` with:
- `python-multipart>=0.0.12,<1.0.0` (FastAPI multipart form-data handling)
- `pypdf>=5.0.0,<7.0.0` (pure-Python PDF parsing)
- `python-docx>=1.1.0,<2.0.0` (DOCX paragraph and table parsing)

### 4.2 Text Extractor Engine
Implemented in `backend/app/services/extractor.py`:
- **Plain Text (`.txt`)**: Decodes UTF-8 bytes with fallback to Latin-1.
- **PDF Documents (`.pdf`)**: Streams PDF bytes through `PdfReader`. Detects encryption, decrypts permission-free files, extracts text page-by-page, and catches malformed structures cleanly.
- **Word Documents (`.docx`)**: Traverses body paragraphs and inspects all document tables, joining row cells with ` | ` delimiters to capture rosters, budgets, and delegation grids.
- **Telemetry**: Calculates `character_count` and `word_count` on clean, stripped text.

### 4.3 Document Service
Implemented in `backend/app/services/document_service.py`:
- **Validation**: Rejects files not in `{.pdf, .docx, .txt}`, files of 0 bytes, or files exceeding 25MB (`HTTP 413 Content Too Large`).
- **Filename Sanitization**: Cleans paths via `re.sub(r"[^\w\s\.-]", "_", Path(filename).name)`.
- **Integrity**: Calculates `hashlib.sha256(file_bytes).hexdigest()`.
- **Fault-Tolerant Status**: If a file is malformed (e.g., corrupted PDF), the document is still safely persisted and registered in the database with `extraction_status = "failed"` and the exact error recorded in `extraction_error`.

---

## 5. API Endpoints Specification

Implemented in `backend/app/api/documents.py` and registered via `backend/app/api/endpoints.py`:

| Method | Endpoint | Description | Response Model / Status |
|---|---|---|---|
| `POST` | `/api/v1/documents` | Ingests, validates, hashes, persists, and extracts text. (Alias `/upload` supported). | `DocumentUploadResponse` (`201 Created`) |
| `GET` | `/api/v1/documents` | Lists document records with `offset`, `limit`, `status`, and `extension` filters. | `DocumentListResponse` (`200 OK`) |
| `GET` | `/api/v1/documents/{id}` | Retrieves document metadata and full extracted text. | `DocumentDetailResponse` (`200 OK` / `404`) |
| `GET` | `/api/v1/documents/{id}/text` | Returns extracted text, character count, and word count. | `DocumentTextResponse` (`200 OK` / `404`) |
| `GET` | `/api/v1/documents/{id}/download` | Streams the original uploaded file from storage. | `FileResponse` (`200 OK` / `404`) |
| `DELETE` | `/api/v1/documents/{id}` | Removes DB record and deletes physical file from storage. | `204 No Content` / `404` |

---

## 6. Verification & Automated Test Suite

### 6.1 Pytest Suite Results
Executed inside the Docker container:
```bash
docker compose exec backend pytest -v
```
**Result: 19 passed, 0 failed in 1.88s.**

```text
tests/test_api.py::test_read_root PASSED                                 [  5%]
tests/test_api.py::test_read_health PASSED                               [ 10%]
tests/test_api.py::test_read_health_unhealthy PASSED                     [ 15%]
tests/test_api.py::test_database_connection PASSED                       [ 21%]
tests/test_api.py::test_sqlite_foreign_keys_enforced PASSED              [ 26%]
tests/test_api.py::test_dev_database_isolation PASSED                    [ 31%]
tests/test_api.py::test_dev_engine_pragmas PASSED                        [ 36%]
tests/test_documents.py::test_upload_txt_document PASSED                 [ 42%]
tests/test_documents.py::test_upload_docx_document PASSED                [ 47%]
tests/test_documents.py::test_upload_pdf_document PASSED                 [ 52%]
tests/test_documents.py::test_upload_unsupported_extension PASSED        [ 57%]
tests/test_documents.py::test_upload_empty_file PASSED                   [ 63%]
tests/test_documents.py::test_upload_oversized_file PASSED               [ 68%]
tests/test_documents.py::test_upload_corrupted_pdf_handles_gracefully PASSED [ 73%]
tests/test_documents.py::test_get_document_metadata_and_not_found PASSED [ 78%]
tests/test_documents.py::test_get_document_text PASSED                   [ 84%]
tests/test_documents.py::test_list_documents_pagination_and_filtering PASSED [ 89%]
tests/test_documents.py::test_download_document PASSED                   [ 94%]
tests/test_documents.py::test_delete_document PASSED                     [100%]
```

### 6.2 Docker Container Restart & Persistence Verification
To verify requirement 8 (*survive container recreation/restarts*), a live transaction test was executed:
1. **Upload Document**: Deposited `test_handover.txt` via `POST http://localhost:8000/api/v1/documents`. Received UUID `aad790dd-2d1f-4546-9d58-bc2155497412` (`status: completed`).
2. **Container Restart**: Restarted the container with `docker compose restart backend`.
3. **Post-Restart Query**: Queried `GET /api/v1/documents/aad790dd-.../text`. Extracted text, character count (108), and physical file content were returned intact.
4. **Cleanup**: Executed `DELETE /api/v1/documents/aad790dd-...` returning HTTP `204 No Content` and verifying physical file removal.

### 6.3 Frontend Integration Readiness
Updated `frontend/src/lib/api.ts` with typed client methods (`uploadDocumentFile`, `fetchDocuments`, `fetchDocumentById`, `fetchDocumentText`, `deleteDocumentRecord`). Ran `npm run lint` and `npm run build`: all 17 static routes compiled with 0 errors.

---

## 7. Files Created and Modified

| File | Action | Description |
|---|---|---|
| `backend/requirements.txt` | Modified | Added `python-multipart`, `pypdf`, `python-docx`. |
| `backend/app/core/config.py` | Modified | Added upload directory, extension, and file size settings. |
| `backend/app/models/document.py` | Created | SQLAlchemy 2.0 `Document` model with metadata and extracted text. |
| `backend/app/schemas/document.py` | Created | Pydantic response models for upload, detail, list, and text. |
| `backend/app/services/extractor.py` | Created | Plain text, PDF, and DOCX text and table extraction engine. |
| `backend/app/services/document_service.py` | Created | File validation, persistence, SHA-256 hashing, and DB operations. |
| `backend/app/api/documents.py` | Created | Ingestion, list, detail, text, download, and delete endpoints. |
| `backend/alembic.ini` & `backend/alembic/` | Created | Configured Alembic with `c24d6592cc4a_create_documents_table.py`. |
| `backend/tests/test_documents.py` | Created | 12 tests covering formats, validations, corruption, and retrieval. |
| `backend/tests/conftest.py` | Modified | Configured isolated temporary upload directory fixture. |
| `frontend/src/lib/api.ts` | Modified | Added typed client functions for document ingestion endpoints. |
| `.gitignore` | Modified | Added upload directories to ignore local data while preserving `.gitkeep`. |

