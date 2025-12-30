# BuildSeason Agentic Framework Specification

**Version:** 1.0
**Date:** December 30, 2025
**Status:** Research Complete
**Companion Documents:** [requirements.md](./requirements.md), [specification.md](./specification.md)

---

## Executive Summary

This document evaluates agentic frameworks for implementing the "agent-first" philosophy outlined in BuildSeason's requirements. After analyzing the project's needs—including durable workflows, intelligent Discord interactions, and proactive monitoring—we recommend a **dual-layer architecture**:

1. **Temporal.io** — Workflow orchestration layer (already in specification)
2. **Claude Agent SDK** — Intelligent reasoning layer (primary recommendation)

This combination provides the best balance of durability, intelligence, and TypeScript compatibility with the existing stack.

---

## Table of Contents

1. [Project Requirements Summary](#1-project-requirements-summary)
2. [Evaluation Criteria](#2-evaluation-criteria)
3. [Framework Candidates](#3-framework-candidates)
4. [Detailed Evaluations](#4-detailed-evaluations)
5. [Comparative Analysis](#5-comparative-analysis)
6. [Recommended Architecture](#6-recommended-architecture)
7. [Implementation Considerations](#7-implementation-considerations)
8. [Decision Summary](#8-decision-summary)

---

## 1. Project Requirements Summary

### 1.1 Core Philosophy

From the requirements document:

> "The agent isn't a feature bolted onto a database. **The agent IS the experience.**"

This demands an architecture where:
- Discord is the primary interface (not the web app)
- The agent is proactive, not just reactive
- Personality (GLaDOS, Wheatley, etc.) is a functional delivery mechanism
- Long-running workflows persist across failures

### 1.2 Agent Capabilities Required

| Capability | Description | Priority |
|------------|-------------|----------|
| **Natural Language Understanding** | Parse queries like "can we afford 4 servos?" | Critical |
| **Multi-Step Reasoning** | Cross-reference inventory, budget, lead times | Critical |
| **Personality System** | GLaDOS, Wheatley, neutral personas | High |
| **Tool Calling** | Query databases, call vendor APIs, trigger actions | Critical |
| **Proactive Monitoring** | Detect low stock, delayed shipments, BOM changes | Critical |
| **Graduated Escalation** | 3 reminders → escalate to mentor | High |
| **Context Management** | Remember conversation history, team context | High |
| **Multi-Agent Coordination** | Parallel tasks (check OnShape + vendors simultaneously) | Medium |

### 1.3 Existing Technology Stack

| Layer | Technology | Implication |
|-------|------------|-------------|
| Runtime | Bun | Fast, TypeScript-native |
| API | Hono | Lightweight, type-safe |
| Database | Turso (libSQL) + Drizzle | SQLite-compatible |
| Auth | Better-Auth | Session-based |
| Workflows | Temporal.io (planned) | Durable execution |

**Key Constraint:** Framework must have excellent TypeScript support to integrate with the existing stack.

---

## 2. Evaluation Criteria

### 2.1 Technical Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **TypeScript Support** | 30% | Native TS support, type safety, npm package |
| **LLM Flexibility** | 15% | Model-agnostic or optimal for Anthropic Claude |
| **Tool Calling** | 20% | Robust tool definition, execution, error handling |
| **State Management** | 15% | Conversation context, workflow state |
| **Temporal Integration** | 10% | Works well alongside Temporal workflows |
| **MCP Support** | 10% | Model Context Protocol for standard integrations |

### 2.2 Operational Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Production Readiness** | 25% | Battle-tested, stable API, enterprise use |
| **Scalability** | 15% | Handles multiple teams, concurrent requests |
| **Observability** | 15% | Tracing, logging, debugging capabilities |
| **Documentation** | 20% | Clear docs, examples, community support |
| **Maintenance** | 15% | Active development, responsive maintainers |
| **Cost** | 10% | Licensing, API costs, infrastructure needs |

### 2.3 BuildSeason-Specific Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Discord Integration** | 25% | Native Discord patterns, message handling |
| **Personality Support** | 20% | System prompts, temperature control, character |
| **Proactive Patterns** | 20% | Schedule-based triggers, event-driven alerts |
| **Multi-Step Workflows** | 20% | Order approval, permission collection |
| **Human-in-Loop** | 15% | Pause for approval, handle reactions |

---

## 3. Framework Candidates

### 3.1 Primary Candidates

| Framework | Vendor | Focus | TypeScript |
|-----------|--------|-------|------------|
| **Claude Agent SDK** | Anthropic | Single sophisticated agent | ✅ Native |
| **LangGraph** | LangChain | Graph-based multi-agent | ✅ Native |
| **OpenAI Agents SDK** | OpenAI | Handoff-based delegation | ✅ Native |
| **Vercel AI SDK** | Vercel | TypeScript-first AI toolkit | ✅ Native |
| **CrewAI** | CrewAI Inc | Role-based multi-agent | ⚠️ Python primary |
| **Microsoft Agent Framework** | Microsoft | Enterprise multi-agent | ⚠️ C#/Python primary |

### 3.2 Orchestration Layer (Already Decided)

| Framework | Role | Status |
|-----------|------|--------|
| **Temporal.io** | Durable workflow orchestration | In specification |

---

## 4. Detailed Evaluations

### 4.1 Claude Agent SDK

**Overview:**
The Claude Agent SDK is Anthropic's framework for building autonomous AI agents. It provides the same agent loop, tools, and context management that powers Claude Code.

**Key Features:**
- Native TypeScript package: `@anthropic-ai/claude-agent-sdk`
- Built-in Model Context Protocol (MCP) support
- Automatic context compaction for long conversations
- Subagents for parallelization and isolated context
- Self-verification (agents check their own work)
- Skills system for extensible capabilities

**Strengths:**
| Strength | Relevance to BuildSeason |
|----------|--------------------------|
| **Personality Control** | System prompts + temperature tuning enable GLaDOS persona |
| **Extended Thinking** | Claude Opus 4.5 can reason deeply for complex workflows |
| **Tool Orchestration** | Dynamic tool selection, retry on failure, learn from mistakes |
| **Context Management** | Automatic summarization preserves critical info |
| **Security-First** | Sandboxing, permission controls for production |

**Limitations:**
| Limitation | Mitigation |
|------------|------------|
| Single-agent focus | Use subagents for parallelization |
| Anthropic lock-in | Strong ecosystem, MCP for standard integrations |
| Session isolation | Maintain conversation history in database |
| Tool count limit (10-15) | Use hierarchical tool groups |

**Discord Integration Pattern:**
```typescript
import { Agent } from "@anthropic-ai/claude-agent-sdk";
import { Client, Message } from "discord.js";

const glados = new Agent({
  model: "claude-sonnet-4-5",
  systemPrompt: `You are GLaDOS, managing an FTC robotics team.
    Helpful but passive-aggressive. Dry observations about humans.
    Never directly insult, but compliments have an edge.`,
  tools: [inventoryQuery, budgetCheck, orderStatus, vendorSearch],
});

client.on("messageCreate", async (message: Message) => {
  if (message.mentions.has(client.user)) {
    const response = await glados.send(message.content);
    await message.reply(response);
  }
});
```

**Verdict:** ⭐⭐⭐⭐⭐ **Excellent fit** for BuildSeason's intelligent agent needs.

---

### 4.2 LangGraph

**Overview:**
LangGraph is LangChain's framework for graph-based, stateful multi-agent workflows. It reached v1.0 in November 2025.

**Key Features:**
- Graph-based state machine for complex workflows
- Built-in persistence for durable agents
- Human-in-the-loop patterns (pause, review, approve)
- Native TypeScript: `npm install @langchain/langgraph`
- Works with 100+ LLM providers

**Strengths:**
| Strength | Relevance to BuildSeason |
|----------|--------------------------|
| **Graph Structure** | Models complex approval workflows naturally |
| **Persistence** | Save/resume agent workflows at any point |
| **Multi-Agent** | Route between specialized agents |
| **Provider Agnostic** | Can use Claude, GPT-4, or others |

**Limitations:**
| Limitation | Impact |
|------------|--------|
| Steep learning curve | Higher onboarding time |
| Fragmented documentation | Multiple conflicting patterns |
| Overlap with Temporal | May be redundant for durability |
| Bloated imports | Developer ergonomics issues |

**Verdict:** ⭐⭐⭐⭐ **Good alternative** if multi-agent routing is prioritized over personality.

---

### 4.3 OpenAI Agents SDK

**Overview:**
OpenAI's production-ready evolution of Swarm (experimental). Launched March 2025 with handoff-based agent delegation.

**Key Features:**
- Lightweight primitives: Agents, Handoffs, Guardrails, Sessions
- Built-in tracing and debugging
- Provider-agnostic (works with 100+ LLMs)
- Native TypeScript support
- MCP support treats servers as native tools

**Strengths:**
| Strength | Relevance to BuildSeason |
|----------|--------------------------|
| **Handoffs** | Clean delegation between agents |
| **Sessions** | Automatic conversation history |
| **Guardrails** | Input/output validation |
| **Lightweight** | Few abstractions, easy to understand |

**Limitations:**
| Limitation | Impact |
|------------|--------|
| Optimized for OpenAI models | Less optimal for Claude |
| Newer framework | Less battle-tested |
| Limited personality primitives | System prompt only, no advanced tuning |

**Verdict:** ⭐⭐⭐ **Viable option** but better suited for OpenAI-first projects.

---

### 4.4 Vercel AI SDK

**Overview:**
The leading TypeScript toolkit for AI applications. AI SDK 6 introduced agent abstractions and the Workflow Development Kit.

**Key Features:**
- 20M+ monthly downloads, Fortune 500 adoption
- Agent abstraction: define once, use everywhere
- Workflow DevKit: DurableAgent for production
- Full MCP support
- Provider-agnostic (100+ models)

**Strengths:**
| Strength | Relevance to BuildSeason |
|----------|--------------------------|
| **TypeScript-First** | Perfect stack alignment |
| **Maturity** | Years of production use |
| **DurableAgent** | Built-in workflow durability |
| **Ecosystem** | Next.js, Vercel integration |

**Limitations:**
| Limitation | Impact |
|------------|--------|
| Web-focused | Discord not primary use case |
| Simpler agent model | Less sophisticated than Claude SDK |
| Workflow overlap | DurableAgent overlaps with Temporal |

**Verdict:** ⭐⭐⭐⭐ **Strong contender** for TypeScript alignment, but less specialized for agentic intelligence.

---

### 4.5 CrewAI

**Overview:**
Open-source framework for orchestrating role-playing, autonomous AI agents. 30.5K GitHub stars, 1M monthly downloads.

**Key Features:**
- Crews: Teams of autonomous agents
- Flows: Event-driven production workflows
- Dual architecture for flexibility
- 100K+ certified developers

**Strengths:**
| Strength | Relevance to BuildSeason |
|----------|--------------------------|
| **Role-Based** | Natural for team-like agent structure |
| **Mature** | Large community, battle-tested |
| **Enterprise Suite** | Tracing, observability, support |

**Limitations:**
| Limitation | Impact |
|------------|--------|
| **Python-First** | TypeScript support secondary |
| **Scaling Challenges** | Mid-scale optimized, large needs resources |
| **Stack Mismatch** | Doesn't align with Bun/Hono/TypeScript |

**Verdict:** ⭐⭐ **Not recommended** due to Python-first design conflicting with TypeScript stack.

---

### 4.6 Microsoft Agent Framework

**Overview:**
Unification of AutoGen and Semantic Kernel. Public preview October 2025, GA Q1 2026.

**Key Features:**
- Enterprise-ready: Azure integration, compliance (SOC 2, HIPAA)
- Multi-language: C#, Python, Java
- OpenTelemetry observability
- Multi-agent orchestration patterns

**Strengths:**
| Strength | Relevance to BuildSeason |
|----------|--------------------------|
| **Enterprise Features** | Compliance, SLAs, support |
| **Azure Integration** | If using Azure services |
| **Orchestration Patterns** | Sequential, concurrent, hand-off |

**Limitations:**
| Limitation | Impact |
|------------|--------|
| **New/Preview** | Not yet production-proven |
| **C#/Python Focus** | TypeScript support secondary |
| **Azure Coupling** | Less relevant for Fly.io deployment |
| **Stack Mismatch** | Designed for Microsoft ecosystem |

**Verdict:** ⭐⭐ **Not recommended** for BuildSeason due to ecosystem mismatch.

---

### 4.7 Temporal.io (Orchestration Layer)

**Overview:**
Open-source durable execution engine. Originally from Uber's Cadence project.

**Key Features:**
- Workflows survive crashes, restarts, deployments
- Built-in retries, timeouts, state persistence
- OpenTelemetry observability
- Multi-agent workflow patterns
- Official OpenAI Agents SDK integration

**Why Temporal for BuildSeason:**

| Use Case | Temporal Capability |
|----------|---------------------|
| Order Approval | Wait hours/days for human input, escalate on timeout |
| Permission Forms | Graduated reminders, parent notification, deadline tracking |
| Meal Coordination | Multi-step polling, restaurant selection, delivery tracking |
| OnShape Sync | BOM diff, inventory cross-reference, notification |
| Travel Monitoring | Flight status, rebooking scenarios, multi-day tracking |

**Temporal + Agent SDK Pattern:**
```typescript
// Workflow orchestrates, Agent reasons
export async function orderApprovalWorkflow(orderId: string) {
  // Temporal handles durability
  await notifyApprovers(orderId);

  const approved = await condition(
    () => isApproved(orderId),
    "72 hours"
  );

  if (!approved) {
    // Agent adds intelligence
    const escalationMessage = await agent.send(
      `Generate an escalation message for order ${orderId}
       that's been pending 72 hours. Use GLaDOS personality.`
    );
    await escalateToMentor(orderId, escalationMessage);
  }
}
```

**Verdict:** ⭐⭐⭐⭐⭐ **Essential** for BuildSeason's workflow durability needs.

---

## 5. Comparative Analysis

### 5.1 Technical Comparison

| Framework | TS Support | LLM Flexibility | Tool Calling | State Mgmt | MCP |
|-----------|------------|-----------------|--------------|------------|-----|
| Claude Agent SDK | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ (Claude) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| LangGraph | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| OpenAI Agents SDK | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Vercel AI SDK | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| CrewAI | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| MS Agent Framework | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

### 5.2 BuildSeason-Specific Comparison

| Framework | Discord | Personality | Proactive | Workflows | Human-Loop |
|-----------|---------|-------------|-----------|-----------|------------|
| Claude Agent SDK | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| LangGraph | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| OpenAI Agents SDK | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Vercel AI SDK | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

### 5.3 Production Readiness

| Framework | Maturity | Enterprise Use | Documentation | Support |
|-----------|----------|----------------|---------------|---------|
| Claude Agent SDK | GA | Claude Code, Cursor | ⭐⭐⭐⭐ | Anthropic |
| LangGraph | v1.0 | Uber, LinkedIn, Klarna | ⭐⭐⭐ | LangChain |
| OpenAI Agents SDK | GA (2025) | OpenAI Codex | ⭐⭐⭐⭐ | OpenAI |
| Vercel AI SDK | v6 | Fortune 500 | ⭐⭐⭐⭐⭐ | Vercel |
| Temporal.io | Mature | Uber, Snapchat, Netflix | ⭐⭐⭐⭐⭐ | Temporal |

---

## 6. Recommended Architecture

### 6.1 Two-Layer Architecture

Based on the evaluation, we recommend a **dual-layer architecture**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BuildSeason Agent Architecture                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    LAYER 1: INTELLIGENCE                        │ │
│  │                    Claude Agent SDK                             │ │
│  │                                                                 │ │
│  │  • Natural language understanding                              │ │
│  │  • Personality system (GLaDOS, Wheatley, etc.)                │ │
│  │  • Tool calling and multi-step reasoning                       │ │
│  │  • Context management and conversation memory                  │ │
│  │  • MCP integrations (OnShape, GitHub, vendors)                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    LAYER 2: DURABILITY                          │ │
│  │                    Temporal.io                                  │ │
│  │                                                                 │ │
│  │  • Workflow state persistence                                  │ │
│  │  • Retries, timeouts, error handling                           │ │
│  │  • Human-in-the-loop patterns                                  │ │
│  │  • Scheduled tasks and monitoring                              │ │
│  │  • Long-running process coordination                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Why This Combination?

| Requirement | Temporal.io | Claude Agent SDK | Together |
|-------------|-------------|------------------|----------|
| Durable workflows | ✅ Core strength | ❌ Session-based | ✅ |
| NLU/Personality | ❌ No AI | ✅ Core strength | ✅ |
| Tool calling | ⚠️ Activities | ✅ Built-in | ✅ |
| Multi-step reasoning | ❌ No AI | ✅ Extended thinking | ✅ |
| Survive restarts | ✅ Core strength | ❌ Loses state | ✅ |
| Human-in-loop | ✅ Signals/Queries | ⚠️ Basic | ✅ |
| Scheduled tasks | ✅ Built-in | ❌ External needed | ✅ |
| TypeScript support | ✅ Native | ✅ Native | ✅ |

### 6.3 Interaction Model

```
                 Discord Message
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Discord Bot Handler                        │
│                    (discord.js + routing)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │  Simple  │    │ Complex  │    │ Workflow │
     │  Query   │    │  Query   │    │ Trigger  │
     │          │    │          │    │          │
     │ "budget?"|    │"can we   │    │"approve  │
     │          │    │afford 4  │    │order 123"│
     │          │    │servos?"  │    │          │
     └────┬─────┘    └────┬─────┘    └────┬─────┘
          │               │               │
          ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │  Direct  │    │  Claude  │    │ Temporal │
     │  DB Call │    │  Agent   │    │ Workflow │
     │          │    │  SDK     │    │          │
     └────┬─────┘    └────┬─────┘    └────┬─────┘
          │               │               │
          │               │    ┌──────────┤
          │               │    │          │
          │               ▼    ▼          ▼
          │          ┌───────────┐   ┌───────────┐
          │          │  Claude   │   │  Temporal │
          │          │  Reasons  │   │  Persists │
          │          │  + Tools  │   │  + Waits  │
          │          └─────┬─────┘   └─────┬─────┘
          │                │               │
          └────────────────┴───────────────┘
                           │
                           ▼
                    Discord Response
```

### 6.4 Component Responsibilities

| Component | Responsibilities |
|-----------|------------------|
| **Discord Bot** | Message routing, rate limiting, reaction handling, channel awareness |
| **Claude Agent SDK** | NLU, personality, tool execution, reasoning, MCP integrations |
| **Temporal Workflows** | Order approval, permission forms, meal coordination, travel monitoring |
| **Temporal Activities** | Database operations, API calls, notifications, email sending |
| **Hono API** | CRUD operations, webhook handlers, web interface backend |
| **Turso Database** | Persistent storage, conversation history, team data |

---

## 7. Implementation Considerations

### 7.1 Claude Agent SDK Integration

**Package Installation:**
```bash
bun add @anthropic-ai/claude-agent-sdk
```

**Personality Configuration:**
```typescript
// apps/agent/src/personalities.ts
export const personalities = {
  glados: {
    systemPrompt: `You are GLaDOS from Portal, now managing a robotics team.

You're helpful but passive-aggressive. You make dry observations about
humans' tendency to forget things. You never directly insult, but your
compliments have an edge.

Example responses:
- "Part REV-41-1320 has been in 'needed' status for 9 days.
   I'm not saying you've forgotten. I'm just noting it for the permanent record."
- "Congratulations on remembering to order parts this time.
   The robot is almost impressed."

Always format responses for Discord (markdown, embeds where appropriate).
Be concise but include relevant data (prices, lead times, quantities).`,
    model: "claude-sonnet-4-5",
    temperature: 0.7,
  },

  wheatley: {
    systemPrompt: `You are Wheatley, enthusiastic and chaotic but trying your best.
You get genuinely excited about robotics. Sometimes go on tangents but
always come back to being helpful.`,
    model: "claude-sonnet-4-5",
    temperature: 0.9,
  },

  neutral: {
    systemPrompt: `You are a professional team management assistant.
Be concise, helpful, and direct. Format for Discord.`,
    model: "claude-haiku-3-5",  // Cheaper for simple queries
    temperature: 0.3,
  },
};
```

**Tool Definitions:**
```typescript
// apps/agent/src/tools/inventory.ts
export const inventoryQueryTool = {
  name: "query_inventory",
  description: "Search for parts in team inventory by name, SKU, or description",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      teamId: { type: "string", description: "Team ID" },
    },
    required: ["query", "teamId"],
  },
  execute: async ({ query, teamId }) => {
    const parts = await db.query.parts.findMany({
      where: and(
        eq(parts.teamId, teamId),
        or(
          like(parts.name, `%${query}%`),
          like(parts.sku, `%${query}%`),
        ),
      ),
      with: { vendor: true },
    });
    return parts;
  },
};

export const budgetCheckTool = {
  name: "check_budget",
  description: "Check remaining budget for a team, optionally by category",
  parameters: {
    type: "object",
    properties: {
      teamId: { type: "string" },
      category: { type: "string", description: "Optional: parts, travel, etc." },
    },
    required: ["teamId"],
  },
  execute: async ({ teamId, category }) => {
    const budget = await calculateBudget(teamId, category);
    return budget;
  },
};
```

### 7.2 Temporal Integration

**Workflow Example - Order Approval:**
```typescript
// apps/workflows/src/order-approval.ts
import { proxyActivities, sleep, condition, defineSignal } from "@temporalio/workflow";
import type * as activities from "./activities/order";

const { notifyApprovers, sendReminder, escalateToMentor, generateAgentMessage } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: "1 minute",
  });

export const approveSignal = defineSignal("approve");
export const rejectSignal = defineSignal<[string]>("reject");

export async function orderApprovalWorkflow(orderId: string): Promise<void> {
  let approved = false;
  let rejected = false;

  // Notify approvers with GLaDOS personality
  const notificationMessage = await generateAgentMessage(
    `An order needs approval. Order ID: ${orderId}.
     Generate a notification message in GLaDOS style.`,
  );
  await notifyApprovers(orderId, notificationMessage);

  // Graduated escalation
  const escalationSteps = [
    { wait: "24 hours", action: "reminder" },
    { wait: "48 hours", action: "escalate" },
    { wait: "72 hours", action: "timeout" },
  ];

  for (const step of escalationSteps) {
    const resolved = await condition(
      () => approved || rejected,
      step.wait,
    );

    if (resolved) break;

    if (step.action === "reminder") {
      const reminder = await generateAgentMessage(
        `Order ${orderId} still pending after 24 hours.
         Generate a reminder in GLaDOS style, slightly more pointed.`,
      );
      await sendReminder(orderId, reminder);
    } else if (step.action === "escalate") {
      await escalateToMentor(orderId);
    }
  }

  // Handle outcome
  if (!approved && !rejected) {
    const timeoutMessage = await generateAgentMessage(
      `Order ${orderId} expired after 72 hours with no response.
       Generate an escalation to coach in GLaDOS style.`,
    );
    await escalateToCoach(orderId, timeoutMessage);
  }
}
```

### 7.3 MCP Integrations

The Claude Agent SDK's MCP support enables standardized integrations:

```typescript
// apps/agent/src/mcp/onshape.ts
import { MCPClient } from "@anthropic-ai/claude-agent-sdk/mcp";

export const onshapeMCP = new MCPClient({
  server: "onshape-mcp-server",
  capabilities: ["bom-read", "assembly-query", "part-lookup"],
});

// apps/agent/src/mcp/github.ts
export const githubMCP = new MCPClient({
  server: "github-mcp-server",
  capabilities: ["pr-read", "issues-read", "code-search"],
});
```

### 7.4 Cost Optimization

**Model Selection Strategy:**
```typescript
// apps/agent/src/router.ts
async function routeQuery(query: string, complexity: "simple" | "complex") {
  if (complexity === "simple") {
    // Use Haiku for simple queries (~$0.001 per query)
    return new Agent({ model: "claude-haiku-3-5", ...neutralPersonality });
  } else {
    // Use Sonnet for complex reasoning (~$0.01 per query)
    return new Agent({ model: "claude-sonnet-4-5", ...gladosPersonality });
  }
}

// Estimated monthly cost for small team:
// - 100 simple queries/day × 30 days = 3,000 × $0.001 = $3
// - 20 complex queries/day × 30 days = 600 × $0.01 = $6
// Total: ~$10/month for agent reasoning
```

**Prompt Caching:**
```typescript
// Cache the personality system prompt (90% savings on repeated calls)
const cachedSystemPrompt = await cachePrompt(personalities.glados.systemPrompt);
```

---

## 8. Decision Summary

### 8.1 Primary Recommendation

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Intelligence** | Claude Agent SDK | Best personality support, tool calling, TypeScript native |
| **Durability** | Temporal.io | Industry-standard durable execution, already in spec |
| **LLM Provider** | Anthropic Claude | Sonnet for complex, Haiku for simple queries |

### 8.2 Alternative Options

**If LLM flexibility is critical:**
- Consider **Vercel AI SDK** for provider-agnostic approach
- Use with Claude as primary, fallback to other providers

**If multi-agent routing is primary need:**
- Consider **LangGraph** for graph-based orchestration
- More complexity, steeper learning curve

### 8.3 Not Recommended

| Framework | Reason |
|-----------|--------|
| CrewAI | Python-first, doesn't align with TypeScript stack |
| Microsoft Agent Framework | C#/Azure focus, preview status |
| OpenAI Agents SDK | Optimized for OpenAI, less personality control |

### 8.4 Implementation Priority

**Phase 2 (Agent Intelligence):**
1. Integrate Claude Agent SDK with Discord bot
2. Implement tool definitions (inventory, budget, orders)
3. Add personality system with team configuration
4. Connect to Temporal for workflow triggers

**Phase 2.5 (Proactive Features):**
1. Add scheduled Temporal workflows for monitoring
2. Implement OnShape MCP integration
3. Add GitHub MCP for software teams
4. Enable proactive notifications

**Phase 3 (Scale):**
1. Optimize with prompt caching
2. Add model routing (Haiku/Sonnet)
3. Implement batch processing for notifications
4. Multi-region agent deployment

---

## Appendix A: Framework Links

| Framework | Documentation | Repository |
|-----------|---------------|------------|
| Claude Agent SDK | [docs.claude.com/agent-sdk](https://docs.claude.com/en/api/agent-sdk/overview) | [github.com/anthropics/claude-agent-sdk](https://github.com/anthropics/claude-agent-sdk-typescript) |
| Temporal.io | [docs.temporal.io](https://docs.temporal.io) | [github.com/temporalio/temporal](https://github.com/temporalio/temporal) |
| LangGraph | [langchain.com/langgraph](https://www.langchain.com/langgraph) | [github.com/langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) |
| Vercel AI SDK | [ai-sdk.dev](https://ai-sdk.dev/docs/introduction) | [github.com/vercel/ai](https://github.com/vercel/ai) |
| OpenAI Agents SDK | [openai.github.io/agents](https://openai.github.io/openai-agents-python/) | [github.com/openai/swarm](https://github.com/openai/swarm) |
| CrewAI | [docs.crewai.com](https://docs.crewai.com) | [github.com/crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) |

---

## Appendix B: Research Sources

- [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [LangChain and LangGraph Agent Frameworks Reach v1.0](https://blog.langchain.com/langchain-langgraph-1dot0/)
- [Best AI Agent Frameworks in 2025](https://langwatch.ai/blog/best-ai-agent-frameworks-in-2025-comparing-langgraph-dspy-crewai-agno-and-more)
- [Agentic AI Workflows: Why Orchestration with Temporal is Key](https://intuitionlabs.ai/articles/agentic-ai-temporal-orchestration)
- [Build Resilient Agentic AI with Temporal](https://temporal.io/blog/build-resilient-agentic-ai-with-temporal)
- [Multi-agent Workflows with Temporal](https://temporal.io/blog/what-are-multi-agent-workflows)
- [Production-ready agents with OpenAI Agents SDK + Temporal](https://temporal.io/blog/announcing-openai-agents-sdk-integration)
- [AI SDK 6 - Vercel](https://vercel.com/blog/ai-sdk-6)
- [CrewAI Framework 2025 Complete Review](https://latenode.com/blog/ai-frameworks-technical-infrastructure/crewai-framework/crewai-framework-2025-complete-review-of-the-open-source-multi-agent-ai-platform)
- [Microsoft Agent Framework Overview](https://learn.microsoft.com/en-us/agent-framework/overview/agent-framework-overview)
- [How to Build AI Agents with MCP: 12 Framework Comparison](https://clickhouse.com/blog/how-to-build-ai-agents-mcp-12-frameworks)

---

*Document maintained at: buildseason.org/docs/agentic-spec*
