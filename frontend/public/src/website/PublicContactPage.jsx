import { canRenderWebsiteDestination } from "./homePublicUtils.js";
import OfficialCommunityLinks from "./OfficialCommunityLinks.jsx";
import PublicWebsitePageShell from "./PublicWebsitePageShell.jsx";
import WebsiteDestinationLink from "./WebsiteDestinationLink.jsx";
import WebsitePlainText from "./WebsitePlainText.jsx";
import { WEBSITE_PAGE_KEYS } from "./websitePublicConstants.js";

const MANUAL_PATH = "/manual";
const KNOWLEDGE_BASE_PATH = "/knowledge-base";

export default function PublicContactPage() {
  return (
    <PublicWebsitePageShell pageKey={WEBSITE_PAGE_KEYS.CONTACT} ariaLabelKey="website.nav.contact">
      {(body) => {
        const intro = String(body.intro ?? "").trim();
        const supportEmail = String(body.supportEmail ?? "").trim();
        const showManual = body.showManualLink !== false;
        const showKnowledgeBase = body.showKnowledgeBaseLink !== false;
        const manualLabel = String(body.manualLinkLabel ?? "").trim();
        const knowledgeBaseLabel = String(body.knowledgeBaseLinkLabel ?? "").trim();
        const additionalLinks = (Array.isArray(body.links) ? body.links : []).filter((link) => {
          if (!link || typeof link !== "object") {
            return false;
          }
          if (link.visible === false) {
            return false;
          }
          return canRenderWebsiteDestination(link.label, link.url);
        });

        const showManualLink = showManual && Boolean(manualLabel);
        const showKbLink = showKnowledgeBase && Boolean(knowledgeBaseLabel);

        return (
          <div className="public-contact">
            <WebsitePlainText text={intro} className="public-contact__intro" />

            {supportEmail ? (
              <p className="public-contact__email">
                <a className="public-contact__mailto" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              </p>
            ) : null}

            {showManualLink || showKbLink || additionalLinks.length > 0 ? (
              <ul className="public-contact__links">
                {showManualLink ? (
                  <li>
                    <WebsiteDestinationLink
                      className="public-contact__link"
                      label={manualLabel}
                      destination={MANUAL_PATH}
                    />
                  </li>
                ) : null}
                {showKbLink ? (
                  <li>
                    <WebsiteDestinationLink
                      className="public-contact__link"
                      label={knowledgeBaseLabel}
                      destination={KNOWLEDGE_BASE_PATH}
                    />
                  </li>
                ) : null}
                {additionalLinks.map((link, index) => {
                  const label = String(link.label).trim();
                  const url = String(link.url).trim();
                  const key = String(link.id ?? `${label}-${index}`);
                  return (
                    <li key={key}>
                      <WebsiteDestinationLink
                        className="public-contact__link"
                        label={label}
                        destination={url}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : null}

            <OfficialCommunityLinks officialLinks={body.officialLinks} />
          </div>
        );
      }}
    </PublicWebsitePageShell>
  );
}
