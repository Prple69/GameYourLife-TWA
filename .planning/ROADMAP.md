# ROADMAP: Game Your Life v1

**Created:** 2026-03-01
**Project:** Game Your Life (Telegram Mini-App RPG)
**Core Value:** Completing a real-life task feels like progressing a character — the RPG loop must always feel rewarding, never like a chore tracker with a skin.

---

## Phases

- [x] **Phase 1: Secure Foundation** - Fix critical security issues and move credentials to environment variables (completed 2026-03-02)
- [ ] **Phase 2: Character Stats** - Add 4 named stats that grow through different quest types
- [ ] **Phase 3: AI Daily Quests** - Generate personalized daily quest suggestions based on character stats and history
- [ ] **Phase 4: Shop & Inventory** - Add purchasable items (XP multiplier, gold multiplier, quest slots, cosmetics) and inventory management
- [ ] **Phase 5: Leaderboard** - Show global rankings by level and XP with user's position highlighted

---

## Phase Details

### Phase 1: Secure Foundation

**Goal:** Users interact with a secure backend where their identity cannot be spoofed and credentials are protected.

**Depends on:** Nothing (first phase)

**Requirements:** SEC-01, SEC-02

**Success Criteria** (what must be TRUE):
1. Server rejects any request with invalid or missing Telegram initData signature
2. Database credentials and API keys are loaded from environment variables, not hardcoded
3. Existing quest completion and progression features continue to work with signature validation enabled
4. No credentials visible in git history or code files

**Plans:** 2/2 plans complete

Plans:
- [ ] 01-01-PLAN.md — Credential externalization: create Pydantic Settings config, migrate database.py and main.py off hardcoded values, create .env + .env.example + root .gitignore
- [ ] 01-02-PLAN.md — Telegram signature validation: create dependencies.py with verify_telegram_init_data, wire into all 8 endpoints, update frontend api.js to forward initData header

---

### Phase 2: Character Stats

**Goal:** Characters have 4 named stats (Strength, Wisdom, Endurance, Charisma) that evolve as users complete different quest types, creating meaningful quest differentiation.

**Depends on:** Phase 1

**Requirements:** PROG-02, PROG-03

**Success Criteria** (what must be TRUE):
1. User can view character profile showing 4 named stats with current values
2. Completing a quest of a certain type (e.g., work, fitness, learning) increases the corresponding stat
3. Stat growth is persistent and visible across sessions
4. Stats are factored into AI quest analysis (different quest types reward different stats)

**Plans:** TBD

---

### Phase 3: AI Daily Quests

**Goal:** Users receive daily personalized quest suggestions based on their character stats, history, and progression level.

**Depends on:** Phase 2

**Requirements:** AI-01, AI-02

**Success Criteria** (what must be TRUE):
1. User sees 3 AI-generated quest suggestions on the home screen, refreshed daily
2. Suggested quests align with user's weak stats (e.g., if Charisma is low, suggest social tasks)
3. Suggestions account for user's level and recent completion history (difficulty scaling)
4. User can accept suggestions as active quests or dismiss and refresh

**Plans:** TBD

---

### Phase 4: Shop & Inventory

**Goal:** Users can spend earned gold on items that meaningfully enhance progression (boosters, quest slots, cosmetics).

**Depends on:** Phase 1, Phase 3

**Requirements:** SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05, INV-01, INV-02, INV-03

**Success Criteria** (what must be TRUE):
1. User can browse a shop catalog showing items (XP multiplier, gold multiplier, quest slots, cosmetic skins) with costs and descriptions
2. User can purchase items with gold and items are added to inventory
3. User can view inventory and activate/equip items from it
4. Boost items apply stat multipliers (visible in quest rewards) and persist until consumed
5. Avatar skins can be equipped and display on the user's character profile

**Plans:** TBD

---

### Phase 5: Leaderboard

**Goal:** Users can see global rankings by level and XP, creating competitive motivation and social proof of progression.

**Depends on:** Phase 4

**Requirements:** LEAD-01, LEAD-02

**Success Criteria** (what must be TRUE):
1. User can access a leaderboard showing top players ranked by level (primary) then XP (secondary)
2. User's own rank and position (e.g., "22nd") are highlighted on the leaderboard
3. Leaderboard updates in near-real-time as users level up and earn XP
4. User can see other players' names and current level on the leaderboard

**Plans:** TBD

---

## Progress Tracking

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Secure Foundation | 2/2 | Complete    | 2026-03-02 |
| 2. Character Stats | 0/TBD | Not started | — |
| 3. AI Daily Quests | 0/TBD | Not started | — |
| 4. Shop & Inventory | 0/TBD | Not started | — |
| 5. Leaderboard | 0/TBD | Not started | — |

---

## Coverage Summary

**Total v1 Requirements:** 24 (8 existing, 16 new)
**Mapped to Phases:** 16 new requirements mapped
**Unmapped:** 0

| Category | Count | Phase |
|----------|-------|-------|
| Security & Foundation | 2 | Phase 1 |
| Character Progression | 2 | Phase 2 |
| AI Features | 2 | Phase 3 |
| Shop | 5 | Phase 4 |
| Inventory | 3 | Phase 4 |
| Leaderboard | 2 | Phase 5 |

---

*Roadmap created: 2026-03-01*
