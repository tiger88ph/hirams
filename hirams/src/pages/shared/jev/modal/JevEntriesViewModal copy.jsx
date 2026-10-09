import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import ModalContainer from "../../../../components/layouts/modal/ModalContainer.jsx";
import JevViewPanel from "../components/JevViewPanel.jsx";
import POListPanel from "../../voucher/components/POListPanel.jsx";
import AssigneeListPanel from "../../voucher/components/AssigneeListPanel.jsx";
import { SectionLabel } from "../../voucher/sub-pages/voucher-update/VoucherUpdateView.jsx";
import VoucherAPI from "../../../../api/endpoints/voucher.api.js";
import InventoryAPI from "../../../../api/endpoints/inventory.api.js";
import ItemsTable from "../../inventory/component/ItemsTable.jsx";
import { mapInventoryItems, itemTotal, isDeliveredRow } from "../../inventory/itemRows.js";
import useSellingPrices from "../../inventory/useSellingPrices.js";

/**
 * Viewer for ONE JEV — opened from the Account Report's "JEV No." column
 * and from the JEV list page (see AccountReportPanel / JevListView).
 *
 * Laid out exactly like VoucherUpdateView: a top block first
 * (SectionLabel + POListPanel / AssigneeListPanel with their Grand Total
 * footer), then "Journal Entry Voucher" over the From / To columns of
 * JevViewPanel — the same component the voucher and purchase pages use.
 *
 * What the top block holds depends on what the JEV was made from:
 *
 *   • V / C types → the voucher's Particulars, loaded on open and cached
 *     per JEV id so revisiting an entry costs no request. Only printed
 *     when it has rows: an empty POListPanel is never useful.
 *   • R / D types (Received Purchases / Delivered Items) → NO voucher
 *     exists behind them, so the block is the inventory Items table —
 *     the same table the inventory drill-down and its entry modal show.
 *     R lists the batches this JEV actually covers (its total is what
 *     the entries reconcile against); D lists the WHOLE delivered group
 *     — every delivered batch of the same client + company — because
 *     that is what JevEntryAEModal puts in front of the same JEV.
 *
 * Entries are MANAGED only where the caller says so: `entryCrud` is
 * passed by the JEV list page as { isManagement, isFinanceOfficer }, and
 * it both unlocks the Add / Edit / Delete Entry controls and lifts
 * JevViewPanel's pending-only status gate — on the list page an entry can
 * be managed whatever the JEV's status is (the ACTIVE protection there
 * applies to deleting the JEV itself, see JevListView). Left as null —
 * the account report, inventory and purchase viewers — nothing renders
 * and the panel stays the read-only thing a report opens to be read.
 *
 * Adding or editing an entry never opens a SECOND modal over this one:
 * JevViewPanel is told to render the form in the place of its From / To
 * columns (inlineEntryForm). While it is up this panel drops its
 * "Journal Entry Voucher" heading and turns its OWN footer into the
 * form's — Back / Save come from onEntryFormChange — so saving or
 * cancelling puts both back.
 *
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
function JevEntriesViewModal({
  open,
  onClose,
  jev = null,
  subTitle = "",
  entryCrud = null,
}) {
  const jevId = jev?.nJEVId ? String(jev.nJEVId) : "";

  // ── Inline entry form ──────────────────────────────────────────────
  // Adding / editing an entry does NOT open a second modal over this
  // one: JevViewPanel swaps its From / To columns for the form and
  // publishes its buttons through onEntryFormChange. `entryForm` is
  // null while the JEV is simply being read; while it holds a value
  // this modal's OWN footer turns into the form's — Back cancels (and
  // puts the "Journal Entry Voucher" heading back), Save runs the
  // panel's save. Saving or cancelling restores everything.
  const [entryForm, setEntryForm] = useState(null);

  useEffect(() => {
    if (!open) setEntryForm(null);
  }, [open]);

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

  // ── Inventory-backed JEVs ──────────────────────────────────────────
  // R (Received Purchases) and D (Delivered Items) are stamped onto
  // inventory rows by InventoryController::bulkCreateJev — there is no
  // voucher for them, so their top block is that Items table instead.
  // An absent/unknown type still looks: an empty result renders nothing.
  const linkType = String(jev?.cJEVLinkType ?? "").toUpperCase();
  const isInventoryBacked = !linkType || linkType === "R" || linkType === "D";

  // null = not fetched yet (the guard that stops the effect looping).
  // Cached for the modal's lifetime, same as the voucher above.
  const [inventory, setInventory] = useState(null);
  const [loadingInventory, setLoadingInventory] = useState(false);

  useEffect(() => {
    if (!open || !jevId || !isInventoryBacked) return;
    if (inventory !== null) return;

    let cancelled = false;
    (async () => {
      setLoadingInventory(true);
      try {
        const res = await InventoryAPI.getInventory();
        if (!cancelled) setInventory(res?.inventories ?? []);
      } catch (err) {
        console.error("Failed to load the inventory behind this JEV:", err);
        if (!cancelled) setInventory([]);
      } finally {
        if (!cancelled) setLoadingInventory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, jevId, isInventoryBacked, inventory]);

  // Every inventory row this JEV actually covers: the pending batches
  // before it is finalized, the API's already-aggregated 'A' entry after.
  // (A D JEV is the exception — it widens to its whole delivered group,
  // see the branch below.)
  // Rows cancelled later keep their nJEVId and stay listed — dropping them
  // would silently shrink the total this JEV was built on.
  //
  // An aggregated entry (Stock / Delivered) sums several rows that can
  // carry DIFFERENT JEVs — a received batch paid by voucher gets the V
  // JEV, a later one its own R JEV — and only the FIRST row's id sits on
  // nJEVId, so nJEVIds (every JEV of the rows behind the entry) has to be
  // consulted too or that JEV's Items block comes up empty.
  const itemRows = useMemo(() => {
    if (!jevId || !isInventoryBacked || !inventory) return [];

    const idsOf = (i) =>
      Array.isArray(i.nJEVIds) && i.nJEVIds.length
        ? i.nJEVIds.map(String)
        : [String(i.nJEVId ?? "")];

    const matched = inventory.filter((i) => idsOf(i).includes(jevId));

    // ── D (Delivered Items) ─────────────────────────────────────────
    // The WHOLE delivered group, never just this JEV's own rows — the
    // very table JevEntryAEModal shows for the same JEV (PendingInventory
    // builds that one from the open group: every delivered batch of the
    // same client + company). bulkCreateJev stamps ONE JEV per purchase
    // item, so scoping to `matched` alone listed only one item of a
    // two-item group while the entry modal beside it listed both.
    //
    // The group is keyed off the rows this JEV covers (same client, same
    // company); the rows this JEV itself carries are always kept, so a
    // batch booked under another JEV of the group can never drop out.
    // Direction guard, delivered side: a Delivered entry also lists the
    // purchase's R JEV (so the item details can show it) — those rows are
    // not part of a D JEV's own table. isDeliveredRow knows both shapes:
    // raw rows by their negative qty, the aggregated one by its 'D'
    // status (its qty is already abs).
    if (linkType === "D") {
      const seed = matched.find((i) => isDeliveredRow({ _raw: i }));
      if (!seed) return []; // nothing delivered carries this JEV
      const client = String(seed.strClientNickName ?? "—");
      const company = String(seed.strCompanyNickName ?? "—");
      const ownIds = new Set(matched.map((i) => i.nInventoryId));

      return mapInventoryItems(
        inventory.filter(
          (i) =>
            isDeliveredRow({ _raw: i }) &&
            (ownIds.has(i.nInventoryId) ||
              (String(i.strClientNickName ?? "—") === client &&
                String(i.strCompanyNickName ?? "—") === company)),
        ),
      );
    }

    // ── R (Received Purchases), and an absent/unknown type ──────────
    // Everything still carrying this JEV is the RECEIVED side: pending
    // and cancelled batches as they are, plus — once the purchase item is
    // approved — the aggregates getInventory folds it into:
    //
    //   Stock     = what is still on hand   (positive rows, net of…)
    //   Delivered = what has since gone out (the negative rows)
    //
    // The Delivered aggregate MUST stay in: it lists this R JEV because
    // its goods were received under it, and dropping it emptied this
    // block twice over —
    //   • fully delivered: getInventory emits NO Stock entry at all
    //     (stockQty is 0), so the Delivered one was the only row left
    //     and an R JEV showed no Items table while the D JEV beside it
    //     did;
    //   • partially delivered: the block was short everything that had
    //     gone out, so its total no longer matched the amount the JEV
    //     was booked for.
    //
    // Stock + Delivered of ONE purchase item IS the quantity received,
    // so the two aggregates are merged back into a single row — one
    // batch, received quantity, listed once instead of split in two.
    const rows = [];
    const aggregateAt = new Map(); // nPurchaseItemId → slot in `rows`
    matched.forEach((i) => {
      const isAggregate = i.cStatus === "S" || i.cStatus === "D";
      if (!isAggregate) {
        rows.push(i);
        return;
      }

      const key = String(i.nPurchaseItemId ?? i.nInventoryId);
      const at = aggregateAt.get(key);
      if (at === undefined) {
        aggregateAt.set(key, rows.length);
        rows.push(i);
        return;
      }

      const prev = rows[at];
      // Prefer the Stock entry as the base: it carries the received rows.
      const base = prev.cStatus === "S" ? prev : i;
      rows[at] = {
        ...base,
        nQuantity: Number(prev.nQuantity ?? 0) + Number(i.nQuantity ?? 0),
        nInventoryIds: [
          ...(prev.nInventoryIds ?? []),
          ...(i.nInventoryIds ?? []),
        ],
        nJEVIds: [...new Set([...(prev.nJEVIds ?? []), ...(i.nJEVIds ?? [])])],
      };
    });

    return mapInventoryItems(rows);
  }, [inventory, jevId, isInventoryBacked, linkType]);

  // An R JEV's table is the RECEIVED side: its rows are valued at cost,
  // so the selling columns — which only mean something once a batch has
  // gone OUT — stay hidden even when the batch shown is one that has
  // since been delivered. No prices are fetched for it either.
  const isReceivedSide = linkType === "R";

  const itemsTotal = useMemo(
    () => itemRows.reduce((sum, r) => sum + itemTotal(r), 0),
    [itemRows],
  );

  // Unit selling price for a DELIVERED JEV's table — resolves through the
  // chosen pricing set of each row's transaction (see useSellingPrices).
  // A received JEV fetches nothing here: the table hides those columns
  // (isReceivedSide), so handing it an empty list keeps the lookup off.
  const sellingPrices = useSellingPrices(isReceivedSide ? [] : itemRows);

  // Same rule VoucherUpdateView uses to pick its particulars panel.
  const isAssigneeType =
    (voucher?.voucher_assignees?.length ?? 0) > 0 &&
    !(voucher?.voucher_suppliers?.length > 0);
  const assigneeLinks = voucher?.voucher_assignees ?? [];
  const supplierLinks = voucher?.voucher_suppliers ?? [];
  const particularsCount = isAssigneeType
    ? assigneeLinks.length
    : supplierLinks.length;

  // Only print a Particulars block that has rows in it — an empty panel
  // tells the reader nothing about what this JEV covers.
  const showParticulars = Boolean(voucher) && particularsCount > 0;

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
      // Viewer only: the footer is a single Close — until an entry is
      // being added or edited, when the very same footer becomes the
      // form's (Back / Save). Enter follows onSave too, so the keyboard
      // works exactly as it did in the entry modal.
      showSave={!!entryForm}
      saveLabel={entryForm?.isEdit ? "Update Entry" : "Save Entry"}
      onSave={entryForm?.save}
      cancelLabel={entryForm ? "Back" : "Close"}
      onCancel={entryForm ? entryForm.cancel : undefined}
      disabled={!!entryForm?.saving}
      // Spinner over the voucher + inventory fetches on the way in, and
      // over the entry save while it runs.
      loading={loadingVoucher || loadingInventory || !!entryForm?.saving}
    >
      {jev && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* ── Particulars — same block as VoucherUpdateView ─────── */}
          {showParticulars && (
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

          {/* ── Items — the batches an inventory JEV covers (a D JEV:
              its whole delivered group, as the entry modal shows) ── */}
          {itemRows.length > 0 && (
            <Box>
              <SectionLabel>Items ({itemRows.length})</SectionLabel>
              <ItemsTable
                rows={itemRows}
                total={itemsTotal}
                sellingPrices={sellingPrices}
                // Received batches are priced at COST: a batch that has
                // since gone out still belongs in this table, but the
                // selling columns stay the delivered side's own.
                showSellingOverride={isReceivedSide ? false : null}
              />
            </Box>
          )}

          {/* ── The JEV itself ────────────────────────────────────── */}
          <Box>
            {/* Hidden while the entry form stands in for the columns —
                the form IS this section then (entryForm is set). */}
            {!entryForm && (
              <SectionLabel>Journal Entry Voucher</SectionLabel>
            )}
            <JevViewPanel
              key={jev.nJEVId}
              jev={jev}
              // The amount this JEV's entries must reconcile against —
              // the same figure the Items block prints as its total
              // (for a D JEV: the delivered group's, which the panel
              // never caps an R/D entry with anyway).
              particularsGrandTotal={itemsTotal}
              // Entry CRUD, opt-in per the header comment. With
              // entryCrud left null both roles stay undefined and the
              // panel renders no Add / Edit / Delete Entry at all.
              isManagement={entryCrud?.isManagement}
              isFinanceOfficer={entryCrud?.isFinanceOfficer}
              // …and where it IS enabled, entries are managed whatever
              // the status is (undefined → the panel's pending-only).
              entryStatusGate={entryCrud ? "all" : undefined}
              // No nested modal here: the form takes the columns' place
              // and publishes its Back / Save buttons to this modal's
              // footer through onEntryFormChange.
              inlineEntryForm
              onEntryFormChange={setEntryForm}
              // The voucher's own particulars, loaded above — handed on
              // so the Add / Edit Entry modal shows the real thing
              // instead of an empty panel (JevViewPanel forwards all
              // three straight to JevEntryAEModal).
              isAssigneeType={isAssigneeType}
              assigneeLinks={assigneeLinks}
              supplierLinks={supplierLinks}
            />
          </Box>
        </Box>
      )}
    </ModalContainer>
  );
}

export default JevEntriesViewModal;
