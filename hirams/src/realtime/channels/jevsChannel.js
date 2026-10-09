import echo from "../../lib/echo.js";

// JEV row changes (JevController → App\Events\JevUpdated) → the sidebar's
// per-type badges and the open list both follow. The acting tab already
// does this locally, and the backend broadcasts with toOthers(), so a
// delete counts once instead of twice.
export function subscribeJevsChannel() {
  const channel = echo.channel("jevs");

  channel.listen(".jev.updated", (e) => {
    if (e.action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("jev_data_deleted", { detail: { jevId: e.jevId } }),
      );
      return;
    }
    // created / updated → another tab made or retyped a JEV
    window.dispatchEvent(
      new CustomEvent("jev_data_updated", { detail: { jevId: e.jevId } }),
    );
  });

  return () => echo.leaveChannel("jevs");
}
