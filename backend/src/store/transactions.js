import { EventEmitter } from 'node:events';
import { nanoid } from 'nanoid';

/**
 * A tiny in-memory transaction store with an event bus.
 * Suitable for local experimentation. Swap for a real DB in production.
 *
 * Transaction shape:
 * {
 *   id, merchantRefNo, danaReferenceNo, partnerReferenceNo,
 *   amount: { value, currency },
 *   status, // PENDING | SUCCESS | FAILED | EXPIRED | CANCELLED
 *   qrContent, qrUrl, validUntil, payer, createdAt, updatedAt, history[]
 * }
 */
export const store = new EventEmitter();

const transactions = new Map(); // keyed by partnerReferenceNo

/**
 * Create a transaction. Does NOT emit an event yet — callers should attach any
 * extra data (e.g. the QR payload) and then call `emitCreated` so subscribers
 * receive the COMPLETE transaction rather than a half-populated one.
 */
export function createTransaction(input, { silent = true } = {}) {
  const now = new Date().toISOString();
  const txn = {
    id: nanoid(),
    partnerReferenceNo: input.partnerReferenceNo,
    merchantRefNo: input.merchantRefNo || input.partnerReferenceNo,
    danaReferenceNo: null,
    amount: input.amount,
    status: 'PENDING',
    qrContent: null,
    qrUrl: null,
    validUntil: input.validUntil || new Date(Date.now() + 30 * 60_000).toISOString(),
    payer: null,
    description: input.description || 'DANA payment',
    createdAt: now,
    updatedAt: now,
    history: [{ status: 'PENDING', at: now, note: 'Transaction created' }],
  };
  transactions.set(txn.partnerReferenceNo, txn);
  if (!silent) store.emit('transaction:created', txn);
  return txn;
}

/** Explicitly announce a freshly-created (and fully-populated) transaction. */
export function emitCreated(partnerReferenceNo) {
  const txn = transactions.get(partnerReferenceNo);
  if (txn) store.emit('transaction:created', txn);
  return txn || null;
}

export function getTransaction(partnerReferenceNo) {
  return transactions.get(partnerReferenceNo) || null;
}

export function listTransactions({ status, limit = 50 } = {}) {
  let all = [...transactions.values()].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  if (status) all = all.filter((t) => t.status === status);
  return all.slice(0, limit);
}

/**
 * Patch a transaction. Emits `transaction:updated` whenever anything changed
 * (not only on status transitions) so subscribers always stay in sync — e.g.
 * when the QR payload is attached a moment after creation.
 */
export function updateTransaction(partnerReferenceNo, patch, note, { silent = false } = {}) {
  const txn = transactions.get(partnerReferenceNo);
  if (!txn) return null;

  const changed = Object.keys(patch).some((k) => txn[k] !== patch[k]);
  Object.assign(txn, patch, { updatedAt: new Date().toISOString() });

  if (patch.status) {
    txn.history.push({ status: patch.status, at: txn.updatedAt, note: note || '' });
  }

  if (!silent && (changed || patch.status)) {
    store.emit('transaction:updated', txn);
  }
  return txn;
}

export function stats() {
  const all = [...transactions.values()];
  const byStatus = all.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const successValue = all
    .filter((t) => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + (Number(t.amount?.value) || 0), 0);
  return {
    total: all.length,
    byStatus,
    successValue,
    currency: all[0]?.amount?.currency || 'IDR',
  };
}
