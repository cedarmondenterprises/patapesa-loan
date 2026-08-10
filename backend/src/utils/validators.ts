export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[0-9]{7,15}$/;
  return phoneRegex.test(phone.replace(/[^0-9+]/g, ''));
};

export const validateLoanAmount = (amount: number, min: number, max: number): boolean => {
  return amount >= min && amount <= max;
};

export const validateLoanTerm = (term: number, min: number, max: number): boolean => {
  return term >= min && term <= max && Number.isInteger(term);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateDateOfBirth = (dob: Date): boolean => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 18 && age <= 100;
};
