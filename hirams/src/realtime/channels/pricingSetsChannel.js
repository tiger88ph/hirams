// pricingSetsChannel.js — Pricing Set + Item Pricing events (transaction-scoped)
import echo from "../../lib/echo.js";

export function subscribePricingSetsChannel(transactionId) {
  const channelName = `transaction.${transactionId}.pricing-sets`;
  const channel = echo.channel(channelName);

  channel.listen(".pricing-set.updated", (e) => {
    if (e.action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("pricing_set_deleted", {
          detail: { pricingSetId: e.pricingSetId },
        })
      );
    } else {
      window.dispatchEvent(new CustomEvent("pricing_set_updated", { detail: e }));
    }
  });

  // ItemPricingUpdated also broadcasts on this same channel — must listen here too
  channel.listen(".item-pricing.updated", (e) => {
    window.dispatchEvent(new CustomEvent("item_pricing_updated", { detail: e }));
  });

  return () => echo.leaveChannel(channelName);
}