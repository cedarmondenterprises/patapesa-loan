import { Router } from 'express';
import authRoutes from './auth.routes';
import loanRoutes from './loan.routes';
import kycRoutes from './kyc.routes';
import paymentRoutes from './payment.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/loans', loanRoutes);
router.use('/kyc', kycRoutes);
router.use('/payments', paymentRoutes);

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;