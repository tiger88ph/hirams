const num = (v) => Number(v) || 0;

/** 0–100, two decimals, never above 100 */
export const toPercent = (n, d) =>
  d > 0 ? Math.min(100, Math.round((n / d) * 10000) / 100) : 0;

/** 0–100, whole number, never above 100 */
const wholePct = (n, d) =>
  d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0;

/* ══════════════════════════════════════════════════════════════════
   A. TRANSACTION LEVEL (For Purchase page + Transaction list)
   6-step scale: Cart=1 … Delivered=6
══════════════════════════════════════════════════════════════════ */
export const MAX_STEP = 6;

export const getOptionStep = (nStatus, option, keys) => {
  const {
    cartKey,
    forApprovalKey,
    forPaymentKey,
    pendingReceiptKey,
    forDeliveryKey,
    deliveredKey,
  } = keys;

  const ordered = num(option?.nQuantity);
  if (ordered > 0) {
    // approved only; falls back to the old A+P fields if the backend lacks them
    const delivered = Math.min(
      num(option?.nApprovedDeliveredQty ?? option?.nDeliveredQty),
      ordered,
    );
    const received = Math.min(
      num(option?.nApprovedReceivedQty ?? option?.nInventoryQty),
      ordered,
    );
    if (delivered >= ordered) return 6;
    if (delivered > 0) return 5 + delivered / ordered;
    if (received >= ordered) return 5;
    if (received > 0) return 4 + received / ordered;
  }

  if (nStatus == null) return 0;
  const order = [
    cartKey,
    forApprovalKey,
    forPaymentKey,
    pendingReceiptKey,
    forDeliveryKey,
    deliveredKey,
  ];
  const idx = order.findIndex((k) => String(nStatus) === String(k));
  return idx >= 0 ? idx + 1 : 0;
};

/* ══════════════════════════════════════════════════════════════════
   B. ITEM PURCHASING (PO card, PO stepper, option row stamps)
   Quantity-weighted, APPROVED (cStatus "A") only.
══════════════════════════════════════════════════════════════════ */

/** Sum inventory rows. sign: 1 = received, -1 = delivered. status: "A" | "P" */
export const sumInventoryRows = (rows = [], sign, status) =>
  rows
    .filter(
      (r) =>
        Math.sign(Number(r.nQuantity)) === sign &&
        String(r.cStatus || "").trim() === status,
    )
    .reduce((s, r) => s + Math.abs(Number(r.nQuantity) || 0), 0);

/**
 * ONE purchase option (one item line).
 * @param option  the purchase_option object
 * @param rows    inventory history rows for this option (optional).
 *                Without rows it uses nApprovedReceivedQty / nApprovedDeliveredQty.
 */
export const getOptionArrival = (option, rows) => {
  const ordered = num(option?.nQuantity);

  const approvedReceived = rows
    ? sumInventoryRows(rows, 1, "A")
    : num(option?.nApprovedReceivedQty);
  const approvedDelivered = rows
    ? sumInventoryRows(rows, -1, "A")
    : num(option?.nApprovedDeliveredQty);
  const pendingReceived = rows ? sumInventoryRows(rows, 1, "P") : 0;
  const pendingDelivered = rows ? sumInventoryRows(rows, -1, "P") : 0;

  const received = Math.min(approvedReceived, ordered); // capped
  const delivered = Math.min(approvedDelivered, ordered); // capped

  return {
    ordered,
    received,
    delivered,
    receivedPct: wholePct(received, ordered),
    deliveredPct: wholePct(delivered, ordered),
    allReceived: ordered > 0 && received >= ordered,
    allDelivered: ordered > 0 && delivered >= ordered,
    // uncapped, for the approved/pending breakdown in CartRowPanel
    approvedReceived,
    approvedDelivered,
    pendingReceived,
    pendingDelivered,
  };
};

/**
 * WHOLE PO = sum of items, weighted by quantity:
 *   Σ min(approved, ordered) / Σ ordered
 * @param poOptions   po.purchase_order_options (each has .purchase_option)
 * @param rowsByItem  { [nPurchaseItemId]: inventoryRows[] } (optional)
 */
export const getPoArrival = (poOptions = [], rowsByItem = {}) => {
  let ordered = 0,
    received = 0,
    delivered = 0;

  poOptions.forEach((o) => {
    const p = o.purchase_option ?? o;
    const a = getOptionArrival(p, rowsByItem[p?.nPurchaseItemId]);
    ordered += a.ordered;
    received += a.received;
    delivered += a.delivered;
  });

  return {
    ordered,
    received,
    delivered,
    receivedPct: wholePct(received, ordered),
    deliveredPct: wholePct(delivered, ordered),
    allReceived: ordered > 0 && received >= ordered,
    allDelivered: ordered > 0 && delivered >= ordered,
  };
};

/** RCVD / DLVRD stamps for the card header. pct = null when 100%. */
export const getArrivalBadges = (a) => {
  const badges = [];
  if (a.received > 0 || a.delivered > 0) {
    if (!a.allReceived || a.delivered === 0)
      badges.push({ type: "RCVD", pct: a.allReceived ? null : a.receivedPct });
    if (a.delivered > 0)
      badges.push({ type: "DLVRD", pct: a.allDelivered ? null : a.deliveredPct });
  }
  return badges;
};

/** Partial ring for the stepper: step 4 = For Delivery (received), 5 = Delivered */
export const getPartialForStep = (a, stepIndex) => {
  if (stepIndex === 4 && a.receivedPct > 0 && a.receivedPct < 100)
    return { pct: a.receivedPct, sub: `${a.received}/${a.ordered} rcvd` };
  if (stepIndex === 5 && a.deliveredPct > 0 && a.deliveredPct < 100)
    return { pct: a.deliveredPct, sub: `${a.delivered}/${a.ordered} dlvd` };
  return null;
};