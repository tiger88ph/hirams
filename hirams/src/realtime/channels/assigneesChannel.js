import echo from "../../lib/echo";

export function subscribeAssigneesChannel() {
  const channel = echo.channel("assignees");

  channel.listen(".assignee.updated", (event) => {
    const { action, assigneeId } = event;
    console.log("[AssigneesChannel] Event received:", event);

    if (action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("assignee_data_deleted", {
          detail: { assigneeId },
        })
      );
    } else {
      // created / updated / status_changed → refresh list
      window.dispatchEvent(new CustomEvent("assignee_data_updated"));
    }
  });

  return () => echo.leaveChannel("assignees");
}