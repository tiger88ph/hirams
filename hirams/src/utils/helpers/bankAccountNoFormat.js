// utils/helpers/bankAccountNoFormat.js
/**
 * Format bank account number with 4-digit grouping pattern
 * Example: 123456789012 → 1234 5678 9012
 * @param {string} value - The account number to format
 * @returns {string} - Formatted account number with spaces
 */
export const formatBankAccountNo = (value) => {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/(.{4})/g, "$1 ").trim();
};

/**
 * Convert formatted account number to storage format (remove spaces)
 * Example: 1234 5678 9012 → 123456789012
 * @param {string} accountNo - The formatted account number with spaces
 * @returns {string} - Account number without spaces for storage
 */
export const bankAccountNoToStorage = (accountNo) => {
  return accountNo.replace(/\s/g, "");
};

/**
 * Convert stored account number to display format (add spaces)
 * Example: 123456789012 → 1234 5678 9012
 * @param {string} accountNo - The stored account number without spaces
 * @returns {string} - Account number with spaces for display
 */
export const bankAccountNoToDisplay = (accountNo) => {
  if (!accountNo) return "";
  return formatBankAccountNo(accountNo);
};

/**
 * Validate bank account number (basic check for digits only)
 * @param {string} accountNo - The account number to validate
 * @returns {boolean} - Whether the account number contains only digits
 */
export const isValidBankAccountNo = (accountNo) => {
  const digits = accountNo.replace(/\s/g, "");
  return /^\d+$/.test(digits) && digits.length >= 8; // Minimum 8 digits
};