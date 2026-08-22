import { Lock } from "lucide-react";
import { useI18n } from "../i18n/I18nContext.jsx";

/**
 * @param {{
 *   id: string;
 *   label: string;
 *   selected: boolean;
 *   onSelect: (id: string) => void;
 *   headingLevel?: 2 | 3;
 *   children?: import("react").ReactNode;
 * }} props
 */
export default function PreviewLockedItem({
  id,
  label,
  selected,
  onSelect,
  headingLevel = 2,
  children,
}) {
  const { t } = useI18n();
  const Heading = headingLevel === 3 ? "h3" : "h2";

  return (
    <article
      className={
        selected
          ? "knowledge-preview-item knowledge-preview-item--selected"
          : "knowledge-preview-item"
      }
    >
      <Heading className="knowledge-preview-item__heading">
        <button
          type="button"
          className="knowledge-preview-item__button knowledge-preview-item__button--locked"
          aria-current={selected ? "true" : undefined}
          aria-expanded={selected}
          onClick={() => onSelect(id)}
        >
          <span className="knowledge-preview-item__label">{label}</span>
          <span className="knowledge-preview-item__lock" aria-label={t("preview.lockedAria")}>
            <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
          </span>
        </button>
      </Heading>
      {selected ? children : null}
    </article>
  );
}
