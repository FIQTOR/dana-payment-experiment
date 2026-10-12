# DANA Business API mapping

How this project maps to the **DANA Business API** (DANA Open API, SNAP-compliant).

Official reference: <https://dashboard.dana.id/api-docs-v2/>

> The DANA dashboard is a SPA and is only reachable from permitted regions.
> This document is based on the publicly documented SNAP (Standar Nasional Open
> API Pembayaran) specification that DANA implements. **Always confirm exact
> fields against the live docs** before shipping to production.

---

## 1. Authentication & signatures

DANA follows Bank Indonesia's **SNAP** standard. Two signatures are involved:

### a. `Authorization` for the access-token endpoint — HMAC-SHA512

```
stringToSign = CLIENT_KEY + ":" + TIMESTAMP
signature    = base64(HMAC_SHA512(stringToSign, CLIENT_SECRET))
```

Sent as headers on `POST /authorization/v1/access-token/b2b`:

| Header | Value |
| --- | --- |
| `X-CLIENT-KEY` | your client key |
| `X-TIMESTAMP` | ISO-8601 with `+07:00`, e.g. `2026-01-01T10:00:00+07:00` |
| `X-SIGNATURE` | HMAC-SHA512 signature |

Response: `{ accessToken, expiresIn }`.

Implemented in `backend/src/services/danaService.js#getAccessToken` and
`backend/src/utils/signature.js`.

### b. Business API request signature — RSA-SHA256

```
stringToSign = HTTP_METHOD
             + ":" + RELATIVE_PATH
             + ":" + ACCESS_TOKEN
             + ":" + lowercaseHex(SHA256(minifiedRequestBody))
             + ":" + TIMESTAMP
signature    = base64(RSA_SHA256_sign(stringToSign, MERCHANT_PRIVATE_KEY))
```

Headers sent with every business call:

| Header | Notes |
| --- | --- |
| `X-PARTNER-ID` | your partner id |
| `X-EXTERNAL-ID` | unique per request (we use a nanoid) |
| `X-TIMESTAMP` | ISO-8601 `+07:00` |
| `X-SIGNATURE` | RSA signature above |
| `CHANNEL-ID` | channel identifier (placeholder `95221`) |
| `Authorization` | `Bearer <accessToken>` |

Implemented in `backend/src/services/danaService.js#_headers`.

---

## 2. QRIS MPM endpoints

| Our route | DANA endpoint | Method | Purpose |
| --- | --- | --- | --- |
| `POST /api/payments` | `/v1.0/qr/qr-mpm-generate` | POST | Create a QRIS payment |
| `POST /api/payments/:ref/query` | `/v1.0/qr/qr-mpm-query` | POST | Query status |
| `POST /api/payments/:ref/cancel` | `/v1.0/qr/qr-mpm-cancel` | POST | Cancel payment |
| `POST /api/payments/:ref/refund` | `/v1.0/debit/refund` | POST | Refund (full or partial) |

### Create payment — request body (subset)

```jsonc
{
  "partnerReferenceNo": "PRN-...",       // your idempotent reference
  "merchantId": "...",
  "storeId": "...",
  "terminalId": "...",
  "amount": { "value": "25000.00", "currency": "IDR" },
  "additionalInfo": {
    "description": "...",
    "customerName": "..."                // optional; sent when provided
  },
  "validUpTo": "2026-01-01T10:30:00+07:00"
}
```

### Response (subset)

```jsonc
{
  "responseCode": "2004700",
  "responseMessage": "Successful",
  "referenceNo": "...",          // DANA's reference
  "partnerReferenceNo": "PRN-...",
  "qrContent": "0002010102...",  // EMVCo QR payload
  "validUpTo": "..."
}
```

Other products follow the same SNAP shape and can be added the same way:

| Product | Endpoint |
| --- | --- |
| e-Wallet debit (H2H) | `/v1.0/debit/payment-host-to-host` |
| Account inquiry | `/v1.0/emoney/account-inquiry` |
| Balance inquiry | `/v1.0/emoney/balance-inquiry` |

### Refund — request body (subset)

```jsonc
{
  "partnerRefundNo": "RFD-...",              // your unique refund reference
  "originalPartnerReferenceNo": "PRN-...",
  "originalReferenceNo": "...",              // DANA's reference of the original txn
  "merchantId": "...",
  "refundAmount": { "value": "10000.00", "currency": "IDR" },
  "reason": "customer request"
}
```

**Partial refunds** are supported: the backend tracks the cumulative
`refundedAmount` on the transaction and only flips the status to `REFUNDED` once
the full amount has been refunded. The response includes:

```jsonc
{
  "refund": {
    "refundReferenceNo": "RFD-...",
    "amount": 10000,
    "refundedTotal": 10000,
    "refundableRemaining": 15000,
    "fullyRefunded": false
  }
}
```

---

## 2b. Disbursement (transfer to bank)

| Our route | DANA endpoint | Method | Purpose |
| --- | --- | --- | --- |
| `POST /api/disbursements` | `/v1.0/disbursement/transfer` | POST | Transfer funds to a bank account |
| `POST /api/disbursements/inquiry` | `/v1.0/disbursement/bank-account-inquiry` | POST | Look up the account holder name |

The transfer body includes a `notifyUrl` (`$PUBLIC_BASE_URL/api/webhooks/disburse`)
so DANA reports the final transfer status asynchronously.

---

## 3. Webhooks (async notification)

DANA POSTs status updates to the URL you register in the dashboard. We expose two
endpoints:

| Our route | Dashboard field | Purpose |
| --- | --- | --- |
| `POST /api/webhooks/dana` | **Finish Payment URL** | Payment status updates |
| `POST /api/webhooks/disburse` | **Disburse to Bank Notify URL** | Transfer status updates |

Example payload:

```jsonc
{
  "partnerReferenceNo": "PRN-...",
  "originalReferenceNo": "20260101123456789",
  "latestTransactionStatus": "SUCCESS",   // PENDING | SUCCESS | FAILED | EXPIRED | CANCELLED
  "amount": { "value": "25000.00", "currency": "IDR" },
  "additionalInfo": { "payer": { "name": "Budi", "accountNo": "0812..." } }
}
```

Our handler must reply with:

```jsonc
{ "responseCode": "2002500", "responseMessage": "Successful" }
```

**Signature verification**: DANA signs webhooks with RSA-SHA256 using DANA's
private key. Provide `DANA_PUBLIC_KEY_PATH` and the handler
(`backend/src/controllers/webhookController.js`) will verify the
`X-SIGNATURE` header. Without it, verification is skipped and a warning is
logged (dev only).

---

## 4. Status code reference (common)

| `responseCode` | Meaning |
| --- | --- |
| `2004700` | QR generated / success (product-specific) |
| `2002500` | Webhook acknowledged |
| `4xxxxxx` | Business / validation error |
| `5xxxxxx` | System error |

Always branch on `responseCode`, not only HTTP status.

---

## 5. Where things live in the code

| Concern | File |
| --- | --- |
| Signature math (SNAP) | `backend/src/utils/signature.js` |
| DANA HTTP client + endpoints | `backend/src/services/danaService.js` |
| Payment routes/controllers | `backend/src/routes/payments.js`, `backend/src/controllers/paymentController.js` |
| Disbursement routes/controllers | `backend/src/routes/disbursements.js`, `backend/src/controllers/disbursementController.js` |
| Webhook receiver + verify | `backend/src/controllers/webhookController.js` |
| Transaction store (memory / DB) | `backend/src/store/transactions.js` |
| DB models + connection | `backend/src/db/models/transaction.js`, `backend/src/db/sequelize.js` |
| Key generation | `backend/src/utils/genKeyPair.js` |
| Connection self-test | `backend/src/scripts/danaPing.js` |
| Config / env | `backend/src/config/index.js`, `backend/.env.example` |
