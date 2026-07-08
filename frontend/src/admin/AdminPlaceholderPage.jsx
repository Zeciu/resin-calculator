export default function AdminPlaceholderPage({ title, message }) {
  return (
    <section className="admin-placeholder-page">
      <h2 className="admin-placeholder-page__title">{title}</h2>
      <p className="admin-placeholder-page__message">{message}</p>
    </section>
  );
}
