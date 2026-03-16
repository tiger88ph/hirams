import React from "react";
import ReactDOM from "react-dom/client";
import Swal from "sweetalert2";
import { SwalMessages } from "./swalMessages";
import DotSpinner from "../../components/common/DotSpinner";

const replaceVariables = (str, variables) =>
  Object.keys(variables).reduce(
    (s, key) => s.replace(new RegExp(`{${key}}`, "g"), variables[key]),
    str,
  );

const actionPastMap = {
  add: "added", adding: "added",
  save: "saved", saving: "saved",
  apply: "applied", applying: "applied",
  update: "updated", updating: "updated",
  delete: "deleted", deleting: "deleted",
  process: "processed", processing: "processed",
  verify: "verified", verifying: "verified",
  finalize: "finalized", finalizing: "finalized",
  revert: "reverted", reverting: "reverted",
  assign: "assigned", assigning: "assigned",
  reassign: "reassigned", reassigning: "reassigned",
  register: "registered", registering: "registered",
};

// FIX: replaces the long if-else chain with a single loop
const inferActionFromKey = (key) => {
  const upper = key.toUpperCase();
  const match = Object.keys(actionPastMap).find((k) => upper.includes(k.toUpperCase()));
  return match ? actionPastMap[match] : "completed";
};

const mountSpinner = (message) => {
  const el = document.getElementById("swal-spinner-root");
  if (!el) return null;
  const root = ReactDOM.createRoot(el);
  root.render(<DotSpinner message loadingMessage={message} messageCycle={false} />);
  return root;
};

const spinnerConfig = (onOpen, onClose) => ({
  title: "",
  html: `<div id="swal-spinner-root" style="display:flex;justify-content:center;align-items:center;padding:10px;"></div>`,
  showConfirmButton: false,
  allowOutsideClick: false,
  didOpen: onOpen,
  ...(onClose ? { willClose: onClose } : {}),
});

export const showSwal = (messageKey, customOptions = {}, variables = {}) => {
  const config = typeof messageKey === "string"
    ? SwalMessages[messageKey.toUpperCase()] || {}
    : messageKey;

  let { title = "", text = "", ...rest } = config;

  const rawAction = variables.action;
  const action = rawAction
    ? actionPastMap[rawAction.toLowerCase()] || rawAction
    : inferActionFromKey(String(messageKey));

  title = replaceVariables(title, { ...variables, action });
  text  = replaceVariables(text,  { ...variables, action });

  const isAutoClose = rest.icon === "success" || rest.icon === "info";

  return Swal.fire({
    title,
    text,
    ...(isAutoClose ? { timer: 500, timerProgressBar: true } : {}),
    ...rest,
    ...customOptions,
  });
};

export const showSpinner = async (text = "Loading...", minDelay = 500) => {
  Swal.fire(spinnerConfig(() => mountSpinner(text)));
  await new Promise((resolve) => setTimeout(resolve, minDelay));
};

export const withSpinner = async (entity = "Data", task) => {
  let root = null;
  Swal.fire(
    spinnerConfig(
      () => { root = mountSpinner(`Processing ${entity}...`); },
      () => { root?.unmount(); },
    ),
  );
  try {
    const result = await task();
    Swal.close();
    return result;
  } catch (err) {
    Swal.close();
    throw err;
  }
};