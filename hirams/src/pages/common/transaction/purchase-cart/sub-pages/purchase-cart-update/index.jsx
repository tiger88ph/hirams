// purchase-cart/sub-pages/purchase-cart-update/index.jsx
import usePurchaseCartUpdate from "./usePurchaseCartUpdate.js";
import PurchaseCartUpdateView from "./PurchaseCartUpdateView.jsx";

export default function PurchaseCartUpdateContainer() {
  const purchaseCartUpdateState = usePurchaseCartUpdate();

  return <PurchaseCartUpdateView {...purchaseCartUpdateState} />;
}