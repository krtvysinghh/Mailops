# Project: Mailops 50-Feature Implementation

## Architecture
Mailops is an advanced email platform featuring a Cloudflare Hono worker backend (`api/`) and a React 19 + Vite frontend (`web/`). The project enhances Mailops with 50 advanced email features across 5 core categories with **zero new NPM dependencies**, utilizing pure TypeScript algorithms, SQLite D1 relational schemas, and native W3C Web APIs (`crypto.subtle`, `AudioContext`, `IndexedDB`, `Notification`).

### Module & Routing Boundaries
- `api/src/routes/ai.ts` & `api/src/modules/ai/`: Features 1-10 (NLP, TextRank summarizer, BM25 search, Sentiment, Intent Smart Reply, Task Extractor, Tone transformer, Unsubscribe header parser).
- `api/src/routes/productivity.ts` & `api/src/modules/productivity/`: Features 11-20 (Scheduled Send, Undo buffer, Snooze, AST Rule Engine, Templates, JWZ Threading, Batch actions, Vacation responder, Offline sync endpoints).
- `api/src/routes/collaboration.ts` & `api/src/modules/collaboration/`: Features 21-30 (Shared Inboxes & RBAC, Assignments, Internal Notes, Presence & Collision, Versioned Drafts, Mentions, Audit Logs, Public Share Links, Tag Taxonomy, CRM Contact Intelligence).
- `api/src/routes/security.ts` & `api/src/modules/security/`: Features 31-40 (DKIM/SPF verifier, Phishing detector, Web Crypto encryption, Attachment magic byte scanner, DLP Luhn scanner, Tracking pixel stripper, Expiring emails, TOTP RFC 6238, Token bucket rate limiter, GDPR export/purge).
- `api/src/routes/customization.ts` & `api/src/modules/customization/`: Features 41-50 (Plus-addressing, Signatures, Folder hierarchy, Attachment indexer, Notification & DND settings).
- `web/src/components/` & `web/src/context/`: Modular React components and isolated state contexts (`EmailContext`, `UIContext`, `SecurityContext`, `CollaborationContext`, `ComposerContext`).

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | AI Smart Reply Generator | 3 contextual one-click reply options with sentiment & tone adaptation | M2 (AI) | survey_spec_report.md |
| 2 | AI Email Summarizer & TL;DR | Extractive TextRank graph algorithm for 1-sentence TL;DR & key bullet points | M2 (AI) | survey_spec_report.md |
| 3 | Smart Categorization & Priority | Bayesian token scoring into Primary/Updates/Social/Promos + 0-100 Priority | M2 (AI) | survey_spec_report.md |
| 4 | Sentiment & Urgency Analyzer | Sentiment polarity scoring and urgent deadline extraction | M2 (AI) | survey_spec_report.md |
| 5 | Action Item & Task Extractor | Modal verb grammar matcher for commitments, tasks, assignees & due dates | M2 (AI) | survey_spec_report.md |
| 6 | Smart Search & BM25 Matcher | Inverted index BM25 search with boolean operators & Levenshtein typo tolerance | M2 (AI) | survey_spec_report.md |
| 7 | Key Takeaways & Decision Tracker | Consensus & agreement discourse pattern parser across email threads | M2 (AI) | survey_spec_report.md |
| 8 | Smart Follow-Up Nudge Engine | Response expectation tracker identifying unanswered sent/inbound emails | M2 (AI) | survey_spec_report.md |
| 9 | Draft Tone & Polish Re-phraser | Syntactic transformer for Professional, Casual, Concise, and Expanded modes | M2 (AI) | survey_spec_report.md |
| 10 | Smart Unsubscribe & Newsletter Parser | RFC 2369 / RFC 8058 header & HTML link parser for 1-click unsubscribe | M2 (AI) | survey_spec_report.md |
| 11 | Scheduled Send (Send Later) | Future timestamp dispatch queue with cancellation support | M3 (Productivity) | survey_spec_report.md |
| 12 | Undo Send Grace Buffer | 5-30s configurable grace buffer with instant cancellation token | M3 (Productivity) | survey_spec_report.md |
| 13 | Email Snooze & Reminder System | Temporary hide from inbox with future restoration alert | M3 (Productivity) | survey_spec_report.md |
| 14 | Automation Rules & Filter Engine | Trigger-Condition-Action AST workflow evaluator on inbound/outbound emails | M3 (Productivity) | survey_spec_report.md |
| 15 | Templates & Canned Responses | Dynamic placeholder variable interpolation engine (`{{name}}`, `{{sender}}`, etc.) | M3 (Productivity) | survey_spec_report.md |
| 16 | Keyboard Shortcuts & Command Palette | Superhuman-style navigation (`j`/`k`, `e`, `r`, `c`) + `Cmd+K` command search | M3 (Productivity) | survey_spec_report.md |
| 17 | Email Thread Merging & Tree View | JWZ RFC 5322 conversation tree reconstruction algorithm | M3 (Productivity) | survey_spec_report.md |
| 18 | Batch Actions & Bulk Processing | Multi-select bulk operations (mark read, archive, label, snooze, delete) | M3 (Productivity) | survey_spec_report.md |
| 19 | Out-of-Office / Vacation Responder | RFC 3834 auto-responder with 24h cooldown loop prevention | M3 (Productivity) | survey_spec_report.md |
| 20 | Offline Support & Sync Queue | IndexedDB local storage with offline action mutation queue | M3 (Productivity) | survey_spec_report.md |
| 21 | Shared Team Inboxes & RBAC | Multi-user domain inbox access with Owner/Admin/Member/Viewer RBAC | M4 (Collaboration) | survey_spec_report.md |
| 22 | Email Assignment & Delegation | Thread assignment to team members with status lifecycle state machine | M4 (Collaboration) | survey_spec_report.md |
| 23 | Internal Notes & Inline Comments | Private team notes and inline comments hidden from external recipients | M4 (Collaboration) | survey_spec_report.md |
| 24 | Live Presence & Collision Detection | Active viewers and composing collision indicator to prevent duplicate replies | M4 (Collaboration) | survey_spec_report.md |
| 25 | Collaborative Drafts & Co-Authoring | Optimistic concurrency versioning & text patch merger for drafts | M4 (Collaboration) | survey_spec_report.md |
| 26 | Email Mentions (`@user`) & Alerts | `@username` parser with in-app notification alerts | M4 (Collaboration) | survey_spec_report.md |
| 27 | Activity Audit Log & History Timeline | Append-only immutable chronological event store for all email actions | M4 (Collaboration) | survey_spec_report.md |
| 28 | Shareable Email Thread Links | Secure tokenized expiring public/internal links to email snapshots | M4 (Collaboration) | survey_spec_report.md |
| 29 | Team Tagging & Shared Label Hierarchy | Recursive color-coded nested taxonomy (`Support/Tier1`, `Sales/Enterprise`) | M4 (Collaboration) | survey_spec_report.md |
| 30 | Customer Context / Mini CRM Sidebar | Sender profile, history count, recent threads, and CRM notes drawer | M4 (Collaboration) | survey_spec_report.md |
| 31 | DKIM/SPF/DMARC Inbound Verifier | RFC 7208 / 6376 / 7489 cryptographic and DNS alignment header verifier | M5 (Security) | survey_spec_report.md |
| 32 | Phishing & Suspicious Link Detector | Homograph/punycode detector + href/text mismatch + lure keyword analyzer | M5 (Security) | survey_spec_report.md |
| 33 | Email Encryption & Digital Signatures | Client-side AES-256-GCM / RSA-OAEP Web Crypto envelope encryption | M5 (Security) | survey_spec_report.md |
| 34 | Attachment Virus & Danger Scanner | Magic byte file signature validator + dangerous executable blocker | M5 (Security) | survey_spec_report.md |
| 35 | DLP & PII Scanner (Data Loss Prevention) | Pre-send scanner for Credit Cards (Luhn), SSNs, API tokens, JWTs, private keys | M5 (Security) | survey_spec_report.md |
| 36 | Tracking Pixel & Spy Link Blocker | HTML sanitizer stripping 1x1 tracking pixels and proxying external images | M5 (Security) | survey_spec_report.md |
| 37 | Expiring / Self-Destructing Emails | Confidential mode with PIN protection, expiration timestamp & auto-purge | M5 (Security) | survey_spec_report.md |
| 38 | Two-Factor Authentication (TOTP RFC 6238) | Pure JS HMAC-SHA1 RFC 6238 TOTP engine with QR code & backup codes | M5 (Security) | survey_spec_report.md |
| 39 | Token Bucket Rate Limiter | Sliding window token bucket rate limiter for inbound webhooks & API routes | M5 (Security) | survey_spec_report.md |
| 40 | GDPR / CCPA Data Export & Scrub Purge | Streaming JSON/EML data export archive and cryptographic record purging | M5 (Security) | survey_spec_report.md |
| 41 | Dark Mode & Dynamic Color Themes | Light, Dark, Solarized, High-Contrast theme system with CSS variables | M6 (Customization) | survey_spec_report.md |
| 42 | Split Pane & Multi-View Layouts | 3-pane vertical, 2-pane horizontal, compact list, and full-screen Zen mode | M6 (Customization) | survey_spec_report.md |
| 43 | Rich Text / Markdown Hybrid Composer | ContentEditable WYSIWYG editor with live markdown shortcuts and HTML sanitizer | M6 (Customization) | survey_spec_report.md |
| 44 | Custom Signature Builder & Multi-Alias | Rich HTML signatures per alias with RFC standard `-- \n` delimiters | M6 (Customization) | survey_spec_report.md |
| 45 | Plus-Addressing & Custom Aliases | RFC 5233 sub-addressing (`user+alias@domain`) & virtual identity selector | M6 (Customization) | survey_spec_report.md |
| 46 | Sound Effects Synthesizer (Zero Assets) | W3C Web Audio API synthesized audio (swoosh, chime, crunch, boop) | M6 (Customization) | survey_spec_report.md |
| 47 | Print & Clean PDF / EML Export View | Print stylesheet, raw RFC 822 `.eml` blob generator, and print viewer | M6 (Customization) | survey_spec_report.md |
| 48 | Drag-and-Drop Folder Organization | HTML5 Drag & Drop for nested folder organization with optimistic UI | M6 (Customization) | survey_spec_report.md |
| 49 | Attachment Content Indexer & Viewer | In-browser text/CSV/JSON preview decoder and attachment full-text search | M6 (Customization) | survey_spec_report.md |
| 50 | Notification Center & Quiet Hours (DND) | Web Notifications API with badge feeds and scheduled Quiet Hours/DND | M6 (Customization) | survey_spec_report.md |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Schema & Infrastructure Foundation | Database schema migrations for 50 features, unified module scaffolding, test harness runner | None | PLANNED |
| M2 | AI & Smart Features Suite | Features #1 to #10 (Smart Reply, TextRank Summarizer, Categorization, Sentiment, Tasks, BM25 Search, Decisions, Nudges, Tone, Unsubscribe) | M1 | PLANNED |
| M3 | Productivity & Workflows Suite | Features #11 to #20 (Scheduled Send, Undo Buffer, Snooze, Rules AST, Templates, Shortcuts & Cmd+K, JWZ Threading, Batch, OOO, Offline) | M1 | PLANNED |
| M4 | Collaboration & Multiplayer Suite | Features #21 to #30 (Shared Inboxes, Assignments, Notes, Presence, Collaborative Drafts, Mentions, Audit Logs, Share Links, Tags, CRM Sidebar) | M1 | PLANNED |
| M5 | Security & Compliance Suite | Features #31 to #40 (DKIM/SPF/DMARC, Phishing, Web Crypto, Magic Bytes, Luhn DLP, Tracking Pixel Blocker, Expiring Mails, TOTP 2FA, Rate Limiter, GDPR) | M1 | PLANNED |
| M6 | Customization & UX Suite | Features #41 to #50 (Themes, Split Pane, Markdown Composer, Signatures, Plus-Addressing, Web Audio Synth, Print/EML, DnD Folders, Attachment Indexer, DND Notifications) | M1 | PLANNED |
| M7 | E2E Integration, Verification & Documentation | Full integration test execution (Tiers 1-4 + Tier 5 Hardening), zero-dependency audit, README.md update | M2, M3, M4, M5, M6 | PLANNED |

---

## Code Layout

### Backend (`api/src/`)
- `db/schema.ts` — Drizzle ORM SQLite database schema.
- `index.ts` — Hono app root, email worker ingestion hook, sub-router mounts.
- `modules/ai/` — Pure TS modules for Features 1-10.
- `modules/productivity/` — Pure TS modules for Features 11-20.
- `modules/collaboration/` — Pure TS modules for Features 21-30.
- `modules/security/` — Pure TS modules for Features 31-40.
- `modules/customization/` — Pure TS modules for Features 41-50.
- `routes/` — Hono route handlers (`ai.ts`, `productivity.ts`, `collaboration.ts`, `security.ts`, `customization.ts`).
- `test/` — Unit and integration test suites executed via `npx tsx --test`.

### Frontend (`web/src/`)
- `components/` — Modular React UI components (SplitPaneLayout, CommandPalette, Composer, CRMDrawer, AudioSynth, etc.).
- `context/` — Dedicated state contexts (EmailContext, UIContext, SecurityContext, CollaborationContext).
- `utils/` — Pure TypeScript client-side helpers (WebCrypto, WebAudio, MarkdownParser, TOTP, OfflineDB).
- `test/` — Client-side unit and component tests.
