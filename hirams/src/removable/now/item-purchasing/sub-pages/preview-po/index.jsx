import usePreviewPO from "./usePreviewPO.js";
import PreviewPOView from "./previewPOView.jsx";

export default function PreviewPO() {
  const state = usePreviewPO();
  return <PreviewPOView {...state} />;
}