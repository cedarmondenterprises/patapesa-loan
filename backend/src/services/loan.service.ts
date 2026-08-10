import { query } from '../config/database';
import { LoanApplication, Loan } from '../types';
import { calculateMonthlyPayment, calculateTotalInterest } from '../utils/helpers';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class LoanService {
  static async createLoanApplication(
    userId: string,
    productId: string,
    loanAmount: number,
    loanTerm: number,
    purpose: string,
    currency: string = 'KES',
  ): Promise<LoanApplication> {
    try {
      const applicationNumber = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const result = await query(
        `INSERT INTO loan_applications (user_id, product_id, application_number, loan_amount, currency, loan_term, purpose, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, productId, applicationNumber, loanAmount, currency, loanTerm, purpose],
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating loan application:', error);
      throw error;
    }
  }

  static async getLoanApplicationById(applicationId: string): Promise<LoanApplication | null> {
    try {
      const result = await query('SELECT * FROM loan_applications WHERE id = $1', [applicationId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting loan application:', error);
      throw error;
    }
  }

  static async getUserLoanApplications(userId: string): Promise<LoanApplication[]> {
    try {
      const result = await query('SELECT * FROM loan_applications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user loan applications:', error);
      throw error;
    }
  }

  static async approveLoanApplication(
    applicationId: string,
    interestRate: number,
    processingFee: number,
    reviewedBy: string,
  ): Promise<LoanApplication> {
    try {
      const app = await this.getLoanApplicationById(applicationId);
      if (!app) throw new Error('Loan application not found');

      const totalAmountPayable = app.loanAmount + processingFee + calculateTotalInterest(app.loanAmount, calculateMonthlyPayment(app.loanAmount, interestRate, app.loanTerm), app.loanTerm);
      const monthlyPayment = calculateMonthlyPayment(app.loanAmount, interestRate, app.loanTerm);

      const result = await query(
        `UPDATE loan_applications
         SET status = 'APPROVED', interest_rate = $1, processing_fee = $2, total_amount_payable = $3, monthly_payment = $4, approval_date = CURRENT_TIMESTAMP, reviewed_by = $5, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [interestRate, processingFee, totalAmountPayable, monthlyPayment, reviewedBy, applicationId],
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error approving loan application:', error);
      throw error;
    }
  }

  static async rejectLoanApplication(applicationId: string, rejectionReason: string, reviewedBy: string): Promise<LoanApplication> {
    try {
      const result = await query(
        `UPDATE loan_applications
         SET status = 'REJECTED', rejection_reason = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [rejectionReason, reviewedBy, applicationId],
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error rejecting loan application:', error);
      throw error;
    }
  }

  static async disburseLoan(applicationId: string): Promise<Loan> {
    try {
      const app = await this.getLoanApplicationById(applicationId);
      if (!app) throw new Error('Loan application not found');
      if (app.status !== 'APPROVED') throw new Error('Loan application must be approved first');

      const loanNumber = `LN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const totalInterest = calculateTotalInterest(
        app.loanAmount,
        calculateMonthlyPayment(app.loanAmount, app.interestRate!, app.loanTerm),
        app.loanTerm,
      );
      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + app.loanTerm);

      const loanResult = await query(
        `INSERT INTO loans (application_id, user_id, loan_number, principal_amount, total_interest, total_amount_payable, currency, interest_rate, loan_term, payment_frequency, next_payment_date, status, disbursement_date, maturity_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'MONTHLY', CURRENT_TIMESTAMP + INTERVAL '1 month', 'ACTIVE', CURRENT_TIMESTAMP, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [applicationId, app.user_id, loanNumber, app.loanAmount, totalInterest, app.total_amount_payable, app.currency, app.interest_rate, app.loanTerm, maturityDate],
      );

      await query(
        'UPDATE loan_applications SET status = $1, disbursement_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['DISBURSED', applicationId],
      );

      return loanResult.rows[0];
    } catch (error) {
      logger.error('Error disbursing loan:', error);
      throw error;
    }
  }

  static async getLoanById(loanId: string): Promise<Loan | null> {
    try {
      const result = await query('SELECT * FROM loans WHERE id = $1', [loanId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting loan:', error);
      throw error;
    }
  }

  static async getUserLoans(userId: string): Promise<Loan[]> {
    try {
      const result = await query('SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user loans:', error);
      throw error;
    }
  }
}