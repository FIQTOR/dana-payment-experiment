import { EventEmitter } from 'node:events';
import { nanoid } from 'nanoid';
import { isDbEnabled, getTransactionModel, getSequelize } from '../db/sequelize.js';

/**
 * Transaction store with an event bus and two interchangeable backends:
 *
 *   - in-memory (default)  — zero setup, perfect for experiments
 *   - MySQL via Sequelize  — set DB_ENABLED=true to persist across restarts
 *
 * All functions are async so callers work identically with either backend.
 *
 * Transaction shape (both backends):
 * {
 *   id, partnerReferenceNo, merchantRefNo, danaReferenceNo,
 *   amount: { value: number, currency: string },
 *   refundedAmount: number,
 *   status, // PENDING | SUCCESS | FAILED | EXPIRED | CANCELLED | REFUNDED
 *   qrContent, qrUrl, validUntil, payer, description, customerName,
 *   createdAt, updatedAt, history[]
 * }
 */
export const store = new EventEmitter();

const transactions = new Map(); // used only when DB is disabled

/** True when the MySQL backend is active. */
export function usingDb() {
  return isDbEnabled();
}

// ----------------------------------------------------------- serialization ---

/** DB row -> plain transaction object (matches the in-memory shape). */
function rowToTxn(row) {
  const j = row.get ? row.get({ plain: true }) : row;
  return {
    id: j.id,
    partnerReferenceNo: j.partnerReferenceNo,
    merchantRefNo: j.merchantRefNo,
    danaReferenceNo: j.danaReferenceNo,
    amount: { value: Number(j.amountValue), currency: j.currency },
    refundedAmount: Number(j.refundedAmount) || 0,
    status: j.status,
    qrContent: j.qrContent,
    qrUrl: j.qrUrl,
    validUntil: j.validUntil ? new Date(j.validUntil).toISOString() : null,
    payer: j.payer || null,
    description: j.description,
    customerName: j.customerName || null,
    createdAt: new Date(j.createdAt).toISOString(),
    updatedAt: new Date(j.updatedAt).toISOString(),
    history: Array.isArray(j.history) ? j.history : [],
  };
}

// -------------------------------------------------------------- operations ---

/**
 * Create a transaction. Does NOT emit an event — callers attach extra data
 * (e.g. the QR payload) then call `emitCreated` so subscribers receive the
 * COMPLETE transaction rather than a half-populated one.
 */
export async function createTransaction(input, { silent = true } = {}) {
  const now = new Date().toISOString();
  const txn = {
    id: nanoid(),
    partnerReferenceNo: input.partnerReferenceNo,
    merchantRefNo: input.merchantRefNo || input.partnerReferenceNo,
    danaReferenceNo: null,
    amount: {
      value: Number(input.amount.value),
      currency: input.amount.currency || 'IDR',
    },
    refundedAmount: 0,
    status: 'PENDING',
    qrContent: null,
    qrUrl: null,
    validUntil: input.validUntil || new Date(Date.now() + 30 * 60_000).toISOString(),
    payer: null,
    description: input.description || 'DANA payment',
    customerName: input.customerName || null,
    createdAt: now,
    updatedAt: now,
    history: [{ status: 'PENDING', at: now, note: 'Transaction created' }],
  };

  if (usingDb()) {
    const Model = getTransactionModel();
    const created = await Model.create({
      id: txn.id,
      partnerReferenceNo: txn.partnerReferenceNo,
      merchantRefNo: txn.merchantRefNo,
      amountValue: txn.amount.value,
      currency: txn.amount.currency,
      status: txn.status,
      validUntil: txn.validUntil,
      description: txn.description,
      customerName: txn.customerName,
      history: txn.history,
    });
    const result = rowToTxn(created);
    if (!silent) store.emit('transaction:created', result);
    return result;
  }

  transactions.set(txn.partnerReferenceNo, txn);
  if (!silent) store.emit('transaction:created', txn);
  return txn;
}

/** Explicitly announce a freshly-created (and fully-populated) transaction. */
export async function emitCreated(partnerReferenceNo) {
  const txn = await getTransaction(partnerReferenceNo);
  if (txn) store.emit('transaction:created', txn);
  return txn;
}

export async function getTransaction(partnerReferenceNo) {
  if (usingDb()) {
    const Model = getTransactionModel();
    const row = await Model.findOne({ where: { partnerReferenceNo } });
    return row ? rowToTxn(row) : null;
  }
  return transactions.get(partnerReferenceNo) || null;
}

export async function listTransactions({ status, limit = 50 } = {}) {
  if (usingDb()) {
    const Model = getTransactionModel();
    const where = status ? { status } : undefined;
    const rows = await Model.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
    });
    return rows.map(rowToTxn);
  }

  let all = [...transactions.values()].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  if (status) all = all.filter((t) => t.status === status);
  return all.slice(0, limit);
}

/**
 * Patch a transaction. Emits `transaction:updated` whenever anything changed
 * (not only on status transitions) so subscribers always stay in sync.
 */
export async function updateTransaction(
  partnerReferenceNo,
  patch,
  note,
  { silent = false } = {},
) {
  if (usingDb()) {
    const Model = getTransactionModel();
    const row = await Model.findOne({ where: { partnerReferenceNo } });
    if (!row) return null;

    const current = rowToTxn(row);
    const changed = Object.keys(patch).some(
      (k) => JSON.stringify(current[k]) !== JSON.stringify(patch[k]),
    );
    const now = new Date().toISOString();

    const updates = {};
    if (patch.status !== undefined) updates.status = patch.status;
    if (patch.danaReferenceNo !== undefined) updates.danaReferenceNo = patch.danaReferenceNo;
    if (patch.qrContent !== undefined) updates.qrContent = patch.qrContent;
    if (patch.qrUrl !== undefined) updates.qrUrl = patch.qrUrl;
    if (patch.payer !== undefined) updates.payer = patch.payer;
    if (patch.description !== undefined) updates.description = patch.description;
    if (patch.refundedAmount !== undefined) updates.refundedAmount = patch.refundedAmount;
    if (patch.customerName !== undefined) updates.customerName = patch.customerName;

    let history = current.history;
    if (patch.status) {
      history = [...history, { status: patch.status, at: now, note: note || '' }];
      updates.history = history;
    }

    await row.update(updates);
    const result = rowToTxn(await Model.findOne({ where: { partnerReferenceNo } }));

    if (!silent && (changed || patch.status)) {
      store.emit('transaction:updated', result);
    }
    return result;
  }

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

export async function stats() {
  if (usingDb()) {
    const Model = getTransactionModel();
    const rows = await Model.findAll({
      attributes: ['status', 'amountValue', 'refundedAmount', 'currency'],
    });
    const byStatus = rows.reduce((acc, r) => {
      const s = r.get('status');
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const successValue = rows
      .filter((r) => ['SUCCESS', 'REFUNDED'].includes(r.get('status')))
      .reduce((sum, r) => sum + Number(r.get('amountValue') || 0), 0);
    const refundedValue = rows.reduce((sum, r) => sum + Number(r.get('refundedAmount') || 0), 0);
    return {
      total: rows.length,
      byStatus,
      successValue,
      refundedValue,
      currency: rows[0]?.get('currency') || 'IDR',
      backend: getSequelize().getDialect(),
    };
  }

  const all = [...transactions.values()];
  const byStatus = all.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const successValue = all
    .filter((t) => ['SUCCESS', 'REFUNDED'].includes(t.status))
    .reduce((sum, t) => sum + (Number(t.amount?.value) || 0), 0);
  const refundedValue = all.reduce((sum, t) => sum + (Number(t.refundedAmount) || 0), 0);
  return {
    total: all.length,
    byStatus,
    successValue,
    refundedValue,
    currency: all[0]?.amount?.currency || 'IDR',
    backend: 'memory',
  };
}

/** Clear all data — used by tests. */
export async function _reset() {
  if (usingDb()) {
    const Model = getTransactionModel();
    await Model.destroy({ where: {}, truncate: true });
    return;
  }
  transactions.clear();
}
