"""add price_gems column to shop_items

Revision ID: 7f3f7a1cafc5
Revises: 3e157d3ff620
Create Date: 2026-04-27 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '7f3f7a1cafc5'
down_revision = '3e157d3ff620'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add nullable price_gems column to shop_items
    op.add_column('shop_items',
        sa.Column('price_gems', sa.Integer(), nullable=True)
    )

    # 2. Seed one gem-priced item (idempotent via ON CONFLICT DO NOTHING)
    # Uses migration data-step pattern from Phase 5 (c203bdcc4819)
    conn = op.get_bind()
    conn.execute(sa.text(
        "INSERT INTO shop_items "
        "(item_type, name, description, icon, price_gold, price_gems, is_active) "
        "VALUES ('potion_heal', 'Зелье здоровья (Gems)', 'Восстановить 50 HP за gems', '🧪', 0, 500, TRUE) "
        "ON CONFLICT (name) DO NOTHING"
    ))


def downgrade() -> None:
    op.drop_column('shop_items', 'price_gems')
