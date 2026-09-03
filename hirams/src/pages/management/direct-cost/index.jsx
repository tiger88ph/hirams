import React from "react";
import useDirectCost from "./useDirectCost";
import DirectCostView from "./DirectCostView";

export default function DirectCost() {
  const props = useDirectCost();
  return <DirectCostView {...props} />;
}
