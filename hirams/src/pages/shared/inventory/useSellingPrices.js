import { useEffect, useMemo, useState } from "react";
import PricingAPI from "../../../api/endpoints/pricing.api.js";
import { hasDeliveredRows, rowTransactionId } from "./itemRows.js";

// ─────────────────────────────────────────────────────────────────────
// UNIT SELLING PRICE for the Items table.
//
// It lives nowhere near the inventory: tblitempricings.dUnitSellingPrice
// hangs off the CHOSEN pricing set of the TRANSACTION the batch was
// bought in, so it has to be walked there the same way item-purchasing's
// ArrivePanel does it —
//
//     transaction → pricing sets → the chosen one → item pricings
//
// (that is the exact chain useItemPurchasingUpdateView builds before it
// hands `purchase_option.dUnitSellingPrice` to that panel).
//
// Prices are memoised per transaction and shared by every home the
// Items table has — drill-down, entry modal, JEV viewer — so drilling
// in, opening an entry and then the reader never refetches anything.
// ─────────────────────────────────────────────────────────────────────

const priceCache = new Map(); // nTransactionId → { nTransactionItemId: price }
const inflight = new Map(); // nTransactionId → promise of the same lookup

const fetchTransactionPrices = (txnId) => {
  if (priceCache.has(txnId)) return Promise.resolve(priceCache.get(txnId));
  if (inflight.has(txnId)) return inflight.get(txnId);

  const work = (async () => {
    const sets = await PricingAPI.getPricingSets(txnId);
    const list = Array.isArray(sets) ? sets : (sets?.data ?? []);
    // Prices are only meaningful on the set the client approved —
    // without a chosen set there is nothing to read a price from.
    const chosen = (list ?? []).find((s) => Number(s?.bChosen) === 1);
    if (!chosen) return {};

    const res = await PricingAPI.getItemPricings(chosen.nPricingSetId);
    const map = {};
    (res?.itemPricings ?? []).forEach((p) => {
      const id = p?.nTransactionItemId;
      if (id == null) return;
      // null = this item has no selling price on that set yet — leave the
      // key out so the cell prints a dash instead of a ₱0.00 nobody set.
      if (p?.dUnitSellingPrice == null) return;
      // String keys: JSON ids and the ids read back off a row must meet
      // as the same type whatever shape each side arrives in.
      map[String(id)] = Number(p.dUnitSellingPrice || 0);
    });
    return map;
  })();

  inflight.set(txnId, work);
  work.then(
    (map) => {
      priceCache.set(txnId, map);
      inflight.delete(txnId);
    },
    () => {
      // Drop it from the in-flight map so a later visit can try again;
      // the table still renders with the columns showing "—".
      inflight.delete(txnId);
      console.error("Failed to load unit selling prices for", txnId);
    },
  );
  return work;
};

/**
 * Unit selling price per transaction item for the rows handed over.
 *
 * Returns `{ [nTransactionItemId]: number }`. A MISSING key means there
 * is nothing to show — no selling price on the chosen set, or the row has
 * no transaction item — which the cells print as a dash; a key holding 0
 * is a price actually stored as 0.
 *
 * Fetches nothing unless the rows include the delivered side.
 *
 * @param {Array} rows mapped inventory rows (or raw items)
 */
export default function useSellingPrices(rows = []) {
  // The joined ids ARE the identity of this lookup, so the effect can
  // depend on a primitive instead of an array rebuilt every render.
  const key = useMemo(() => {
    if (!hasDeliveredRows(rows)) return "";
    const ids = new Set();
    (rows ?? []).forEach((r) => {
      const id = rowTransactionId(r);
      if (id != null && id !== "") ids.add(String(id));
    });
    return [...ids].join("|");
  }, [rows]);

  const [prices, setPrices] = useState({});

  useEffect(() => {
    const txnIds = key ? key.split("|") : [];
    if (!txnIds.length) {
      setPrices((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }

    let alive = true;
    (async () => {
      const out = {};
      for (const txnId of txnIds) {
        try {
          Object.assign(out, await fetchTransactionPrices(txnId));
        } catch {
          // One transaction failing leaves the rest of the table usable.
        }
      }
      if (alive) setPrices((prev) => ({ ...prev, ...out }));
    })();

    return () => {
      alive = false;
    };
  }, [key]);

  return prices;
}
