# Stale Deal Nagger — Development Master Plan

> Screen-by-screen approach: each screen ships with its backend API + frontend UI together

## Overview

| # | Phase | Description | Duration | Key Deliverables | Status |
|---|-------|-------------|----------|------------------|--------|
| 1 | PHASE 1 | Complete Backend Core | 3-4 days | Rules API + Staleness Engine + Seed Data | NEXT |
| 2 | PHASE 2 | Dashboard + Deals Screen | 5-6 days | React shell, sidebar, Pipeline Dashboard, Deal detail | PENDING |
| 3 | PHASE 3 | Rules + Team + Integrations | 5-6 days | Rules config screen, Team mgmt, Integrations hub | PENDING |
| 4 | PHASE 4 | Analytics + Notifications + Polish | 4-5 days | Analytics screen, Notification center, Onboarding | PENDING |
| 5 | PHASE 5 | Integrations + Deploy | 3-4 days | HubSpot OAuth, Slack dispatch, Railway deploy | PENDING |

---

## The Development Approach

**Build each screen as a complete vertical slice**: Backend API → Frontend UI → Tests

This means every screen you ship is immediately functional. No "waiting for backend" or "frontend shell with no data".

---

## Team Split: Aditya + Vedang

| Person | Focus Area | Why | Screens |
|--------|-----------|-----|---------|
| **Vedang** | Frontend (React + Tailwind) | Already has Mac setup, VS Code ready, UI-focused | Dashboard, Deal Detail, Rules, Notification Center |
| **Aditya** | Backend (Express + Prisma + Integrations) | Architected the system, knows the API design | Staleness Engine, HubSpot, Slack, Analytics API |
| **Both** | Integration Testing + Polish | Final screens need both backend + frontend | Onboarding flow, Integrations Hub, Deployment |

---

## PHASE 1: Complete Backend Core (3-4 Days)

**Goal**: Every API endpoint the frontend needs is built and tested before touching React

| # | Day | Task | Type | Details | Hours | Status |
|---|-----|------|------|---------|-------|--------|
| 1 | Day 1 | Rules CRUD API | Backend | ruleService.js, ruleController.js, ruleRoutes.js, ruleValidator.js — Create, list, update, delete staleness rules per stage | 3-4h | NEXT |
| 2 | Day 1 | Seed Script with Demo Data | Backend | src/scripts/seed.js — 15-20 realistic deals across all stages/statuses, 5 reps, activities with varied dates | 2-3h | NEXT |
| 3 | Day 2 | Staleness Detection Engine | Backend | src/services/stalenessService.js — The core algorithm: fetch deals, compare against rules, transition state machine, update daysStale | 4-5h | PENDING |
| 4 | Day 2 | Bull Queue + Cron Setup | Backend | src/infrastructure/queues.js — Bull queue config, staleness check job (every 15 min), Redis connection | 2-3h | PENDING |
| 5 | Day 3 | Notification Service (DB only) | Backend | src/services/notificationService.js — Create notification records when deals transition. No Slack/email yet, just database | 2-3h | PENDING |
| 6 | Day 3 | Analytics Endpoints | Backend | Pipeline health stats, trends over time, at-risk revenue — data the dashboard charts need | 2-3h | PENDING |
| 7 | Day 3 | Test All Endpoints | Testing | Run seed, trigger staleness check manually, verify deals transition correctly, check stats reflect reality | 1-2h | PENDING |

**End of Phase 1**: You can run the staleness engine, deals transition through healthy→warning→stale→critical, and all API data is real.

---

## PHASE 2: Dashboard + Deals Screen (5-6 Days)

**Goal**: A modern, beautiful React dashboard that shows real pipeline data with interactions

| # | Day | Task | Type | Details | Hours | Status |
|---|-----|------|------|---------|-------|--------|
| 1 | Day 4 | React Project Setup | Frontend | Vite + React 18, Tailwind CSS, React Router, React Query, Zustand, shadcn/ui init, folder structure, auth context | 3-4h | PENDING |
| 2 | Day 4 | Design System + Theme | Frontend | CSS variables (light/dark), Plus Jakarta Sans + DM Sans fonts, color tokens, 8px grid, component primitives (Button, Card, Badge, Input) | 2-3h | PENDING |
| 3 | Day 5 | App Shell: Sidebar + Layout | Frontend | Collapsible sidebar (260px/72px), top nav with search + notifications bell + user avatar, main content area, dark/light mode toggle | 3-4h | PENDING |
| 4 | Day 5 | Auth Pages: Login + Register | Frontend | Beautiful login page, register with team name, JWT token storage, protected route wrapper, redirect logic | 2-3h | PENDING |
| 5 | Day 6 | Pipeline Dashboard: KPI Cards | Frontend | 4 top cards (Total Pipeline, Healthy, Stale, At-Risk Revenue) with trend arrows, sparklines, pulse animations on stale count | 3-4h | PENDING |
| 6 | Day 6 | Pipeline Dashboard: Health Chart | Frontend | Recharts stacked area chart (30 day trend), 7d/30d/90d toggle, hover tooltips, responsive sizing | 2-3h | PENDING |
| 7 | Day 7 | Pipeline Dashboard: Deals Table | Frontend | Sortable/filterable table with status badges (green/amber/red chips), search, pagination, bulk select checkboxes | 3-4h | PENDING |
| 8 | Day 7 | Deal Detail: Slide-Over Panel | Frontend | Right-side panel (480px), deal header, activity timeline, staleness gauge, suggested action card, snooze buttons (3d/7d/14d/custom) | 3-4h | PENDING |
| 9 | Day 8 | Command Palette (Cmd+K) | Frontend | Full-screen overlay, fuzzy search across deals/pages/actions, keyboard navigation, recent searches | 2-3h | PENDING |
| 10 | Day 8 | Toast Notifications + Loading | Frontend | Bottom-right toast stack (success/error/warning/info), skeleton screens for all loading states, empty state illustrations | 2-3h | PENDING |

**End of Phase 2**: A stunning dashboard where you can login, see real pipeline data, click into deals, snooze them, search with Cmd+K. This is your demo-ready MVP.

---

## PHASE 3: Rules + Team + Integrations Screens (5-6 Days)

**Goal**: All configuration screens that managers use to set up and customize the product

| # | Day | Task | Type | Details | Hours | Status |
|---|-----|------|------|---------|-------|--------|
| 1 | Day 9 | Rules Config: Pipeline Visualizer | Frontend | Visual pipeline stages as connected cards (Discovery→Proposal→Negotiation→Closing), click to edit thresholds, slider controls | 3-4h | PENDING |
| 2 | Day 9 | Rules Config: Preview Mode | Frontend | Toggle preview showing how current rules classify existing deals, reset to defaults button with confirmation modal | 2-3h | PENDING |
| 3 | Day 10 | Team Management Screen | Frontend | User list with role badges, invite modal (email + role), notification prefs per user, Slack ID mapping | 3-4h | PENDING |
| 4 | Day 10 | Team Backend: Invite + Manage API | Backend | POST /team/invite, PATCH /team/users/:id, GET /team/users — email invite (store pending), role update, deactivate | 2-3h | PENDING |
| 5 | Day 11 | Integrations Hub Screen | Frontend | Card grid: HubSpot/Salesforce/Pipedrive/Slack/Sheets logos, connection status, last sync time, connect/disconnect buttons | 3-4h | PENDING |
| 6 | Day 11 | Integration Backend: OAuth scaffold | Backend | GET /integrations, POST /integrations/:provider/connect, DELETE /integrations/:provider — OAuth URL generation, callback handler | 3-4h | PENDING |
| 7 | Day 12 | Settings Screen | Frontend | Team settings (name, timezone, digest time), user profile, password change, notification preferences, danger zone (delete team) | 2-3h | PENDING |
| 8 | Day 12 | Mobile Responsive Pass | Frontend | Sidebar → bottom tab bar on mobile, tables → card lists, slide-over → full screen, 44px tap targets | 2-3h | PENDING |

---

## PHASE 4: Analytics + Notifications + Polish (4-5 Days)

| # | Day | Task | Type | Details | Hours | Status |
|---|-----|------|------|---------|-------|--------|
| 1 | Day 13 | Analytics: Pipeline Velocity Chart | Frontend | Recharts bar chart — average days deals spend in each stage, comparison to healthy benchmarks | 2-3h | PENDING |
| 2 | Day 13 | Analytics: Staleness Heatmap | Frontend | Grid showing which stages × reps have the most stale deals, color-coded intensity | 2-3h | PENDING |
| 3 | Day 14 | Analytics: Rep Leaderboard + Trends | Frontend | Ranked by pipeline health score, revenue at risk trend line chart, deal recovery rate metrics | 3-4h | PENDING |
| 4 | Day 14 | Analytics Backend: Aggregation APIs | Backend | GET /analytics/velocity, /analytics/heatmap, /analytics/leaderboard — Prisma groupBy queries with Redis caching | 3-4h | PENDING |
| 5 | Day 15 | Notification Center Screen | Frontend | Bell icon with unread badge, dropdown grouped by today/yesterday/week, full history page with filters | 3-4h | PENDING |
| 6 | Day 15 | Onboarding Flow | Frontend | 7-step wizard: Welcome → Connect CRM → Import Deals → Configure Rules → Connect Slack → Invite Team → Tour | 3-4h | PENDING |
| 7 | Day 16 | Dark Mode Polish | Frontend | Complete dark mode pass on every screen, system preference detection, smooth theme transitions | 2-3h | PENDING |
| 8 | Day 16 | Animations + Micro-interactions | Frontend | Framer Motion page transitions, card hover effects, status badge pulse, skeleton shimmer, toast slide-in | 2-3h | PENDING |

---

## PHASE 5: Live Integrations + Deployment (3-4 Days)

| # | Day | Task | Type | Details | Hours | Status |
|---|-----|------|------|---------|-------|--------|
| 1 | Day 17 | HubSpot OAuth + Deal Sync | Backend | Full OAuth flow, deal import, activity sync, token refresh, field mapping — the real CRM connection | 4-5h | PENDING |
| 2 | Day 18 | Slack Bot: Notification Dispatch | Backend | Slack app creation, Block Kit nudge messages, interaction handler (snooze buttons), channel posting | 4-5h | PENDING |
| 3 | Day 18 | Manager Digest Email | Backend | SendGrid integration, HTML email template, daily cron at team's digestTime, pipeline summary | 2-3h | PENDING |
| 4 | Day 19 | Deployment: Railway/Render | DevOps | Dockerize app, set up Railway (Postgres + Redis + Node), env vars, CI/CD from GitHub, custom domain | 3-4h | PENDING |
| 5 | Day 19 | Frontend Deploy: Vercel | DevOps | Deploy React app to Vercel, connect to API, environment config, SSL | 1-2h | PENDING |
| 6 | Day 20 | End-to-End Testing | Testing | Full flow: register → connect HubSpot → sync deals → staleness runs → Slack nudge fires → manager digest arrives | 3-4h | PENDING |
| 7 | Day 20 | Bug Fixes + Final Polish | Both | Fix edge cases, improve error messages, add loading states for slow connections, final UI review | 2-3h | PENDING |

**End Result**: A fully deployed SaaS product where a real sales team can sign up, connect HubSpot, and start getting Slack nudges about stale deals.

---

## Frontend UI/UX Features — Complete Checklist

Every modern UI feature from the design spec, organized by category.

| # | Feature | Description | Priority | Phase | Status |
|---|---------|-------------|----------|-------|--------|
| 1 | Collapsible Sidebar | Full labels (260px) ↔ icon-only (72px) with smooth animation | P0 | Phase 2 | PENDING |
| 2 | Top Navigation Bar | Search input, notifications bell with badge, user avatar dropdown | P0 | Phase 2 | PENDING |
| 3 | Dark/Light Mode Toggle | CSS variables swap, system preference detection, localStorage persistence | P1 | Phase 4 | PENDING |
| 4 | Command Palette (Cmd+K) | Overlay with fuzzy search across deals, pages, actions. Keyboard nav | P1 | Phase 2 | PENDING |
| 5 | Bottom Tab Bar (Mobile) | Sidebar becomes tab bar on < 768px with 5 core nav items | P2 | Phase 3 | PENDING |
| 6 | KPI Cards (4) | Total Pipeline, Healthy, Stale, At-Risk Revenue. Trend arrows, sparklines | P0 | Phase 2 | PENDING |
| 7 | Pipeline Health Chart | Stacked area chart (Recharts), 7d/30d/90d toggle, hover tooltips | P0 | Phase 2 | PENDING |
| 8 | Deals Table | Sortable, filterable, searchable. Status badges, bulk select, pagination | P0 | Phase 2 | PENDING |
| 9 | Deal Slide-Over Panel | Right-side 480px panel. Activity timeline, staleness gauge, snooze buttons | P0 | Phase 2 | PENDING |
| 10 | Status Badges | Green/amber/red/pulsing-red chips for healthy/warning/stale/critical | P0 | Phase 2 | PENDING |
| 11 | Toast Notifications | Bottom-right stack. Success/error/warning/info. Auto-dismiss 5s. Swipe to close | P0 | Phase 2 | PENDING |
| 12 | Skeleton Loading Screens | Pulse-animated placeholders for every data-loading state | P1 | Phase 2 | PENDING |
| 13 | Empty State Illustrations | Custom art for: no deals, no stale deals (celebration), no integrations | P1 | Phase 4 | PENDING |
| 14 | Inline Deal Editing | Click deal row → slide-over panel with edit fields | P1 | Phase 2 | PENDING |
| 15 | Bulk Actions | Select multiple deals → snooze/reassign/mark as lost dropdown | P2 | Phase 3 | PENDING |
| 16 | Pipeline Stage Visualizer | Connected cards showing stages with threshold sliders | P0 | Phase 3 | PENDING |
| 17 | Rules Preview Mode | Toggle showing how rules classify current deals | P1 | Phase 3 | PENDING |
| 18 | Invite User Modal | Email + role selector + send invite button | P0 | Phase 3 | PENDING |
| 19 | Integration Cards Grid | Logo, status, last sync, connect/disconnect per provider | P0 | Phase 3 | PENDING |
| 20 | Pipeline Velocity Chart | Bar chart — avg days per stage vs healthy benchmark | P1 | Phase 4 | PENDING |
| 21 | Staleness Heatmap | Stage × Rep grid, color intensity by stale count | P2 | Phase 4 | PENDING |
| 22 | Rep Leaderboard | Ranked by pipeline health %, deal recovery rate | P2 | Phase 4 | PENDING |
| 23 | Revenue at Risk Trend | Line chart over 30/60/90 days | P1 | Phase 4 | PENDING |
| 24 | Page Transitions | Framer Motion fade/slide between routes | P2 | Phase 4 | PENDING |
| 25 | Micro-interactions | Card hover lift, button press scale, badge pulse, shimmer effect | P2 | Phase 4 | PENDING |
| 26 | Onboarding Wizard | 7-step flow for new users: CRM → Rules → Slack → Team → Tour | P1 | Phase 4 | PENDING |
| 27 | Notification Center | Bell dropdown + full history page with filters | P1 | Phase 4 | PENDING |
| 28 | Export Reports (PDF/CSV) | Download pipeline health as PDF, deal list as CSV | P2 | Phase 4 | PENDING |

---

*End of Development Plan — Ready to execute phase by phase*
