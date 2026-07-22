import PublicWebsitePageShell from "./PublicWebsitePageShell.jsx";
import WebsiteSectionBlocks from "./WebsiteSectionBlocks.jsx";
import { WEBSITE_PAGE_KEYS } from "./websitePublicConstants.js";

export default function PublicAboutPage() {
  return (
    <PublicWebsitePageShell pageKey={WEBSITE_PAGE_KEYS.ABOUT} ariaLabelKey="website.nav.about">
      {(body) => (
        <WebsiteSectionBlocks sections={body.sections ?? []} withSectionImages />
      )}
    </PublicWebsitePageShell>
  );
}
