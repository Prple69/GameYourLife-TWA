---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 08
current_plan: Not started
status: unknown
last_updated: "2026-04-27T03:24:19.841Z"
progress:
  total_phases: 10
  completed_phases: 10
  total_plans: 31
  completed_plans: 31
  percent: 100
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 08
current_plan: Not started
status: phase-complete
last_updated: "2026-04-27T02:49:00.000Z"
progress:
  total_phases: 11
  completed_phases: 9
  total_plans: 28
  completed_plans: 28
  percent: 82
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 06
current_plan: Not started
status: unknown
last_updated: "2026-04-22T07:07:14.729Z"
progress:
  total_phases: 9
  completed_phases: 8
  total_plans: 28
  completed_plans: 27
  percent: 96
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 05.1
current_plan: Complete
status: phase-complete
last_updated: "2026-04-22T00:00:00.000Z"
progress:
  total_phases: 7
  completed_phases: 6
  total_plans: 19
  completed_plans: 19
  percent: 100
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 3
current_plan: Complete
status: phase-complete
last_updated: "2026-04-18T02:45:00.000Z"
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 8
  completed_plans: 8
  percent: 100
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 1
current_plan: Not started
status: unknown
last_updated: "2026-03-02T12:56:44.228Z"
progress:
  total_phases: 1
  completed_phases: 1
  total_plans: 2
  completed_plans: 2
  percent: 100
---

# STATE: Game Your Life Roadmap Execution

**Current Date:** 2026-03-01
**Milestone:** v1
**Current Phase:** 08

---

## Project Reference

**Core Value:** Completing a real-life task feels like progressing a character — the RPG loop must always feel rewarding, never like a chore tracker with a skin.

**Technology Stack:**
- Frontend: React 19 + Vite + Tailwind
- Backend: FastAPI (Python) + SQLAlchemy async + PostgreSQL
- AI Provider: OpenRouter (OpenAI-compatible)
- Platform: Telegram Mini App (TWA)
- Deployment: Vercel (frontend), self-hosted server with Cloudflare Tunnel (backend)

**Working Foundation:**
- Quest creation with AI analysis (difficulty, XP, gold, HP penalty)
- Character profile with avatar selection
- XP-based leveling with 1.2x threshold scaling
- Quest history tracking (completed/failed)
- Auto-fail for overdue quests with HP penalty

---

## Current Position

**Current Phase:** Phase 1: Secure Foundation (complete)
**Current Plan:** Not started
**Execution Status:** Phase 1 complete — ready for Phase 2
**Progress:** [██████████] 100%

---

## Critical Issues (Blocking)

From PROJECT.md context — these must be fixed in Phase 1:

1. ~~**DB credentials hardcoded in `backend/app/database.py`**~~ — RESOLVED by Plan 01-01 (SEC-02)
2. **No server-side Telegram auth validation** — any tg_id can be spoofed
3. **DEBUG_MODE = true** in `QuestsPage.jsx` (low priority but noisy)
4. **Dead code:** `questService` in `api.js` references undefined `API_URL`
5. **Timezone inconsistency:** Frontend local time vs backend MSK

Phase 1 planning must address security (SEC-01, SEC-02) before feature work.

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Phase 1 focuses on security before features | Users' data cannot be protected by features if backend is not secure |
| Phase 2 introduces named stats before AI personalization | AI daily quests need stat metadata to generate meaningful suggestions |
| Phase 4 (Shop) depends on Phase 3 (AI Quests) | Meaningful rewards require meaningful quest variety first |
| Leaderboard is final phase | Least critical; competitive layer is good polish after core loops work |
| [01-01] Use Path(__file__).parent.parent to resolve backend/.env absolutely in config.py | Relative paths fail when module is imported from a different working directory |
| [01-01] All backend modules use get_settings() singleton from app.config | Never use os.getenv() directly — centralized config prevents credential sprawl |
- [Phase 01-secure-foundation]: [01-02] Use stdlib HMAC (hmac/hashlib) instead of telegram-init-data library — zero external dependencies, same algorithm
- [Phase 01-secure-foundation]: [01-02] Route naming: /me convention (/api/user/me, /api/quests/me) instead of /{tg_id} path params — identity from verified token
- [Phase 01-secure-foundation]: [01-02] All backend modules use Depends(verify_telegram_init_data) for auth — no endpoint is unauthenticated except /health
- [Phase 02-web-foundation]: Custom CookieConsentBanner without react-cookie-consent library — full retro aesthetic control, zero extra dependencies
- [Phase 02-web-foundation]: CookieConsentBanner rendered in main.jsx globally — appears on all routes without per-page imports
- [Phase 02-web-foundation]: LegalLayout extracted to separate file shared by all three legal pages — single source of truth for footer links
- [Phase 02-web-foundation]: Phase 2 mock token pre-populated in authStore so ProtectedRoute passes without real auth until Phase 3 implements JWT
- [Phase 02-web-foundation]: Nested Routes inside /app element is temporary scaffold; Plan 02-03 replaces with AppLayout + Outlet pattern
- [Phase 04-character-stats]: Revision ID 06a41e12f90c; hand-wrote migration (no autogenerate) to avoid spurious drop_index calls
- [Phase 04-character-stats]: Both default= and server_default= on stat columns: server_default for existing DB rows, default= for ORM inserts
- [Phase 04-character-stats]: Literal type alias for QuestCategory (not Enum) - matches project convention for difficulty: str
- [Phase 04-character-stats]: Category chip order (work/fitness/learning/social) matches CATEGORY_TO_STAT key order in game_logic.py
- [Phase 04-character-stats]: Stat order (Strength/Endurance/Wisdom/Charisma) mirrors CharacterPage to ProfileModal for consistent UX
- [Phase 04-character-stats]: Full literal Tailwind class strings in STAT_META for v4 JIT compatibility (no interpolated strings)
- [Phase 04-character-stats]: Unit-level stub tests (StubUser/StubQuest) chosen over TestClient for router coverage
- [Phase 04-character-stats]: category='unknown' fallback in analyze_task payload extraction prevents /analyze breakage during frontend rollout
- [Phase 04-character-stats]: 3.5s auto-dismiss for stat toast — long enough to read, short enough to not obstruct the UI
- [Phase 05-shop-inventory]: Lazy expiry in effective_multipliers: exp > now (strictly greater) — expires_at == now is treated as expired to prevent edge-case exploitation
- [Phase 05-shop-inventory]: BOOST_MULT_TYPES tuple drives effective_multipliers generically via getattr — adding a new boost type requires only updating this tuple
- [Phase 05-shop-inventory]: Wave 0 scaffold pattern: pass-only test files created in Plan 02 so Plans 03/04 can fill in without import errors during parallel development
- [Phase 05-shop-inventory]: Hand-wrote migration c203bdcc4819 (no autogenerate) — avoids spurious drop_index calls per Phase 4 pattern
- [Phase 05-shop-inventory]: SHOP-04 permanently removed from scope: quest slots are hard cap (5), not purchasable
- [Phase 05-shop-inventory]: Denormalized active boost columns on User (14 nullable columns) — one slot per boost type
- [Phase 05-shop-inventory]: Applied effective_multipliers once at top of complete_quest body — avoids multiple calls with same timestamp; round() used for reward multiplication for integer model consistency
- [Phase 05-shop-inventory]: Stub-only unit tests (no TestClient/DB) mirror Phase 4 pattern for router logic coverage without async overhead
- [Phase 05-shop-inventory]: BOOSTER_PREFIX_MAP dict drives dynamic getattr/setattr for boost columns — adding new boost type requires only updating the map
- [Phase 05-shop-inventory]: AvatarSelector fetches shop-items and inventory internally (enabled: isOpen) rather than via props to avoid prop drilling
- [Phase 05-shop-inventory]: Quest cap activeCount includes optimisticTasks for immediate client-side guard before server confirms
- [Phase 05-shop-inventory]: AvatarSelector calls onClose() before navigate() on locked skin click to prevent modal lingering during navigation
- [Phase 05.1-verify-web-foundation]: Retroactive goal-backward verification pattern: docs-only gap closure phase produces VERIFICATION.md and syncs REQUIREMENTS.md traceability in a single commit
- [Phase 05.1-verify-web-foundation]: Pre-Launch Checklist section in VERIFICATION.md tracks non-blocking tech-debt TODOs separate from gaps array — preserves visibility for release prep without re-opening the phase
- [Phase 05.1-verify-web-foundation]: Traceability collapses dual-phase labels (Phase 2 → 5.1 verify) to single label (Phase 5.1 verify) once Verified — durable label is where verification passed, not where first implemented
- [Phase 05.2]: AUTH-05 stub acknowledged as accepted v1.0 deviation — SMTP deferred to Phase 11/PROD-03; does not block Phases 6-10
- [Phase 05.2]: Traceability label convention: single Phase 5.2 (verify) label replaces dual Phase 3 → 5.2 (verify) once verified — durable label is where verification passed
- [Phase 06-ai-daily-quests]: Graceful Redis degradation on ping failure: log warning, do not crash startup — endpoints fail at request-time
- [Phase 06-ai-daily-quests]: limit=0 default in get_quest_history preserves backward compat with existing callers
- [Phase 06-ai-daily-quests]: DailySuggestion difficulty uses Literal['easy','medium','hard','epic'] to match existing analyze_task shape
- [Phase 06-ai-daily-quests]: No auto-fetch on mount for daily quests — trigger button pattern maintains locked CONTEXT.md decision
- [Phase 06-ai-daily-quests]: dailyService URL paths omit /api prefix since axios baseURL already includes /api
- [Phase 06-ai-daily-quests]: Use asyncio.run() in sync tests for StubRedis instead of pytest-asyncio — avoids new dependency
- [Phase 06-ai-daily-quests]: Query quests by user.id directly instead of crud.get_quest_history() — avoids legacy tg_id dependency
- [Phase 06-ai-daily-quests]: list(FALLBACK_SUGGESTIONS) returns copy to prevent shared mutation between requests
- [Phase 06-ai-daily-quests]: Empty-state auto-refetch is intentional UX: when suggestions.length drops to 0, frontend re-fetches for fresh suggestions rather than showing empty state
- [Phase 06-ai-daily-quests]: First-call LLM fallback (FALLBACK_SUGGESTIONS) is acceptable for v1.0 — provider latency or JSON parse edge case, not a blocker
- [Phase 06-ai-daily-quests]: LLM prompt quality (typos, awkward Russian) deferred to polish sub-phase — does not block v1.0 release
- [Phase 07-leaderboard]: Score formula lvl*1e12 + xp*1e6 - id: float64-safe, encodes lvl DESC + xp DESC + id ASC in single ZADD float
- [Phase 07-leaderboard]: asyncio.run() test pattern maintained for Phase 7 (no pytest-asyncio) — consistent with Phase 6
- [Phase 07-leaderboard]: Lazy local import in crud.add_reward avoids circular dependency (crud->leaderboard->crud) without module restructuring
- [Phase 07-leaderboard]: leaderboard_router alias in main.py lets both domain module and router coexist without name collision
- [Phase 07-leaderboard]: fetchData extracted as useCallback — both useEffect and retry button call same function without duplication
- [Phase 07-leaderboard]: entry.rank === userRank for isMe comparison — server-authoritative rank from /api/leaderboard/me, not stale character prop
- [Phase 07-leaderboard]: Plan 07-04 (human-verify) — DEFERRED по указанию пользователя «просто дальше». Browser smoke test перенесён в Pre-Launch Checklist; LEAD-01/LEAD-02 закрыты по артефактам кода + unit-тестов + build pass
- [Phase 08-social-friends]: Hand-wrote migration 49ecd4b23ffe (no autogenerate) — avoids spurious drop_index calls per Phase 4/5 pattern
- [Phase 08-social-friends]: No SQLAlchemy relationship() backrefs on User model for Friendship — router queries directly, avoids circular import risk
- [Phase 08-social-friends]: FriendshipStatus inherits str+enum.Enum — enables direct Pydantic serialization without custom validator
- [Phase 08-social-friends]: Plain int defaults for limit/offset (not Query objects) on router functions — enables stub test direct invocation without TypeError while FastAPI still validates bounds at HTTP request time
- [Phase 08-social-friends]: Used leaderIcon as placeholder for ДРУЗЬЯ nav tab — no friends icon in assets; label differentiates it
- [Phase 08-social-friends]: friendsService import path is ./api (not ../api) — api.js is co-located in src/services/

## Session Continuity

**Roadmap Status:** Created 2026-03-01
**Files Written:**
- `.planning/ROADMAP.md` — Phase structure and requirements mapping
- `.planning/STATE.md` — This file, project memory and decision context
- `.planning/REQUIREMENTS.md` — Traceability section updated with phase mappings

**Last Session:** 2026-04-27T03:20:41.310Z
**Next Step:** Run `/gsd:discuss-phase 8` (или `/gsd:plan-phase 8`) — Phase 8 (Social — Friends) ещё не имеет CONTEXT.md

---

## Performance Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| v1 Requirements Mapped | 0/16 | 16/16 ✓ |
| Phases Defined | 0 | 5 ✓ |
| Success Criteria Defined | 0 | 20+ ✓ |

---
| Phase 01-secure-foundation P01 | 3 | 2 tasks | 6 files |
| Phase 01-secure-foundation P02 | 5 | 2 tasks | 6 files |
| Phase 02-web-foundation P02 | 15 | 2 tasks | 6 files |
| Phase 02-web-foundation P01 | 185 | 2 tasks | 12 files |
| Phase 04-character-stats P01 | 3 | 3 tasks | 7 files |
| Phase 04-character-stats P03 | 15 | 3 tasks | 3 files |
| Phase 04-character-stats P02 | 15 | 2 tasks | 2 files |
| Phase 04-character-stats P04 | 20 | 2 tasks | 1 files |
| Phase 05 P02 | 12 | 3 tasks | 5 files |
| Phase 05-shop-inventory P01 | 2 | 3 tasks | 4 files |
| Phase 05 P04 | 2 | 2 tasks | 2 files |
| Phase 05-shop-inventory P03 | 202 | 2 tasks | 6 files |
| Phase 05-shop-inventory P05 | 45 | 2 tasks | 7 files |
| Phase 05.1 P01 | 3 | 3 tasks | 2 files |
| Phase 05.2 P01 | 138 | 3 tasks | 2 files |
| Phase 06-ai-daily-quests P01 | 2 | 3 tasks | 7 files |
| Phase 06-ai-daily-quests P03 | 2 | 3 tasks | 3 files |
| Phase 06-ai-daily-quests P02 | 2 | 2 tasks | 4 files |
| Phase 06-ai-daily-quests P04 | N/A | 2 tasks | 0 files |
| Phase 07-leaderboard P01 | 15 | 2 tasks | 4 files |
| Phase 07-leaderboard P02 | 2 | 2 tasks | 3 files |
| Phase 07-leaderboard P03 | 1 | 2 tasks | 2 files |
| Phase 08 P01 | 2 | 3 tasks | 3 files |
| Phase 08-social-friends P02 | 3 | 2 tasks | 3 files |
| Phase 08 P03 | 5 | 2 tasks | 7 files |

## Accumulated Context

### Why This Phase Order?

1. **Phase 1 (Security)** must be first. Spoofable auth and hardcoded credentials are deal-breakers. Everything else depends on a trustworthy backend.

2. **Phase 2 (Stats)** before **Phase 3 (AI Quests)** because:
   - Stats provide semantic meaning to quest types
   - AI needs stat metadata to personalize suggestions
   - Without stats, AI quests are generic

3. **Phase 4 (Shop)** after **Phase 3 (AI Quests)** because:
   - Shop items should feel like earned rewards, not arbitrary unlocks
   - More quest variety from AI suggestions makes shop purchases more meaningful
   - Multipliers only matter when quest diversity is high

4. **Phase 5 (Leaderboard)** last because:
   - Competitive ranking is only interesting when users have varied progression (items, stats, different quest types)
   - Doesn't block any other feature
   - Users need something worth competing on first

### Success Criteria Philosophy

Each phase's success criteria describe **observable user behaviors**, not implementation tasks:
- ✓ "User can view character profile showing 4 named stats"
- ✓ "Suggested quests align with user's weak stats"
- ✗ NOT "Implement stat growth algorithm" (implementation detail)
- ✗ NOT "Create database schema for stats" (implementation detail)

This ensures `/gsd:plan-phase` has clear targets for decomposition.

---

*State initialized: 2026-03-01*
