"""add_check_constraint_to_fact_citations

Revision ID: 8eb0985c74e5
Revises: 7dafb2d9743d
Create Date: 2026-11-05 07:24:06.196553

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8eb0985c74e5'
down_revision: Union[str, Sequence[str], None] = '7dafb2d9743d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add offset check constraint to fact_citations table."""
    with op.batch_alter_table('fact_citations', schema=None) as batch_op:
        batch_op.create_check_constraint(
            'ck_fact_citations_offsets',
            '(char_start IS NULL AND char_end IS NULL) OR '
            '(char_start IS NOT NULL AND char_end IS NOT NULL AND char_start >= 0 AND char_end > char_start)'
        )


def downgrade() -> None:
    """Remove offset check constraint from fact_citations table."""
    with op.batch_alter_table('fact_citations', schema=None) as batch_op:
        batch_op.drop_constraint('ck_fact_citations_offsets', type_='check')
