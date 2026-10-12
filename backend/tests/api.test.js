import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import * as store from '../src/store/transactions.js';

/** Helper: create a payment and return its data. */
async function createPayment(body = { amount: 25000, description: 'test' }) {
  const res = await request(app).post('/api/payments').send(body);
  return res;
}

describe('API integration (mock mode)', () => {
  beforeEach(async () => {
    await store._reset();
  });

  it('GET / returns the service descriptor', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toMatch(/DANA/);
    expect(res.body.mode).toBe('mock');
  });

  it('GET /api/webhooks/config reports setup status', async () => {
    const res = await request(app).get('/api/webhooks/config');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('mockMode', true);
    expect(res.body.data).toHaveProperty('storage');
  });

  describe('POST /api/payments', () => {
    it('creates a PENDING payment with a QR image', async () => {
      const res = await createPayment();
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.qrContent).toBeTruthy();
      expect(res.body.data.qrImage).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(res.body.data.partnerReferenceNo).toMatch(/^PRN-/);
    });

    it('rejects invalid amounts with 400', async () => {
      const res = await request(app).post('/api/payments').send({ amount: -10 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('rejects a missing amount with 400', async () => {
      const res = await request(app).post('/api/payments').send({ description: 'x' });
      expect(res.status).toBe(400);
    });
  });

  describe('transaction retrieval', () => {
    it('GET /api/payments lists transactions', async () => {
      await createPayment();
      const res = await request(app).get('/api/payments');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /api/payments/:ref returns one transaction', async () => {
      const created = await createPayment();
      const ref = created.body.data.partnerReferenceNo;
      const res = await request(app).get(`/api/payments/${ref}`);
      expect(res.status).toBe(200);
      expect(res.body.data.partnerReferenceNo).toBe(ref);
    });

    it('GET /api/payments/:ref returns 404 for unknown refs', async () => {
      const res = await request(app).get('/api/payments/NOPE');
      expect(res.status).toBe(404);
    });

    it('GET /api/payments/:ref/qr.svg returns an SVG image', async () => {
      const created = await createPayment();
      const ref = created.body.data.partnerReferenceNo;
      const res = await request(app).get(`/api/payments/${ref}/qr.svg`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/image\/svg\+xml/);
      const svg = res.text || res.body?.toString('utf8') || '';
      expect(svg).toContain('<svg');
    });

    it('guards against a non-numeric limit', async () => {
      await createPayment();
      const res = await request(app).get('/api/payments?limit=abc');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('state transitions', () => {
    it('simulates a SUCCESS payment', async () => {
      const created = await createPayment();
      const ref = created.body.data.partnerReferenceNo;
      const res = await request(app)
        .post(`/api/payments/${ref}/simulate`)
        .send({ status: 'SUCCESS', payerName: 'Budi' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SUCCESS');
      expect(res.body.data.payer.name).toBe('Budi');
    });

    it('rejects an invalid simulate status', async () => {
      const created = await createPayment();
      const ref = created.body.data.partnerReferenceNo;
      const res = await request(app).post(`/api/payments/${ref}/simulate`).send({ status: 'WAT' });
      expect(res.status).toBe(400);
    });

    it('cancels a PENDING payment', async () => {
      const created = await createPayment();
      const ref = created.body.data.partnerReferenceNo;
      const res = await request(app).post(`/api/payments/${ref}/cancel`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('refuses to cancel a non-PENDING payment (409)', async () => {
      const created = await createPayment();
      const ref = created.body.data.partnerReferenceNo;
      await request(app).post(`/api/payments/${ref}/simulate`).send({ status: 'SUCCESS' });
      const res = await request(app).post(`/api/payments/${ref}/cancel`);
      expect(res.status).toBe(409);
    });

    it('refunds a SUCCESS payment', async () => {
      const created = await createPayment({ amount: 25000 });
      const ref = created.body.data.partnerReferenceNo;
      await request(app).post(`/api/payments/${ref}/simulate`).send({ status: 'SUCCESS' });
      const res = await request(app).post(`/api/payments/${ref}/refund`).send({ reason: 'test' });
      expect(res.status).toBe(200);
      expect(res.body.data.transaction.status).toBe('REFUNDED');
      expect(res.body.data.refund.refundReferenceNo).toMatch(/^RFD-/);
    });

    it('refuses to refund a non-SUCCESS payment (409)', async () => {
      const created = await createPayment();
      const ref = created.body.data.partnerReferenceNo;
      const res = await request(app).post(`/api/payments/${ref}/refund`).send({});
      expect(res.status).toBe(409);
    });

    it('refuses to refund more than the original amount (400)', async () => {
      const created = await createPayment({ amount: 10000 });
      const ref = created.body.data.partnerReferenceNo;
      await request(app).post(`/api/payments/${ref}/simulate`).send({ status: 'SUCCESS' });
      const res = await request(app).post(`/api/payments/${ref}/refund`).send({ amount: 99999 });
      expect(res.status).toBe(400);
    });

    it('supports partial refunds and tracks the refundable balance', async () => {
      const created = await createPayment({ amount: 25000 });
      const ref = created.body.data.partnerReferenceNo;
      await request(app).post(`/api/payments/${ref}/simulate`).send({ status: 'SUCCESS' });

      // First partial refund
      const r1 = await request(app).post(`/api/payments/${ref}/refund`).send({ amount: 10000 });
      expect(r1.status).toBe(200);
      expect(r1.body.data.transaction.status).toBe('SUCCESS'); // still refundable
      expect(r1.body.data.transaction.refundedAmount).toBe(10000);
      expect(r1.body.data.refund.fullyRefunded).toBe(false);
      expect(r1.body.data.refund.refundableRemaining).toBe(15000);

      // Second partial refund of the remainder → fully refunded
      const r2 = await request(app).post(`/api/payments/${ref}/refund`).send({ amount: 15000 });
      expect(r2.status).toBe(200);
      expect(r2.body.data.transaction.status).toBe('REFUNDED');
      expect(r2.body.data.refund.fullyRefunded).toBe(true);

      // A third refund is rejected — nothing left
      const r3 = await request(app).post(`/api/payments/${ref}/refund`).send({ amount: 1 });
      expect(r3.status).toBe(409);
    });

    it('rejects a partial refund larger than the refundable balance (400)', async () => {
      const created = await createPayment({ amount: 20000 });
      const ref = created.body.data.partnerReferenceNo;
      await request(app).post(`/api/payments/${ref}/simulate`).send({ status: 'SUCCESS' });
      await request(app).post(`/api/payments/${ref}/refund`).send({ amount: 15000 });

      const res = await request(app).post(`/api/payments/${ref}/refund`).send({ amount: 10000 });
      expect(res.status).toBe(400);
      expect(res.body.refundable).toBe(5000);
    });
  });

  describe('stats', () => {
    it('GET /api/payments/stats aggregates data', async () => {
      const created = await createPayment({ amount: 15000 });
      const ref = created.body.data.partnerReferenceNo;
      await request(app).post(`/api/payments/${ref}/simulate`).send({ status: 'SUCCESS' });
      const res = await request(app).get('/api/payments/stats');
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.successValue).toBe(15000);
    });
  });

  describe('disbursements', () => {
    it('POST /api/disbursements/inquiry returns an account name', async () => {
      const res = await request(app)
        .post('/api/disbursements/inquiry')
        .send({ bankCode: 'BCA', bankAccountNo: '1234567890' });
      expect(res.status).toBe(200);
      expect(res.body.data.accountName).toBeTruthy();
    });

    it('POST /api/disbursements creates a transfer', async () => {
      const res = await request(app).post('/api/disbursements').send({
        bankCode: 'BCA',
        bankAccountNo: '1234567890',
        beneficiaryName: 'Budi',
        amount: 50000,
      });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.partnerReferenceNo).toMatch(/^DSB-/);
    });

    it('validates the disbursement payload', async () => {
      const res = await request(app).post('/api/disbursements').send({ bankCode: 'B' });
      expect(res.status).toBe(400);
    });
  });

  describe('webhooks', () => {
    it('acknowledges a DANA notification', async () => {
      const res = await request(app)
        .post('/api/webhooks/dana')
        .send({ partnerReferenceNo: 'X', latestTransactionStatus: 'SUCCESS' });
      expect(res.status).toBe(200);
      expect(res.body.responseCode).toBe('2002500');
    });

    it('updates a transaction from a webhook', async () => {
      const created = await createPayment();
      const ref = created.body.data.partnerReferenceNo;
      await request(app)
        .post('/api/webhooks/dana')
        .send({ partnerReferenceNo: ref, latestTransactionStatus: 'SUCCESS' });
      const res = await request(app).get(`/api/payments/${ref}`);
      expect(res.body.data.status).toBe('SUCCESS');
    });

    it('acknowledges a disbursement notification', async () => {
      const res = await request(app)
        .post('/api/webhooks/disburse')
        .send({ partnerReferenceNo: 'DSB-1', latestTransactionStatus: 'SUCCESS' });
      expect(res.status).toBe(200);
      expect(res.body.responseCode).toBe('2002500');
    });
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
