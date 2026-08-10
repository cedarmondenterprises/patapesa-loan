import { Router } from 'express';
import { LoanController } from '../controllers/loan.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest, validateLoanApplication } from '../middleware/validation';

const router = Router();

// User routes
router.post('/apply', authenticate, validateLoanApplication, validateRequest, LoanController.applyForLoan);
router.get('/applications', authenticate, LoanController.getApplications);
router.get('/loans', authenticate, LoanController.getLoans);

// Admin routes
router.post('/approve', authenticate, authorize(['ADMIN']), LoanController.approveLoan);
router.post('/reject', authenticate, authorize(['ADMIN']), LoanController.rejectLoan);
router.post('/disburse', authenticate, authorize(['ADMIN']), LoanController.disburseLoan);

export default router;