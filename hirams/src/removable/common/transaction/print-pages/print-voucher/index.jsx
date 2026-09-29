import usePrintVoucher from "./usePrintVoucher.jsx";
import PrintVoucherView from "./PrintVoucherView.jsx";

export default function PrintVoucher() {
  const state = usePrintVoucher();
  return <PrintVoucherView {...state} />;
}
