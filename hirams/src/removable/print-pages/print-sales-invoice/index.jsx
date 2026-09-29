import usePrintSalesInvoice from "./usePrintSalesInvoice";
import PrintSalesInvoice from "./PrintSalesInvoice.jsx";

export default function SalesInvoice() {
  const state = usePrintSalesInvoice();
  return <PrintSalesInvoice {...state} />;
}
