import Swal from "sweetalert2";
import { SwalMessages } from "./messages";

// Replace placeholders like {entity} or {action}
const replaceVariables = (str, variables) => {
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{${key}}`, "g");
    str = str.replace(regex, variables[key]);
  });
  return str;
};
// Generates HTML + CSS version of DotSpinner for SweetAlert
const getDotSpinnerHTML = (
  dotCount = 3,
  size = 12,
  color = "#1976d2",
  speed = 0.6
) => {
  const dots = Array(dotCount)
    .fill("")
    .map(
      (_, i) =>
        `<div class="dot" style="
            width:${size}px;
            height:${size}px;
            background:${color};
            animation: bounce ${speed}s ${i * 0.2}s infinite ease-in-out;
        "></div>`
    )
    .join("");

  return `
    <style>
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      .dot-container {
        display:flex;
        gap:8px;
        align-items:center;
        justify-content:center;
        margin-bottom:10px;
      }
      .dot {
        border-radius:50%;
      }
    </style>

    <div class="dot-container">${dots}</div>
  `;
};

export const showSwal = (messageKey, customOptions = {}, variables = {}) => {
  let config;

  if (typeof messageKey === "string") {
    config = SwalMessages[messageKey.toUpperCase()] || {};
  } else {
    config = messageKey;
  }

  let { title = "", text = "", ...rest } = config;

  // Default action fallback (if not specified)
  const action =
    variables.action ||
    (messageKey.toUpperCase().includes("DELETE")
      ? "deleted"
      : messageKey.toUpperCase().includes("ADD")
        ? "added"
        : messageKey.toUpperCase().includes("UPDATE")
          ? "updated"
          : "completed");

  // Replace placeholders
  title = replaceVariables(title, { ...variables, action });
  text = replaceVariables(text, { ...variables, action });

  return Swal.fire({ title, text, ...rest, ...customOptions });
};
/**
 * Show a confirmation dialog
 */
export const confirmDelete = async (entity) => {
  return await showSwal("CONFIRM_DELETE", {}, { entity });
};

export const showSpinner = async (text = "Loading...", minDelay = 1000) => {
  Swal.fire({
    title: "",
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
        ${getDotSpinnerHTML(3, 12, "#1976d2", 0.6)}
        <span style="font-size:16px;">${text}</span>
      </div>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
  });

  await new Promise((resolve) => setTimeout(resolve, minDelay));
};


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

export const withSpinner = async (entity = "Data", task) => {
  const text = `Processing ${entity}...`;

  Swal.fire({
    title: "",
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px; padding:10px;">
        ${getDotSpinnerHTML(3, 12, "#1976d2", 0.6)}
        <span style="font-size:16px;">${text}</span>
      </div>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
  });

  try {
    const result = await task();
    Swal.close();
    return result;
  } catch (err) {
    Swal.close();
    throw err;
  }
};
