import PublicWebsitePageShell from "./PublicWebsitePageShell.jsx";
import WebsiteSectionBlocks from "./WebsiteSectionBlocks.jsx";
import { WEBSITE_PAGE_KEYS } from "./websitePublicConstants.js";

export default function PublicPrivacyPage() {
  return (
    <PublicWebsitePageShell pageKey={WEBSITE_PAGE_KEYS.PRIVACY} ariaLabelKey="website.nav.privacy">
      {(body) => <WebsiteSectionBlocks sections={body.sections ?? []} />}
    </PublicWebsitePageShell>
  );
}
