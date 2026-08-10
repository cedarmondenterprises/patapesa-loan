import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LoanService } from '../services/loan.service';
import { sendResponse, sendErrorResponse } from '../utils/helpers';
import logger from '../utils/logger';

export class LoanController {
  static async applyForLoan(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        return sendErrorResponse(res, 401, 'UNAUTHORIZED', 'User not authenticated');
      }

      const { productId, loanAmount, loanTerm, purpose } = req.body;

      if (!productId || !loanAmount || !loanTerm || !purpose) {
        return sendErrorResponse(res, 400, 'MISSING_FIELDS', 'Missing required fields');
      }

      const application = await LoanService.createLoanApplication(
        req.userId,
        productId,
        loanAmount,
        loanTerm,
        purpose,
      );

      return sendResponse(res, 201, true, 'Loan application submitted successfully', application);
    } catch (error) {
      logger.error('Apply for loan error:', error);
      return sendErrorResponse(res, 500, 'APPLICATION_ERROR', 'Failed to submit loan application');
    }
  }

  static async getApplications(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        return sendErrorResponse(res, 401, 'UNAUTHORIZED', 'User not authenticated');
      }

      const applications = await LoanService.getUserLoanApplications(req.userId);
      return sendResponse(res, 200, true, 'Loan applications retrieved successfully', applications);
    } catch (error) {
      logger.error('Get applications error:', error);
      return sendErrorResponse(res, 500, 'FETCH_ERROR', 'Failed to fetch applications');
    }
  }

  static async getLoans(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        return sendErrorResponse(res, 401, 'UNAUTHORIZED', 'User not authenticated');
      }

      const loans = await LoanService.getUserLoans(req.userId);
      return sendResponse(res, 200, true, 'Loans retrieved successfully', loans);
    } catch (error) {
      logger.error('Get loans error:', error);
      return sendErrorResponse(res, 500, 'FETCH_ERROR', 'Failed to fetch loans');
    }
  }

  static async approveLoan(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId || req.userRole !== 'ADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Insufficient permissions');
      }

      const { applicationId, interestRate, processingFee } = req.body;

      if (!applicationId || !interestRate || processingFee === undefined) {
        return sendErrorResponse(res, 400, 'MISSING_FIELDS', 'Missing required fields');
      }

      const application = await LoanService.approveLoanApplication(applicationId, interestRate, processingFee, req.userId);
      return sendResponse(res, 200, true, 'Loan application approved successfully', application);
    } catch (error) {
      logger.error('Approve loan error:', error);
      return sendErrorResponse(res, 500, 'APPROVAL_ERROR', 'Failed to approve loan');
    }
  }

  static async rejectLoan(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId || req.userRole !== 'ADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Insufficient permissions');
      }

      const { applicationId, rejectionReason } = req.body;

      if (!applicationId || !rejectionReason) {
        return sendErrorResponse(res, 400, 'MISSING_FIELDS', 'Missing required fields');
      }

      const application = await LoanService.rejectLoanApplication(applicationId, rejectionReason, req.userId);
      return sendResponse(res, 200, true, 'Loan application rejected successfully', application);
    } catch (error) {
      logger.error('Reject loan error:', error);
      return sendErrorResponse(res, 500, 'REJECTION_ERROR', 'Failed to reject loan');
    }
  }

  static async disburseLoan(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId || req.userRole !== 'ADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Insufficient permissions');
      }

      const { applicationId } = req.body;

      if (!applicationId) {
        return sendErrorResponse(res, 400, 'MISSING_FIELDS', 'Application ID is required');
      }

      const loan = await LoanService.disburseLoan(applicationId);
      return sendResponse(res, 200, true, 'Loan disbursed successfully', loan);
    } catch (error) {
      logger.error('Disburse loan error:', error);
      return sendErrorResponse(res, 500, 'DISBURSE_ERROR', 'Failed to disburse loan');
    }
  }
}