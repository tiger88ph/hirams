import echo from "../../lib/echo";

export function subscribeJournalAccountChannel() {
  const channel = echo.channel("journal-accounts");

  channel.listen(".journal-account.updated", (event) => {
    const { action, journalAccountId } = event;
    console.log("[JournalAccountChannel] Event received:", event);

    if (action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("journal_account_data_deleted", {
          detail: { journalAccountId },
        }),
      );
    } else {
      // created / updated → refresh list
      window.dispatchEvent(new CustomEvent("journal_account_data_updated"));
    }
  });

  return () => echo.leaveChannel("journal-accounts");
}