import { useI18n } from "../i18n/I18nContext.jsx";

export default function LoggedInHome() {
  const { t } = useI18n();

  return (
    <section className="logged-in-home">
      <h2 className="logged-in-home__statement">{t("home.welcomeStatement")}</h2>
      <p className="logged-in-home__supporting">{t("home.welcomeSupporting")}</p>
      <div className="logged-in-home__video" aria-label={t("home.videoPlaceholder")}>
        <span className="logged-in-home__video-label">{t("home.videoLabel")}</span>
      </div>
    </section>
  );
}
