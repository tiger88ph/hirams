import useCanvas from "./useCanvas";
import CanvasView from "./CanvasView";

export default function TransactionCanvas() {
  const props = useCanvas();
  return <CanvasView {...props} />;
}
