export const calculateEWT = (
  quantity,
  unitPrice,
  supplier,
  cItemType,
  itemTypeMapping,
  vaGoSeValueMapping
) => {
  const qty = Number(quantity || 0);
  const price = Number(unitPrice || 0);
  const totalCost = qty * price;

  // If supplier is not EWT-applicable → no computation needed
  if (!supplier || Number(supplier.bEWT) !== 1) return 0;

  // Extract mapping keys:
  // Example:
  // itemTypeMapping = { G: "Goods" } → itemTypeKey = "G"
  // goodsValueMapping = { "0.01": "1%" } → goodsRate = 0.01
  // serviceValueMapping = { "0.02": "2%" } → serviceRate = 0.02
  // vatValueMapping = { "1.12": "Vat" } → vatDivisor = 1.12
  const itemTypeKey = Object.keys(itemTypeMapping)[0];
  const goodsRate = Number(Object.keys(vaGoSeValueMapping)[1]);
  const serviceRate = Number(Object.keys(vaGoSeValueMapping)[2]);
  const vatDivisor = Number(Object.keys(vaGoSeValueMapping)[0]);

  // Determine the correct EWT rate:
  // If cItemType matches the item type key ("G"), apply Goods rate
  // Otherwise apply Service rate
  const rate = cItemType === itemTypeKey ? goodsRate : serviceRate;

  // Determine base amount:
  // If supplier has VAT → EWT is computed on NET amount (gross / 1.12)
  // If supplier has NO VAT → EWT is computed on full amount (gross)
  const baseAmount =
    Number(supplier.bVAT) === 1 ? totalCost / vatDivisor : totalCost;

  // Final EWT calculation
  const ewt = baseAmount * rate;

  // Round to 2 decimals
  return Number(ewt.toFixed(2));
};
