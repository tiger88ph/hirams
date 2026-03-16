// utils/helpers/tinFormat.js

/**
 * Format TIN with 3-3-3-5 spacing pattern
 * Example: 123456789012345 → 123 456 789 01234
 * @param {string} value - The TIN value to format
 * @returns {string} - Formatted TIN with spaces
 */
export const formatTIN = (value) => {
  const digits = value.replace(/\D/g, "");
  const parts = [];
  if (digits.length > 0) parts.push(digits.substring(0, 3));
  if (digits.length > 3) parts.push(digits.substring(3, 6));
  if (digits.length > 6) parts.push(digits.substring(6, 9));
  if (digits.length > 9) parts.push(digits.substring(9, 14));
  return parts.join("-");
};

/**
 * Convert formatted TIN to storage format (spaces to dashes)
 * Example: 123 456 789 01234 → 123-456-789-01234
 * @param {string} tin - The formatted TIN with spaces
 * @returns {string} - TIN with dashes for storage
 */
export const tinToStorage = (tin) => {
  return tin.replace(/ /g, "-");
};

/**
 * Convert stored TIN to display format (dashes to spaces)
 * Example: 123-456-789-01234 → 123 456 789 01234
 * @param {string} tin - The stored TIN with dashes
 * @returns {string} - TIN with spaces for display
 */
export const tinToDisplay = (tin) => {
  return tin ? tin.replace(/-/g, "-") : "";
};