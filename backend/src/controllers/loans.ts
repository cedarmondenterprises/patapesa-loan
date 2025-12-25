import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as loanService from '../services/loan';
import { validateLoanApplication } from '../utils/validators';
import { ApiResponse } from '../types';

// Get all loan products
export const getLoanProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await loanService.getLoanProducts();

  res.status(200).json({
    success: true,
    data: products,
  } as ApiResponse);
});

// Apply for a loan
export const applyForLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    } as ApiResponse);
    return;
  }

  const { productId, amount, termMonths, purpose } = req.body;

  // Validate input
  const validation = validateLoanApplication({ productId, amount, termMonths, purpose });
  if (!validation.valid) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors,
    } as ApiResponse);
    return;
  }

  const loan = await loanService.applyForLoan(req.user.userId, {
    productId,
    amount: parseFloat(amount),
    termMonths: parseInt(termMonths),
    purpose,
  });

  res.status(201).json({
    success: true,
    message: 'Loan application submitted successfully',
    data: loan,
  } as ApiResponse);
});

// Get user loans
export const getUserLoans = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    } as ApiResponse);
    return;
  }

  const loans = await loanService.getUserLoans(req.user.userId);

  res.status(200).json({
    success: true,
    data: loans,
  } as ApiResponse);
});

// Get loan by ID
export const getLoanById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.role === 'customer' ? req.user.userId : undefined;

  const loan = await loanService.getLoanById(id, userId);

  res.status(200).json({
    success: true,
    data: loan,
  } as ApiResponse);
});

// Get all loans (admin only)
export const getAllLoans = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement pagination and filters
  res.status(200).json({
    success: true,
    message: 'Get all loans endpoint (to be implemented with pagination)',
  } as ApiResponse);
});

// Approve loan (admin only)
export const approveLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    } as ApiResponse);
    return;
  }

  const { id } = req.params;

  const loan = await loanService.approveLoan(id, req.user.userId);

  res.status(200).json({
    success: true,
    message: 'Loan approved successfully',
    data: loan,
  } as ApiResponse);
});

// Reject loan (admin only)
export const rejectLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    } as ApiResponse);
    return;
  }

  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    res.status(400).json({
      success: false,
      message: 'Rejection reason is required',
    } as ApiResponse);
    return;
  }

  const loan = await loanService.rejectLoan(id, req.user.userId, reason);

  res.status(200).json({
    success: true,
    message: 'Loan rejected successfully',
    data: loan,
  } as ApiResponse);
});

// Disburse loan (admin only)
export const disburseLoan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { method, reference } = req.body;

  if (!method || !reference) {
    res.status(400).json({
      success: false,
      message: 'Disbursement method and reference are required',
    } as ApiResponse);
    return;
  }

  const loan = await loanService.disburseLoan(id, method, reference);

  res.status(200).json({
    success: true,
    message: 'Loan disbursed successfully',
    data: loan,
  } as ApiResponse);
});

// Get loan repayments
export const getLoanRepayments = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const repayments = await loanService.getLoanRepayments(id);

  res.status(200).json({
    success: true,
    data: repayments,
  } as ApiResponse);
});

// Make loan repayment
export const makeRepayment = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement repayment logic
  res.status(200).json({
    success: true,
    message: 'Make repayment endpoint (to be implemented)',
  } as ApiResponse);
});

export default {
  getLoanProducts,
  applyForLoan,
  getUserLoans,
  getLoanById,
  getAllLoans,
  approveLoan,
  rejectLoan,
  disburseLoan,
  getLoanRepayments,
  makeRepayment,
};
