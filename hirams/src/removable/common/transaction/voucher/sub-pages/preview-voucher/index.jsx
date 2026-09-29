import usePreviewVoucher from "./usePreviewVoucher.js";
import PreviewVoucherView from "./previewVoucherView.jsx";

export default function PreviewVoucher() {
  const state = usePreviewVoucher();
  return <PreviewVoucherView {...state} />;
}