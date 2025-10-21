// ✅ Centralized validation utility

export const VALIDATION_RULES = {
  USER: {
    firstName: { required: true, message: "First Name is required" },
    lastName: { required: true, message: "Last Name is required" },
    nickname: { required: true, message: "Nickname is required" },
    type: { required: true, message: "Type is required" },
  },

  CLIENT: {
    clientName: { required: true, message: "Client Name is required" },
    nickname: { required: true, message: "Nickname is required" },

    tin: {
      required: false,
      validator: (value) =>
        /^\d{3}\s?\d{3}\s?\d{3}\s?\d{2}$/.test(value.replace(/\D/g, "")),
      message: "TIN must contain exactly 11 digits",
    },

    contactNumber: {
      required: false,
      validator: (value) => /^(09|\+639)\d{9}$/.test(value.replace(/\s+/g, "")),
      message: "Contact Number must start with 09 or +639 and have 11 digits",
    },

    address: { required: false },
    businessStyle: { required: false },
    contactPerson: { required: false },
  },
  COMPANY: {
    name: { required: true, message: "Company Name is required" },
    nickname: { required: true, message: "Company Nickname is required" },
    tin: {
      required: false,
      validator: (value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length >= 9 && digits.length <= 12;
      },
      message: "TIN must be 9–12 digits",
    },
    address: { required: false },
    vat: { required: false },
    ewt: { required: false },
  },
  SUPPLIER: {
    fullName: { required: true, message: "Supplier Name is required" },
    nickname: { required: true, message: "Supplier Nickname is required" },
    tin: {
      required: false,
      validator: (value) => {
        const digits = value.replace(/\D/g, "");
        return (
          digits.length === 0 || (digits.length >= 9 && digits.length <= 12)
        );
      },
      message: "TIN must be 9–12 digits",
    },
    address: { required: false },
  },
  CONTACT_SUPPLIER: {
    strName: { required: true, message: "Name is required" },
    strNumber: {
      required: true,
      validator: (value) => /^(09|\+639)\d{9}$/.test(value.replace(/\s+/g, "")),
      message: "Number must start with 09 or +639 and have 11 digits",
    },
    strPosition: { required: false},
    strDepartment: { required: false},
  },
};

/**
 * ✅ Generic validation function
 * @param {Object} formData - The form data object
 * @param {string} formType - The type of form (USER, CLIENT, etc.)
 * @returns {Object} errors - Key-value pairs of error messages
 */
export const validateFormData = (formData, formType) => {
  const rules = VALIDATION_RULES[formType];
  const errors = {};

  if (!rules) return errors;

  for (const [field, rule] of Object.entries(rules)) {
    const value = formData[field]?.toString().trim();

    // Required field check
    if (rule.required && !value) {
      errors[field] = rule.message || `${field} is required`;
      continue;
    }

    // Custom validator function
    if (rule.validator && value && !rule.validator(value)) {
      errors[field] = rule.message || `${field} is invalid`;
    }
  }

  return errors;
};
