# 21st.dev AI Designer Agent

A standalone AI Designer agent for Stale Deal Nagger, powered by the 21st SDK.

## What It Does

This agent provides four tools for AI-assisted UI design:

1. **Generate Component** — Create React/Tailwind components from natural language descriptions
2. **Get Inspiration** — Browse 21st.dev's component library for design patterns
3. **Refine Component** — Improve existing components (dark mode, accessibility, styling)
4. **Search Logo** — Find brand logos for integration cards

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Key

Copy `.env.example` to `.env` and add your 21st.dev API key:

```bash
cp .env.example .env
```

Edit `.env` and set `TWENTY_FIRST_API_KEY=your_key_here`

### 3. Authenticate with 21st CLI

```bash
npx @21st-sdk/cli login
```

This opens a browser window for authentication. Log in with your 21st.dev account.

### 4. Deploy the Agent

```bash
npm run deploy
```

Or manually:

```bash
npx @21st-sdk/cli deploy
```

After deployment, you'll see output like:

```
✓ Deployed to https://api.21st.dev/agents/stale-deal-nagger-ai-designer
```

**Save this URL** — you need it for the frontend.

## Frontend Integration

Copy the deployed URL and add it to `client/.env`:

```
VITE_AGENT_URL=https://api.21st.dev/agents/stale-deal-nagger-ai-designer
```

Then rebuild the frontend:

```bash
cd ../client && npm run build
```

## Local Development

To test the agent locally before deploying:

```bash
node index.js
```

This will print agent info (though it won't fully run without the 21st SDK framework).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TWENTY_FIRST_API_KEY` | Your 21st.dev API key (get from dashboard) |

## Files

- `package.json` — Dependencies and scripts
- `index.js` — Agent definition with all 4 tools
- `.env` — Local API key (not committed)
- `.env.example` — Template for `.env`

## Troubleshooting

**Error: "TWENTY_FIRST_API_KEY environment variable is required"**
- Check `.env` file exists and contains your API key
- Restart the agent after updating `.env`

**Deployment fails**
- Ensure you're authenticated: `npx @21st-sdk/cli login`
- Check your API key is valid in `.env`
- Try deploying again: `npm run deploy`

**Agent returns errors from 21st.dev API**
- Verify your API key hasn't expired
- Check the 21st.dev API docs for endpoint format changes
- Try a different search query or prompt

## Support

For 21st.dev SDK issues: https://github.com/21st-dev/sdk
For Stale Deal Nagger issues: See main project README
