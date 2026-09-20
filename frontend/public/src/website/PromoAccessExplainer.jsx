export default function PromoAccessExplainer({ t, className }) {
  return (
    <div className={className}>
      <p className="promo-access-explainer__lead">{t("website.pricing.promoLead")}</p>
      <p className="promo-access-explainer__body">{t("website.pricing.promoBody")}</p>
    </div>
  );
}
