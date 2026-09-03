import echo from "../../lib/echo";

export function subscribePurchaseOrdersChannel() {
  const channel = echo.channel("purchase-orders");

  channel.listen(".purchase-order.updated", (event) => {
    const { action, purchaseOrderId, newStatus } = event;
    console.log("[PurchaseOrdersChannel] Event received:", event);

    if (action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("purchase_order_data_deleted", {
          detail: { purchaseOrderId, newStatus },
        })
      );
    } else {
      // created / updated / status_updated / payment_updated → refresh list
      window.dispatchEvent(
        new CustomEvent("purchase_order_data_updated", {
          detail: { purchaseOrderId, newStatus },
        })
      );
    }
  });

  return () => echo.leaveChannel("purchase-orders");
}