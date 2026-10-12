<p align="center">
  <img src="docs/screenshots/banner.svg" alt="DANA Pay · Experiment Lab" width="100%">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg" alt="Node >= 20">
  <a href="https://github.com/FIQTOR/dana-payment-experiment/actions/workflows/ci.yml"><img src="https://github.com/FIQTOR/dana-payment-experiment/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/tests-41%20passing-success.svg" alt="Tests">
  <img src="https://img.shields.io/badge/express-4.x-000000.svg" alt="Express 4">
  <img src="https://img.shields.io/badge/react-19-61dafb.svg" alt="React 19">
  <img src="https://img.shields.io/badge/vite-8-646cff.svg" alt="Vite 8">
  <img src="https://img.shields.io/badge/tailwindcss-4-38bdf8.svg" alt="TailwindCSS 4">
  <a href="https://dashboard.dana.id/api-docs-v2/"><img src="https://img.shields.io/badge/DANA%20API-docs-118eea.svg" alt="DANA API Docs"></a>
  <img src="https://img.shields.io/badge/status-experimental-orange.svg" alt="Experimental">
</p>

> 💳 An **experimental** full-stack playground for the **DANA Business API**
> (Indonesian SNAP/QRIS standard) — create QRIS payments, poll status, refund,
> disburse to bank, receive webhooks, and watch a live operator dashboard update
> in real time.
>
> 🧪 Ships in **mock mode** by default, so you can explore the entire payment
> lifecycle **without any credentials**.

---

## 📚 Table of contents

- [✨ Features](#-features)
- [🖼 Screenshots](#-screenshots)
- [🏗 Architecture](#-architecture)
- [🧰 Tech stack](#-tech-stack)
- [🚀 Quick start](#-quick-start)
- [🔁 Payment lifecycle](#-payment-lifecycle)
- [💾 Persistence (MySQL)](#-persistence-mysql)
- [🐳 Docker](#-docker)
- [🔎 Connection self-test](#-connection-self-test)
- [🔐 Going live (sandbox / production)](#-going-live-sandbox--production)
- [📡 API reference](#-api-reference)
- [🗂 Project structure](#-project-structure)
- [🧪 Available scripts](#-available-scripts)
- [✅ Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [⚠️ Disclaimer](#️-disclaimer)
- [📄 License](#-license)

---

## ✨ Features

| Area | What you get |
| --- | --- |
| **Backend** | Express.js REST API · **SNAP request signing** (RSA-SHA256) · **HMAC-SHA512** access-token flow · QRIS MPM create / query / cancel · **refund** · **bank disbursement** · webhook receiver with signature verification · Server-Sent Events for live updates · zod validation · rate limiting + helmet · **in-memory or MySQL (Sequelize)** storage |
| **Frontend** | React 19 + Vite 8 + **TailwindCSS v4** + **Tabler Icons** · dashboard with live stats · payment creator with QR preview · filterable transaction list · detail modal (QR / timeline / query / cancel / refund / simulation) · webhook tester |
| **DX** | **Mock mode** (no network) · **`npm run dana:ping`** self-test · keypair generator · **41 automated tests** (Vitest + Supertest) · Docker Compose · Postman collection · hot reload · CI workflow |

---

## 🖼 Screenshots

> These are high-fidelity **UI mockups** (embedded as SVG). The QR codes are
> **real, scannable** QRIS payloads and the DANA mark is the official brand logo.
> Regenerate them with `npm run screenshots --prefix backend`.

### Dashboard — live stats, transactions & payment creator
![Dashboard](docs/screenshots/dashboard.svg)

### Payment detail — QR, timeline & experiment controls
![Payment detail](docs/screenshots/payment-detail.svg)

### Webhook tester — copy the endpoint & fire sample payloads
![Webhook tester](docs/screenshots/webhook-tester.svg)

---

## 🏗 Architecture

![Architecture](docs/screenshots/architecture.svg)

The React app talks **only** to the Express backend (`/api/*`, proxied by Vite in
dev). The backend handles all DANA communication: SNAP signatures, access tokens,
QRIS calls, and webhook verification. Live updates flow back over SSE.

---

## 🧰 Tech stack

**Backend**

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?logo=axios&logoColor=white)

`express` · `axios` · `zod` · `cors` · `morgan` · `nanoid` · `dotenv`

**Frontend**

![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)
![Tabler](https://img.shields.io/badge/Tabler%20Icons-206BC4?logo=tabler&logoColor=white)

`react` · `react-dom` · `vite` · `tailwindcss` · `@tailwindcss/vite` · `@tabler/icons-react`

---

## 🚀 Quick start

**Requirements:** Node.js **≥ 20** (developed on 24) and npm.

```bash
# 1. Clone
git clone https://github.com/FIQTOR/dana-payment-experiment.git
cd dana-payment-experiment

# 2. Install root + workspaces
npm install
npm run install:all

# 3. Configure the backend
cp backend/.env.example backend/.env
npm run keygen                # generates an RSA keypair in backend/certs

# 4. Run everything (backend :4000 + frontend :5173)
npm run dev
```

Then open **<http://localhost:5173>** 🎉

> ✅ Because `DANA_MOCK_MODE=true` by default, no DANA credentials are needed.
> Create payments, "pay" them via the simulation controls, and fire webhooks —
> entirely offline.

---

## 🔁 Payment lifecycle

```text
┌──────────────┐   POST /api/payments    ┌──────────────────┐   POST qr-mpm-generate   ┌──────────┐
│  Frontend    │ ──────────────────────► │  Express backend │ ───────────────────────► │   DANA   │
│  (React)     │ ◄────────────────────── │  (SNAP signing)  │ ◄─────────────────────── │   API    │
└──────────────┘   { qrContent, QR svg } └──────────────────┘   { referenceNo, qr }    └──────────┘
        ▲                                        ▲
        │            SSE /api/events             │   POST /api/webhooks/dana (async notify)
        └────────────────────────────────────────┘
```

1. **Create** → backend requests a QRIS MPM (`qr-mpm-generate`) → returns QR payload + SVG.
2. **Display** → dashboard shows the QR, amount, and validity window.
3. **Pay** → via *Experiment controls* (`POST /:ref/simulate`) in mock mode, or a real DANA webhook.
4. **Update** → the dashboard reflects the new status instantly over SSE; stats recompute.
5. **Refund / Disburse** → refund a settled payment, or transfer funds to a bank account.

---

## 💾 Persistence (MySQL)

By default the project uses an **in-memory store** (zero setup). To persist
transactions across restarts, enable **MySQL via Sequelize**:

```bash
# 1. Have a MySQL server running, then create the database:
#    CREATE DATABASE dana_payments CHARACTER SET utf8mb4;

# 2. Enable it in backend/.env
DB_ENABLED=true
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dana_payments
DB_USER=root
DB_PASSWORD=yourpassword
```

On boot the schema is created/updated automatically (`sequelize.sync`). Check the
active backend any time:

```bash
curl -s http://localhost:4000/api/webhooks/config | jq .data.storage
# → "mysql"  or  "memory"
```

> If the DB is enabled but unreachable, the app logs the error and **falls back to
> in-memory** so it still starts.

---

## 🐳 Docker

Run the whole stack (MySQL + backend + frontend) with one command:

```bash
docker compose up --build
# frontend → http://localhost:8080
# backend  → http://localhost:4000
# mysql    → localhost:3306
```

DANA credentials are passed through from your shell environment:

```bash
DANA_MOCK_MODE=false \
DANA_PARTNER_ID=... DANA_CLIENT_ID=... DANA_CLIENT_SECRET=... \
PUBLIC_BASE_URL=https://<tunnel> \
docker compose up --build
```

---

## 🔎 Connection self-test

Before blaming your integration, validate your setup:

```bash
cd backend
npm run dana:ping
```

It checks config, key validity, a sign/verify round-trip, and (in live mode)
requests a real access token — printing **exactly** what passed or failed.

---

## 🔐 Going live (sandbox / production)

DANA's sandbox is **not** credential-free — it's a real environment with sandbox-specific
keys. You need a **Partner ID**, **Client ID**, **Client Secret**, and an **RSA keypair**.

### Where to get credentials

1. Register at the **DANA Merchant Portal** → <https://dashboard.dana.id> (business/KYC required).
2. Create a **Sandbox** application.
3. Generate an RSA keypair — either from the dashboard or locally:
   ```bash
   npm run keygen            # → backend/certs/private_key.pem + public_key.pem
   ```
4. **Upload your public key** to the DANA dashboard.
5. **Download DANA's public key** (for webhook verification).
6. Copy your **Client ID / Client Secret / Partner ID / Merchant ID / Store ID**.

### Configure `backend/.env`

```env
DANA_MOCK_MODE=false
DANA_BASE_URL=https://api.sandbox.dana.id      # prod: https://api.dana.id
DANA_PARTNER_ID=...
DANA_CLIENT_ID=...
DANA_CLIENT_SECRET=...
DANA_MERCHANT_ID=...
DANA_STORE_ID=...
DANA_CHANNEL_ID=...

# your private key (signs requests)
DANA_PRIVATE_KEY_PATH=./certs/private_key.pem
# DANA's public key (verifies webhooks)
DANA_PUBLIC_KEY_PATH=./certs/dana_public_key.pem

# public URL DANA can reach for async notifications
PUBLIC_BASE_URL=https://your-tunnel.example.com
```

### Expose your local server for webhooks

DANA can't reach `localhost`. Use a tunnel:

```bash
npx cloudflared tunnel --url http://localhost:4000   # or: ngrok http 4000
```

Register the tunnel URL + `/api/webhooks/dana` as your **Finish Payment URL** in the
DANA dashboard, and set `PUBLIC_BASE_URL` to the tunnel origin.

### Verify your setup

```bash
curl -s http://localhost:4000/api/webhooks/config | jq
```

Look for `"mockMode": false`, `"hasPrivateKey": true`, `"hasPublicKey": true`,
and `"hasClientSecret": true`.

📖 Full walkthrough: [`docs/SANDBOX-SETUP.md`](docs/SANDBOX-SETUP.md) ·
SNAP details: [`docs/DANA-API-MAPPING.md`](docs/DANA-API-MAPPING.md)

---

## 📡 API reference

Base URL: `http://localhost:4000/api`

### Payments

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/payments` | Create a QRIS MPM payment |
| `GET` | `/payments` | List transactions (`?status=&limit=`) |
| `GET` | `/payments/:ref` | Get one transaction |
| `GET` | `/payments/:ref/qr.svg` | QR image (SVG) |
| `POST` | `/payments/:ref/query` | Poll DANA for the latest status |
| `POST` | `/payments/:ref/cancel` | Cancel a pending payment |
| `POST` | `/payments/:ref/refund` | Refund a settled (SUCCESS) payment |
| `POST` | `/payments/:ref/simulate` | 🧪 Force a status (mock mode only) |
| `GET` | `/payments/stats` | Aggregate stats |

### Disbursements

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/disbursements` | Transfer funds to a bank account |
| `POST` | `/disbursements/inquiry` | Look up a bank account holder name |

### Webhooks & events

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/webhooks/dana` | DANA payment notification (signature-verified) |
| `POST` | `/webhooks/disburse` | DANA disbursement notification |
| `GET` | `/webhooks/config` | Current configuration, key status & storage backend |
| `GET` | `/events` | Server-Sent Events stream (live updates) |

> 📮 A ready-to-import **Postman collection** lives at
> [`docs/postman_collection.json`](docs/postman_collection.json).

<details>
<summary><b>Example — create a payment</b></summary>

```bash
curl -X POST http://localhost:4000/api/payments \
  -H "Content-Type: application/json" \
  -d '{"amount": 25000, "description": "Kopi Susu Gula Aren x2"}'
```

```jsonc
{
  "success": true,
  "data": {
    "partnerReferenceNo": "PRN-1791790460984-J3I3JH",
    "danaReferenceNo": "OHSWVMQWRS3UYDSI",
    "amount": { "value": 25000, "currency": "IDR" },
    "status": "PENDING",
    "qrContent": "00020101021226610014ID.CO.QRIS.WWW...",
    "qrImage": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0i...",
    "validUntil": "2026-10-12T06:15:46.890Z"
  }
}
```
</details>

---

## 🗂 Project structure

```
dana-payment-experiment/
├── backend/                      # Express.js API (ESM)
│   ├── certs/                    # RSA keys (gitignored)
│   ├── src/
│   │   ├── config/               # Env-aware configuration
│   │   ├── controllers/          # Payment, disbursement + webhook handlers
│   │   ├── db/                   # Sequelize (MySQL) models & connection
│   │   ├── middlewares/          # Error handling, raw-body capture
│   │   ├── routes/               # /api/payments, /disbursements, /webhooks
│   │   ├── scripts/              # danaPing.js (connection self-test)
│   │   ├── services/             # DANA API client (SNAP)
│   │   ├── store/                # Store (memory or MySQL) + event bus
│   │   ├── utils/                # signature, qr, genKeyPair
│   │   └── server.js
│   ├── tests/                    # Vitest + Supertest
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                     # React + Vite + Tailwind v4
│   ├── src/
│   │   ├── components/           # UI building blocks
│   │   ├── hooks/                # useTransactionEvents (SSE)
│   │   ├── lib/                  # api client + formatters
│   │   └── App.jsx
│   ├── Dockerfile
│   └── nginx.conf
│
├── docs/
│   ├── DANA-API-MAPPING.md       # how code maps to DANA SNAP endpoints
│   ├── SANDBOX-SETUP.md          # step-by-step sandbox guide
│   ├── postman_collection.json   # import-ready API collection
│   └── screenshots/
│
├── docker-compose.yml            # MySQL + backend + frontend
└── .github/workflows/ci.yml      # lint + build + tests + smoke test
```

---

## 🧪 Available scripts

**Root**

| Command | Description |
| --- | --- |
| `npm run dev` | Run backend **and** frontend together |
| `npm run install:all` | Install backend + frontend deps |
| `npm run keygen` | Generate an RSA keypair |
| `npm run dana:ping` | Run the DANA connection self-test |
| `npm test` | Run the backend test suite |
| `npm run build` | Build the frontend |
| `npm run lint` | Lint the frontend |

**Backend** (`cd backend`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start with file watching |
| `npm start` | Start once |
| `npm run gen-key` | Generate an RSA-2048 keypair |
| `npm run dana:ping` | Validate config, keys & DANA connectivity |
| `npm test` | Run tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

**Frontend** (`cd frontend`)

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint with oxlint |

---

## ✅ Testing

41 tests covering signature math, the store, and every endpoint (via Supertest):

```bash
cd backend
npm test
```

```
 ✓ tests/signature.test.js   (8 tests)
 ✓ tests/store.test.js       (9 tests)
 ✓ tests/api.test.js         (24 tests)

 Test Files  3 passed (3)
      Tests  41 passed (41)
```

The suite runs fully **offline in mock mode** — no credentials or network needed.

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

Ideas that would make great first PRs:

- 🧑💼 Add an **operator authentication** layer
- 🔔 Add **balance inquiry** (`/v1.0/emoney/balance-inquiry`)
- 📦 Add **database migrations** (replace `sync({ alter })`)
- 📸 Real UI screenshots via Playwright
- 🌐 Internationalization (EN/ID)

---

## ⚠️ Disclaimer

This project is provided for **educational and experimental purposes only**.

- It is **not affiliated with, endorsed by, or connected to** DANA or
  PT Espay Debit Indonesia Koe.
- **DANA** and its logo are trademarks of their respective owners. The DANA logo
  is used here only to reference the API being integrated (nominative fair use).
  Source: [dana.id](https://dana.id/) via Wikimedia Commons (public domain /
  simple geometric text-logo).
- You are responsible for complying with DANA's terms, sandbox usage policies,
  and all applicable financial regulations.
- **Never commit real private keys or client secrets.** This repo runs in mock
  mode by default; production credentials must stay in an untracked `.env`.

---

## 📄 License

Released under the [MIT License](LICENSE) © 2026 FIQTOR

<p align="center">Made with ☕ and the DANA Business API (SNAP) docs</p>
