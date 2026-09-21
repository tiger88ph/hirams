import React from "react";
import useSystem from "./useSystem";
import SystemView from "./SystemView";

export default function System() {
  const props = useSystem();
  return <SystemView {...props} />;
}