import echo from "../lib/echo.js";

/**
 * Central registry for DYNAMIC (per-ID) channels — e.g.
 *   transaction.{id}.pricing-sets
 *   pricing-set.{id}.item-pricings
 *   transaction.{id}.items
 *
 * Static, app-wide channels (users, vouchers, suppliers, transactions, etc.)
 * still belong in realtime/RealtimeProvider.jsx — they don't need an ID and
 * stay subscribed for the whole app session.
 *
 * This file exists so no hook or component ever calls `echo.channel(...)`
 * directly for a per-record channel — every dynamic subscription in the app
 * goes through `subscribeDynamicChannel` below.
 *
 * ── Usage ──────────────────────────────────────────────────────────────
 * useEffect(() => {
 *   if (!transactionId) return;
 *
 *   const unsubscribe = subscribeDynamicChannel(
 *     `transaction.${transactionId}.pricing-sets`,
 *     [
 *       { event: ".pricing-set.updated", dispatch: "pricing_set_updated" },
 *       { event: ".item-pricing.updated", dispatch: "item_pricing_updated" },
 *     ],
 *   );
 *
 *   return unsubscribe;
 * }, [transactionId]);
 *
 * Then listen for the dispatched window events the same way you already do
 * for the static channels:
 *   window.addEventListener("pricing_set_updated", handler);
 *
 * ── Params ─────────────────────────────────────────────────────────────
 * channelName : string — the exact Echo channel name, e.g. "transaction.5.pricing-sets"
 * listeners   : array of { event, dispatch, transform? }
 *   event     — the broadcast event name as sent from Laravel (include the
 *               leading dot, e.g. ".pricing-set.updated", to match broadcastAs())
 *   dispatch  — the window CustomEvent name this listener will fire
 *   transform — optional function to reshape the payload before dispatching;
 *               defaults to passing the raw payload straight through as detail
 *
 * Returns an unsubscribe function — always call it in your effect's cleanup.
 */
export function subscribeDynamicChannel(channelName, listeners) {
  const channel = echo.channel(channelName);

  listeners.forEach(({ event, dispatch, transform }) => {
    channel.listen(event, (payload) => {
      const detail = transform ? transform(payload) : payload;
      window.dispatchEvent(new CustomEvent(dispatch, { detail }));
    });
  });

  return () => echo.leaveChannel(channelName);
}