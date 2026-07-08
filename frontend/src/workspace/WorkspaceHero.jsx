import { useI18n } from "../i18n/I18nContext.jsx";

export default function WorkspaceHero() {
  const { t } = useI18n();

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
        <h1 className="workspace-hero__headline">{t("hero.headline")}</h1>
        <p className="workspace-hero__subtitle">{t("hero.subtitle")}</p>
      </div>
    </div>
  );
}
