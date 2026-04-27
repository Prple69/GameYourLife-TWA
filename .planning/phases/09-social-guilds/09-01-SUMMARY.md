---
phase: 09-social-guilds
plan: "01"
subsystem: backend/models+schemas+migrations
tags: [guilds, guild-members, guild-challenges, orm, alembic, pydantic]
dependency_graph:
  requires: [49ecd4b23ffe migration (Phase 08 friendships)]
  provides: [Guild ORM model, GuildMember ORM model, GuildChallenge ORM model, GuildRole enum, 7 Pydantic schemas, Alembic migration 3e157d3ff620]
  affects: [backend/app/routers/guilds.py (downstream), frontend guild pages (downstream)]
tech_stack:
  added: []
  patterns: [hand-written Alembic migration (no autogenerate), str+enum.Enum pattern per Phase 8, UniqueConstraint on guild_members(guild_id,user_id), CASCADE FK ondelete]
key_files:
  created:
    - backend/migrations/versions/3e157d3ff620_add_guilds_and_challenges.py
  modified:
    - backend/app/models.py
    - backend/app/schemas.py
decisions:
  - "[09-01] GuildRole inherits str+enum.Enum — enables direct Pydantic serialization without custom validator, consistent with FriendshipStatus pattern"
  - "[09-01] No relationship() backrefs on User model for GuildMember — router queries directly, avoids circular import risk per Phase 8 pattern"
  - "[09-01] Revision ID 3e157d3ff620; hand-wrote migration (no autogenerate) — avoids spurious drop_index calls per Phase 4/5/8 pattern"
metrics:
  duration_seconds: 85
  completed_date: "2026-04-27"
  tasks_completed: 3
  files_modified: 3
---

# Phase 9 Plan 01: Guild DB Foundation Summary

Guild ORM models (Guild, GuildMember, GuildChallenge) + GuildRole enum + hand-written Alembic migration 3e157d3ff620 + 7 Pydantic schemas added to models.py and schemas.py.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Guild, GuildMember, GuildChallenge models | fe1bfe1 | backend/app/models.py |
| 2 | Hand-write Alembic migration for guilds tables | 804356d | backend/migrations/versions/3e157d3ff620_add_guilds_and_challenges.py |
| 3 | Add Pydantic schemas for guilds API | fac531a | backend/app/schemas.py |

## Verification Results

- `from app.models import Guild, GuildMember, GuildChallenge, GuildRole` — OK
- Alembic revision chain: `['3e157d3ff620', '49ecd4b23ffe', 'c203bdcc4819', '06a41e12f90c', ...]` — new migration present with correct down_revision
- `from app.schemas import GuildCreate, GuildListItem, GuildDetail, GuildMemberItem, GuildChallengeCreate, GuildChallengeItem, GuildChallengeWithProgress` — OK
- `pytest tests/ -x -q` — 87 passed in 1.32s

## Decisions Made

1. GuildRole inherits `str + enum.Enum` — enables direct Pydantic serialization without custom validator, consistent with FriendshipStatus pattern from Phase 8.
2. No `relationship()` backrefs on the User model for GuildMember — router will query directly, avoids circular import risk per Phase 8 Friendship pattern.
3. Revision ID `3e157d3ff620`; hand-wrote migration (no autogenerate) — avoids spurious `drop_index` calls per Phase 4/5/8 pattern.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- `backend/app/models.py` — FOUND and contains GuildRole, Guild, GuildMember, GuildChallenge
- `backend/migrations/versions/3e157d3ff620_add_guilds_and_challenges.py` — FOUND
- `backend/app/schemas.py` — FOUND and contains all 7 guild schemas
- Commits fe1bfe1, 804356d, fac531a — all present in git log
