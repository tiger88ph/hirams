// import { useAuth } from "../../hooks/useAuth";
import Layout1 from "./Layout1/layout/Layout";

export default function Layout(props) {
  // const { user } = useAuth();
  // return user?.cUserRole === "A" ? <Layout1 {...props} /> : <Layout1 {...props} />;
  return <Layout1 {...props} />;

  // return user?.cUserRole === "A" ? <HCFLayout {...props} /> : <HCFLayout {...props} />;
}
