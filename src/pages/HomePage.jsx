import BottomActions from "../components/BottomActions";
import FeatureList from "../components/FeatureList";
import MobileHeader from "../components/MobileHeader";

export default function HomePage() {
  return (
    <main className="screen">
      <MobileHeader />

      <section className="hero-card">
        <p className="section-label">Mobile-first React structure</p>
        <h1>Build fast for phones, then expand to larger screens.</h1>
        <p className="hero-copy">
          This starter is arranged like a modern mobile web app with clear
          sections, touch-friendly spacing, and reusable React components.
        </p>

        <div className="hero-badges">
          <span>Responsive layout</span>
          <span>Reusable components</span>
          <span>Ready for routing</span>
        </div>
      </section>

      <FeatureList />
      <BottomActions />
    </main>
  );
}
