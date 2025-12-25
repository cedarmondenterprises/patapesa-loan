// Formatting utilities for Patapesa Loan Platform

// Format currency
export const formatCurrency = (amount: number, currency: string = 'KES'): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format number with commas
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-KE').format(num);
};

// Format phone number (Kenyan format)
export const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Convert to +254 format if starts with 0
  if (cleaned.startsWith('0')) {
    return `+254${cleaned.substring(1)}`;
  }

  // Add + if not present
  if (cleaned.startsWith('254')) {
    return `+${cleaned}`;
  }

  return phone;
};

// Format date
export const formatDate = (date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string => {
  const d = new Date(date);

  if (format === 'iso') {
    return d.toISOString();
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return d.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format loan number
export const formatLoanNumber = (id: string): string => {
  // Generate loan number like PL-2024-001234
  const timestamp = Date.now().toString().slice(-6);
  const prefix = id.substring(0, 6).toUpperCase();
  return `PL-${new Date().getFullYear()}-${prefix}${timestamp}`;
};

// Format percentage
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Format duration (in days)
export const formatDuration = (days: number): string => {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? '1 year' : `${years} years`;
};

// Format loan status for display
export const formatLoanStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    disbursed: 'Disbursed',
    active: 'Active',
    completed: 'Completed',
    defaulted: 'Defaulted',
    written_off: 'Written Off',
  };
  return statusMap[status] || status;
};

// Format KYC status
export const formatKYCStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    not_started: 'Not Started',
    pending: 'Pending Verification',
    approved: 'Verified',
    rejected: 'Rejected',
  };
  return statusMap[status] || status;
};

// Truncate text
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Capitalize first letter
export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Format name (capitalize each word)
export const formatName = (name: string): string => {
  return name
    .split(' ')
    .map((word) => capitalizeFirst(word))
    .join(' ');
};

// Parse currency string to number
export const parseCurrency = (currencyString: string): number => {
  // Remove currency symbols and commas
  const cleaned = currencyString.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned);
};

// Format time ago
export const formatTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

// Mask sensitive data
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  if (username.length <= 3) return `${username}***@${domain}`;
  return `${username.substring(0, 3)}***@${domain}`;
};

export const maskPhone = (phone: string): string => {
  if (phone.length <= 6) return '****';
  return `${phone.substring(0, 4)}****${phone.substring(phone.length - 2)}`;
};

export const maskAccountNumber = (accountNumber: string): string => {
  if (accountNumber.length <= 4) return '****';
  return `****${accountNumber.substring(accountNumber.length - 4)}`;
};
