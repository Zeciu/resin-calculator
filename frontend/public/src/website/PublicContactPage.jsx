import { useI18n } from "../i18n/I18nContext.jsx";
import { canRenderWebsiteDestination } from "./homePublicUtils.js";
import { partitionContactIntro } from "./contactIntroLayout.js";
import OfficialCommunityLinks from "./OfficialCommunityLinks.jsx";
import PublicWebsitePageShell from "./PublicWebsitePageShell.jsx";
import WebsiteDestinationLink from "./WebsiteDestinationLink.jsx";
import { WEBSITE_PAGE_KEYS } from "./websitePublicConstants.js";

const MANUAL_PATH = "/manual";
const KNOWLEDGE_BASE_PATH = "/knowledge-base";

export default function PublicContactPage() {
  const { t } = useI18n();
  return (
    <PublicWebsitePageShell pageKey={WEBSITE_PAGE_KEYS.CONTACT} ariaLabelKey="website.nav.contact">
      {(body) => {
        const intro = String(body.intro ?? "").trim();
        const publicTitle = String(body.publicTitle ?? "").trim();
        const { lead, resources, feedbackBlocks } = partitionContactIntro(intro, publicTitle);
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
        const showResourceLinks = showManualLink || showKbLink || additionalLinks.length > 0;

        return (
          <div className="public-contact">
            {lead.body ? <p className="public-contact__lead">{lead.body}</p> : null}

            {supportEmail ? (
              <section className="public-contact__direct" aria-labelledby="public-contact-write-heading">
                <h2 id="public-contact-write-heading" className="public-contact__direct-title">
                  {t("website.contact.writeToUs")}
                </h2>
                <a className="public-contact__mailto" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              </section>
            ) : null}

            {resources || showResourceLinks ? (
              <section
                className="public-contact__resources"
                aria-labelledby={resources?.heading ? "public-contact-resources-heading" : undefined}
              >
                {resources?.heading ? (
                  <h2 id="public-contact-resources-heading" className="public-contact__resources-title">
                    {resources.heading}
                  </h2>
                ) : null}
                {resources?.body ? (
                  <p className="public-contact__resources-body">{resources.body}</p>
                ) : null}
                {showResourceLinks ? (
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
              </section>
            ) : null}

            {feedbackBlocks.length > 0 ? (
              <aside className="public-contact__feedback">
                {feedbackBlocks.map((block, index) => (
                  <div key={`${block.heading}-${index}`} className="public-contact__feedback-block">
                    {block.heading ? (
                      <h3 className="public-contact__feedback-title">{block.heading}</h3>
                    ) : null}
                    {block.body ? <p className="public-contact__feedback-body">{block.body}</p> : null}
                  </div>
                ))}
              </aside>
            ) : null}

            <OfficialCommunityLinks officialLinks={body.officialLinks} />
          </div>
        );
      }}
    </PublicWebsitePageShell>
  );
}
