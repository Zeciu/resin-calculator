import ResinCalculator from "../calculator/ResinCalculator.jsx";

export default function NewProjectWorkspace() {
  return (
    <div className="new-project-workspace">
      <ResinCalculator showHeader={false} workspaceVariant="dedicated" />
    </div>
  );
}
