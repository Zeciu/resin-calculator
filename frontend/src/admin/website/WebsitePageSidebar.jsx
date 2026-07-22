/**
 * Fixed-page sidebar for Website (no create/delete).
 *
 * @param {{
 *   ariaLabel: string;
 *   items: Array<{ contentId: string; label: string }>;
 *   selectedId: string | null;
 *   isSaving?: boolean;
 *   onSelect: (contentId: string) => void;
 * }} props
 */
export default function WebsitePageSidebar({
  ariaLabel,
  items,
  selectedId,
  isSaving = false,
  onSelect,
}) {
  return (
    <aside className="editorial-sidebar website-page-sidebar" aria-label={ariaLabel} role="navigation">
      <ol className="editorial-sidebar__list">
        {items.map((item) => {
          const isActive = item.contentId === selectedId;
          return (
            <li key={item.contentId}>
              <button
                type="button"
                className={`editorial-sidebar__item${isActive ? " editorial-sidebar__item--active" : ""}`}
                onClick={() => onSelect(item.contentId)}
                disabled={isSaving}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
