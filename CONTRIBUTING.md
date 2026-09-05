# Contributing to Mailops 📬

Thank you for your interest in contributing to Mailops! We are committed to building the fastest, zero-cost, and most feature-rich custom domain email platform.

Please take a moment to review this document before submitting issues or pull requests.

---

## 📜 Core Guiding Principles

### 1. The Zero-Dependency Rule
Mailops maintains a strict **zero-dependency philosophy** for feature logic:
- Core business logic, parsers, algorithms, and cryptographic implementations **must** use pure TypeScript and native Web APIs (`crypto.subtle`, `IndexedDB`, `AudioContext`, `CompressionStream`, `IntersectionObserver`).
- Do **not** install new third-party NPM runtime dependencies without prior discussion and approval from maintainers.
- Dev dependencies (linters, test runners, type definitions) are allowed when necessary.

### 2. Edge-Native & Platform Agnostic
All backend modules must run seamlessly across:
- **Cloudflare Workers** (Edge runtime)
- **Node.js 20+** (Standalone Docker container runner)

---

## 🛠️ Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v20.0.0 or higher
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/): `npm i -g wrangler`
- [Docker](https://www.docker.com/) (optional, for container testing)

### Local Environment Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/Mailops.git
   cd Mailops
   ```

2. **Install dependencies:**
   ```bash
   # Backend
   cd api && npm install
   
   # Frontend
   cd ../web && npm install
   ```

3. **Start local development servers:**
   ```bash
   # Terminal 1: Backend Worker API
   cd api && npm run dev

   # Terminal 2: Frontend Vite App
   cd web && npm run dev
   ```

4. **Run test suites:**
   ```bash
   # Run all backend unit and integration tests
   cd api && npm test
   ```

---

## 🔀 Pull Request Workflow

1. **Branch Naming**:
   - `feat/feature-name` for new capabilities
   - `fix/bug-description` for bug fixes
   - `perf/optimization` for performance improvements
   - `docs/topic` for documentation updates

2. **Commit Conventions**:
   We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:
   ```
   feat: Add recipient open-rate tracking
   fix: Prevent race condition in JWZ thread parser
   docs: Update DNS routing instructions
   perf: Optimize BM25 inverted index tokenization
   ```

3. **Code Quality Requirements**:
   - Ensure all tests pass: `npm test`
   - Ensure type-checking succeeds: `npm run typecheck`
   - Document any new module with JSDoc headers and type definitions.

---

## 🐛 Reporting Issues & Feature Requests

- **Bug Reports**: Include Node.js version, deployment mode (Cloudflare Worker vs Docker), steps to reproduce, and expected vs actual behavior.
- **Security Vulnerabilities**: Please review our [Security Policy](SECURITY.md) and do **not** file public issues for zero-day vulnerabilities.

---

## ⚖️ Contributor License Agreement

By contributing to Mailops, you agree that your contributions will be licensed under its [MIT License](LICENSE).
