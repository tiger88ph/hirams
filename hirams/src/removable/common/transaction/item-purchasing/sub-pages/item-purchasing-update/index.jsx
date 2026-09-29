
import useItemPurchasingUpdateView from "./useItemPurchasingUpdateView.js";
import ItemPurchasingUpdateView from "./ItemPurchasingUpdateView.jsx";

export default function ItemPurchasingUpdateContainer() {
  const itemPurchasingUpdateState = useItemPurchasingUpdateView();

  return <ItemPurchasingUpdateView {...itemPurchasingUpdateState} />;
}