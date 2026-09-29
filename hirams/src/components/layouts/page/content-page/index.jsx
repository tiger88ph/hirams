
import Layout2 from "./layouts/Layout2";

const LAYOUTS = {
//   layout1: Layout1,
  layout2: Layout2,
};

export default function PageLayout({ layout = "layout2", ...props }) {
  const PageLayout = LAYOUTS[layout] || Layout2;
  return <PageLayout {...props} />;
}