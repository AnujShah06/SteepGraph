import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 56px)",
        textAlign: "center",
        padding: "var(--space-xl)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--serif)",
          fontSize: "4rem",
          fontWeight: 300,
          color: "var(--gold)",
          lineHeight: 1,
        }}
      >
        404
      </span>
      <h1
        style={{
          fontFamily: "var(--serif)",
          fontSize: "1.5rem",
          fontWeight: 400,
          color: "var(--cream)",
          marginTop: "var(--space-md)",
        }}
      >
        Tea not found
      </h1>
      <p
        style={{
          fontFamily: "var(--mono)",
          fontSize: "0.75rem",
          color: "var(--muted)",
          marginTop: "var(--space-sm)",
          letterSpacing: "0.04em",
        }}
      >
        This leaf has blown away.
      </p>
      <Link
        href="/"
        className="btn"
        style={{ marginTop: "var(--space-xl)" }}
      >
        Back to Explore
      </Link>
    </div>
  );
}
