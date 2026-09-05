# 📬 Mailops

**100% Free Custom Domain Email Platform — 100 Advanced Features, Zero Dependencies.**

Mailops is a modern, self-hosted email platform built on Cloudflare's free tier. It provides custom domain email with sending, receiving, and seamless Gmail/Outlook integration — plus 100 advanced features including AI-powered email intelligence, end-to-end encryption, team collaboration, email aliasing, analytics, protocols (CalDAV, CardDAV, JMAP, IMAP bridge), Docker self-hosting, and an open-source plugin system. All implemented in pure TypeScript with zero third-party runtime dependencies.

---

## ✨ Complete Feature Overview (100 Features)

### 🧠 1. AI & Smart Email Intelligence
1. **Smart Reply Generator**: 3 contextual one-click reply suggestions with sentiment & tone adaptation.
2. **Email Summarizer (TL;DR)**: Extractive TextRank graph algorithm for 1-sentence summaries & key points.
3. **Smart Categorization**: Bayesian token scoring into Primary/Updates/Social/Promos + priority scoring.
4. **Sentiment & Urgency Analyzer**: Polarity scoring and urgent deadline extraction.
5. **Action Item Extractor**: Modal verb grammar matcher for commitments, tasks, assignees & due dates.
6. **BM25 Full-Text Search**: Inverted index search with boolean operators & Levenshtein typo tolerance.
7. **Decision Tracker**: Consensus & agreement discourse pattern parser across email threads.
8. **Follow-Up Nudge Engine**: Response expectation tracker identifying unanswered emails.
9. **Tone & Polish Rephraser**: Syntactic transformer for Professional, Casual, Concise, and Expanded modes.
10. **Smart Unsubscribe**: RFC 2369 / RFC 8058 header & HTML link parser for 1-click unsubscribe.
11. **AI Email Composer**: Generate full email drafts from one-line prompts using Cloudflare Workers AI.
12. **Smart Reply Feedback Loop**: Learns from which smart reply suggestions the user clicks.
13. **Multi-Language Detection**: Trigram frequency analysis supporting 15+ languages.
14. **Email Clustering**: Group related emails using cosine similarity on TF-IDF vectors.
15. **Intent Classifier**: Classify email intent (request, inform, confirm, reject, question).
16. **Automatic Meeting Detector**: Extract meeting dates, times, and attendees from email bodies.
17. **Full Thread Conversation Summarizer**: Multi-turn conversation summarization across threads.
18. **Contact Relationship Graph**: Adjacency list mapping communication frequency and closeness.
19. **Smart Send-Time Predictor**: Predicts best send time based on recipient's open/reply habits.
20. **Email Deduplication Detection**: SHA-256 and fuzzy content hashing to identify duplicate messages.
21. **Priority Inbox (Learned Scoring)**: Naive Bayes classifier trained on read/archive patterns.
22. **Writing Style Fingerprint**: Analyzes vocabulary richness and sentence structure to verify authenticity.
23. **Autonomous AI Agent**: Autonomous rule-based inbox management and triage agent.

### ⚡ 2. Productivity & Workflows
24. **Scheduled Send**: Future timestamp dispatch queue with cancellation support.
25. **Undo Send**: 5-30s configurable grace buffer with instant cancellation.
26. **Email Snooze**: Temporarily hide emails and resurface them at a chosen time.
27. **Automation Filter Engine**: Trigger-Condition-Action AST workflow evaluator on emails.
28. **Templates & Canned Responses**: Dynamic `{{placeholder}}` variable interpolation engine.
29. **Keyboard Shortcuts & Cmd+K**: Superhuman-style navigation + global command palette search.
30. **Thread Tree View**: JWZ RFC 5322 conversation tree reconstruction algorithm.
31. **Batch Actions**: Multi-select bulk operations (mark read, archive, label, delete).
32. **Vacation Responder**: RFC 3834 auto-responder with 24h cooldown loop prevention.
33. **Offline Support**: IndexedDB local storage with offline action mutation queue.
34. **Catch-All Wildcard Routing**: Capture any email sent to `*@yourdomain.com` automatically.
35. **Email Forwarding Rules**: Auto-forward emails based on sender, subject, or keywords.
36. **Contact Auto-Complete**: Trie-based fuzzy search with frecency-ranked address book.
37. **Conversation View**: Gmail-style threaded conversations with collapsed quoted text.
38. **Recurring Snooze Patterns**: Cron-like recurring snooze (every Monday 9am, every weekday).
39. **Automation Rule Chaining**: DAG-based workflow execution where rule outputs feed into inputs.
40. **Template Usage Analytics**: Track usage frequency and response rates per template.
41. **Smart Auto-Archive**: Auto-archive emails older than X days with no reply.
42. **Read Time Estimator**: Calculate estimated reading time based on complexity and attachments.
43. **Smart Compose Predictions**: Autocomplete predictions using n-gram frequency.
44. **Per-Email Follow-Up Tracking**: Custom reminders if no reply received within N days.
45. **Email Pinning**: Pin crucial threads to the top of the inbox.
46. **Focus Mode**: Distraction-free filtering to show only unread or starred emails.
47. **Daily Digest Compilation**: Automated daily summary compilation for unread messages.

### 🤝 3. Collaboration & Team Workspaces
48. **Shared Team Inboxes**: Multi-user domain inbox access with Owner/Admin/Member/Viewer RBAC.
49. **Email Assignment**: Thread assignment with status lifecycle state machine.
50. **Internal Notes**: Private team notes hidden from external recipients.
51. **Live Presence**: Active viewers and composing collision indicator.
52. **Collaborative Drafts**: Optimistic concurrency versioning & text patch merger.
53. **@Mentions & Alerts**: `@username` parser with in-app notification alerts.
54. **Audit Log**: Append-only immutable chronological event store.
55. **Shareable Thread Links**: Secure tokenized expiring public/internal links.
56. **Tag Hierarchy**: Recursive color-coded nested taxonomy (`Support/Tier1`).
57. **CRM Sidebar**: Sender profile, history count, recent threads, and notes drawer.
58. **Real-Time Typing Indicators**: SSE-based broadcast of teammate drafting status.
59. **SLA Timers**: SLA breach monitoring on shared inbox assignments.
60. **CSAT Surveys**: Automated customer satisfaction star-rating links for support.
61. **Team Performance Dashboard**: Agent resolution stats and team leaderboards.
62. **Round-Robin Assignment**: Auto-assignment rotation across available team members.
63. **Draft Approval Workflows**: Multi-stage approval queue before sending sensitive drafts.
64. **Admin-Enforced Team Signatures**: Global corporate signature enforcement policy.
65. **Internal Knowledge Base**: Searchable wiki linked directly to email threads.
66. **End-to-End Encrypted Team Chat**: Real-time encrypted team channels with AES-256-GCM.

### 🛡️ 4. Security, Privacy & Deliverability
67. **DKIM/SPF/DMARC Verifier**: RFC 7208 / 6376 / 7489 cryptographic header verifier.
68. **Phishing Detector**: Homograph/punycode detector + href/text mismatch analyzer.
69. **E2E Encryption**: AES-256-GCM / RSA-OAEP Web Crypto envelope encryption.
70. **Attachment Scanner**: Magic byte file signature validator + executable blocker.
71. **DLP & PII Scanner**: Pre-send scanner for credit cards (Luhn), SSNs, API tokens.
72. **Tracking Pixel Blocker**: HTML sanitizer stripping 1x1 tracking pixels.
73. **Expiring Emails**: Confidential mode with PIN protection & auto-purge.
74. **Two-Factor Auth (TOTP)**: Pure JS RFC 6238 TOTP engine with QR code & backup codes.
75. **Rate Limiter**: Sliding window token bucket for API routes.
76. **GDPR Data Export & Purge**: Streaming JSON/EML export and cryptographic record purging.
77. **Signature Click Tracking**: Track link clicks in your email signature with analytics.
78. **Spam Score Calculator**: Pre-send deliverability scoring with 200+ spam trigger words.
79. **WebAuthn Passkeys**: Passwordless, phishing-proof login with FIDO2 passkey authentication.
80. **Email Backup & Archive**: Automated R2 snapshots with SHA-256 integrity checksums.
81. **Real SPF DNS Validation**: Recursive DNS query validation for SPF records.
82. **ARC Chain Verification**: Authenticated Received Chain header verification.
83. **Suspicious Login Detection**: Geolocation and device fingerprint anomaly detection.
84. **Session Management**: View active sessions with remote revocation.
85. **HTML Email Sandboxing**: Strips scripts, event handlers, and malicious iframes.
86. **Link Reputation Preview**: Domain risk scoring before opening links.
87. **Audit Log PII Redactor**: Automatic redaction of sensitive info in audit records.
88. **IP-Based Access Control**: Whitelist/blacklist CIDR IP ranges for API access.
89. **Brute-Force Login Protection**: Automatic temporary lockouts after failed attempts.
90. **Secure Email Recall**: Cryptographic token-based recall request processor.
91. **SOC 2 Compliance Reporting**: Structured audit exports for security compliance.
92. **BIMI Logo Verification**: Brand Indicators for Message Identification validator.
93. **Outbound Security Scorer**: Pre-send email header and MIME compliance checks.
94. **Zero-Knowledge Storage**: Client-side AES-GCM encryption where server never sees plain text.

### 🎨 5. Protocols, Extensibility & Customization
95. **CalDAV Calendar Server**: Built-in calendar server with RFC 5545 iCalendar support.
96. **CardDAV Contact Server**: Contact synchronization server with RFC 6352 vCard support.
97. **JMAP Protocol Server**: RFC 8620 modern email protocol implementation.
98. **IMAP Protocol Bridge**: IMAP translation layer for native email clients (Thunderbird, Apple Mail).
99. **Email Aliasing System**: Unlimited custom aliases and random burner addresses.
100. **Email Analytics Dashboard**: Pure SQL analytics on volume, response time, and activity.
101. **Webhook Integrations**: HMAC-signed webhooks to Slack, Discord, and Zapier.
102. **Multi-Domain Manager**: Single dashboard for 5+ custom domains with DNS health monitoring.
103. **PWA & Web Push**: Progressive Web App with offline support and push alerts.
104. **Open-Source Plugin System**: Hook architecture (`BEFORE_SEND`, `AFTER_RECEIVE`, etc.).
105. **Email-to-Blog Auto-Publisher**: Ingest inbound emails and publish as Markdown blog posts.
106. **Plugin Marketplace**: Decentralized marketplace directory with permission validation.
107. **White-Label Multi-Tenant SaaS**: Custom branding, logos, CSS, and isolated tenant environments.
108. **Self-Hosted Docker Deployment**: Multi-stage `Dockerfile` and `docker-compose.yml` for standalone deployment.
109. **Virtual Scroller**: 10,000+ email virtualized rendering using IntersectionObserver.
110. **Skeleton Loading UI**: Animated shimmer states across all components.
111. **Email Hover Popovers**: Debounced preview popovers on email hover.
112. **Responsive Mobile Layout**: Mobile navigation with bottom tab bar and swipe gestures.
113. **Accessibility (a11y) Support**: Full ARIA labels and focus trapping.
114. **Web Animations & Transitions**: Micro-animations using Web Animations API.
115. **Right-Click Context Menus**: Contextual action menus on emails.
116. **Inline Image Thumbnails**: Automatic thumbnail extraction in inbox view.
117. **Browser Tab Badge Counter**: Live unread count on tab title and favicon.
118. **Search Result Highlighting**: `<mark>` wrapped search match highlights.
119. **Onboarding Setup Wizard**: Step-by-step interactive domain configuration wizard.
120. **Resizable Custom Sidebar**: Collapsible drag-to-resize navigation pane.
121. **Initial-Based Avatar Generator**: Deterministic SVG avatars with initials.
122. **Floating Undo Toasts**: Floating notification banners with countdown timers.
123. **Dual-Pane Split Inbox**: Side-by-side view for Primary and Updates categories.

---

## 🏗️ Architecture

```
mailops/
├── api/                          # Cloudflare Worker (Hono)
│   ├── src/
│   │   ├── index.ts              # Main router + Email Routing handler
│   │   ├── db/schema.ts          # Drizzle ORM schema (25+ tables)
│   │   ├── routes/               # REST API endpoints
│   │   │   ├── ai.ts             # AI endpoints
│   │   │   ├── productivity.ts   # Productivity endpoints
│   │   │   ├── collaboration.ts  # Collaboration endpoints
│   │   │   ├── security.ts       # Security endpoints
│   │   │   └── customization.ts  # Customization endpoints
│   │   └── modules/              # Pure TS business logic modules
│   │       ├── ai/               # 15+ AI & ML modules
│   │       ├── productivity/     # 15+ Workflow modules
│   │       ├── collaboration/    # 15+ Team & chat modules
│   │       ├── security/         # 20+ Encryption & compliance modules
│   │       ├── calendar/         # CalDAV server
│   │       ├── contacts/         # CardDAV server
│   │       ├── protocols/        # JMAP & IMAP servers
│   │       ├── aliasing/         # Custom alias engine
│   │       ├── analytics/        # SQL analytics engine
│   │       ├── routing/          # Catch-all & forwarding rules
│   │       ├── plugins/          # Hook-based plugin system
│   │       ├── marketplace/      # Plugin marketplace directory
│   │       ├── publishing/       # Email-to-blog publisher
│   │       └── saas/             # White-label tenant engine
│   └── test/                     # Backend test suites
├── web/                          # React SPA (Vite + Tailwind)
│   └── src/
│       ├── components/           # 60+ Modular React components
│       │   ├── ai/               # AI cards, summarizers, tone selectors
│       │   ├── collaboration/    # Presence, CRM, drafts, chat
│       │   ├── security/         # Encrypted viewers, 2FA, phishing banners
│       │   ├── productivity/     # Command palette, snooze, rules
│       │   ├── customization/    # Themes, signatures, folders
│       │   ├── onboarding/       # Setup wizard
│       │   └── ui/               # Virtual scroller, context menus, toasts
│       ├── context/              # State management contexts
│       ├── utils/                # Client-side Web APIs (Audio, Crypto, SW)
│       └── test/                 # Frontend test suites
├── Dockerfile                    # Standalone self-hosted container
├── docker-compose.yml            # One-click Docker Compose configuration
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

All features are implemented using **pure TypeScript** and **native Web APIs**:
- `crypto.subtle` for AES-256-GCM encryption, RSA-OAEP, HMAC-SHA1 TOTP
- `AudioContext` for synthesized notification sounds
- `IndexedDB` for offline email storage
- `Notification API` for desktop notifications
- Native string processing for TextRank, BM25, sentiment analysis

No additional NPM runtime dependencies beyond the original stack (Hono, Drizzle, React).

---

## 🚀 Getting Started

### Option A: Cloudflare Free Serverless

#### 1. Prerequisites
- Node.js & npm installed
- Cloudflare account with a domain
- Wrangler CLI (`npm i -g wrangler`)

#### 2. Backend Setup
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

#### 3. Frontend Setup
```bash
cd web
npm install
npm run dev
```

---

### Option B: Standalone Self-Hosted Docker

Run Mailops anywhere with a single Docker command:

```bash
docker-compose up -d
```

Open `http://localhost:3000` to access the full platform!

---

## 📧 Gmail / Outlook Integration

**Receive emails in Gmail:**
1. Go to Cloudflare Dashboard → Email → Email Routing
2. Create rule: `hello@yourdomain.com` → Forward to `you@gmail.com`

**Send from Gmail as your custom domain:**
1. Gmail Settings → Accounts → "Send mail as" → Add
2. SMTP: `smtp.resend.com`, Port: `465`, User: `resend`, Pass: your Resend API key

---

## 📄 License

MIT
