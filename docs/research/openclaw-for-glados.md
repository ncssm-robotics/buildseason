# Research: OpenClaw as Agent for GLaDOS

**Date:** 2026-02-01
**Status:** Completed
**Conclusion:** Not recommended as a replacement; worth studying for memory/workflow patterns

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

## Fit Assessment for BuildSeason

### Why OpenClaw Does NOT Fit

| Dimension | GLaDOS (Current) | OpenClaw |
|---|---|---|
| **Integration** | Deeply embedded in Convex backend | Standalone Gateway daemon |
| **Data access** | Direct Convex queries/mutations | MCP/skill-based, external APIs |
| **Tool control** | Controlled, audited tool set | 700+ community skills, self-installs |
| **Security** | Team-scoped, YPP-compliant, audit-logged | User-configured, documented gaps |
| **Context** | Full team state injected per request | Generic memory (daily logs + MEMORY.md) |
| **Target** | Application-embedded agent | General-purpose personal assistant |

### Core Problems

1. **Convex integration loss** — OpenClaw's Gateway is a separate process, not embeddable in Convex actions. All Convex operations would need external API/MCP exposure.
2. **Security incompatibility** — OpenClaw's extensible skill system and lack of built-in security is incompatible with YPP compliance for youth-facing robotics.
3. **Added complexity** — Running Gateway alongside Convex creates two systems to manage.
4. **Loss of determinism** — Self-improving agent behavior (auto-installing skills) contradicts BuildSeason's controlled tool set.

### What's Worth Studying

1. **Memory system** — Two-layer memory (daily logs + curated long-term facts + vector search) is more sophisticated than GLaDOS's current 50-message/7-day conversation history.
2. **Lobster workflows** — Typed pipelines with approval gates for deterministic multi-step automations (order approvals, inventory workflows).
3. **Discord patterns** — DM pairing codes, guild channel isolation, mention policies, bot-to-bot safeguards.
4. **Session compaction** — Auto-compaction with pre-compaction memory flush.

## Recommendation

**Do not replace** the Claude Agent SDK with OpenClaw for GLaDOS. The architectures serve fundamentally different purposes.

**Do study** OpenClaw's memory and workflow patterns as inspiration for improving:
- GLaDOS conversation persistence (→ durable memory beyond 50 messages)
- Multi-step task handling (→ workflow pipelines with approval gates)
- Discord interaction patterns (→ DM pairing, channel isolation)

## References

- [OpenClaw Documentation](https://docs.openclaw.ai/)
- [OpenClaw Discord Integration](https://docs.openclaw.ai/channels/discord)
- [Lobster Workflow Shell](https://github.com/openclaw/lobster)
- [Cisco: "Personal AI Agents like OpenClaw Are a Security Nightmare"](https://blogs.cisco.com/ai/personal-ai-agents-like-openclaw-are-a-security-nightmare)
- [VentureBeat: "OpenClaw proves agentic AI works. It also proves your security model doesn't."](https://venturebeat.com/security/openclaw-agentic-ai-security-risk-ciso-guide)
- [Fast Company: "Clawdbot/Moltbot/OpenClaw is cool, but it gets pricey fast"](https://www.fastcompany.com/91484506/what-is-clawdbot-moltbot-openclaw)
- [IBM Think: "The viral space lobster agent"](https://www.ibm.com/think/news/clawdbot-ai-agent-testing-limits-vertical-integration)
