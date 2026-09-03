import useForJev from "./useForJev";
import ForJevView from "./ForJevView";

export default function ForJev() {
  const props = useForJev();
  return <ForJevView {...props} />;
}