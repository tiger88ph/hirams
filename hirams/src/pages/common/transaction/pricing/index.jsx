import usePricing from "./usePricing";
import PricingView from "./PricingView";

export default function TransactionPricing() {
  const props = usePricing();
  return <PricingView {...props} />;
}
