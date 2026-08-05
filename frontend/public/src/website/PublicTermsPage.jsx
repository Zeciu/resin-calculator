import PublicWebsitePageShell from "./PublicWebsitePageShell.jsx";
import WebsiteSectionBlocks from "./WebsiteSectionBlocks.jsx";
import { WEBSITE_PAGE_KEYS } from "./websitePublicConstants.js";

export default function PublicTermsPage() {
  return (
    <PublicWebsitePageShell pageKey={WEBSITE_PAGE_KEYS.TERMS} ariaLabelKey="website.nav.terms">
      {(body) => <WebsiteSectionBlocks sections={body.sections ?? []} />}
    </PublicWebsitePageShell>
  );
}
