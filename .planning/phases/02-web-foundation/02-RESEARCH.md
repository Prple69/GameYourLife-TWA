# Phase 2: Web Foundation - Research

**Researched:** 2026-04-18
**Domain:** React Router v6 + Zustand + TanStack Query v5 / SPA migration, responsive layout, landing/legal pages, TWA SDK removal
**Confidence:** HIGH for routing & state patterns, MEDIUM for cookie compliance details

## Summary

Phase 2 transforms the Telegram Mini App (TWA) frontend into a standard web application. This requires:

1. **Routing architecture:** React Router v6 with protected routes, nested layouts, lazy-loading
2. **State management:** Zustand for client state (auth/user/consent) + TanStack Query v5 for server state
3. **Layout responsiveness:** Desktop sidebar (lg: 1024px+) / mobile bottom-tabs, retro aesthetic preserved
4. **Public surfaces:** Landing page with hero/demo/features/pricing/FAQ/footer, legal pages (/privacy, /terms, /public-offer)
5. **TWA SDK removal:** Delete script tag, @twa-dev/sdk dependency, all `window.Telegram.WebApp` references
6. **Cookie consent:** Separate banner (152-ФЗ compliant Sep 2025+ required separate consent from other terms)
7. **Environment configuration:** VITE_API_BASE_URL via .env, fallback to localhost:8000

**Primary recommendation:** Use React Router v6 with nested route structure; Zustand with persist middleware for tokens; TanStack Query v5 with reasonable defaults (staleTime 30s, retry 1); mock auth on Phase 2 (defer JWT to Phase 3); implement responsive breakpoint at lg (1024px).

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Routing:** React Router v6 only (no file-based routing, no alternatives)
- **State:** Zustand + TanStack Query v5 (axios interceptors bearerToken mock)
- **Breakpoint:** lg (1024px) — desktop sidebar / mobile bottom-tabs
- **Retro aesthetic:** Press Start 2P for H1/H2/numbers, mono for body text, NES.css retained for rasters, gold + black palette
- **Landing structure:** Hero → Demo → Features 2x2 → Pricing → FAQ → Footer
- **Legal pages:** /privacy (152-ФЗ), /terms (user agreement), /public-offer (ЮKassa template)
- **Cookie banner:** Required on first visit, separate from TOS per Sep 2025 law change
- **Deletion:** Remove `<script telegram-web-app.js>` from index.html, `@twa-dev/sdk` from package.json, all `window.Telegram.WebApp` code
- **Environment:** VITE_API_BASE_URL env var; harcoded `gameurlife.ru.tuna.am` removed

### Claude's Discretion

- Cookie library choice: react-cookie-consent vs custom ~50 lines
- Landing page copy/tone: retro-game language ("Прими квест", "Получи лут", "Качай персонажа")
- Lazy-loading scope: /app/* mandatory, legal pages optional
- QueryClient defaults: staleTime, retry, gcTime values
- useMediaQuery hook: implement custom ~10 lines vs library
- Persist: save old video-loading progress bar feature or skip

### Deferred Ideas (OUT OF SCOPE)

- Real auth (JWT, email/password, Telegram Login Widget) → Phase 3
- Backend changes → Phase 3
- Character stats, shop, inventory details → Phase 4+
- Friends, guilds, social → Phase 8-9
- Monetization (gems, ЮKassa integration) → Phase 10

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WEB-01 | Site opens in any browser without Telegram SDK or container | React Router v6 SPA pattern; remove TWA script + @twa-dev/sdk; mock auth (Phase 2 acceptable) |
| WEB-02 | Each screen has own URL; navigation via address bar; bookmarks work | React Router v6 routes: `/` (landing), `/app/quests`, `/app/character`, `/app/shop`, `/app/inventory`, `/app/leaderboard`, `/privacy`, `/terms`, `/public-offer`, `/login`, `/register`, `/verify-email/:token`, `/reset-password` |
| WEB-03 | Responsive layout: desktop (≥1024px) sidebar nav; mobile (<1024px) bottom-tabs; retro aesthetic preserved | Tailwind lg: breakpoint; useMediaQuery hook or library; reuse existing Navigation component for mobile; new Sidebar + AppLayout for desktop |
| LEGAL-01 | Public landing on `/` with hero/demo/features/pricing/FAQ/footer | 6-section component hierarchy; retro styling with Press Start 2P headers; responsive grid layouts |
| LEGAL-02 | Pages `/privacy`, `/terms`, `/public-offer` with 152-ФЗ content | Template approach: provide reference links (not written legal text), use placeholder company details (ИНН/ОГРН/email marked TODO) |
| LEGAL-03 | Cookie consent banner on first visit; stores choice in localStorage | react-cookie-consent library OR custom component; checks localStorage.cookieConsent !== 'accepted' to show |
| LEGAL-04 | Footer links to legal pages + email + social placeholders | Present on landing + inside /app layout footer |

</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router-dom | ^6.x | Client-side routing, nested layouts, protected routes | v6 standard for modern React SPA; stable, well-documented, replaced useHistory patterns |
| zustand | ^4.x | Client state (auth, user, consent) + persist to localStorage | Minimal boilerplate, excellent TypeScript support, perfect for small stores + middleware |
| @tanstack/react-query | ^5.x | Server state (user profile, quests, leaderboard) | v5 is latest stable; replaces old useEffect + useState patterns; excellent cache management, invalidation |
| axios | ^1.13.5 (existing) | HTTP client with interceptors for Bearer token | Already in use; supports middleware for auth header injection |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-cookie-consent | ^1.x | GDPR/152-ФЗ cookie banner | Lightweight (unminified ~15KB), customizable styling, localStorage integration built-in; alternative: custom ~50-line component |
| lucide-react | ^0.574.0 (existing) | Icons for nav, landing features | Already used; consistent with retro styling via CSS tweaks |
| framer-motion | ^12.34.1 (existing) | Subtle animations (fade in/scale on landing) | Avoid LCP blocking on landing; keep animations post-interaction |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Router v6 | TanStack Router / Remix | v6 is established SPA standard; TanStack Router adds file-based benefits but unnecessary for SPA; locked decision |
| Zustand | Redux / Recoil / Pinia | Redux too verbose for small stores; Zustand zero-dependency, smallest bundle; locked decision |
| TanStack Query v5 | SWR / RTK Query | v5 latest & stable; RTK requires Redux setup; locked decision |
| react-cookie-consent | Custom component | Custom offers full control, ~50 lines boilerplate; library saves setup time & handles accessibility |

**Installation (Phase 2 additions):**
```bash
npm install react-router-dom@^6 zustand@^4 @tanstack/react-query@^5 react-cookie-consent@^1
npm remove @twa-dev/sdk
```

---

## Architecture Patterns

### Recommended Project Structure

```
frontend/
├── src/
│   ├── main.jsx                    # QueryClientProvider + BrowserRouter wrapper
│   ├── App.jsx                     # Routes definition (no tab-state, pure routing)
│   ├── index.css                   # Global styles, @tailwind imports
│   ├── stores/
│   │   ├── authStore.js            # { accessToken, refreshToken, setTokens, clearTokens, isAuthenticated }
│   │   ├── userStore.js            # { user, setUser, clearUser }
│   │   └── cookieConsentStore.js   # { cookieConsent, setCookieConsent }
│   ├── hooks/
│   │   └── useMediaQuery.js         # Custom hook: (min-width: 1024px) check
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx        # Desktop: Sidebar + Outlet; Mobile: Outlet + Navigation
│   │   │   ├── Sidebar.jsx          # Fixed left nav, 256px wide, lg: only
│   │   │   ├── ProtectedRoute.jsx   # Wraps /app routes, checks authStore.isAuthenticated
│   │   │   └── NotFound.jsx         # 404 page
│   │   ├── CookieConsentBanner.jsx  # Bottom banner, localStorage integration
│   │   ├── Navigation.jsx           # Existing mobile bottom-tabs (reused)
│   │   └── [other existing]
│   ├── pages/
│   │   ├── landing/
│   │   │   ├── LandingPage.jsx      # Main /
│   │   │   ├── HeroSection.jsx      # H1 Press Start 2P, 2 CTA buttons
│   │   │   ├── DemoSection.jsx      # Quest preview card example
│   │   │   ├── FeaturesSection.jsx  # 2x2 grid (4 feature cards)
│   │   │   ├── PricingSection.jsx   # 3 gem packs (placeholder prices)
│   │   │   ├── FAQSection.jsx       # 5-7 accordion items
│   │   │   └── FooterSection.jsx    # Logo, legal links, email, socials placeholder
│   │   ├── legal/
│   │   │   ├── PrivacyPage.jsx      # /privacy, 152-ФЗ template
│   │   │   ├── TermsPage.jsx        # /terms, user agreement
│   │   │   └── OfferPage.jsx        # /public-offer, ЮKassa ofera
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx        # /login, shell form (no backend until Phase 3)
│   │   │   ├── RegisterPage.jsx     # /register, shell form
│   │   │   ├── VerifyEmailPage.jsx  # /verify-email/:token, shell
│   │   │   └── ResetPasswordPage.jsx# /reset-password, shell
│   │   ├── NotFoundPage.jsx         # /*, 404
│   │   ├── CharacterPage.jsx        # Existing, lazy-loaded
│   │   ├── QuestsPage.jsx           # Existing, lazy-loaded
│   │   ├── ShopPage.jsx             # Existing, lazy-loaded
│   │   ├── InventoryPage.jsx        # Existing, lazy-loaded
│   │   ├── LeaderboardPage.jsx      # Existing, lazy-loaded
│   │   └── LoadingPage.jsx          # Existing, used in initial app load or lazy fallback
│   ├── services/
│   │   └── api.js                   # axios instance with Bearer interceptor (mock token Phase 2)
│   ├── assets/
│   │   ├── icons/                   # Existing icon set
│   │   ├── *.mp4                    # Video assets (mobile only, not desktop)
│   │   └── *.{png,jpg,gif}          # Image assets
│   └── .env.example                 # VITE_API_BASE_URL=http://localhost:8000/api
├── index.html                       # Remove <script telegram-web-app.js>, keep NES.css + Press Start 2P
├── package.json                     # Updated deps
└── vite.config.js                   # (no changes expected)
```

### Pattern 1: React Router v6 Nested Route Structure

**What:** Routes organized by layout: public (landing, legal, auth shells) vs protected (/app/*). Nested route config allows sibling routes to share layout without duplication.

**When to use:** SPA where different sections have different layouts (landing has simple footer layout, /app has sidebar+header layout).

**Example:**
```jsx
// src/App.jsx — Source: React Router v6 docs (https://reactrouter.com/en/main/start/overview)
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LandingPage from './pages/landing/LandingPage';
import PrivacyPage from './pages/legal/PrivacyPage';
import LoginPage from './pages/auth/LoginPage';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoadingPage from './pages/LoadingPage';

// Lazy-loaded app pages
const CharacterPage = lazy(() => import('./pages/CharacterPage'));
const QuestsPage = lazy(() => import('./pages/QuestsPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} /> {/* shell form */}
      <Route path="/verify-email/:token" element={<LoginPage />} /> {/* shell */}
      <Route path="/reset-password" element={<LoginPage />} /> {/* shell */}
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/public-offer" element={<OfferPage />} />

      {/* Protected routes with AppLayout */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="character"
          element={
            <Suspense fallback={<LoadingPage />}>
              <CharacterPage />
            </Suspense>
          }
        />
        <Route
          path="quests"
          element={
            <Suspense fallback={<LoadingPage />}>
              <QuestsPage />
            </Suspense>
          }
        />
        <Route
          path="shop"
          element={
            <Suspense fallback={<LoadingPage />}>
              <ShopPage />
            </Suspense>
          }
        />
        <Route
          path="inventory"
          element={
            <Suspense fallback={<LoadingPage />}>
              <InventoryPage />
            </Suspense>
          }
        />
        <Route
          path="leaderboard"
          element={
            <Suspense fallback={<LoadingPage />}>
              <LeaderboardPage />
            </Suspense>
          }
        />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
```

### Pattern 2: Zustand with Persist Middleware

**What:** Zustand stores with persist middleware auto-save to localStorage and hydrate on app boot.

**When to use:** Auth tokens, user preferences, cookie consent — data that survives page reload.

**Example:**
```javascript
// src/stores/authStore.js — Source: Zustand docs (https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setTokens: (access, refresh) =>
        set({
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: !!access,
        }),

      clearTokens: () =>
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }), // only persist tokens, not methods
    }
  )
);

export default useAuthStore;
```

### Pattern 3: TanStack Query v5 Setup

**What:** QueryClient with sensible defaults; wrapped at root level via QueryClientProvider; useQuery hooks replace userService.getProfile() calls.

**When to use:** Server state (user profile, quest data, leaderboard) that needs sync with backend.

**Example:**
```jsx
// src/main.jsx — Source: TanStack Query docs (https://tanstack.com/query/latest/docs/reference/QueryClient)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import CookieConsentBanner from './components/CookieConsentBanner';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds: data fresh for 30s, no bg refetch
      gcTime: 1000 * 60 * 5, // 5 minutes: cached data discarded after 5min of no use
      retry: 1, // retry failed queries once
      refetchOnWindowFocus: true, // refetch when user returns to tab
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <CookieConsentBanner />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
```

### Pattern 4: ProtectedRoute Wrapper

**What:** Higher-order component checks isAuthenticated (from Zustand); redirects to /login with ?returnTo= query param if not authed; renders Outlet if authed.

**When to use:** Wrapping /app routes to prevent unauthenticated access.

**Example:**
```jsx
// src/components/layout/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, preserving intended destination
    return <Navigate to={`/login?returnTo=${location.pathname}`} replace />;
  }

  return children;
}
```

### Anti-Patterns to Avoid

- **Multiple BrowserRouter instances:** Wrap App once at root (main.jsx), not per route
- **Forgetting Outlet in nested layout:** AppLayout must have `<Outlet />` for child routes to render
- **Mixing old tab-state with React Router:** Remove activeTab useState from App.jsx; use `useLocation()` hook instead for current route
- **Synchronous data fetch in route render:** Use `useQuery` with Suspense or error boundary, not fetch() in useEffect
- **Storing tokens in non-persist Zustand:** Always wrap with persist middleware; tokens lost on refresh otherwise
- **Query staleTime = 0 for expensive data:** Tune staleTime to avoid unnecessary refetches; 30-60s typical for user profile
- **Not wrapping lazy routes in Suspense:** Each lazy route needs individual `<Suspense fallback={<LoadingPage />}>`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Client-side routing, nested layouts | Custom route matcher | React Router v6 | Re-inventing navigation is error-prone (query params, redirects, history); v6 is battle-tested standard |
| Auth token storage + hydration | localStorage.setItem + useState | Zustand persist middleware | Manual localStorage serialization causes race conditions on page load; middleware handles hydration order |
| Server state caching + invalidation | fetch() + useState + useEffect | TanStack Query v5 | Manual cache busting is fragile; Query handles stale-while-revalidate, background refetch, garbage collection |
| Cookie consent + localStorage | document.cookie + manual flag | react-cookie-consent library | Cookie handling is complex (domain, path, expiry); library is 152-ФЗ audited |
| Media query detection | `window.matchMedia + useState + listener` | useMediaQuery hook (~10 lines) or library | Hook avoids boilerplate; library adds minor bundle size |

**Key insight:** React Router, Zustand, TanStack Query are not heavy frameworks — they are micro-libraries solving specific hard problems (navigation, persistence, cache). Custom solutions end up larger and less reliable.

---

## Common Pitfalls

### Pitfall 1: Tab-State Regression After Router Migration

**What goes wrong:** Removing `activeTab` useState from App.jsx to switch to React Router breaks existing user experience — users lose tab position on back-button, bookmarks don't work, page reloads reset to first tab.

**Why it happens:** Old code uses mutable state to track UI state; Router uses URL as source-of-truth. Forgetting to map all tab paths to routes leaves dead routes.

**How to avoid:**
1. **Map all tab IDs to routes:** inventory → /app/inventory, shop → /app/shop, camp → /app/character (map tab ID "camp" to character route)
2. **Test back-button:** Browser back/forward should navigate routes, not just change UI state
3. **Test bookmarks:** Copy URL from address bar, paste in new tab — should land on same page
4. **Test page reload:** Press F5 on /app/shop — should stay on shop, not reset to default

**Warning signs:** `useLocation().pathname === '/app/quests'` to determine activeTab; if you still see setState(activeTab), refactor incomplete.

### Pitfall 2: Lazy-Loading Waterfall with No Suspense Fallback

**What goes wrong:** Routes are lazy-loaded but no Suspense fallback specified; users see blank page while chunk downloads (10-50ms on 3G).

**Why it happens:** Copy-paste React.lazy() without wrapping in Suspense; misunderstanding that lazy requires async boundary.

**How to avoid:**
```jsx
// WRONG: blank page during load
const QuestsPage = lazy(() => import('./pages/QuestsPage'));
<Route path="quests" element={<QuestsPage />} /> // ERROR: no Suspense

// CORRECT: shows fallback
<Route
  path="quests"
  element={
    <Suspense fallback={<LoadingPage />}>
      <QuestsPage />
    </Suspense>
  }
/>
```

**Warning signs:** User sees blank white screen for 100ms+ when navigating to lazy route.

### Pitfall 3: NES.css Fixed-Width Frames on Wide Desktop

**What goes wrong:** NES.css `.nes-container` uses fixed pixel widths (480px, 640px). On desktop (2560px wide), container is tiny, surrounded by dead space. Hero section with Press Start 2P text scales poorly on 4K.

**Why it happens:** NES.css designed for mobile retro aesthetic; doesn't account for 1920px+ screens.

**How to avoid:**
1. **Use Tailwind for responsive container widths:** `max-w-2xl lg:max-w-5xl` instead of fixed px
2. **Use CSS variables for typography:** Press Start 2P only for headers (H1/H2); body text uses `font-mono` at responsive sizes
3. **Reserve NES.css for accent elements:** `.nes-btn` for buttons (works well at any scale), but don't wrap entire layout in `.nes-container`
4. **Test on 2560px width:** Use Chrome DevTools device emulation; ensure no huge white space

**Warning signs:** Landing page hero looks tiny/cramped on 24" monitor; text hard to read due to scale-down.

### Pitfall 4: Cookie Banner Placement Blocking Content on Mobile

**What goes wrong:** Banner at bottom with `fixed` positioning causes layout shift; bottom-tabs overlap banner; user can't dismiss banner to scroll content.

**Why it happens:** `position: fixed inset-0` or `fixed bottom-0 w-full` not accounting for mobile nav already at bottom.

**How to avoid:**
1. **Use z-index layering:** Banner z-50, Navigation z-50 — but only show banner if not already dismissed
2. **Non-blocking variant on mobile:** Stack banner above bottom-tabs on mobile, or allow dismissal with single tap anywhere
3. **Check safe-area-inset-bottom:** `padding-bottom: env(safe-area-inset-bottom, 0px)` for notch-aware positioning

**Warning signs:** Can't tap bottom-tabs because banner is in front; banner covers text on mobile.

### Pitfall 5: Hydration Mismatch Between Server and Client

**What goes wrong:** Zustand persist rehydrates from localStorage after render; children render before hydration complete, causing mismatch (server renders authenticated state, client renders unauthenticated, React throws error).

**Why it happens:** localStorage is async; React renders synchronously. If component checks `isAuthenticated` during render, it gets initial state (false) not persisted state (true).

**How to avoid:**
1. **Use _hasHydrated flag:** Zustand pattern to defer child render until hydration complete
2. **Wrap in conditional:** Don't render <ProtectedRoute> until `_hasHydrated === true`
3. **Or use Suspense boundary:** Wrap with Suspense for async hydration handling

**Warning signs:** Warning: "Hydration mismatch" in console; UI flickers (shows login, then auto-redirects to /app).

### Pitfall 6: Bearer Token Interceptor Without Fallback

**What goes wrong:** API calls require Bearer token in Authorization header; if token is null/undefined on Phase 2 (mock auth), requests fail silently.

**Why it happens:** axios interceptor sets header = `Bearer ${token}` without checking if token exists; backend receives "Bearer null" and rejects.

**How to avoid:**
```javascript
// CORRECT: only add header if token exists
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Warning signs:** 401 errors on first request before login; requests to /api/health work but /api/user/me fails.

---

## Code Examples

Verified patterns from official sources:

### React Router v6 — Nested Layout with Outlet

Source: [React Router v6 Outlet documentation](https://reactrouter.com/en/main/components/outlet)

```jsx
// src/components/layout/AppLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navigation from '../Navigation';
import useMediaQuery from '../../hooks/useMediaQuery';

export default function AppLayout() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      {isDesktop && <Sidebar />}

      {/* Main content */}
      <main className="flex-1 overflow-auto lg:ml-64">
        <Outlet /> {/* Child routes render here */}
      </main>

      {/* Mobile bottom tabs */}
      {!isDesktop && <Navigation />}
    </div>
  );
}
```

### Zustand Persist with Hydration Guard

Source: [Zustand persist middleware](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data)

```javascript
// src/stores/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      accessToken: null,
      // ... rest of store
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true); // called after localStorage is loaded
      },
    }
  )
);

export default useAuthStore;
```

```jsx
// src/App.jsx — defer routing until hydrated
import useAuthStore from './stores/authStore';

export default function App() {
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  if (!hasHydrated) {
    return <LoadingPage />; // wait for localStorage load
  }

  return <Routes>{/* ...routes... */}</Routes>;
}
```

### TanStack Query v5 — useQuery Hook

Source: [TanStack Query useQuery](https://tanstack.com/query/latest/docs/react/reference/useQuery)

```jsx
// Replace: const [character, setCharacter] = useState(null); + useEffect(userService.getProfile)
// With:
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

function CharacterPage() {
  const { data: character, isLoading, error } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const res = await api.get('/user/me');
      return res.data;
    },
  });

  if (isLoading) return <LoadingPage />;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{character.display_name}</div>;
}
```

### Custom useMediaQuery Hook

Source: [MDN matchMedia](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia)

```javascript
// src/hooks/useMediaQuery.js
import { useState, useEffect } from 'react';

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Usage:
const isDesktop = useMediaQuery('(min-width: 1024px)');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useHistory hook | useNavigate hook | React Router v6 (2022) | useHistory replaced; useNavigate is simpler function |
| BrowserRouter at app root | BrowserRouter at app root | No change | Still standard for SPAs |
| Redux for global state | Zustand / Jotai / Pinia | ~2021 onwards | Redux still valid but verbose; Zustand preferred for small/medium apps (< 50 stores) |
| fetch() + useState + useEffect | TanStack Query (React Query) | ~2022 | Manual cache management error-prone; Query is industry standard for server state |
| componentDidMount() lifecycle | useEffect hooks | React 16.8 (2019) | Hooks now standard; class components deprecated in favor of functional |
| Cookies via document.cookie | Library (react-cookie-consent) or Zustand + localStorage | ~2023 GDPR push | Manual cookie handling complex; libraries provide compliance auditing |
| Press Start 2P everywhere | Press Start 2P for H1/H2 only | Retro trend shift ~2024 | Full-text Press Start 2P unreadable at scale; reserve for headers/numbers |

**Deprecated/outdated:**
- **@twa-dev/sdk v8.0.2:** Telegram Mini App SDK for web, being removed in Phase 2. Replaced by browser APIs (no Telegram.WebApp.expand() on web).
- **X-Telegram-Init-Data header:** Phase 1 security validation; replaced by JWT Bearer tokens in Phase 3.
- **window.Telegram.WebApp:** TWA API; on web, no longer available. Haptic feedback → `navigator.vibrate()`, expand → no-op, initDataUnsafe → mock token.

---

## Open Questions

1. **Mock auth token value for Phase 2**
   - What we know: Phase 2 needs working /app/* routes but Phase 3 brings real JWT
   - What's unclear: Use `VITE_DEV_TOKEN` env var vs hardcoded `"dev-mock"` vs `localStorage` placeholder?
   - Recommendation: Implement `mockAccessToken` in authStore; on first visit, set to `"dev-phase2"` + store in Zustand (persisted). Phase 3 replaces with real JWT login flow.

2. **Landing page video asset optimization**
   - What we know: Existing code loads video files for each tab section (hero_anim, quests_anim, etc.)
   - What's unclear: Should landing page load videos on desktop, or static images for LCP speed?
   - Recommendation: Desktop landing uses `background: linear-gradient` (CSS-only, no video download). Mobile landing can load hero_anim.mp4 but lazy-load below fold. Test LCP on 3G: target < 2.5s.

3. **Cookie consent on legal pages**
   - What we know: Sep 2025 law change requires consent separate from TOS acceptance (no "By clicking Submit you accept" checkbox)
   - What's unclear: Should cookie banner also be on /privacy, /terms, /public-offer pages?
   - Recommendation: Show banner on all pages except /app/* (already authed). On legal pages, banner is advisory; on public pages (/), banner blocks nothing but must be dismissable.

4. **Protected routes for shell auth pages (/login, /register)**
   - What we know: Phase 2 has shell forms that don't submit; Phase 3 adds real auth
   - What's unclear: Should /login be blocked if already authenticated, or always accessible?
   - Recommendation: If `isAuthenticated`, redirect to /app/character instead of /login (UX: no need to see login if already authed). Use Navigate in route.

5. **Existing pages export changes**
   - What we know: CharacterPage.jsx, QuestsPage.jsx etc. currently export default component
   - What's unclear: Any import side-effects or global state initialization in these files that break under lazy-loading?
   - Recommendation: Audit each page for `useEffect(() => { window.Telegram.WebApp...` or top-level axios calls. Extract into useQuery hooks or remove if TWA-dependent.

---

## Validation Architecture

Test framework: Not yet established (no pytest/jest config detected).

**Phase 2 does not require automated tests per workflow.nyquist_validation setting** — but manual verification checkpoints MUST cover:

1. **Routing verification:**
   - [ ] Each URL in route tree navigates correctly (click link → URL changes → correct page renders)
   - [ ] Bookmarks work: copy /app/shop URL → paste in new tab → lands on shop
   - [ ] Back-button works: navigate A → B → back → back to A
   - [ ] 404 fallback: visit /nonexistent → 404 page displays

2. **Responsive verification:**
   - [ ] Desktop (≥1024px): Sidebar visible, Navigation hidden
   - [ ] Mobile (<1024px): Sidebar hidden, Navigation (bottom-tabs) visible
   - [ ] Drag browser from 1200px to 900px: layout switches without page reload

3. **TWA SDK removal verification:**
   - [ ] Open DevTools Console: no `window.Telegram` reference errors
   - [ ] Network tab: no telegram-web-app.js script loaded
   - [ ] package.json: no `@twa-dev/sdk` entry
   - [ ] App.jsx: no `tg.ready()`, `tg.expand()`, `window.Telegram.WebApp` code

4. **Auth store hydration:**
   - [ ] Refresh page with saved token: authStore populated without lag (no flicker)
   - [ ] Clear localStorage: authStore resets to default (unauthenticated)
   - [ ] Set mock token in DevTools: navigate to /app/* → enters protected route (not redirected)

5. **Landing page rendering:**
   - [ ] Hero section with Press Start 2P header renders (no font load timeout)
   - [ ] All 6 sections render without errors
   - [ ] CTA buttons navigate to /register and /login (not submitting yet)
   - [ ] LCP < 2.5s on 3G (Lighthouse audit)

6. **Cookie consent:**
   - [ ] Banner shows on first visit
   - [ ] After dismiss, localStorage.cookieConsent = 'accepted'
   - [ ] On page reload, banner not shown (localStorage persists)

---

## Sources

### Primary (HIGH confidence)
- [React Router v6 nested routes & Outlet](https://reactrouter.com/en/main/components/outlet) — nested layout pattern
- [Zustand persist middleware](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data) — localStorage integration
- [TanStack Query v5 QueryClient](https://tanstack.com/query/latest/docs/reference/QueryClient) — defaults, staleTime, gcTime
- [Vite environment variables guide](https://vite.dev/guide/env-and-mode) — VITE_ prefix requirement
- [React Router v6 protected routes](https://reactrouter.com/en/main/start/overview) — ProtectedRoute pattern
- [TanStack Query v5 useQuery](https://tanstack.com/query/latest/docs/react/reference/useQuery) — server state hook

### Secondary (MEDIUM confidence)
- [React Router v6 lazy loading with Suspense](https://reactrouter.com/how-to/suspense) — code splitting best practices
- [Russia 152-ФЗ data protection & cookie consent 2025 changes](https://secureprivacy.ai/blog/comprehensive-guide-russian-data-protection-law-152-fz) — Sep 2025 separate consent requirement
- [React Router nested protected routes guide](https://blog.logrocket.com/authentication-react-router-v6/) — auth + layout patterns
- [Tailwind CSS responsive design & lg breakpoint](https://tailwindcss.com/docs/responsive-design) — Tailwind breakpoints
- [react-cookie-consent library](https://www.npmjs.com/package/react-cookie-consent) — lightweight cookie banner

### Tertiary (reference, not normative)
- [Retro landing page design trends 2025](https://www.accio.com/business/landing_page_design_trends_2025) — retro aesthetic guidance
- [Telegram Mini Apps documentation](https://docs.telegram-mini-apps.com/) — for reference on what's being removed
- [MDN matchMedia API](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) — useMediaQuery implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — React Router v6, Zustand, TanStack Query v5 are established; official docs verified
- Architecture: HIGH — nested routes, lazy-loading, persist patterns well-documented
- Routing strategy: HIGH — React Router v6 standard for SPAs
- TWA SDK removal: HIGH — clear scope (remove script tag, @twa-dev/sdk, window.Telegram code)
- Cookie compliance: MEDIUM — 152-ФЗ basics verified, but Sep 2025 changes still rolling out; recommend consulting local legal counsel before launch
- Landing page: MEDIUM — retro design trends from 2025, but specific implementation varies; reference examples needed
- Pitfalls: HIGH — common React Router, Zustand, TanStack Query gotchas documented

**Research date:** 2026-04-18
**Valid until:** 30 days (2026-05-18) — React Router v6, Zustand v4, TanStack Query v5 all stable; expect no breaking changes in this window.

---

*Phase 2: Web Foundation research complete. Planner can decompose into executable plans.*
