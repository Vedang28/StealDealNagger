# Stale Deal Nagger — Complete Project Documentation

**Version 1.0 | February 2026 | Confidential**

Built by: Aditya & Vedang

---

## Table of Contents

1. [Progress Checklist](#progress-checklist)
2. [System Architecture & How It Works](#system-architecture--how-it-works)
3. [UI/UX Design Specification](#uiux-design-specification)
4. [Services & Authentication Reference](#services--authentication-reference)

---

# PART 1: Progress Checklist

A complete record of every task completed during the Stale Deal Nagger development, organized by category.

## Development Environment Setup

| # | Task | Status | Version |
|---|------|--------|---------|
| 1 | Node.js 20 LTS via nvm | Done | v20.20.0 |
| 2 | npm package manager | Done | v10.8.2 |
| 3 | Docker Desktop | Done | v29.2.0 |
| 4 | Git configured + GitHub repo | Done | v2.50.1 |
| 5 | Claude Code CLI | Done | v2.1.42 |
| 6 | VS Code + 8 extensions installed | Done | v1.109.5 |
| 7 | PostgreSQL 16 (Docker) | Done | alpine |
| 8 | Redis 7 (Docker) | Done | alpine |
| 9 | Prettier + ESLint configured | Done | - |
| 10 | nodemon.json created | Done | - |

## Project Scaffold

| # | Task | Status | Day |
|---|------|--------|-----|
| 1 | npm init + core dependencies (express, prisma, bull, etc.) | Done | 1 |
| 2 | Dev dependencies (nodemon, jest, supertest) | Done | 1 |
| 3 | Prisma init + schema.prisma with 7 tables | Done | 1 |
| 4 | prisma.config.ts with dotenv | Done | 1 |
| 5 | docker-compose.yml (Postgres + Redis) | Done | 1 |
| 6 | First migration: npx prisma migrate dev --name init | Done | 1 |
| 7 | Prisma v7 adapter fix (@prisma/adapter-pg) | Done | 1 |
| 8 | Folder structure: controllers, services, routes, validators, middleware, config | Done | 1 |

## Core Backend Files

| # | File | Purpose | Status |
|---|------|---------|--------|
| 1 | src/config/index.js | Central config (JWT, Redis, env) | Done |
| 2 | src/config/logger.js | Winston logger | Done |
| 3 | src/config/prisma.js | Prisma client with PrismaPg adapter | Done |
| 4 | src/middleware/errorHandler.js | AppError class + global handler | Done |
| 5 | src/middleware/auth.js | JWT authenticate + authorize | Done |
| 6 | src/app.js | Express app with routes | Done |
| 7 | src/server.js | Entry point + graceful shutdown | Done |

## Auth System (Day 1)

| # | File | Features | Status |
|---|------|----------|--------|
| 1 | validators/authValidator.js | Joi schemas: register + login | Done |
| 2 | services/authService.js | Register (team+user+rules), login, bcrypt, JWT | Done |
| 3 | controllers/authController.js | HTTP handlers with error forwarding | Done |
| 4 | routes/authRoutes.js | POST /register, POST /login | Done |

## Deals CRUD API (Day 1)

| # | File | Features | Status |
|---|------|----------|--------|
| 1 | validators/dealValidator.js | Create, update, list query, snooze schemas | Done |
| 2 | services/dealService.js | CRUD + snooze + stats + soft delete | Done |
| 3 | controllers/dealController.js | 8 endpoints: create, list, get, update, snooze, unsnooze, delete, stats | Done |
| 4 | routes/dealRoutes.js | JWT-protected routes with validation | Done |

## API Endpoints Tested

| Method | Endpoint | Response | Code | Status |
|--------|----------|----------|------|--------|
| GET | /health | Server OK | 200 | Tested |
| POST | /api/v1/auth/register | User + Team + Tokens | 201 | Tested |
| POST | /api/v1/auth/login | User + Tokens | 200 | Tested |
| POST | /api/v1/deals | Created deal | 201 | Tested |
| GET | /api/v1/deals | List with pagination | 200 | Tested |
| GET | /api/v1/deals/stats | Pipeline stats | 200 | Tested |
| GET | /api/v1/deals/:id | Deal with activities | 200 | Built |
| PATCH | /api/v1/deals/:id | Updated deal | 200 | Built |
| POST | /api/v1/deals/:id/snooze | Snoozed deal | 200 | Built |
| DELETE | /api/v1/deals/:id/snooze | Unsnoozed deal | 200 | Built |
| DELETE | /api/v1/deals/:id | Soft-deleted deal | 200 | Built |

## Remaining Work

| # | Task | Category | Week | Status |
|---|------|----------|------|--------|
| 1 | Rules CRUD API (staleness config per stage) | Backend | 1 | Next |
| 2 | Staleness Detection Engine (cron + Bull queue) | Backend | 2 | Pending |
| 3 | HubSpot OAuth + Deal Sync | Integration | 2 | Pending |
| 4 | Slack Notification Dispatch | Integration | 2 | Pending |
| 5 | Manager Digest Email (SendGrid) | Integration | 3 | Pending |
| 6 | React Dashboard Frontend | Frontend | 3 | Pending |
| 7 | Pipeline Health Analytics | Backend | 3 | Pending |
| 8 | Deployment (Railway/Render) | DevOps | 4 | Pending |
| 9 | Unit + Integration Tests | Testing | 4 | Pending |
| 10 | Snooze Expiry Worker | Backend | 4 | Pending |

---

# PART 2: System Architecture & How It Works

A complete technical breakdown of how the Stale Deal Nagger system operates end-to-end, from CRM integration to notification delivery.

## The Problem We Solve

Sales reps manage dozens of deals simultaneously. Some deals go silent with no calls, emails, or meetings logged for days or weeks. By the time a sales manager notices, the deal is dead. Managers spend 2-3 hours per week manually scanning CRM dashboards trying to find these cold deals. This tool automates that entire process.

## System Overview

The Stale Deal Nagger is a 5-layer backend system that continuously monitors CRM deal activity and automatically alerts sales teams when deals go cold.

### Layer 1: API Layer (Express.js Controllers + Routes)

Handles all HTTP requests. JWT-authenticated. Input validation via Joi. RESTful endpoints for deals, rules, teams, auth, integrations, and analytics.

### Layer 2: Service Layer (Business Logic)

Contains all business rules. Auth service handles registration, login, token generation. Deal service manages CRUD, snooze logic, stats aggregation. Staleness service runs the detection algorithm. Notification service dispatches alerts.

### Layer 3: Repository Layer (Prisma ORM)

All database access goes through Prisma Client with the PrismaPg adapter for Prisma v7 compatibility. 7 tables: Teams, Users, Deals, Activities, Rules, Notifications, Integrations.

### Layer 4: Integration Layer (CRM + Notifications)

Adapter pattern for CRM providers (HubSpot, Salesforce, Pipedrive). Each adapter implements a common interface: syncDeals(), syncActivities(), getAuthUrl(), handleCallback(). Notification dispatchers for Slack, Email, and Teams.

### Layer 5: Infrastructure Layer (Queues + Jobs)

Bull queues backed by Redis for async job processing. Cron-scheduled jobs for staleness checks (every 15 minutes), CRM sync (every 30 minutes), and manager digest emails (daily at configured time).

## The Staleness Detection Algorithm

This is the core IP of the product. Here is exactly how it works:

1. Every 15 minutes, a Bull queue job runs the **Staleness Check Worker**.
2. The worker fetches all active deals grouped by team.
3. For each deal, it calculates: `daysSinceLastActivity = today minus lastActivityAt`
4. It matches the deal to the team's staleness rules by stage (e.g., Discovery deals stale after 7 days, Closing deals stale after 2 days).
5. It checks if the deal is snoozed (`snoozedUntil` is in the future). If snoozed, skip.
6. Based on `daysSinceLastActivity` vs the rule thresholds, it transitions the deal through a state machine:
   - **Healthy**: `daysSinceLastActivity < staleAfterDays`
   - **Warning**: `daysSinceLastActivity >= staleAfterDays` (notify rep)
   - **Stale**: `daysSinceLastActivity >= escalateAfterDays` (notify rep + manager)
   - **Critical**: `daysSinceLastActivity >= criticalAfterDays` (notify everyone + VP)
7. When status changes, a notification is created and queued for dispatch.
8. The notification includes a suggested action based on the deal stage (e.g., 'Send follow-up email' for Discovery, 'Schedule closing call' for Negotiation).

## HubSpot Integration Flow

This is how the CRM connection works end-to-end:

### Step 1: OAuth Connection

- The sales manager clicks 'Connect HubSpot' in the dashboard.
- The app redirects to HubSpot's OAuth authorization page.
- The manager grants permission.
- HubSpot redirects back with an authorization code.
- We exchange this for access + refresh tokens and store them encrypted in the Integrations table.

### Step 2: Initial Sync

- Immediately after connection, we run a full sync.
- We call HubSpot's Deals API to pull all deals in the pipeline.
- For each deal, we call the Engagements API to get the last activity (email, call, meeting, note).
- We create Deal and Activity records in our database, mapping HubSpot fields to our schema.

### Step 3: Ongoing Sync (Every 30 Minutes)

- A Bull queue cron job runs every 30 minutes.
- It checks for new or updated deals using HubSpot's 'recently modified' endpoint (uses lastSyncAt timestamp to only fetch changes).
- New activities are synced, `lastActivityAt` is updated on the deal record.
- If the OAuth token is about to expire, we auto-refresh it using the refresh token.

### Step 4: Webhook Listeners (Optional Enhancement)

Instead of polling, HubSpot can push changes to us via webhooks. When a deal is updated or an activity is logged, HubSpot sends a POST to our webhook URL. We validate the signature and update our records in real-time. This reduces latency from 30 minutes to near-instant.

## Slack Notification Flow

When a deal transitions to stale, here is what happens:

1. The Staleness Engine creates a Notification record (type: 'nudge', channel: 'slack', status: 'pending').
2. The Notification Dispatcher picks it up from the Bull queue.
3. It looks up the rep's `slackUserId` from the Users table.
4. It constructs a Slack Block Kit message with:
   - Deal name
   - Days stale
   - Deal value
   - Current stage
   - Suggested action
   - Action buttons (Snooze 3 Days, Snooze 7 Days, View Deal)
5. It sends the message via Slack's `chat.postMessage` API using the team's Slack bot token.
6. If the rep clicks 'Snooze 3 Days', Slack sends an interaction payload to our webhook. We update the deal's `snoozedUntil` and create a snooze_expiry notification scheduled for 3 days later.
7. If the deal remains stale past the escalation threshold, a second notification goes to the manager with additional context about how long the deal has been cold and the at-risk revenue.

## Manager Digest Email

Every day at the team's configured `digestTime` (default 9:00 AM in their timezone), a digest email is sent to all managers. It contains:

- Total pipeline value
- Number of stale/critical deals with combined at-risk revenue
- Top 5 most urgent deals with rep names and days stale
- A weekly trend showing whether pipeline health is improving or declining
- A direct link to the dashboard

## Database Schema Summary

| Table | Purpose | Key Fields | Records |
|-------|---------|-----------|---------|
| Teams | Organization/company account | slug, plan, timezone | 1 per org |
| Users | Sales reps, managers, admins | role, slackUserId | N per team |
| Deals | CRM opportunities being monitored | stalenessStatus, daysStale | Core entity |
| Activities | Emails, calls, meetings per deal | type, performedAt | Many per deal |
| Rules | Staleness thresholds per stage | staleAfterDays | 4-8 per team |
| Notifications | Alert history and status | type, channel, status | Many per deal |
| Integrations | OAuth tokens for CRM/Slack | accessToken, provider | 1-3 per team |

## Security & Authentication

- JWT-based auth with access tokens (15 min expiry) and refresh tokens (7 day expiry)
- Passwords hashed with bcrypt at 12 salt rounds
- Team-scoped data isolation (every query filters by teamId)
- Role-based access control: admin, manager, rep
- CRM OAuth tokens stored encrypted in database
- Input validation on every endpoint via Joi schemas
- Helmet.js for HTTP security headers
- CORS configured for allowed origins only

---

# PART 3: UI/UX Design Specification

A complete specification for the modern dashboard frontend, covering every screen, component, interaction pattern, and design decision.

## Current State vs Target State

### Current Landing Page (What We Have)

- Single-page HTML with basic layout
- Static content, no interactivity
- No sidebar, no popups, no animations
- No responsive design system
- No dashboard or authenticated user experience

### Target Dashboard (What We Need)

- Collapsible sidebar navigation with icon-only mode
- Command palette (Cmd+K) for quick navigation and actions
- Real-time notifications with toast popups and a notification center
- Dark mode / Light mode toggle with system preference detection
- Animated page transitions and micro-interactions
- Contextual help tooltips and onboarding flow for new users
- Drag-and-drop deal prioritization
- Inline deal editing with slide-over panels
- Data visualization with interactive charts (Recharts)
- Mobile-responsive with card-based views on small screens

## Design System

### Typography

- **Primary font**: Plus Jakarta Sans (display headings, buttons, navigation)
- **Secondary font**: DM Sans (body text, data tables, form labels)
- **Monospace**: JetBrains Mono (code snippets, deal IDs, API responses)

### Color Palette

| Name | Hex | Usage | Mode |
|------|-----|-------|------|
| Navy 950 | #0F172A | Sidebar bg, dark mode bg | Both |
| Blue 500 | #3B82F6 | Primary action, links, active states | Both |
| Emerald 500 | #10B981 | Healthy status, success | Both |
| Amber 500 | #F59E0B | Warning status, caution | Both |
| Rose 500 | #F43F5E | Critical/stale status, errors | Both |
| Slate 100 | #F1F5F9 | Page background | Light |
| Slate 800 | #1E293B | Page background | Dark |
| White | #FFFFFF | Card backgrounds | Light |
| Slate 900 | #0F172A | Card backgrounds | Dark |

### Spacing & Layout

- **Grid**: 8px grid system
- **Border radius**: 12px (cards)
- **Sidebar**: 260px (expanded), 72px (collapsed)
- **Content max-width**: 1280px
- **Card padding**: 24px
- **Shadows**: 0 1px 3px rgba(0,0,0,0.1) for cards, 0 10px 25px rgba(0,0,0,0.15) for modals

## Screen-by-Screen Specification

### Screen 1: Pipeline Dashboard (Home)

The first thing users see after login. Shows pipeline health at a glance.

#### Top Row: KPI Cards (4 cards)

- **Total Pipeline Value** (e.g., $2.4M) with trend arrow and % change from last week
- **Healthy Deals** count with green pulse animation
- **Stale Deals** count with amber/red background gradient based on severity
- **At-Risk Revenue** (sum of stale + critical deal values) with revenue trend sparkline

#### Middle Section: Pipeline Health Chart

- Stacked area chart (Recharts) showing healthy/warning/stale/critical counts over the last 30 days
- Hover tooltips with exact values per day
- Toggle between 7d / 30d / 90d views

#### Bottom Section: Stale Deals Table

- Sortable, filterable table with columns: Deal Name, Rep, Stage, Amount, Days Stale, Status Badge, Actions
- Status badges: green chip (healthy), amber chip (warning), red chip (stale), pulsing red chip (critical)
- Row click opens slide-over panel with deal details
- Bulk actions: select multiple deals and snooze, reassign, or mark as lost
- Inline search with debounced filtering

### Screen 2: Deal Detail (Slide-Over Panel)

Opens as a right-side panel (480px wide) sliding over the dashboard content with a dark overlay.

- Deal header: name, stage badge, amount, owner avatar
- Activity timeline: vertical timeline showing all logged activities with icons (email, call, meeting, note)
- Staleness indicator: visual gauge showing days since last activity vs threshold
- Suggested action card: highlighted suggestion with one-click action (e.g., 'Send Follow-Up' opens email template)
- Snooze controls: quick buttons for 3d / 7d / 14d / custom date picker
- Notification history: past alerts sent for this deal

### Screen 3: Rules Configuration

Where managers define staleness thresholds per pipeline stage.

- Visual pipeline stages shown as connected cards (Discovery -> Proposal -> Negotiation -> Closing)
- Each stage card shows: stale threshold (days), escalation threshold, critical threshold
- Click to edit with inline number inputs and slider controls
- Drag-and-drop to reorder stages
- Preview mode: shows how current rules would classify existing deals
- Reset to defaults button with confirmation modal

### Screen 4: Team Management

- User list with role badges (Admin, Manager, Rep)
- Invite user modal with email input and role selector
- Per-user notification preferences (Slack DM, email, both, none)
- Slack user ID mapping for each team member
- Activity log showing team actions

### Screen 5: Integrations Hub

- Card grid showing available integrations: HubSpot, Salesforce, Pipedrive, Slack, Google Sheets
- Each card shows: logo, connection status (Connected/Disconnected), last sync time
- Connect button initiates OAuth flow
- Connected integrations show sync health metrics and a 'Disconnect' option with confirmation
- Sync log showing recent sync operations with success/failure counts

### Screen 6: Analytics & Reports

- Pipeline velocity chart: average time deals spend in each stage
- Staleness heatmap: grid showing which stages and reps have the most stale deals
- Rep leaderboard: ranked by pipeline health score (% deals that are healthy)
- Deal recovery rate: percentage of stale deals that became active again after nudging
- Revenue at risk trend: line chart showing at-risk revenue over time
- Exportable reports: PDF and CSV download

### Screen 7: Notification Center

- Bell icon in top nav with unread count badge
- Click opens dropdown with recent notifications grouped by today/yesterday/this week
- Each notification shows: deal name, alert type, time ago, suggested action
- Mark as read, mark all as read, notification preferences link
- Full notification history page with filters by type, date range, and deal

## Global UI Components

### Sidebar Navigation

- Collapsible: toggle between full labels and icon-only mode
- Items: Dashboard, Deals, Rules, Team, Integrations, Analytics, Settings
- Active state: blue left border + blue background tint
- Bottom section: user avatar, name, role, logout button
- Animated expand/collapse with smooth width transition

### Command Palette (Cmd+K)

- Full-screen overlay with centered search input
- Fuzzy search across: deals, team members, settings, actions
- Recent searches shown by default
- Keyboard navigation with arrow keys and Enter to select

### Toast Notifications

- Bottom-right stack with auto-dismiss (5 seconds)
- Types: success (green), error (red), warning (amber), info (blue)
- Click to expand for details, swipe to dismiss

### Empty States

- Custom illustrations for: no deals, no stale deals (celebration), no integrations connected
- Each empty state includes a primary CTA button guiding the user to the next action

### Loading States

- Skeleton screens (not spinners) for all data-loading states
- Pulse animation on skeleton elements
- Progressive loading: show cached data immediately, update when fresh data arrives

## Tech Stack for Frontend

| Technology | Purpose | Why This Choice |
|------------|---------|-----------------|
| React 18 | UI framework | Component-based, massive ecosystem, team familiarity |
| Tailwind CSS | Styling | Utility-first, fast iteration, great dark mode support |
| React Router v6 | Navigation | Nested routes, layouts, protected routes |
| Recharts | Data visualization | Built for React, declarative API, responsive charts |
| React Query (TanStack) | Server state management | Auto-caching, refetching, optimistic updates |
| Zustand | Client state | Lightweight, simple API, no boilerplate |
| Framer Motion | Animations | Page transitions, micro-interactions, gestures |
| React Hook Form | Form handling | Performance, validation integration, minimal re-renders |
| shadcn/ui | Component library | Accessible, customizable, Tailwind-native |
| Lucide Icons | Iconography | Consistent, lightweight, tree-shakeable |

## Onboarding Flow for New Users

1. **Welcome modal**: team name and timezone setup
2. **Connect CRM**: guided OAuth flow with HubSpot (big blue button, animated connection status)
3. **Import deals**: progress bar showing sync progress with real-time count
4. **Configure rules**: pre-filled with sensible defaults, user can adjust sliders
5. **Connect Slack**: OAuth flow with channel selection for team alerts
6. **Invite team**: email input with role assignment
7. **Dashboard tour**: step-by-step tooltip walkthrough of key features (skip option available)

## Mobile Responsive Strategy

The dashboard must work on tablets and phones for reps checking pipeline on the go.

**Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)

- **Mobile**: sidebar becomes bottom tab bar, tables become card lists, slide-over becomes full-screen
- **Tablet**: sidebar collapses to icon-only, content fills remaining space
- **Desktop**: full sidebar + content layout
- **Touch-friendly**: minimum 44px tap targets, swipe gestures for snooze/dismiss

## Pricing Model

| Feature | Growth (149/mo) | Scale (299/mo) |
|---------|-----------------|----------------|
| Pipeline Monitoring | 1 pipeline | Unlimited pipelines |
| Team Size | Up to 10 users | Unlimited users |
| CRM Integrations | 1 CRM | Multiple CRMs |
| Notifications | Slack only | Slack + Email + Teams |
| Analytics | Basic stats | Full analytics + export |
| Support | Email | Priority + Onboarding call |
| API Access | No | Yes |

---

# PART 4: Services & Authentication Reference

## Service Architecture Map

| Service | Responsibility | Dependencies | Status |
|---------|-----------------|--------------|--------|
| AuthService | Register, login, JWT token generation/refresh | Prisma, bcrypt, jwt | Built |
| DealService | CRUD, snooze, unsnooze, stats, soft delete | Prisma | Built |
| RuleService | Staleness rule CRUD per stage/pipeline | Prisma | Next |
| StalenessService | Detection algorithm, state transitions | DealService, RuleService, Bull | Week 2 |
| NotificationService | Create, queue, dispatch, dedup alerts | Bull, Slack SDK, SendGrid | Week 2 |
| IntegrationService | OAuth flow, token management, sync orchestration | Prisma, axios | Week 2 |
| HubSpotAdapter | Deal sync, activity sync, field mapping | HubSpot API, axios | Week 2 |
| SlackDispatcher | Block Kit messages, interaction handling | Slack Web API | Week 2 |
| AnalyticsService | Pipeline health, trends, rep performance | Prisma, Redis cache | Week 3 |
| DigestService | Daily manager email compilation | SendGrid, AnalyticsService | Week 3 |

## Authentication Flow (Detailed)

### Registration Flow

1. User submits teamName, name, email, password
2. Joi validates input (email format, password min 8 chars)
3. Check if email exists (409 Conflict if duplicate)
4. Begin Prisma transaction
5. Create Team with slug derived from teamName
6. Hash password with bcrypt (12 rounds)
7. Create User with role 'admin' linked to team
8. Create 4 default staleness rules for the team
9. Commit transaction
10. Generate JWT access token (15 min) and refresh token (7 days)
11. Return user, team, and tokens

### Login Flow

1. User submits email, password
2. Joi validates input
3. Find user by email (401 if not found)
4. bcrypt.compare password (401 if mismatch)
5. Check user.isActive (403 if deactivated)
6. Generate fresh JWT tokens
7. Return user, team, and tokens

### Protected Route Flow

1. Client sends `Authorization: Bearer <token>` header
2. Auth middleware extracts and verifies JWT
3. Decoded payload (userId, teamId, role) attached to req.user
4. All subsequent queries filter by req.user.teamId (data isolation)
5. Optional: authorize middleware checks role against allowed roles

## Complete API Endpoint Reference

| Method | Endpoint | Auth Required | Status |
|--------|----------|---|--------|
| GET | /health | No | Live |
| POST | /api/v1/auth/register | No | Live |
| POST | /api/v1/auth/login | No | Live |
| POST | /api/v1/auth/refresh | Refresh Token | Planned |
| GET | /api/v1/deals | JWT | Live |
| POST | /api/v1/deals | JWT | Live |
| GET | /api/v1/deals/stats | JWT | Live |
| GET | /api/v1/deals/:id | JWT | Live |
| PATCH | /api/v1/deals/:id | JWT | Live |
| DELETE | /api/v1/deals/:id | JWT | Live |
| POST | /api/v1/deals/:id/snooze | JWT | Live |
| DELETE | /api/v1/deals/:id/snooze | JWT | Live |
| GET | /api/v1/rules | JWT | Next |
| POST | /api/v1/rules | JWT (admin/mgr) | Next |
| PATCH | /api/v1/rules/:id | JWT (admin/mgr) | Next |
| DELETE | /api/v1/rules/:id | JWT (admin) | Next |
| GET | /api/v1/analytics/pipeline | JWT | Planned |
| GET | /api/v1/analytics/trends | JWT | Planned |
| GET | /api/v1/integrations | JWT | Planned |
| POST | /api/v1/integrations/hubspot/connect | JWT (admin) | Planned |
| POST | /api/v1/integrations/slack/connect | JWT (admin) | Planned |
| GET | /api/v1/notifications | JWT | Planned |
| POST | /api/v1/team/invite | JWT (admin/mgr) | Planned |

---

**End of Document**

Stale Deal Nagger | February 2026 | v1.0
