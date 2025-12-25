import Joi from 'joi';

// Email validation
export const validateEmail = (email: string): boolean => {
  const schema = Joi.string().email().required();
  const result = schema.validate(email);
  return !result.error;
};

// Phone validation (Kenyan format)
export const validatePhone = (phone: string): boolean => {
  const schema = Joi.string()
    .pattern(/^\+?254[17]\d{8}$/)
    .required();
  const result = schema.validate(phone);
  return !result.error;
};

// Password validation
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// National ID validation (Kenyan format)
export const validateNationalId = (nationalId: string): boolean => {
  const schema = Joi.string()
    .pattern(/^\d{7,8}$/)
    .required();
  const result = schema.validate(nationalId);
  return !result.error;
};

// Loan amount validation
export const validateLoanAmount = (
  amount: number,
  minAmount: number,
  maxAmount: number
): { valid: boolean; error?: string } => {
  if (amount < minAmount) {
    return {
      valid: false,
      error: `Loan amount must be at least ${minAmount}`,
    };
  }
  if (amount > maxAmount) {
    return {
      valid: false,
      error: `Loan amount cannot exceed ${maxAmount}`,
    };
  }
  return { valid: true };
};

// Loan term validation
export const validateLoanTerm = (
  termMonths: number,
  minTerm: number,
  maxTerm: number
): { valid: boolean; error?: string } => {
  if (termMonths < minTerm) {
    return {
      valid: false,
      error: `Loan term must be at least ${minTerm} months`,
    };
  }
  if (termMonths > maxTerm) {
    return {
      valid: false,
      error: `Loan term cannot exceed ${maxTerm} months`,
    };
  }
  return { valid: true };
};

// File upload validation
export const validateFileUpload = (
  file: Express.Multer.File,
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
    };
  }

  // Check file type
  const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
};

// UUID validation
export const validateUUID = (uuid: string): boolean => {
  const schema = Joi.string().uuid().required();
  const result = schema.validate(uuid);
  return !result.error;
};

// Date validation
export const validateDate = (date: string): boolean => {
  const schema = Joi.date().iso().required();
  const result = schema.validate(date);
  return !result.error;
};

// Registration request validation
export const validateRegistration = (data: {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
}): { valid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {};

  if (!validateEmail(data.email)) {
    errors.email = ['Invalid email address'];
  }

  if (!validatePhone(data.phone)) {
    errors.phone = ['Invalid phone number (must be Kenyan format: +254...)'];
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.errors;
  }

  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = ['First name must be at least 2 characters'];
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = ['Last name must be at least 2 characters'];
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

// Loan application validation
export const validateLoanApplication = (data: {
  productId: string;
  amount: number;
  termMonths: number;
  purpose: string;
}): { valid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {};

  if (!validateUUID(data.productId)) {
    errors.productId = ['Invalid product ID'];
  }

  if (!data.amount || data.amount <= 0) {
    errors.amount = ['Loan amount must be greater than 0'];
  }

  if (!data.termMonths || data.termMonths <= 0) {
    errors.termMonths = ['Loan term must be greater than 0'];
  }

  if (!data.purpose || data.purpose.trim().length < 10) {
    errors.purpose = ['Purpose must be at least 10 characters'];
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
