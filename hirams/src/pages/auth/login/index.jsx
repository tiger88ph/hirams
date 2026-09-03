import React from "react";
import useLogin from "./useLogin";
import LoginView from "./LoginView";

export default function Login() {
  const loginProps = useLogin();
  return <LoginView {...loginProps} />;
}