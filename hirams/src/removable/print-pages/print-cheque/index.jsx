import usePrintCheque from "./usePrintCheque.js";
import PrintChequeView from "./PrintChequeView.jsx";

export default function PrintCheque() {
  const state = usePrintCheque();
  return <PrintChequeView {...state} />;
}