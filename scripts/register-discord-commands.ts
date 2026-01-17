#!/usr/bin/env bun
/**
 * Register Discord slash commands for GLaDOS
 *
 * Usage:
 *   DISCORD_BOT_TOKEN=your-bot-token DISCORD_APPLICATION_ID=your-app-id bun run scripts/register-discord-commands.ts
 *
 * Or set the environment variables in .env.local and run:
 *   bun run scripts/register-discord-commands.ts
 */

const DISCORD_API = "https://discord.com/api/v10";

const commands = [
  {
    name: "glados",
    description: "Ask GLaDOS a question about your team",
    options: [
      {
        name: "message",
        description: "Your message or question for GLaDOS",
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: "ask",
    description: "Ask GLaDOS a question (alias for /glados)",
    options: [
      {
        name: "question",
        description: "Your question for GLaDOS",
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: "inventory",
    description: "Check parts inventory status",
    options: [
      {
        name: "filter",
        description: "Filter inventory results",
        type: 3, // STRING
        required: false,
        choices: [
          { name: "All parts", value: "all" },
          { name: "Low stock only", value: "low_stock" },
        ],
      },
    ],
  },
  {
    name: "orders",
    description: "Check order status",
    options: [
      {
        name: "status",
        description: "Filter by order status",
        type: 3, // STRING
        required: false,
        choices: [
          { name: "All orders", value: "all" },
          { name: "Pending", value: "pending" },
          { name: "Approved", value: "approved" },
        ],
      },
    ],
  },
];

async function registerCommands() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const applicationId = process.env.DISCORD_APPLICATION_ID;

  if (!botToken) {
    console.error("❌ DISCORD_BOT_TOKEN not set");
    console.log("\nUsage:");
    console.log(
      "  DISCORD_BOT_TOKEN=xxx DISCORD_APPLICATION_ID=xxx bun run scripts/register-discord-commands.ts"
    );
    process.exit(1);
  }

  if (!applicationId) {
    console.error("❌ DISCORD_APPLICATION_ID not set");
    process.exit(1);
  }

  console.log("🤖 Registering Discord commands...\n");

  const url = `${DISCORD_API}/applications/${applicationId}/commands`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ Failed to register commands:", error);
    process.exit(1);
  }

  const result = await response.json();
  console.log("✅ Commands registered successfully!\n");
  console.log("Registered commands:");
  for (const cmd of result as Array<{ name: string; description: string }>) {
    console.log(`  /${cmd.name} - ${cmd.description}`);
  }

  console.log("\n🎉 Done! Commands may take up to an hour to appear globally.");
  console.log("   For instant testing, register to a specific guild instead.");
}

registerCommands().catch(console.error);
