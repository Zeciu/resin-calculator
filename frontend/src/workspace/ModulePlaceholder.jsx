export default function ModulePlaceholder({ title, description }) {
  return (
    <section className="module-placeholder">
      <h2 className="module-placeholder__title">{title}</h2>
      <p className="module-placeholder__description">{description}</p>
      <p className="module-placeholder__message">Coming in a future phase.</p>
    </section>
  );
}
