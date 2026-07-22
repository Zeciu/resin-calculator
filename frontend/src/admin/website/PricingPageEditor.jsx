import StringListEditor from "../knowledgeBase/StringListEditor.jsx";
import { pricingOfferLabel } from "./websiteEditorAdapter.js";
import { moveItem } from "./websiteSectionUtils.js";

/**
 * @param {{
 *   body: Record<string, unknown>;
 *   onChange: (body: Record<string, unknown>) => void;
 *   disabled?: boolean;
 * }} props
 */
export default function PricingPageEditor({ body, onChange, disabled = false }) {
  const offers = body.offers ?? [];

  function updateOffer(index, nextOffer) {
    const nextOffers = [...offers];
    nextOffers[index] = nextOffer;
    onChange({ ...body, offers: nextOffers });
  }

  function moveBenefits(offerIndex, benefitIndex, direction) {
    const offer = offers[offerIndex];
    const nextBenefits = moveItem(offer.benefits ?? [], benefitIndex, direction);
    updateOffer(offerIndex, { ...offer, benefits: nextBenefits });
  }

  return (
    <div className="website-page-editor">
      <label className="manual-admin__field">
        <span className="manual-admin__field-label">Page title</span>
        <input
          type="text"
          value={body.publicTitle ?? ""}
          onChange={(event) => onChange({ ...body, publicTitle: event.target.value })}
          disabled={disabled}
        />
      </label>
      <label className="manual-admin__field">
        <span className="manual-admin__field-label">Introduction</span>
        <textarea
          value={body.intro ?? ""}
          onChange={(event) => onChange({ ...body, intro: event.target.value })}
          disabled={disabled}
          rows={3}
        />
      </label>
      {offers.map((offer, index) => (
        <article key={offer.id} className="website-pricing-offer" aria-label={`${pricingOfferLabel(offer.id)} plan`}>
          <h3>{pricingOfferLabel(offer.id)} plan</h3>
          <label className="manual-admin__field">
            <span className="manual-admin__field-label">Title</span>
            <input
              type="text"
              value={offer.title ?? ""}
              onChange={(event) => updateOffer(index, { ...offer, title: event.target.value })}
              disabled={disabled}
            />
          </label>
          <label className="manual-admin__field">
            <span className="manual-admin__field-label">Displayed price</span>
            <input
              type="text"
              value={offer.displayedPriceText ?? ""}
              onChange={(event) =>
                updateOffer(index, { ...offer, displayedPriceText: event.target.value })
              }
              disabled={disabled}
            />
          </label>
          <div className="website-benefits-editor">
            <StringListEditor
              label="Benefits"
              items={offer.benefits?.length ? offer.benefits : [""]}
              onChange={(benefits) => updateOffer(index, { ...offer, benefits })}
              disabled={disabled}
              addLabel="Add benefit"
            />
            <div className="website-benefits-editor__reorder">
              {(offer.benefits ?? []).map((benefit, benefitIndex) => (
                <div key={`${offer.id}-benefit-${benefitIndex}`} className="website-benefits-editor__row">
                  <span>{benefit || `Benefit ${benefitIndex + 1}`}</span>
                  <button
                    type="button"
                    aria-label={`Move benefit ${benefitIndex + 1} up`}
                    onClick={() => moveBenefits(index, benefitIndex, -1)}
                    disabled={disabled || benefitIndex === 0}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    aria-label={`Move benefit ${benefitIndex + 1} down`}
                    onClick={() => moveBenefits(index, benefitIndex, 1)}
                    disabled={disabled || benefitIndex === (offer.benefits?.length ?? 0) - 1}
                  >
                    Down
                  </button>
                </div>
              ))}
            </div>
          </div>
          <label className="manual-admin__field">
            <span className="manual-admin__field-label">CTA label</span>
            <input
              type="text"
              value={offer.ctaLabel ?? ""}
              onChange={(event) => updateOffer(index, { ...offer, ctaLabel: event.target.value })}
              disabled={disabled}
            />
          </label>
          <label className="manual-admin__field">
            <span className="manual-admin__field-label">CTA destination</span>
            <input
              type="text"
              value={offer.ctaDestination ?? ""}
              onChange={(event) =>
                updateOffer(index, { ...offer, ctaDestination: event.target.value })
              }
              disabled={disabled}
              placeholder="/register or https://..."
            />
          </label>
          <label className="website-admin__checkbox">
            <input
              type="checkbox"
              checked={offer.visible !== false}
              onChange={(event) => updateOffer(index, { ...offer, visible: event.target.checked })}
              disabled={disabled}
            />
            Show plan on page
          </label>
        </article>
      ))}
      <label className="manual-admin__field">
        <span className="manual-admin__field-label">Footnote</span>
        <textarea
          value={body.footnote ?? ""}
          onChange={(event) => onChange({ ...body, footnote: event.target.value })}
          disabled={disabled}
          rows={2}
        />
      </label>
    </div>
  );
}
