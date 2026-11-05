"""add citation status and run concurrency

Revision ID: 2a8f9c1d0e4b
Revises: 1e749e6b00fe
Create Date: 2026-11-05 15:25:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2a8f9c1d0e4b'
down_revision = '1e749e6b00fe'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add verification_status and rejection_reason to fact_citations
    with op.batch_alter_table('fact_citations', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'verification_status',
                sa.String(length=30),
                nullable=False,
                server_default='valid',
                comment='valid, rejected',
            )
        )
        batch_op.add_column(
            sa.Column(
                'rejection_reason',
                sa.Text(),
                nullable=True,
                comment='Explicit reason if citation was rejected during grounding',
            )
        )
        batch_op.create_index(
            'ix_fact_citations_verification_status',
            ['verification_status'],
            unique=False,
        )
        batch_op.create_check_constraint(
            'ck_fact_citations_verification_status',
            "verification_status IN ('valid', 'rejected')",
        )

    # 2. Add partial unique index on extraction_runs (document_id) WHERE status = 'running'
    # Prevents simultaneous active extractions on the same document at the database engine level
    op.create_index(
        'uq_extraction_runs_running_doc',
        'extraction_runs',
        ['document_id'],
        unique=True,
        sqlite_where=sa.text("status = 'running'"),
        postgresql_where=sa.text("status = 'running'"),
    )


def downgrade() -> None:
    # 1. Drop partial unique index on extraction_runs
    op.drop_index(
        'uq_extraction_runs_running_doc',
        table_name='extraction_runs',
        sqlite_where=sa.text("status = 'running'"),
        postgresql_where=sa.text("status = 'running'"),
    )

    # 2. Drop columns and constraints from fact_citations
    with op.batch_alter_table('fact_citations', schema=None) as batch_op:
        batch_op.drop_constraint('ck_fact_citations_verification_status', type_='check')
        batch_op.drop_index('ix_fact_citations_verification_status')
        batch_op.drop_column('rejection_reason')
        batch_op.drop_column('verification_status')
