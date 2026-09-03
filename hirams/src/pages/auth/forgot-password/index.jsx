import React from "react";
import useForgotPassword from "./useForgotPassword";
import ForgotPasswordView from "./ForgotPasswordView";

export default function ForgotPassword() {
  const forgotPasswordProps = useForgotPassword();
  return <ForgotPasswordView {...forgotPasswordProps} />;
}