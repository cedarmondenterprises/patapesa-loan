import { query, transaction } from '../config/database';
import { Loan, LoanApplicationRequest, LoanProduct, LoanWithDetails } from '../types';
import { AppError } from '../middleware/errorHandler';
import {
  calculateMonthlyPayment,
  calculateProcessingFee,
  calculateAmortizationSchedule,
  generateLoanNumber,
  calculateCreditScore,
  determineRiskRating,
} from '../utils/helpers';
import { PoolClient } from 'pg';

// Get all loan products
export const getLoanProducts = async (): Promise<LoanProduct[]> => {
  const result = await query(
    `SELECT id, name, description, min_amount, max_amount, interest_rate,
            min_term_months, max_term_months, processing_fee_rate, late_payment_fee,
            required_kyc_level, is_active, created_at, updated_at
     FROM loan_products
     WHERE is_active = true
     ORDER BY min_amount ASC`
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    minAmount: parseFloat(row.min_amount),
    maxAmount: parseFloat(row.max_amount),
    interestRate: parseFloat(row.interest_rate),
    minTermMonths: row.min_term_months,
    maxTermMonths: row.max_term_months,
    processingFeeRate: parseFloat(row.processing_fee_rate),
    latePaymentFee: parseFloat(row.late_payment_fee),
    requiredKycLevel: row.required_kyc_level,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

// Apply for a loan
export const applyForLoan = async (
  userId: string,
  data: LoanApplicationRequest
): Promise<Loan> => {
  return transaction(async (client: PoolClient) => {
    // Get loan product
    const productResult = await client.query(
      'SELECT * FROM loan_products WHERE id = $1 AND is_active = true',
      [data.productId]
    );

    if (productResult.rows.length === 0) {
      throw new AppError('Loan product not found', 404);
    }

    const product = productResult.rows[0];

    // Validate loan amount
    if (data.amount < parseFloat(product.min_amount) || data.amount > parseFloat(product.max_amount)) {
      throw new AppError(
        `Loan amount must be between ${product.min_amount} and ${product.max_amount}`,
        400
      );
    }

    // Validate loan term
    if (data.termMonths < product.min_term_months || data.termMonths > product.max_term_months) {
      throw new AppError(
        `Loan term must be between ${product.min_term_months} and ${product.max_term_months} months`,
        400
      );
    }

    // Check user KYC status
    const userResult = await client.query(
      'SELECT kyc_status FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    if (userResult.rows[0].kyc_status !== 'approved') {
      throw new AppError('KYC verification required before applying for a loan', 403);
    }

    // Check for existing active loans
    const existingLoans = await client.query(
      `SELECT COUNT(*) as count FROM loans 
       WHERE user_id = $1 AND status IN ('pending', 'approved', 'disbursed', 'active')`,
      [userId]
    );

    if (parseInt(existingLoans.rows[0].count) > 0) {
      throw new AppError('You already have an active loan application or loan', 409);
    }

    // Get user profile for credit scoring
    const profileResult = await client.query(
      'SELECT monthly_income FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    const monthlyIncome = profileResult.rows[0]?.monthly_income || 0;

    // Calculate credit score
    const creditScore = calculateCreditScore({
      monthlyIncome: parseFloat(monthlyIncome),
      loanAmount: data.amount,
      existingLoans: 0,
    });

    const riskRating = determineRiskRating(creditScore);

    // Calculate loan details
    const interestRate = parseFloat(product.interest_rate);
    const processingFeeRate = parseFloat(product.processing_fee_rate);
    const processingFee = calculateProcessingFee(data.amount, processingFeeRate);
    const monthlyPayment = calculateMonthlyPayment(data.amount, interestRate, data.termMonths);
    const totalAmount = monthlyPayment * data.termMonths + processingFee;
    const loanNumber = generateLoanNumber();

    // Create loan application
    const loanResult = await client.query(
      `INSERT INTO loans (
        loan_number, user_id, product_id, principal_amount, interest_rate,
        processing_fee, total_amount, term_months, monthly_payment,
        outstanding_balance, status, purpose, credit_score, risk_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        loanNumber, userId, data.productId, data.amount, interestRate,
        processingFee, totalAmount, data.termMonths, monthlyPayment,
        totalAmount, 'pending', data.purpose, creditScore, riskRating,
      ]
    );

    const loan = loanResult.rows[0];

    return {
      id: loan.id,
      loanNumber: loan.loan_number,
      userId: loan.user_id,
      productId: loan.product_id,
      principalAmount: parseFloat(loan.principal_amount),
      interestRate: parseFloat(loan.interest_rate),
      processingFee: parseFloat(loan.processing_fee),
      totalAmount: parseFloat(loan.total_amount),
      termMonths: loan.term_months,
      monthlyPayment: parseFloat(loan.monthly_payment),
      outstandingBalance: parseFloat(loan.outstanding_balance),
      status: loan.status,
      applicationDate: loan.application_date,
      purpose: loan.purpose,
      creditScore: loan.credit_score,
      riskRating: loan.risk_rating,
      createdAt: loan.created_at,
      updatedAt: loan.updated_at,
    };
  });
};

// Get user loans
export const getUserLoans = async (userId: string): Promise<Loan[]> => {
  const result = await query(
    `SELECT * FROM loans 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    loanNumber: row.loan_number,
    userId: row.user_id,
    productId: row.product_id,
    principalAmount: parseFloat(row.principal_amount),
    interestRate: parseFloat(row.interest_rate),
    processingFee: parseFloat(row.processing_fee),
    totalAmount: parseFloat(row.total_amount),
    termMonths: row.term_months,
    monthlyPayment: parseFloat(row.monthly_payment),
    outstandingBalance: parseFloat(row.outstanding_balance),
    status: row.status,
    applicationDate: row.application_date,
    approvalDate: row.approval_date,
    disbursementDate: row.disbursement_date,
    purpose: row.purpose,
    creditScore: row.credit_score,
    riskRating: row.risk_rating,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

// Get loan by ID
export const getLoanById = async (loanId: string, userId?: string): Promise<LoanWithDetails> => {
  const params = userId ? [loanId, userId] : [loanId];
  const userCondition = userId ? 'AND user_id = $2' : '';

  const result = await query(
    `SELECT l.*, lp.name as product_name,
            u.first_name, u.last_name, u.email, u.phone
     FROM loans l
     JOIN loan_products lp ON l.product_id = lp.id
     JOIN users u ON l.user_id = u.id
     WHERE l.id = $1 ${userCondition}`,
    params
  );

  if (result.rows.length === 0) {
    throw new AppError('Loan not found', 404);
  }

  return result.rows[0];
};

// Approve loan
export const approveLoan = async (loanId: string, approvedBy: string): Promise<Loan> => {
  return transaction(async (client: PoolClient) => {
    const result = await client.query(
      `UPDATE loans SET 
        status = 'approved',
        approval_date = CURRENT_TIMESTAMP,
        approved_by = $2
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [loanId, approvedBy]
    );

    if (result.rows.length === 0) {
      throw new AppError('Loan not found or already processed', 404);
    }

    return result.rows[0];
  });
};

// Reject loan
export const rejectLoan = async (
  loanId: string,
  approvedBy: string,
  reason: string
): Promise<Loan> => {
  const result = await query(
    `UPDATE loans SET 
      status = 'rejected',
      approval_date = CURRENT_TIMESTAMP,
      approved_by = $2,
      rejection_reason = $3
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [loanId, approvedBy, reason]
  );

  if (result.rows.length === 0) {
    throw new AppError('Loan not found or already processed', 404);
  }

  return result.rows[0];
};

// Disburse loan
export const disburseLoan = async (
  loanId: string,
  method: 'bank_transfer' | 'mobile_money' | 'cash',
  reference: string
): Promise<Loan> => {
  return transaction(async (client: PoolClient) => {
    const loanResult = await client.query(
      'SELECT * FROM loans WHERE id = $1 AND status = $2',
      [loanId, 'approved']
    );

    if (loanResult.rows.length === 0) {
      throw new AppError('Loan not found or not approved', 404);
    }

    const loan = loanResult.rows[0];

    // Calculate first payment date (30 days from disbursement)
    const firstPaymentDate = new Date();
    firstPaymentDate.setDate(firstPaymentDate.getDate() + 30);

    // Calculate final payment date
    const finalPaymentDate = new Date(firstPaymentDate);
    finalPaymentDate.setMonth(finalPaymentDate.getMonth() + loan.term_months - 1);

    // Update loan
    const updateResult = await client.query(
      `UPDATE loans SET 
        status = 'active',
        disbursement_date = CURRENT_TIMESTAMP,
        disbursement_method = $2,
        disbursement_reference = $3,
        first_payment_date = $4,
        final_payment_date = $5
       WHERE id = $1
       RETURNING *`,
      [loanId, method, reference, firstPaymentDate, finalPaymentDate]
    );

    // Create transaction record
    await client.query(
      `INSERT INTO transactions (
        user_id, loan_id, transaction_type, amount, status,
        payment_method, payment_reference, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        loan.user_id,
        loanId,
        'disbursement',
        loan.principal_amount,
        'completed',
        method,
        reference,
        `Loan disbursement for ${loan.loan_number}`,
      ]
    );

    // Generate repayment schedule
    const schedule = calculateAmortizationSchedule(
      parseFloat(loan.principal_amount),
      parseFloat(loan.interest_rate),
      loan.term_months,
      new Date()
    );

    // Insert repayment schedule
    for (const entry of schedule) {
      await client.query(
        `INSERT INTO loan_repayments (
          loan_id, payment_number, due_date, amount_due,
          principal_portion, interest_portion, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          loanId,
          entry.paymentNumber,
          entry.dueDate,
          entry.totalPayment,
          entry.principalPortion,
          entry.interestPortion,
          'pending',
        ]
      );
    }

    return updateResult.rows[0];
  });
};

// Get loan repayments
export const getLoanRepayments = async (loanId: string): Promise<LoanRepayment[]> => {
  const result = await query(
    `SELECT * FROM loan_repayments 
     WHERE loan_id = $1 
     ORDER BY payment_number ASC`,
    [loanId]
  );

  return result.rows;
};

export default {
  getLoanProducts,
  applyForLoan,
  getUserLoans,
  getLoanById,
  approveLoan,
  rejectLoan,
  disburseLoan,
  getLoanRepayments,
};
