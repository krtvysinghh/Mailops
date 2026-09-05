# Security Policy 🛡️

The Mailops engineering team takes the security and privacy of your communications very seriously. This document outlines our security practices, supported versions, and how to report vulnerabilities.

---

## 🔒 Security Architecture Overview

Mailops is designed from the ground up around zero-trust and client-side cryptographic guarantees:

1. **Client-Side Envelope Encryption**:
   - Outbound sensitive mail is encrypted client-side using `crypto.subtle` (AES-256-GCM with PBKDF2 100,000-iteration key derivation and RSA-OAEP key wrapping).
   - In zero-knowledge mode, the backend database never holds plaintext email bodies.

2. **Strict Inbound Authentication**:
   - All inbound traffic undergoes cryptographic DKIM verification (RFC 6376), SPF policy checks (RFC 7208), and DMARC alignment validation (RFC 7489).
   - Forwarded emails are verified against the Authenticated Received Chain (ARC) standard.

3. **Data Loss Prevention (DLP)**:
   - Client-side and edge pre-send scanners detect and alert on Credit Card numbers (Luhn algorithm), Social Security Numbers, JWT tokens, and private keys.

4. **Zero-Trust HTML Sandboxing**:
   - Email bodies are sanitized through strict allowlists stripping scripts, event handlers, forms, and inline frames to prevent Cross-Site Scripting (XSS).

---

## 📦 Supported Versions

Security updates are actively applied to the main branch and latest releases:

| Version | Supported |
|---|---|
| `1.x.x` (Latest) | ✅ Supported |
| `< 1.0.0` | ❌ End of Life |

---

## 🚨 Reporting a Vulnerability

**Please do NOT disclose security vulnerabilities publicly via GitHub Issues.**

If you believe you have found a security vulnerability in Mailops:

1. Send an encrypted email with your findings to: **`security@mailops.dev`** or directly reach out to the project maintainers.
2. Please include:
   - Type of vulnerability (e.g., XSS, cryptographic flaw, auth bypass).
   - Step-by-step instructions or proof-of-concept code to reproduce the issue.
   - Potential impact on users or infrastructure.
   - Recommended remediation if known.

### Response Timeline
- **Initial Acknowledgment**: Within 24 hours.
- **Triage & Verification**: Within 48 hours.
- **Fix & Advisory Release**: Coordinated with the reporter, aiming for resolution within 7 calendar days for critical issues.

---

## 🏆 Bounty & Hall of Fame

We deeply appreciate the efforts of security researchers who help keep Mailops safe. Valid vulnerability reports will be credited in our public Release Notes and Hall of Fame (unless anonymity is requested).
