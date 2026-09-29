import React from "react";
import useClient from "./useClient";
import ClientView from "./ClientView";

export default function Client() {
  const props = useClient();
  return <ClientView {...props} />;
}
