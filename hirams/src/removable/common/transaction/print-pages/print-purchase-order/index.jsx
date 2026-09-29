import usePrintPurchaseOrder from "./usePrintPurchaseOrder.jsx";
import PrintPurchaseOrderView from "./PrintPurchaseOrderView.jsx";

export default function PurchaseOrder() {
  const state = usePrintPurchaseOrder();
  return <PrintPurchaseOrderView {...state} />;
}
