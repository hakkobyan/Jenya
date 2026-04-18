const items = [
  {
    title: "Simple structure",
    text: "Folders are split into pages, layouts, styles, components, and assets."
  },
  {
    title: "Touch-friendly UI",
    text: "Buttons, spacing, and cards are sized for mobile interaction first."
  },
  {
    title: "Easy to grow",
    text: "You can add routing, API calls, auth, and state management on top of this base."
  }
];

export default function FeatureList() {
  return (
    <section className="stack-section">
      <div className="section-heading">
        <p className="section-label">Core pieces</p>
        <h3>What is included</h3>
      </div>

      <div className="feature-list">
        {items.map((item) => (
          <article className="feature-card" key={item.title}>
            <h4>{item.title}</h4>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
