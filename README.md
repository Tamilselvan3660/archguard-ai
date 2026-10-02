# 🛡️ ARCHGUARD AI

<div align="center">

### **Intelligent Software Architecture Drift Detection & Governance Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18.2.0-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v5.0.8-646CFF.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-v4.18.2-000000.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![Security](https://img.shields.io/badge/Security-AES--256--GCM-brightgreen.svg)](docs/security.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Features](#-core-platform-features) • [Architecture](#-system-architecture) • [Quick Start](#-quick-start) • [CLI Usage](#-cli-integration) • [Cloud Integrations](#-multi-cloud-storage--governance) • [Security](#-security--compliance)

</div>

---

## 📌 Executive Summary

**ArchGuard AI** is an enterprise-grade platform designed to detect, visualize, and eliminate **software architecture drift** in real-time. As software systems evolve, developers continuously make tactical modifications that gradually violate original architectural constraints, layer boundaries, and design principles—leading to technical debt, tight coupling, and fragile releases.

ArchGuard AI continuously parses codebases via Abstract Syntax Tree (AST) analysis and dependency graph engines, automatically evaluating **architectural fitness functions**, enforcing **Architectural Decision Records (ADRs)**, gating Pull Requests in CI/CD pipelines, and recommending automated refactorings powered by AI.

---

## 🚀 Core Platform Features

### 🔍 1. Real-Time Architecture Drift Detection
- **Automated AST & Dependency Parsing**: Continuously extracts module boundaries, component hierarchies, and import statements.
- **Layer Boundary Enforcement**: Flags illegal inter-layer calls (e.g., UI accessing Database directly or Domain leaking into Infrastructure).
- **Blast-Radius Analysis**: Calculates the ripple effect of changing specific modules before code is committed.

### 📐 2. Interactive Architecture Map & Visualizer
- **Graph-Based Topology**: Interactive component dependency graph built with dynamic node placement and visual severity indicators.
- **Dependency Flow & Circular Ref Detection**: Instantly exposes circular dependencies, hidden couplings, and orphaned modules.

### 📜 3. Architectural Decision Record (ADR) Manager
- **Lifecycle Tracking**: Full management of ADRs (Proposed, Accepted, Deprecated, Superseded).
- **Code Linkage**: Automatically maps active ADR rules to specific source files and AST patterns for real-time compliance validation.

### ⚡ 4. Automated Fitness Functions
- **Quantitative Architectural Health**: Evaluates cyclomatic complexity, instability ($I = C_e / (C_a + C_e)$), abstractness, distance from main sequence ($D = |A + I - 1|$), and coupling metrics.
- **Custom Policy Studio**: Define granular architectural assertions (e.g., *"Controllers must never import DB models directly"*).

### 🛡️ 5. PR Guard & CI/CD Governance
- **Automated Pull Request Gating**: Runs lightweight checks on incoming PRs to block architectural regressions before merge.
- **CLI & GitHub Action Support**: Seamless integration into standard deployment pipelines with configurable exit codes.

### 🤖 6. AI Architecture Copilot
- **Intelligent Refactoring Advice**: Context-aware AI suggestions to resolve architectural drift and untangle coupling.
- **Natural Language Querying**: Ask questions like *"Which modules violate the Hexagonal Architecture pattern?"*

### ☁️ 7. Multi-Cloud Storage & Backup Governance
- **Unified Cloud Backup System**: Synchronize architecture snapshots and policy reports seamlessly across:
  - **AWS S3** (`@aws-sdk/client-s3`)
  - **Google Cloud Storage** (`@google-cloud/storage`)
  - **Google Drive API v3** (OAuth 2.0 PKCE)
  - **Microsoft OneDrive** (Microsoft Graph API)
  - **MEGA** (Zero-knowledge client-derived encryption)
- **Zero-Knowledge Encryption**: AES-256-GCM authenticated encryption for tokens and stored snapshot data.

### 🕰️ 8. Architectural Time Machine & Hotspots
- **Historical Snapshot Comparison**: Diff software architecture across git commits, releases, or historical timeframes.
- **Change Velocity Hotspots**: Highlight modules undergoing rapid change combined with high architectural instability.

---

## 🏗️ System Architecture

<div align="center">

![ArchGuard AI Architecture Diagram](docs/assets/architecture-diagram.jpg)

*High-Level System Architecture Blueprint of ArchGuard AI*

</div>

### 📊 Interactive Mermaid Component Topology

```mermaid
graph TD
    subgraph Client ["🖥️ Client Layer (React 18 + Vite)"]
        UI["Dashboard Overview & Visualizers"]
        Map["Architecture Map & Coupling Matrix"]
        Editor["Policy Studio & ADR Manager"]
        Sandbox["Refactoring Sandbox & Time Machine"]
    end

    subgraph Server ["⚡ Backend API Gateway (Express Node.js Engine)"]
        API["REST & WebSocket API Gateway"]
        Auth["JWT & OAuth 2.0 Auth Service"]
        CloudSvc["Multi-Cloud Sync Manager"]
    end

    subgraph Engine ["🧠 ArchGuard Core Analysis Engine"]
        AST["AST & Dependency Parser"]
        Drift["Drift Detection Evaluator"]
        Fitness["Fitness Functions Engine"]
        Blast["Blast-Radius Calculator"]
        AI["AI Architecture Copilot"]
    end

    subgraph Storage ["💾 Persistence & Multi-Cloud Connectors"]
        DB[(Neon PostgreSQL)]
        S3[AWS S3]
        GCP[Google Cloud Storage]
        GDrive[Google Drive API v3]
        OneDrive[Microsoft Graph API]
        Mega[MEGA Cloud]
    end

    UI --> API
    Map --> API
    Editor --> API
    Sandbox --> API

    API --> Auth
    API --> CloudSvc
    API --> AST
    AST --> Drift
    AST --> Fitness
    AST --> Blast
    API --> AI

    Auth --> DB
    CloudSvc --> S3
    CloudSvc --> GCP
    CloudSvc --> GDrive
    CloudSvc --> OneDrive
    CloudSvc --> Mega
```

### 🧩 System Data Flow & Architecture Blueprint

```
+-----------------------------------------------------------------------------------+
|                            ARCHGUARD AI PLATFORM                                  |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +------------------------+      REST / WS      +------------------------------+  |
|  |   React 18 Dashboard   | <-----------------> |  Express.js Backend API      |  |
|  |   (Vite SPA Frontend)  |                     |  (Port 3001 Gateway)         |  |
|  +------------------------+                     +---------------+--------------+  |
|                                                                 |                 |
|                                                                 v                 |
|                                                 +---------------+--------------+  |
|                                                 |  ArchGuard Engine Pipeline   |  |
|                                                 |  - AST & Graph Parser        |  |
|                                                 |  - Drift Detector Evaluator  |  |
|                                                 |  - Fitness Function Metrics  |  |
|                                                 |  - AI Refactoring Copilot    |  |
|                                                 +---------------+--------------+  |
|                                                                 |                 |
|                                  +------------------------------+-----------------+
|                                  |                                                |
|                                  v                                                v
|                +-----------------+-----------------+            +-----------------+-----------------+
|                |    Neon Serverless PostgreSQL     |            |  Multi-Cloud Storage Governance |
|                |  (PostgreSQL Snapshot Store)      |            |  (AWS S3, GCP, Drive, OneDrive) |
|                +-----------------------------------+            +-----------------------------------+
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### 🔄 End-to-End Drift Detection Pipeline

1. **Source Parsing**: The AST Parser (`server/engine/parser.js`) constructs abstract syntax trees and dependency graphs for incoming JavaScript/TypeScript files.
2. **Rule Evaluation**: The Drift Detector (`server/engine/driftDetector.js`) cross-references module imports against active ADRs and Policy Studio rules.
3. **Fitness Function Calculation**: The Fitness Engine (`server/engine/fitnessFunctions.js`) computes coupling, instability, abstractness, and distance metrics ($D = |A + I - 1|$).
4. **Blast Radius Computation**: The Blast Radius module (`server/engine/blastRadius.js`) calculates affected downstream components for proposed changes.
5. **Persistence & Sync**: Results are saved to **Neon PostgreSQL** and automatically backed up to user-configured **Cloud Storage** (AWS S3, Google Drive, OneDrive, MEGA).

---

## 📁 Repository Structure

```
archguard-ai/
├── api/                    # Serverless API routes and handlers
├── bin/                    # Executable binaries for CLI tools
├── cli/                    # ArchGuard Command Line Interface tool
│   └── archguard.js        # Core CLI scanner & drift checker script
├── client/                 # React 18 frontend web application
│   ├── public/             # Static public assets
│   └── src/                # Frontend source components & pages
│       ├── components/     # UI Components (ADR, Map, Drift, Fitness, Cloud, etc.)
│       ├── data/           # Mock data & sample architecture models
│       └── styles/         # Custom styling systems & tokens
├── docs/                   # Architectural & security documentation
│   ├── cloud-storage.md    # Multi-cloud storage architecture guide
│   ├── google-drive.md     # Google Drive API setup guide
│   ├── mega.md             # MEGA zero-knowledge encryption guide
│   ├── oauth.md            # OAuth 2.0 PKCE authentication flow
│   ├── onedrive.md         # Microsoft OneDrive integration guide
│   └── security.md         # AES-256-GCM security specification
├── sample-ecommerce/       # Target codebase used for drift scanning validation
├── server/                 # Express.js backend server codebase
│   ├── config/             # Cloud providers & app environment configs
│   ├── controllers/        # API request controllers
│   ├── db/                 # Database connectors and migrations
│   ├── engine/             # ArchGuard Core AST Parsing & Drift Engine
│   │   ├── aiCopilot.js          # AI Copilot engine
│   │   ├── blastRadius.js        # Change impact calculator
│   │   ├── driftDetector.js      # Drift detection scanner
│   │   ├── fitnessFunctions.js   # Architecture health evaluator
│   │   └── graph.js              # Dependency graph generator
│   ├── middleware/         # Auth & validation middleware
│   ├── models/             # Database schemas
│   ├── routes/             # REST endpoint definitions
│   └── services/           # Cloud storage provider drivers
├── Dockerfile              # Container configuration for production deployment
├── render.yaml             # Render cloud platform deployment specification
├── vercel.json             # Vercel deployment configuration
├── vite.config.js          # Vite build tool configuration
└── package.json            # Project dependencies and operational scripts
```

---

## 🛠️ Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) | High-performance single page client dashboard |
| **Backend** | [Node.js](https://nodejs.org/) + [Express 4](https://expressjs.com/) | RESTful API gateway & WebSocket streaming |
| **Parsing Engine** | Custom AST & Dependency Graph Engine | Source code parsing, graph metrics & drift calculation |
| **Database** | [PostgreSQL (Neon)](https://neon.tech) + `pg` | Serverless relational database for snapshot persistence |
| **Cloud Storage** | AWS S3, GCP Storage, Google Drive, OneDrive, MEGA | Multi-cloud document sync and backup storage |
| **Security** | `crypto` (AES-256-GCM), `bcryptjs`, `jsonwebtoken` | Token encryption, password hashing, and secure auth |
| **CLI & DevOps** | Custom CLI (`cli/archguard.js`), Docker, Vercel, Render | Automation tooling and containerized deployment |

---

## ⚡ Quick Start

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **PostgreSQL Database** (Optional for local testing; [Neon PostgreSQL](https://neon.tech) supported)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/Tamilselvan3660/archguard-ai.git
cd archguard-ai

# Install root dependencies
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to create your local `.env` configuration file:
```bash
cp .env.example .env
```
Fill in the necessary secrets (Encryption keys, JWT secret, Database connection string):
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
TOKEN_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
SESSION_SECRET=archguard_production_session_secret_2026
JWT_SECRET=archguard_production_jwt_signing_key_2026
DATABASE_URL=postgresql://neondb_owner:your_password@ep-endpoint.neon.tech/neondb?sslmode=require
```

### 3. Run Development Servers

**Run Frontend Dashboard:**
```bash
npm run dev
# Dashboard will open at http://localhost:5173
```

**Run Backend API Server:**
```bash
npm run server
# Backend REST server will start at http://localhost:3001
```

**Test Engine Standalone:**
```bash
npm run test-engine
# Runs AST parser & drift detector tests on sample-ecommerce
```

---

## 💻 CLI Integration

ArchGuard AI comes equipped with a built-in Command Line Interface (`archguard`) to automate governance checks in local development or CI/CD pipelines.

```bash
# Scan codebase for architectural drift
npx archguard scan --path ./src --config ./archguard.json

# Run CI gating check (returns exit code 1 on architectural violation)
npx archguard check-drift --strict

# Generate architectural health report
npx archguard report --output ./archguard-report.html
```

---

## ☁️ Multi-Cloud Storage & Governance

ArchGuard AI provides zero-vendor-lock-in storage support. Backup architectural snapshots and policy declarations to your cloud provider of choice:

| Provider | Protocol / API | Auth Mechanism | Documentation |
| :--- | :--- | :--- | :--- |
| **AWS S3** | S3 API (`@aws-sdk/client-s3`) | Access Key ID & Secret Key | [Docs](docs/cloud-storage.md) |
| **Google Cloud Storage** | GCS Native SDK (`@google-cloud/storage`) | Service Account Key JSON | [Docs](docs/cloud-storage.md) |
| **Google Drive** | Drive v3 API | OAuth 2.0 PKCE + Refresh Tokens | [Docs](docs/google-drive.md) |
| **Microsoft OneDrive** | Graph API v1.0 | OAuth 2.0 Authorization Code | [Docs](docs/onedrive.md) |
| **MEGA** | Encrypted Session API | Zero-knowledge client-derived key | [Docs](docs/mega.md) |

---

## 🔐 Security & Compliance

Security is paramount in ArchGuard AI. We adhere to high cryptographic standards:

- 🔒 **Encryption at Rest**: Sensitive cloud tokens, API keys, and snapshot configurations are encrypted using **AES-256-GCM** authenticated encryption with random IVs.
- 🔑 **Zero Plaintext Storage**: User credentials, session hashes, and third-party tokens are never saved as plain text.
- 🛡️ **OAuth 2.0 Security**: OAuth authentication flows enforce state parameter verification, PKCE code exchange, and strict redirect validation.
- 📜 Read the full security architecture breakdown in [`docs/security.md`](docs/security.md).

---

## 🤝 Contributing

Contributions are welcomed! Follow these steps to contribute:

1. Fork the Repository
2. Create a Feature Branch (`git checkout -b feature/architectural-enhancement`)
3. Commit your changes (`git commit -m 'feat: Add automated hexagonal architecture rules'`)
4. Push to the Branch (`git push origin feature/architectural-enhancement`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more details.

---

<div align="center">

**Built with ❤️ for Software Architects, Tech Leads & Enterprise Engineering Teams.**

</div>

