import React from "react";
import useUser from "./useUser";
import UserView from "./UserView";

export default function User() {
  const props = useUser();
  return <UserView {...props} />;
}
