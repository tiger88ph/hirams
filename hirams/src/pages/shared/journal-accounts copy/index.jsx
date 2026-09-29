import useJournalAccounts from "./useJournalAccounts";
import JournalAccountsView from "./JournalAccountsView";

export default function JournalAccounts() {
  const props = useJournalAccounts();
  return <JournalAccountsView {...props} />;
}
