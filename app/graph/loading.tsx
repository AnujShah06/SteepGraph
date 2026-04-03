export default function GraphLoading() {
  return (
    <div
      style={{
        width: "100%",
        height: "calc(100vh - 56px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ink)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "2px solid var(--ink3)",
            borderTopColor: "var(--gold)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto var(--space-md)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.7rem",
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Building graph…
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
