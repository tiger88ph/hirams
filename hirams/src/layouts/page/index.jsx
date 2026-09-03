// import { useAuth } from "../../hooks/useAuth";
import Layout1 from "./structure/Layout1/layout/Layout";
import Layout2 from "./structure/Layout2/layout/Layout";

export default function Layout() {
  // const { user } = useAuth();
  // return user?.cUserRole === "A" ? <Layout1 /> : <Layout1 />;
  return <Layout2 />;

  // return user?.cUserRole === "A" ? <HCFLayout /> : <HCFLayout />;
}
