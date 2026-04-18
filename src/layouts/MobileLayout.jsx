export default function MobileLayout({ children }) {
  return (
    <div className="app-shell">
      <div className="phone-frame">
        {children}
      </div>
    </div>
  );
}
