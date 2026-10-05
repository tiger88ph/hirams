const num = (v) => Number(v) || 0;

/**
 * One transaction item can be supplied by more than one purchase item —
 * 5 from supplier A + 5 from supplier B shows as 10 on the row, and the form
 * lets the user type that combined figure.
 *
 * On submit we expand the line back out into one entry per purchase item it is
 * actually coming from, so the backend writes one inventory row per supplier
 * entry instead of over/under-stocking a single one.
 *
 * The origin PO's entry is consumed first, the remainder spills into the other
 * entries in PO order — delivering 8 from the 5 + 5 example writes 5 then 3.
 *
 * @param {Object} line  { nPurchaseItemId, nQuantity, strReceiptNumber, serials }
 * @param {Array}  pool  every purchase option the app knows about:
 *                       { nPurchaseItemId, nTransactionItemId, nPurchaseOrderId, free }
 * @returns {{ items: Array, short: number }}
 *          `items` in the same shape as `line` (one per purchase item),
 *          `short` = qty no entry could cover (0 when the split is complete).
 */
export function splitDeliveryAcrossItems(line, pool = []) {
  const qty = Math.max(Math.round(num(line?.nQuantity)), 0);
  const originId = num(line?.nPurchaseItemId);

  const origin = pool.find((o) => num(o.nPurchaseItemId) === originId);
  const tiId = origin?.nTransactionItemId;

  // Same transaction item = the same row on screen = the shared stock pool.
  const siblings =
    tiId == null
      ? []
      : pool.filter((o) => num(o?.nTransactionItemId) === num(tiId));

  // Nothing to split against (pool not loaded yet) → keep the line as typed
  // and let the backend's own per-item guard decide.
  if (!siblings.length) return { items: [{ ...line }], short: 0 };

  const ordered = [...siblings].sort((a, b) => {
    // The PO we are delivering from always burns down first.
    const mineA = num(a.nPurchaseItemId) === originId ? 0 : 1;
    const mineB = num(b.nPurchaseItemId) === originId ? 0 : 1;
    if (mineA !== mineB) return mineA - mineB;
    if (num(a.nPurchaseOrderId) !== num(b.nPurchaseOrderId))
      return num(a.nPurchaseOrderId) - num(b.nPurchaseOrderId);
    return num(a.nPurchaseItemId) - num(b.nPurchaseItemId);
  });

  const serials = Array.isArray(line?.serials) ? line.serials : [];
  const items = [];
  let left = qty;
  let serialAt = 0;

  for (const opt of ordered) {
    if (left <= 0) break;
    const take = Math.min(left, Math.max(num(opt.free), 0));
    if (take <= 0) continue;

    const slice = serials.slice(serialAt, serialAt + take);
    serialAt += take;

    items.push({
      ...line,
      nPurchaseItemId: num(opt.nPurchaseItemId),
      nQuantity: take,
      serials: slice,
    });
    left -= take;
  }

  return { items, short: left };
}
