import echo from "../../lib/echo.js";

export function subscribeSupplierBanksChannel() {
  const channel = echo.channel("supplier-banks");

  channel.listen(".supplier-bank.updated", (e) => {
    if (e.action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("supplier_bank_deleted", {
          detail: { supplierId: e.supplierId, bankId: e.bankId },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("supplier_bank_updated", { detail: e })
      );
    }
  });

  return () => echo.leaveChannel("supplier-banks");
}