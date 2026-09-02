# 📬 Mailops

**100% Free Custom Domain Email. Built on Cloudflare.**

Mailops is a modern, lightweight, and completely free alternative to Google Workspace / Mailflare for hosting your custom domain emails. It uses Cloudflare Email Routing for inbound emails and Resend for outbound emails, wrapping everything in a blazing fast React SPA and Hono API.

## 🚀 Choose Your Path: Free Tier vs. $5 Tier

Mailops is designed to adapt to your Cloudflare account. You can run it **100% for free**, or you can unlock native features if you are on the **Cloudflare Workers Paid Plan ($5/mo)**.

### 🥉 The Free Tier (Default)
Run your own custom domain email without paying a cent.
- **Inbound:** Cloudflare Email Routing (Free)
- **Outbound:** Resend API (3,000 free emails/month)
- **Real-time:** Short-polling or Hono Server-Sent Events (SSE)
- **Storage & DB:** Cloudflare D1 and R2 free tiers

### 🥇 The $5 Everything-Included Tier
If you pay $5/mo for Cloudflare Workers, Mailops unlocks powerful native features:
- **Native Outbound:** Uses Cloudflare's native `send_email` binding. No need for Resend or third-party SMTP!
- **Real-time Sync:** Uses **Durable Objects** and WebSockets for instant, multiplayer-style inbox updates.
- **Reliable Queues:** Uses Cloudflare Queues for guaranteed email processing and retries.

## Features

- **Free Custom Domain Setup**: Just provide a Cloudflare API token and Mailops will auto-provision all required MX, SPF, and DMARC records instantly.
- **Unified Inbox**: View all your custom domain emails in one sleek dashboard.
- **Lightning Fast**: Built with Hono + React Vite.

## Architecture

1. **`api/` (Backend)**: A Cloudflare Worker built with [Hono](https://hono.dev). It intercepts inbound emails via the `email()` hook, parses them with `postal-mime`, saves raw `.eml` files to R2, and metadata to D1. It also exposes a REST API for the frontend.
2. **`web/` (Frontend)**: A React Single Page Application (SPA) built with Vite and Tailwind CSS.

## Getting Started

### 1. Prerequisites
- A Cloudflare account with a domain.
- Node.js & npm installed.
- Cloudflare Wrangler CLI (`npm i -g wrangler`).

### 2. Setup the API (Backend)
```bash
cd api
npm install
```

Create a D1 Database and R2 Bucket:
```bash
wrangler d1 create mailops-db
wrangler r2 bucket create mailops-raw-emails
```
*Update `wrangler.toml` with the generated D1 database ID.*

Apply Database Migrations:
```bash
npm run db:generate
npm run db:migrate
```

Deploy the API:
```bash
npm run deploy
```

### 3. Setup the Web (Frontend)
```bash
cd web
npm install
npm run dev
```

Navigate to `http://localhost:5173`. 
Click on the **Domain Setup** tab, enter your domain and a Cloudflare API Token (with DNS edit permissions), and Mailops will auto-configure your DNS records to start receiving emails!

## Environment Variables
- `RESEND_API_KEY`: Add this to your Cloudflare Worker via `wrangler secret put RESEND_API_KEY` to enable outbound email sending.

## License
MIT
