import { ROUTES } from "../workspace/routes.js";
import PublicWebsitePageShell from "./PublicWebsitePageShell.jsx";
import WebsiteDestinationLink from "./WebsiteDestinationLink.jsx";
import { WEBSITE_PAGE_KEYS } from "./websitePublicConstants.js";

const PRICING_OFFER_ORDER = ["free", "subscriber", "lifetime"];

/**
 * Product-approved public CTAs for fixed Pricing offers.
 * Editorial fields (title, price, benefits, visibility) still come from CMS.
 * Destinations guide into app workflows only — no Stripe/billing/entitlements.
 */
const PRICING_OFFER_CTAS = {
  free: {
    label: "Start Free",
    destination: ROUTES.REGISTER,
  },
  subscriber: {
    label: "Subscribe",
    destination: ROUTES.ACCOUNT,
  },
  lifetime: {
    label: "Buy Lifetime",
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
export function resolvePublicPricingCta(offerId) {
  return PRICING_OFFER_CTAS[String(offerId)] ?? null;
}

export default function PublicPricingPage() {
  return (
    <PublicWebsitePageShell pageKey={WEBSITE_PAGE_KEYS.PRICING} ariaLabelKey="website.nav.pricing">
      {(body) => {
        const intro = String(body.intro ?? "").trim();
        const footnote = String(body.footnote ?? "").trim();
        const offers = orderVisiblePricingOffers(body.offers);

        return (
          <div className="public-pricing">
            {intro ? <p className="public-pricing__intro">{intro}</p> : null}

            {offers.length > 0 ? (
              <div className="public-pricing__grid">
                {offers.map((offer) => {
                  const title = String(offer.title ?? "").trim();
                  const price = String(offer.displayedPriceText ?? "").trim();
                  const benefits = Array.isArray(offer.benefits)
                    ? offer.benefits.map((item) => String(item ?? "").trim()).filter(Boolean)
                    : [];
                  const cta = resolvePublicPricingCta(offer.id);

                  return (
                    <article
                      key={String(offer.id)}
                      className="public-pricing__card"
                      aria-label={title || String(offer.id)}
                      data-offer-id={String(offer.id)}
                    >
                      {title ? <h2 className="public-pricing__card-title">{title}</h2> : null}
                      {price ? <p className="public-pricing__card-price">{price}</p> : null}
                      {benefits.length > 0 ? (
                        <ul className="public-pricing__benefits">
                          {benefits.map((benefit) => (
                            <li key={`${offer.id}-${benefit}`}>{benefit}</li>
                          ))}
                        </ul>
                      ) : null}
                      {cta ? (
                        <WebsiteDestinationLink
                          className="public-pricing__cta"
                          label={cta.label}
                          destination={cta.destination}
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

            {footnote ? <p className="public-pricing__footnote">{footnote}</p> : null}
          </div>
        );
      }}
    </PublicWebsitePageShell>
  );
}
