import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors.array(),
      },
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// Validation schemas
export const validateCreateUser = [
  body('email')
    .isEmail()
    .withMessage('Invalid email format'),
  body('phone')
    .matches(/^[+]?[0-9]{7,15}$/)
    .withMessage('Invalid phone number'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Invalid email format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const validateLoanApplication = [
  body('loanAmount')
    .isNumeric()
    .withMessage('Loan amount must be a number')
    .custom((value) => value > 0)
    .withMessage('Loan amount must be greater than 0'),
  body('loanTerm')
    .isInt({ min: 1 })
    .withMessage('Loan term must be a positive integer'),
  body('purpose')
    .notEmpty()
    .withMessage('Loan purpose is required'),
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
];

export const validatePayment = [
  body('loanId')
    .notEmpty()
    .withMessage('Loan ID is required'),
  body('paymentAmount')
    .isNumeric()
    .withMessage('Payment amount must be a number')
    .custom((value) => value > 0)
    .withMessage('Payment amount must be greater than 0'),
  body('paymentMethod')
    .isIn(['BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'CASH', 'CHECK', 'CHEQUE'])
    .withMessage('Invalid payment method'),
];
