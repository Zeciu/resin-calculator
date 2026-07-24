import { useI18n } from "../i18n/I18nContext.jsx";
import { isSafeExternalWebsiteUrl } from "./homePublicUtils.js";
import { OFFICIAL_LINK_ICONS } from "./OfficialLinkIcons.jsx";
import { resolveOfficialCommunityLinks } from "./websiteOfficialLinks.js";

/**
 * Horizontal official community icon links for Contact.
 *
 * @param {{ officialLinks?: unknown }} props
 */
export default function OfficialCommunityLinks({ officialLinks }) {
  const { t } = useI18n();
  const links = resolveOfficialCommunityLinks(officialLinks, isSafeExternalWebsiteUrl);

  if (links.length === 0) {
    return null;
  }

  return (
    <section className="public-contact__community" aria-labelledby="public-contact-community-heading">
      <h2 id="public-contact-community-heading" className="public-contact__community-title">
        {t("website.contact.communityTitle")}
      </h2>
      <p className="public-contact__community-intro">{t("website.contact.communityIntro")}</p>
      <ul className="public-contact__community-list">
        {links.map((link) => {
          const Icon = OFFICIAL_LINK_ICONS[link.key];
          return (
            <li key={link.key}>
              <a
                className="public-contact__community-link"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                data-official-link={link.key}
              >
                {Icon ? <Icon /> : null}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
