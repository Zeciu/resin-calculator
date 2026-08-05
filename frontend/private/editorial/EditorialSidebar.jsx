/**
 * @param {{
 *   ariaLabel: string;
 *   addLabel: string;
 *   items: Array<{ contentId: string; label: string }>;
 *   selectedId: string | null;
 *   isSaving?: boolean;
 *   emptyLabel?: string;
 *   onAdd: () => void;
 *   onSelect: (contentId: string) => void;
 * }} props
 */
export default function EditorialSidebar({
  ariaLabel,
  addLabel,
  items,
  selectedId,
  isSaving = false,
  emptyLabel = "",
  onAdd,
  onSelect,
}) {
  return (
    <aside className="editorial-sidebar" aria-label={ariaLabel}>
      <button type="button" className="editorial-sidebar__add" onClick={onAdd} disabled={isSaving}>
        {addLabel}
      </button>
      {items.length === 0 && emptyLabel ? (
        <p className="editorial-sidebar__empty">{emptyLabel}</p>
      ) : null}
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
