// utils/helpers/passwordFormat.js

/**
 * Validate password requirements
 * @param {string} password - The password to validate
 * @returns {string} - Error message if invalid, empty string if valid
 */
export const validatePassword = (password) => {
  if (!password) return "";
  const missing = [];
  if (password.length < 8) missing.push("8 characters");
  if (!/[A-Z]/.test(password)) missing.push("uppercase");
  if (!/[a-z]/.test(password)) missing.push("lowercase");
  if (!/[0-9]/.test(password)) missing.push("number");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    missing.push("special character");
  return missing.length ? `Password needs: ${missing.join(", ")}` : "";
};

/**
 * Validate confirm password matches password
 * @param {string} password - The original password
 * @param {string} cpassword - The confirmation password
 * @returns {string} - Error message if invalid, empty string if valid
 */
export const validateConfirmPassword = (password, cpassword) => {
  if (!password) return "";
  if (!cpassword) return "Please confirm your password";
  if (password !== cpassword) return "Passwords do not match";
  return "";
};