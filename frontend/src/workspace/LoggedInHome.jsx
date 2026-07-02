export default function LoggedInHome() {
  return (
    <section className="logged-in-home">
      <h2 className="logged-in-home__statement">
        Welcome to HFZWood — your workspace for resin estimation and woodworking
        knowledge.
      </h2>
      <p className="logged-in-home__supporting">
        Use the navigation to start a new project, open saved work, or explore
        tutorials, glossary terms, and the knowledge base.
      </p>
      <div
        className="logged-in-home__video"
        aria-label="Platform overview video placeholder"
      >
        <span className="logged-in-home__video-label">Platform overview video</span>
      </div>
    </section>
  );
}
