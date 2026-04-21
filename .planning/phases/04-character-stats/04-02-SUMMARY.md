---
phase: 04-character-stats
plan: "02"
subsystem: backend-router
tags: [fastapi, stat-gain, tdd, openai-prompt, category]
dependency_graph:
  requires:
    - stat_columns_in_users_table
    - quest_category_column
    - game_logic_primitives
    - UserSchema_stat_fields
    - QuestCategory_type
  provides:
    - complete_quest_stat_gain_response
    - save_quest_category_persistence
    - analyze_task_stat_aware_prompt
  affects:
    - frontend completion popup (04-04 reads stat_gain from response)
    - frontend category picker (04-03 sends category in save/analyze payloads)
tech_stack:
  added: []
  patterns:
    - "TDD RED/GREEN cycle for router behavior via stub User/Quest objects"
    - "Graceful null-guard on quest.category for legacy quests"
    - "F-string prompt extension — additive only, no rewrite"
key_files:
  created:
    - backend/tests/test_quests_router.py
  modified:
    - backend/app/routers/quests.py (import line 33; save_quest line 178; complete_quest lines 218-223, 228-234; analyze_task lines 80, 89-109)
decisions:
  - "Unit-level stub tests (StubUser/StubQuest) chosen over full TestClient — avoids heavy async DB fixture infra while maintaining regression coverage for the stat logic"
  - "category=payload.get('category','unknown') uses 'unknown' fallback so /analyze never breaks during frontend rollout"
  - "stat_gain placed after leveled_up while-loop and BEFORE db.commit to avoid extra roundtrip"
metrics:
  duration_minutes: 15
  completed_date: "2026-04-21"
  tasks_completed: 2
  files_created: 1
  files_modified: 1
---

# Phase 4 Plan 02: Quests Router — Stat Gain + Analyze Prompt — Summary

**One-liner:** quests.py extended with category persistence in save_quest, stat XP gain + stat_gain response in complete_quest, and a 4-stat СТАТЫ block + weak-stat rule 4 in the analyze_task prompt — all backward compatible.

---

## Tasks Completed

| # | Task | Commit | Notes |
|---|------|--------|-------|
| 1 (RED) | Failing tests for stat gain + prompt strings | 52b4b4f | 8 tests; 1 failed (analyze_task prompt check) as expected |
| 1+2 (GREEN) | Extend quests.py: save, complete, analyze | cb33dd3 | All 25 tests pass (17 game_logic + 8 router) |

---

## Exact Edits in quests.py

### 1. Import (line 33)

```python
from app.utils.game_logic import apply_stat_xp, STAT_GROWTH, CATEGORY_TO_STAT
```

### 2. save_quest — category kwarg (line 178)

```python
quest = models.Quest(
    ...
    category=quest_data.category,   # Phase 4: persist category from QuestSave schema
    ...
)
```

### 3. complete_quest — stat gain block (lines 218-223) + return (line 233)

```python
# Phase 4: stat gain (no-op for legacy quests without category)
stat_gain = None
if quest.category is not None:
    stat_name = CATEGORY_TO_STAT[quest.category]
    xp_gain = STAT_GROWTH[quest.difficulty]
    stat_gain = apply_stat_xp(user, stat_name, xp_gain)

await db.commit()
...
return {
    ...
    "stat_gain": stat_gain,  # None for legacy category=NULL quests
}
```

### 4. analyze_task — category extraction + СТАТЫ block + rule 4 (lines 80, 89-109)

```python
category = payload.get("category", "unknown")

# In prompt f-string — after СТАТУС ИГРОКА block, before КРИТЕРИИ:
СТАТЫ ИГРОКА (level):
- Сила: {user.stat_strength_level}
- Мудрость: {user.stat_wisdom_level}
- Выносливость: {user.stat_endurance_level}
- Обаяние: {user.stat_charisma_level}

КАТЕГОРИЯ КВЕСТА: {category}

# After rule 3:
4. Если стат, соответствующий категории квеста ({category}), НИЖЕ среднего
по 4 статам — слегка увеличь XP/gold (+10%) и снизь hp_penalty (-10%),
чтобы поощрить прокачку слабого направления. Не меняй формат ответа.
```

---

## POST /api/quests/complete/{id} — Full Response Shape

For Plan 04-04 consumption:

```json
{
  "status": "success",
  "leveled_up": false,
  "user": {
    "id": 1,
    "username": "player",
    "lvl": 3,
    "xp": 120,
    "max_xp": 144,
    "gold": 250,
    "hp": 90,
    "max_hp": 100,
    "stat_strength_level": 2,
    "stat_strength_xp": 0,
    "stat_wisdom_level": 1,
    "stat_wisdom_xp": 0,
    "stat_endurance_level": 1,
    "stat_endurance_xp": 4,
    "stat_charisma_level": 1,
    "stat_charisma_xp": 0
  },
  "reward": {
    "xp": 100,
    "gold": 50
  },
  "stat_gain": {
    "name": "endurance",
    "xp_gained": 4,
    "leveled_up": false,
    "new_level": 1
  }
}
```

**Legacy quest (category=NULL):** `"stat_gain": null` — no error raised.

---

## Smoke Test Notes

No live /analyze call was attempted (requires running backend + valid OpenRouter key). The AI hint (rule 4) is a soft suggestion — model may or may not honor it per RESEARCH.md Pitfall 4. Functional correctness is verified via the pytest suite.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Task 2 combined with Task 1 GREEN commit**

- **Found during:** Task 2 execution
- **Issue:** Plan specified Task 2 as a separate `type="auto"` (non-TDD). The test for the prompt string was written as part of the Task 1 test file (test_analyze_prompt_contains_stat_block), making both tasks verifiable from the same test run.
- **Fix:** Both changes (Task 1 router logic + Task 2 prompt extension) committed in a single GREEN commit after all 8 tests passed.
- **Files modified:** backend/app/routers/quests.py
- **Commit:** cb33dd3

---

## Self-Check: PASSED

Files confirmed on disk:
- FOUND: backend/tests/test_quests_router.py
- FOUND: backend/app/routers/quests.py (modified)

Commits confirmed in git log:
- 52b4b4f: test(04-02): add failing tests for quests router stat gain + prompt extensions
- cb33dd3: feat(04-02): extend quests router with stat gain, category persistence, and analyze prompt
