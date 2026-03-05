# Stale Deal Nagger — Implementation Plan & Progress Tracker

> **Last updated:** All 5 phases complete (5 March 2026)
> **Team:** Aditya (backend) · Vedang (frontend)
> **Stack:** Node/Express/Prisma/PostgreSQL (Neon) + React/Vite/Tailwind · Deployed on Vercel
> **Status:** ✅ PROJECT COMPLETE

---

## Phase 1 — Core Backend ✅ COMPLETE

**Goal:** Rules API, Staleness Engine, Analytics, Notifications, Seed data, End-to-end tests

### Backend Files Created

| File                                        | Purpose                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/validators/ruleValidator.js`           | Joi schemas for rule CRUD                                                            |
| `src/services/ruleService.js`               | Rule CRUD + `matchRuleForDeal(teamId, stage)`                                        |
| `src/controllers/ruleController.js`         | Pass-through to ruleService                                                          |
| `src/routes/ruleRoutes.js`                  | GET/POST /rules, PATCH/DELETE /rules/:id                                             |
| `src/services/stalenessService.js`          | Core `runStalenessCheck(teamId?)` — state machine, snooze handling, batch processing |
| `src/services/notificationService.js`       | DB-only notifications with 24h dedup window                                          |
| `src/infrastructure/queues.js`              | Bull queue, staleness check every 15 min                                             |
| `src/services/analyticsService.js`          | Pipeline health, trends, rep stats, stage breakdown                                  |
| `src/controllers/analyticsController.js`    | Pass-through to analyticsService                                                     |
| `src/routes/analyticsRoutes.js`             | GET /analytics/pipeline\|trends\|reps\|stages                                        |
| `src/controllers/notificationController.js` | Pass-through to notificationService                                                  |
| `src/routes/notificationRoutes.js`          | GET /notifications, PATCH /:id/read, POST /read-all                                  |
| `src/routes/stalenessRoutes.js`             | POST /staleness/run (admin/manager only)                                             |
| `src/scripts/seed.js`                       | 5 users + 18 deals across all staleness tiers                                        |
| `src/scripts/testStaleness.js`              | End-to-end staleness engine test (status verification, dedup, snooze)                |

### Backend Files Modified

- `src/app.js` — registered rules, analytics, notifications, staleness routes
- `src/server.js` — calls `initQueues()` on startup (skipped in test env)
- `package.json` — added `seed`, `seed:reset`, and `test:staleness` npm scripts

### Staleness Detection Engine

- **State machine:** healthy → warning → stale → critical based on configurable per-stage thresholds
- **Snooze support:** Snoozed deals are skipped; expired snoozes are auto-cleared
- **Notification dispatch:** Owner gets nudge; managers/admins get escalation on stale/critical
- **Deduplication:** 24-hour window per deal+user+type prevents re-alerts on every cron tick
- **Batch processing:** Can run for all teams or a specific team via API or Bull queue

### API Endpoints Added

| Method       | Endpoint                         | Auth              |
| ------------ | -------------------------------- | ----------------- |
| GET/POST     | `/api/v1/rules`                  | JWT               |
| PATCH/DELETE | `/api/v1/rules/:id`              | JWT admin         |
| GET          | `/api/v1/analytics/pipeline`     | JWT               |
| GET          | `/api/v1/analytics/trends`       | JWT               |
| GET          | `/api/v1/analytics/reps`         | JWT               |
| GET          | `/api/v1/analytics/stages`       | JWT               |
| GET          | `/api/v1/notifications`          | JWT               |
| PATCH        | `/api/v1/notifications/:id/read` | JWT               |
| POST         | `/api/v1/notifications/read-all` | JWT               |
| POST         | `/api/v1/staleness/run`          | JWT admin/manager |

### Seed Data

- **Team:** Acme Corp Sales (`acme-corp-sales`)
- **Users:** admin@acmesales.com, david@, sarah@, marcus@, emma@ (all pw: `password123`)
- **Deals:** 18 total — 5 healthy, 4 warning, 4 stale, 5 critical

### Default Staleness Rules

| Stage       | Warning | Stale | Critical |
| ----------- | ------- | ----- | -------- |
| Discovery   | 7d      | 10d   | 14d      |
| Proposal    | 5d      | 8d    | 12d      |
| Negotiation | 3d      | 5d    | 7d       |
| Closing     | 2d      | 4d    | 6d       |

### End-to-End Staleness Test (`npm run test:staleness`)

- Verifies seed data exists (team, rules, deals, users)
- Runs staleness engine and checks all deal statuses match expected thresholds
- Verifies notifications are created for status transitions
- Tests deduplication (re-running produces zero duplicate notifications)
- Tests snooze behavior (snoozed deals are skipped)

---

## Phase 2 — Frontend UI ✅ COMPLETE

**Goal:** Sidebar layout, Kanban dashboard, Deal Slide-Over, Analytics, Notifications, Rules CRUD, Settings, Command Palette, Toast system, Skeleton loading

### Frontend Files Created

| File                                       | Purpose                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `client/src/components/Sidebar.jsx`        | Fixed dark sidebar with nav items + unread badge + Cmd+K search trigger                                   |
| `client/src/components/DealSlideOver.jsx`  | Right slide-over (edit, snooze, delete, deep-link) — full-width on mobile                                 |
| `client/src/components/CommandPalette.jsx` | Cmd+K / Ctrl+K global search: pages, deals, keyboard navigation                                           |
| `client/src/components/Skeleton.jsx`       | Full set of skeleton loading components (cards, tables, kanban, notifications, rules, team, integrations) |
| `client/src/context/ToastContext.jsx`      | Global toast notification system (success/error/warning/info, auto-dismiss, stacking)                     |
| `client/src/pages/Analytics.jsx`           | Pipeline health cards, stage/rep tables, trends                                                           |
| `client/src/pages/Notifications.jsx`       | Notification inbox with mark-read actions                                                                 |
| `client/src/pages/Rules.jsx`               | Staleness rules CRUD table (role-gated)                                                                   |
| `client/src/pages/Settings.jsx`            | Editable profile + team info display                                                                      |

### Frontend Files Modified

| File                                 | Changes                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `client/src/App.jsx`                 | ToastProvider wraps all routes; CommandPalette rendered for logged-in users; SidebarLayout with all routes |
| `client/src/main.jsx`                | BrowserRouter + AuthProvider wrapping                                                                      |
| `client/src/pages/Dashboard.jsx`     | Rewritten as Kanban board with skeleton loading (replaced LoadingSpinner)                                  |
| `client/src/pages/Deals.jsx`         | Row click opens slide-over; skeleton table loading; mobile card list                                       |
| `client/src/pages/Analytics.jsx`     | Skeleton loading for stat cards + tables                                                                   |
| `client/src/pages/Notifications.jsx` | Skeleton loading for notification list                                                                     |
| `client/src/services/api.js`         | Added `analyticsAPI`, `notificationsAPI`, `rulesAPI`                                                       |
| `client/src/index.css`               | Added slide-in-right, scale-in, and shimmer animations                                                     |

### Command Palette (Cmd+K)

- Opens with `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
- Searches all 9 pages + live deal search via API (debounced)
- Keyboard navigation: arrow-up/arrow-down to move, Enter to select, Esc to close
- Search trigger button in sidebar with Cmd+K hint

### Global Toast Notification System

- Context-based (`useToast` hook) — no more per-page toast state
- Methods: `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`
- Auto-dismiss (4s default, 6s for errors), manual dismiss, stacking
- Animated slide-in from right with icons

### Skeleton Loading Screens

- `SkeletonStatCards` — stat card placeholders (Dashboard, Analytics)
- `SkeletonKanban` — kanban board placeholder (Dashboard)
- `SkeletonTable` — configurable rows/cols table placeholder (Deals, Analytics)
- `SkeletonNotifications` — notification list placeholder
- `SkeletonRulesCards` — rules pipeline cards placeholder
- `SkeletonTeamMembers` — team table placeholder
- `SkeletonIntegrations` — integration cards placeholder
- `SkeletonDealSlideOver` — slide-over panel placeholder

### Frontend Routes (complete after Phase 2)

| Route                              | Page                        |
| ---------------------------------- | --------------------------- |
| `/`                                | LandingPage (public)        |
| `/login`, `/register`, `/get-demo` | Public auth pages           |
| `/dashboard`                       | Kanban pipeline board       |
| `/deals`                           | Deals table with slide-over |
| `/deals/new`                       | CreateDeal form             |
| `/deals/:id`                       | DealDetail full page        |
| `/analytics`                       | Analytics dashboard         |
| `/notifications`                   | Notification inbox          |
| `/rules`                           | Rules CRUD                  |
| `/settings`                        | Settings (read-only)        |

---

## Phase 3 — Team, Integrations, Visual Rules, Settings, Mobile ✅ COMPLETE

**Goal:** Visual Rules pipeline cards, Team management, Integrations Hub, editable Settings, mobile responsive pass

### Backend Files Created

| File                                       | Purpose                                                                                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `src/validators/teamValidator.js`          | Joi schemas for invite, role update, team update, profile, password                                               |
| `src/services/teamService.js`              | getTeam, updateTeam, getMembers, inviteUser, updateUserRole, deactivate/reactivate, updateProfile, changePassword |
| `src/controllers/teamController.js`        | Pass-through handlers, extracts teamId/userId from req.user                                                       |
| `src/routes/teamRoutes.js`                 | Full team + user profile route group                                                                              |
| `src/services/integrationService.js`       | getAll, getStatusMap (all 5 providers), connect (upsert), disconnect                                              |
| `src/controllers/integrationController.js` | Pass-through handlers                                                                                             |
| `src/routes/integrationRoutes.js`          | GET /, POST /:provider/connect [admin], DELETE /:provider [admin]                                                 |

### Backend Files Modified

- `src/app.js` — registered teamRoutes and integrationRoutes at `/api/v1`

### New API Endpoints

| Method | Endpoint                                  | Auth              |
| ------ | ----------------------------------------- | ----------------- |
| GET    | `/api/v1/team`                            | JWT               |
| PATCH  | `/api/v1/team`                            | JWT admin         |
| GET    | `/api/v1/team/members`                    | JWT               |
| POST   | `/api/v1/team/members`                    | JWT admin/manager |
| PATCH  | `/api/v1/team/members/:userId`            | JWT admin         |
| DELETE | `/api/v1/team/members/:userId`            | JWT admin         |
| POST   | `/api/v1/team/members/:userId/reactivate` | JWT admin         |
| PATCH  | `/api/v1/users/me`                        | JWT (any)         |
| PATCH  | `/api/v1/users/me/password`               | JWT (any)         |
| GET    | `/api/v1/integrations`                    | JWT               |
| POST   | `/api/v1/integrations/:provider/connect`  | JWT admin         |
| DELETE | `/api/v1/integrations/:provider`          | JWT admin         |

### Frontend Files Created

| File                                | Purpose                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `client/src/pages/Team.jsx`         | Members table + invite modal + role/status management + skeleton loading |
| `client/src/pages/Integrations.jsx` | Integration cards for 5 providers + global toast + skeleton loading      |

### Frontend Files Modified

| File                                | Changes                                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client/src/pages/Rules.jsx`        | **Full rebuild** — 4 visual pipeline stage cards with arrows, inline edit per card, Preview Mode, Reset to Defaults modal, role-gating, skeleton loading |
| `client/src/pages/Settings.jsx`     | **Rewritten** — editable profile, Slack ID, notification toggles, password change, Team Settings section (admin), Danger Zone (admin), uses global toast |
| `client/src/components/Sidebar.jsx` | Added Team + Integrations nav items (8 total); Cmd+K search trigger; desktop hidden on mobile; mobile bottom tab bar                                     |
| `client/src/App.jsx`                | Added Team + Integrations imports and routes; ToastProvider wrapper; CommandPalette; `pb-20 md:pb-0` for mobile tab bar clearance                        |
| `client/src/services/api.js`        | Added `teamAPI` (9 methods) and `integrationsAPI` (3 methods)                                                                                            |
| `client/src/pages/Deals.jsx`        | Mobile card list (`sm:hidden`), desktop table (`hidden sm:block`), skeleton loading                                                                      |
| `client/src/pages/Analytics.jsx`    | Wrapped stage/rep tables in `overflow-x-auto` for mobile scroll, skeleton loading                                                                        |
| `client/src/pages/Dashboard.jsx`    | Skeleton loading for stat cards + kanban board                                                                                                           |

### Frontend Routes Added

| Route           | Page             |
| --------------- | ---------------- |
| `/team`         | Team management  |
| `/integrations` | Integrations Hub |

### Key Phase 3 Features

- **Visual Rules**: 4 pipeline cards (Discovery to Proposal to Negotiation to Closing) with ChevronRight connectors, per-card inline editing, Preview Mode that classifies deals client-side, Reset to Defaults with confirmation modal
- **Team Management**: Invite with generated temp password shown on success, role badge (purple/blue/gray), active/inactive status, self-action protection, mobile card fallback, skeleton loading
- **Integrations Hub**: 5 provider cards (3 CRM + 2 notification channels), connect/disconnect with confirmation, "Coming in Phase 5" toast for OAuth flows, skeleton loading
- **Settings**: Editable profile, notification toggles, password change, team config (admin), Danger Zone (admin placeholder), uses global toast
- **Mobile Responsive**:
  - Bottom tab bar replaces sidebar on < md (5 key tabs)
  - Deals table becomes card list on < sm
  - DealSlideOver goes full-width on mobile
  - Analytics tables scroll horizontally
  - Team page has mobile card fallback
  - All pages have proper px-4 sm:px-6 lg:px-8 responsive padding

---

## Phase 1-3 Completion Checklist

| #   | Item                                             | Status |
| --- | ------------------------------------------------ | ------ |
| 1   | Staleness Detection Engine (stalenessService.js) | Done   |
| 2   | Notification Service (DB-only with dedup)        | Done   |
| 3   | End-to-end staleness test (testStaleness.js)     | Done   |
| 4   | Deal Slide-Over Panel (edit, snooze, delete)     | Done   |
| 5   | Command Palette (Cmd+K)                          | Done   |
| 6   | Toast notification system (global)               | Done   |
| 7   | Skeleton loading screens (all pages)             | Done   |
| 8   | Team Management Screen                           | Done   |
| 9   | Team Management Backend (invite, manage users)   | Done   |
| 10  | Integrations Hub Screen                          | Done   |
| 11  | Integration Backend (OAuth scaffold)             | Done   |
| 12  | Mobile Responsive Pass                           | Done   |

---

## Phase 4 — Analytics Charts, Dark Mode, Notifications Revamp, Onboarding & Polish ✅ COMPLETE

**Goal:** Recharts analytics, system-wide dark mode, notification dropdown + filters, onboarding wizard, Framer Motion page transitions, micro-interactions

### Backend Files Modified

| File                                     | Changes                                                                                            |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/services/analyticsService.js`       | Added `getPipelineVelocity()` (avg days per stage) and `getStaleHeatmap()` (stage × status matrix) |
| `src/controllers/analyticsController.js` | Added velocity + heatmap handlers                                                                  |
| `src/routes/analyticsRoutes.js`          | Added GET /velocity, GET /heatmap                                                                  |

### New API Endpoints

| Method | Endpoint                     | Auth |
| ------ | ---------------------------- | ---- |
| GET    | `/api/v1/analytics/velocity` | JWT  |
| GET    | `/api/v1/analytics/heatmap`  | JWT  |

### Frontend Files Created

| File                                              | Purpose                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `client/src/context/ThemeContext.jsx`             | Dark mode context — `isDark`, `toggleTheme`, persists to localStorage                             |
| `client/src/components/PageWrapper.jsx`           | Framer Motion page-transition wrapper (opacity + y-slide)                                         |
| `client/src/components/NotificationsDropdown.jsx` | Header notification bell with flyout panel, mark-read, dark mode                                  |
| `client/src/pages/Onboarding.jsx`                 | 7-step first-run wizard (Welcome → Connect CRM → Import → Rules → Team → Notifications → Go Live) |

### Frontend Files Rewritten / Heavily Modified

| File                                 | Changes                                                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client/src/pages/Analytics.jsx`     | **Full rewrite** — 4 Recharts charts (AreaChart health trend, BarChart pipeline velocity, BarChart rep leaderboard, CSS-grid stale heatmap) + CSV export + responsive dark mode |
| `client/src/pages/Notifications.jsx` | **Full rewrite** — type filter chips, date grouping (Today / Yesterday / This Week / Older), mark-read, dark mode                                                               |
| `client/src/App.jsx`                 | Added ThemeProvider, AnimatePresence with location key, Onboarding redirect hook, PageWrapper on routes                                                                         |
| `client/src/components/Sidebar.jsx`  | Added dark mode toggle (Sun/Moon), NotificationsDropdown, dark sidebar variants                                                                                                 |
| `client/src/index.css`               | Added `@custom-variant dark (&:where(.dark, .dark *))`, `.dark {}` CSS variable overrides for all semantic tokens                                                               |
| `client/src/services/api.js`         | Added `analyticsAPI.velocity()` and `analyticsAPI.heatmap()`                                                                                                                    |

### Dark Mode Pass — All Pages & Components

Every page and shared component received full dark mode support:

| File                      | Dark Mode         | PageWrapper | Micro-interactions |
| ------------------------- | ----------------- | ----------- | ------------------ |
| Dashboard.jsx             | ✅                | ✅          | ✅                 |
| Deals.jsx                 | ✅                | ✅          | ✅                 |
| DealDetail.jsx            | ✅                | ✅          | ✅                 |
| CreateDeal.jsx            | ✅                | ✅          | ✅                 |
| Analytics.jsx             | ✅                | ✅          | ✅                 |
| Notifications.jsx         | ✅                | ✅          | ✅                 |
| Rules.jsx                 | ✅                | ✅          | ✅                 |
| Team.jsx                  | ✅                | ✅          | ✅                 |
| Integrations.jsx          | ✅                | ✅          | ✅                 |
| Settings.jsx              | ✅                | ✅          | ✅                 |
| Onboarding.jsx            | ✅                | —           | ✅                 |
| Login.jsx                 | ✅                | —           | —                  |
| Register.jsx              | ✅                | —           | —                  |
| Sidebar.jsx               | ✅                | —           | ✅                 |
| DealSlideOver.jsx         | ✅                | —           | ✅                 |
| CommandPalette.jsx        | ✅                | —           | —                  |
| NotificationsDropdown.jsx | ✅                | —           | ✅                 |
| Skeleton.jsx              | ✅                | —           | —                  |
| StatusBadge.jsx           | ✅ (via CSS vars) | —           | —                  |
| LoadingSpinner.jsx        | ✅ (via CSS vars) | —           | —                  |

### Dark Mode System

- **Toggle**: Sun/Moon icon in sidebar, persists to `localStorage('sdn_theme')`
- **Implementation**: `.dark` class on `<html>`, Tailwind `@custom-variant dark` selector
- **CSS Variables**: All semantic tokens (--color-dark, --color-muted, --color-border, etc.) overridden in `.dark {}` block
- **Mapping conventions**: bg-white→dark:bg-gray-800, bg-gray-50→dark:bg-gray-900, text-dark→dark:text-white, text-muted→dark:text-gray-400, border-border→dark:border-gray-700, inputs→dark:bg-gray-700 dark:text-white dark:border-gray-600

### Recharts Analytics

- **Health Trend**: AreaChart with gradient fill showing pipeline score over time
- **Pipeline Velocity**: BarChart showing avg days in each stage
- **Rep Leaderboard**: Horizontal BarChart of deal counts by rep
- **Stale Heatmap**: CSS grid matrix (stage × status) with color-coded cells
- **CSV Export**: Download pipeline data as CSV

### Framer Motion Animations

- **Page transitions**: AnimatePresence + PageWrapper (opacity 0→1, y 20→0, 300ms ease-out)
- **Micro-interactions**: `active:scale-95` on buttons, `transition-all duration-150` on interactive elements
- **Staggered lists**: Used in Onboarding steps and Analytics charts

### Phase 4 Completion Checklist

| #   | Item                                              | Status |
| --- | ------------------------------------------------- | ------ |
| 1   | Recharts analytics charts (4 chart types)         | Done   |
| 2   | Pipeline velocity + heatmap backend endpoints     | Done   |
| 3   | Dark mode system (ThemeContext + CSS vars)        | Done   |
| 4   | Dark mode on ALL pages (14 pages)                 | Done   |
| 5   | Dark mode on ALL components (6 shared components) | Done   |
| 6   | Notification dropdown in sidebar                  | Done   |
| 7   | Notification filters + date grouping              | Done   |
| 8   | Onboarding wizard (7 steps)                       | Done   |
| 9   | Framer Motion page transitions                    | Done   |
| 10  | Micro-interactions (active:scale-95, transitions) | Done   |
| 11  | CSV export for analytics                          | Done   |
| 12  | Skeleton components dark mode                     | Done   |

---

## Phase 5 — CRM Import, Activity Log, OAuth Integrations & Email Digest ✅ COMPLETE

**Goal:** CSV/API deal import, activity timeline, real HubSpot/Slack OAuth, automated daily email digest, webhook support

### Backend Files Created

| File | Purpose |
| --- | --- |
| `src/services/activityService.js` | `logActivity()`, `getActivities()`, `createNote()` — activity logging on all deal mutations |
| `src/services/importService.js` | CSV parsing (csv-parse/sync), row normalization, `importFromCSV()` with duplicate detection, 500-deal limit |
| `src/services/crmSyncService.js` | `syncDeals()`, `syncHubSpotDeals()`, OAuth token refresh, HubSpot stage mapping |
| `src/services/slackService.js` | Block Kit message builders, `sendDM()`, `dispatchNotification()`, `handleInteraction()` (snooze buttons) |
| `src/services/emailService.js` | Nodemailer transport (mock fallback), HTML digest template, `compileDigestData()`, `sendDigest()`, `runAllDigests()` |
| `src/services/webhookService.js` | `processWebhook()`, `validateSignature()`, `handleHubSpotWebhook()` for deal events |
| `src/controllers/importController.js` | `uploadCSV`, `getImportHistory` handlers |
| `src/routes/importRoutes.js` | POST /csv (multer, 5MB limit), GET /history |
| `src/routes/webhookRoutes.js` | POST /:provider (unauthenticated), POST /slack/interact |

### Backend Files Modified

| File | Changes |
| --- | --- |
| `src/services/dealService.js` | Added activityService import + activity logging on create/update/snooze/unsnooze |
| `src/controllers/dealController.js` | Added `getActivities`, `addNote` handlers |
| `src/routes/dealRoutes.js` | Added GET/POST `/:id/activities` routes |
| `src/controllers/integrationController.js` | Added `syncCRM`, `triggerDigest` handlers |
| `src/routes/integrationRoutes.js` | Added POST `/:provider/sync`, POST `/email/digest` routes |
| `src/app.js` | Registered importRoutes at `/api/v1/import` and webhookRoutes at `/api/v1/webhooks` |
| `src/config/index.js` | Added email config block (host/port/secure/user/pass/from) and frontendUrl |
| `src/services/notificationService.js` | Added async Slack dispatch after notification creation |
| `src/infrastructure/queues.js` | Added digestQueue (daily at 9AM UTC) running `emailService.runAllDigests()` |

### New API Endpoints

| Method | Endpoint | Auth |
| --- | --- | --- |
| POST | `/api/v1/import/csv` | JWT admin/manager |
| GET | `/api/v1/import/history` | JWT |
| GET | `/api/v1/deals/:id/activities` | JWT |
| POST | `/api/v1/deals/:id/activities` | JWT |
| POST | `/api/v1/integrations/:provider/sync` | JWT admin/manager |
| POST | `/api/v1/integrations/email/digest` | JWT admin |
| POST | `/api/v1/webhooks/:provider` | Unauthenticated (webhook) |
| POST | `/api/v1/webhooks/slack/interact` | Unauthenticated (Slack) |

### Frontend Files Created

| File | Purpose |
| --- | --- |
| `client/src/components/ImportModal.jsx` | Drag-and-drop CSV upload, file preview table, progress indicator, CSV template download |

### Frontend Files Modified

| File | Changes |
| --- | --- |
| `client/src/services/api.js` | Added `importAPI` (uploadCSV, getHistory), `activitiesAPI` (list, addNote), `integrationsAPI.sync()`, `integrationsAPI.triggerDigest()` |
| `client/src/pages/Deals.jsx` | Added "Import CSV" button in header, ImportModal integration with reload on success |
| `client/src/pages/DealDetail.jsx` | Enhanced activity timeline with typed icons (note/stage_change/crm_sync), add note form, `activitiesAPI` integration |
| `client/src/pages/Integrations.jsx` | Real OAuth flow with `getAuthUrl` redirect + simulated fallback, "Sync Now" button for connected CRMs, `onSync` prop on IntegrationCard |

### New Dependencies

| Package | Purpose |
| --- | --- |
| `multer` | Multipart file upload handling (CSV import) |
| `csv-parse` | CSV parsing with flexible column mapping |
| `nodemailer` | SMTP email transport for digest emails |

### Key Phase 5 Features

- **CSV Import**: Drag-and-drop upload with preview, 500-deal limit, flexible column headers (Name/name/deal_name), duplicate detection by crmDealId, valid stages: discovery/proposal/negotiation/closing
- **Activity Timeline**: Auto-logged on all deal mutations (create, update, snooze, unsnooze), manual note creation, typed icons per activity type, performer attribution
- **CRM Sync**: HubSpot deal sync with OAuth token refresh, stage mapping (appointmentscheduled→discovery, etc.), Salesforce/Pipedrive stubs (501)
- **Slack Notifications**: Block Kit messages with snooze action buttons (3d/7d), DM dispatch on notification creation, interaction handler for button clicks
- **Email Digest**: HTML template with KPI cards + top 5 stale deals table, mock transport when no SMTP configured, daily 9AM UTC cron via Bull queue
- **Webhooks**: HubSpot deal.propertyChange/creation/deletion events, signature validation placeholder, Slack interactive components endpoint
- **OAuth Flow**: Real OAuth redirect via `getAuthUrl` with graceful fallback to simulated connect for dev/demo

### Config

| File | Purpose |
| --- | --- |
| `.env.example` | All environment variables documented (DB, Redis, JWT, email SMTP, HubSpot OAuth, Slack) |

### Phase 5 Completion Checklist

| # | Item | Status |
| --- | --- | --- |
| 1 | CSV deal import service + routes | Done |
| 2 | Activity logging on all deal mutations | Done |
| 3 | Manual note creation on activity timeline | Done |
| 4 | CRM sync service (HubSpot) | Done |
| 5 | Slack notification dispatch (Block Kit) | Done |
| 6 | Email digest service + daily cron queue | Done |
| 7 | Webhook receiver (HubSpot events) | Done |
| 8 | ImportModal component (drag-and-drop CSV) | Done |
| 9 | Enhanced activity timeline in DealDetail | Done |
| 10 | Real OAuth flow in Integrations page | Done |
| 11 | Sync Now button for connected CRMs | Done |
| 12 | Frontend API methods (import, activities, sync) | Done |
| 13 | .env.example with all env vars documented | Done |

---

## All Phases Complete ✅

| Phase | Description | Status |
| --- | --- | --- |
| 1 | Core Backend — Staleness Engine, Rules, Analytics, Notifications | ✅ Complete |
| 2 | Frontend UI — Kanban, Slide-Over, Cmd+K, Toast, Skeletons | ✅ Complete |
| 3 | Team, Integrations, Visual Rules, Settings, Mobile | ✅ Complete |
| 4 | Analytics Charts, Dark Mode, Notifications Revamp, Onboarding | ✅ Complete |
| 5 | CRM Import, Activity Log, OAuth Integrations & Email Digest | ✅ Complete |

---

## Architecture Notes

- **Multi-tenant**: All DB queries scoped by teamId from JWT
- **Bull queues**: Staleness check every 15 min + email digest daily at 9AM UTC. NOT active on Vercel (serverless) — need separate worker for prod.
- **Analytics trends**: Only current snapshot until staleness engine builds daily history.
- **Notification dedup**: 24h window per deal + user + type to avoid repeat alerts.
- **Role hierarchy**: admin > manager > rep — enforced in both backend middleware and frontend rendering.
- **Integration OAuth**: Phase 3 scaffolded DB records and UI. Phase 5 implemented real OAuth flow with fallback.
- **Slack dispatch**: Notifications auto-dispatch to Slack DM when user has slackUserId configured.
- **Email digest**: Mock transport fallback when no EMAIL_HOST configured (logs to console).
- **Global toast**: useToast() hook from ToastContext — all pages use this instead of local state.
- **Command Palette**: Cmd+K / Ctrl+K — searches pages + live deal search via API.
- **CSV Import**: 500-deal limit, flexible column mapping, duplicate detection by crmDealId.
