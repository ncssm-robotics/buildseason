# Deployment Guide

This guide covers local development setup and production deployment to Fly.io with Turso.

## Table of Contents

- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
  - [1. Turso Database Setup](#1-turso-database-setup)
  - [2. Fly.io Setup](#2-flyio-setup)
  - [3. Domain & SSL](#3-domain--ssl)
  - [4. Production Secrets](#4-production-secrets)
  - [5. Deploy](#5-deploy)
- [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Turso CLI](https://docs.turso.tech/cli/installation) (for local libSQL server)
- Git

### Install Turso CLI

```bash
# macOS
brew install tursodatabase/tap/turso

# Linux/WSL
curl -sSfL https://get.tur.so/install.sh | bash
```

### Setup

```bash
# Clone the repo
git clone https://github.com/your-org/buildseason.git
cd buildseason

# Install dependencies
bun install

# Create environment file
cp .env.example .env

# Generate a secret for BETTER_AUTH_SECRET and add to .env:
openssl rand -base64 32

# Push database schema
bun run db:push

# Seed with sample data (optional)
bun run db:seed

# Start development servers (in separate terminals)
bun run dev:api   # Terminal 1: API server + embedded Turso DB
bun run dev:web   # Terminal 2: React frontend with HMR
```

- **Frontend:** http://localhost:5173 (proxies `/api` calls to the API)
- **API directly:** http://localhost:3000

> **Note:** The `dev:api` script starts both the Turso dev database and the Hono server automatically.

### Why `turso dev`?

Using `turso dev` instead of a plain SQLite file ensures you're running the same libSQL stack locally as in production. This catches compatibility issues early and lets you use libSQL-specific features like extensions.

**Alternative:** If you don't want to install Turso CLI, you can use a plain SQLite file by changing `.env`:

```bash
DATABASE_URL=file:local.db
```

### OAuth Setup (Optional for Local)

For local OAuth testing, see the instructions in `.env.example` for:

- GitHub OAuth: https://github.com/settings/developers
- Google OAuth: https://console.cloud.google.com/apis/credentials

Use callback URLs with `localhost:3000` (the API handles auth callbacks directly).

---

## Production Deployment

BuildSeason uses:

- **Turso** - Distributed SQLite database (libSQL)
- **Fly.io** - Global application hosting
- **Custom domain** - With automatic SSL via Fly.io

### 1. Turso Database Setup

[Turso](https://turso.tech) provides a distributed SQLite database that works great with Drizzle ORM.

#### Create Account & Database

```bash
# Install Turso CLI
# macOS
brew install tursodatabase/tap/turso

# Linux/WSL
curl -sSfL https://get.tur.so/install.sh | bash

# Login (opens browser)
turso auth login

# Create database
turso db create buildseason-prod

# Get connection URL
turso db show buildseason-prod --url
# Output: libsql://buildseason-prod-yourname.turso.io

# Create auth token
turso db tokens create buildseason-prod
# Output: your-auth-token (save this!)
```

#### Save Your Credentials

You'll need these for Fly.io secrets:

- `DATABASE_URL`: `libsql://buildseason-prod-xxx.turso.io`
- `TURSO_AUTH_TOKEN`: The token from above

### 2. Fly.io Setup

[Fly.io](https://fly.io) runs your app globally with automatic scaling.

#### Install CLI & Login

```bash
# macOS
brew install flyctl

# Linux/WSL
curl -L https://fly.io/install.sh | sh

# Login (opens browser)
fly auth login
```

#### Create App

```bash
cd buildseason

# Launch creates fly.toml (don't deploy yet)
fly launch --no-deploy

# When prompted:
# - App name: buildseason (or your preferred name)
# - Region: Choose closest to your users
# - Don't set up Postgres (we use Turso)
# - Don't set up Redis
```

### 3. Domain & SSL

#### Configure Custom Domain in Fly.io

```bash
# Add your domain
fly certs add buildseason.org
fly certs add www.buildseason.org

# Get the IP addresses
fly ips list
```

#### Update DNS (Namecheap Example)

In your domain registrar's DNS settings:

| Type  | Host | Value              | TTL  |
| ----- | ---- | ------------------ | ---- |
| A     | @    | (Fly IPv4 address) | Auto |
| AAAA  | @    | (Fly IPv6 address) | Auto |
| CNAME | www  | buildseason.org    | Auto |

SSL certificates are provisioned automatically by Fly.io once DNS propagates (usually 5-30 minutes).

### 4. Production Secrets

Set secrets in Fly.io (never commit these!):

```bash
# Database
fly secrets set DATABASE_URL="libsql://buildseason-prod-xxx.turso.io"
fly secrets set TURSO_AUTH_TOKEN="your-turso-token"

# Auth - generate a strong secret
fly secrets set BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
fly secrets set BETTER_AUTH_URL="https://buildseason.org"

# GitHub OAuth (create at github.com/settings/developers)
fly secrets set GITHUB_CLIENT_ID="your-prod-github-client-id"
fly secrets set GITHUB_CLIENT_SECRET="your-prod-github-secret"

# Google OAuth (create at console.cloud.google.com/apis/credentials)
fly secrets set GOOGLE_CLIENT_ID="your-prod-google-client-id"
fly secrets set GOOGLE_CLIENT_SECRET="your-prod-google-secret"

# Verify secrets are set
fly secrets list
```

#### Production OAuth Apps

Create **separate** OAuth apps for production:

**GitHub:**

1. https://github.com/settings/developers → New OAuth App
2. Application name: `BuildSeason`
3. Homepage URL: `https://buildseason.org`
4. Callback URL: `https://buildseason.org/api/auth/callback/github`

**Google:**

1. https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID → Web application
3. Authorized JavaScript origins: `https://buildseason.org`
4. Authorized redirect URIs: `https://buildseason.org/api/auth/callback/google`

### 5. Deploy

```bash
# Deploy to Fly.io
fly deploy

# Watch the deployment
fly logs

# Check status
fly status

# Open in browser
fly open
```

#### Push Database Schema to Production

After first deploy, push your schema to Turso:

```bash
# Set production DATABASE_URL temporarily
export DATABASE_URL="libsql://buildseason-prod-xxx.turso.io"
export TURSO_AUTH_TOKEN="your-token"

# Push schema
bun run db:push

# Optionally seed production data
bun run db:seed
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test Turso connection
turso db shell buildseason-prod
> SELECT 1;

# Check Fly secrets are set
fly secrets list | grep DATABASE
```

### Deployment Failures

```bash
# View build logs
fly logs --app buildseason

# SSH into running instance
fly ssh console

# Check if app is running
fly status
```

### SSL Certificate Issues

```bash
# Check certificate status
fly certs show buildseason.org

# Force certificate renewal
fly certs remove buildseason.org
fly certs add buildseason.org
```

### OAuth Redirect Errors

- Verify callback URLs match exactly (including https://)
- Check that secrets are set correctly: `fly secrets list`
- Ensure BETTER_AUTH_URL matches your domain

### Common Errors

| Error                         | Solution                                         |
| ----------------------------- | ------------------------------------------------ |
| `SQLITE_CANTOPEN`             | Check DATABASE_URL and TURSO_AUTH_TOKEN          |
| `OAuth redirect_uri mismatch` | Update callback URL in GitHub/Google console     |
| `Connection refused`          | App not running - check `fly logs`               |
| `Certificate not ready`       | Wait for DNS propagation, check `fly certs show` |

---

## Environment Variables Reference

| Variable               | Description                        | Example                                                          |
| ---------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`         | Database URL                       | `http://127.0.0.1:8080` (local) or `libsql://db.turso.io` (prod) |
| `TURSO_AUTH_TOKEN`     | Turso auth token (production only) | `ey...`                                                          |
| `BETTER_AUTH_SECRET`   | Session encryption key             | Random 32+ chars                                                 |
| `BETTER_AUTH_URL`      | Base URL for auth                  | `https://buildseason.org`                                        |
| `GITHUB_CLIENT_ID`     | GitHub OAuth client ID             | `Iv1.abc...`                                                     |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret                | `abc123...`                                                      |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID             | `123...apps.googleusercontent.com`                               |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret                | `GOCSPX-...`                                                     |
| `PORT`                 | Server port (Fly sets this)        | `3000`                                                           |
| `NODE_ENV`             | Environment                        | `production`                                                     |
