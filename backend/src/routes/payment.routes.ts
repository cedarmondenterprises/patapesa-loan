import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest, validatePayment } from '../middleware/validation';

const router = Router();

// User routes
router.post('/record', authenticate, validatePayment, validateRequest, PaymentController.recordPayment);
router.get('/history', authenticate, PaymentController.getPaymentHistory);

// Admin routes
router.post('/confirm', authenticate, authorize(['ADMIN']), validateRequest, PaymentController.confirmPayment);

export default router;