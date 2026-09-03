import useItemPurchasing from "./useItemPurchasing.js";
import ItemPurchasingView from "./ItemPurchasingView.jsx";

export default function ItemPurchasingContainer() {
  const itemPurchasingState = useItemPurchasing();

  return <ItemPurchasingView {...itemPurchasingState} />;
}
