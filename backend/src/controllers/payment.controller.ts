import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PaymentService } from '../services/payment.service';
import { sendResponse, sendErrorResponse } from '../utils/helpers';
import logger from '../utils/logger';

export class PaymentController {
  static async recordPayment(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        return sendErrorResponse(res, 401, 'UNAUTHORIZED', 'User not authenticated');
      }

      const { loanId, paymentAmount, paymentMethod, transactionReference } = req.body;

      if (!loanId || !paymentAmount || !paymentMethod) {
        return sendErrorResponse(res, 400, 'MISSING_FIELDS', 'Missing required fields');
      }

      const payment = await PaymentService.recordPayment(
        loanId,
        req.userId,
        paymentAmount,
        paymentMethod,
        transactionReference,
      );

      return sendResponse(res, 201, true, 'Payment recorded successfully', payment);
    } catch (error) {
      logger.error('Record payment error:', error);
      return sendErrorResponse(res, 500, 'PAYMENT_ERROR', 'Failed to record payment');
    }
  }

  static async confirmPayment(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId || req.userRole !== 'ADMIN') {
        return sendErrorResponse(res, 403, 'FORBIDDEN', 'Insufficient permissions');
      }

      const { paymentId } = req.body;

      if (!paymentId) {
        return sendErrorResponse(res, 400, 'MISSING_FIELDS', 'Payment ID is required');
      }

      const payment = await PaymentService.confirmPayment(paymentId);
      return sendResponse(res, 200, true, 'Payment confirmed successfully', payment);
    } catch (error) {
      logger.error('Confirm payment error:', error);
      return sendErrorResponse(res, 500, 'CONFIRMATION_ERROR', 'Failed to confirm payment');
    }
  }

  static async getPaymentHistory(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        return sendErrorResponse(res, 401, 'UNAUTHORIZED', 'User not authenticated');
      }

      const payments = await PaymentService.getPaymentsByUserId(req.userId);
      return sendResponse(res, 200, true, 'Payment history retrieved successfully', payments);
    } catch (error) {
      logger.error('Get payment history error:', error);
      return sendErrorResponse(res, 500, 'FETCH_ERROR', 'Failed to fetch payment history');
    }
  }
}