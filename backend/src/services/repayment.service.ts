import { query } from '../config/database';
import { RepaymentSchedule } from '../types';
import logger from '../utils/logger';

export class RepaymentScheduleService {
  static async generateRepaymentSchedule(
    loanId: string,
    principalAmount: number,
    interestRate: number,
    loanTerm: number,
    startDate: Date = new Date(),
  ): Promise<RepaymentSchedule[]> {
    try {
      const monthlyRate = interestRate / 100 / 12;
      const monthlyPayment = (
        (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) /
        (Math.pow(1 + monthlyRate, loanTerm) - 1)
      ).toFixed(2);

      let remainingBalance = principalAmount;
      const schedules: RepaymentSchedule[] = [];

      for (let i = 1; i <= loanTerm; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const interestAmount = parseFloat((remainingBalance * monthlyRate).toFixed(2));
        const principalPayment = parseFloat((parseFloat(monthlyPayment as any) - interestAmount).toFixed(2));
        remainingBalance -= principalPayment;

        const result = await query(
          `INSERT INTO repayment_schedules (loan_id, sequence_number, due_date, principal_amount, interest_amount, total_due, amount_paid, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, 0, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING *`,
          [loanId, i, dueDate, principalPayment, interestAmount, monthlyPayment],
        );

        schedules.push(result.rows[0]);
      }

      return schedules;
    } catch (error) {
      logger.error('Error generating repayment schedule:', error);
      throw error;
    }
  }

  static async getRepaymentScheduleByLoanId(loanId: string): Promise<RepaymentSchedule[]> {
    try {
      const result = await query('SELECT * FROM repayment_schedules WHERE loan_id = $1 ORDER BY sequence_number ASC', [loanId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting repayment schedule:', error);
      throw error;
    }
  }

  static async updateRepaymentStatus(scheduleId: string, status: string, paidDate?: Date): Promise<RepaymentSchedule> {
    try {
      const result = await query(
        `UPDATE repayment_schedules
         SET status = $1, paid_date = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [status, paidDate, scheduleId],
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating repayment status:', error);
      throw error;
    }
  }
}