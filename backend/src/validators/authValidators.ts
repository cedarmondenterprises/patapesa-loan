import Joi from 'joi';

/**
 * Auth Validators
 * Comprehensive Joi validation schemas for authentication operations
 */

// Custom validation messages
const customMessages = {
  'string.email': 'Please provide a valid email address',
  'string.min': 'Field must be at least {#limit} characters long',
  'string.max': 'Field must not exceed {#limit} characters',
  'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
  'any.required': 'This field is required',
  'string.empty': 'This field cannot be empty',
  'number.min': 'Value must be at least {#limit}',
  'number.max': 'Value must not exceed {#limit}',
};

/**
 * Register Validation Schema
 * Validates user registration data
 */
export const registerSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      ...customMessages,
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name must not exceed 50 characters',
    }),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      ...customMessages,
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name must not exceed 50 characters',
    }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages(customMessages),

  phoneNumber: Joi.string()
    .trim()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      ...customMessages,
      'string.pattern.base': 'Please provide a valid phone number (E.164 format)',
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      ...customMessages,
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    }),

  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required',
    }),

  dateOfBirth: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.max': 'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required',
    }),

  acceptTerms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must accept the terms and conditions',
    }),

  acceptPrivacy: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must accept the privacy policy',
    }),

  referralCode: Joi.string()
    .trim()
    .max(50)
    .optional()
    .messages(customMessages),
});

/**
 * Login Validation Schema
 * Validates user login credentials
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages(customMessages),

  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      ...customMessages,
      'string.min': 'Password must be at least 8 characters',
    }),

  rememberMe: Joi.boolean()
    .optional()
    .default(false),

  twoFactorCode: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .optional()
    .messages({
      'string.length': '2FA code must be exactly 6 digits',
      'string.pattern.base': '2FA code must contain only numbers',
    }),
});

/**
 * Forgot Password Validation Schema
 * Validates forgot password request
 */
export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages(customMessages),

  verificationMethod: Joi.string()
    .valid('email', 'sms')
    .default('email')
    .optional()
    .messages({
      'any.only': 'Verification method must be either email or sms',
    }),
});

/**
 * Verify Code Validation Schema
 * Validates verification code (OTP) submission
 */
export const verifyCodeSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages(customMessages),

  code: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Verification code must be exactly 6 digits',
      'string.pattern.base': 'Verification code must contain only numbers',
      'any.required': 'Verification code is required',
    }),

  codeType: Joi.string()
    .valid('password_reset', 'email_verification', '2fa_setup', '2fa_login')
    .optional()
    .default('password_reset')
    .messages({
      'any.only': 'Invalid code type',
    }),
});

/**
 * Reset Password Validation Schema
 * Validates password reset with code/token
 */
export const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages(customMessages),

  code: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Verification code must be exactly 6 digits',
      'string.pattern.base': 'Verification code must contain only numbers',
    }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      ...customMessages,
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),

  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('newPassword'))
    .messages({
      'any.only': 'Passwords do not match',
    }),

  resetToken: Joi.string()
    .optional()
    .messages(customMessages),
});

/**
 * Change Password Validation Schema
 * Validates password change for authenticated users
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      ...customMessages,
      'string.min': 'Password must be at least 8 characters',
    }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .invalid(Joi.ref('currentPassword'))
    .messages({
      ...customMessages,
      'string.min': 'New password must be at least 8 characters',
      'string.max': 'New password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.invalid': 'New password must be different from current password',
    }),

  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('newPassword'))
    .messages({
      'any.only': 'Passwords do not match',
    }),
});

/**
 * Enable 2FA Validation Schema
 * Validates 2FA setup request
 */
export const enable2FASchema = Joi.object({
  method: Joi.string()
    .valid('authenticator', 'sms', 'email')
    .required()
    .messages({
      'any.only': '2FA method must be authenticator, sms, or email',
      'any.required': '2FA method is required',
    }),

  phoneNumber: Joi.string()
    .trim()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .when('method', {
      is: 'sms',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      ...customMessages,
      'string.min': 'Password must be at least 8 characters',
    }),
});

/**
 * Verify 2FA Setup Validation Schema
 * Validates 2FA setup verification with code
 */
export const verify2FASetupSchema = Joi.object({
  code: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Verification code must be exactly 6 digits',
      'string.pattern.base': 'Verification code must contain only numbers',
      'any.required': 'Verification code is required',
    }),

  backupCodes: Joi.array()
    .items(Joi.string().trim())
    .optional()
    .messages({
      'array.base': 'Backup codes must be an array',
    }),
});

/**
 * Disable 2FA Validation Schema
 * Validates 2FA disabling request
 */
export const disable2FASchema = Joi.object({
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      ...customMessages,
      'string.min': 'Password must be at least 8 characters',
    }),

  code: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .optional()
    .messages({
      'string.length': 'Verification code must be exactly 6 digits',
      'string.pattern.base': 'Verification code must contain only numbers',
    }),
});

/**
 * Verify 2FA Login Validation Schema
 * Validates 2FA code during login
 */
export const verify2FALoginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages(customMessages),

  code: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': '2FA code must be exactly 6 digits',
      'string.pattern.base': '2FA code must contain only numbers',
      'any.required': '2FA code is required',
    }),

  backupCode: Joi.string()
    .trim()
    .optional()
    .messages(customMessages),

  tempToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Temporary authentication token is required',
    }),
});

/**
 * Use Backup Code Validation Schema
 * Validates backup code usage for 2FA
 */
export const useBackupCodeSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages(customMessages),

  backupCode: Joi.string()
    .trim()
    .required()
    .messages({
      ...customMessages,
      'string.empty': 'Backup code cannot be empty',
    }),

  tempToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Temporary authentication token is required',
    }),
});

/**
 * Refresh Token Validation Schema
 * Validates token refresh request
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required',
      'string.empty': 'Refresh token cannot be empty',
    }),
});

/**
 * Logout Validation Schema
 * Validates logout request
 */
export const logoutSchema = Joi.object({
  refreshToken: Joi.string()
    .optional()
    .messages(customMessages),
});

/**
 * Email Verification Validation Schema
 * Validates email verification code
 */
export const verifyEmailSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages(customMessages),

  code: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Verification code must be exactly 6 digits',
      'string.pattern.base': 'Verification code must contain only numbers',
    }),
});

/**
 * Resend Verification Code Validation Schema
 * Validates resend verification code request
 */
export const resendVerificationCodeSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages(customMessages),

  codeType: Joi.string()
    .valid('email_verification', 'password_reset', '2fa_setup')
    .default('email_verification')
    .optional()
    .messages({
      'any.only': 'Invalid code type',
    }),

  method: Joi.string()
    .valid('email', 'sms')
    .default('email')
    .optional()
    .messages({
      'any.only': 'Delivery method must be email or sms',
    }),
});

/**
 * Social Login Validation Schema
 * Validates social authentication
 */
export const socialLoginSchema = Joi.object({
  provider: Joi.string()
    .valid('google', 'facebook', 'apple', 'github')
    .required()
    .messages({
      'any.only': 'Provider must be google, facebook, apple, or github',
      'any.required': 'Provider is required',
    }),

  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Authentication token is required',
      'string.empty': 'Token cannot be empty',
    }),

  idToken: Joi.string()
    .optional()
    .messages(customMessages),

  accessToken: Joi.string()
    .optional()
    .messages(customMessages),
});

/**
 * Link Social Account Validation Schema
 * Validates linking social account to existing account
 */
export const linkSocialAccountSchema = Joi.object({
  provider: Joi.string()
    .valid('google', 'facebook', 'apple', 'github')
    .required()
    .messages({
      'any.only': 'Provider must be google, facebook, apple, or github',
      'any.required': 'Provider is required',
    }),

  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Authentication token is required',
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      ...customMessages,
      'string.min': 'Password must be at least 8 characters',
    }),
});

/**
 * Validation middleware helper
 * @param schema - Joi schema to validate against
 * @param property - Request property to validate (body, params, query)
 */
export const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'params' | 'query' = 'body') => {
  return (data: any) => {
    return schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
  };
};

/**
 * Middleware for Express/Fastify
 * Usage: app.post('/register', validateAuth(registerSchema), controllerFunction)
 */
export const validateAuth = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const messages = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }

    req.validatedData = value;
    next();
  };
};

/**
 * Export all schemas for easy access
 */
export default {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyCodeSchema,
  resetPasswordSchema,
  changePasswordSchema,
  enable2FASchema,
  verify2FASetupSchema,
  disable2FASchema,
  verify2FALoginSchema,
  useBackupCodeSchema,
  refreshTokenSchema,
  logoutSchema,
  verifyEmailSchema,
  resendVerificationCodeSchema,
  socialLoginSchema,
  linkSocialAccountSchema,
  validateRequest,
  validateAuth,
};
