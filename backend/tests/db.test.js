/**
 * Verifies the Sequelize/DB code path using an in-memory SQLite database.
 *
 * The app defaults to MySQL, but Sequelize lets us run the exact same store
 * logic against SQLite in tests — so the DB branch is exercised in CI with no
 * external services.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Must be set BEFORE importing config/store so they pick up the SQLite dialect.
process.env.DB_ENABLED = 'true';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

let store;
let initDb;
let closeDb;
let usingDb;

const input = (ref, value = 10000, extra = {}) => ({
  partnerReferenceNo: ref,
  amount: { value, currency: 'IDR' },
  description: 'sqlite test',
  ...extra,
});

beforeAll(async () => {
  ({ initDb, closeDb } = await import('../src/db/sequelize.js'));
  store = await import('../src/store/transactions.js');
  ({ usingDb } = store);
  await initDb();
});

afterAll(async () => {
  await closeDb();
});

describe('transaction store (SQLite / Sequelize backend)', () => {
  it('reports the DB backend as the active storage', () => {
    expect(usingDb()).toBe(true);
  });

  it('creates, reads and lists transactions', async () => {
    await store._reset();
    await store.createTransaction(input('DB-1', 10000));
    await store.createTransaction(input('DB-2', 20000, { customerName: 'Budi' }));

    const one = await store.getTransaction('DB-1');
    expect(one.amount.value).toBe(10000);
    expect(one.status).toBe('PENDING');
    expect(one.refundedAmount).toBe(0);

    const two = await store.getTransaction('DB-2');
    expect(two.customerName).toBe('Budi');

    const list = await store.listTransactions();
    expect(list.map((t) => t.partnerReferenceNo).sort()).toEqual(['DB-1', 'DB-2']);
  });

  it('updates fields and records status history', async () => {
    const updated = await store.updateTransaction('DB-1', { status: 'SUCCESS' }, 'paid');
    expect(updated.status).toBe('SUCCESS');
    expect(updated.history.map((h) => h.status)).toEqual(['PENDING', 'SUCCESS']);
  });

  it('tracks refundedAmount and computes stats', async () => {
    await store._reset();
    await store.createTransaction(input('DB-R', 25000));
    await store.updateTransaction('DB-R', { status: 'SUCCESS' });
    await store.updateTransaction('DB-R', { refundedAmount: 10000 });

    const txn = await store.getTransaction('DB-R');
    expect(txn.refundedAmount).toBe(10000);

    const s = await store.stats();
    expect(s.backend).toBe('sqlite');
    expect(s.total).toBe(1);
    expect(s.refundedValue).toBe(10000);
  });

  it('returns null when updating a missing transaction', async () => {
    expect(await store.updateTransaction('NOPE', { status: 'FAILED' })).toBeNull();
  });

  it('filters by status', async () => {
    await store._reset();
    await store.createTransaction(input('DB-A'));
    await store.createTransaction(input('DB-B'));
    await store.updateTransaction('DB-A', { status: 'SUCCESS' });

    const success = await store.listTransactions({ status: 'SUCCESS' });
    expect(success).toHaveLength(1);
    expect(success[0].partnerReferenceNo).toBe('DB-A');
  });
});
