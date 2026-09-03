import echo from "../../lib/echo";

export function subscribeDirectCostOptionsChannel() {
  const channel = echo.channel("direct-costs");

  channel.listen(".direct-cost.updated", (event) => {
    const { action, directCostId } = event;
    console.log("[DirectCostOptionsChannel] Event received:", event);

    if (action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("direct_cost_data_deleted", {
          detail: { directCostId },
        })
      );
    } else {
      // created / updated → refresh list
      window.dispatchEvent(new CustomEvent("direct_cost_data_updated"));
    }
  });

  return () => echo.leaveChannel("direct-costs");
}