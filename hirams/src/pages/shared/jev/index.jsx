import useJevList from "./useJevList";
import JevListView from "./JevListView";

export default function JournalEntryVoucher() {
  const props = useJevList();
  return <JevListView {...props} />;
}
