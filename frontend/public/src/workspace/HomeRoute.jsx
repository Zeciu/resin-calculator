import { useOutletContext } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import PublicHomePage from "../website/PublicHomePage.jsx";
import GuestHomeOnboarding from "./GuestHomeOnboarding.jsx";
import GuestIntro from "./GuestIntro.jsx";
import LoggedInHome from "./LoggedInHome.jsx";

export default function HomeRoute() {
  const { isAuthenticated } = useAuth();
  const { cmsHome = null } = useOutletContext() ?? {};

  let content;
  if (cmsHome) {
    content = <PublicHomePage body={cmsHome} />;
  } else if (isAuthenticated) {
    content = <LoggedInHome />;
  } else {
    content = <GuestIntro />;
  }

  return (
    <>
      {content}
      {!isAuthenticated ? <GuestHomeOnboarding /> : null}
    </>
  );
}
