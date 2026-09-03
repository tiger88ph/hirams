import React from "react";
import useRegister from "./useRegister";
import RegisterView from "./RegisterView";

export default function Register() {
  const registerProps = useRegister();
  return <RegisterView {...registerProps} />;
}