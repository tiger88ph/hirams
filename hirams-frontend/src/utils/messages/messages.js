// utils/messages.js
const messages = {
  typography: {
    period: ".",
    comma: ",",
    colon: ":",
    semicolon: ";",
    dash: "-",
    ellipsis: "…",
    underscore: "_",
    slash: "/",
    backslash: "\\",
    space: " ",
    ampersand: "&",
    at: "@",
    hash: "#",
    percent: "%",
    star: "*",
    plus: "+",
    equal: "=",
    question: "?",
    exclamation: "!",
    quotation: '"',
    singleQuote: "'",
    leftParen: "(",
    rightParen: ")",
    leftBracket: "[",
    rightBracket: "]",
    leftBrace: "{",
    rightBrace: "}",
    pipe: "|",
    tilde: "~",
    grave: "`",
    lessThan: "<",
    greaterThan: ">",
  },
  crudPresent: {
    addingMess: "Adding ",
    updatingMess: "Updating ",
    deletingMess: "Deleting ",
    processingMess: "Processing ",
    verifyingMess: "Verifying ",
    revertingMess: "Reverting ",
    reassigningMess: "Reassigning ",
    assigningMess: "Assigning ",
  },
  crudSuccess: {
    addingMess: "added successfully!",
    updatingMess: "updated successfully!",
    deletingMess: "deleted successfully!",
    processingMEss: "processed successfully!",
    revertingMess: "reverted successfully!",
    verifyingMess: "verified successfully!",
    finalizingMess: "finalized successfully!",
  },
  reusable: {
    confirmMess: "The letter does not match the first letter of ",
    errorMess: "Action failed. Please try again.",
  },
  client: {
    confirmMess:
      "The letter does not match the first letter of the client name.",
    approvingMess: "Approving ",
    activatingMess: "Activating ",
    deactivatingMess: "Deactivating ",
    errorMess: "Action failed. Please try again.",
  },
  user: {
    confirmMess:
      "The letter does not match the first letter of the user's first name.",
    activatingMess: "Activating ",
    deactivatingMess: "Deactivating ",
    errorMess: "Action failed. Please try again.",
  },
  supplier: {
    confirmMess:
      "The letter does not match the first letter of the supplier name.",
    activatingMess: "Activating ",
    deactivatingMess: "Deactivating ",
    errorMess: "Action failed. Please try again.",
  },
  supplierBank: {
    entity: "Bank Account",
    confirmMess: "The letter does not match the first letter of the bank name.",
    errorAlertSaveMess: "Failed to save ",
    errorSaveMess: "Failed to save bank account. Please try again.",
    errorAlertDeleteMess: "Failed to delete ",
    errorDeleteMess:
      "The letter does not match the first letter of the bank name.",
  },
  supplierContact: {
    entity: "Contact",
    confirmMess:
      "The letter does not match the first letter of the contact name.",
    errorAlertSaveMess: "Failed to save ",
    errorSaveMess: "Failed to save contact informations. Please try again.",
    errorAlertDeleteMess: "Failed to delete ",
    errorDeleteMess:
      "The letter does not match the first letter of the contact name.",
  },
  transaction: {
    entityItem: "Transaction Item",
    errorDeleteMess:
      "The letter does not match the first letter of the item name.",
    poUpdatingMess: "Updating purchase option from ",
    poAddingMess: "Adding purchase option from ",
    poErrorSaveMess: "Failed to save purchase option.",
  },
};

export default messages;
