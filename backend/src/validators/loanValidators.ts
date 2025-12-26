import Joi from 'joi';

/**
 * Loan Application Validator
 * Validates loan application submissions with comprehensive business rules
 */
export const loanApplicationSchema = Joi.object({
  userId: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'User ID is required',
      'string.empty': 'User ID cannot be empty',
    }),

  loanProductId: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'Loan Product ID is required',
      'string.empty': 'Loan Product ID cannot be empty',
    }),

  requestedAmount: Joi.number()
    .required()
    .positive()
    .min(100)
    .max(1000000)
    .messages({
      'any.required': 'Requested amount is required',
      'number.base': 'Requested amount must be a number',
      'number.positive': 'Requested amount must be positive',
      'number.min': 'Requested amount must be at least 100',
      'number.max': 'Requested amount cannot exceed 1,000,000',
    }),

  loanTerm: Joi.number()
    .required()
    .integer()
    .min(1)
    .max(360)
    .messages({
      'any.required': 'Loan term (in months) is required',
      'number.base': 'Loan term must be a number',
      'number.integer': 'Loan term must be a whole number',
      'number.min': 'Loan term must be at least 1 month',
      'number.max': 'Loan term cannot exceed 360 months (30 years)',
    }),

  purpose: Joi.string()
    .required()
    .trim()
    .min(5)
    .max(500)
    .messages({
      'any.required': 'Loan purpose is required',
      'string.empty': 'Loan purpose cannot be empty',
      'string.min': 'Loan purpose must be at least 5 characters',
      'string.max': 'Loan purpose cannot exceed 500 characters',
    }),

  employmentStatus: Joi.string()
    .required()
    .valid('employed', 'self-employed', 'unemployed', 'student', 'retired')
    .messages({
      'any.required': 'Employment status is required',
      'any.only': 'Employment status must be one of: employed, self-employed, unemployed, student, retired',
    }),

  monthlyIncome: Joi.number()
    .required()
    .positive()
    .min(0)
    .max(1000000)
    .messages({
      'any.required': 'Monthly income is required',
      'number.base': 'Monthly income must be a number',
      'number.positive': 'Monthly income must be positive',
      'number.max': 'Monthly income cannot exceed 1,000,000',
    }),

  monthlyExpenses: Joi.number()
    .required()
    .min(0)
    .max(1000000)
    .messages({
      'any.required': 'Monthly expenses are required',
      'number.base': 'Monthly expenses must be a number',
      'number.min': 'Monthly expenses cannot be negative',
      'number.max': 'Monthly expenses cannot exceed 1,000,000',
    }),

  existingDebts: Joi.number()
    .optional()
    .min(0)
    .max(5000000)
    .messages({
      'number.base': 'Existing debts must be a number',
      'number.min': 'Existing debts cannot be negative',
      'number.max': 'Existing debts cannot exceed 5,000,000',
    }),

  collateral: Joi.object({
    type: Joi.string()
      .required()
      .valid('property', 'vehicle', 'savings', 'other')
      .messages({
        'any.required': 'Collateral type is required',
        'any.only': 'Collateral type must be one of: property, vehicle, savings, other',
      }),

    value: Joi.number()
      .required()
      .positive()
      .min(100)
      .messages({
        'any.required': 'Collateral value is required',
        'number.base': 'Collateral value must be a number',
        'number.positive': 'Collateral value must be positive',
        'number.min': 'Collateral value must be at least 100',
      }),

    description: Joi.string()
      .optional()
      .trim()
      .max(500)
      .messages({
        'string.max': 'Collateral description cannot exceed 500 characters',
      }),
  })
    .optional()
    .messages({
      'object.base': 'Collateral must be an object',
    }),

  hasCoApplicant: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'hasCoApplicant must be a boolean',
    }),

  coApplicantId: Joi.string()
    .when('hasCoApplicant', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .trim()
    .messages({
      'any.required': 'Co-applicant ID is required when hasCoApplicant is true',
      'string.empty': 'Co-applicant ID cannot be empty',
    }),

  documents: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .required()
          .valid('id', 'bank_statement', 'payslip', 'proof_of_residence', 'business_license', 'other')
          .messages({
            'any.required': 'Document type is required',
            'any.only': 'Document type must be one of: id, bank_statement, payslip, proof_of_residence, business_license, other',
          }),

        url: Joi.string()
          .required()
          .uri()
          .messages({
            'any.required': 'Document URL is required',
            'string.uri': 'Document URL must be a valid URI',
          }),

        uploadDate: Joi.date()
          .optional()
          .messages({
            'date.base': 'Upload date must be a valid date',
          }),
      })
    )
    .optional()
    .messages({
      'array.base': 'Documents must be an array',
    }),

  preferredRepaymentDay: Joi.number()
    .optional()
    .integer()
    .min(1)
    .max(31)
    .messages({
      'number.base': 'Preferred repayment day must be a number',
      'number.integer': 'Preferred repayment day must be a whole number',
      'number.min': 'Preferred repayment day must be between 1 and 31',
      'number.max': 'Preferred repayment day must be between 1 and 31',
    }),

  notes: Joi.string()
    .optional()
    .trim()
    .max(1000)
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters',
    }),
})
  .required()
  .messages({
    'object.base': 'Loan application must be an object',
  });

/**
 * Loan Repayment Validator
 * Validates loan repayment transactions
 */
export const loanRepaymentSchema = Joi.object({
  loanId: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'Loan ID is required',
      'string.empty': 'Loan ID cannot be empty',
    }),

  amount: Joi.number()
    .required()
    .positive()
    .min(1)
    .max(10000000)
    .messages({
      'any.required': 'Repayment amount is required',
      'number.base': 'Repayment amount must be a number',
      'number.positive': 'Repayment amount must be positive',
      'number.min': 'Repayment amount must be at least 1',
      'number.max': 'Repayment amount cannot exceed 10,000,000',
    }),

  paymentMethod: Joi.string()
    .required()
    .valid('bank_transfer', 'mobile_money', 'cash', 'check', 'other')
    .messages({
      'any.required': 'Payment method is required',
      'any.only': 'Payment method must be one of: bank_transfer, mobile_money, cash, check, other',
    }),

  paymentDate: Joi.date()
    .required()
    .max('now')
    .messages({
      'any.required': 'Payment date is required',
      'date.base': 'Payment date must be a valid date',
      'date.max': 'Payment date cannot be in the future',
    }),

  transactionReference: Joi.string()
    .required()
    .trim()
    .min(3)
    .max(100)
    .messages({
      'any.required': 'Transaction reference is required',
      'string.empty': 'Transaction reference cannot be empty',
      'string.min': 'Transaction reference must be at least 3 characters',
      'string.max': 'Transaction reference cannot exceed 100 characters',
    }),

  paymentSource: Joi.object({
    accountNumber: Joi.string()
      .optional()
      .trim()
      .messages({
        'string.empty': 'Account number cannot be empty',
      }),

    accountHolder: Joi.string()
      .optional()
      .trim()
      .max(100)
      .messages({
        'string.max': 'Account holder name cannot exceed 100 characters',
      }),

    bankName: Joi.string()
      .optional()
      .trim()
      .max(100)
      .messages({
        'string.max': 'Bank name cannot exceed 100 characters',
      }),

    mobileNumber: Joi.string()
      .optional()
      .trim()
      .regex(/^[0-9+\-\s()]{10,20}$/)
      .messages({
        'string.pattern.base': 'Mobile number must be a valid format',
      }),
    })
    .optional(),

  description: Joi.string()
    .optional()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),

  appliedToPrincipal: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'appliedToPrincipal must be a boolean',
    }),

  notes: Joi.string()
    .optional()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Notes cannot exceed 500 characters',
    }),
})
  .required()
  .messages({
    'object.base': 'Loan repayment must be an object',
  });

/**
 * Loan Product Validator
 * Validates loan product creation and updates
 */
export const loanProductSchema = Joi.object({
  name: Joi.string()
    .required()
    .trim()
    .min(3)
    .max(100)
    .messages({
      'any.required': 'Loan product name is required',
      'string.empty': 'Loan product name cannot be empty',
      'string.min': 'Loan product name must be at least 3 characters',
      'string.max': 'Loan product name cannot exceed 100 characters',
    }),

  description: Joi.string()
    .required()
    .trim()
    .min(10)
    .max(2000)
    .messages({
      'any.required': 'Loan product description is required',
      'string.empty': 'Loan product description cannot be empty',
      'string.min': 'Loan product description must be at least 10 characters',
      'string.max': 'Loan product description cannot exceed 2000 characters',
    }),

  category: Joi.string()
    .required()
    .valid('personal', 'business', 'home', 'auto', 'education', 'consolidation', 'other')
    .messages({
      'any.required': 'Loan product category is required',
      'any.only': 'Category must be one of: personal, business, home, auto, education, consolidation, other',
    }),

  minAmount: Joi.number()
    .required()
    .positive()
    .min(100)
    .max(10000000)
    .messages({
      'any.required': 'Minimum loan amount is required',
      'number.base': 'Minimum loan amount must be a number',
      'number.positive': 'Minimum loan amount must be positive',
      'number.min': 'Minimum loan amount must be at least 100',
      'number.max': 'Minimum loan amount cannot exceed 10,000,000',
    }),

  maxAmount: Joi.number()
    .required()
    .positive()
    .min(100)
    .max(50000000)
    .messages({
      'any.required': 'Maximum loan amount is required',
      'number.base': 'Maximum loan amount must be a number',
      'number.positive': 'Maximum loan amount must be positive',
      'number.min': 'Maximum loan amount must be at least 100',
      'number.max': 'Maximum loan amount cannot exceed 50,000,000',
    }),

  minTerm: Joi.number()
    .required()
    .integer()
    .min(1)
    .max(360)
    .messages({
      'any.required': 'Minimum loan term is required',
      'number.base': 'Minimum loan term must be a number',
      'number.integer': 'Minimum loan term must be a whole number',
      'number.min': 'Minimum loan term must be at least 1 month',
      'number.max': 'Minimum loan term cannot exceed 360 months',
    }),

  maxTerm: Joi.number()
    .required()
    .integer()
    .min(1)
    .max(360)
    .messages({
      'any.required': 'Maximum loan term is required',
      'number.base': 'Maximum loan term must be a number',
      'number.integer': 'Maximum loan term must be a whole number',
      'number.min': 'Maximum loan term must be at least 1 month',
      'number.max': 'Maximum loan term cannot exceed 360 months',
    }),

  baseInterestRate: Joi.number()
    .required()
    .min(0)
    .max(100)
    .messages({
      'any.required': 'Base interest rate is required',
      'number.base': 'Base interest rate must be a number',
      'number.min': 'Base interest rate cannot be negative',
      'number.max': 'Base interest rate cannot exceed 100%',
    }),

  processingFee: Joi.number()
    .required()
    .min(0)
    .max(100)
    .messages({
      'any.required': 'Processing fee is required',
      'number.base': 'Processing fee must be a number',
      'number.min': 'Processing fee cannot be negative',
      'number.max': 'Processing fee cannot exceed 100%',
    }),

  insuranceFee: Joi.number()
    .optional()
    .min(0)
    .max(100)
    .messages({
      'number.base': 'Insurance fee must be a number',
      'number.min': 'Insurance fee cannot be negative',
      'number.max': 'Insurance fee cannot exceed 100%',
    }),

  latePaymentPenalty: Joi.number()
    .optional()
    .min(0)
    .max(50)
    .messages({
      'number.base': 'Late payment penalty must be a number',
      'number.min': 'Late payment penalty cannot be negative',
      'number.max': 'Late payment penalty cannot exceed 50%',
    }),

  repaymentFrequency: Joi.string()
    .required()
    .valid('weekly', 'bi-weekly', 'monthly', 'quarterly', 'semi-annual', 'annual')
    .messages({
      'any.required': 'Repayment frequency is required',
      'any.only': 'Repayment frequency must be one of: weekly, bi-weekly, monthly, quarterly, semi-annual, annual',
    }),

  collateralRequired: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'collateralRequired must be a boolean',
    }),

  minCreditScore: Joi.number()
    .optional()
    .integer()
    .min(0)
    .max(1000)
    .messages({
      'number.base': 'Minimum credit score must be a number',
      'number.integer': 'Minimum credit score must be a whole number',
      'number.min': 'Minimum credit score cannot be negative',
      'number.max': 'Minimum credit score cannot exceed 1000',
    }),

  maxDebtToIncomeRatio: Joi.number()
    .optional()
    .min(0)
    .max(1)
    .messages({
      'number.base': 'Maximum debt to income ratio must be a number',
      'number.min': 'Maximum debt to income ratio cannot be negative',
      'number.max': 'Maximum debt to income ratio cannot exceed 1 (100%)',
    }),

  minAnnualIncome: Joi.number()
    .optional()
    .min(0)
    .max(100000000)
    .messages({
      'number.base': 'Minimum annual income must be a number',
      'number.min': 'Minimum annual income cannot be negative',
      'number.max': 'Minimum annual income cannot exceed 100,000,000',
    }),

  requiredDocuments: Joi.array()
    .items(Joi.string().valid('id', 'bank_statement', 'payslip', 'proof_of_residence', 'business_license', 'tax_return', 'other'))
    .optional()
    .messages({
      'array.base': 'Required documents must be an array',
    }),

  eligibilityCriteria: Joi.object()
    .optional()
    .keys({
      minAge: Joi.number()
        .integer()
        .min(18)
        .max(150)
        .messages({
          'number.integer': 'Minimum age must be a whole number',
          'number.min': 'Minimum age cannot be less than 18',
          'number.max': 'Minimum age cannot exceed 150',
        }),

      maxAge: Joi.number()
        .integer()
        .min(18)
        .max(150)
        .messages({
          'number.integer': 'Maximum age must be a whole number',
          'number.min': 'Maximum age cannot be less than 18',
          'number.max': 'Maximum age cannot exceed 150',
        }),

      employmentRequired: Joi.boolean(),

      minEmploymentDuration: Joi.number()
        .integer()
        .min(0)
        .messages({
          'number.integer': 'Minimum employment duration must be a whole number',
          'number.min': 'Minimum employment duration cannot be negative',
        }),

      citizenship: Joi.array()
        .items(Joi.string())
        .optional()
        .messages({
          'array.base': 'Citizenship must be an array',
        }),
    })
    .messages({
      'object.base': 'Eligibility criteria must be an object',
    }),

  status: Joi.string()
    .optional()
    .valid('active', 'inactive', 'suspended')
    .messages({
      'any.only': 'Status must be one of: active, inactive, suspended',
    }),

  notes: Joi.string()
    .optional()
    .trim()
    .max(1000)
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters',
    }),
})
  .required()
  .messages({
    'object.base': 'Loan product must be an object',
  });

/**
 * Batch Loan Repayment Validator
 * Validates batch repayment submissions
 */
export const batchLoanRepaymentSchema = Joi.object({
  repayments: Joi.array()
    .items(loanRepaymentSchema)
    .required()
    .min(1)
    .max(1000)
    .messages({
      'any.required': 'Repayments array is required',
      'array.base': 'Repayments must be an array',
      'array.min': 'At least one repayment is required',
      'array.max': 'Cannot process more than 1000 repayments in a single batch',
    }),

  batchId: Joi.string()
    .optional()
    .trim()
    .messages({
      'string.empty': 'Batch ID cannot be empty',
    }),

  processingDate: Joi.date()
    .optional()
    .max('now')
    .messages({
      'date.base': 'Processing date must be a valid date',
      'date.max': 'Processing date cannot be in the future',
    }),

  notes: Joi.string()
    .optional()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Notes cannot exceed 500 characters',
    }),
})
  .required()
  .messages({
    'object.base': 'Batch repayment must be an object',
  });

/**
 * Loan Status Update Validator
 * Validates loan status change requests
 */
export const loanStatusUpdateSchema = Joi.object({
  loanId: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'Loan ID is required',
      'string.empty': 'Loan ID cannot be empty',
    }),

  newStatus: Joi.string()
    .required()
    .valid('pending', 'approved', 'active', 'completed', 'rejected', 'defaulted', 'cancelled')
    .messages({
      'any.required': 'New status is required',
      'any.only': 'New status must be one of: pending, approved, active, completed, rejected, defaulted, cancelled',
    }),

  reason: Joi.string()
    .required()
    .trim()
    .min(5)
    .max(500)
    .messages({
      'any.required': 'Reason for status change is required',
      'string.empty': 'Reason cannot be empty',
      'string.min': 'Reason must be at least 5 characters',
      'string.max': 'Reason cannot exceed 500 characters',
    }),

  approvedBy: Joi.string()
    .optional()
    .trim()
    .messages({
      'string.empty': 'Approved by cannot be empty',
    }),

  comments: Joi.string()
    .optional()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Comments cannot exceed 500 characters',
    }),
})
  .required()
  .messages({
    'object.base': 'Loan status update must be an object',
  });

/**
 * Loan Search/Filter Validator
 * Validates loan search and filter parameters
 */
export const loanSearchFilterSchema = Joi.object({
  userId: Joi.string()
    .optional()
    .trim(),

  loanProductId: Joi.string()
    .optional()
    .trim(),

  status: Joi.string()
    .optional()
    .valid('pending', 'approved', 'active', 'completed', 'rejected', 'defaulted', 'cancelled'),

  minAmount: Joi.number()
    .optional()
    .positive(),

  maxAmount: Joi.number()
    .optional()
    .positive(),

  minCreatedDate: Joi.date()
    .optional(),

  maxCreatedDate: Joi.date()
    .optional(),

  sortBy: Joi.string()
    .optional()
    .valid('createdDate', 'amount', 'status', 'dueDate'),

  sortOrder: Joi.string()
    .optional()
    .valid('asc', 'desc'),

  page: Joi.number()
    .optional()
    .integer()
    .min(1)
    .messages({
      'number.integer': 'Page must be a whole number',
      'number.min': 'Page must be at least 1',
    }),

  limit: Joi.number()
    .optional()
    .integer()
    .min(1)
    .max(100)
    .messages({
      'number.integer': 'Limit must be a whole number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
});

/**
 * Partial Loan Update Validator
 * Validates partial updates to loan records (PATCH operations)
 */
export const loanPartialUpdateSchema = Joi.object({
  loanId: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'Loan ID is required',
      'string.empty': 'Loan ID cannot be empty',
    }),

  preferredRepaymentDay: Joi.number()
    .optional()
    .integer()
    .min(1)
    .max(31)
    .messages({
      'number.base': 'Preferred repayment day must be a number',
      'number.integer': 'Preferred repayment day must be a whole number',
      'number.min': 'Preferred repayment day must be between 1 and 31',
      'number.max': 'Preferred repayment day must be between 1 and 31',
    }),

  notes: Joi.string()
    .optional()
    .trim()
    .max(1000)
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters',
    }),

  collateral: Joi.object({
    type: Joi.string()
      .optional()
      .valid('property', 'vehicle', 'savings', 'other'),

    value: Joi.number()
      .optional()
      .positive()
      .min(100),

    description: Joi.string()
      .optional()
      .trim()
      .max(500),
    })
    .optional(),
})
  .required()
  .messages({
    'object.base': 'Loan update must be an object',
  });
