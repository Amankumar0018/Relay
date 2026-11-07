"""create document contents table for persistent storage

Revision ID: 4c1a2b3d4e5f
Revises: 3b9f8d7e6c5a
Create Date: 2026-11-07 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4c1a2b3d4e5f'
down_revision = '3b9f8d7e6c5a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'document_contents',
        sa.Column('document_id', sa.String(length=36), sa.ForeignKey('documents.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('content', sa.LargeBinary(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('document_contents')

