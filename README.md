# 🔔 Stale Deal Nagger

**Stop losing revenue to forgotten deals. Automatically detect stale opportunities, nag your reps, and rescue your pipeline.**

Sales managers spend 2–3 hours every week combing through CRM data trying to find deals that have gone cold. By the time they notice, the prospect has ghosted or signed with a competitor. Stale Deal Nagger eliminates that entirely.

---

## The Problem

Every sales pipeline has deals that silently die. No call logged in 10 days. No email sent in two weeks. A proposal sitting in Stage 4 with zero follow-up. Sales managers catch some of these during their weekly CRM reviews — but most slip through the cracks.

The result? Lost revenue, wasted pipeline, and frustrated managers playing detective instead of coaching their team.

**Salesforce and HubSpot have workflow rules**, but they're painful to configure, rigid, and require an admin to maintain. Most teams give up halfway through setup.

## The Solution

Stale Deal Nagger is a plug-and-play pipeline monitoring tool that connects to your CRM, watches every deal for inactivity, and automatically nudges reps before deals go cold.

No complex workflow builders. No admin overhead. Connect, configure your thresholds, and let it nag.

---

## How It Works

### 1. Connect Your CRM
One-click integration with Salesforce, HubSpot, Pipedrive, and Zoho. Syncs deal data, activity history, and pipeline stages in real time.

### 2. Set Staleness Rules
Define what "stale" means for your team — and it can vary by deal stage:

| Deal Stage | Flag After | Escalate After |
|---|---|---|
| Discovery | 5 days no activity | 8 days |
| Proposal Sent | 3 days no activity | 5 days |
| Negotiation | 2 days no activity | 4 days |
| Closing | 1 day no activity | 2 days |

Rules are fully customizable per pipeline, deal size, or rep.

### 3. Auto-Nag Reps
When a deal crosses the staleness threshold:
- **Rep gets a nudge** via Slack, email, or MS Teams with deal context and suggested next action
- **Manager gets a summary** — daily digest of all stale deals across the team
- **Escalation kicks in** if the deal stays cold after the first nudge

### 4. Smart Action Suggestions
Based on the deal stage and history, the system suggests what to do next:
- *Discovery stage stale?* → "Send a value-add resource or case study"
- *Proposal sent, no reply?* → "Follow up with a 'just checking in' + add urgency"
- *Negotiation stalled?* → "Offer a limited-time incentive or schedule a call"
- *Champion gone quiet?* → "Try a different contact at the account"

### 5. Pipeline Health Dashboard
A single view showing:
- Total stale deals and at-risk revenue
- Average days stale by stage
- Rep-level staleness leaderboard (or "wall of shame")
- Trend over time — is pipeline hygiene improving or getting worse?

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js / Express (or Python / FastAPI) |
| **Database** | PostgreSQL — deal snapshots, activity logs, alert history |
| **Queue / Scheduler** | Bull (Redis-backed) — scheduled staleness checks, alert dispatch |
| **CRM Integrations** | Salesforce REST API, HubSpot API, Pipedrive API |
| **Notifications** | Slack Webhooks, SendGrid (email), MS Teams Connectors |
| **Frontend** | React + Tailwind — dashboard, rule configuration, team settings |
| **Auth** | OAuth 2.0 (CRM login) + JWT session management |
| **Hosting** | AWS / Railway / Render |

---

## Project Structure

```
stale-deal-nagger/
├── server/
│   ├── src/
│   │   ├── integrations/        # CRM connectors (Salesforce, HubSpot, etc.)
│   │   ├── engine/              # Staleness detection logic & rule evaluation
│   │   ├── notifications/       # Slack, email, Teams alert dispatchers
│   │   ├── suggestions/         # AI/rule-based next-action recommendations
│   │   ├── routes/              # API endpoints
│   │   ├── models/              # Database models (deals, rules, alerts)
│   │   ├── jobs/                # Scheduled jobs (sync, check, nag)
│   │   └── app.js
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/               # Dashboard, Settings, Deal Detail
│   │   ├── components/          # Charts, Deal Cards, Alert Feed
│   │   └── App.jsx
│   └── package.json
├── docs/
├── .env.example
└── README.md
```

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/yourusername/stale-deal-nagger.git
cd stale-deal-nagger

# Install dependencies
cd server && npm install
cd ../client && npm install

# Set up environment variables
cp .env.example .env
# Add your CRM API keys, Slack webhook URL, DB connection string

# Run database migrations
npm run migrate

# Start the development server
npm run dev
```

---

## Configuration

All staleness rules are managed through the dashboard UI or via the config API:

```json
{
  "pipeline": "Default Pipeline",
  "rules": [
    {
      "stage": "Discovery",
      "stale_after_days": 5,
      "escalate_after_days": 8,
      "notify": ["slack", "email"],
      "suggested_action": "Send a relevant case study or resource"
    },
    {
      "stage": "Proposal Sent",
      "stale_after_days": 3,
      "escalate_after_days": 5,
      "notify": ["slack"],
      "suggested_action": "Follow up on the proposal with a quick check-in"
    }
  ],
  "digest_time": "09:00",
  "timezone": "Europe/London"
}
```

---

## Key Features

- **CRM-Agnostic** — Works with Salesforce, HubSpot, Pipedrive, Zoho out of the box
- **Stage-Aware Rules** — Different staleness thresholds for different deal stages
- **Multi-Channel Alerts** — Slack, email, Microsoft Teams
- **Manager Digests** — Daily/weekly summary of all stale deals across the team
- **Escalation Chains** — Nudge rep first, then loop in manager, then flag as at-risk
- **Action Suggestions** — Context-aware next steps based on deal stage and history
- **Pipeline Health Dashboard** — Visual overview of pipeline hygiene and trends
- **Rep Leaderboard** — Track which reps keep deals moving vs. letting them rot
- **Deal Size Weighting** — Prioritize high-value stale deals over small ones
- **Snooze & Dismiss** — Reps can snooze alerts for valid reasons (vacation, long procurement cycle)

---

## Target Users

| Who | Why They Care |
|---|---|
| **Sales Managers** | Stop wasting hours on CRM reviews. Get a daily digest instead. |
| **RevOps Teams** | Enforce pipeline hygiene without building complex workflow rules. |
| **VP of Sales** | Visibility into pipeline health and at-risk revenue across all teams. |
| **Sales Reps** | Gentle nudges before deals slip — and clear guidance on what to do next. |

---

## Pricing Model

| Plan | Price | Includes |
|---|---|---|
| **Starter** | £149/month | 1 pipeline, 5 reps, Slack + email alerts |
| **Growth** | £249/month | Unlimited pipelines, 20 reps, dashboard + suggestions |
| **Scale** | £299/month | Unlimited everything, API access, custom integrations, priority support |

---

## Roadmap

- [x] Core staleness detection engine
- [x] Salesforce & HubSpot integrations
- [x] Slack & email notifications
- [ ] Microsoft Teams integration
- [ ] AI-powered action suggestions (GPT-based, context-aware)
- [ ] Pipedrive & Zoho connectors
- [ ] Deal risk scoring (likelihood of closing based on activity patterns)
- [ ] Mobile app for managers
- [ ] Automated follow-up drafts (generate the email, not just suggest it)
- [ ] CRM-native widgets (embedded Salesforce/HubSpot components)

---

## Why This Exists

Salesforce workflow rules can technically do parts of this — but they're a nightmare to set up, impossible to maintain, and most teams abandon them within a month.

**Stale Deal Nagger is the plug-and-play alternative.** Connect your CRM, set your rules, and stop losing deals to silence.

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/your-feature

# Commit your changes
git commit -m "Add: your feature description"

# Push and open a PR
git push origin feature/your-feature
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

**Built for sales teams who are tired of deals dying in silence.** 🔔
