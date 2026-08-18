import { ROUTES } from "../workspace/routes.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import PublicWebsitePageShell from "./PublicWebsitePageShell.jsx";
import WebsiteDestinationLink from "./WebsiteDestinationLink.jsx";
import WebsitePlainText from "./WebsitePlainText.jsx";
import { WEBSITE_PAGE_KEYS } from "./websitePublicConstants.js";

const PRICING_OFFER_ORDER = ["free", "monthly", "annual"];

/**
 * Product-approved public CTAs for fixed Pricing offers.
 * Editorial fields (title, price, benefits, visibility) still come from CMS.
 * Destinations guide into app workflows only — no Stripe/billing/entitlements.
 */
const PRICING_OFFER_CTA_DESTINATIONS = {
  free: {
    destination: ROUTES.REGISTER,
  },
  monthly: {
    destination: ROUTES.ACCOUNT,
  },
  annual: {
    destination: ROUTES.ACCOUNT,
  },
};

/**
 * @param {Array<Record<string, unknown>>} offers
 */
export function orderVisiblePricingOffers(offers) {
  const byId = new Map(
    (Array.isArray(offers) ? offers : [])
      .filter((offer) => offer && typeof offer === "object")
      .map((offer) => [String(offer.id), offer]),
  );

  return PRICING_OFFER_ORDER.map((id) => byId.get(id))
    .filter(Boolean)
    .filter((offer) => offer.visible !== false);
}

/**
 * @param {unknown} offerId
 * @returns {{ label: string; destination: string } | null}
 */
export function resolvePublicPricingCtaDestination(offerId) {
  return PRICING_OFFER_CTA_DESTINATIONS[String(offerId)]?.destination ?? null;
}

export default function PublicPricingPage() {
  const { t } = useI18n();

  return (
    <PublicWebsitePageShell pageKey={WEBSITE_PAGE_KEYS.PRICING} ariaLabelKey="website.nav.pricing">
      {(body) => {
        const intro = String(body.intro ?? "").trim();
        const footnote = String(body.footnote ?? "").trim();
        const offers = orderVisiblePricingOffers(body.offers);

        return (
          <div className="public-pricing">
            <WebsitePlainText text={intro} className="public-pricing__intro" />

            {offers.length > 0 ? (
              <div className="public-pricing__grid">
                {offers.map((offer) => {
                  const title = String(offer.title ?? "").trim();
                  const price = String(offer.displayedPriceText ?? "").trim();
                  const benefits = Array.isArray(offer.benefits)
                    ? offer.benefits.map((item) => String(item ?? "").trim()).filter(Boolean)
                    : [];
                  const offerId = String(offer.id);
                  const isAnnual = offerId === "annual";
                  const ctaDestination = resolvePublicPricingCtaDestination(offerId);
                  const periodKey = offerId === "monthly" ? "website.pricing.perMonth" : "website.pricing.perYear";

                  return (
                    <article
                      key={offerId}
                      className={`public-pricing__card${isAnnual ? " public-pricing__card--annual" : ""}`}
                      aria-label={title || offerId}
                      data-offer-id={offerId}
                    >
                      <div className="public-pricing__card-header">
                        {title ? <h2 className="public-pricing__card-title">{title}</h2> : null}
                        {isAnnual ? (
                          <p className="public-pricing__badge">{t("website.pricing.bestValue")}</p>
                        ) : null}
                      </div>
                      <p className="public-pricing__positioning">
                        {t(`website.pricing.${offerId}Description`)}
                      </p>
                      {price ? (
                        <p className="public-pricing__card-price">
                          <span>{price}</span>
                          {offerId !== "free" ? (
                            <span className="public-pricing__period">{t(periodKey)}</span>
                          ) : null}
                        </p>
                      ) : null}
                      {isAnnual ? (
                        <p className="public-pricing__savings">{t("website.pricing.save25")}</p>
                      ) : null}
                      {benefits.length > 0 ? (
                        <ul className="public-pricing__benefits">
                          {benefits.map((benefit) => (
                            <li key={`${offer.id}-${benefit}`}>{benefit}</li>
                          ))}
                        </ul>
                      ) : null}
                      {ctaDestination ? (
                        <WebsiteDestinationLink
                          className="public-pricing__cta"
                          label={t(`website.pricing.${offerId}Cta`)}
                          destination={ctaDestination}
                        />
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div
                className="public-pricing__empty"
                role="status"
                data-offers-empty="true"
              />
            )}

            <aside className="public-pricing__trust-strip">
              <p className="public-pricing__trust-title">{t("website.pricing.trustTitle")}</p>
              <WebsitePlainText text={footnote} className="public-pricing__footnote" />
            </aside>
          </div>
        );
      }}
    </PublicWebsitePageShell>
  );
}
