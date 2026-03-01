# Game Your Life

## What This Is

Game Your Life is a Telegram mini-app RPG that turns real-life tasks into quests. Users create goals, an AI engine assigns difficulty and rewards, and completing quests earns XP, gold, and character progression. Targeted at gamers who want to be more productive — it uses the mechanics they love (leveling, loot, guilds) to motivate real-world action.

## Core Value

Completing a real-life task feels like progressing a character — the RPG loop must always feel rewarding, never like a chore tracker with a skin.

## Requirements

### Validated

<!-- Shipped and confirmed working in existing codebase. -->

- ✓ User gets a character profile initialized from Telegram identity — existing
- ✓ User can create a quest with title and deadline — existing
- ✓ AI analyzes quest and assigns difficulty, XP, gold, and HP penalty — existing
- ✓ User can complete a quest and receive XP and gold rewards — existing
- ✓ User levels up when XP reaches threshold (scales 1.2x per level) — existing
- ✓ User can select a character avatar — existing
- ✓ Quests auto-fail and apply HP penalty when deadline passes — existing
- ✓ Quest history (completed/failed) is tracked and retrievable — existing

### Active

<!-- Current build goals — hypotheses until shipped and validated. -->

- [ ] User can browse a shop and purchase items with earned gold
- [ ] User can view and manage their inventory of owned items
- [ ] Purchased items apply stat bonuses (XP multiplier, gold multiplier, HP regen)
- [ ] Leaderboard shows real rankings of users by level and XP
- [ ] User can add friends and see their quest activity
- [ ] AI can propose daily quests based on user's character stats and history
- [ ] Character has named stats (Strength, Wisdom, Endurance, Charisma) that grow through relevant quest types
- [ ] Security: Telegram initData signature verified server-side (no spoofable tg_id)
- [ ] Database credentials and API keys moved to environment variables

### Out of Scope

<!-- Explicit exclusions with reasoning. -->

- Native iOS/Android app — web-first; Telegram covers mobile
- Real-money payments / premium subscriptions — keep free for v1, no payment complexity
- Web access outside Telegram — purpose-built for the Telegram ecosystem
- Custom quest categories or tags — YAGNI for v1, simplify to free-form

## Context

The codebase is a working prototype with the core quest loop functional. Frontend is React 19 + Vite + Tailwind, deployed on Vercel. Backend is FastAPI (Python) + SQLAlchemy async + PostgreSQL. AI analysis runs via OpenRouter (OpenAI-compatible client). Telegram integration uses @twa-dev/sdk.

Known issues to address in early phases:
- DB credentials hardcoded in `backend/app/database.py` (critical: visible in git)
- `DEBUG_MODE = true` left enabled in `QuestsPage.jsx`
- Dead code: `questService` in `api.js` references undefined `API_URL`
- No server-side Telegram auth validation — any tg_id can be spoofed
- Timezone inconsistency between frontend (local) and backend (MSK)

## Constraints

- **Platform**: Telegram Mini App (TWA) — all UI must work inside Telegram mobile client
- **Tech Stack**: React + FastAPI + PostgreSQL already committed; no full rewrites
- **AI Provider**: OpenRouter API (already integrated) — not switching to direct OpenAI
- **Deployment**: Frontend on Vercel, backend on self-hosted server with Cloudflare Tunnel
- **Auth**: Telegram initData as sole identity mechanism — no separate account system

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| OpenRouter for AI analysis | Cost flexibility, multi-model access | — Pending |
| Implicit Telegram auth (initDataUnsafe) | Speed of initial prototype | ⚠️ Revisit — security risk, needs signature verification |
| Lifted state in App.jsx (no Redux/Zustand) | Simplicity for small app | — Pending |
| MSK timezone for all backend timestamps | Single-region initial target | ⚠️ Revisit — breaks users outside UTC+3 |

---
*Last updated: 2026-03-01 after initialization*
