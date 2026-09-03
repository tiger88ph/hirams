import echo from "../../lib/echo";

export function subscribeInventoriesChannel() {
  console.log("✅ [INVENTORY CHANNEL] Listening on: inventory");

  const channel = echo.channel("inventory");

  channel.listen(".inventory.updated", (event) => {
    console.log("📡 [EVENT RECEIVED] →", event); // ← CRITICAL LOG

    const { action, inventoryId } = event;

    if (action === "deleted") {
      console.log("📡 Dispatching → inventory_data_deleted");
      window.dispatchEvent(
        new CustomEvent("inventory_data_deleted", {
          detail: { inventoryId },
        })
      );
    } else {
      console.log("📡 Dispatching → inventory_data_updated");
      window.dispatchEvent(new CustomEvent("inventory_data_updated"));
    }
  });

  channel.error((err) => {
    console.error("❌ [INVENTORY CHANNEL ERROR]", err);
  });

  return () => {
    console.log("👋 Leaving inventory channel");
    echo.leaveChannel("inventory");
  };
}