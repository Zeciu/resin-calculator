import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FolderOpen, Plus } from "lucide-react";
import { ROUTES } from "../workspace/routes.js";
import { ProjectFileParseError } from "../workspace/projectFileParse.js";
import {
  HFZ_PROJECT_IMPORT_ACCEPT,
  loadProjectFromFile,
  loadRecentProject,
  pickProjectFileWithHandle,
  RecentProjectUnavailableError,
} from "../workspace/projectFileOpen.js";
import { loadRecentProjects } from "../workspace/recentProjectsIndex.js";

function formatRecentTimestamp(value) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString();
}

function RecentProjectCard({ entry, disabled, onOpen }) {
  return (
    <button
      type="button"
      className="projects-hub__recent-card"
      disabled={disabled}
      onClick={() => onOpen(entry)}
    >
      <span className="projects-hub__recent-thumb" aria-hidden="true">
        P
      </span>
      <span className="projects-hub__recent-copy">
        <span className="projects-hub__recent-name">{entry.projectName}</span>
        <span className="projects-hub__recent-meta">
          Opened {formatRecentTimestamp(entry.lastOpenedAt)}
        </span>
        {entry.lastSavedAt ? (
          <span className="projects-hub__recent-meta">
            Saved {formatRecentTimestamp(entry.lastSavedAt)}
          </span>
        ) : null}
        {entry.lastKnownFileName ? (
          <span className="projects-hub__recent-file">{entry.lastKnownFileName}</span>
        ) : null}
      </span>
    </button>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [recentProjects, setRecentProjects] = useState(() => loadRecentProjects());
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState("");
  const [unavailableEntry, setUnavailableEntry] = useState(null);

  const refreshRecentProjects = useCallback(() => {
    setRecentProjects(loadRecentProjects());
  }, []);

  useEffect(() => {
    refreshRecentProjects();
  }, [refreshRecentProjects]);

  const openProjectInWorkspace = useCallback(
    (project) => {
      navigate(ROUTES.NEW_PROJECT, {
        state: { pendingProjectRestore: project },
      });
    },
    [navigate],
  );

  const handleProjectLoaded = useCallback(
    async (loader) => {
      setIsOpening(true);
      setError("");
      setUnavailableEntry(null);

      try {
        const { project } = await loader();
        refreshRecentProjects();
        openProjectInWorkspace(project);
      } catch (loadError) {
        if (loadError instanceof RecentProjectUnavailableError) {
          setUnavailableEntry(loadError.entry);
          setError(loadError.message);
          return;
        }

        const message =
          loadError instanceof ProjectFileParseError
            ? loadError.message
            : loadError instanceof Error
              ? loadError.message
              : "Could not open project file.";

        setError(message);
      } finally {
        setIsOpening(false);
      }
    },
    [openProjectInWorkspace, refreshRecentProjects],
  );

  const handleOpenProjectClick = useCallback(async () => {
    const nativePick = await pickProjectFileWithHandle();
    if (nativePick) {
      await handleProjectLoaded(async () =>
        loadProjectFromFile(nativePick.file, nativePick.handle),
      );
      return;
    }

    fileInputRef.current?.click();
  }, [handleProjectLoaded]);

  const handleFileInputChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      await handleProjectLoaded(async () => loadProjectFromFile(file));
    },
    [handleProjectLoaded],
  );

  const handleRecentOpen = useCallback(
    async (entry) => {
      await handleProjectLoaded(async () => loadRecentProject(entry));
    },
    [handleProjectLoaded],
  );

  const handleLocateProject = useCallback(() => {
    setUnavailableEntry(null);
    setError("");
    handleOpenProjectClick();
  }, [handleOpenProjectClick]);

  return (
    <section className="projects-hub" aria-labelledby="projects-hub-title">
      <div className="projects-hub__intro">
        <h1 id="projects-hub-title" className="projects-hub__title">
          Projects
        </h1>
        <p className="projects-hub__description">
          Your projects are saved as <strong>.hfzproject</strong> files on your device.
          Open a project file to continue your work in the Application Workspace.
        </p>
      </div>

      <div className="projects-hub__actions">
        <button
          type="button"
          className="projects-hub__button projects-hub__button--primary"
          onClick={handleOpenProjectClick}
          disabled={isOpening}
        >
          <FolderOpen size={18} aria-hidden="true" />
          Open Project
        </button>
        <Link
          to={ROUTES.NEW_PROJECT}
          className="projects-hub__button projects-hub__button--secondary"
        >
          <Plus size={18} aria-hidden="true" />
          New Project
        </Link>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={HFZ_PROJECT_IMPORT_ACCEPT}
        className="hidden-file-input"
        onChange={handleFileInputChange}
      />

      {error ? (
        <div className="projects-hub__error" role="alert">
          <p>{error}</p>
          {unavailableEntry ? (
            <button
              type="button"
              className="projects-hub__button projects-hub__button--secondary"
              onClick={handleLocateProject}
              disabled={isOpening}
            >
              Locate Project File
            </button>
          ) : null}
        </div>
      ) : null}

      <section className="projects-hub__recent" aria-labelledby="projects-hub-recent-title">
        <div className="projects-hub__recent-header">
          <h2 id="projects-hub-recent-title" className="projects-hub__recent-title">
            Recent Projects
          </h2>
          <p className="projects-hub__recent-note">Recent on this device only</p>
        </div>

        {recentProjects.length === 0 ? (
          <div className="projects-hub__empty-state">
            <p>No recent projects yet.</p>
            <p>
              Use <strong>Open Project</strong> to select a saved <strong>.hfzproject</strong>{" "}
              file, or start a <strong>New Project</strong>.
            </p>
          </div>
        ) : (
          <div className="projects-hub__recent-list">
            {recentProjects.map((entry) => (
              <RecentProjectCard
                key={entry.id}
                entry={entry}
                disabled={isOpening}
                onOpen={handleRecentOpen}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
