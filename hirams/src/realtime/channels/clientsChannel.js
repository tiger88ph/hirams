import echo from "../../lib/echo";

// ✅ Named export — matches ALL your other channel files exactly
export function subscribeClientsChannel() {
  const channel = echo.channel("clients");

  channel.listen(".client.updated", (event) => {
    const { action, clientId } = event;
    console.log("[ClientsChannel] Event received:", event);

    if (action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("client_data_deleted", {
          detail: { clientId },
        })
      );
    } else {
      window.dispatchEvent(new CustomEvent("client_data_updated"));
    }
  });

  return () => echo.leaveChannel("clients");
}