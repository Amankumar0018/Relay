"""create continuity and intelligence models

Revision ID: 3b9f8d7e6c5a
Revises: 2a8f9c1d0e4b
Create Date: 2026-11-05 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3b9f8d7e6c5a'
down_revision = '2a8f9c1d0e4b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create knowledge_conflicts table
    op.create_table(
        'knowledge_conflicts',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('conflict_type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False, server_default='medium'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='open'),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('fact_a_id', sa.String(length=36), sa.ForeignKey('extracted_facts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('fact_b_id', sa.String(length=36), sa.ForeignKey('extracted_facts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('entity_id', sa.String(length=36), sa.ForeignKey('extracted_entities.id', ondelete='SET NULL'), nullable=True),
        sa.Column('document_id', sa.String(length=36), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "conflict_type IN ('contradiction', 'superseded_decision', 'outdated_deadline', 'changed_responsibility', 'unresolved_commitment', 'ownership_gap', 'knowledge_gap')",
            name='ck_conflicts_type',
        ),
        sa.CheckConstraint(
            "severity IN ('low', 'medium', 'high', 'critical')",
            name='ck_conflicts_severity',
        ),
        sa.CheckConstraint(
            "status IN ('open', 'resolved', 'dismissed')",
            name='ck_conflicts_status',
        ),
    )
    op.create_index('ix_knowledge_conflicts_id', 'knowledge_conflicts', ['id'])
    op.create_index('ix_knowledge_conflicts_conflict_type', 'knowledge_conflicts', ['conflict_type'])
    op.create_index('ix_knowledge_conflicts_severity', 'knowledge_conflicts', ['severity'])
    op.create_index('ix_knowledge_conflicts_status', 'knowledge_conflicts', ['status'])
    op.create_index('ix_knowledge_conflicts_fact_a_id', 'knowledge_conflicts', ['fact_a_id'])
    op.create_index('ix_knowledge_conflicts_fact_b_id', 'knowledge_conflicts', ['fact_b_id'])
    op.create_index('ix_knowledge_conflicts_entity_id', 'knowledge_conflicts', ['entity_id'])
    op.create_index('ix_knowledge_conflicts_document_id', 'knowledge_conflicts', ['document_id'])
    op.create_index('ix_knowledge_conflicts_created_at', 'knowledge_conflicts', ['created_at'])
    op.create_index('ix_conflicts_type_status', 'knowledge_conflicts', ['conflict_type', 'status'])
    op.create_index('ix_conflicts_severity_status', 'knowledge_conflicts', ['severity', 'status'])

    # 2. Create handover_dossiers table
    op.create_table(
        'handover_dossiers',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('target_role', sa.String(length=255), nullable=True),
        sa.Column('outgoing_leader_id', sa.String(length=36), sa.ForeignKey('extracted_entities.id', ondelete='SET NULL'), nullable=True),
        sa.Column('incoming_leader_id', sa.String(length=36), sa.ForeignKey('extracted_entities.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('content_json', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "status IN ('draft', 'generated', 'finalized')",
            name='ck_dossiers_status',
        ),
        sa.CheckConstraint(
            "version >= 1",
            name='ck_dossiers_version',
        ),
    )
    op.create_index('ix_handover_dossiers_id', 'handover_dossiers', ['id'])
    op.create_index('ix_handover_dossiers_target_role', 'handover_dossiers', ['target_role'])
    op.create_index('ix_handover_dossiers_status', 'handover_dossiers', ['status'])
    op.create_index('ix_handover_dossiers_outgoing_leader_id', 'handover_dossiers', ['outgoing_leader_id'])
    op.create_index('ix_handover_dossiers_incoming_leader_id', 'handover_dossiers', ['incoming_leader_id'])
    op.create_index('ix_handover_dossiers_created_at', 'handover_dossiers', ['created_at'])

    # 3. Create qa_audits table
    op.create_table(
        'qa_audits',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('evidence_context_json', sa.Text(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('has_sufficient_evidence', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_qa_audits_id', 'qa_audits', ['id'])
    op.create_index('ix_qa_audits_created_at', 'qa_audits', ['created_at'])


def downgrade() -> None:
    op.drop_table('qa_audits')
    op.drop_table('handover_dossiers')
    op.drop_table('knowledge_conflicts')

