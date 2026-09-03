import React from "react";
import useResetPassword from "./useResetPassword";
import ResetPasswordView from "./ResetPasswordView";

export default function ResetPassword() {
  const resetPasswordProps = useResetPassword();
  return <ResetPasswordView {...resetPasswordProps} />;
}