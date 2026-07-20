import { useCallback, useEffect, useState } from "react";
import { AdminApiError } from "../editorial/editorialAdminApi.js";
import {
  activatePublicLanguage,
  deactivatePublicLanguage,
  fetchAdminPublicLanguages,
} from "../publicLanguages/publicLanguagesApi.js";
import { usePublicLanguages } from "../publicLanguages/usePublicLanguages.js";

export default function AdminDashboard() {
  const { reload: reloadPublicConfig } = usePublicLanguages();
  const [overview, setOverview] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [error, setError] = useState("");
  const [pendingLocale, setPendingLocale] = useState(null);

  const load = useCallback(async () => {
    setLoadState("loading");
    setError("");
    try {
      const payload = await fetchAdminPublicLanguages();
      setOverview(payload);
      setLoadState("ready");
    } catch (err) {
      setOverview(null);
      setLoadState("error");
      setError(err instanceof AdminApiError ? err.message : "Failed to load public languages.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleActivate = async (locale) => {
    setPendingLocale(locale);
    setError("");
    try {
      const payload = await activatePublicLanguage(locale);
      setOverview(payload);
      await reloadPublicConfig();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Failed to activate language.");
    } finally {
      setPendingLocale(null);
    }
  };

  const handleDeactivate = async (locale) => {
    setPendingLocale(locale);
    setError("");
    try {
      const payload = await deactivatePublicLanguage(locale);
      setOverview(payload);
      await reloadPublicConfig();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Failed to deactivate language.");
    } finally {
      setPendingLocale(null);
    }
  };

  return (
    <section className="admin-dashboard" aria-label="Administration dashboard">
      <h2 className="admin-dashboard__title">Administration</h2>
      <p className="admin-dashboard__lead">
        Control which prepared languages are visible to public users. Translation
        generation and publishing remain separate Admin actions.
      </p>

      <div className="admin-dashboard__overview">
        <h3 className="admin-dashboard__section-title">Public Languages</h3>
        <p className="admin-dashboard__status">
          Default public language:{" "}
          <strong>{overview?.defaultPublicLocale?.toUpperCase() ?? "EN"}</strong>. Only
          Active languages appear in the public language selector.
        </p>

        {error ? (
          <p className="admin-dashboard__error" role="alert">
            {error}
          </p>
        ) : null}

        {loadState === "loading" && !overview ? (
          <p className="admin-dashboard__status">Loading public languages…</p>
        ) : null}

        {overview ? (
          <div className="admin-public-languages">
            <table className="admin-public-languages__table">
              <thead>
                <tr>
                  <th scope="col">Language</th>
                  <th scope="col">Translation status</th>
                  <th scope="col">Published content</th>
                  <th scope="col">Public visibility</th>
                </tr>
              </thead>
              <tbody>
                {overview.languages.map((row) => {
                  const isPending = pendingLocale === row.locale;
                  const isActive = row.publicVisibility === "Active";
                  return (
                    <tr key={row.locale}>
                      <td>
                        {row.label}
                        {row.isDefault ? (
                          <span className="admin-public-languages__default">Default</span>
                        ) : null}
                      </td>
                      <td>{row.translationStatus}</td>
                      <td>{row.publishedContentStatus}</td>
                      <td>
                        <div className="admin-public-languages__visibility">
                          <span
                            className={
                              isActive
                                ? "admin-public-languages__badge admin-public-languages__badge--active"
                                : "admin-public-languages__badge"
                            }
                          >
                            {row.publicVisibility}
                          </span>
                          {isActive ? (
                            <button
                              type="button"
                              className="admin-public-languages__action"
                              disabled={!row.canDeactivate || isPending}
                              title={
                                row.isDefault
                                  ? "The default public language cannot be deactivated."
                                  : undefined
                              }
                              onClick={() => void handleDeactivate(row.locale)}
                            >
                              {isPending ? "Working…" : "Deactivate"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-public-languages__action"
                              disabled={isPending}
                              onClick={() => void handleActivate(row.locale)}
                            >
                              {isPending ? "Working…" : "Activate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
