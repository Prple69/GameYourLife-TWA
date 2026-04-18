"""baseline

Marks the Phase 1/2 schema (users + quests tables as created by SQLAlchemy
Base.metadata.create_all at app startup) as the Alembic starting point.

No-op upgrade/downgrade: the DB is already at this schema. Applied via
`alembic stamp head` — never via `alembic upgrade`.

Revision ID: fa4573e2e0b9
Revises:
Create Date: 2026-04-18
"""
from typing import Sequence, Union


revision: str = "fa4573e2e0b9"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
