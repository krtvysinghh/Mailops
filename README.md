# 📬 Mailops

**100% Free Custom Domain Email Platform — 50 Advanced Features, Zero Dependencies.**

Mailops is a modern, self-hosted email platform built entirely on Cloudflare's free tier. It provides custom domain email with sending, receiving, and seamless Gmail/Outlook integration — plus 50 advanced features including AI-powered email intelligence, end-to-end encryption, team collaboration, and more. All implemented in pure TypeScript with zero third-party runtime dependencies.

---

## ✨ Feature Overview (50 Features)

### 🧠 AI & Smart Features (#1–10)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Smart Reply Generator** | 3 contextual one-click reply suggestions with sentiment & tone adaptation |
| 2 | **Email Summarizer (TL;DR)** | Extractive TextRank graph algorithm for 1-sentence summaries & key bullet points |
| 3 | **Smart Categorization** | Bayesian token scoring into Primary/Updates/Social/Promos + priority scoring |
| 4 | **Sentiment & Urgency Analyzer** | Polarity scoring and urgent deadline extraction from email content |
| 5 | **Action Item Extractor** | Modal verb grammar matcher for commitments, tasks, assignees & due dates |
| 6 | **BM25 Full-Text Search** | Inverted index search with boolean operators & Levenshtein typo tolerance |
| 7 | **Decision Tracker** | Consensus & agreement discourse pattern parser across email threads |
| 8 | **Follow-Up Nudge Engine** | Response expectation tracker identifying unanswered emails |
| 9 | **Tone & Polish Rephraser** | Syntactic transformer for Professional, Casual, Concise, and Expanded modes |
| 10 | **Smart Unsubscribe** | RFC 2369 / RFC 8058 header & HTML link parser for 1-click unsubscribe |

### ⚡ Productivity & Workflows (#11–20)

| # | Feature | Description |
|---|---------|-------------|
| 11 | **Scheduled Send** | Future timestamp dispatch queue with cancellation support |
| 12 | **Undo Send** | 5-30s configurable grace buffer with instant cancellation |
| 13 | **Email Snooze** | Temporarily hide emails and resurface them at a chosen time |
| 14 | **Automation Filter Engine** | Trigger-Condition-Action AST workflow evaluator on inbound/outbound emails |
| 15 | **Templates & Canned Responses** | Dynamic `{{placeholder}}` variable interpolation engine |
| 16 | **Keyboard Shortcuts & Cmd+K** | Superhuman-style navigation + command palette search |
| 17 | **Thread Tree View** | JWZ RFC 5322 conversation tree reconstruction algorithm |
| 18 | **Batch Actions** | Multi-select bulk operations (mark read, archive, label, delete) |
| 19 | **Vacation Responder** | RFC 3834 auto-responder with 24h cooldown loop prevention |
| 20 | **Offline Support** | IndexedDB local storage with offline action mutation queue |

### 🤝 Collaboration & Multiplayer (#21–30)

| # | Feature | Description |
|---|---------|-------------|
| 21 | **Shared Team Inboxes** | Multi-user domain inbox access with Owner/Admin/Member/Viewer RBAC |
| 22 | **Email Assignment** | Thread assignment with status lifecycle state machine |
| 23 | **Internal Notes** | Private team notes hidden from external recipients |
| 24 | **Live Presence** | Active viewers and composing collision indicator |
| 25 | **Collaborative Drafts** | Optimistic concurrency versioning & text patch merger |
| 26 | **@Mentions & Alerts** | `@username` parser with in-app notification alerts |
| 27 | **Audit Log** | Append-only immutable chronological event store |
| 28 | **Shareable Thread Links** | Secure tokenized expiring public/internal links |
| 29 | **Tag Hierarchy** | Recursive color-coded nested taxonomy (`Support/Tier1`) |
| 30 | **CRM Sidebar** | Sender profile, history count, recent threads, and notes drawer |

### 🛡️ Security & Compliance (#31–40)

| # | Feature | Description |
|---|---------|-------------|
| 31 | **DKIM/SPF/DMARC Verifier** | RFC 7208 / 6376 / 7489 cryptographic header verifier |
| 32 | **Phishing Detector** | Homograph/punycode detector + href/text mismatch analyzer |
| 33 | **E2E Encryption** | AES-256-GCM / RSA-OAEP Web Crypto envelope encryption |
| 34 | **Attachment Scanner** | Magic byte file signature validator + executable blocker |
| 35 | **DLP & PII Scanner** | Pre-send scanner for credit cards (Luhn), SSNs, API tokens |
| 36 | **Tracking Pixel Blocker** | HTML sanitizer stripping 1x1 tracking pixels |
| 37 | **Expiring Emails** | Confidential mode with PIN protection & auto-purge |
| 38 | **Two-Factor Auth (TOTP)** | Pure JS RFC 6238 TOTP engine with QR code & backup codes |
| 39 | **Rate Limiter** | Sliding window token bucket for API routes |
| 40 | **GDPR Data Export & Purge** | Streaming JSON/EML export and cryptographic record purging |

### 🎨 Customization & UX (#41–50)

| # | Feature | Description |
|---|---------|-------------|
| 41 | **Dark Mode & Themes** | Light, Dark, Solarized, High-Contrast with CSS variables |
| 42 | **Split Pane Layouts** | 3-pane vertical, 2-pane horizontal, compact list, Zen mode |
| 43 | **Rich Markdown Composer** | ContentEditable WYSIWYG with live markdown shortcuts |
| 44 | **Custom Signatures** | Rich HTML signatures per alias with RFC `-- \n` delimiters |
| 45 | **Plus-Addressing** | RFC 5233 sub-addressing (`user+alias@domain`) |
| 46 | **Sound Effects Synth** | W3C Web Audio API synthesized audio (swoosh, chime, boop) |
| 47 | **Print & EML Export** | Print stylesheet, raw RFC 822 `.eml` blob generator |
| 48 | **Drag-and-Drop Folders** | HTML5 DnD for nested folder organization |
| 49 | **Attachment Indexer** | In-browser text/CSV/JSON preview and full-text search |
| 50 | **Notification Center & DND** | Web Notifications API with badge feeds and Quiet Hours |

---

## 🏗️ Architecture

```
mailops/
├── api/                          # Cloudflare Worker (Hono)
│   ├── src/
│   │   ├── index.ts              # Main router + Email Routing handler
│   │   ├── db/schema.ts          # Drizzle ORM schema (25+ tables)
│   │   ├── routes/               # REST API endpoints
│   │   │   ├── ai.ts             # Features 1-10
│   │   │   ├── productivity.ts   # Features 11-20
│   │   │   ├── collaboration.ts  # Features 21-30
│   │   │   ├── security.ts       # Features 31-40
│   │   │   └── customization.ts  # Features 41-50
│   │   └── modules/              # Pure TS business logic
│   │       ├── ai/               # TextRank, BM25, Sentiment, etc.
│   │       ├── productivity/     # JWZ Threading, Filter AST, etc.
│   │       ├── collaboration/    # RBAC, Presence, Drafts, etc.
│   │       ├── security/         # WebCrypto, TOTP, DLP, etc.
│   │       └── customization/    # Themes, EML, Audio, etc.
│   └── test/                     # Backend test suites
├── web/                          # React SPA (Vite + Tailwind)
│   └── src/
│       ├── components/           # 50+ React components
│       │   ├── ai/               # SmartReplyBar, SummarizerCard, etc.
│       │   ├── collaboration/    # PresenceStack, CRMSidebar, etc.
│       │   ├── security/         # EncryptedViewer, PhishingBanner, etc.
│       │   ├── productivity/     # CommandPalette, ThreadTree, etc.
│       │   └── customization/    # FolderDnD, SignatureBuilder, etc.
│       ├── context/              # React state providers
│       ├── utils/                # Client-side helpers
│       └── test/                 # Frontend test suites
└── README.md
```

### Tech Stack (100% Free)

| Layer | Technology | Free Tier |
|-------|-----------|-----------|
| **Backend** | Cloudflare Workers + Hono | 100,000 req/day |
| **Database** | Cloudflare D1 (SQLite) | 5M rows read/day |
| **Storage** | Cloudflare R2 | 10GB free |
| **Inbound Email** | Cloudflare Email Routing | Unlimited |
| **Outbound Email** | Resend API | 3,000/month |
| **Frontend** | Cloudflare Pages + React | Unlimited bandwidth |

### Zero Dependencies Philosophy

All 50 features are implemented using **pure TypeScript** and **native Web APIs**:
- `crypto.subtle` for AES-256-GCM encryption, RSA-OAEP, HMAC-SHA1 TOTP
- `AudioContext` for synthesized notification sounds
- `IndexedDB` for offline email storage
- `Notification API` for desktop notifications
- Native string processing for TextRank, BM25, sentiment analysis

No additional NPM runtime dependencies beyond the original stack (Hono, Drizzle, React).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js & npm installed
- Cloudflare account with a domain
- Wrangler CLI (`npm i -g wrangler`)

### 2. Backend Setup
```bash
cd api
npm install

# Create Cloudflare resources
wrangler d1 create mailops-db
wrangler r2 bucket create mailops-raw-emails

# Update wrangler.toml with your D1 database ID

# Apply migrations & deploy
npm run db:generate
npm run db:migrate
npm run deploy
```

### 3. Frontend Setup
```bash
cd web
npm install
npm run dev
```

### 4. Gmail / Outlook Integration

**Receive emails in Gmail:**
1. Go to Cloudflare Dashboard → Email → Email Routing
2. Create rule: `hello@yourdomain.com` → Forward to `you@gmail.com`

**Send from Gmail as your custom domain:**
1. Gmail Settings → Accounts → "Send mail as" → Add
2. SMTP: `smtp.resend.com`, Port: `465`, User: `resend`, Pass: your Resend API key

### 5. Environment Variables
```bash
wrangler secret put RESEND_API_KEY  # For outbound emails
```

---

## 🧪 Testing

```bash
# Backend tests
cd api && npm test

# Frontend tests  
cd web && npm test
```

---

## 📄 License

MIT
