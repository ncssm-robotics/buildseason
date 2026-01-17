# Deployment Guide

This guide covers local development setup and production deployment with Convex + Vercel.

## Table of Contents

- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
  - [1. Convex Cloud Setup](#1-convex-cloud-setup)
  - [2. Vercel Deployment](#2-vercel-deployment)
  - [3. OAuth Configuration](#3-oauth-configuration)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Convex CLI](https://docs.convex.dev/cli) (installed via npx)
- Git

### Setup

```bash
# Clone the repo
git clone https://github.com/your-org/buildseason.git
cd buildseason

# Install dependencies
bun install

# Start development server (runs both Vite + Convex dev)
bun run dev
```

This single command starts:

- **Vite dev server** at http://localhost:5173 - React frontend with HMR
- **Convex dev server** - Syncs functions and runs local Convex backend

### First-time Convex Setup

If this is your first time running the project, you'll be prompted to:

1. Log in to Convex (opens browser)
2. Create or select a project

The Convex project URL will be saved to `.env.local` as `VITE_CONVEX_URL`.

---

## Production Deployment

BuildSeason uses:

- **Convex** - Backend-as-a-service (database, functions, auth)
- **Vercel** - Frontend hosting with automatic deploys

### 1. Convex Cloud Setup

Your Convex backend is already hosted when you run `bun run dev`. For production:

```bash
# Deploy Convex functions to production
npx convex deploy
```

Get your production deployment URL from the [Convex Dashboard](https://dashboard.convex.dev):

- Select your project
- Go to Settings > URL
- Copy the production URL (e.g., `https://your-project.convex.cloud`)

### 2. Vercel Deployment

#### Option A: Git Integration (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Configure environment variables (see below)
4. Deploy

Vercel automatically deploys on every push to `main`.

#### Option B: CLI Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 3. OAuth Configuration

Configure OAuth providers for production:

**GitHub:**

1. Go to https://github.com/settings/developers
2. Create a new OAuth App
3. Set callback URL: `https://your-convex-url.convex.site/api/auth/callback/github`
4. Copy Client ID and Client Secret

**Google:**

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Set authorized redirect URI: `https://your-convex-url.convex.site/api/auth/callback/google`
4. Copy Client ID and Client Secret

Set these in your Convex environment variables:

```bash
npx convex env set AUTH_GITHUB_ID "your-github-client-id"
npx convex env set AUTH_GITHUB_SECRET "your-github-client-secret"
npx convex env set AUTH_GOOGLE_ID "your-google-client-id"
npx convex env set AUTH_GOOGLE_SECRET "your-google-client-secret"
```

---

## Environment Variables

### Frontend (Vercel)

Set these in your Vercel project settings:

| Variable          | Description           | Example                             |
| ----------------- | --------------------- | ----------------------------------- |
| `VITE_CONVEX_URL` | Convex deployment URL | `https://your-project.convex.cloud` |

### Backend (Convex)

Set these via `npx convex env set`:

| Variable             | Description                |
| -------------------- | -------------------------- |
| `AUTH_GITHUB_ID`     | GitHub OAuth Client ID     |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Client Secret |
| `AUTH_GOOGLE_ID`     | Google OAuth Client ID     |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret |

---

## Troubleshooting

### Convex Functions Not Updating

```bash
# Force redeploy
npx convex deploy --yes
```

### OAuth Redirect Errors

- Verify callback URLs match exactly (including https://)
- Check that environment variables are set in Convex Dashboard
- Ensure the Convex site URL is correct in OAuth provider settings

### Build Failures on Vercel

```bash
# Test build locally
bun run build

# Check TypeScript errors
bun run typecheck
```

### Common Errors

| Error                         | Solution                                     |
| ----------------------------- | -------------------------------------------- |
| `VITE_CONVEX_URL not set`     | Add to `.env.local` or Vercel env vars       |
| `OAuth redirect_uri mismatch` | Update callback URL in GitHub/Google console |
| `Convex function not found`   | Run `npx convex deploy`                      |
| `Module not found`            | Run `bun install`                            |

---

## Quick Commands Reference

```bash
# Development
bun run dev           # Start Vite + Convex dev servers
bun run typecheck     # Type check all code
bun run lint          # Run ESLint
bun run test:run      # Run tests once

# Deployment
npx convex deploy     # Deploy Convex functions
vercel --prod         # Deploy frontend to Vercel

# Convex Management
npx convex env list   # List environment variables
npx convex logs       # View function logs
npx convex dashboard  # Open Convex dashboard
```
