import usePrintDeliveryReceipt from "./usePrintDeliveryReceipt";
import PrintDeliveryReceiptView from "./PrintDeliveryReceiptView.jsx";

export default function DeliveryReceipt() {
  const state = usePrintDeliveryReceipt();
  return <PrintDeliveryReceiptView {...state} />;
}
