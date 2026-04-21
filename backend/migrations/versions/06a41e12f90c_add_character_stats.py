"""add_character_stats

Revision ID: 06a41e12f90c
Revises: b74c083b2140
Create Date: 2026-04-21 00:14:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '06a41e12f90c'
down_revision: Union[str, None] = 'b74c083b2140'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


STATS = ("strength", "wisdom", "endurance", "charisma")


def upgrade() -> None:
    for stat in STATS:
        op.add_column('users', sa.Column(f'stat_{stat}_level', sa.Integer(),
                                         server_default='1', nullable=False))
        op.add_column('users', sa.Column(f'stat_{stat}_xp', sa.Integer(),
                                         server_default='0', nullable=False))
    op.add_column('quests', sa.Column('category', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('quests', 'category')
    for stat in reversed(STATS):
        op.drop_column('users', f'stat_{stat}_xp')
        op.drop_column('users', f'stat_{stat}_level')
