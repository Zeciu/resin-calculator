import { useAuth } from "../auth/useAuth.js";
import GuestIntro from "./GuestIntro.jsx";
import LoggedInHome from "./LoggedInHome.jsx";

export default function HomeRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <LoggedInHome />;
  }

  return <GuestIntro />;
}
