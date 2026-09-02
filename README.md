# 📬 Mailops

**100% Free Custom Domain Email. Built on Cloudflare.**

Mailops is a modern, lightweight, and completely free alternative to Google Workspace / Mailflare for hosting your custom domain emails. It uses Cloudflare Email Routing for inbound emails and Resend for outbound emails, wrapping everything in a blazing fast React SPA and Hono API.

## Features

- **100% Free Architecture**: Mailops is designed to be completely free forever by leveraging generous free tiers.
- **Free Custom Domain Setup**: Just provide a Cloudflare API token and Mailops will auto-provision all required MX, SPF, and DMARC records instantly.
- **Unified Inbox**: View all your custom domain emails in one sleek dashboard.
- **Zero Cost Breakdown**:
  - Inbound: Cloudflare Email Routing (Free)
  - Outbound: Resend API (3,000 free emails/month)
  - Backend: Cloudflare Workers + Hono (100,000 requests/day free)
  - Database: Cloudflare D1 (Generous free tier)
  - Attachments: Cloudflare R2 (10GB free)
  - Frontend: Cloudflare Pages (Unlimited bandwidth)
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
