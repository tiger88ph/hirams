import echo from "../../lib/echo";

export function subscribeTransactionsChannel() {
  const channel = echo.channel("transactions");

  channel.listen(".transaction.updated", (event) => {
    const { action, transactionId, transaction } = event;

    if (action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("txn_data_deleted", {
          detail: { action, transactionId, transaction },
        }),
      );
    } else {
      // status_changed, updated, created — all just trigger a refetch
      window.dispatchEvent(
        new CustomEvent("txn_data_updated", {
          detail: { action, transactionId, transaction },
        }),
      );
    }
  });

  return () => echo.leaveChannel("transactions");
}