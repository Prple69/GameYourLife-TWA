# Codebase Concerns

**Analysis Date:** 2026-03-01

## Tech Debt

**Hardcoded API Base URLs:**
- Issue: Backend URL is hardcoded in two locations (`App.jsx` and `api.js`), making environment-specific deployment difficult. Currently points to Cloudflare tunnel URL that changes on restart.
- Files: `frontend/src/App.jsx:13`, `frontend/src/services/api.js:8`, `backend/app/database.py:7`
- Impact: Manual configuration required for every deployment. Easy to accidentally push development URLs to production. Database connection string hardcoded with credentials visible in code.
- Fix approach: Move all URLs to environment variables. Create separate config files or `.env` pattern. Update CI/CD to inject environment-specific values.

**Database Credentials in Source Code:**
- Issue: PostgreSQL credentials embedded directly in `database.py` connection string: `postgresql+asyncpg://postgres:purple666@127.0.0.1:5432/game_db`
- Files: `backend/app/database.py:7`
- Impact: **Critical security risk**. Anyone with access to repo can connect to production database. Password "purple666" is visible in git history.
- Fix approach: Move credentials to `.env` file immediately. Use environment variables with `os.getenv()`. Never commit credentials.

**Debug Mode Left Enabled:**
- Issue: `DEBUG_MODE = true` hardcoded in `QuestsPage.jsx`, displays "DEBUG ACTIVE" in header. Component shows random fallback AI responses when API fails.
- Files: `frontend/src/pages/QuestsPage.jsx:8`, `frontend/src/pages/QuestsPage.jsx:107`, `frontend/src/pages/QuestsPage.jsx:156`
- Impact: Production frontend advertises debug status. Users get unreliable quest difficulty estimates when AI service fails.
- Fix approach: Move debug flag to environment variable or feature flag service. Implement proper error UI instead of silent fallback to random values.

**Inconsistent API Service Definition:**
- Issue: `questService` object in `api.js` references undefined variable `API_URL` and is never used. Also uses deprecated `fetch` while other code uses `axios`.
- Files: `frontend/src/services/api.js:57-78` (questService.getQuests, questService.verifyQuest)
- Impact: Dead code creates maintenance burden. If questService is needed, it will break at runtime due to undefined `API_URL`.
- Fix approach: Either remove `questService` entirely or implement it properly with axios like `userService`. Delete unused code.

**Tunnel URL Management Problem:**
- Issue: Comment in `api.js` acknowledges the Cloudflare tunnel URL changes on restart and suggests using environment variables, but this is never implemented.
- Files: `frontend/src/services/api.js:3-7`
- Impact: Every tunnel restart requires manual code updates. Blocks automation of deployment process.
- Fix approach: Implement URL loading from environment variables or configuration server before app initialization.

## Known Bugs

**Undefined Variable in Quest Service:**
- Symptoms: If `questService.getQuests()` or `questService.verifyQuest()` is called, app crashes with "API_URL is not defined"
- Files: `frontend/src/services/api.js:61`, `frontend/src/services/api.js:71`
- Trigger: Call `questService.getQuests(userId)` from any component
- Workaround: Don't use questService. The service is defined but never called; it appears to be legacy code.

**Image Loading Failures Not Shown to User:**
- Symptoms: If image fails to load, error is caught but user never sees loading error state. App just shows 0% progress on load screen.
- Files: `frontend/src/App.jsx:84` (img.onerror silently rejects)
- Trigger: Load page with broken image asset paths
- Workaround: Currently handled by catch-all error handler, but error message shows "IMG_F" which is not user-friendly

**Timezone Inconsistency in Deadline Comparison:**
- Symptoms: Quest deadline comparison may fail if user device timezone differs from MSK. Date validation in `AddTaskModal` uses local device time, deadline comparison uses MSK.
- Files: `frontend/src/components/AddTaskModal.jsx:8-11` (local time), `backend/app/crud.py:123` (MSK time)
- Trigger: User in timezone other than UTC+3 tries to set quest deadline
- Workaround: None. Needs consistent timezone handling throughout.

**Silent Failure on Quest Completion:**
- Symptoms: If quest completion fails, user sees no error feedback. Task is removed from UI optimistically but if save fails, quest is silently lost.
- Files: `frontend/src/pages/QuestsPage.jsx:137-146` (finalizeTask doesn't check response status)
- Trigger: Complete quest while server is down
- Workaround: Server error is logged but never shown to user

## Security Considerations

**Hardcoded API Key and Missing Auth:**
- Risk: Backend accepts requests from any origin (CORS allows "*" methods/headers). No API key validation on endpoints except implicit trust in telegram_id parameter.
- Files: `backend/app/main.py:36-46` (CORSMiddleware with overly permissive settings), `backend/app/main.py:22-27` (OPENAI_API_KEY loaded from .env but not validated)
- Current mitigation: CORS only allows 3 specific origins (good), but allows all methods and headers. Telegram ID is passed as query param without validation.
- Recommendations:
  1. Validate telegram_id with Telegram Bot API or cryptographic signature
  2. Restrict CORS allow_methods to only ["GET", "POST", "OPTIONS"]
  3. Restrict allow_headers to specific required headers only
  4. Add request signing or JWT tokens for authenticated endpoints

**Unauthorized Quest/User Modifications:**
- Risk: User can pass any `tg_id` as query parameter to complete another user's quests or modify their avatar. No server-side verification that user owns the resource.
- Files: `backend/app/main.py:140`, `backend/app/main.py:162` (tg_id taken from request without validation)
- Current mitigation: Database query includes user_id foreign key check, but only after quest lookup
- Recommendations: Validate telegram_id matches authenticated user before any state change. Extract user identity from signed request context, not from query params.

**OpenAI API Key Exposure:**
- Risk: Key is loaded from `.env` but could be logged, exposed in error messages, or visible in environment.
- Files: `backend/app/main.py:22`
- Current mitigation: Key is not logged directly, passed to OpenAI client which handles it securely
- Recommendations: Add secret masking in all logs. Consider using separate API key per environment. Rotate key if ever logged.

**No Input Validation on Quest Titles:**
- Risk: User-provided quest title is passed directly to AI prompt and database without sanitization. Could enable prompt injection or SQL injection (though SQLAlchemy parameterization helps).
- Files: `frontend/src/pages/QuestsPage.jsx:95-100` (title sent to /api/analyze), `backend/app/main.py:57` (title used in f-string prompt)
- Current mitigation: SQLAlchemy uses parameterized queries for database. Prompt injection is possible but limited impact.
- Recommendations: Sanitize/validate quest title length and content. Use templating instead of f-strings for AI prompts to prevent injection.

## Performance Bottlenecks

**Synchronous Image Loading on App Startup:**
- Problem: All images are loaded sequentially in Promise.all but each Image() call waits for img.onload. If there are many assets, loading is slow.
- Files: `frontend/src/App.jsx:79-86` (imagePromises loop), `frontend/src/App.jsx:89` (Promise.all waits for all)
- Cause: Image elements are created but there's no parallelization beyond the Promise. Browser only loads a limited number concurrently.
- Improvement path: Preload images with rel="preload" link tags in index.html instead of JavaScript. Or use Image.decode() API if available.

**Re-render Loop in QuestsPage Due to Visual Tick:**
- Problem: `visualTick` state updates every 300ms, causing entire QuestsPage to re-render to animate difficulty color during analysis.
- Files: `frontend/src/pages/QuestsPage.jsx:39-42` (setInterval), `frontend/src/pages/QuestsPage.jsx:73` (visualTick % 4)
- Cause: Interval runs regardless of whether any task is actually analyzing. All tasks re-render on tick.
- Improvement path: Move visualTick state and animation to separate RollingValue component or use CSS animation. Only animate when isAnalyzing is true.

**All Tasks Re-render on Quest List Change:**
- Problem: `QuestsPage` renders full task list even when only one task completes. No key-based memoization of task items.
- Files: `frontend/src/pages/QuestsPage.jsx:159-194` (tasks.map without optimized rendering)
- Cause: React doesn't have access to stable identifiers. Task ID is used as key but entire component tree updates.
- Improvement path: Extract task item into separate memoized component. Use React.memo with proper prop comparison.

**AI Fallback is Too Frequent:**
- Problem: If OpenRouter AI service is down, fallback generates random values. No retry mechanism or graceful degradation message.
- Files: `backend/app/main.py:111-120` (catch-all returns random fallback)
- Cause: Single exception handler doesn't differentiate between timeout, auth failure, or malformed response
- Improvement path: Implement retry logic with exponential backoff. Return specific error codes so frontend can inform user.

## Fragile Areas

**Quest Analysis AI Integration:**
- Files: `backend/app/main.py:50-120` (analyze_task endpoint)
- Why fragile: Depends on OpenRouter API returning valid JSON. Uses regex to clean markdown formatting from response. If API changes response format, entire feature breaks.
- Safe modification: Add unit tests for JSON parsing. Add type validation on response. Consider using structured outputs or tool_choice if API supports it.
- Test coverage: No tests found for analyze_task. Untested fallback path.

**Avatar Asset Mapping:**
- Files: `frontend/src/App.jsx:24-30` (assetNamingMap), `frontend/src/pages/CharacterPage.jsx:14` (avatarMap)
- Why fragile: Map is manually maintained and must match asset filenames exactly. If assets are renamed or new avatars added, map breaks silently.
- Safe modification: Generate map automatically from asset imports using Object.entries(import.meta.glob). Add test to verify all mapped avatars exist.
- Test coverage: No validation that all avatars in AVATARS array have corresponding image imports.

**User Creation Auto-Registration:**
- Files: `backend/app/main.py:125-134` (get_profile auto-creates user)
- Why fragile: Any request with a new tg_id automatically creates a user account. No validation of Telegram ID format or legitimacy.
- Safe modification: Validate telegram_id format (numeric string). Optionally add verification step or admin approval for user creation.
- Test coverage: No tests for user creation logic.

**Database Transaction Handling:**
- Files: `backend/app/database.py:25-34` (get_db), `backend/app/crud.py` (all create/update functions)
- Why fragile: Each CRUD function assumes db.commit() will succeed. If commit fails, partial state is left in database. Rollback in except catches all exceptions uniformly.
- Safe modification: Add explicit transaction boundaries. Handle constraint violations differently from other errors. Add integration tests that test failure cases.
- Test coverage: No integration tests found.

## Scaling Limits

**Single AI Service with No Fallback:**
- Current capacity: OpenRouter API rate limits (check their docs, likely 100-1000 req/min)
- Limit: If OpenRouter is down or rate-limited, all new quests fail. User sees "ERROR" or fallback random values.
- Scaling path: Implement queue system for analysis requests. Fall back to local heuristic (simple rule-based difficulty assignment). Cache results for identical quest titles.

**No Database Connection Pooling Configuration:**
- Current capacity: AsyncSessionLocal has default pool settings (pool_size=5, max_overflow=10)
- Limit: At ~15 concurrent users, database connection pool exhausts. Additional users get "connection pool timeout"
- Scaling path: Configure pool_size and max_overflow based on expected concurrency. Monitor with APM. Consider read replicas for get_quests calls.

**Memory Usage from Asset Blob URLs:**
- Current capacity: All video files loaded as Blob URLs on startup, kept in memory for session
- Limit: If video files are large (>50MB total), browser memory usage becomes excessive on mobile
- Scaling path: Load videos on-demand per page. Implement LRU cache for recently viewed videos. Use video streaming instead of full preload.

**No Request Rate Limiting:**
- Current capacity: Unlimited requests per user
- Limit: Malicious user can spam quest creation or completion endpoints
- Scaling path: Implement rate limiting middleware. E.g., max 5 quests per hour, max 10 completions per hour per user.

## Fragile Areas - Continued

**State Synchronization Between Frontend and Backend:**
- Files: Across `frontend/src/pages/QuestsPage.jsx` and `backend/app/crud.py`
- Why fragile: Frontend optimistically updates UI (removes task immediately on completion) while POST request is in flight. If server fails, task is gone from UI but not from database.
- Safe modification: Use optimistic updates but keep local copy of state. Implement UI toast/snackbar for failures. Add sync/reconciliation mechanism on page reload.
- Test coverage: No tests for error recovery.

**Character Stats Multipliers with No Limits:**
- Files: `backend/app/models.py:38-39` (xp_multiplier, gold_multiplier), `backend/app/crud.py:46-65` (add_reward applies multipliers)
- Why fragile: Multipliers have no bounds checking. If multiplier is set to 1000, single quest reward becomes enormous, breaking game balance.
- Safe modification: Add constraints: 0.1 <= multiplier <= 10. Validate in update endpoint. Log changes to multipliers.
- Test coverage: No validation tests.

## Dependencies at Risk

**OpenRouter AI Service:**
- Risk: This service is critical for quest difficulty analysis. No alternative AI provider is configured.
- Impact: If OpenRouter goes down or increases pricing significantly, entire feature is affected.
- Migration plan: Implement fallback to local heuristic (rule-based difficulty based on keywords and deadline). Support multiple AI providers (OpenAI, Anthropic, local LLM).

**Cloudflare Tunnel for Backend Connectivity:**
- Risk: Backend is only accessible through Cloudflare tunnel. If tunnel is misconfigured or Cloudflare has outage, app cannot reach backend.
- Impact: App completely non-functional without backend connectivity.
- Migration plan: Set up proper domain/DNS. Use direct server IP for fallback. Implement client-side caching of user data.

## Missing Critical Features

**No User Authentication/Authorization:**
- Problem: Telegram WebApp provides user_id but there's no cryptographic verification that it's legitimate. Anyone knowing a user's telegram_id can impersonate them.
- Blocks: Cannot safely handle user data. Cannot prevent account takeover.
- Priority: **High** - Must be implemented before production launch

**No User Session Management:**
- Problem: User state is loaded once on app startup. No refresh mechanism if user logs out and logs back in.
- Blocks: Cannot support logout feature. Cannot handle user updates from other sessions.
- Priority: **High**

**No Data Persistence/Sync Across Sessions:**
- Problem: If user closes and reopens app, UI must refetch all data from server. No offline support.
- Blocks: Cannot support offline mode. Poor UX on slow connections.
- Priority: **Medium**

**No Admin Panel or Moderation Tools:**
- Problem: No way to view/modify user data without direct database access. Cannot investigate user issues or adjust game balance.
- Blocks: Cannot support users. Cannot make hotfixes.
- Priority: **Medium**

**No Analytics or Monitoring:**
- Problem: No logs of when features are used, no error tracking beyond console.error. No performance monitoring.
- Blocks: Cannot understand user behavior or debug issues in production.
- Priority: **Medium**

## Test Coverage Gaps

**Backend API Endpoints Not Tested:**
- What's not tested: All endpoints in `backend/app/main.py` (analyze, get_profile, update_avatar, save_quest, complete_quest, get_quests, get_history, check_status)
- Files: `backend/app/main.py`
- Risk: Regressions go undetected. Error handling paths untested. Database errors cause crashes.
- Priority: **High**

**CRUD Operations Not Tested:**
- What's not tested: User creation, quest creation, quest completion with multipliers, failed quest detection, XP calculations
- Files: `backend/app/crud.py`
- Risk: Game logic bugs (e.g., level-up calculation) discovered only in production
- Priority: **High**

**Frontend Component Rendering Not Tested:**
- What's not tested: Modal components, quest list rendering, character page state changes
- Files: `frontend/src/components/*`, `frontend/src/pages/*`
- Risk: UI bugs (layout breaks, missing data display) discovered by users
- Priority: **Medium**

**Error Scenarios Not Tested:**
- What's not tested: Network failures, AI service failures, database constraint violations, concurrent modifications
- Files: All async operations throughout codebase
- Risk: Crashes and silent failures in edge cases
- Priority: **High**

**AI Prompt Injection Not Tested:**
- What's not tested: Malicious quest titles that could break JSON parsing or prompt structure
- Files: `backend/app/main.py:50-120`
- Risk: App crashes or returns invalid data if user enters certain characters
- Priority: **Medium**

---

*Concerns audit: 2026-03-01*
