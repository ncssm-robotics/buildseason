# Research: OpenClaw as Agent for GLaDOS

**Date:** 2026-02-01
**Status:** Completed
**Conclusion:** Not recommended as a replacement; browser automation via Playwright MCP is the real opportunity

## What is OpenClaw?

OpenClaw (formerly Clawdbot, then Moltbot) is an open-source autonomous AI personal assistant created by Peter Steinberger (PSPDFKit founder). Released late 2025, it hit 100k+ GitHub stars in ~2 months.

- **Website:** [openclaw.ai](https://openclaw.ai/)
- **Docs:** [docs.openclaw.ai](https://docs.openclaw.ai/)
- **GitHub:** [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)

### Architecture

- **Gateway** — central daemon managing all channels, sessions, tools, and WebSocket connections
- **Two-layer memory** — daily append-only logs + curated long-term `MEMORY.md` with hybrid BM25/vector search via SQLite
- **Skills system** — 700+ community skills via ClawHub registry; agent can auto-install new ones
- **Lobster** — typed workflow pipelines with approval gates (composable, resumable)
- **Model-agnostic** — Claude, GPT, Gemini, local models via Ollama
- **Multi-channel** — Discord, Slack, WhatsApp, Telegram, Signal, iMessage, Teams, Matrix, Google Chat

### Current State (Feb 2026)

- Hosted platform launched Jan 31, 2026 (OpenClawd.ai)
- 700+ community skills
- Significant security concerns (Cisco: 26% of skills have vulnerabilities)
- Cost: $30-70/month typical, power users $3,600+/month
- Active development, massive community

## Cloudflare Moltworker

[cloudflare/moltworker](https://github.com/cloudflare/moltworker) is a Cloudflare proof-of-concept that deploys OpenClaw on Cloudflare's edge platform instead of dedicated hardware.

### Architecture

Two-tier system:
1. **Worker Layer** — Cloudflare Worker managing sandbox lifecycle, proxying HTTP/WebSocket, passing secrets
2. **Container Layer** — Cloudflare Sandbox running the full OpenClaw gateway (Node 22 + OpenClaw, port 18789)

### Key Cloudflare Services Used

| Service | Role |
|---|---|
| **Workers** ($5/month paid) | Entrypoint, request routing, sandbox lifecycle |
| **Sandbox** | Containerized runtime for the OpenClaw gateway |
| **R2 Storage** | Automatic backups every 5 min, device sync, conversation persistence |
| **Browser Rendering** | CDP shim for headless browser — web scraping, screenshots, automation |
| **Access** | Auth layer protecting admin routes |
| **AI Gateway** (optional) | Cache, rate-limit, analyze API requests; unified billing |

### Browser Rendering Is the Interesting Part

Moltworker integrates **Cloudflare Browser Rendering** via a CDP (Chrome DevTools Protocol) shim. This gives the agent headless browser capabilities at the edge: web scraping, screenshot capture, form filling, and page interaction — all without requiring a local machine.

This is the capability most relevant to BuildSeason's ordering gap.

## How OpenClaw Does Browser Automation

OpenClaw uses **Playwright on CDP** for browser automation:

- Connects to Chromium via Chrome DevTools Protocol
- Runs a dedicated, isolated browser instance (separate profile)
- Uses **accessibility tree snapshots** with numbered element refs (not CSS selectors)
- Actions: `click`, `type`, `drag`, `select`, `evaluate` (JS execution)
- Must re-snapshot after each navigation (refs are not stable across page loads)

### How OpenClaw Does NOT Do Ordering

Despite the browser capabilities, OpenClaw's ordering skill (`food-order` / `ordercli`) does **not** use browser automation. It wraps vendor APIs via a dedicated CLI tool. The browser is only used for authentication when API login is blocked by Cloudflare/bot protection.

There is no general-purpose "order from any website" skill in ClawHub.

## GLaDOS Ordering Gap

### Current Workflow

1. **Create** — Team creates order in draft with vendor + line items
2. **Submit** — Student submits for review (`draft` → `pending`)
3. **Approve** — Mentor approves (`pending` → `approved`)
4. **??? GAP ???** — No mechanism to actually place the order on vendor websites
5. **Receive** — Email forwarded to `ftc-{number}@buildseason.org`, Haiku parses confirmation
6. **Link** — `tryLinkToOrder` in `inbound.ts` is a stub (logs but doesn't link)

### What's Missing

- **No automated order placement** after approval
- **No `vendorOrderNumber`** field on orders (can't link confirmation emails)
- **No `trackingNumber`** field on orders
- **No vendor credential storage**
- **No browser automation tools** in GLaDOS

## Browser Automation Options for GLaDOS

### Option A: Playwright MCP Server (Recommended)

The official [Microsoft Playwright MCP server](https://github.com/microsoft/playwright-mcp) (`@playwright/mcp`) integrates directly with the Claude Agent SDK via MCP:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

- Uses **accessibility tree** (not screenshots) — fast, lightweight, no vision model needed
- Works within existing agent framework
- Auth: show login page, user logs in manually, cookies persist for session
- Human-in-the-loop at the Convex layer (agent pauses, asks mentor to confirm in Discord before clicking "Place Order")

**Challenge:** Convex actions are serverless/ephemeral (10-min max). Browser sessions need persistence. Would likely need a sidecar process or external browser service.

### Option B: Cloudflare Browser Rendering (Serverless Browser)

Call Cloudflare Browser Rendering from a Convex HTTP action:

- Headless Chrome at the edge, no infrastructure to manage
- $5/month on Workers Paid plan
- CDP-compatible — can use Playwright or Puppeteer client libraries
- Sessions are ephemeral per request (no persistent login without cookie management)

**Fits well** for: price checking, availability lookups, screenshot capture
**Less ideal** for: multi-step checkout flows requiring persistent auth

### Option C: Claude Computer Use API (Screenshot-Based)

Anthropic's Computer Use API (beta) provides full visual browser control:

- Screenshot → Claude determines coordinates → sends click/type actions
- Only available on Sonnet models (not Opus)
- Higher latency and cost per interaction
- Requires dedicated VM/container
- Cannot circumvent CAPTCHAs per Anthropic policy

### Option D: Hybrid API + Browser Fallback

Follow OpenClaw's actual pattern: use vendor APIs where available (REV Robotics, AndyMark, goBILDA may have B2B APIs), fall back to browser automation only when no API exists.

### Anti-Bot Reality Check

Modern e-commerce sites use aggressive anti-bot measures:
- **Cloudflare Turnstile** — proof-of-work + fingerprinting + behavioral heuristics
- **reCAPTCHA v3** — background behavioral scoring
- **Playwright detection** — automation flags in browser fingerprint
- **Behavioral analysis** — mouse movements, scroll patterns, typing speed

Browser automation for checkout will have a meaningful failure rate. The most reliable approach is a **mentor-assisted flow**: agent fills the cart, mentor clicks through checkout manually, agent captures the confirmation.

## Fit Assessment: OpenClaw/Moltworker for GLaDOS

### Why OpenClaw Still Does NOT Fit

| Dimension | GLaDOS (Current) | OpenClaw/Moltworker |
|---|---|---|
| **Integration** | Deeply embedded in Convex backend | Standalone Gateway daemon (Worker or local) |
| **Data access** | Direct Convex queries/mutations | MCP/skill-based, external APIs |
| **Tool control** | Controlled, audited tool set | 700+ community skills, self-installs |
| **Security** | Team-scoped, YPP-compliant, audit-logged | User-configured, documented gaps |
| **Multi-tenancy** | One agent serving N teams | One container per deployment |
| **Context** | Full team state injected per request | Generic memory (daily logs + MEMORY.md) |

Moltworker reinforces the mismatch: it deploys one container per user. BuildSeason needs a single agent serving multiple FTC teams with team-scoped data isolation.

### What IS Worth Taking

1. **Cloudflare Browser Rendering** — Callable from Convex HTTP actions without managing browser infrastructure. Best option for adding browser capabilities to GLaDOS.
2. **Memory patterns** — Two-layer memory (daily logs + curated long-term + vector search) for improving GLaDOS conversation persistence.
3. **Lobster workflows** — Typed pipelines with approval gates for order placement flows.
4. **Discord patterns** — DM pairing, channel isolation, mention policies.
5. **CDP shim pattern** — How Moltworker wraps Browser Rendering with a CDP interface.

## Recommendation

**Do not replace** the Claude Agent SDK with OpenClaw for GLaDOS. The architectures serve fundamentally different purposes.

**For browser-based ordering, pursue this path:**

1. **Short term** — Add `vendorOrderNumber` and `trackingNumber` fields to orders schema. Complete the `tryLinkToOrder` stub. This unlocks email→order linking with zero browser work.
2. **Medium term** — Add Playwright MCP server to GLaDOS for browser automation. Start with read-only tasks: price checks, availability lookups, vendor catalog browsing.
3. **Longer term** — Build a mentor-assisted ordering flow: GLaDOS fills the cart via browser automation, sends a Discord message with a screenshot for mentor review, mentor clicks through checkout manually or approves the agent to proceed.
4. **Evaluate** Cloudflare Browser Rendering as the headless browser backend (avoids managing browser infrastructure).

## References

- [OpenClaw Documentation](https://docs.openclaw.ai/)
- [OpenClaw Browser Tool](https://docs.openclaw.ai/tools/browser)
- [OpenClaw Discord Integration](https://docs.openclaw.ai/channels/discord)
- [OpenClaw Exec Approvals](https://docs.openclaw.ai/tools/exec-approvals)
- [Cloudflare Moltworker](https://github.com/cloudflare/moltworker)
- [Cloudflare Blog: Moltworker](https://blog.cloudflare.com/moltworker-self-hosted-ai-agent/)
- [Lobster Workflow Shell](https://github.com/openclaw/lobster)
- [Microsoft Playwright MCP Server](https://github.com/microsoft/playwright-mcp)
- [Browser-Use Library](https://github.com/browser-use/browser-use)
- [Cisco: "Personal AI Agents like OpenClaw Are a Security Nightmare"](https://blogs.cisco.com/ai/personal-ai-agents-like-openclaw-are-a-security-nightmare)
- [VentureBeat: "OpenClaw proves agentic AI works."](https://venturebeat.com/security/openclaw-agentic-ai-security-risk-ciso-guide)
- [Fast Company: "OpenClaw is cool, but it gets pricey fast"](https://www.fastcompany.com/91484506/what-is-clawdbot-moltbot-openclaw)
- [IBM Think: "The viral space lobster agent"](https://www.ibm.com/think/news/clawdbot-ai-agent-testing-limits-vertical-integration)
