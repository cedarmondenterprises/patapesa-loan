import { Router } from 'express';
import * as kycController from '../controllers/kyc';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Customer routes
router.post('/documents', authenticate, kycController.submitKYCDocument);

router.get('/documents', authenticate, kycController.getUserKYCDocuments);

router.get('/status', authenticate, kycController.getUserKYCStatus);

router.post('/upload', authenticate, kycController.uploadDocument);

// Admin routes
router.get(
  '/pending',
  authenticate,
  authorize('admin', 'super_admin'),
  kycController.getPendingKYCDocuments
);

router.get(
  '/documents/:id',
  authenticate,
  authorize('admin', 'super_admin'),
  kycController.getKYCDocumentById
);

router.post(
  '/documents/:id/verify',
  authenticate,
  authorize('admin', 'super_admin'),
  kycController.verifyKYCDocument
);

router.post(
  '/documents/:id/reject',
  authenticate,
  authorize('admin', 'super_admin'),
  kycController.rejectKYCDocument
);

export default router;
