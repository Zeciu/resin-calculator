import { useI18n } from "../i18n/I18nContext.jsx";

export default function GuestIntro() {
  const { t } = useI18n();

  return (
    <section className="guest-intro">
      <h2 className="guest-intro__statement">{t("home.guestStatement")}</h2>
      <p className="guest-intro__supporting">{t("home.guestSupporting")}</p>
      <div className="guest-intro__video" aria-label={t("home.videoPlaceholder")}>
        <span className="guest-intro__video-label">{t("home.videoLabel")}</span>
      </div>
      <p className="guest-intro__account-message">{t("home.guestAccountMessage")}</p>
    </section>
  );
}
