import { beforeEach, describe, expect, it } from 'vitest';
import * as store from '../src/store/transactions.js';

const baseInput = (ref, value = 10000) => ({
  partnerReferenceNo: ref,
  amount: { value, currency: 'IDR' },
  description: 'test',
});

describe('transaction store (in-memory backend)', () => {
  beforeEach(async () => {
    await store._reset();
  });

  it('creates a PENDING transaction with history', async () => {
    const txn = await store.createTransaction(baseInput('PRN-1'));
    expect(txn.status).toBe('PENDING');
    expect(txn.amount.value).toBe(10000);
    expect(txn.history).toHaveLength(1);
    expect(txn.qrContent).toBeNull();
  });

  it('does not emit a created event by default (silent)', async () => {
    let emitted = false;
    const handler = () => {
      emitted = true;
    };
    store.store.on('transaction:created', handler);
    await store.createTransaction(baseInput('PRN-2'));
    expect(emitted).toBe(false);
    store.store.off('transaction:created', handler);
  });

  it('emits created only via emitCreated', async () => {
    const seen = [];
    const handler = (t) => seen.push(t.partnerReferenceNo);
    store.store.on('transaction:created', handler);
    await store.createTransaction(baseInput('PRN-3'));
    await store.emitCreated('PRN-3');
    expect(seen).toEqual(['PRN-3']);
    store.store.off('transaction:created', handler);
  });

  it('updates fields and emits an update event', async () => {
    await store.createTransaction(baseInput('PRN-4'));
    const seen = [];
    const handler = (t) => seen.push(t.status);
    store.store.on('transaction:updated', handler);
    const updated = await store.updateTransaction('PRN-4', { qrContent: 'QR' }, 'qr attached');
    expect(updated.qrContent).toBe('QR');
    expect(seen).toContain('PENDING');
    store.store.off('transaction:updated', handler);
  });

  it('appends history on status change', async () => {
    await store.createTransaction(baseInput('PRN-5'));
    await store.updateTransaction('PRN-5', { status: 'SUCCESS' }, 'paid');
    const txn = await store.getTransaction('PRN-5');
    expect(txn.status).toBe('SUCCESS');
    expect(txn.history.map((h) => h.status)).toEqual(['PENDING', 'SUCCESS']);
  });

  it('returns null when updating a missing transaction', async () => {
    expect(await store.updateTransaction('NOPE', { status: 'FAILED' })).toBeNull();
  });

  it('lists transactions newest-first and filters by status', async () => {
    await store.createTransaction(baseInput('PRN-A'));
    await new Promise((r) => setTimeout(r, 5));
    await store.createTransaction(baseInput('PRN-B'));
    await store.updateTransaction('PRN-A', { status: 'SUCCESS' });

    const all = await store.listTransactions();
    expect(all.map((t) => t.partnerReferenceNo)).toEqual(['PRN-B', 'PRN-A']);

    const success = await store.listTransactions({ status: 'SUCCESS' });
    expect(success).toHaveLength(1);
    expect(success[0].partnerReferenceNo).toBe('PRN-A');
  });

  it('computes aggregate stats', async () => {
    await store.createTransaction(baseInput('PRN-S1', 5000));
    await store.createTransaction(baseInput('PRN-S2', 20000));
    await store.updateTransaction('PRN-S1', { status: 'SUCCESS' });

    const s = await store.stats();
    expect(s.total).toBe(2);
    expect(s.byStatus.SUCCESS).toBe(1);
    expect(s.byStatus.PENDING).toBe(1);
    expect(s.successValue).toBe(5000);
    expect(s.backend).toBe('memory');
  });
});
