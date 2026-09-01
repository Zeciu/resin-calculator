import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { ROUTES } from "../workspace/routes.js";

const RESOURCES = [
  {
    path: ROUTES.KNOWLEDGE_PREVIEW_MANUAL,
    titleKey: "content.manualTitle",
    hintKey: "preview.resourceManualHint",
    accessLeadKey: "preview.accessFreeLead",
    accessBodyKey: "preview.resourceManualAccess",
  },
  {
    path: ROUTES.KNOWLEDGE_PREVIEW_KNOWLEDGE_BASE,
    titleKey: "content.knowledgeBaseTitle",
    hintKey: "preview.resourceKbHint",
    accessLeadKey: "preview.accessSubscriptionLead",
    accessBodyKey: "preview.resourceKbAccess",
  },
  {
    path: ROUTES.KNOWLEDGE_PREVIEW_GLOSSARY,
    titleKey: "content.glossaryTitle",
    hintKey: "preview.resourceGlossaryHint",
    accessLeadKey: "preview.accessSubscriptionLead",
    accessBodyKey: "preview.resourceGlossaryAccess",
  },
];

export default function PublicKnowledgePreviewLanding() {
  const { t } = useI18n();

  return (
    <section className="knowledge-preview-landing" aria-labelledby="knowledge-preview-landing-title">
      <header className="knowledge-preview-landing__header">
        <h1 id="knowledge-preview-landing-title" className="knowledge-preview-landing__title">
          {t("nav.publicKnowledgePreview")}
        </h1>
        <p className="knowledge-preview-landing__intro">{t("preview.landingIntro")}</p>
      </header>
      <nav className="knowledge-preview-landing__resources" aria-label={t("nav.publicKnowledgePreview")}>
        <ul className="knowledge-preview-landing__list">
          {RESOURCES.map((resource) => (
            <li key={resource.path} className="knowledge-preview-landing__item">
              <Link className="knowledge-preview-landing__link" to={resource.path}>
                <h2 className="knowledge-preview-landing__resource-title">{t(resource.titleKey)}</h2>
                <p className="knowledge-preview-landing__resource-hint">{t(resource.hintKey)}</p>
                <p className="knowledge-preview-landing__resource-access">
                  <strong className="knowledge-preview-landing__resource-access-lead">
                    {t(resource.accessLeadKey)}
                  </strong>{" "}
                  {t(resource.accessBodyKey)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
