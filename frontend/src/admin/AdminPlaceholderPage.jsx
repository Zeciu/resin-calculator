export default function AdminPlaceholderPage({ title, message, showEditorialNote = false }) {
  return (
    <section className="admin-placeholder-page">
      <h2 className="admin-placeholder-page__title">{title}</h2>
      <p className="admin-placeholder-page__message">{message}</p>
      {showEditorialNote ? (
        <p className="admin-placeholder-page__note">
          Shared editorial infrastructure begins in Task 62.
        </p>
      ) : null}
    </section>
  );
}
