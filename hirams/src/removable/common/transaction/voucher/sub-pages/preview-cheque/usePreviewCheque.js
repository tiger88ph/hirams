import { useLocation } from "react-router-dom";
import { numberToWords } from "../../../../../../utils/helpers/numberToWords.js";

// Formats a Date as "MMDDYYYY" (digits only) for the cheque date boxes.
function toDigitDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}${dd}${yyyy}`;
}

export default function usePreviewCheque() {
  const location = useLocation();
  const { cheque, payeeName, amount } = location.state || {};

  const chequeAmount = Number(amount ?? cheque?.dAmount ?? 0);
  const chequeDate = cheque?.dtChequeDate
    ? new Date(cheque.dtChequeDate)
    : new Date();

  return {
    date: toDigitDate(chequeDate),
    payeeName: payeeName ?? "—",
    amount: chequeAmount,
    amountInWords: numberToWords(chequeAmount),
  };
}