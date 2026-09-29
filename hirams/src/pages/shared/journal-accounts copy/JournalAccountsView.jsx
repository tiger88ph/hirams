import PageLayout from "../../../components/layouts/page/content-page";
import BaseButton from "../../../components/ui/form/BaseButton";
import icons from "../../../utils/style/iconFormatStyles";
import JournalAccountPanel from "./components/JournalAccountPanel";
import AccountReportPanel from "./components/AccountReportPanel";

/* ─── View ──────────────────────────────────────────────────────────── */
// Page chrome only: holds the title and footer, and swaps the body between
// the two panels. Clicking "View" on an account row sets reportTarget in the
// hook, which hides JournalAccountPanel and shows AccountReportPanel for
// that account; the footer's "Back" button returns to the list.
//
// Everything not listed below is forwarded straight to JournalAccountPanel
// (search, tree, drag & drop, AEModal / delete / flash-import state…).
export default function JournalAccountsView({
  // ── owned by AccountReportPanel ──
  reportOpen,
  reportTarget,
  setReportOpen,
  setReportTarget,
  journalAccounts,
  jevEntries,
  jevTypeOptions,
  jevActiveKey,
  // ── owned by JournalAccountPanel ──
  ...panelProps
}) {
  const showReport = !!reportOpen && !!reportTarget;

  const closeReport = () => {
    setReportOpen(false);
    setReportTarget(null);
  };

  // The list itself needs no footer; only the report has somewhere to go back
  // from, so the bar (and its Back button) appears with it.
  const footerLActions = showReport ? (
    <BaseButton
      label="Back"
      icon={icons.back}
      onClick={closeReport}
      actionColor="back"
    />
  ) : null;

  return (
    // REPLACE the PageLayout title/subtitle props
    <PageLayout
      title="Journal Accounts"
      subtitle={
        showReport
          ? `Report / ${reportTarget?.accountName ?? ""}`
          : "Chart of journal accounts"
      }
      footerLActions={footerLActions}
    >
      {showReport ? (
        <AccountReportPanel
          account={reportTarget}
          allAccounts={journalAccounts}
          jevEntries={jevEntries}
          jevTypeOptions={jevTypeOptions}
          jevActiveKey={jevActiveKey}
        />
      ) : (
        <JournalAccountPanel {...panelProps} jevEntries={jevEntries} />
      )}
    </PageLayout>
  );
}
