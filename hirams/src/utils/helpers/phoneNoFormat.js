// utils/helpers/phoneNoFormat.js
/**
 * Format Philippine mobile number with pattern: 09XX-XXX-XXXX
 * Example: 09123456789 → 09XX-XXX-XXXX (masked) or 0912-345-6789 (formatted)
 * @param {string} value - The phone number to format
 * @param {boolean} masked - Whether to mask the number (default: false)
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNo = (value) => {
  const digits = value.replace(/\D/g, "");
  const parts = [];
  
  if (digits.length > 0) parts.push(digits.substring(0, 4));  // 09XX
  if (digits.length > 4) parts.push(digits.substring(4, 7));  // XXX
  if (digits.length > 7) parts.push(digits.substring(7, 11)); // XXXX
  
  return parts.join("-");
};

/**
 * Convert formatted phone number to storage format (remove dashes)
 * Example: 0912-345-6789 → 09123456789
 * @param {string} phoneNo - The formatted phone number with dashes
 * @returns {string} - Phone number without dashes for storage
 */
export const phoneNoToStorage = (phoneNo) => {
  return phoneNo.replace(/-/g, "");
};

/**
 * Convert stored phone number to display format (add dashes)
 * Example: 09123456789 → 0912-345-6789
 * @param {string} phoneNo - The stored phone number without dashes
 * @returns {string} - Phone number with dashes for display
 */
export const phoneNoToDisplay = (phoneNo) => {
  if (!phoneNo) return "";
  return formatPhoneNo(phoneNo);
};

/**
 * Validate Philippine mobile number format
 * Must start with 09 and be exactly 11 digits
 * @param {string} phoneNo - The phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
export const isValidPhoneNo = (phoneNo) => {
  const digits = phoneNo.replace(/\D/g, "");
  return /^09\d{9}$/.test(digits);
};