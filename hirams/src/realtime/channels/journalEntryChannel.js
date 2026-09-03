import echo from "../../lib/echo";

export function subscribeJournalEntryChannel() {
  const channel = echo.channel("jev-entries");

  channel.listen(".jev-entry.updated", (event) => {
    const { action, jevEntryId, jevId } = event;
    console.log("[JournalEntryChannel] Event received:", event);

    if (action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("jev_entry_data_deleted", {
          detail: { jevEntryId, jevId },
        }),
      );
    } else {
      // created / updated → refresh entries for this JEV
      window.dispatchEvent(
        new CustomEvent("jev_entry_data_updated", {
          detail: { jevId },
        }),
      );
    }
  });

  return () => echo.leaveChannel("jev-entries");
}
