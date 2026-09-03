import echo from "../../lib/echo.js";

export function subscribeUsersChannel() {
  const channel = echo.channel("users");

  channel.listen(".user.updated", (e) => {
    if (e.action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("user_data_deleted", { detail: { userId: e.userId } })
      );
    } else {
      window.dispatchEvent(new CustomEvent("user_data_updated", { detail: e }));
    }
  });

  return () => echo.leaveChannel("users");
}