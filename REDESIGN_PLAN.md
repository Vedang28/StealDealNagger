# Stale Deal Nagger — Dark Editorial UI Redesign

## Context
Transform the entire app from a light/dark SaaS look to a **permanent dark, editorial, typographic, minimal** aesthetic inspired by nitro.framer.website. Use shadcn/ui components (just installed), Motion for animations, and the user's specified design tokens. All existing functionality (data fetching, routing, auth, API calls) must remain untouched — only visual/styling changes.

## Design Direction
- **Feel**: Dark editorial — think Nitro/Linear, not colorful SaaS
- **Fonts**: Instrument Serif (display), DM Sans (body), JetBrains Mono (labels/mono)
- **Primary accent**: Warm amber `#e8a87c` (replaces orange `#f97316`)
- **Dark-only**: Remove light/dark toggle; app shell is permanently dark. Landing page keeps its own light styles.

---

## Phase 1: Foundation (sequential, everything depends on this)

### 1a. `client/index.html`
- Add Google Fonts import for Instrument Serif, DM Sans, JetBrains Mono
- Set `<html class="dark">` so dark mode is always on from first paint
- Change body bg class to `bg-[#0a0a0a]`

### 1b. `client/src/index.css`
- Remove `@import "@fontsource-variable/geist"` (replaced by Google Fonts)
- Remove theme-transitioning CSS block (no light/dark toggle)
- **Replace `@theme` block** with new font families + dark editorial color palette:
  - `--font-sans: 'DM Sans'`, `--font-serif: 'Instrument Serif'`, `--font-mono: 'JetBrains Mono'`
  - `--color-primary: #e8a87c`, `--color-foreground: #f0ede8`, `--color-muted: #888`
  - `--color-card-bg: #161616`, `--color-card-border: rgba(255,255,255,0.07)`
  - Dark status colors: healthy `#0f2318/#4ade80`, warning `#2a1f0a/#f59e0b`, stale `#2a1508/#f97316`, critical `#2a0808/#ef4444`
- **Override shadcn `:root` / `.dark` CSS variables** to dark-only values:
  - `--background: #0a0a0a`, `--foreground: #f0ede8`, `--card: #161616`, `--primary: #e8a87c`
  - `--border: rgba(255,255,255,0.07)`, `--muted-foreground: #888`, `--ring: #e8a87c`
  - `--sidebar: #0d0d0d`, `--sidebar-border: rgba(255,255,255,0.05)`
- Remove `.dark { }` override block (no longer needed)
- Update scrollbar, body, nav-active-bar colors
- Add utility classes: `.label-mono` (JetBrains Mono, 0.65rem, uppercase, #555), `.section-label` (0.7rem, #888)
- **Leave all landing page styles untouched**

### 1c. `client/src/lib/styles.js`
- **STATUS_STYLES**: dark bg + colored text (e.g., healthy: `bg-[#0f2318] text-[#4ade80] border-[#4ade8030]`)
- **ROLE_STYLES**: translucent bg (e.g., admin: `bg-purple-500/10 text-purple-400`)
- **CHART_COLORS**: `primary: "#e8a87c"`, update success/warning/danger fills
- **CHART_TOOLTIP_STYLE**: `background: "#161616"`, border rgba(255,255,255,0.07)
- **NOTIFICATION_STYLES / PROVIDER_STYLES**: match dark palette

### 1d. `client/src/context/ThemeContext.jsx`
- Force `isDark = true` always. Keep the interface for backward compat but hardcode dark class on `<html>`.

---

## Phase 2: Shared Components (parallel, after Phase 1)

### 2a. `client/src/components/ui/PageHeader.jsx`
- Title: `font-serif text-3xl text-[#f0ede8]` (Instrument Serif, no bold)
- Add optional `label` prop → renders `.section-label` above title (e.g., `.pipeline`)
- Description: `text-sm text-[#888]`

### 2b. `client/src/components/ui/StatusBadge.jsx`
- Update `statusConfig` to dark bg + colored text + border (matching STATUS_STYLES)
- Add `border` class to badge element

### 2c. `client/src/components/ui/StatCard.jsx`
- Card: `bg-[#161616] border-[rgba(255,255,255,0.07)]`, no shadow
- Label: `font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]`
- Value: `text-2xl text-[#f0ede8]`
- Icon bg: translucent amber `bg-[#e8a87c]/10 text-[#e8a87c]`
- Hover: `whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.15)' }}`

### 2d. `client/src/components/ui/AnimatedCard.jsx`
- `bg-[#161616] border-[rgba(255,255,255,0.07)]`, no shadow
- Hover: `{ y: -2, borderColor: 'rgba(255,255,255,0.15)' }`

### 2e. `client/src/components/ui/RoleBadge.jsx`
- No code changes needed — reads from updated ROLE_STYLES

---

## Phase 3: Sidebar (parallel with Phase 2, after Phase 1)

### `client/src/components/Sidebar.jsx`
- Background: `bg-[#0d0d0d]`, right border `rgba(255,255,255,0.05)`
- Brand: `font-serif text-[#f0ede8]` (Instrument Serif, cream)
- Nav links: `lowercase tracking-[0.04em]` (DM Sans)
- Active state: `text-[#f0ede8]` + `nav-active-bar` (3px amber left border) — **NO bg fill**
- Inactive: `text-[#666] hover:text-[#f0ede8]`
- **Remove theme toggle** (or hide it)
- User section: avatar `bg-[#e8a87c]/10 text-[#e8a87c]`
- **Add staggered fade-in**: wrap nav items in motion container, `staggerChildren: 0.05`
- Mobile tab bar: `bg-[#0d0d0d]/95`, `border-t border-[rgba(255,255,255,0.05)]`

---

## Phase 4: App Wrapper (parallel with Phase 2-3)

### `client/src/App.jsx`
- SidebarLayout bg: `bg-[#0f0f0f]`
- Page transition already handled by PageWrapper — just ensure `duration: 0.3`

---

## Phase 5: All Pages (parallel, after Phases 2-4)

### Common replacements across ALL pages:
| Old | New |
|-----|-----|
| `bg-white dark:bg-gray-800` | `bg-[#161616]` |
| `border-border dark:border-gray-700` | `border-[rgba(255,255,255,0.07)]` |
| `text-dark dark:text-white` | `text-[#f0ede8]` |
| `text-muted dark:text-gray-400` | `text-[#888]` |
| `bg-gray-100 dark:bg-gray-700` | `bg-[#1e1e1e]` |
| `bg-gray-50 dark:bg-gray-900` | `bg-[#111]` |
| `hover:bg-gray-50 dark:hover:bg-gray-700` | `hover:bg-[#1e1e1e]` |
| `shadow-sm` | (remove) |
| Primary buttons (solid orange) | Outlined amber: `border-[#e8a87c] text-[#e8a87c] hover:bg-[#e8a87c] hover:text-[#0a0a0a]` |
| Table headers | `font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]` |

### 5a. Dashboard.jsx
- Add `label=".pipeline"` to PageHeader
- Kanban columns: `bg-[#111]`, cards: `bg-[#161616]` with status-colored left borders
- Chart: `CartesianGrid stroke="rgba(255,255,255,0.05)"`, axis tick `#555`
- Stale deals table: mono headers, `hover:bg-[rgba(255,255,255,0.03)]`, staggered row animation

### 5b. Deals.jsx
- Add `label=".deals"` to PageHeader
- Search input: `bg-[#161616] border-[rgba(255,255,255,0.07)] placeholder:text-[#555]`
- Filter pills: `bg-[#1e1e1e] text-[#888]`, active: `bg-[#e8a87c]/10 text-[#e8a87c]`
- Buttons: outlined amber

### 5c. Analytics.jsx
- Add `label=".analytics"` to PageHeader
- All chart cards: `bg-[#161616]`
- Update heatColor() to dark editorial colors
- Export buttons: outlined amber

### 5d. Notifications.jsx
- Add `label=".notifications"` to PageHeader
- Cards: `bg-[#161616]`, unread: `border-l-2 border-l-[#e8a87c]`
- Filter tabs: `bg-[#1e1e1e]`, active: `bg-[#e8a87c]/10 text-[#e8a87c]`
- Date labels: `font-mono text-[0.7rem] text-[#555] uppercase tracking-widest`

### 5e. Rules.jsx
- Add `label=".rules"` to PageHeader
- Stage cards with colored left borders (Discovery=blue, Proposal=purple, Negotiation=amber, Closing=green)
- Input fields: `bg-[#111] border-[rgba(255,255,255,0.1)]`
- Reset button: outlined red

### 5f. Settings.jsx
- Add `label=".settings"` to PageHeader
- Section cards: `bg-[#161616]`
- Inputs: `bg-[#111] focus:border-[#e8a87c] focus:ring-[#e8a87c]/20`
- Labels: mono uppercase style
- Danger zone: `border-l-4 border-l-[#ef4444] bg-[#2a0808]/50`

### 5g. Team.jsx
- Add `label=".team"` to PageHeader
- Table: mono headers, dark rows
- Invite modal: `bg-[#161616]`

### 5h. Integrations.jsx
- Add `label=".integrations"` to PageHeader
- Cards: `bg-[#161616]`
- Connect: outlined amber, Disconnect: outlined red
- Coming soon: `bg-[#1a1a1a] text-[#555] border-[#333]`

---

## Phase 6: DealSlideOver (parallel with Phase 5)

### `client/src/components/DealSlideOver.jsx`
- Panel: `bg-[#161616]`, backdrop: `bg-black/60 backdrop-blur-sm`
- All dark:bg-gray-* → appropriate dark editorial colors
- Inputs: dark editorial style
- Timeline line: `bg-[rgba(255,255,255,0.07)]`
- Action buttons: outlined style
- Links: `text-[#e8a87c]`

---

## Execution Strategy
Launch **3 parallel agents** after Phase 1:
1. **Agent A**: Sidebar + App.jsx + shared components (PageHeader, StatusBadge, StatCard, AnimatedCard)
2. **Agent B**: Dashboard + Deals + Analytics + DealSlideOver (data-heavy pages)
3. **Agent C**: Notifications + Rules + Settings + Team + Integrations (form/config pages)

## Verification
1. `npx vite build` — must pass with 0 errors
2. Visual check on localhost: every page should be dark bg, cream text, amber accents
3. No light backgrounds should remain in the app shell (landing page excluded)
4. All buttons, badges, cards, tables should use the new editorial styling
5. Animations should be smooth (stagger, fade-up, hover lift)
6. All existing functionality (login, CRUD, filters, charts) must work unchanged
