import usePricingSet from "./usePricingSet";
import PricingSetView from "./PricingSetView";

export default function TransactionPricingSet() {
  const props = usePricingSet();
  return <PricingSetView {...props} />;
}
