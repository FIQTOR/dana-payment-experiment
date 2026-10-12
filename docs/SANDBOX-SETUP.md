# Sandbox setup guide

Step-by-step guide to connect this project to the **DANA Business API sandbox**.

> The DANA sandbox is **not** credential-free — it's a real, isolated environment
> that authenticates every request. You need sandbox credentials and an RSA keypair.

---

## 0. Prerequisites

- Node.js ≥ 20
- A DANA developer/merchant account with sandbox access
  (`https://dashboard.dana.id` — business/KYC may be required)
- A way to expose your local server publicly for webhooks (tunnel — step 4)

---

## 1. Get your sandbox credentials

In the **DANA Merchant Portal** → **Sandbox**:

1. Open **API Docs / API Keys** and note:
   - **Partner ID** → `DANA_PARTNER_ID`
   - **Client ID** → `DANA_CLIENT_ID`
   - **Client Secret** → `DANA_CLIENT_SECRET`
   - **Merchant ID / Store ID** → `DANA_MERCHANT_ID` / `DANA_STORE_ID`
   - **Channel ID** → `DANA_CHANNEL_ID`
2. Generate (or copy) an **RSA keypair**:
   - **Private key** → keep secret on your server (`DANA_PRIVATE_KEY_PATH`)
   - **Public key** → upload to the dashboard
   - Separately, **download DANA's public key** → `DANA_PUBLIC_KEY_PATH`
     (this is what verifies inbound webhooks)

### Option A — generate your own keypair

```bash
cd backend
npm run gen-key       # → certs/private_key.pem + certs/public_key.pem
```

Then **upload `certs/public_key.pem`** content to the dashboard.

### Option B — use the keypair the dashboard generated for you

Paste each key into a PEM file:

```bash
# certs/private_key.pem
-----BEGIN PRIVATE KEY-----
<your private key>
-----END PRIVATE KEY-----

# certs/dana_public_key.pem
-----BEGIN PUBLIC KEY-----
<DANA's public key>
-----END PUBLIC KEY-----
```

---

## 2. Configure `.env`

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DANA_MOCK_MODE=false
DANA_BASE_URL=https://api.sandbox.dana.id

DANA_PARTNER_ID=...
DANA_CLIENT_ID=...
DANA_CLIENT_SECRET=...
DANA_MERCHANT_ID=...
DANA_STORE_ID=...
DANA_CHANNEL_ID=95221

DANA_PRIVATE_KEY_PATH=./certs/private_key.pem
DANA_PUBLIC_KEY_PATH=./certs/dana_public_key.pem

# filled in step 4:
PUBLIC_BASE_URL=https://<your-tunnel>.trycloudflare.com
```

---

## 3. Validate before you run

```bash
cd backend
npm run dana:ping
```

Expected output (abridged):

```
Configuration
  · base URL       : https://api.sandbox.dana.id
  · mode           : LIVE (calls DANA)
Keys
  ✓ Private key loaded (./certs/private_key.pem)
  ✓ Valid RSA private key (2048 bits)
  ✓ Public key loaded (./certs/dana_public_key.pem)
Signature round-trip
  ✓ Signed a test message with the private key
DANA connectivity (live access-token request)
  ✓ Access token received (eyJhbGciOi…)
All checks passed.
```

- `✓ Access token received` → credentials **and** HMAC signature are correct 🎉
- `✗ DANA rejected the request` → see the printed `responseCode` / `responseMessage`
- `✗ Network error` → check internet / `DANA_BASE_URL` / firewall

---

## 4. Expose your local server for webhooks

DANA can't reach `localhost`. Start a tunnel:

```bash
# Cloudflare (no account needed)
npx cloudflared tunnel --url http://localhost:4000

# or ngrok
ngrok http 4000
```

Copy the public URL (e.g. `https://abc-def.trycloudflare.com`) and set it as
`PUBLIC_BASE_URL` in `backend/.env`.

---

## 5. Register endpoints in the DANA dashboard

**Sandbox → Integration Overview → Endpoint URLs Initialization:**

| Field | Value |
| --- | --- |
| **Finish Payment URL** | `https://<tunnel>/api/webhooks/dana` |
| **Disburse to Bank Notify URL** | `https://<tunnel>/api/webhooks/disburse` |
| **Finish Redirect URL** | `https://<tunnel>/payment/finish` *(optional)* |

> These URLs **change every time you restart the tunnel**. Re-update them when they do.

---

## 6. Run the stack

```bash
# from the repo root
npm run dev            # backend :4000 + frontend :5173
```

Open <http://localhost:5173> — the badge should read **Live mode**.

---

## 7. Test a payment

Because `DANA_MOCK_MODE=false`, the simulation endpoint is **disabled** (by design).
Use a real sandbox flow:

```bash
# 1. Create a payment
curl -s -X POST http://localhost:4000/api/payments \
  -H "Content-Type: application/json" \
  -d '{"amount": 25000, "description": "Sandbox test"}' | jq
```

Scan the returned `qrContent` in the DANA sandbox app, or use DANA's sandbox
simulator. Watch your backend log for:

```
POST /api/webhooks/dana     ← DANA notifies you
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `401 / 400` on access-token | Wrong Client ID / Secret | Recheck `DANA_CLIENT_ID` / `DANA_CLIENT_SECRET` |
| `Signature invalid` | Wrong private key, or body not minified | Regenerate keys / ensure `DANA_PRIVATE_KEY_PATH` points to the key whose **public** counterpart is uploaded |
| No webhooks received | Tunnel down or URL not registered | Restart tunnel, re-copy URL into the dashboard |
| Webhook ignored (`verified=false`) | `DANA_PUBLIC_KEY_PATH` missing/wrong | Download DANA's public key and configure it |
| `ENOTFOUND api-sandbox.dana.id` | No network / DNS | Check connectivity |
| Rate limited (`429`) | Too many requests | Raise `RATE_LIMIT_MAX` or slow down |

---

## ⚠️ Security reminders

- **Never commit** `.env` or `*.pem` (already gitignored).
- Treat the **Client Secret** and **private key** as highly sensitive.
- Rotate credentials if they are ever exposed (e.g. pasted into a chat or issue).
- These are **sandbox** keys — production keys must live in a secret manager.
