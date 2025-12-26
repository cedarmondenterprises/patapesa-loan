import { Request, Response } from 'express';
import { Logger } from '../utils/logger';
import { ErrorHandler } from '../utils/errorHandler';
import { successResponse, errorResponse } from '../utils/responseFormatter';
import LoanService from '../services/loanService';
import UserService from '../services/userService';

const logger = new Logger('LoanController');

/**
 * Loan Management Controller
 * Handles all loan-related operations including application, approval, disbursement, and repayment
 */
class LoanController {
  private loanService: LoanService;
  private userService: UserService;

  constructor() {
    this.loanService = new LoanService();
    this.userService = new UserService();
  }

  /**
   * GET /api/loans/products
   * Retrieve all available loan products
   */
  public getLoanProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching loan products');

      const products = await this.loanService.getLoanProducts();

      successResponse(res, {
        data: products,
        message: 'Loan products retrieved successfully',
        statusCode: 200,
      });
    } catch (error) {
      logger.error('Error fetching loan products:', error);
      errorResponse(res, {
        message: 'Failed to fetch loan products',
        statusCode: 500,
        error,
      });
    }
  };

  /**
   * POST /api/loans/apply
   * Apply for a new loan
   * Request body: {
   *   productId: string,
   *   amount: number,
   *   tenure: number (months),
   *   purpose: string
   * }
   */
  public applyForLoan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId, amount, tenure, purpose } = req.body;
      const userId = req.user?.id;

      // Validation
      if (!userId) {
        errorResponse(res, {
          message: 'User not authenticated',
          statusCode: 401,
        });
        return;
      }

      if (!productId || !amount || !tenure || !purpose) {
        errorResponse(res, {
          message: 'Missing required fields: productId, amount, tenure, purpose',
          statusCode: 400,
        });
        return;
      }

      if (amount <= 0 || tenure <= 0) {
        errorResponse(res, {
          message: 'Amount and tenure must be greater than zero',
          statusCode: 400,
        });
        return;
      }

      logger.info(`User ${userId} applying for loan: amount=${amount}, tenure=${tenure}`);

      // Check user eligibility
      const userProfile = await this.userService.getUserById(userId);
      if (!userProfile) {
        errorResponse(res, {
          message: 'User profile not found',
          statusCode: 404,
        });
        return;
      }

      // Apply for loan
      const loanApplication = await this.loanService.createLoanApplication({
        userId,
        productId,
        amount,
        tenure,
        purpose,
        status: 'PENDING',
        applicationDate: new Date(),
      });

      successResponse(res, {
        data: loanApplication,
        message: 'Loan application submitted successfully',
        statusCode: 201,
      });
    } catch (error) {
      logger.error('Error applying for loan:', error);
      errorResponse(res, {
        message: 'Failed to submit loan application',
        statusCode: 500,
        error,
      });
    }
  };

  /**
   * GET /api/loans/user/:userId
   * Retrieve all loans for a specific user
   */
  public getUserLoans = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;

      // Authorization check
      if (userId !== currentUserId && req.user?.role !== 'ADMIN') {
        errorResponse(res, {
          message: 'Unauthorized to access these loans',
          statusCode: 403,
        });
        return;
      }

      logger.info(`Fetching loans for user ${userId}`);

      const loans = await this.loanService.getLoansByUserId(userId);

      successResponse(res, {
        data: loans,
        message: 'User loans retrieved successfully',
        statusCode: 200,
      });
    } catch (error) {
      logger.error('Error fetching user loans:', error);
      errorResponse(res, {
        message: 'Failed to fetch user loans',
        statusCode: 500,
        error,
      });
    }
  };

  /**
   * GET /api/loans/:loanId
   * Retrieve details of a specific loan
   */
  public getLoanById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { loanId } = req.params;

      logger.info(`Fetching loan details for ${loanId}`);

      const loan = await this.loanService.getLoanById(loanId);

      if (!loan) {
        errorResponse(res, {
          message: 'Loan not found',
          statusCode: 404,
        });
        return;
      }

      // Authorization check
      if (loan.userId !== req.user?.id && req.user?.role !== 'ADMIN') {
        errorResponse(res, {
          message: 'Unauthorized to access this loan',
          statusCode: 403,
        });
        return;
      }

      successResponse(res, {
        data: loan,
        message: 'Loan details retrieved successfully',
        statusCode: 200,
      });
    } catch (error) {
      logger.error('Error fetching loan details:', error);
      errorResponse(res, {
        message: 'Failed to fetch loan details',
        statusCode: 500,
        error,
      });
    }
  };

  /**
   * GET /api/loans/:loanId/repayments
   * Retrieve all repayment schedules for a specific loan
   */
  public getLoanRepayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { loanId } = req.params;

      logger.info(`Fetching repayments for loan ${loanId}`);

      const loan = await this.loanService.getLoanById(loanId);

      if (!loan) {
        errorResponse(res, {
          message: 'Loan not found',
          statusCode: 404,
        });
        return;
      }

      // Authorization check
      if (loan.userId !== req.user?.id && req.user?.role !== 'ADMIN') {
        errorResponse(res, {
          message: 'Unauthorized to access this loan',
          statusCode: 403,
        });
        return;
      }

      const repayments = await this.loanService.getRepaymentSchedule(loanId);

      successResponse(res, {
        data: repayments,
        message: 'Repayment schedule retrieved successfully',
        statusCode: 200,
      });
    } catch (error) {
      logger.error('Error fetching repayments:', error);
      errorResponse(res, {
        message: 'Failed to fetch repayment schedule',
        statusCode: 500,
        error,
      });
    }
  };

  /**
   * POST /api/loans/:loanId/repay
   * Make a repayment towards a loan
   * Request body: {
   *   amount: number,
   *   paymentMethod: string,
   *   reference: string (optional)
   * }
   */
  public makeRepayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { loanId } = req.params;
      const { amount, paymentMethod, reference } = req.body;
      const userId = req.user?.id;

      // Validation
      if (!amount || amount <= 0) {
        errorResponse(res, {
          message: 'Payment amount must be greater than zero',
          statusCode: 400,
        });
        return;
      }

      if (!paymentMethod) {
        errorResponse(res, {
          message: 'Payment method is required',
          statusCode: 400,
        });
        return;
      }

      logger.info(`User ${userId} making repayment of ${amount} for loan ${loanId}`);

      const loan = await this.loanService.getLoanById(loanId);

      if (!loan) {
        errorResponse(res, {
          message: 'Loan not found',
          statusCode: 404,
        });
        return;
      }

      // Authorization check
      if (loan.userId !== userId && req.user?.role !== 'ADMIN') {
        errorResponse(res, {
          message: 'Unauthorized to make repayment for this loan',
          statusCode: 403,
        });
        return;
      }

      if (loan.status !== 'ACTIVE' && loan.status !== 'OVERDUE') {
        errorResponse(res, {
          message: `Cannot make repayment on a ${loan.status} loan`,
          statusCode: 400,
        });
        return;
      }

      // Process repayment
      const repayment = await this.loanService.processRepayment({
        loanId,
        userId,
        amount,
        paymentMethod,
        reference,
        paymentDate: new Date(),
        status: 'COMPLETED',
      });

      successResponse(res, {
        data: repayment,
        message: 'Repayment processed successfully',
        statusCode: 201,
      });
    } catch (error) {
      logger.error('Error processing repayment:', error);
      errorResponse(res, {
        message: 'Failed to process repayment',
        statusCode: 500,
        error,
      });
    }
  };

  /**
   * GET /api/loans/admin/all
   * Retrieve all loans (Admin only)
   * Query parameters:
   * - status: filter by loan status (PENDING, APPROVED, ACTIVE, COMPLETED, REJECTED, DEFAULTED)
   * - page: pagination page number (default: 1)
   * - limit: items per page (default: 10)
   */
  public getAllLoans = async (req: Request, res: Response): Promise<void> => {
    try {
      // Admin check
      if (req.user?.role !== 'ADMIN') {
        errorResponse(res, {
          message: 'Only administrators can access this endpoint',
          statusCode: 403,
        });
        return;
      }

      const { status, page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      logger.info(
        `Fetching all loans: status=${status}, page=${pageNum}, limit=${limitNum}`
      );

      const loans = await this.loanService.getAllLoans({
        status: status as string,
        page: pageNum,
        limit: limitNum,
      });

      successResponse(res, {
        data: loans,
        message: 'All loans retrieved successfully',
        statusCode: 200,
      });
    } catch (error) {
      logger.error('Error fetching all loans:', error);
      errorResponse(res, {
        message: 'Failed to fetch loans',
        statusCode: 500,
        error,
      });
    }
  };

  /**
   * POST /api/loans/:loanId/approve
   * Approve a pending loan application (Admin only)
   * Request body: {
   *   approvedAmount: number (optional - defaults to applied amount),
   *   notes: string (optional)
   * }
   */
  public approveLoan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { loanId } = req.params;
      const { approvedAmount, notes } = req.body;

      // Admin check
      if (req.user?.role !== 'ADMIN') {
        errorResponse(res, {
          message: 'Only administrators can approve loans',
          statusCode: 403,
        });
        return;
      }

      logger.info(`Admin ${req.user?.id} approving loan ${loanId}`);

      const loan = await this.loanService.getLoanById(loanId);

      if (!loan) {
        errorResponse(res, {
          message: 'Loan not found',
          statusCode: 404,
        });
        return;
      }

      if (loan.status !== 'PENDING') {
        errorResponse(res, {
          message: `Cannot approve a ${loan.status} loan`,
          statusCode: 400,
        });
        return;
      }

      // Approve loan
      const approvedLoan = await this.loanService.approveLoan({
        loanId,
        approvedAmount: approvedAmount || loan.appliedAmount,
        approvalDate: new Date(),
        approvedBy: req.user?.id,
        notes,
      });

      successResponse(res, {
        data: approvedLoan,
        message: 'Loan approved successfully',
        statusCode: 200,
      });
    } catch (error) {
      logger.error('Error approving loan:', error);
      errorResponse(res, {
        message: 'Failed to approve loan',
        statusCode: 500,
        error,
      });
    }
  };

  /**
   * POST /api/loans/:loanId/reject
   * Reject a pending loan application (Admin only)
   * Request body: {
   *   reason: string
   * }
   */
  public rejectLoan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { loanId } = req.params;
      const { reason } = req.body;

      // Admin check
      if (req.user?.role !== 'ADMIN') {
        errorResponse(res, {
          message: 'Only administrators can reject loans',
          statusCode: 403,
        });
        return;
      }

      if (!reason) {
        errorResponse(res, {
          message: 'Rejection reason is required',
          statusCode: 400,
        });
        return;
      }

      logger.info(`Admin ${req.user?.id} rejecting loan ${loanId}`);

      const loan = await this.loanService.getLoanById(loanId);

      if (!loan) {
        errorResponse(res, {
          message: 'Loan not found',
          statusCode: 404,
        });
        return;
      }

      if (loan.status !== 'PENDING') {
        errorResponse(res, {
          message: `Cannot reject a ${loan.status} loan`,
          statusCode: 400,
        });
        return;
      }

      // Reject loan
      const rejectedLoan = await this.loanService.rejectLoan({
        loanId,
        rejectionDate: new Date(),
        rejectionReason: reason,
        rejectedBy: req.user?.id,
      });

      successResponse(res, {
        data: rejectedLoan,
        message: 'Loan rejected successfully',
        statusCode: 200,
      });
    } catch (error) {
      logger.error('Error rejecting loan:', error);
      errorResponse(res, {
        message: 'Failed to reject loan',
        statusCode: 500,
        error,
      });
    }
  };

  /**
   * POST /api/loans/:loanId/disburse
   * Disburse an approved loan (Admin only)
   * Request body: {
   *   disbursementAmount: number (optional - defaults to approved amount),
   *   disbursementAccount: string (beneficiary account),
   *   paymentMethod: string,
   *   reference: string (optional)
   * }
   */
  public disburseLoan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { loanId } = req.params;
      const { disbursementAmount, disbursementAccount, paymentMethod, reference } =
        req.body;

      // Admin check
      if (req.user?.role !== 'ADMIN') {
        errorResponse(res, {
          message: 'Only administrators can disburse loans',
          statusCode: 403,
        });
        return;
      }

      // Validation
      if (!disbursementAccount) {
        errorResponse(res, {
          message: 'Disbursement account is required',
          statusCode: 400,
        });
        return;
      }

      if (!paymentMethod) {
        errorResponse(res, {
          message: 'Payment method is required',
          statusCode: 400,
        });
        return;
      }

      logger.info(`Admin ${req.user?.id} disbursing loan ${loanId}`);

      const loan = await this.loanService.getLoanById(loanId);

      if (!loan) {
        errorResponse(res, {
          message: 'Loan not found',
          statusCode: 404,
        });
        return;
      }

      if (loan.status !== 'APPROVED') {
        errorResponse(res, {
          message: `Cannot disburse a ${loan.status} loan. Loan must be in APPROVED status`,
          statusCode: 400,
        });
        return;
      }

      const actualDisbursementAmount = disbursementAmount || loan.approvedAmount;

      if (actualDisbursementAmount > loan.approvedAmount) {
        errorResponse(res, {
          message: 'Disbursement amount cannot exceed approved amount',
          statusCode: 400,
        });
        return;
      }

      // Process disbursement
      const disbursedLoan = await this.loanService.disburseLoan({
        loanId,
        disbursementAmount: actualDisbursementAmount,
        disbursementAccount,
        paymentMethod,
        reference,
        disbursementDate: new Date(),
        disbursedBy: req.user?.id,
        status: 'ACTIVE',
      });

      // Generate repayment schedule
      await this.loanService.generateRepaymentSchedule({
        loanId,
        loanAmount: actualDisbursementAmount,
        tenure: loan.tenure,
        interestRate: loan.interestRate,
        disbursementDate: new Date(),
      });

      successResponse(res, {
        data: disbursedLoan,
        message: 'Loan disbursed successfully. Repayment schedule generated',
        statusCode: 200,
      });
    } catch (error) {
      logger.error('Error disbursing loan:', error);
      errorResponse(res, {
        message: 'Failed to disburse loan',
        statusCode: 500,
        error,
      });
    }
  };
}

export default new LoanController();
