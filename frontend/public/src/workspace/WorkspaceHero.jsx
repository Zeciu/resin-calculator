import { Box, Hexagon, MousePointer2, Ruler } from "lucide-react";
import { useI18n } from "../i18n/I18nContext.jsx";
import { canRenderHomeImage } from "../website/homePublicUtils.js";

/**
 * @param {{
 *   marketing?: {
 *     publicTitle?: string;
 *     subtitle?: string;
 *     image?: { src?: string; alt?: string; visible?: boolean };
 *   } | null;
 * }} props
 */
export default function WorkspaceHero({ marketing = null }) {
  const { t } = useI18n();
  const useCms = Boolean(marketing);
  const headline = useCms ? String(marketing.publicTitle ?? "").trim() : t("hero.headline");
  const subtitle = useCms ? String(marketing.subtitle ?? "").trim() : t("hero.subtitle");
  const showImage = useCms && canRenderHomeImage(marketing.image);

  return (
    <div className="workspace-hero">
      <div className="workspace-hero__brand">
        <img
          className="workspace-hero__logo"
          src="/hefzech-logo.png"
          alt="HEFZECH logo"
        />
      </div>
      <div className="workspace-hero__content">
        <p className="workspace-hero__name">HFZWood</p>
        <h1 className="workspace-hero__headline">{headline}</h1>
        {subtitle ? <p className="workspace-hero__subtitle">{subtitle}</p> : null}
        {showImage ? (
          <img
            className="workspace-hero__image"
            src={String(marketing.image.src).trim()}
            alt={String(marketing.image.alt ?? "").trim()}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </div>
      <aside className="workspace-hero__estimate" aria-label="Resin Estimate">
        <div className="workspace-hero__estimate-header">
          <span className="workspace-hero__estimate-pointer">
            <MousePointer2 aria-hidden="true" />
          </span>
          <strong>Resin Estimate</strong>
        </div>
        <div className="workspace-hero__estimate-result">
          <Hexagon aria-hidden="true" />
          <p><strong>5.42</strong> <span>L</span></p>
        </div>
        <div className="workspace-hero__estimate-depth">
          <Ruler aria-hidden="true" />
          <span>Estimate for 10 mm depth</span>
        </div>
        <div className="workspace-hero__estimate-material">
          <Box aria-hidden="true" />
        </div>
      </aside>
    </div>
  );
}
