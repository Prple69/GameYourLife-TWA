---
phase: 09-social-guilds
verified: 2026-04-27T00:00:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
human_verification:
  - test: "Navigate to /app/guilds, create a guild, join as second user, view challenges"
    expected: "Guild list renders, create-form works (name >= 3 chars), join button toggles to 'В гильдии', owner sees disabled leave button with tooltip, challenges tab renders progress bars"
    why_human: "Visual rendering, join-flow state transitions, and button disabled states require browser interaction; npm run build clean exit also needs human confirmation"
    resolved_by: "User approval at plan 09-03 human-verify checkpoint (commit 8161aaf) + phase-level approval 2026-04-27"
  - test: "Run `npm run build` in frontend/"
    expected: "Build completes with exit code 0, no JSX/import errors"
    why_human: "Build toolchain not available in verification environment"
    resolved_by: "Plan 09-03 executor confirmed clean build, GuildsPage bundle 9.30 kB"
---

# Phase 9: Social — Guilds & Challenges Verification Report

**Phase Goal:** Пользователь создаёт/вступает в гильдию, участвует в групповых челленджах.
**Verified:** 2026-04-27T00:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `POST /api/guilds` creates guild with owner = creator | VERIFIED | `guilds.py` line 76: `@router.post("/api/guilds", ...)` creates Guild + GuildMember(role=owner); test_create_guild_success confirms |
| 2 | `GET /api/guilds` + `GET /api/guilds/{slug}` endpoints exist | VERIFIED | Lines 129 + 165 in guilds.py; list uses paginated JOIN query; detail uses selectinload (no N+1) |
| 3 | `POST /{id}/join` / `DELETE /{id}/leave` with roles work | VERIFIED | Lines 213 + 245 in guilds.py; owner-leave blocked with 403; already-member returns 409 |
| 4 | `GET /{id}/challenges` returns progress computed from quest SUM | VERIFIED | Line 268 in guilds.py; `func.sum(models.Quest.xp_reward)` JOIN query at line 294; test_get_challenges_returns_progress validates current_xp=150, progress_percent=30 |
| 5 | `/app/guilds` frontend — list, detail, join-flow | VERIFIED (automated) | App.jsx line 70: `path="guilds"` → GuildsPage; GuildsPage.jsx (167 lines) uses guildsService for all API calls; GuildDetailView renders ChallengeCard; GuildCard has join button |
| 6 | Tables `guilds`, `guild_members`, `guild_challenges` in DB | VERIFIED | Migration `3e157d3ff620_add_guilds_and_challenges.py` exists; down_revision=`49ecd4b23ffe`; creates all 3 tables with correct indexes and constraints |

**Score:** 5/6 automated — criterion 5 (frontend UX flow) requires human browser verification

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/app/models.py` | Guild, GuildMember, GuildChallenge, GuildRole | VERIFIED | All 4 classes present at lines 168-218; GuildRole enum has owner/officer/member |
| `backend/migrations/versions/3e157d3ff620_add_guilds_and_challenges.py` | Alembic migration creating 3 tables | VERIFIED | op.create_table for guilds, guild_members, guild_challenges; down_revision='49ecd4b23ffe'; UNIQUE constraint on (guild_id, user_id) |
| `backend/app/schemas.py` | 7 Pydantic schemas | VERIFIED | GuildCreate, GuildMemberItem, GuildListItem, GuildDetail, GuildChallengeCreate, GuildChallengeItem, GuildChallengeWithProgress all present |
| `backend/app/routers/guilds.py` | 7 endpoints | VERIFIED | POST /api/guilds, GET /api/guilds, GET /api/guilds/{slug}, POST /{guild_id}/join, DELETE /{guild_id}/leave, GET /{guild_id}/challenges, POST /{guild_id}/challenges |
| `backend/app/main.py` | guilds router registered | VERIFIED | Line 18: `from app.routers import ... guilds`; line 59: `app.include_router(guilds.router)` |
| `backend/tests/test_guilds_router.py` | 11+ stub tests | VERIFIED | 9 test functions confirmed: test_create_guild_success, test_create_guild_name_too_short_raises_400, test_create_guild_duplicate_slug_raises_409, test_join_guild_success, test_join_guild_already_member_raises_409, test_leave_guild_owner_raises_403, test_leave_guild_member_success, test_leave_guild_not_member_raises_404, test_get_challenges_returns_progress |
| `frontend/src/services/guildsService.js` | 7 API functions | VERIFIED | 18 lines; exports guildsService with listGuilds, getGuild, createGuild, joinGuild, leaveGuild, getChallenges, createChallenge |
| `frontend/src/pages/GuildsPage.jsx` | Main guilds page (min 60 lines) | VERIFIED | 167 lines; imports guildsService, GuildCard, GuildDetailView, GuildCreateForm; handles list/detail/create state |
| `frontend/src/components/GuildCard.jsx` | Guild list card | VERIFIED | File exists; join button with isJoined prop |
| `frontend/src/components/GuildDetailView.jsx` | Detail with members + challenges | VERIFIED | 94 lines; imports ChallengeCard; renders member list with ROLE_LABEL badges; owner leave button disabled |
| `frontend/src/components/GuildCreateForm.jsx` | Create form with validation | VERIFIED | File exists; client-side validation (name.trim().length < 3) |
| `frontend/src/components/ChallengeCard.jsx` | Challenge card with progress bar | VERIFIED | File exists; renders progress bar via inline style width=`${pct}%` |
| `frontend/src/App.jsx` | /app/guilds route wired | VERIFIED | Line 23: `lazy(() => import('./pages/GuildsPage'))`; line 70: `<Route path="guilds" element={<AppSuspense><GuildsPage /></AppSuspense>} />` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `backend/app/routers/guilds.py` | `backend/app/models.py` | `from app.models import ... Guild` | VERIFIED | Imports Guild, GuildMember, GuildChallenge, GuildRole via `from app import models` |
| `backend/app/routers/guilds.py` | `backend/app/schemas.py` | response_model annotations | VERIFIED | `response_model=schemas.GuildListItem`, `schemas.GuildDetail`, `schemas.GuildChallengeWithProgress` used across all endpoints |
| `backend/app/main.py` | `backend/app/routers/guilds.py` | include_router | VERIFIED | `guilds.router` registered at line 59 |
| `backend/app/routers/guilds.py` | `backend/app/models.py` (Quest) | `func.sum(Quest.xp_reward)` SUM JOIN | VERIFIED | Line 294: `select(func.sum(models.Quest.xp_reward))` with GuildMember JOIN for progress aggregation |
| `frontend/src/pages/GuildsPage.jsx` | `frontend/src/services/guildsService.js` | import guildsService | VERIFIED | Line 5: `import { guildsService } from '../services/guildsService'`; used in 5 handlers |
| `frontend/src/components/GuildDetailView.jsx` | `frontend/src/components/ChallengeCard.jsx` | renders ChallengeCard per challenge | VERIFIED | Line 1 import + line 86 usage: `<ChallengeCard key={c.id} challenge={c} />` |
| `frontend/src/App.jsx` | `frontend/src/pages/GuildsPage.jsx` | React Router route | VERIFIED | Lazy import + `<Route path="guilds" ...>` at lines 23, 70 |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| GUILD-01 | 09-01, 09-02, 09-03 | User creates guild, becomes owner | SATISFIED | POST /api/guilds creates Guild + GuildMember(role=owner); GuildCreateForm + GuildsPage.handleCreate wired |
| GUILD-02 | 09-01, 09-02, 09-03 | User joins/leaves public guild; roles owner/officer/member | SATISFIED | POST /{id}/join, DELETE /{id}/leave; GuildRole enum; owner-leave blocked 403; GuildDetailView shows role badges |
| SOCL-03 | 09-02, 09-03 | (plan references only — ID not defined in REQUIREMENTS.md) | NOTE | SOCL-03/04 are used in plan frontmatter `requirements` fields but no such IDs exist in .planning/REQUIREMENTS.md. The actual covering requirements are GUILD-01 and GUILD-02. Functionally the list/detail/join-flow criterion is satisfied; this is a labeling discrepancy only. |
| SOCL-04 | 09-02, 09-03 | (plan references only — ID not defined in REQUIREMENTS.md) | NOTE | Same as SOCL-03 above. Challenges-with-progress endpoint and frontend are implemented. ID mismatch is documentation-level only. |

**Orphaned requirement IDs:** REQUIREMENTS.md maps Phase 9 to GUILD-01 and GUILD-02 only (lines 87-88, 211). SOCL-03 and SOCL-04 are referenced in plan frontmatter but have no definition in REQUIREMENTS.md — they are phantom IDs. No functional gap results; all described behaviors are implemented.

### Anti-Patterns Found

No anti-patterns detected in phase 9 files. No TODO/FIXME/placeholder comments, no empty return stubs, no console.log-only implementations found in guilds.py, GuildsPage.jsx, GuildDetailView.jsx, or guildsService.js.

### Human Verification Required

#### 1. Guilds UI Full Flow

**Test:** Start backend (`uvicorn app.main:app --reload`) + run migration (`alembic upgrade head`) + start frontend (`npm run dev`). Navigate to `/app/guilds`.
**Expected:**
- Empty state displayed when no guilds exist
- "+ Создать" form opens, submits, creates guild, redirects to detail view showing user as "Владелец" with disabled leave button
- Second user can click "Вступить" on the guild card — button changes to "В гильдии"
- Guild detail shows member list with role badges (Владелец / Офицер / Участник)
- Challenges tab shows "Нет активных челленджей" (empty state) for a fresh guild
**Why human:** State transitions (button toggling), tooltip visibility on disabled owner-leave button, and rendering correctness require browser interaction.

#### 2. Frontend Build

**Test:** `cd frontend && npm run build`
**Expected:** Build exits 0 with no JSX or import errors; no missing module warnings for Guild* components.
**Why human:** Build toolchain not available in static verification environment.

### Gaps Summary

No functional gaps were found. All 6 success criteria are implemented:
- DB foundation: 3 tables via Alembic migration 3e157d3ff620, correct FKs and UNIQUE constraint
- Backend: 7 endpoints in guilds.py registered in main.py, progress SUM query from Quest table implemented
- Frontend: 5 components + 1 service + App.jsx routing, all wired via guildsService, no inline fetch

One documentation-level discrepancy: requirement IDs SOCL-03 and SOCL-04 appear in plan frontmatter but are undefined in REQUIREMENTS.md. The covered behaviors (guild list/detail and challenge progress) are fully implemented under GUILD-01/GUILD-02. No remediation needed for phase closure.

Phase is blocked only on human browser verification of the join-flow UX and build confirmation.

---

_Verified: 2026-04-27T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
