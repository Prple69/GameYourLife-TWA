# Phase 1: Secure Foundation - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Protect the backend from identity spoofing and externalize credentials. Two deliverables: (1) Telegram initData cryptographic signature validation on backend endpoints, (2) move hardcoded DB password and API keys to environment variables.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- Endpoint coverage (all vs. write-only validation)
- Dev mode handling (bypass flag or always validate)
- Git history cleanup approach
- Error UX on auth failure
- All implementation details

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<code_context>
## Existing Code Insights

### Hardcoded Credentials (to fix)
- `backend/app/database.py:7` — PostgreSQL connection string with password `purple666` hardcoded
- `backend/app/main.py` — OPENAI_API_KEY already loaded via `os.getenv()` (good pattern to follow)

### Current Auth Pattern (to replace)
- `frontend/src/App.jsx` — extracts `tg_id` from `window.Telegram.WebApp.initDataUnsafe.user.id`
- `backend/app/main.py` — accepts `tg_id` as query param with zero verification (implicit trust)
- No initData passed to backend at all currently

### Integration Points
- All 8 API endpoints in `backend/app/main.py` receive `tg_id` as param — validation must integrate here
- Frontend `frontend/src/services/api.js` makes all API calls — initData forwarding would need to be added here

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-secure-foundation*
*Context gathered: 2026-03-01*
