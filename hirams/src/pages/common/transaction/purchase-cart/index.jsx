// purchase-cart/index.jsx
//
// Container — this is the glue between the hook and the view. It calls
// usePurchaseCart() for all state/logic, then passes the result straight
// through as props to the presentational PurchaseCart component. Keeping
// this wiring here (instead of inside PurchaseCart.jsx) means the view
// component stays pure/prop-driven and is easy to test or reuse with a
// different data source later.
import usePurchaseCart from "./usePurchaseCart.js";
import PurchaseCartView from "./PurchaseCartView.jsx";

export default function PurchaseCartContainer() {
  const purchaseCartState = usePurchaseCart();

  return <PurchaseCartView {...purchaseCartState} />;
}