import echo from "../../lib/echo.js";

export function subscribeVouchersChannel() {
  const channel = echo.channel("vouchers");

  channel.listen(".voucher.updated", (e) => {
    if (e.action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("voucher_data_deleted", { detail: { voucherId: e.voucherId } })
      );
    } else {
      window.dispatchEvent(new CustomEvent("voucher_data_updated", { detail: e }));
    }
  });

  channel.listen(".voucher.supplier.updated", () => {
    window.dispatchEvent(new CustomEvent("voucher_data_updated"));
  });

  channel.listen(".voucher.assignee.updated", () => {
    window.dispatchEvent(new CustomEvent("voucher_data_updated"));
  });

  return () => echo.leaveChannel("vouchers");
}