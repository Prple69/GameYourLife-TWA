"""add guilds, guild_members, guild_challenges tables

Revision ID: 3e157d3ff620
Revises: 49ecd4b23ffe
Create Date: 2026-04-27 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '3e157d3ff620'
down_revision = '49ecd4b23ffe'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'guilds',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_guilds_id', 'guilds', ['id'], unique=False)
    op.create_index('ix_guilds_slug', 'guilds', ['slug'], unique=True)
    op.create_index('ix_guilds_owner_id', 'guilds', ['owner_id'], unique=False)

    op.create_table(
        'guild_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('guild_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.Enum('owner', 'officer', 'member', name='guildrole'), nullable=False, server_default='member'),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['guild_id'], ['guilds.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('guild_id', 'user_id', name='uq_guild_user'),
    )
    op.create_index('ix_guild_members_id', 'guild_members', ['id'], unique=False)
    op.create_index('ix_guild_members_guild_id', 'guild_members', ['guild_id'], unique=False)
    op.create_index('ix_guild_members_user_id', 'guild_members', ['user_id'], unique=False)

    op.create_table(
        'guild_challenges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('guild_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('target_xp', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['guild_id'], ['guilds.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_guild_challenges_id', 'guild_challenges', ['id'], unique=False)
    op.create_index('ix_guild_challenges_guild_id', 'guild_challenges', ['guild_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_guild_challenges_guild_id', table_name='guild_challenges')
    op.drop_index('ix_guild_challenges_id', table_name='guild_challenges')
    op.drop_table('guild_challenges')

    op.drop_index('ix_guild_members_user_id', table_name='guild_members')
    op.drop_index('ix_guild_members_guild_id', table_name='guild_members')
    op.drop_index('ix_guild_members_id', table_name='guild_members')
    op.drop_table('guild_members')
    op.execute("DROP TYPE IF EXISTS guildrole")

    op.drop_index('ix_guilds_owner_id', table_name='guilds')
    op.drop_index('ix_guilds_slug', table_name='guilds')
    op.drop_index('ix_guilds_id', table_name='guilds')
    op.drop_table('guilds')
