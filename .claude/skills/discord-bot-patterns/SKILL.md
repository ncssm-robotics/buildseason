---
name: discord-bot-patterns
description: >-
  Discord.js bot patterns for GLaDOS agent integration.
  Use when creating Discord bot features, handling messages,
  implementing slash commands, or managing bot interactions.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Discord Bot Patterns

Patterns for implementing the Discord bot layer of GLaDOS agent.

## Architecture Overview

```
Discord Message
      │
      ▼
┌─────────────────────────────────────┐
│    Discord Bot Handler              │
│    (discord.js + routing)           │
└─────────────────────────┬───────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │  Simple  │    │  Complex │    │ Workflow │
   │  Query   │    │  Query   │    │ Trigger  │
   └────┬─────┘    └────┬─────┘    └────┬─────┘
        │               │               │
        ▼               ▼               ▼
   Haiku Agent    Claude Agent    Temporal
```

## Project Structure (Future)

> **Note:** The Discord bot is planned future functionality. This skill documents
> patterns for when it is implemented as a separate service.

```
discord-bot/                # Future: separate repo/deployment
├── src/
│   ├── index.ts           # Bot entry point
│   ├── client.ts          # Discord client setup
│   ├── commands/          # Slash commands
│   ├── events/            # Discord event handlers
│   ├── handlers/          # Message routing
│   └── utils/             # Embed builders, permissions
├── package.json
└── tsconfig.json
```

## Package Setup (Reference)

```json
{
  "name": "buildseason-discord",
  "private": true,
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist",
    "start": "bun run dist/index.js"
  },
  "dependencies": {
    "discord.js": "^14.14.0"
  }
}
```

## Discord Client Setup

```typescript
// src/client.ts
import { Client, GatewayIntentBits, Partials } from "discord.js";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

export async function startBot() {
  await client.login(process.env.DISCORD_TOKEN);
}
```

## Message Handling

```typescript
// src/events/messageCreate.ts
import { Message } from "discord.js";
import { routeMessage } from "../handlers/router";

export async function handleMessage(message: Message) {
  // Ignore bots
  if (message.author.bot) return;

  // Check if bot is mentioned or DM
  const isMention = message.mentions.has(message.client.user!);
  const isDM = !message.guild;

  if (!isMention && !isDM) return;

  // Remove mention from content
  const content = message.content.replace(/<@!?\d+>/g, "").trim();

  // Route to appropriate handler
  await routeMessage(message, content);
}
```

## Message Router

```typescript
// src/handlers/router.ts
import { Message } from "discord.js";
import { getTeamContext } from "../utils/context";

interface RouteResult {
  type: "simple" | "complex" | "workflow";
  handler: string;
}

export async function routeMessage(message: Message, content: string) {
  // Get team context from channel
  const teamContext = await getTeamContext(message.channel);

  // Classify query complexity
  const route = classifyQuery(content);

  switch (route.type) {
    case "simple":
      // Use Haiku for quick responses
      return handleSimpleQuery(message, content, teamContext);
    case "complex":
      // Use Sonnet for reasoning
      return handleComplexQuery(message, content, teamContext);
    case "workflow":
      // Trigger Temporal workflow
      return triggerWorkflow(message, content, teamContext);
  }
}

function classifyQuery(content: string): RouteResult {
  // Simple patterns
  if (/^(status|budget|inventory)\??$/i.test(content)) {
    return { type: "simple", handler: "quick-query" };
  }

  // Workflow triggers
  if (/^(approve|order|request)/i.test(content)) {
    return { type: "workflow", handler: "workflow-trigger" };
  }

  // Default to complex
  return { type: "complex", handler: "agent-query" };
}
```

## Slash Commands

```typescript
// src/commands/budget.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("budget")
  .setDescription("Check team budget status")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Budget category to check")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const category = interaction.options.getString("category");
  const teamContext = await getTeamContext(interaction.channel);

  // Fetch budget data
  const budget = await fetchBudget(teamContext.teamId, category);

  // Build response embed
  const embed = buildBudgetEmbed(budget);
  await interaction.editReply({ embeds: [embed] });
}
```

## Discord Embeds

```typescript
// src/utils/embeds.ts
import { EmbedBuilder } from "discord.js";

export function buildBudgetEmbed(budget: BudgetData): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("Budget Status")
    .setColor(budget.remaining > 0 ? 0x00ff00 : 0xff0000)
    .addFields(
      { name: "Total", value: `$${budget.total}`, inline: true },
      { name: "Spent", value: `$${budget.spent}`, inline: true },
      { name: "Remaining", value: `$${budget.remaining}`, inline: true }
    )
    .setFooter({ text: "GLaDOS Budget Module" })
    .setTimestamp();
}

export function buildErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("Error")
    .setDescription(message)
    .setColor(0xff0000);
}
```

## Reaction Handling

```typescript
// For approval workflows
import { MessageReaction, User } from "discord.js";

export async function handleReaction(reaction: MessageReaction, user: User) {
  // Ignore bot reactions
  if (user.bot) return;

  // Check for approval reactions
  if (reaction.emoji.name === "✅") {
    await handleApproval(reaction.message, user);
  } else if (reaction.emoji.name === "❌") {
    await handleRejection(reaction.message, user);
  }
}

async function handleApproval(message: Message, approver: User) {
  // Verify approver has permission
  const hasPermission = await checkApprovalPermission(approver);
  if (!hasPermission) {
    await message.reply("You don't have permission to approve this.");
    return;
  }

  // Trigger Temporal workflow
  await triggerApprovalWorkflow(message.id, approver.id);
}
```

## Team Channel Context

```typescript
// src/utils/context.ts
interface TeamContext {
  teamId: string;
  program: string;
  teamNumber: string;
  channelType: "team" | "dm" | "general";
}

export async function getTeamContext(
  channel: Channel
): Promise<TeamContext | null> {
  // DM - lookup from user
  if (channel.isDMBased()) {
    return getTeamFromUser(channel.recipient);
  }

  // Guild channel - check channel name or category
  if (channel.isTextBased() && channel.guild) {
    // Channel naming: #ftc-12345-general
    const match = channel.name.match(/^(ftc|frc)-(\d+)/i);
    if (match) {
      return {
        teamId: await lookupTeamId(match[1], match[2]),
        program: match[1].toUpperCase(),
        teamNumber: match[2],
        channelType: "team",
      };
    }
  }

  return null;
}
```

## Rate Limiting

```typescript
// src/utils/rateLimit.ts
import { Collection } from "discord.js";

const cooldowns = new Collection<string, number>();
const COOLDOWN_MS = 3000; // 3 seconds between messages

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const lastUsed = cooldowns.get(userId) || 0;

  if (now - lastUsed < COOLDOWN_MS) {
    return false; // Rate limited
  }

  cooldowns.set(userId, now);
  return true;
}
```

## Error Handling

```typescript
// Wrap handlers with error handling
export async function safeHandler<T>(
  handler: () => Promise<T>,
  fallback: (error: Error) => Promise<void>
): Promise<T | void> {
  try {
    return await handler();
  } catch (error) {
    console.error("Handler error:", error);
    await fallback(error as Error);
  }
}

// Usage
client.on("messageCreate", async (message) => {
  await safeHandler(
    () => handleMessage(message),
    async (error) => {
      await message.reply({
        embeds: [buildErrorEmbed("Something went wrong. Please try again.")],
      });
    }
  );
});
```

## Environment Variables

```bash
# Required
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_guild_id  # For development

# Optional
DISCORD_LOG_CHANNEL=channel_id_for_logs
```

## Anti-Patterns

- **Blocking operations** - Always use async/await, never block event loop
- **No rate limiting** - Discord will ban bots that spam
- **Ignoring partials** - DMs won't work without Partials.Channel
- **Hardcoded guild IDs** - Use environment variables
- **No error handling** - Bot crashes affect all users

## Reference

- Discord.js Guide: https://discordjs.guide/
- Discord Developer Portal: https://discord.com/developers
- `docs/agentic-spec.md` - GLaDOS architecture
