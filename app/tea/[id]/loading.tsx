export default function TeaLoading() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "var(--space-xl) var(--space-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xl)",
      }}
    >
      <div className="skeleton" style={{ width: 120, height: 14 }} />
      <div>
        <div className="skeleton" style={{ width: 80, height: 14, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: "70%", height: 40, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 140, height: 14 }} />
      </div>
      <div className="skeleton" style={{ width: "100%", height: 80 }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-lg)",
          paddingTop: "var(--space-lg)",
          borderTop: "var(--border)",
        }}
      >
        <div className="skeleton" style={{ width: 100, height: 14 }} />
        <div style={{ display: "flex", gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: 70, height: 26, borderRadius: 2 }}
            />
          ))}
        </div>
        <div className="skeleton" style={{ width: 100, height: 14 }} />
        <div style={{ display: "flex", gap: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: 60, height: 26, borderRadius: 2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
