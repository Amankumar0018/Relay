"""create_extraction_runs_table

Revision ID: 1e749e6b00fe
Revises: 8eb0985c74e5
Create Date: 2026-11-05 08:10:43.291159

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e749e6b00fe'
down_revision: Union[str, Sequence[str], None] = '8eb0985c74e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create extraction_runs table and associated indexes and constraints."""
    op.create_table(
        'extraction_runs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('document_id', sa.String(length=36), nullable=False),
        sa.Column('provider_name', sa.String(length=50), nullable=False),
        sa.Column('model_name', sa.String(length=100), nullable=False),
        sa.Column('prompt_version', sa.String(length=50), nullable=False),
        sa.Column('prompt_hash', sa.String(length=64), nullable=False, comment='SHA-256 of template + system instruction'),
        sa.Column('status', sa.String(length=30), nullable=False, comment='running, completed, failed'),
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('execution_duration_ms', sa.Integer(), nullable=True),
        sa.Column('prompt_tokens', sa.Integer(), nullable=True),
        sa.Column('completion_tokens', sa.Integer(), nullable=True),
        sa.Column('facts_extracted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('entities_extracted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('relationships_extracted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('citations_verified', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('citations_rejected', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_stage', sa.String(length=50), nullable=True, comment='prompt_prep, llm_generation, json_parse, grounding_validation, persistence'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.CheckConstraint("status IN ('running', 'completed', 'failed')", name='ck_extraction_runs_status'),
        sa.CheckConstraint("retry_count >= 0", name='ck_extraction_runs_retry_count'),
        sa.CheckConstraint(
            "(execution_duration_ms IS NULL OR execution_duration_ms >= 0) AND "
            "(prompt_tokens IS NULL OR prompt_tokens >= 0) AND "
            "(completion_tokens IS NULL OR completion_tokens >= 0)",
            name='ck_extraction_runs_execution_metrics'
        ),
        sa.CheckConstraint(
            "facts_extracted >= 0 AND "
            "entities_extracted >= 0 AND "
            "relationships_extracted >= 0 AND "
            "citations_verified >= 0 AND "
            "citations_rejected >= 0",
            name='ck_extraction_runs_counts'
        ),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_extraction_runs_document_id'), 'extraction_runs', ['document_id'], unique=False)
    op.create_index(op.f('ix_extraction_runs_status'), 'extraction_runs', ['status'], unique=False)
    op.create_index('ix_extraction_runs_doc_status', 'extraction_runs', ['document_id', 'status'], unique=False)
    op.create_index('ix_extraction_runs_doc_created', 'extraction_runs', ['document_id', 'created_at'], unique=False)


def downgrade() -> None:
    """Drop extraction_runs table and associated indexes."""
    op.drop_index('ix_extraction_runs_doc_created', table_name='extraction_runs')
    op.drop_index('ix_extraction_runs_doc_status', table_name='extraction_runs')
    op.drop_index(op.f('ix_extraction_runs_status'), table_name='extraction_runs')
    op.drop_index(op.f('ix_extraction_runs_document_id'), table_name='extraction_runs')
    op.drop_table('extraction_runs')
