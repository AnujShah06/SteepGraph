export default function RegionLoading() {
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <div
        className="skeleton"
        style={{ width: "100%", height: 340, borderRadius: 0 }}
      />
      <div style={{ padding: "var(--space-lg)" }}>
        <div
          className="skeleton"
          style={{ width: 240, height: 28, marginBottom: "var(--space-lg)" }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "var(--space-md)",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 120, width: "100%" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
