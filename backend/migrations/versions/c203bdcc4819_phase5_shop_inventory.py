"""phase5_shop_inventory

Revision ID: c203bdcc4819
Revises: 06a41e12f90c
Create Date: 2026-04-21 04:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c203bdcc4819'
down_revision: Union[str, None] = '06a41e12f90c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create shop_items table
    op.create_table("shop_items",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("item_type", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("icon", sa.String(), nullable=True),
        sa.Column("price_gold", sa.Integer(), nullable=False),
        sa.Column("effect_multiplier", sa.Float(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("heal_amount", sa.Integer(), nullable=True),
        sa.Column("hp_max_bonus", sa.Integer(), nullable=True),
        sa.Column("avatar_key", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )

    # 2. Create inventory_items table
    op.create_table("inventory_items",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("shop_item_id", sa.Integer(), sa.ForeignKey("shop_items.id"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "shop_item_id", name="uq_user_shop_item"),
    )

    # 3. Create idempotency_keys table
    op.create_table("idempotency_keys",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("response_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "key", name="uq_user_idem_key"),
    )

    # 4. Add 14 active-boost columns to users table
    for col_name, col_type in [
        ("active_xp_mult", sa.Float()),
        ("active_xp_expires_at", sa.DateTime(timezone=True)),
        ("active_gold_mult", sa.Float()),
        ("active_gold_expires_at", sa.DateTime(timezone=True)),
        ("active_strength_xp_mult", sa.Float()),
        ("active_strength_xp_expires_at", sa.DateTime(timezone=True)),
        ("active_wisdom_xp_mult", sa.Float()),
        ("active_wisdom_xp_expires_at", sa.DateTime(timezone=True)),
        ("active_endurance_xp_mult", sa.Float()),
        ("active_endurance_xp_expires_at", sa.DateTime(timezone=True)),
        ("active_charisma_xp_mult", sa.Float()),
        ("active_charisma_xp_expires_at", sa.DateTime(timezone=True)),
        ("active_hp_max_bonus", sa.Integer()),
        ("active_hp_max_expires_at", sa.DateTime(timezone=True)),
    ]:
        op.add_column("users", sa.Column(col_name, col_type, nullable=True))

    # 5. Seed shop items (idempotent: ON CONFLICT DO NOTHING via unique name)
    conn = op.get_bind()
    seed_items = [
        # (item_type, name, description, icon, price_gold, effect_multiplier, duration_seconds, heal_amount, hp_max_bonus, avatar_key)
        # XP Boosters
        ("booster_xp", "Малый эликсир опыта", "XP ×1.25 на 15 мин", "⚡", 100, 1.25, 900, None, None, None),
        ("booster_xp", "Обычный эликсир опыта", "XP ×1.5 на 30 мин", "⚡", 300, 1.5, 1800, None, None, None),
        ("booster_xp", "Великий эликсир опыта", "XP ×2.0 на 1 час", "⚡", 800, 2.0, 3600, None, None, None),
        # Gold Boosters
        ("booster_gold", "Малая монета удачи", "Gold ×1.25 на 15 мин", "🪙", 100, 1.25, 900, None, None, None),
        ("booster_gold", "Монета удачи", "Gold ×1.5 на 30 мин", "🪙", 300, 1.5, 1800, None, None, None),
        ("booster_gold", "Великая монета удачи", "Gold ×2.0 на 1 час", "🪙", 800, 2.0, 3600, None, None, None),
        # Stat XP Boosters (strength)
        ("booster_strength_xp", "Эликсир силы", "Сила XP ×1.5 на 30 мин", "💪", 150, 1.5, 1800, None, None, None),
        ("booster_strength_xp", "Великий эликсир силы", "Сила XP ×2.0 на 1 час", "💪", 400, 2.0, 3600, None, None, None),
        # Stat XP Boosters (wisdom)
        ("booster_wisdom_xp", "Эликсир мудрости", "Мудрость XP ×1.5 на 30 мин", "📚", 150, 1.5, 1800, None, None, None),
        ("booster_wisdom_xp", "Великий эликсир мудрости", "Мудрость XP ×2.0 на 1 час", "📚", 400, 2.0, 3600, None, None, None),
        # Stat XP Boosters (endurance)
        ("booster_endurance_xp", "Эликсир выносливости", "Выносливость XP ×1.5 на 30 мин", "🏃", 150, 1.5, 1800, None, None, None),
        ("booster_endurance_xp", "Великий эликсир выносливости", "Выносливость XP ×2.0 на 1 час", "🏃", 400, 2.0, 3600, None, None, None),
        # Stat XP Boosters (charisma)
        ("booster_charisma_xp", "Эликсир обаяния", "Обаяние XP ×1.5 на 30 мин", "✨", 150, 1.5, 1800, None, None, None),
        ("booster_charisma_xp", "Великий эликсир обаяния", "Обаяние XP ×2.0 на 1 час", "✨", 400, 2.0, 3600, None, None, None),
        # HP Max Boosters
        ("booster_hp_max", "Щит витальности", "+20 макс. HP на 30 мин", "🛡️", 200, None, 1800, None, 20, None),
        ("booster_hp_max", "Великий щит витальности", "+50 макс. HP на 1 час", "🛡️", 500, None, 3600, None, 50, None),
        # Healing Potions
        ("potion_heal", "Малое зелье лечения", "Восстанавливает 25 HP", "🧪", 50, None, None, 25, None, None),
        ("potion_heal", "Зелье лечения", "Восстанавливает 50 HP", "🧪", 150, None, None, 50, None, None),
        ("potion_heal", "Великое зелье лечения", "Восстанавливает 100 HP", "🧪", 400, None, None, 100, None, None),
        # Skins
        ("skin", "Маг", "Облик таинственного мага", "🧙", 500, None, None, None, None, "avatar2"),
        ("skin", "Тень", "Облик неуловимой тени", "🌑", 1000, None, None, None, None, "avatar3"),
        ("skin", "Огненный рыцарь", "Рыцарь в алом — CSS: hue-rotate(20deg)", "🔥", 1500, None, None, None, None, "avatar4"),
        ("skin", "Ледяной страж", "Страж льда — CSS: hue-rotate(200deg)", "❄️", 2000, None, None, None, None, "avatar5"),
        ("skin", "Золотой герой", "Герой в золоте — CSS: sepia(80%)", "👑", 2000, None, None, None, None, "avatar6"),
    ]
    for row in seed_items:
        conn.execute(sa.text("""
            INSERT INTO shop_items
              (item_type, name, description, icon, price_gold, effect_multiplier,
               duration_seconds, heal_amount, hp_max_bonus, avatar_key, is_active)
            VALUES (:t, :n, :d, :i, :p, :em, :dur, :heal, :hp, :av, true)
            ON CONFLICT (name) DO NOTHING
        """), dict(zip(["t", "n", "d", "i", "p", "em", "dur", "heal", "hp", "av"], row)))


def downgrade() -> None:
    # Remove user boost columns
    boost_cols = [
        "active_xp_mult", "active_xp_expires_at",
        "active_gold_mult", "active_gold_expires_at",
        "active_strength_xp_mult", "active_strength_xp_expires_at",
        "active_wisdom_xp_mult", "active_wisdom_xp_expires_at",
        "active_endurance_xp_mult", "active_endurance_xp_expires_at",
        "active_charisma_xp_mult", "active_charisma_xp_expires_at",
        "active_hp_max_bonus", "active_hp_max_expires_at",
    ]
    for col in boost_cols:
        op.drop_column("users", col)
    op.drop_table("idempotency_keys")
    op.drop_table("inventory_items")
    op.drop_table("shop_items")
