import { useI18n } from "../i18n/I18nContext.jsx";

/**
 * Home product-explanation copy that continues the first explanatory block
 * beside the demo video (plain heading + paragraph, not cards).
 */
export default function HomeIntroExtraBlocks() {
  const { t } = useI18n();

  return (
    <>
      <div className="public-home__description-block">
        <h2>{t("home.startWithPhotoTitle")}</h2>
        <p>{t("home.startWithPhotoBody")}</p>
      </div>
      <div className="public-home__description-block">
        <h2>{t("home.noExpertNeededTitle")}</h2>
        <p>{t("home.noExpertNeededBody")}</p>
      </div>
    </>
  );
}
