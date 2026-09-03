import echo from "../../lib/echo";

export function subscribePurchaseOrderOptionsChannel() {
  const channel = echo.channel("purchase-order-options");

  channel.listen(".purchase-order-option.updated", (event) => {
    const {
      action,
      purchaseOrderOptionId,
      purchaseOrderId,
      purchaseOptionId,
      transactionId, // ← ADD
    } = event;

    if (action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("purchase_order_option_data_deleted", {
          detail: { purchaseOrderOptionId, purchaseOrderId, purchaseOptionId, transactionId },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("purchase_order_option_data_updated", {
          detail: { purchaseOrderOptionId, purchaseOrderId, purchaseOptionId, transactionId },
        })
      );
    }
  });

  return () => echo.leaveChannel("purchase-order-options");
}