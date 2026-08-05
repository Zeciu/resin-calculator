import ContentUnavailableMessage from "../content/ContentUnavailableMessage.jsx";
import { useI18n } from "../i18n/I18nContext.jsx";
import { usePublishedWebsitePage } from "./usePublishedWebsitePage.js";

/**
 * Shared loading, unavailable, and title frame for public Website pages.
 *
 * @param {{
 *   pageKey: string;
 *   ariaLabelKey: string;
 *   children: (body: Record<string, unknown>) => import("react").ReactNode;
 * }} props
 */
export default function PublicWebsitePageShell({ pageKey, ariaLabelKey, children }) {
  const { t } = useI18n();
  const { payload, loadState, viewEnglishVersion } = usePublishedWebsitePage(pageKey);
  const body = payload?.page?.body ?? null;
  const publicTitle = String(body?.publicTitle ?? "").trim();

  return (
    <article className="public-website-page" aria-label={t(ariaLabelKey)} data-page-key={pageKey}>
      {loadState === "loading" ? (
        <p className="public-website-page__status" role="status">
          {t("content.loadingWebsite")}
        </p>
      ) : null}

      {loadState === "unavailable" || loadState === "error" ? (
        <ContentUnavailableMessage
          unavailableKey="content.unavailableWebsite"
          englishAvailable={Boolean(payload?.englishAvailable)}
          onViewEnglish={viewEnglishVersion}
        />
      ) : null}

      {loadState === "ready" && body ? (
        <>
          <header className="public-website-page__header">
            <h1 className="public-website-page__title">{publicTitle}</h1>
          </header>
          <div className="public-website-page__body">{children(body)}</div>
        </>
      ) : null}
    </article>
  );
}
