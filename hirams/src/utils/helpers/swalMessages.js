export const SwalMessages = {
  SUCCESS: {
    title: "Success!",
    text: "{entity} {action} successfully.",
    icon: "success",
  },
  ERROR: {
    title: "Error!",
    text: "Something went wrong while trying to {action} {entity}.",
    icon: "error",
  },
  WARNING: {
    title: "Warning!",
    text: "Are you sure you want to {action} {entity}?",
    icon: "warning",
  },
  INFO: {
    title: "Info",
    text: "Here is some information about {entity}.",
    icon: "info",
  },
  CONFIRM_DELETE: {
    title: "Delete {entity}?",
    text: "This action cannot be undone!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
  },
  DELETE_SUCCESS: {
    title: "Deleted!",
    text: "{entity} has been deleted successfully.",
    icon: "success",
  },
  DELETE_ERROR: {
    title: "Error!",
    text: "Failed to delete {entity}.",
    icon: "error",
  },
  LOADING: {
    title: "",
    text: "Loading data...",
    icon: "info",
    showConfirmButton: false,
    allowOutsideClick: false,
  },
  REGISTRATION_SUCCESS: {
    title: "Registration Received",
    text: "Your account request has been submitted and is currently under management approval. You will be notified once it has been activated.",
    icon: "success",
  },
  REGISTRATION_PENDING: {
    title: "Registration Received",
    text: "Your account request has been submitted and is currently under management approval. You will be notified once it has been activated.",
    icon: "success",
  },
  REGISTRATION_ERROR: {
    title: "Registration Failed",
    text:  "This username already exists.",
    icon: "error",
  },
  USERNAME_EXISTS: {
    title: "Registration Failed",
    text: "This username already exists.",
    icon: "error",
  },
  EMAIL_EXISTS: {
    title: "Registration Failed",
    text: "This email already exists.",
    icon: "error",
  },
};