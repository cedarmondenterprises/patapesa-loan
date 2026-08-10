import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { KYCService } from '../services/kyc.service';
import { sendResponse, sendErrorResponse } from '../utils/helpers';
import logger from '../utils/logger';

export class KYCController {
  static async submitKYC(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        return sendErrorResponse(res, 401, 'UNAUTHORIZED', 'User not authenticated');
      }

      const { idType, idNumber, idDocumentUrl, idExpiryDate } = req.body;

      if (!idType || !idNumber || !idDocumentUrl) {
        return sendErrorResponse(res, 400, 'MISSING_FIELDS', 'Missing required fields');
      }

      const kyc = await KYCService.submitKYC(req.userId, idType, idNumber, idDocumentUrl, idExpiryDate);
      return sendResponse(res, 201, true, 'KYC submitted successfully', kyc);
    } catch (error) {
      logger.error('Submit KYC error:', error);
      return sendErrorResponse(res, 500, 'KYC_ERROR', 'Failed to submit KYC');
    }
  }

  static async getKYC(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        return sendErrorResponse(res, 401, 'UNAUTHORIZED', 'User not authenticated');
      }

      const kyc = await KYCService.getKYCByUserId(req.userId);
      if (!kyc) {
        return sendErrorResponse(res, 404, 'KYC_NOT_FOUND', 'KYC record not found');
      }

      return sendResponse(res, 200, true, 'KYC retrieved successfully', kyc);
    } catch (error) {
      logger.error('Get KYC error:', error);
      return sendErrorResponse(res, 500, 'FETCH_ERROR', 'Failed to fetch KYC');
    }
  }

  static async approveKYC(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId || req.userRole !== 'ADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Insufficient permissions');
      }

      const { kycId } = req.body;

      if (!kycId) {
        return sendErrorResponse(res, 400, 'MISSING_FIELDS', 'KYC ID is required');
      }

      const kyc = await KYCService.approveKYC(kycId, req.userId);
      return sendResponse(res, 200, true, 'KYC approved successfully', kyc);
    } catch (error) {
      logger.error('Approve KYC error:', error);
      return sendErrorResponse(res, 500, 'APPROVAL_ERROR', 'Failed to approve KYC');
    }
  }

  static async rejectKYC(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId || req.userRole !== 'ADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Insufficient permissions');
      }

      const { kycId, rejectionReason } = req.body;

      if (!kycId || !rejectionReason) {
        return sendErrorResponse(res, 400, 'MISSING_FIELDS', 'Missing required fields');
      }

      const kyc = await KYCService.rejectKYC(kycId, rejectionReason, req.userId);
      return sendResponse(res, 200, true, 'KYC rejected successfully', kyc);
    } catch (error) {
      logger.error('Reject KYC error:', error);
      return sendErrorResponse(res, 500, 'REJECTION_ERROR', 'Failed to reject KYC');
    }
  }

  static async uploadDocument(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        return sendErrorResponse(res, 401, 'UNAUTHORIZED', 'User not authenticated');
      }

      const { kycId, documentType, documentUrl, mimeType } = req.body;

      if (!kycId || !documentType || !documentUrl) {
        return sendErrorResponse(res, 400, 'MISSING_FIELDS', 'Missing required fields');
      }

      const document = await KYCService.uploadKYCDocument(kycId, documentType, documentUrl, mimeType);
      return sendResponse(res, 201, true, 'Document uploaded successfully', document);
    } catch (error) {
      logger.error('Upload document error:', error);
      return sendErrorResponse(res, 500, 'UPLOAD_ERROR', 'Failed to upload document');
    }
  }
}