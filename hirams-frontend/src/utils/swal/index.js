import Swal from "sweetalert2";
import { SwalMessages } from "./messages";

// Replace placeholders like {entity} with actual values
const replaceVariables = (str, variables) => {
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{${key}}`, "g");
    str = str.replace(regex, variables[key]);
  });
  return str;
};

/**
 * Show a SweetAlert popup
 */
export const showSwal = (messageKey, customOptions = {}, variables = {}) => {
  let config;

  if (typeof messageKey === "string") {
    config = SwalMessages[messageKey.toUpperCase()] || {};
  } else {
    config = messageKey;
  }

  let { title = "", text = "", ...rest } = config;

  title = replaceVariables(title, variables);
  text = replaceVariables(text, variables);

  return Swal.fire({ title, text, ...rest, ...customOptions });
};

/**
 * Show a confirmation dialog
 */
export const confirmDelete = async (entity) => {
  return await showSwal("CONFIRM_DELETE", {}, { entity });
};

/**
 * Show a universal loading spinner
 * @param {string} text - Message to display
 * @param {number} minDelay - Minimum delay (ms) before returning, default 1000ms
 */
export const showSpinner = async (text = "Please wait...", minDelay = 1000) => {
  Swal.fire({
    title: "",
    html: `<div style="display:flex; flex-direction:column; align-items:center; gap:15px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#f5c518">
        <path d="M0 0h24v24H0z" fill="none"/>
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
      <span style="font-size:16px;">${text}</span>
    </div>`,
    showConfirmButton: false,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  // Wait at least minDelay milliseconds to ensure spinner is visible
  await new Promise((resolve) => setTimeout(resolve, minDelay));
};

/**
 * Delete confirmation with input verification
 * @param {string} entity - Name of the entity to delete (e.g., "User")
 * @param {Function} onConfirm - Callback function to execute after verification succeeds
 */
export const confirmDeleteWithVerification = async (entity, onConfirm) => {
  const firstLetter = entity.charAt(0).toUpperCase();

  // Step 1: Initial confirmation
  const result = await Swal.fire({
    title: `Delete ${entity}?`,
    text: `This action cannot be undone!`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });

  if (result.isConfirmed) {
    const { value: verification } = await Swal.fire({
      title: `<span style="color:#d33;">Delete Verification</span>`,
      html: `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      text-align:center;
      gap:15px;
      padding:0 5px;
    ">
      <p style="
        margin:0;
        font-size:1rem;
        word-break:break-word;
      ">
        Type the first letter of <strong>${entity}</strong> to confirm deletion
      </p>
     <input 
      id="swal-input" 
      class="swal2-input" 
      placeholder="First letter" 
      maxlength="1"
      style="
        font-size: 1.2rem; 
        text-align: center; 
        min-width: 90px; 
        height: 40px;
        border-radius: 8px;
        border: 1px solid #ccc;
        text-transform: uppercase;
      "
    />

    </div>
  `,
      showCancelButton: true,
      confirmButtonText: "Confirm Delete",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      allowOutsideClick: false,
      preConfirm: () => {
        const input = Swal.getPopup().querySelector("#swal-input").value;
        if (!input) {
          Swal.showValidationMessage("You need to type the first letter!");
        } else if (input.toUpperCase() !== firstLetter) {
          Swal.showValidationMessage(`Incorrect! Type "${firstLetter}"`);
        }
        return input;
      },
      didOpen: () => {
        const input = Swal.getPopup().querySelector("#swal-input");
        input.focus();

        // Responsive font scaling
        const updateFontSize = () => {
          const width = window.innerWidth;
          input.style.fontSize = width < 400 ? "1rem" : "1.2rem";
        };
        updateFontSize();
        window.addEventListener("resize", updateFontSize);

        // Cleanup listener on close
        Swal.getPopup().addEventListener("destroy", () => {
          window.removeEventListener("resize", updateFontSize);
        });
      },
    });

    if (verification) {
      await onConfirm();
    }
  }
};
/**
 * Run a task with a SweetAlert spinner that automatically closes when done.
 * @param {string} text - Spinner message
 * @param {Function} task - Async function to run while spinner is visible
 */
export const withSpinner = async (text, task) => {
  Swal.fire({
    title: "",
    html: `<div style="display:flex; flex-direction:column; align-items:center; gap:15px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#f5c518">
        <path d="M0 0h24v24H0z" fill="none"/>
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
      <span style="font-size:16px;">${text}</span>
    </div>`,
    showConfirmButton: false,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const result = await task(); // run your async logic
    Swal.close();
    return result;
  } catch (err) {
    Swal.close();
    throw err;
  }
};
