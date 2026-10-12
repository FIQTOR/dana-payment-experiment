import { z } from 'zod';
import { nanoid } from 'nanoid';
import { danaService, mapDanaStatus } from '../services/danaService.js';
import * as txStore from '../store/transactions.js';
import { generateQrMatrix, matrixToSvg } from '../utils/qr.js';
import config from '../config/index.js';

/** Validation schema for creating a payment. */
const createPaymentSchema = z.object({
  amount: z.coerce.number().positive().max(100_000_000),
  currency: z.string().default('IDR'),
  description: z.string().max(140).optional(),
  merchantRefNo: z.string().max(64).optional(),
  validUpToMinutes: z.coerce.number().int().min(1).max(1440).default(30),
  customerName: z.string().max(64).optional(),
});

const refundSchema = z.object({
  amount: z.coerce.number().positive().max(100_000_000).optional(),
  reason: z.string().max(140).optional(),
});

/**
 * POST /api/payments
 * Create a new QRIS MPM payment and return the QR payload.
 */
export async function createPayment(req, res, next) {
  try {
    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }
    const input = parsed.data;
    const partnerReferenceNo = `PRN-${Date.now()}-${nanoid(6).toUpperCase()}`;

    await txStore.createTransaction({
      partnerReferenceNo,
      merchantRefNo: input.merchantRefNo,
      amount: { value: input.amount, currency: input.currency },
      description: input.description,
      validUntil: new Date(Date.now() + input.validUpToMinutes * 60_000).toISOString(),
    });

    let danaRes;
    try {
      danaRes = await danaService.createQrisTransaction({
        partnerReferenceNo,
        merchantRefNo: input.merchantRefNo,
        amount: { value: input.amount, currency: input.currency },
        description: input.description,
        validUpToMinutes: input.validUpToMinutes,
      });
    } catch (err) {
      // DANA call failed — don't leave an orphaned PENDING transaction behind.
      await txStore.updateTransaction(
        partnerReferenceNo,
        { status: 'FAILED' },
        `DANA create failed: ${err.message}`,
      );
      throw err;
    }

    // DANA signals business-level errors via responseCode, not HTTP status.
    if (danaRes.responseCode && !/^2/.test(String(danaRes.responseCode))) {
      await txStore.updateTransaction(
        partnerReferenceNo,
        { status: 'FAILED' },
        `DANA error ${danaRes.responseCode}: ${danaRes.responseMessage}`,
      );
      return res.status(422).json({
        success: false,
        error: 'DANA_ERROR',
        message: danaRes.responseMessage || 'DANA rejected the request',
        danaResponse: danaRes,
      });
    }

    const qrContent = danaRes.qrContent;
    const updated = await txStore.updateTransaction(
      partnerReferenceNo,
      {
        danaReferenceNo: danaRes.referenceNo,
        qrContent,
        qrUrl: danaRes.qrUrl,
      },
      'DANA QR generated',
      { silent: true },
    );

    // Announce the fully-populated transaction (now that the QR is attached)
    // so SSE subscribers receive the complete record, not a half-built one.
    await txStore.emitCreated(partnerReferenceNo);

    const svg = matrixToSvg(generateQrMatrix(qrContent));

    return res.status(201).json({
      success: true,
      data: {
        ...updated,
        qrImage: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
        mockMode: config.mockMode,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/payments — list transactions. */
export async function listPayments(req, res, next) {
  try {
    const { status, limit } = req.query;
    const parsedLimit = Number(limit);
    const data = await txStore.listTransactions({
      status: status || undefined,
      limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/payments/:ref — get one transaction. */
export async function getPayment(req, res, next) {
  try {
    const txn = await txStore.getTransaction(req.params.ref);
    if (!txn) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
    res.json({ success: true, data: txn });
  } catch (err) {
    next(err);
  }
}

/** GET /api/payments/:ref/qr.svg — render the QR as an SVG image. */
export async function getPaymentQr(req, res, next) {
  try {
    const txn = await txStore.getTransaction(req.params.ref);
    if (!txn || !txn.qrContent) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND' });
    }
    res.type('image/svg+xml').send(matrixToSvg(generateQrMatrix(txn.qrContent)));
  } catch (err) {
    next(err);
  }
}

/** POST /api/payments/:ref/query — poll DANA for the latest status. */
export async function queryPayment(req, res, next) {
  try {
    const txn = await txStore.getTransaction(req.params.ref);
    if (!txn) return res.status(404).json({ success: false, error: 'NOT_FOUND' });

    const danaRes = await danaService.queryQrisTransaction(txn.partnerReferenceNo, txn.danaReferenceNo);

    // Apply the status reported by DANA (if any) back onto our transaction.
    const mapped = mapDanaStatus(
      danaRes.latestTransactionStatus || danaRes.transactionStatus || danaRes.status,
    );
    let latest = txn;
    if (mapped && mapped !== txn.status) {
      latest =
        (await txStore.updateTransaction(
          txn.partnerReferenceNo,
          {
            status: mapped,
            danaReferenceNo: danaRes.originalReferenceNo || danaRes.referenceNo || txn.danaReferenceNo,
            payer: danaRes.payer || danaRes.additionalInfo?.payer || txn.payer,
          },
          'Status synced from DANA query',
        )) || txn;
    }

    res.json({ success: true, data: { transaction: latest, danaResponse: danaRes } });
  } catch (err) {
    next(err);
  }
}

/** POST /api/payments/:ref/cancel — cancel a payment. */
export async function cancelPayment(req, res, next) {
  try {
    const txn = await txStore.getTransaction(req.params.ref);
    if (!txn) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
    if (txn.status !== 'PENDING') {
      return res.status(409).json({
        success: false,
        error: 'INVALID_STATE',
        message: `Cannot cancel a ${txn.status} transaction`,
      });
    }

    await danaService.cancelQrisTransaction(txn.partnerReferenceNo, txn.danaReferenceNo);
    const updated = await txStore.updateTransaction(
      txn.partnerReferenceNo,
      { status: 'CANCELLED' },
      'Cancelled by merchant',
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/payments/:ref/refund — refund a settled payment.
 * Calls DANA's refund API and marks the transaction REFUNDED.
 */
export async function refundPayment(req, res, next) {
  try {
    const parsed = refundSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const txn = await txStore.getTransaction(req.params.ref);
    if (!txn) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
    if (txn.status !== 'SUCCESS') {
      return res.status(409).json({
        success: false,
        error: 'INVALID_STATE',
        message: `Only SUCCESS transactions can be refunded (current: ${txn.status})`,
      });
    }

    const refundAmount = parsed.data.amount ?? txn.amount.value;
    if (refundAmount > txn.amount.value) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_AMOUNT',
        message: 'Refund amount exceeds the original transaction amount',
      });
    }

    const refundRefNo = `RFD-${Date.now()}-${nanoid(6).toUpperCase()}`;
    const danaRes = await danaService.refundTransaction({
      partnerReferenceNo: refundRefNo,
      originalPartnerReferenceNo: txn.partnerReferenceNo,
      originalReferenceNo: txn.danaReferenceNo,
      amount: { value: refundAmount, currency: txn.amount.currency },
      reason: parsed.data.reason,
    });

    if (danaRes.responseCode && !/^2/.test(String(danaRes.responseCode))) {
      return res.status(422).json({
        success: false,
        error: 'DANA_ERROR',
        message: danaRes.responseMessage || 'DANA rejected the refund',
        danaResponse: danaRes,
      });
    }

    const updated = await txStore.updateTransaction(
      txn.partnerReferenceNo,
      { status: 'REFUNDED' },
      `Refunded ${refundAmount} ${txn.amount.currency} (${refundRefNo})`,
    );

    res.json({
      success: true,
      data: {
        transaction: updated,
        refund: {
          refundReferenceNo: refundRefNo,
          amount: refundAmount,
          currency: txn.amount.currency,
          danaResponse: danaRes,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/payments/:ref/simulate — EXPERIMENT ONLY.
 * Force a transaction into SUCCESS/FAILED/EXPIRED to test the UI without a real payer.
 * Gated by config.mockMode so it can never be used against live payments.
 */
export async function simulatePayment(req, res, next) {
  try {
    if (!config.mockMode) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Simulation is only available in mock mode (DANA_MOCK_MODE=true).',
      });
    }

    const txn = await txStore.getTransaction(req.params.ref);
    if (!txn) return res.status(404).json({ success: false, error: 'NOT_FOUND' });

    const body = req.body || {};
    const status = body.status || 'SUCCESS';
    if (!['SUCCESS', 'FAILED', 'EXPIRED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'INVALID_STATUS' });
    }

    const payer =
      status === 'SUCCESS'
        ? {
            name: typeof body.payerName === 'string' ? body.payerName : 'Test Payer',
            accountNo: typeof body.payer === 'string' ? body.payer : '081234567890',
          }
        : null;

    const updated = await txStore.updateTransaction(
      txn.partnerReferenceNo,
      { status, payer },
      'Simulated by developer',
    );
    res.json({ success: true, data: updated, simulated: true });
  } catch (err) {
    next(err);
  }
}

/** GET /api/payments/stats — aggregate stats for the dashboard. */
export async function paymentStats(req, res, next) {
  try {
    res.json({ success: true, data: await txStore.stats() });
  } catch (err) {
    next(err);
  }
}
