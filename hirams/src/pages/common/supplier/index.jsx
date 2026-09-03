import React from "react";
import useSupplier from "./useSupplier";
import SupplierView from "./SupplierView";

export default function Supplier() {
  const props = useSupplier();
  return <SupplierView {...props} />;
}
