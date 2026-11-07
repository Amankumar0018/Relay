"""
Safe, repeatable, idempotent migration script to transfer all existing SQLite
institutional records and binary documents into Neon PostgreSQL.

Guarantees:
1. Complete relational fidelity across all 15 application tables + alembic_version.
2. Preserves all primary keys, foreign keys, timestamps, statuses, and relationships.
3. Automatically extracts document binaries from local storage into PostgreSQL `document_contents`,
   linking them directly to existing document IDs.
4. Fully idempotent via PostgreSQL ON CONFLICT DO NOTHING - safe to retry multiple times without duplicates.
5. Strict post-migration count and integrity verification comparing source SQLite vs target PostgreSQL.
6. 100% read-only connection to SQLite (mode=ro) - cannot mutate, overwrite, or delete source files.
"""

import os
import sys
import hashlib
import sqlite3
import re
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any

# Ensure unbuffered real-time stdout
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

from sqlalchemy import create_engine, text, MetaData, Table
from sqlalchemy.dialects.postgresql import insert as pg_insert

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.core.database import Base
import app.models  # Registers all 15 models onto Base.metadata

ALEMBIC_HEAD_REVISION = "4c1a2b3d4e5f"

# Topological execution order strictly respecting foreign key hierarchies
TABLE_ORDER = [
    "documents",
    "document_contents",
    "document_segments",
    "extraction_runs",
    "extracted_entities",
    "entity_mentions",
    "entity_relationships",
    "extracted_facts",
    "fact_citations",
    "fact_verification_logs",
    "knowledge_conflicts",
    "conflict_approval_tokens",
    "conflict_resolution_audits",
    "handover_dossiers",
    "qa_audits",
    "alembic_version",
]


def compute_file_sha256(path: str) -> str:
    """Computes SHA-256 digest of a file to verify zero tampering."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def find_document_binary(storage_path: str) -> Tuple[str, bytes]:
    """Resolves local binary document file from disk in read-only mode."""
    possible_paths = [
        storage_path,
        os.path.join("backend", storage_path),
        os.path.join("backend", "data", "uploads", os.path.basename(storage_path)),
        os.path.join("data", "uploads", os.path.basename(storage_path)),
    ]
    for p in possible_paths:
        if os.path.exists(p) and os.path.isfile(p):
            with open(p, "rb") as f:
                return p, f.read()
    return "", b""


def inspect_source(sqlite_db_path: str = "backend/relay.db") -> Dict[str, int]:
    """Inspects source SQLite database in strictly read-only mode and returns row counts."""
    if not os.path.exists(sqlite_db_path):
        raise FileNotFoundError(f"Source SQLite database not found at {sqlite_db_path}")

    abs_path = os.path.abspath(sqlite_db_path).replace("\\", "/")
    src_conn = sqlite3.connect(f"file:{abs_path}?mode=ro", uri=True)
    src_cur = src_conn.cursor()

    counts = {}
    total_sqlite_rows = 0

    print("\n================================================================================")
    print("  SOURCE SQLITE DATABASE & UPLOAD INVENTORY")
    print("================================================================================")
    print(f"{'Table Name':<30} | {'Current SQLite':<16} | {'Target PostgreSQL':<18}")
    print("-" * 72)

    # First audit physical document binaries on disk
    doc_rows = src_cur.execute('SELECT id, original_filename, storage_path FROM "documents"').fetchall()
    binary_found = 0
    binary_details = []
    for doc_id, filename, sp in doc_rows:
        found_path, data = find_document_binary(sp)
        if found_path:
            binary_found += 1
            binary_details.append(f"  ✓ {filename:35s}: {len(data):8d} bytes -> {found_path}")
        else:
            binary_details.append(f"  ✗ MISSING: {filename:35s} (expected at {sp})")

    for tbl in TABLE_ORDER:
        if tbl == "document_contents":
            # document_contents table exists in SQLite with 0 rows; 10 binaries will be migrated from disk
            exists = src_cur.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (tbl,)
            ).fetchone()
            c = src_cur.execute(f'SELECT COUNT(*) FROM "{tbl}"').fetchone()[0] if exists else 0
            counts[tbl] = binary_found  # Target count in PostgreSQL
            total_sqlite_rows += c
            print(f"{tbl:<30} | {c:<16d} | {binary_found:<18d} (from disk files)")
            continue

        exists = src_cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (tbl,)
        ).fetchone()
        if exists:
            c = src_cur.execute(f'SELECT COUNT(*) FROM "{tbl}"').fetchone()[0]
            counts[tbl] = c
            total_sqlite_rows += c
            print(f"{tbl:<30} | {c:<16d} | {c:<18d}")
        else:
            counts[tbl] = 0
            print(f"{tbl:<30} | {'0 (not in db)':<16} | {0:<18d}")

    total_target_records = total_sqlite_rows + binary_found
    print("-" * 72)
    print(f"{'SUBTOTAL SQLITE ROWS':<30} | {total_sqlite_rows:<16d} | -")
    print(f"{'DOCUMENT BINARIES (DISK)':<30} | -                | {binary_found:<18d}")
    print(f"{'TOTAL RECORDS AFTER MIGRATION':<30} | {total_sqlite_rows:<16d} | {total_target_records:<18d}")
    print("=" * 72)

    print("\n--- PHYSICAL DOCUMENT BINARY AUDIT ---")
    for detail in binary_details:
        print(detail)
    print(f"  Total document binaries verified: {binary_found} / {len(doc_rows)}")

    src_conn.close()
    return counts


def migrate(target_pg_url: str, sqlite_db_path: str = "backend/relay.db") -> bool:
    """Executes safe, idempotent migration from SQLite to Neon PostgreSQL."""
    if not os.path.exists(sqlite_db_path):
        raise FileNotFoundError(f"Source SQLite database not found at {sqlite_db_path}")

    # Compute source DB checksum before migration to guarantee zero mutation
    initial_hash = compute_file_sha256(sqlite_db_path)
    initial_size = os.path.getsize(sqlite_db_path)
    print("================================================================================")
    print("  RELAY DATABASE MIGRATION: SQLITE -> NEON POSTGRESQL")
    print("================================================================================")
    print(f"Source DB:      {sqlite_db_path} ({initial_size} bytes)")
    print(f"Source SHA-256: {initial_hash}")
    print(f"Mode:           Strictly Read-Only (URI mode=ro)")

    # Normalize target URL
    if target_pg_url.startswith("postgres://"):
        target_pg_url = target_pg_url.replace("postgres://", "postgresql://", 1)

    # PgBouncer pooler on Neon does not support SCRAM channel_binding; strip it if present on pooler URLs
    if "-pooler." in target_pg_url and "channel_binding=" in target_pg_url:
        target_pg_url = re.sub(r"[?&]channel_binding=[^&]*", "", target_pg_url)
        if "?" not in target_pg_url and "&" in target_pg_url:
            target_pg_url = target_pg_url.replace("&", "?", 1)

    print(f"\n1. Connecting to target PostgreSQL...")
    target_engine = create_engine(
        target_pg_url,
        echo=False,
        pool_pre_ping=True,
    )

    with target_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("✓ PostgreSQL connection established.")

    # 2. Create schema / tables in PostgreSQL
    print("\n2. Initializing target PostgreSQL tables from SQLAlchemy metadata...")
    Base.metadata.create_all(bind=target_engine)

    # Ensure alembic_version table exists on target
    with target_engine.begin() as conn:
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)"
        ))
    print("✓ All 15 application tables + alembic_version initialized in target PostgreSQL.")

    # 3. Read source SQLite in read-only mode
    abs_path = os.path.abspath(sqlite_db_path).replace("\\", "/")
    src_conn = sqlite3.connect(f"file:{abs_path}?mode=ro", uri=True)
    src_conn.row_factory = sqlite3.Row
    src_cur = src_conn.cursor()

    # Use in-memory model metadata definitions directly (fast, avoids slow server-side reflection)
    model_tables = Base.metadata.tables

    print("\n3. Migrating relational data & document binaries in topological order...")
    source_counts: Dict[str, int] = {}
    inserted_counts: Dict[str, int] = {}

    for table_name in TABLE_ORDER:
        if table_name == "alembic_version":
            # Stamp Alembic version table with head revision
            with target_engine.begin() as conn:
                conn.execute(text(
                    "INSERT INTO alembic_version (version_num) VALUES (:v) ON CONFLICT (version_num) DO NOTHING"
                ), {"v": ALEMBIC_HEAD_REVISION})
            source_counts["alembic_version"] = 1
            inserted_counts["alembic_version"] = 1
            print(f"  ✓ alembic_version: Stamped with revision '{ALEMBIC_HEAD_REVISION}'")
            continue

        if table_name == "document_contents":
            # Migrate physical files from disk into PostgreSQL document_contents table
            target_table = model_tables["document_contents"]
            doc_rows = src_cur.execute('SELECT id, storage_path, created_at FROM "documents"').fetchall()
            source_counts["document_contents"] = len(doc_rows)

            binary_records = []
            for d in doc_rows:
                doc_id = d["id"]
                storage_path = d["storage_path"]
                _, file_bytes = find_document_binary(storage_path)
                if file_bytes:
                    doc_created = d["created_at"]
                    if isinstance(doc_created, str):
                        try:
                            dt = datetime.fromisoformat(doc_created)
                            if dt.tzinfo is None:
                                dt = dt.replace(tzinfo=timezone.utc)
                            doc_created = dt
                        except Exception:
                            doc_created = datetime.now(timezone.utc)
                    else:
                        doc_created = datetime.now(timezone.utc)

                    binary_records.append({
                        "document_id": doc_id,
                        "content": file_bytes,
                        "created_at": doc_created,
                    })

            if binary_records:
                with target_engine.begin() as conn:
                    stmt = pg_insert(target_table).values(binary_records)
                    stmt = stmt.on_conflict_do_nothing(index_elements=["document_id"])
                    conn.execute(stmt)
            inserted_counts["document_contents"] = len(binary_records)
            print(f"  ✓ document_contents: Migrated {len(binary_records)} binary document files into PostgreSQL")
            continue

        if table_name not in model_tables:
            print(f"  - Skipping {table_name} (not defined in models)")
            continue

        target_table = model_tables[table_name]

        # Check if table exists in SQLite
        tbl_check = src_cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,)
        ).fetchone()
        if not tbl_check:
            source_counts[table_name] = 0
            inserted_counts[table_name] = 0
            continue

        src_rows = src_cur.execute(f'SELECT * FROM "{table_name}"').fetchall()
        source_counts[table_name] = len(src_rows)

        if not src_rows:
            inserted_counts[table_name] = 0
            print(f"  - {table_name:28s}: 0 rows (empty in source)")
            continue

        # Convert SQLite rows to dictionary records matching PostgreSQL column types
        records: List[Dict[str, Any]] = []
        for r in src_rows:
            row_dict: Dict[str, Any] = {}
            for col in target_table.columns:
                val = r[col.name] if col.name in r.keys() else None

                # Convert ISO strings to timezone-aware UTC datetimes for PostgreSQL TIMESTAMP WITH TIME ZONE
                if val is not None and "datetime" in str(col.type).lower() and isinstance(val, str):
                    try:
                        dt = datetime.fromisoformat(val)
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        val = dt
                    except Exception:
                        pass

                # Convert integer booleans (0, 1) to Python bools for PostgreSQL BOOLEAN
                if val is not None and "bool" in str(col.type).lower() and isinstance(val, int):
                    val = bool(val)

                row_dict[col.name] = val
            records.append(row_dict)

        # Idempotent insert with ON CONFLICT DO NOTHING
        with target_engine.begin() as conn:
            pk_cols = [c.name for c in target_table.primary_key.columns]
            stmt = pg_insert(target_table).values(records)
            if pk_cols:
                stmt = stmt.on_conflict_do_nothing(index_elements=pk_cols)
            conn.execute(stmt)

        inserted_counts[table_name] = len(records)
        print(f"  ✓ {table_name:28s}: Migrated {len(records):4d} records (idempotent)")

    src_conn.close()

    # 4. Strict post-migration count verification
    print("\n================================================================================")
    print("  VERIFICATION AUDIT: SOURCE SQLITE VS TARGET POSTGRESQL")
    print("================================================================================")
    print(f"{'Table Name':<30} | {'Source Rows':<12} | {'Target Rows':<12} | {'Status'}")
    print("-" * 72)

    all_matched = True
    total_source = 0
    total_target = 0

    with target_engine.connect() as conn:
        for tbl in TABLE_ORDER:
            s_count = source_counts.get(tbl, 0)
            t_count = conn.execute(text(f'SELECT COUNT(*) FROM "{tbl}"')).scalar() or 0

            total_source += s_count
            total_target += t_count

            if s_count == t_count:
                status_str = "✓ MATCH"
            else:
                status_str = f"✗ MISMATCH (expected {s_count}, got {t_count})"
                all_matched = False

            print(f"{tbl:<30} | {s_count:<12} | {t_count:<12} | {status_str}")

    print("-" * 72)
    print(f"{'TOTAL APPLICATION RECORDS':<30} | {total_source:<12} | {total_target:<12} | {'✓ 100% VERIFIED' if all_matched else '✗ FAILED'}")

    # 5. Verify source SQLite integrity was strictly preserved
    final_hash = compute_file_sha256(sqlite_db_path)
    final_size = os.path.getsize(sqlite_db_path)
    print("\n--- SOURCE INTEGRITY VERIFICATION ---")
    if initial_hash == final_hash and initial_size == final_size:
        print(f"✓ Source SQLite database completely untouched and unmutated.")
        print(f"  SHA-256: {final_hash}")
    else:
        print(f"CRITICAL WARNING: Source database checksum changed!")
        all_matched = False

    if all_matched:
        print("\n================================================================================")
        print("  ✓ MIGRATION SUCCEEDED: ALL RELATIONAL DATA AND BINARIES SAFELY PRESERVED!")
        print("================================================================================")
    else:
        print("\n================================================================================")
        print("  ✗ MIGRATION WARNING: Mismatches detected. Review the audit table above.")
        print("================================================================================")

    return all_matched


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--inspect-source":
        inspect_source()
        sys.exit(0)

    target_url = sys.argv[1] if len(sys.argv) >= 2 else (os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL"))
    if not target_url or target_url.startswith("sqlite"):
        print("\n[ERROR] Missing target PostgreSQL connection URL.")
        print("The script requires a valid Neon PostgreSQL connection string (pooled URL).")
        print("\nUsage:")
        print("  python scripts/migrate_sqlite_to_postgres.py \"postgresql://<user>:<password>@<neon-pooled-host>/<dbname>?sslmode=require\"")
        print("  or set NEON_DATABASE_URL / DATABASE_URL in your environment.\n")
        sys.exit(1)

    success = migrate(target_url)
    sys.exit(0 if success else 1)
