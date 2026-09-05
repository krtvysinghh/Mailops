# Changelog 📝

All notable changes to the Mailops project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-05

### 🚀 Major Milestone: 100+ Enterprise Features Initial Release

#### 🧠 AI & Intelligent Email Management
- **TextRank Extractive Summarizer**: One-sentence TL;DR generation and bulleted takeaways without third-party AI APIs.
- **BM25 Search Engine**: Full-text inverted index supporting fuzzy matching, boolean filters, and typo tolerance.
- **Autonomous AI Agent**: Rule-based automated inbox triage and contextual auto-replies.
- **Sentiment & Intent Classification**: Polarity analysis and communicative intent extraction.
- **Smart Reply & Feedback Loop**: Dynamic contextual suggestions that adapt to user preference.
- **Meeting & Calendar Extractor**: Natural language date/time parsing directly into event objects.
- **Multi-Language Trigram Detector**: Automated language detection across 15+ world languages.
- **Stylometry Fingerprint**: Author verification comparing writing style against owner profile.

#### ⚡ Productivity & Automation
- **Scheduled Send**: Precise future dispatch queue with instant cancellation.
- **Undo Send Buffer**: 5–30s configurable grace window with zero-delay cancellation.
- **AST Workflow Engine**: Trigger-Condition-Action automation builder with DAG rule chaining.
- **JWZ Conversation Threading**: RFC 5322 In-Reply-To/References conversation tree merger.
- **Superhuman Keyboard Navigation**: Full VIM bindings (`j/k`, `e`, `r`, `c`) and global `Cmd+K` command palette.
- **Smart Auto-Archive & Follow-up Tracker**: Automated mailbox maintenance and unanswered thread nudges.
- **Offline PWA Sync**: Full IndexedDB storage with background action synchronization.

#### 🤝 Collaboration & Workspaces
- **Shared Inboxes & RBAC**: Owner, Admin, Member, and Viewer permission tiers.
- **Real-Time Presence & Collision Alerts**: Active viewer stack and live concurrent drafting prevention.
- **Draft Approval Workflows**: Multi-stage sign-off queue for sensitive communications.
- **Internal Notes & @Mentions**: Team-only discussions alongside public email threads.
- **End-to-End Encrypted Team Chat**: AES-256-GCM team channels integrated directly into inboxes.
- **Customer Context CRM Drawer**: Sender timeline, contact metadata, and deal notes.
- **CSAT Feedback & SLA Monitoring**: Automatic satisfaction rating links and response time breach alerts.

#### 🛡️ Enterprise Security & Privacy
- **Client-Side Envelope Encryption**: AES-256-GCM, PBKDF2 (100,000 iterations), and RSA-OAEP Web Crypto wrapping.
- **FIDO2 / WebAuthn Passkeys**: Passwordless biometric authentication.
- **Two-Factor Authentication**: RFC 6238 TOTP engine with SVG QR code generation.
- **Strict Inbound Auth Verification**: Cryptographic DKIM, SPF, DMARC, and ARC validation.
- **DLP & PII Pre-Send Scanner**: Luhn credit card, SSN, API token, and private key detection.
- **HTML Sandboxing**: Zero-trust sanitizer stripping tracking pixels, scripts, and embedded forms.
- **SOC 2 Compliance Reporter**: Exportable structured audit event logs and cryptographic purging.

#### 🎨 Protocols & Customization
- **CalDAV Server (RFC 5545)**: iCalendar support for native Apple/Google Calendar sync.
- **CardDAV Server (RFC 6352)**: vCard contact sync with mobile devices.
- **JMAP Protocol Server (RFC 8620)**: Modern JSON Mail Access Protocol endpoint.
- **Lightweight IMAP Bridge**: Compatibility layer for Thunderbird and Apple Mail.
- **Plugin System & Marketplace**: Hook-based extensibility with verified directory.
- **White-Label SaaS Mode**: Multi-tenant isolation with custom CSS and domain branding.
- **Production Docker Container**: Standalone multi-stage Docker build for self-hosting on any VPS.

---

## [0.1.0] - 2026-09-02

### 🐣 Initial Project Inception
- Core Hono Cloudflare Worker and React SPA.
- Basic Cloudflare Email Routing ingestion hook and Resend outbound integration.
- Automated Cloudflare DNS provisioning for custom domains.
- D1 SQLite schema definition and initial web inbox layout.
