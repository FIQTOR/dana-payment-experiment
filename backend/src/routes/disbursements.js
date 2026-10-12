import { Router } from 'express';
import {
  createDisbursement,
  inquireBankAccount,
} from '../controllers/disbursementController.js';

const router = Router();

router.post('/', createDisbursement);
router.post('/inquiry', inquireBankAccount);

export default router;
