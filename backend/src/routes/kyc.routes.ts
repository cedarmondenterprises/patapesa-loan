import { Router } from 'express';
import { KYCController } from '../controllers/kyc.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// User routes
router.post('/submit', authenticate, validateRequest, KYCController.submitKYC);
router.get('/', authenticate, KYCController.getKYC);
router.post('/upload', authenticate, validateRequest, KYCController.uploadDocument);

// Admin routes
router.post('/approve', authenticate, authorize(['ADMIN']), validateRequest, KYCController.approveKYC);
router.post('/reject', authenticate, authorize(['ADMIN']), validateRequest, KYCController.rejectKYC);

export default router;