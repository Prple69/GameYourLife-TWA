"""add friendships table

Revision ID: 49ecd4b23ffe
Revises: c203bdcc4819
Create Date: 2026-04-27 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '49ecd4b23ffe'
down_revision = 'c203bdcc4819'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'friendships',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('requester_id', sa.Integer(), nullable=False),
        sa.Column('addressee_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'accepted', name='friendshipstatus'), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['addressee_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('requester_id', 'addressee_id', name='uq_friendship'),
    )
    op.create_index('ix_friendships_id', 'friendships', ['id'], unique=False)
    op.create_index('ix_friendships_requester_id', 'friendships', ['requester_id'], unique=False)
    op.create_index('ix_friendships_addressee_id', 'friendships', ['addressee_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_friendships_addressee_id', table_name='friendships')
    op.drop_index('ix_friendships_requester_id', table_name='friendships')
    op.drop_index('ix_friendships_id', table_name='friendships')
    op.drop_table('friendships')
    op.execute("DROP TYPE IF EXISTS friendshipstatus")
