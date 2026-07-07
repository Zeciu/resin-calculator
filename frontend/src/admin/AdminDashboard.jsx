export default function AdminDashboard() {
  return (
    <section className="admin-dashboard">
      <h2 className="admin-dashboard__title">Administration</h2>
      <p className="admin-dashboard__lead">
        This workspace is reserved for HFZWood product administration. Use the
        navigation on the left to move between management areas as they become
        available.
      </p>
      <div className="admin-dashboard__overview">
        <h3 className="admin-dashboard__section-title">Management areas</h3>
        <ul className="admin-dashboard__list">
          <li>Manual &amp; Tutorials — textbook content for end users</li>
          <li>Glossary — technical dictionary entries</li>
          <li>Knowledge Base — troubleshooting articles</li>
          <li>Future content and administration sections — reserved for later phases</li>
        </ul>
        <p className="admin-dashboard__status">
          Manual &amp; Tutorials editing is available now. Glossary and Knowledge
          Base management will be added in upcoming tasks.
        </p>
      </div>
    </section>
  );
}
