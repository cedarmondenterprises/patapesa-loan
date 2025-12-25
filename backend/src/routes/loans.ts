import { Router } from 'express';
import * as loansController from '../controllers/loans';
import { authenticate, authorize, requireKYCApproved } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/products', loansController.getLoanProducts);

// Customer routes (requires authentication and KYC)
router.post(
  '/apply',
  authenticate,
  requireKYCApproved,
  loansController.applyForLoan
);

router.get('/my-loans', authenticate, loansController.getUserLoans);

router.get('/:id', authenticate, loansController.getLoanById);

router.get('/:id/repayments', authenticate, loansController.getLoanRepayments);

router.post('/:id/repay', authenticate, loansController.makeRepayment);

// Admin routes
router.get(
  '/',
  authenticate,
  authorize('admin', 'super_admin'),
  loansController.getAllLoans
);

router.post(
  '/:id/approve',
  authenticate,
  authorize('admin', 'super_admin'),
  loansController.approveLoan
);

router.post(
  '/:id/reject',
  authenticate,
  authorize('admin', 'super_admin'),
  loansController.rejectLoan
);

router.post(
  '/:id/disburse',
  authenticate,
  authorize('admin', 'super_admin'),
  loansController.disburseLoan
);

export default router;
