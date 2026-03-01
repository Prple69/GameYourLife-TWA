# Requirements: Game Your Life

**Defined:** 2026-03-01
**Core Value:** Completing a real-life task feels like progressing a character — the RPG loop must always feel rewarding, never like a chore tracker with a skin.

## v1 Requirements

Requirements for initial release. Checked items are already working in the existing codebase.

### Quest Management

- [x] **QUEST-01**: User can create a quest with a custom title and deadline
- [x] **QUEST-02**: AI analyzes a user-created quest and assigns difficulty, XP reward, gold reward, and HP penalty
- [x] **QUEST-03**: User can complete an active quest and receive the assigned XP and gold
- [x] **QUEST-04**: Overdue quests automatically fail and apply HP penalty to the user
- [x] **QUEST-05**: User can view quest history showing completed and failed quests

### AI Features

- [ ] **AI-01**: User receives 3 AI-generated quest suggestions refreshed each day
- [ ] **AI-02**: Daily AI quests are personalized based on user's character stats and recent completion history

### Character Progression

- [x] **PROG-01**: User character levels up when XP reaches threshold (threshold scales 1.2× per level)
- [ ] **PROG-02**: Character has 4 named stats (Strength, Wisdom, Endurance, Charisma) visible on profile
- [ ] **PROG-03**: Completing different quest types grows the corresponding character stat

### Shop

- [ ] **SHOP-01**: User can browse a shop catalog showing items with name, description, and gold cost
- [ ] **SHOP-02**: User can purchase XP multiplier boost items with earned gold
- [ ] **SHOP-03**: User can purchase gold multiplier boost items with earned gold
- [ ] **SHOP-04**: User can purchase additional active quest slots with earned gold
- [ ] **SHOP-05**: User can purchase cosmetic avatar skins with earned gold

### Inventory

- [ ] **INV-01**: User can view all owned items in their inventory
- [ ] **INV-02**: User can activate owned boost items from inventory (applies effect immediately)
- [ ] **INV-03**: User can equip owned avatar skins from inventory

### Leaderboard

- [ ] **LEAD-01**: User can view a global leaderboard of players ranked by level and XP
- [ ] **LEAD-02**: User's own rank and position are highlighted on the leaderboard

### Profile

- [x] **PROF-01**: User character profile is created automatically from Telegram identity on first launch
- [x] **PROF-02**: User can select and change their character avatar

### Security & Foundation

- [ ] **SEC-01**: Server verifies Telegram initData cryptographic signature on all requests (no spoofable tg_id)
- [ ] **SEC-02**: All credentials and API keys loaded from environment variables (not hardcoded)

## v2 Requirements

Deferred to future release. Acknowledged but not in current roadmap.

### Social

- **SOCL-01**: User can add friends and see their level and recent quest completions
- **SOCL-02**: User can view a friends-only leaderboard filter
- **SOCL-03**: User can create or join a guild
- **SOCL-04**: Guild members share a progress board and can see each other's activity

### Notifications

- **NOTF-01**: User receives a Telegram bot notification when daily AI quests refresh
- **NOTF-02**: User receives a reminder notification for quests expiring today

### Engagement

- **ENG-01**: User has a daily login streak tracked and rewarded with bonus gold
- **ENG-02**: User earns achievement badges for milestones (first quest, level 10, etc.)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native iOS/Android app | Telegram covers mobile; web-first |
| Real-money payments / premium | No payment complexity for v1 |
| Web access outside Telegram | Purpose-built for Telegram ecosystem |
| Custom quest categories/tags | YAGNI; free-form title is sufficient for v1 |
| Full guild/party system | Deferred to v2 social features |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| QUEST-01 | — | Complete (existing) |
| QUEST-02 | — | Complete (existing) |
| QUEST-03 | — | Complete (existing) |
| QUEST-04 | — | Complete (existing) |
| QUEST-05 | — | Complete (existing) |
| PROG-01 | — | Complete (existing) |
| PROF-01 | — | Complete (existing) |
| PROF-02 | — | Complete (existing) |
| SEC-01 | Phase TBD | Pending |
| SEC-02 | Phase TBD | Pending |
| PROG-02 | Phase TBD | Pending |
| PROG-03 | Phase TBD | Pending |
| SHOP-01 | Phase TBD | Pending |
| SHOP-02 | Phase TBD | Pending |
| SHOP-03 | Phase TBD | Pending |
| SHOP-04 | Phase TBD | Pending |
| SHOP-05 | Phase TBD | Pending |
| INV-01 | Phase TBD | Pending |
| INV-02 | Phase TBD | Pending |
| INV-03 | Phase TBD | Pending |
| LEAD-01 | Phase TBD | Pending |
| LEAD-02 | Phase TBD | Pending |
| AI-01 | Phase TBD | Pending |
| AI-02 | Phase TBD | Pending |

**Coverage:**
- v1 requirements: 24 total (8 existing, 16 new)
- Mapped to phases: 0 (populated by roadmap)
- Unmapped: 16 ⚠️

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after initial definition*
