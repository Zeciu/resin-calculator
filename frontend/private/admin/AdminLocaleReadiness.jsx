const INLINE_MISSING_LIMIT = 12;

function statusLabel(status) {
  if (status === "complete") {
    return "COMPLETE";
  }
  if (status === "missing") {
    return "MISSING";
  }
  return "INCOMPLETE";
}

function readyLabel(value) {
  return value ? "Ready" : "Not ready";
}

function LayerCounts({ layer }) {
  return (
    <span className={`admin-locale-readiness__status admin-locale-readiness__status--${layer.status}`}>
      {statusLabel(layer.status)} {layer.present_count}/{layer.required_count}
    </span>
  );
}

function InlineMissing({ layer }) {
  if (!layer.missing.length || layer.missing.length > INLINE_MISSING_LIMIT) {
    return null;
  }
  return <div className="admin-locale-readiness__inline-missing">missing: {layer.missing.join(", ")}</div>;
}

function ModuleCell({ preview, production }) {
  return (
    <div className="admin-locale-readiness__module">
      <div>
        <span className="admin-locale-readiness__plane">Preview</span>{" "}
        <LayerCounts layer={preview} />
        <InlineMissing layer={preview} />
      </div>
      <div>
        <span className="admin-locale-readiness__plane">Production</span>{" "}
        <LayerCounts layer={production} />
        <InlineMissing layer={production} />
      </div>
    </div>
  );
}

function IdList({ items, label }) {
  if (!items.length) {
    return null;
  }
  const list = (
    <ul className="admin-locale-readiness__ids">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
  if (items.length <= INLINE_MISSING_LIMIT) {
    return (
      <div>
        <p className="admin-locale-readiness__ids-label">{label}</p>
        {list}
      </div>
    );
  }
  return (
    <details className="admin-locale-readiness__disclosure">
      <summary>
        {label} ({items.length})
      </summary>
      {list}
    </details>
  );
}

function LayerDetail({ title, layer }) {
  return (
    <div className="admin-locale-readiness__layer-detail">
      <p>
        <strong>{title}</strong> <LayerCounts layer={layer} />
      </p>
      <IdList items={layer.missing} label="Missing" />
      <IdList items={layer.extra} label="Extra" />
    </div>
  );
}

function StoreDetail({ title, diagnostic }) {
  return (
    <p className="admin-locale-readiness__store">
      {title}: published {diagnostic.published_count} / draft {diagnostic.draft_count} / no
      variant {diagnostic.no_variant_count}
      {diagnostic.draft_ids.length ? ` · draft: ${diagnostic.draft_ids.join(", ")}` : ""}
      {diagnostic.no_variant_ids.length > INLINE_MISSING_LIMIT
        ? ` · no variant: ${diagnostic.no_variant_ids.length} items`
        : diagnostic.no_variant_ids.length
          ? ` · no variant: ${diagnostic.no_variant_ids.join(", ")}`
          : ""}
    </p>
  );
}

export default function AdminLocaleReadiness({
  payload,
  loadState,
  error,
  onRefresh,
  refreshing,
  onPrepareProduction,
  preparingLocale,
}) {
  return (
    <div className="admin-locale-readiness">
      <div className="admin-locale-readiness__header">
        <h3 className="admin-dashboard__section-title">Locale Readiness</h3>
        <button
          type="button"
          className="admin-public-languages__action"
          onClick={() => void onRefresh()}
          disabled={refreshing || loadState === "loading"}
        >
          {refreshing || (loadState === "loading" && payload) ? "Refreshing…" : "Refresh readiness"}
        </button>
      </div>
      <p className="admin-dashboard__status">
        Structural completeness for Preview and Production. Public activation is separate and is
        not blocked by this overview.
      </p>

      {error ? (
        <p className="admin-dashboard__error" role="alert">
          {error}
        </p>
      ) : null}

      {loadState === "loading" && !payload ? (
        <p className="admin-dashboard__status">Loading locale readiness…</p>
      ) : null}

      {payload ? (
        <div className="admin-locale-readiness__table-wrap">
          <table className="admin-public-languages__table" aria-label="Locale readiness">
            <thead>
              <tr>
                <th scope="col">Language</th>
                <th scope="col">Preview Ready</th>
                <th scope="col">Production Ready</th>
                <th scope="col">UI</th>
                <th scope="col">Website</th>
                <th scope="col">Manual</th>
                <th scope="col">Glossary</th>
                <th scope="col">Knowledge Base</th>
              </tr>
            </thead>
            <tbody>
              {payload.locales.map((row) => (
                <tr key={row.locale}>
                  <td>
                    {row.label}
                    <span className="admin-locale-readiness__code">{row.locale.toUpperCase()}</span>
                  </td>
                  <td>
                    <span
                      className={
                        row.preview_ready
                          ? "admin-locale-readiness__ready admin-locale-readiness__ready--yes"
                          : "admin-locale-readiness__ready"
                      }
                    >
                      {readyLabel(row.preview_ready)}
                    </span>
                  </td>
                  <td>
                    <div className="admin-locale-readiness__production-action">
                      <span
                        className={
                          row.production_ready
                            ? "admin-locale-readiness__ready admin-locale-readiness__ready--yes"
                            : "admin-locale-readiness__ready"
                        }
                      >
                        {readyLabel(row.production_ready)}
                      </span>
                      {row.preview_ready && !row.production_ready ? (
                        <button
                          type="button"
                          className="admin-public-languages__action"
                          disabled={Boolean(preparingLocale) || refreshing || loadState === "loading"}
                          onClick={() => void onPrepareProduction(row.locale)}
                        >
                          {preparingLocale === row.locale ? "Preparing…" : "Prepare for Production"}
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <LayerCounts layer={row.ui} />
                    <InlineMissing layer={row.ui} />
                  </td>
                  <td>
                    <ModuleCell preview={row.website_preview} production={row.website_production} />
                  </td>
                  <td>
                    <ModuleCell preview={row.manual_preview} production={row.manual_production} />
                  </td>
                  <td>
                    <ModuleCell preview={row.glossary_preview} production={row.glossary_production} />
                  </td>
                  <td>
                    <ModuleCell
                      preview={row.knowledge_base_preview}
                      production={row.knowledge_base_production}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="admin-locale-readiness__details">
            {payload.locales.map((row) => (
              <details key={`${row.locale}-details`} className="admin-locale-readiness__locale-details">
                <summary>
                  {row.label} details
                  {row.preview_ready && row.production_ready ? "" : " — missing items"}
                </summary>
                <LayerDetail title="UI" layer={row.ui} />
                <LayerDetail title="Website preview" layer={row.website_preview} />
                <LayerDetail title="Website production" layer={row.website_production} />
                <LayerDetail title="Manual preview" layer={row.manual_preview} />
                <LayerDetail title="Manual production" layer={row.manual_production} />
                <LayerDetail title="Glossary preview" layer={row.glossary_preview} />
                <LayerDetail title="Glossary production" layer={row.glossary_production} />
                <LayerDetail title="Knowledge Base preview" layer={row.knowledge_base_preview} />
                <LayerDetail title="Knowledge Base production" layer={row.knowledge_base_production} />
                <div className="admin-locale-readiness__store-block">
                  <p>
                    <strong>Store diagnostics</strong> (informational; does not gate Preview Ready)
                  </p>
                  <StoreDetail title="Manual" diagnostic={row.store.manual} />
                  <StoreDetail title="Glossary" diagnostic={row.store.glossary} />
                  <StoreDetail title="Knowledge Base" diagnostic={row.store.knowledge_base} />
                </div>
              </details>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
