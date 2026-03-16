const uiMessages = {
  common: {
    //Status Management
    activating: "Activating ",
    deactivating: "Deactivating ",
    approving: "Approving ",
    adding: "Adding ",
    updating: "Updating ",
    deleting: "Deleting ",
    ellipsis: " ...",
    //Error Messages
    errorReqChar: "Please enter the required character to proceed.",
    errorUserType: "Please select a user type before approving.",
    errorMessage: "Something went wrong. Please try again.",
    //DUPLICATES
    emailExists: "This email already exists.",
    usernameExists: "This username already exists.",
    //LOGIN
    invalidInput: "Please enter your Username and Password.",
    processingInput: "Processing... Please Wait.",
    successInput: "Redirecting...",
    failedAttempt: "Login failed. Account does not exist or inactive.",
    invalidPassword: "Password is incorrect.",
    //REVERT
    errorRevert: "This transaction cannot be reverted.",
    //TRANSACTION ITEM
    invalidABC: "ABC is required when transaction has no ABC value",
    //CRUD Operations
    addedSuccessfully: " added successfully!",
    updatedSuccessfully: " updated successfully!",
    deletedSuccessfully: " deleted successfully!",
    processedSuccessfully: " processed successfully!",
    revertedSuccessfully: " reverted successfully!",
    verifiedSuccessfully: " verified successfully!",
    finalizedSuccessfully: " finalized successfully!",
  },
};

export default uiMessages;

