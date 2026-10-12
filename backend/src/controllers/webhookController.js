import config from '../config/index.js';
import * as txStore from '../store/transactions.js';
import { mapDanaStatus } from '../services/danaService.js';
import { buildAsymmetricStringToSign, loadKey, verifyAsymmetric } from '../utils/signature.js';

/**
 * DANA async notification (webhook) handler for payment status updates.
 *
 * DANA POSTs payment status updates to the notification URL configured in the
 * dashboard. The payload mirrors the SNAP `additionalInfo` + status fields.
 *
 * Signature verification:
 *  - SNAP webhooks are signed with RSA-SHA256 using DANA's private key.
 *  - Verify with DANA_PUBLIC_KEY_PATH. If not configured, verification is
 *    skipped (local dev only) and a warning is logged.
 */
export async function handleDanaNotification(req, res, next) {
  try {
    const body = req.body || {};

    const verified = verifyNotification(req, body);

    // Map DANA status → internal status.
    const rawStatus =
      body.latestTransactionStatus || body.transactionStatus || body.status || '';
    const status = mapDanaStatus(rawStatus);

    // DANA uses either of these reference fields depending on the product.
    const ref =
      body.partnerReferenceNo ||
      body.originalPartnerReferenceNo ||
      body.originalReferenceNo ||
      body.merchantRefNo;

    const txn = ref ? await txStore.getTransaction(ref) : null;

    if (txn && status) {
      await txStore.updateTransaction(
        ref,
        {
          status,
          danaReferenceNo: body.originalReferenceNo || body.referenceNo || txn.danaReferenceNo,
          payer: body.payer || body.additionalInfo?.payer || txn.payer,
        },
        `Webhook: ${rawStatus} (verified=${verified})`,
      );
    }

    // DANA expects a 200 with this acknowledgement shape.
    res.status(200).json({
      responseCode: '2002500',
      responseMessage: 'Successful',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DANA async notification for disbursement (transfer-to-bank) status updates.
 * Configured in the dashboard under "Disburse to Bank Notify URL".
 */
export async function handleDisbursementNotification(req, res) {
  const body = req.body || {};
  const verified = verifyNotification(req, body);

  // Disbursements are fire-and-forget in this experiment; we acknowledge and log.
  console.log(
    `[webhook:disburse] ref=${body.partnerReferenceNo || body.originalReferenceNo || '-'} ` +
      `status=${body.latestTransactionStatus || body.status || '-'} verified=${verified}`,
  );

  res.status(200).json({
    responseCode: '2002500',
    responseMessage: 'Successful',
  });
}

/** Verify the inbound webhook signature (best-effort). */
function verifyNotification(req, body) {
  const publicKey = loadKey(config.dana.publicKeyPath);
  const signature = req.headers['x-signature'];
  if (!publicKey) {
    console.warn('[webhook] No DANA public key configured — skipping signature verification.');
    return false;
  }
  if (!signature) return false;

  // IMPORTANT: SNAP signatures are computed over the EXACT raw request bytes as
  // sent by DANA. Re-serializing the parsed JSON (key order / whitespace) would
  // produce a different hash and always fail verification. Prefer req.rawBody
  // (populated by the express.json `verify` hook); fall back to the parsed body
  // only when raw bytes are unavailable (e.g. upstream already consumed them).
  const bodyForHash = req.rawBody ? req.rawBody.toString('utf8') : body;

  const stringToSign = buildAsymmetricStringToSign({
    method: req.method,
    path: req.originalUrl.split('?')[0],
    token: (req.headers.authorization || '').replace(/^Bearer\s+/i, ''),
    body: bodyForHash,
    timestamp: req.headers['x-timestamp'],
  });
  return verifyAsymmetric(stringToSign, signature, publicKey);
}
