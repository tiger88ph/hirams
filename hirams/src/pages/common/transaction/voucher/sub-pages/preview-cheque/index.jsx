import usePreviewCheque from "./usePreviewCheque.js";
import PreviewChequeView from "./previewChequeView.jsx";

export default function PreviewCheque() {
  const state = usePreviewCheque();
  return <PreviewChequeView {...state} />;
}