import echo from "../../lib/echo";

export function subscribeTransactionItemsChannel() {
  // ✅ Channel name matches backend EXACTLY
  const channel = echo.channel("transaction_items");

  // ✅ Event name matches EXACTLY
  channel.listen(".transaction_item.updated", (event) => {
    const { action, transactionItemId, itemId, transactionId } = event;
    const id = transactionItemId || itemId; // Works with both

    console.log("[TransactionItemsChannel] Event received:", event);

    if (action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("transaction_item_data_deleted", {
          detail: { transactionItemId: id, transactionId },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("transaction_item_data_updated", {
          detail: { transactionId },
        })
      );
    }
  });

  return () => echo.leaveChannel("transaction_items");
}