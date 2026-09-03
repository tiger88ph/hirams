import React from "react";
import useInventory from "./useInventory";
import InventoryView from "./InventoryView";

export default function Inventory() {
  const props = useInventory();
  return <InventoryView {...props} />;
}
