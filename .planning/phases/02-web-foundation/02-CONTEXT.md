# Phase 2: Web Foundation - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning
**Source:** Derived from approved pivot plan (`C:\Users\Purple\.claude\plans\linear-zooming-badger.md`)

<domain>
## Phase Boundary

Фаза делает фронтенд обычным веб-сайтом: убирается Telegram-контейнер, добавляется URL-роутинг, responsive layout, публичный landing и legal-страницы. **Backend не трогается** — auth-рефактор уходит в Phase 3. Старые экраны (Quests, Character, Shop, Inventory, Leaderboard) продолжают работать, но уже под роутами `/app/*` и через браузер, а не через TWA SDK.

После Phase 2 сайт можно открыть в любом браузере и пройти по landing → (пока ещё без auth) → в `/app/*`. Полноценный auth-flow появится в Phase 3; для промежуточного состояния допустимо оставить dev-заглушку авторизации (mock-токен или bypass), но не продакшн-логин.

**Out of scope для этой фазы:**
- Email/password регистрация и JWT (Phase 3)
- Telegram Login Widget (Phase 3)
- Backend-изменения (Phase 3)
- Character stats, shop, daily, leaderboard, social, billing (Phase 4-10)

</domain>

<decisions>
## Implementation Decisions

### Routing
- **React Router v6** (не v5, не file-based роутинг типа TanStack Router — v6 standard для SPA)
- Структура роутов:
  - `/` — publicлэндинг
  - `/login`, `/register` — shell-страницы (форма/кнопки без реальной отправки до Phase 3; можно placeholder "Скоро")
  - `/verify-email/:token`, `/reset-password` — shell
  - `/app` — защищённый layout (ProtectedRoute component, пока проверяет dev-флаг или mock-token)
    - `/app/quests`, `/app/character`, `/app/shop`, `/app/inventory`, `/app/leaderboard`, `/app/settings`
    - Guilds/friends добавляются в Phase 8-9, их роуты пока не создаём
  - `/privacy`, `/terms`, `/public-offer` — статичные
  - `*` — 404 NotFound page
- Lazy-loading через `React.lazy()` + `Suspense` для `/app/*` страниц (бюджет JS)

### State management
- **Zustand** для клиентского state (authStore, userStore, cookieConsentStore)
  - `authStore`: `accessToken`, `refreshToken`, `setTokens`, `clearTokens`, `isAuthenticated` (на Phase 2 — mock token ok)
  - `userStore`: `user`, `setUser`, `clearUser`
- **TanStack Query v5** для server state (user profile, quests, shop и т.д.)
  - Заменяем текущий `userService.getProfile()` на `useUserQuery()`
  - Настроен QueryClient с дефолтами (staleTime 30s, retry 1)
- Пока оставляем существующий axios-клиент, но interceptors переписать под Bearer (Phase 3 доделает)

### Layout & responsive
- **Breakpoint:** `lg` (Tailwind default = 1024px). ≥lg — desktop, <lg — mobile
- **Desktop layout (`AppLayout`)**: `flex` с `Sidebar` (width 256px, fixed left) + main content (`max-w-7xl mx-auto px-6 py-8`)
- **Mobile layout**: full-width content + `Navigation` (существующий `components/Navigation.jsx`, bottom-tabs)
- Адаптация на runtime: `useMediaQuery('(min-width: 1024px)')` или Tailwind `hidden lg:block` / `lg:hidden`
- **Убираем из `App.jsx:129`** мобильные блокировки: `fixed inset-0 overflow-hidden select-none touch-none` — они ломают скролл на десктопе
- Landing и legal НЕ оборачиваются в AppLayout — у них свой простой layout с hero/footer

### TWA SDK удаление
- Удалить: `<script src="https://telegram.org/js/telegram-web-app.js">` из `frontend/index.html:4`
- Удалить зависимость `@twa-dev/sdk` из `frontend/package.json`
- В `App.jsx:33-48` убрать всё `window.Telegram.WebApp`, `tg.ready()`, `tg.expand()`
- В `services/api.js:19-26` убрать `X-Telegram-Init-Data` header — заменить заглушкой Bearer (до Phase 3 можно использовать dev-токен из env или пустой)
- `triggerHaptic` (`App.jsx:111-113`) — заменить на no-op (или `navigator.vibrate(10)` если доступно)
- Заменить хардкодный `axios.defaults.baseURL = 'https://gameurlife.ru.tuna.am'` на `import.meta.env.VITE_API_BASE_URL` (значение по умолчанию `http://localhost:8000/api` для dev)

### Retro-эстетика на desktop
- Press Start 2P — только заголовки (H1/H2) и цифры (цены, XP, уровни). Для абзацев текста — `font-mono` (системный моноширинный)
- Золото-чёрная палитра сохраняется (`#daa520` + `#000000`)
- NES.css — оставляем для retro-рамок (`.nes-container`, `.nes-btn`), но ограниченно — NES.css плохо работает на очень широких экранах, заменяем на собственные Tailwind-классы где нужно
- Видео-фоны (`assets/*.mp4`) — оставляем только на мобильном (<lg); на desktop — статичный градиент или CSS-анимированный паттерн для скорости
- Hover-эффекты на карточках (скейл, border glow) — только на desktop через `hover:` и `@media (hover: hover)`

### Landing page (`/`)
Секции сверху вниз:
1. **Hero**: "Твоя жизнь — RPG" (H1 Press Start 2P), подзаголовок, 2 CTA-кнопки ("Начать" → /register, "Войти" → /login)
2. **Demo**: превью квеста (статичная карточка квеста с примером) + mini-stat-bar
3. **Features**: 4 блока (AI-анализ задач, прогрессия персонажа, магазин и инвентарь, гильдии и лидерборд) в grid 2x2 на desktop, stack на mobile
4. **Pricing**: 3 пака gems (100 / 500 / 1500) с ценами (placeholder цифры на Phase 2, реальные на Phase 10)
5. **FAQ**: 5-7 вопросов в accordion
6. **Footer**: логотип, ссылки на legal, email для связи, соцсети placeholder

### Legal pages
- `/privacy` — Политика конфиденциальности (152-ФЗ). Контент: какие ПД собираем (email, username, IP), цели обработки, сроки хранения, права субъекта ПД, контакты оператора. **Оператор ПД — сам пользователь (ИП/самозанятый), контакты — placeholder, заполняется при реальном запуске**
- `/terms` — Пользовательское соглашение. Контент: регистрация, виртуальная валюта (gold/gems) не является денежным средством, правила поведения, отключение аккаунта.
- `/public-offer` — Оферта для покупок gems через ЮKassa. Контент: предмет договора (покупка gems), стоимость, порядок оплаты, невозврат (gems — цифровой товар).
- Контент на первых этапах — шаблонный текст с placeholder-данными (реквизиты, ИНН, email), помечается `TODO: заполнить перед продакшн-запуском` в коде

### Cookie consent
- Библиотека: `react-cookie-consent` (простая, достаточная) или собственный компонент (~50 строк)
- Banner показывается если `localStorage.cookieConsent !== 'accepted'`
- Две кнопки: "Принять всё" и "Только необходимые"
- Банер не блокирует контент, стик внизу экрана

### Файлы, которые точно меняем / создаём
- `frontend/package.json` — добавить: `react-router-dom@^6`, `zustand@^4`, `@tanstack/react-query@^5`. Удалить: `@twa-dev/sdk`
- `frontend/index.html` — убрать `<script telegram-web-app.js>`
- `frontend/.env.example` — создать, `VITE_API_BASE_URL`
- `frontend/src/main.jsx` — обернуть App в `QueryClientProvider` и `BrowserRouter`
- `frontend/src/App.jsx` — переписать: только routes, без TWA-инициализации; удалить `activeTab`-state и tab-switching
- `frontend/src/services/api.js` — убрать `X-Telegram-Init-Data`, перейти на Bearer через интерсептор из authStore (mock на Phase 2)
- Новые компоненты:
  - `src/stores/authStore.js`, `src/stores/userStore.js`, `src/stores/cookieConsentStore.js`
  - `src/components/layout/AppLayout.jsx` — responsive сочетание sidebar/bottom-tabs
  - `src/components/layout/Sidebar.jsx` — desktop-навигация
  - `src/components/layout/ProtectedRoute.jsx` — wrapper с проверкой auth (на Phase 2 mock/dev-bypass)
  - `src/components/CookieConsentBanner.jsx`
  - `src/hooks/useMediaQuery.js`
  - `src/pages/LandingPage.jsx` + подкомпоненты (Hero, Demo, Features, Pricing, FAQ, Footer)
  - `src/pages/LoginPage.jsx`, `src/pages/RegisterPage.jsx` — shell-формы (placeholder UI без отправки)
  - `src/pages/legal/PrivacyPage.jsx`, `src/pages/legal/TermsPage.jsx`, `src/pages/legal/OfferPage.jsx`
  - `src/pages/NotFoundPage.jsx`
- Оставляем как есть (код внутри перерабатываем минимально):
  - `src/pages/CharacterPage.jsx`, `QuestsPage.jsx`, `ShopPage.jsx`, `InventoryPage.jsx`, `LeaderboardPage.jsx`, `LoadingPage.jsx`
  - `src/components/Navigation.jsx` (mobile bottom-tabs)

### Claude's Discretion
- Выбор между `react-cookie-consent` и собственным компонентом — выбрать на основе размера бандла и гибкости стилизации под retro
- Конкретные тексты hero-блока landing'а и подзаголовков фич — написать в retro-вайбе ("Прими квест", "Получи лут", "Качай персонажа")
- Цвета и размеры для cookie-banner, hover-эффектов, border-glow — в рамках существующей палитры
- Решение о lazy-loading: точно — для `/app/*`, под вопросом — для legal-страниц (вероятно не нужно)
- Выбор конкретного hook-а для media-query: реализовать свой ~10 строк, без библиотеки
- Как организовать QueryClient defaults (staleTime, retry) — выбрать разумные значения
- Сохранять ли старую фичу "параллельной загрузки видео с прогресс-баром" из `App.jsx:50-109` — скорее перенести её в `LoadingPage` внутри `/app` layout, при первом открытии

</decisions>

<specifics>
## Specific References

- **Ссылка на одобренный план пивота:** `C:\Users\Purple\.claude\plans\linear-zooming-badger.md`
- **Brainstorm-решения (уже зафиксированы):**
  - Веб-первый, Telegram как опция логина (Phase 3)
  - Responsive desktop + mobile web
  - Retro/pixel эстетика сохранена, адаптирована под desktop
  - RU-рынок, русский UI, без i18n
- **Существующие файлы с Telegram-зависимостью (критичные точки рефактора):**
  - `frontend/index.html:4`
  - `frontend/src/App.jsx:33, 42-48, 111-113`
  - `frontend/src/services/api.js:19-26`
- **Retro-библиотеки в проекте:** `nes.css@2.3.0`, `press-start-2p` (Google Fonts), `lucide-react`, `framer-motion`
- **Существующий стек (не меняется):** React 19.2, Vite 7.3, Tailwind 4.1, axios 1.13

</specifics>

<deferred>
## Deferred Ideas

- **Real authentication flow** — Phase 3 (JWT + email/password + Telegram Login Widget)
- **Backend changes** — Phase 3 (`get_current_user`, удаление `verify_telegram_init_data`)
- **Character stats, shop, inventory, daily, leaderboard** — Phase 4-7
- **Friends, guilds, social feed** — Phase 8-9
- **Monetization (gems, ЮKassa)** — Phase 10
- **Production infrastructure (Sentry, rate-limit, prod domain, SMTP)** — Phase 11
- **i18n, a11y audit, SEO (sitemap, robots.txt, meta-tags beyond basic)** — после v1.0
- **PWA (installable, offline)** — после v1.0

---

*Phase: 02-web-foundation*
*Context gathered: 2026-04-18 from approved pivot plan*
</deferred>
