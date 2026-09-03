import echo from "../../lib/echo";

/**
 * Purchase Options Realtime Subscriber
 * Broadcast channel: transaction.{transactionId}.items
 * Event name: option.updated
 * Dispatches: purchase_option_data_updated CustomEvent
 */
export function subscribePurchaseOptionsChannel() {
  // Listen to GLOBAL transactions channel (since we don't know txId here)
  const channel = echo.channel("transactions");

  channel.listen(".option.updated", (event) => {
    const { action, optionId, itemId, transactionId } = event;

    console.log("[Realtime:PurchaseOptions]", { action, optionId, itemId, transactionId });

    // Dispatch GLOBAL CustomEvent — useCanvas.js filters by transactionId internally
    window.dispatchEvent(
      new CustomEvent("purchase_option_data_updated", {
        detail: { action, optionId, itemId, transactionId },
      })
    );
  });

  return () => echo.leaveChannel("transactions");
}