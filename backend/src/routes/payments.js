import { Router } from 'express';
import {
  cancelPayment,
  createPayment,
  getPayment,
  getPaymentQr,
  listPayments,
  paymentStats,
  queryPayment,
  refundPayment,
  simulatePayment,
} from '../controllers/paymentController.js';

const router = Router();

// NOTE: /stats must be declared before /:ref so it isn't treated as an id.
router.get('/stats', paymentStats);
router.get('/', listPayments);
router.post('/', createPayment);
router.get('/:ref', getPayment);
router.get('/:ref/qr.svg', getPaymentQr);
router.post('/:ref/query', queryPayment);
router.post('/:ref/cancel', cancelPayment);
router.post('/:ref/refund', refundPayment);
router.post('/:ref/simulate', simulatePayment); // experiment-only

export default router;
