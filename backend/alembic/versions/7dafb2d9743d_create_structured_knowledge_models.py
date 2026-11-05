"""create structured knowledge models

Revision ID: 7dafb2d9743d
Revises: c24d6592cc4a
Create Date: 2026-11-05 07:09:07.999233

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7dafb2d9743d'
down_revision: Union[str, Sequence[str], None] = 'c24d6592cc4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to include structured knowledge models."""
    # 1. document_segments
    op.create_table(
        'document_segments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('document_id', sa.String(length=36), nullable=False),
        sa.Column('segment_type', sa.String(length=50), nullable=False),
        sa.Column('sequence_number', sa.Integer(), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=True),
        sa.Column('section_title', sa.String(length=255), nullable=True),
        sa.Column('source_label', sa.String(length=100), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('char_offset_start', sa.Integer(), nullable=False),
        sa.Column('char_offset_end', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_id', 'sequence_number', name='uq_document_segments_doc_seq')
    )
    op.create_index(op.f('ix_document_segments_id'), 'document_segments', ['id'], unique=False)
    op.create_index(op.f('ix_document_segments_document_id'), 'document_segments', ['document_id'], unique=False)
    op.create_index(op.f('ix_document_segments_segment_type'), 'document_segments', ['segment_type'], unique=False)
    op.create_index('ix_document_segments_doc_type', 'document_segments', ['document_id', 'segment_type'], unique=False)

    # 2. extracted_entities
    op.create_table(
        'extracted_entities',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('canonical_name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_extracted_entities_id'), 'extracted_entities', ['id'], unique=False)
    op.create_index(op.f('ix_extracted_entities_name'), 'extracted_entities', ['name'], unique=False)
    op.create_index(op.f('ix_extracted_entities_canonical_name'), 'extracted_entities', ['canonical_name'], unique=False)
    op.create_index(op.f('ix_extracted_entities_category'), 'extracted_entities', ['category'], unique=False)
    op.create_index('ix_extracted_entities_category_canonical', 'extracted_entities', ['category', 'canonical_name'], unique=False)

    # 3. entity_mentions
    op.create_table(
        'entity_mentions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('entity_id', sa.String(length=36), nullable=False),
        sa.Column('document_id', sa.String(length=36), nullable=False),
        sa.Column('segment_id', sa.String(length=36), nullable=True),
        sa.Column('surface_text', sa.String(length=255), nullable=False),
        sa.Column('char_offset_start', sa.Integer(), nullable=False),
        sa.Column('char_offset_end', sa.Integer(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('resolution_status', sa.String(length=30), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['entity_id'], ['extracted_entities.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['segment_id'], ['document_segments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_entity_mentions_id'), 'entity_mentions', ['id'], unique=False)
    op.create_index(op.f('ix_entity_mentions_document_id'), 'entity_mentions', ['document_id'], unique=False)
    op.create_index(op.f('ix_entity_mentions_entity_id'), 'entity_mentions', ['entity_id'], unique=False)
    op.create_index(op.f('ix_entity_mentions_segment_id'), 'entity_mentions', ['segment_id'], unique=False)
    op.create_index(op.f('ix_entity_mentions_resolution_status'), 'entity_mentions', ['resolution_status'], unique=False)

    # 4. extracted_facts
    op.create_table(
        'extracted_facts',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('document_id', sa.String(length=36), nullable=False),
        sa.Column('primary_entity_id', sa.String(length=36), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('statement', sa.Text(), nullable=False),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('severity', sa.String(length=20), nullable=True),
        sa.Column('verification_status', sa.String(length=30), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('reviewer_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['primary_entity_id'], ['extracted_entities.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_extracted_facts_id'), 'extracted_facts', ['id'], unique=False)
    op.create_index(op.f('ix_extracted_facts_document_id'), 'extracted_facts', ['document_id'], unique=False)
    op.create_index(op.f('ix_extracted_facts_primary_entity_id'), 'extracted_facts', ['primary_entity_id'], unique=False)
    op.create_index(op.f('ix_extracted_facts_category'), 'extracted_facts', ['category'], unique=False)
    op.create_index(op.f('ix_extracted_facts_severity'), 'extracted_facts', ['severity'], unique=False)
    op.create_index(op.f('ix_extracted_facts_verification_status'), 'extracted_facts', ['verification_status'], unique=False)

    # 5. fact_citations
    op.create_table(
        'fact_citations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('fact_id', sa.String(length=36), nullable=False),
        sa.Column('document_segment_id', sa.String(length=36), nullable=True),
        sa.Column('verbatim_quote', sa.Text(), nullable=False),
        sa.Column('source_location', sa.String(length=255), nullable=True),
        sa.Column('char_start', sa.Integer(), nullable=True),
        sa.Column('char_end', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['document_segment_id'], ['document_segments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['fact_id'], ['extracted_facts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fact_citations_id'), 'fact_citations', ['id'], unique=False)
    op.create_index(op.f('ix_fact_citations_fact_id'), 'fact_citations', ['fact_id'], unique=False)
    op.create_index(op.f('ix_fact_citations_document_segment_id'), 'fact_citations', ['document_segment_id'], unique=False)

    # 6. entity_relationships
    op.create_table(
        'entity_relationships',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('document_id', sa.String(length=36), nullable=True),
        sa.Column('source_entity_id', sa.String(length=36), nullable=False),
        sa.Column('target_entity_id', sa.String(length=36), nullable=False),
        sa.Column('relation_type', sa.String(length=50), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_entity_id'], ['extracted_entities.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_entity_id'], ['extracted_entities.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_entity_relationships_id'), 'entity_relationships', ['id'], unique=False)
    op.create_index(op.f('ix_entity_relationships_document_id'), 'entity_relationships', ['document_id'], unique=False)
    op.create_index(op.f('ix_entity_relationships_source_entity_id'), 'entity_relationships', ['source_entity_id'], unique=False)
    op.create_index(op.f('ix_entity_relationships_target_entity_id'), 'entity_relationships', ['target_entity_id'], unique=False)
    op.create_index(op.f('ix_entity_relationships_relation_type'), 'entity_relationships', ['relation_type'], unique=False)
    op.create_index('ix_entity_relationships_source_target', 'entity_relationships', ['source_entity_id', 'target_entity_id'], unique=False)

    # 7. fact_verification_logs
    op.create_table(
        'fact_verification_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('fact_id', sa.String(length=36), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('previous_status', sa.String(length=30), nullable=False),
        sa.Column('new_status', sa.String(length=30), nullable=False),
        sa.Column('reviewer_id', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['fact_id'], ['extracted_facts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fact_verification_logs_id'), 'fact_verification_logs', ['id'], unique=False)
    op.create_index(op.f('ix_fact_verification_logs_fact_id'), 'fact_verification_logs', ['fact_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema to remove structured knowledge models."""
    op.drop_index(op.f('ix_fact_verification_logs_fact_id'), table_name='fact_verification_logs')
    op.drop_index(op.f('ix_fact_verification_logs_id'), table_name='fact_verification_logs')
    op.drop_table('fact_verification_logs')

    op.drop_index('ix_entity_relationships_source_target', table_name='entity_relationships')
    op.drop_index(op.f('ix_entity_relationships_relation_type'), table_name='entity_relationships')
    op.drop_index(op.f('ix_entity_relationships_target_entity_id'), table_name='entity_relationships')
    op.drop_index(op.f('ix_entity_relationships_source_entity_id'), table_name='entity_relationships')
    op.drop_index(op.f('ix_entity_relationships_document_id'), table_name='entity_relationships')
    op.drop_index(op.f('ix_entity_relationships_id'), table_name='entity_relationships')
    op.drop_table('entity_relationships')

    op.drop_index(op.f('ix_fact_citations_document_segment_id'), table_name='fact_citations')
    op.drop_index(op.f('ix_fact_citations_fact_id'), table_name='fact_citations')
    op.drop_index(op.f('ix_fact_citations_id'), table_name='fact_citations')
    op.drop_table('fact_citations')

    op.drop_index(op.f('ix_extracted_facts_verification_status'), table_name='extracted_facts')
    op.drop_index(op.f('ix_extracted_facts_severity'), table_name='extracted_facts')
    op.drop_index(op.f('ix_extracted_facts_category'), table_name='extracted_facts')
    op.drop_index(op.f('ix_extracted_facts_primary_entity_id'), table_name='extracted_facts')
    op.drop_index(op.f('ix_extracted_facts_document_id'), table_name='extracted_facts')
    op.drop_index(op.f('ix_extracted_facts_id'), table_name='extracted_facts')
    op.drop_table('extracted_facts')

    op.drop_index(op.f('ix_entity_mentions_resolution_status'), table_name='entity_mentions')
    op.drop_index(op.f('ix_entity_mentions_segment_id'), table_name='entity_mentions')
    op.drop_index(op.f('ix_entity_mentions_entity_id'), table_name='entity_mentions')
    op.drop_index(op.f('ix_entity_mentions_document_id'), table_name='entity_mentions')
    op.drop_index(op.f('ix_entity_mentions_id'), table_name='entity_mentions')
    op.drop_table('entity_mentions')

    op.drop_index('ix_extracted_entities_category_canonical', table_name='extracted_entities')
    op.drop_index(op.f('ix_extracted_entities_category'), table_name='extracted_entities')
    op.drop_index(op.f('ix_extracted_entities_canonical_name'), table_name='extracted_entities')
    op.drop_index(op.f('ix_extracted_entities_name'), table_name='extracted_entities')
    op.drop_index(op.f('ix_extracted_entities_id'), table_name='extracted_entities')
    op.drop_table('extracted_entities')

    op.drop_index('ix_document_segments_doc_type', table_name='document_segments')
    op.drop_index(op.f('ix_document_segments_segment_type'), table_name='document_segments')
    op.drop_index(op.f('ix_document_segments_document_id'), table_name='document_segments')
    op.drop_index(op.f('ix_document_segments_id'), table_name='document_segments')
    op.drop_table('document_segments')
