import useVoucher from "./useVoucher";
import VoucherView from "./VoucherView";

export default function TransactionVoucher() {
  const props = useVoucher();
  return <VoucherView {...props} />;
}
