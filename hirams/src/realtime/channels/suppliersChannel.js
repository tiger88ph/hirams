import echo from "../../lib/echo.js";

export function subscribeSuppliersChannel() {
  const channel = echo.channel("suppliers");

  channel.listen(".supplier.updated", (e) => {
    if (e.action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("supplier_data_deleted", {
          detail: { supplierId: e.supplierId },
        })
      );
    } else {
      window.dispatchEvent(new CustomEvent("supplier_data_updated", { detail: e }));
    }
  });

  return () => echo.leaveChannel("suppliers");
}