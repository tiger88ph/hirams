// ✅ Centralized validation utility

export const VALIDATION_RULES = {
  USER: {
    firstName: { required: true, message: "First Name is required" },
    lastName: { required: true, message: "Last Name is required" },
    nickname: { required: true, message: "Nickname is required" },
    type: { required: true, message: "Type is required" },
    sex: { required: true, message: "Sex is required" },
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
    strPosition: { required: false },
    strDepartment: { required: false },
  },
  BANK_SUPPLIER: {
    strBankName: {
      required: true,
      message: "Bank Name is required",
    },
    strAccountName: {
      required: true,
      message: "Account Name is required",
    },
    strAccountNumber: {
      required: true,
      validator: (value) => {
        const digitsOnly = value.replace(/\s+/g, "");
        return /^\d{10,12}$/.test(digitsOnly);
      },
      message: "Account Number must be 10–12 digits",
    },
  },
  TRANSACTION_ITEM: {
    name: { required: true, message: "Item Name is required" },
    specs: {
      required: true,
      message: "Specifications are required",
      isHtml: true,
    },
    qty: { required: true, message: "Quantity is required" },
    uom: { required: true, message: "UOM is required" },
    abc: { required: true, message: "Total ABC is required" },
  },
};

// utils/form/validation.js

export const stripHtml = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

export const validateFormData = (formData, formType) => {
  const rules = VALIDATION_RULES[formType];
  const errors = {};

  if (!rules) return errors;

  for (const [field, rule] of Object.entries(rules)) {
    let valueRaw = formData[field]?.toString().trim();

    // if the field is HTML (like ReactQuill)
    const value = rule.isHtml ? stripHtml(valueRaw).trim() : valueRaw;

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
