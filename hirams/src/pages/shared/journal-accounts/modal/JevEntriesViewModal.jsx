import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import ModalContainer from "../../../../components/layouts/modal/ModalContainer.jsx";
import JevViewPanel from "../../jev/components/JevViewPanel.jsx";
import POListPanel from "../../voucher/components/POListPanel.jsx";
import AssigneeListPanel from "../../voucher/components/AssigneeListPanel.jsx";
import { SectionLabel } from "../../voucher/sub-pages/voucher-update/VoucherUpdateView.jsx";
import VoucherAPI from "../../../../api/endpoints/voucher.api.js";

/**
 * Viewer for ONE JEV — opened from the Account Report's "JEV No." column
 * (only voucher JEVs, type V, are clickable — see AccountReportPanel).
 *
 * Laid out exactly like VoucherUpdateView: the voucher's Particulars block
 * first (SectionLabel + POListPanel / AssigneeListPanel with their Grand
 * Total footer), then "Journal Entry Voucher" over the From / To columns of
 * JevViewPanel — the same component the voucher and purchase pages use.
 *
 * The particulars come from the voucher this JEV was created for, loaded on
 * open and cached per JEV id so revisiting an entry costs no request.
 *
 * JevViewPanel is deliberately mounted WITHOUT isManagement /
 * isFinanceOfficer (and therefore without jevPendingKey), so the Add / Edit /
 * Delete Entry controls never render — a report opens it to be read.
 * `jev` is rebuilt by the caller WITHOUT its `entries` array, which makes
 * JevViewPanel fetch the entries fresh with their journal_account data.
 *
 *   <JevEntriesViewModal
 *     open={jevModalOpen}
 *     onClose={() => setJevModalOpen(false)}
 *     jev={jevModal}
 *     subTitle={jevSubTitle}
 *   />
 */
function JevEntriesViewModal({ open, onClose, jev = null, subTitle = "" }) {
  const jevId = jev?.nJEVId ? String(jev.nJEVId) : "";

  // nJEVId → voucher (null = no voucher found). Keyed so a cached `null`
  // counts as "already looked up" and doesn't loop the effect below.
  const [vouchers, setVouchers] = useState({});
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  useEffect(() => {
    if (!open || !jevId) return;
    if (vouchers[jevId] !== undefined) return;

    (async () => {
      setLoadingVoucher(true);
      try {
        const res = await VoucherAPI.getVouchers();
        const list = Array.isArray(res) ? res : res?.data || [];
        const found = list.find((v) => String(v.nJEVId) === jevId) || null;
        setVouchers((prev) => ({ ...prev, [jevId]: found }));
      } catch (err) {
        console.error("Failed to load the voucher behind this JEV:", err);
        setVouchers((prev) => ({ ...prev, [jevId]: null }));
      } finally {
        setLoadingVoucher(false);
      }
    })();
  }, [open, jevId, vouchers]);

  const voucher = jevId ? (vouchers[jevId] ?? null) : null;

  // Same rule VoucherUpdateView uses to pick its particulars panel.
  const isAssigneeType =
    (voucher?.voucher_assignees?.length ?? 0) > 0 &&
    !(voucher?.voucher_suppliers?.length > 0);
  const assigneeLinks = voucher?.voucher_assignees ?? [];
  const supplierLinks = voucher?.voucher_suppliers ?? [];
  const particularsCount = isAssigneeType
    ? assigneeLinks.length
    : supplierLinks.length;

  // "Collection · Sep 15, 2026 · VOU-2026-0012" — the voucher number joins
  // the line as soon as its record is in.
  const headerLine = [subTitle, voucher?.strNumber]
    .filter(Boolean)
    .join(" · ");

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={jev?.strJEVNumber || "JEV"}
      subTitle={headerLine}
      width={{ xs: "95%", sm: 760, md: 980 }}
      contentPadding={{ xs: 1, sm: 1.5 }}
      // Viewer only — no Save, the footer's Close button ends it. The
      // spinner covers the voucher + entries fetches on the way in.
      showSave={false}
      cancelLabel="Close"
      loading={loadingVoucher}
    >
      {jev && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* ── Particulars — same block as VoucherUpdateView ─────── */}
          {voucher && (
            <Box>
              <SectionLabel>Particulars ({particularsCount})</SectionLabel>
              {isAssigneeType ? (
                <AssigneeListPanel
                  assigneeLinks={assigneeLinks}
                  voucher={voucher}
                />
              ) : (
                <POListPanel supplierLinks={supplierLinks} />
              )}
            </Box>
          )}

          {/* ── The JEV itself ────────────────────────────────────── */}
          <Box>
            <SectionLabel>Journal Entry Voucher</SectionLabel>
            <JevViewPanel key={jev.nJEVId} jev={jev} />
          </Box>
        </Box>
      )}
    </ModalContainer>
  );
}

export default JevEntriesViewModal;
