<div align="center">

# 📬 Mailops

### The Zero-Cost, Autonomous Custom-Domain Email & Productivity Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Hono](https://img.shields.io/badge/Hono-v4-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <strong>100% Free Forever • Zero Third-Party Runtime Dependencies • Native Web Crypto Security • 100+ Enterprise Features</strong>
</p>

[Quick Start](#-quick-start) • [Architecture](#-architecture) • [Feature Matrix](#-feature-matrix) • [Self-Hosting (Docker)](#-standalone-docker-deployment) • [Gmail & Client Sync](#-email-client-integration) • [License](#-license)

---

</div>

## 🌟 Why Mailops?

Legacy email solutions force you into expensive recurring per-seat subscriptions ($6–$18/user/month on Google Workspace or Microsoft 365) or complex, unmaintained mail server stacks (Postfix, Dovecot). 

**Mailops** changes this paradigm:
- **💰 100% Free Architecture**: Deploys seamlessly to Cloudflare Workers, Cloudflare D1 (SQLite), Cloudflare R2, and Email Routing. Zero hosting costs for 99% of personal and startup workloads.
- **⚡ Native Performance & Zero Bloat**: Engineered in pure TypeScript with **zero external runtime libraries** for all 100+ features. Cryptography, parsers, search engines, and ML algorithms use native W3C Web APIs (`crypto.subtle`, `IndexedDB`, `AudioContext`).
- **🛡️ Enterprise Security**: Client-side zero-knowledge AES-256-GCM encryption, FIDO2 WebAuthn Passkeys, automatic PII redaction, and strict RFC-compliant DKIM/SPF/DMARC validation.
- **🔄 Universal Compatibility**: Connect your custom domains to Gmail, Outlook, Apple Mail, and Thunderbird with one-click DNS auto-provisioning and native IMAP/JMAP/CalDAV/CardDAV protocol bridges.

---

## 🏗️ Architecture

Mailops operates as a hybrid edge-native platform. Inbound emails are intercepted by Cloudflare Email Routing Workers, processed through the zero-dependency intelligence pipeline, stored in D1/R2, and dispatched to connected clients or the modern React SPA.

```
                            ┌─────────────────────────────────┐
                            │    Inbound MX / SMTP Traffic    │
                            └────────────────┬────────────────┘
                                             │
                                             ▼
                       ┌───────────────────────────────────────────┐
                       │      Cloudflare Email Routing Hook        │
                       │           (api/src/index.ts)              │
                       └─────┬───────────────────────────────┬─────┘
                             │                               │
                ┌────────────▼────────────┐     ┌────────────▼────────────┐
                │ Raw RFC 822 .eml to R2  │     │ Pure TS Parser Pipeline │
                │   (Encrypted Storage)   │     │ (postal-mime + Web APIs)│
                └─────────────────────────┘     └────────────┬────────────┘
                                                             │
                    ┌────────────────────────────────────────┼────────────────────────────────────────┐
                    │                                        │                                        │
        ┌───────────▼───────────┐                ┌───────────▼───────────┐                ┌───────────▼───────────┐
        │  AI & NLP Pipeline    │                │ Security & Compliance │                │  Workflow & Routing   │
        │ • TextRank TL;DR      │                │ • WebCrypto AES-GCM   │                │ • DAG Rule Engine     │
        │ • BM25 Search Index   │                │ • DKIM/SPF/ARC Verify │                │ • Catch-All & Aliases │
        │ • Sentiment & Intent  │                │ • PII & DLP Scanners  │                │ • Scheduled & Undo    │
        └───────────┬───────────┘                └───────────┬───────────┘                └───────────┬───────────┘
                    │                                        │                                        │
                    └────────────────────────────────────────┼────────────────────────────────────────┘
                                                             │
                                             ┌───────────────▼───────────────┐
                                             │  D1 Serverless SQLite Store   │
                                             │      (Drizzle ORM Schema)     │
                                             └───────────────┬───────────────┘
                                                             │
                             ┌───────────────────────────────┴───────────────────────────────┐
                             │                                                               │
                ┌────────────▼────────────┐                                     ┌────────────▼────────────┐
                │   Hono Edge REST API    │                                     │  Sync & Client Bridges  │
                │ (v1/v2 Versioned API)   │                                     │ • CalDAV & CardDAV     │
                └────────────┬────────────┘                                     │ • JMAP & IMAP Bridge    │
                             │                                                  │ • Webhooks & SSE Presence│
                             ▼                                                  └─────────────────────────┘
                ┌─────────────────────────┐
                │   Vite + React 19 SPA   │
                │ • Virtualized Scrolling │
                │ • Responsive & PWA Sync │
                │ • Command Palette Cmd+K │
                └─────────────────────────┘
```

---

## 📊 Feature Matrix

<details open>
<summary><strong>🧠 1. AI & Autonomous Email Intelligence (23 Features)</strong></summary>

| Feature | Description | Module Location |
|---|---|---|
| **AI Smart Reply** | 3 contextual one-click reply suggestions adapted to thread tone | `api/src/modules/ai/smartReply.ts` |
| **Email Summarizer (TL;DR)** | Graph-based TextRank algorithm generating one-sentence bullet summaries | `api/src/modules/ai/summarizer.ts` |
| **Smart Categorization** | Bayesian token classifier into Primary, Social, Updates, and Promotions | `api/src/modules/ai/categorization.ts` |
| **Sentiment & Urgency Analyzer** | Sentiment polarity scoring and deadline detection for incoming messages | `api/src/modules/ai/sentiment.ts` |
| **Action Item & Task Extractor** | Modal grammar pattern matcher extracting assignees, actions, and due dates | `api/src/modules/ai/taskExtractor.ts` |
| **BM25 Full-Text Search Engine** | Inverted index search with boolean operators and Levenshtein typo tolerance | `api/src/modules/ai/searchEngine.ts` |
| **Decision & Consensus Tracker** | Multi-party consensus pattern detection across extended email threads | `api/src/modules/ai/decisionTracker.ts` |
| **Follow-Up Nudge Engine** | Awaiting-reply expectation tracker for outbound and inbound threads | `api/src/modules/ai/nudgeEngine.ts` |
| **Tone & Style Rephraser** | Syntactic rewriting for Professional, Casual, Concise, and Expanded modes | `api/src/modules/ai/tonePolish.ts` |
| **Smart Unsubscribe Engine** | RFC 2369 / RFC 8058 automated header and link parser | `api/src/modules/ai/unsubscribeParser.ts` |
| **AI Email Composer** | Prompt-to-draft generation utilizing Cloudflare Workers AI free models | `api/src/modules/ai/composer.ts` |
| **Feedback Loop Learning** | Self-improving smart replies adapting to selected user suggestions | `api/src/modules/ai/feedbackLoop.ts` |
| **Multi-Language Detection** | Trigram frequency detector supporting 15+ international languages | `api/src/modules/ai/languageDetector.ts` |
| **TF-IDF Email Clustering** | Unsupervised cosine similarity grouping of related emails | `api/src/modules/ai/emailClustering.ts` |
| **Intent Classification** | Structural intent classifier (request, inform, confirm, reject, question) | `api/src/modules/ai/intentClassifier.ts` |
| **Automated Meeting Extractor** | Natural language entity recognition for meeting dates, times, and agendas | `api/src/modules/ai/meetingDetector.ts` |
| **Conversation Thread Summarizer** | Multi-turn holistic summarization across complex multi-sender threads | `api/src/modules/ai/threadSummarizer.ts` |
| **Contact Relationship Graph** | Adjacency matrix tracking communication strength and frequency | `api/src/modules/ai/relationshipGraph.ts` |
| **Smart Send-Time Predictor** | Recipient open-pattern model predicting optimal dispatch timing | `api/src/modules/ai/sendTimePredictor.ts` |
| **Email Deduplication Detection** | Cryptographic and fuzzy content hashing detecting duplicate mail | `api/src/modules/ai/deduplication.ts` |
| **Priority Inbox ML Scorer** | Naive Bayes model scoring incoming emails 0–100 based on user habits | `api/src/modules/ai/priorityInbox.ts` |
| **Writing Style Fingerprint** | Stylometry analyzer verifying author identity against owner baseline | `api/src/modules/ai/writingFingerprint.ts` |
| **Autonomous AI Inbox Agent** | Rule-driven agent handling triage, tagging, and automated responses | `api/src/modules/ai/autonomousAgent.ts` |

</details>

<details>
<summary><strong>⚡ 2. Productivity, Automation & Workflows (24 Features)</strong></summary>

| Feature | Description | Module Location |
|---|---|---|
| **Scheduled Send (Send Later)** | Future timestamp dispatch queue with cancel-anytime functionality | `api/src/modules/productivity/scheduledSend.ts` |
| **Undo Send Grace Buffer** | 5–30s configurable grace window with zero-delay cancellation token | `api/src/modules/productivity/undoSend.ts` |
| **Email Snooze System** | Temporary hide and resurface engine with alert reminders | `api/src/modules/productivity/snoozeReminder.ts` |
| **AST Rule & Filter Engine** | Trigger-Condition-Action abstract syntax tree for automated workflows | `api/src/modules/productivity/filterEngine.ts` |
| **Templates & Canned Responses** | Dynamic placeholder variable interpolation (`{{name}}`, `{{company}}`) | `api/src/modules/productivity/templateEngine.ts` |
| **Keyboard Shortcuts & Cmd+K** | Superhuman-style VIM bindings (`j/k`, `e`, `r`, `c`) + Command Palette | `api/src/modules/productivity/shortcutsRegistry.ts` |
| **JWZ Thread Reconstruction** | Strict RFC 5322 In-Reply-To / References conversation tree builder | `api/src/modules/productivity/jwzThreading.ts` |
| **Batch Bulk Operations** | Multi-select bulk archive, delete, label, and mark as read/unread | `api/src/modules/productivity/batchProcessor.ts` |
| **Vacation Responder (OOO)** | RFC 3834 auto-responder with 24h anti-loop rate limiting | `api/src/modules/productivity/oooResponder.ts` |
| **Offline Sync Queue** | Local IndexedDB persistence with automatic reconnection sync | `api/src/modules/productivity/offlineSync.ts` |
| **Catch-All Wildcard Routing** | Dynamic capture of any address sent to `*@yourdomain.com` | `api/src/modules/routing/catchAll.ts` |
| **Email Forwarding Engine** | Conditional auto-forwarding with loop prevention and copy retention | `api/src/modules/routing/forwardingRules.ts` |
| **Contact Auto-Complete** | Prefix-trie search ranked by frecency (frequency × recency) | `api/src/modules/contacts/addressBook.ts` |
| **Gmail-Style Conversation View** | Clean conversation unfolding with collapsible quoted reply blocks | `api/src/modules/threads/conversationView.ts` |
| **Recurring Snooze Patterns** | Cron-like recurrence patterns (every Monday, every weekday morning) | `api/src/modules/productivity/recurringSnooze.ts` |
| **Rule Chaining (DAG Pipeline)** | Multi-stage rule execution where action outputs feed downstream filters | `api/src/modules/productivity/ruleChaining.ts` |
| **Template Analytics** | Performance metrics tracking template usage and recipient reply rate | `api/src/modules/productivity/templateAnalytics.ts` |
| **Smart Inactive Auto-Archive** | Automated maintenance archiving threads older than X days without replies | `api/src/modules/productivity/smartArchive.ts` |
| **Read Time Estimator** | Word count and complexity analyzer calculating read duration | `api/src/modules/productivity/readTimeEstimator.ts` |
| **Smart Compose Predictions** | Contextual n-gram word prediction during draft composition | `api/src/modules/productivity/smartCompose.ts` |
| **Per-Email Follow-Up Tracker** | Dedicated alerts triggered when outbound emails remain unanswered | `api/src/modules/productivity/followUpTracker.ts` |
| **Inbox Pinning** | Priority pinning keeping critical conversations at the top of the feed | `api/src/modules/productivity/emailPinning.ts` |
| **Distraction-Free Focus Mode** | Toggleable view isolating unread, starred, or assigned conversations | `api/src/modules/productivity/focusMode.ts` |
| **Daily Digest Compiler** | Automated HTML rollup summarizing unread and priority communications | `api/src/modules/productivity/dailyDigest.ts` |

</details>

<details>
<summary><strong>🤝 3. Collaboration, Workspaces & CRM (19 Features)</strong></summary>

| Feature | Description | Module Location |
|---|---|---|
| **Shared Team Inboxes & RBAC** | Multi-user inboxes with Owner, Admin, Member, and Viewer permissions | `api/src/modules/collaboration/rbac.ts` |
| **Email Assignment & Status** | Thread delegation state machine (Unassigned, In Progress, Resolved) | `api/src/modules/collaboration/assignments.ts` |
| **Internal Notes & Discussions** | Private team comments attached to email threads (invisible to senders) | `api/src/modules/collaboration/internalNotes.ts` |
| **Real-Time Presence & Collisions** | Active viewer detection and concurrent drafting collision alerts | `api/src/modules/collaboration/presence.ts` |
| **Collaborative Versioned Drafts** | Optimistic concurrency text patch merger for simultaneous drafting | `api/src/modules/collaboration/drafts.ts` |
| **@User Mentions & Alerts** | In-app mention notifications linking teammates directly to threads | `api/src/modules/collaboration/mentions.ts` |
| **Immutable Audit Event Log** | Append-only chronological security event store tracking all actions | `api/src/modules/collaboration/auditLog.ts` |
| **Expiring Shareable Thread Links**| Secure tokenized public/private links for sharing email threads | `api/src/modules/collaboration/shareLinks.ts` |
| **Nested Tag Hierarchy** | Recursive, color-coded taxonomy tree (`Support/Tier1`, `Sales/Enterprise`)| `api/src/modules/collaboration/tagHierarchy.ts` |
| **Embedded Mini CRM Sidebar** | Sender timeline, contact metadata, deal notes, and interaction history | `api/src/modules/collaboration/crmSidebar.ts` |
| **Real-Time Typing Indicators** | Server-Sent Events broadcasting active draft status of teammates | `api/src/modules/collaboration/typingIndicator.ts` |
| **SLA Breach Monitoring** | Assignment timers tracking response thresholds against target SLAs | `api/src/modules/collaboration/slaTimer.ts` |
| **CSAT 5-Star Survey Injection** | Automatic customer satisfaction survey footer appended to resolved mail | `api/src/modules/collaboration/csatSurvey.ts` |
| **Team Resolution Analytics** | Agent workload metrics, avg resolution times, and team leaderboard | `api/src/modules/collaboration/teamPerformance.ts` |
| **Round-Robin Auto-Assignment** | Automated load-balancing distributing inbound mail across online staff | `api/src/modules/collaboration/roundRobin.ts` |
| **Draft Approval Workflow** | Multi-stage review queue requiring manager sign-off before dispatch | `api/src/modules/collaboration/approvalWorkflow.ts` |
| **Admin-Enforced Signatures** | Corporate signature policies automatically merged into outbound drafts | `api/src/modules/collaboration/enforcedSignatures.ts` |
| **Searchable Knowledge Wiki** | Internal markdown documentation linked directly to support tickets | `api/src/modules/collaboration/knowledgeBase.ts` |
| **E2E Encrypted Team Chat** | AES-256-GCM encrypted internal chat channels alongside inboxes | `api/src/modules/collaboration/encryptedChat.ts` |

</details>

<details>
<summary><strong>🛡️ 4. Security, Privacy & Compliance (28 Features)</strong></summary>

| Feature | Description | Module Location |
|---|---|---|
| **DKIM/SPF/DMARC Verifier** | RFC 7208 / 6376 / 7489 cryptographic validation on all inbound mail | `api/src/modules/security/auth_verifier.ts` |
| **Phishing & Punycode Detector** | Homograph detection, URL/text mismatch analysis, and lure scoring | `api/src/modules/security/phishing_detector.ts` |
| **Client-Side Envelope Encryption**| AES-256-GCM with PBKDF2 & RSA-OAEP Web Crypto key wrapping | `api/src/modules/security/webcrypto_envelope.ts` |
| **Attachment Safety Scanner** | Magic byte signature verification preventing dangerous executable delivery | `api/src/modules/security/attachment_scanner.ts` |
| **DLP & PII Pre-Send Scanner** | Outbound detection for Credit Cards (Luhn), SSNs, API Keys, and JWTs | `api/src/modules/security/dlp_scanner.ts` |
| **Tracking Pixel Stripper** | HTML sanitizer removing 1x1 tracking beacons and proxying images | `api/src/modules/security/tracker_blocker.ts` |
| **Self-Destructing Confidential Mail**| PIN-protected, view-limited, auto-purging expiring messages | `api/src/modules/security/expiring_messages.ts` |
| **FIDO2 / WebAuthn Passkeys** | Passwordless, phishing-proof authentication via hardware passkeys | `api/src/modules/auth/passkeys.ts` |
| **Two-Factor Authentication (TOTP)**| RFC 6238 HMAC-SHA1 TOTP engine with SVG QR codes and recovery keys | `api/src/modules/security/totp.ts` |
| **Token Bucket Rate Limiter** | Sliding window rate limiting defending API endpoints against abuse | `api/src/modules/security/rate_limiter.ts` |
| **GDPR / CCPA Export & Purge** | Full cryptographic purge and streaming JSON/EML export archives | `api/src/modules/security/gdpr_purge.ts` |
| **Signature Click Analytics** | Encrypted redirect proxy tracking engagement with outbound links | `api/src/modules/tracking/signatureTracker.ts` |
| **Deliverability Spam Scorer** | Pre-send score calculation against 200+ weighted spam trigger terms | `api/src/modules/deliverability/spamScorer.ts` |
| **Cryptographic Email Backup** | Automated R2 cold storage snapshots verified with SHA-256 checksums | `api/src/modules/backup/archiveSystem.ts` |
| **Recursive SPF DNS Validator** | Full RFC 7208 recursive DNS resolver validating sender IP authorization | `api/src/modules/security/spfDnsLookup.ts` |
| **ARC Chain Verifier** | Authenticated Received Chain header validation for forwarded emails | `api/src/modules/security/arcVerifier.ts` |
| **Anomaly & Login Detection** | Geolocation distance checks and device fingerprint anomaly alerts | `api/src/modules/security/loginDetection.ts` |
| **Session Remote Revocation** | Live session registry with instant cross-device remote invalidation | `api/src/modules/security/sessionManager.ts` |
| **Allowlist HTML Sandboxing** | Zero-trust email rendering stripping scripts, forms, and inline frames | `api/src/modules/security/htmlSandbox.ts` |
| **Link Safety Reputation Preview** | Domain risk rating before opening hyperlinks in incoming mail | `api/src/modules/security/linkReputation.ts` |
| **Audit Log PII Masking** | Automated regex masking ensuring customer data never enters logs | `api/src/modules/security/auditPiiRedactor.ts` |
| **CIDR IP Access Control (ACL)** | Whitelist and blacklist rule enforcement on administrative endpoints | `api/src/modules/security/ipAccessControl.ts` |
| **Brute-Force Lockout Defense** | Exponential penalty lockouts triggered by consecutive failed attempts | `api/src/modules/security/bruteForceProtection.ts` |
| **Cryptographic Email Recall** | Tokenized recall processor invalidating viewable mail references | `api/src/modules/security/emailRecall.ts` |
| **SOC 2 Compliance Reporter** | Exportable structured compliance audit trail for enterprise governance | `api/src/modules/security/complianceExport.ts` |
| **BIMI Brand Logo Validator** | DNS TXT and SVG validator displaying verified sender brand logos | `api/src/modules/security/bimiVerifier.ts` |
| **Outbound Header Scorer** | Best-practice header validator ensuring high inbox delivery rates | `api/src/modules/security/outboundSecurityScorer.ts` |
| **Zero-Knowledge Data Vault** | Server-blind storage where database never holds unencrypted email text | `api/src/modules/security/zeroKnowledge.ts` |

</details>

<details>
<summary><strong>🎨 5. Protocols, Extensibility & Customization (20 Features)</strong></summary>

| Feature | Description | Module Location |
|---|---|---|
| **CalDAV Calendar Server** | Built-in RFC 5545 iCalendar calendar server for native client sync | `api/src/modules/calendar/caldavServer.ts` |
| **CardDAV Contact Server** | RFC 6352 vCard address book synchronization for macOS and mobile | `api/src/modules/contacts/carddavServer.ts` |
| **JMAP Protocol Server** | Next-generation RFC 8620 JSON Mail Access Protocol server | `api/src/modules/protocols/jmapServer.ts` |
| **Lightweight IMAP Bridge** | Translation bridge mapping standard IMAP commands to Mailops APIs | `api/src/modules/protocols/imapBridge.ts` |
| **Advanced Email Aliasing** | Unlimited on-the-fly aliases and randomized privacy burner addresses | `api/src/modules/aliasing/emailAliasing.ts` |
| **SQL Analytics Dashboard** | Real-time SQL aggregations on volume, latency, and interaction counts | `api/src/modules/analytics/dashboardEngine.ts` |
| **Webhook Integration Engine** | HMAC-SHA256 signed event webhooks for Slack, Discord, and Zapier | `api/src/modules/integrations/webhooks.ts` |
| **Multi-Domain Control Center** | Centralized management for 5+ domains with live DNS health monitoring | `api/src/modules/domains/multiDomain.ts` |
| **Offline PWA & Web Push** | Service Worker with background sync and Web Push API notifications | `web/src/utils/serviceWorker.ts` |
| **Open Plugin System** | Hook-based plugin architecture (`BEFORE_SEND`, `AFTER_RECEIVE`, etc.) | `api/src/modules/plugins/pluginSystem.ts` |
| **Email-to-Blog Auto-Publisher** | Publish Markdown blog posts directly by emailing `blog@domain.com` | `api/src/modules/publishing/emailToBlog.ts` |
| **Plugin Marketplace Directory** | Decentralized verified directory for community plugins and integrations | `api/src/modules/marketplace/pluginMarketplace.ts` |
| **White-Label Multi-Tenant SaaS**| Custom branding, tenant isolation, and custom domain CSS overrides | `api/src/modules/saas/whiteLabel.ts` |
| **Standalone Docker Image** | Standalone production multi-stage container for non-Cloudflare hosts | `Dockerfile` |
| **Virtual Scroller Engine** | 10,000+ item virtualized list rendering with zero memory overhead | `web/src/components/ui/VirtualScroller.tsx` |
| **Shimmer Skeleton Loading UI** | CSS-animated skeleton states for smooth layout shifts | `web/src/components/ui/SkeletonLoader.tsx` |
| **Hover Email Popover Preview** | Debounced contextual popover showing sender and snippet on hover | `web/src/components/ui/EmailPreviewPopover.tsx` |
| **Responsive Mobile Layout** | Adaptive mobile interface with bottom navigation and touch gestures | `web/src/components/ui/MobileLayout.tsx` |
| **Accessibility (a11y) Suite** | Focus trapping, ARIA roles, and screen-reader announcements | `web/src/utils/accessibility.ts` |
| **Dual-Pane Split Inbox View** | Side-by-side view comparing Primary and Updates categories | `web/src/components/ui/SplitInboxView.tsx` |

</details>

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ & npm
- A Cloudflare account with at least one active domain
- Cloudflare Wrangler CLI (`npm i -g wrangler`)

### 1. Clone & Install
```bash
git clone https://github.com/krtvysinghh/Mailops.git
cd Mailops

# Install backend dependencies
cd api && npm install

# Install frontend dependencies
cd ../web && npm install
```

### 2. Provision Cloudflare Serverless Resources
```bash
cd api

# Create D1 Database and R2 Cold Storage Bucket
wrangler d1 create mailops-db
wrangler r2 bucket create mailops-raw-emails
```

*Update your `api/wrangler.toml` with the generated `database_id` from the output above.*

```bash
# Execute initial database schema migrations
npm run db:generate
npm run db:migrate

# Deploy Cloudflare Worker API
npm run deploy
```

### 3. Launch Frontend Dashboard
```bash
cd ../web
npm run dev
```

Visit `http://localhost:5173` to access the Mailops dashboard!

---

## 🐳 Standalone Docker Deployment

Prefer to self-host on your own VPS (Ubuntu, Debian, macOS, or Raspberry Pi) without Cloudflare Workers? Mailops includes a production-ready, standalone multi-stage container.

```bash
# Start Mailops with Docker Compose
docker-compose up -d
```

Your self-hosted instance is now running at `http://localhost:3000` with local SQLite storage at `/data/mailops.sqlite`!

---

## 📧 Email Client Integration

You don't need to use the web interface. Mailops is engineered to work seamlessly with your preferred email client:

### 📥 1. Receiving Emails (Instant Forwarding to Gmail / Outlook)
1. Navigate to your **Cloudflare Dashboard → Email → Email Routing**.
2. Add a Custom Address: `hello@yourdomain.com` → Forward to `yourname@gmail.com`.
3. Mailops will process, parse, and index the email into your database while forwarding an instant copy to your personal inbox.

### 📤 2. Sending Emails from Gmail (as `yourname@yourdomain.com`)
1. In Gmail, navigate to **Settings (Gear Icon) → See all settings → Accounts and Import**.
2. Under **"Send mail as"**, click **Add another email address**.
3. Enter your Name and your custom email (`you@yourdomain.com`). Uncheck *"Treat as an alias"*.
4. Enter the free SMTP credentials:
   - **SMTP Server**: `smtp.resend.com`
   - **Port**: `465` (SSL) or `587` (TLS)
   - **Username**: `resend`
   - **Password**: `re_your_api_key_here`
5. Verify the confirmation code delivered to your inbox. You can now send and receive custom domain emails directly inside Gmail for $0!

---

## 🔒 Security & Privacy

- **Zero Data Harvesting**: Your emails are stored strictly in your own Cloudflare D1/R2 storage or local SQLite container.
- **Client-Side Encryption**: Encrypted emails are ciphered in the browser using the Web Crypto API (`crypto.subtle`) prior to reaching network boundaries.
- **Strict Headers**: Configured out-of-the-box with strict Content Security Policy (`CSP`), HSTS, X-Frame-Options, and Referrer-Policy headers.

---

## 📄 License

Mailops is open-source software licensed under the [MIT License](LICENSE).
