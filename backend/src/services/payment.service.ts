import { query } from '../config/database';
import { Payment } from '../types';
import logger from '../utils/logger';

export class PaymentService {
  static async recordPayment(
    loanId: string,
    userId: string,
    paymentAmount: number,
    paymentMethod: string,
    transactionReference?: string,
  ): Promise<Payment> {
    try {
      const result = await query(
        `INSERT INTO payments (loan_id, user_id, payment_amount, currency, payment_method, transaction_reference, payment_status, payment_date, created_at, updated_at)
         VALUES ($1, $2, $3, 'KES', $4, $5, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [loanId, userId, paymentAmount, paymentMethod, transactionReference],
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording payment:', error);
      throw error;
    }
  }

  static async confirmPayment(paymentId: string): Promise<Payment> {
    try {
      const result = await query(
        `UPDATE payments
         SET payment_status = 'COMPLETED', confirmed_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [paymentId],
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error confirming payment:', error);
      throw error;
    }
  }

  static async failPayment(paymentId: string, failureReason: string): Promise<Payment> {
    try {
      const result = await query(
        `UPDATE payments
         SET payment_status = 'FAILED', failure_reason = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [failureReason, paymentId],
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error failing payment:', error);
      throw error;
    }
  }

  static async getPaymentsByLoanId(loanId: string): Promise<Payment[]> {
    try {
      const result = await query('SELECT * FROM payments WHERE loan_id = $1 ORDER BY payment_date DESC', [loanId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting loan payments:', error);
      throw error;
    }
  }

  static async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    try {
      const result = await query('SELECT * FROM payments WHERE user_id = $1 ORDER BY payment_date DESC', [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user payments:', error);
      throw error;
    }
  }
}