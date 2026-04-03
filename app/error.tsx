"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          fontSize: "1.5rem",
          color: "var(--cream)",
          marginBottom: "var(--space-sm)",
        }}
      >
        Something went wrong
      </span>
      <p
        style={{
          fontFamily: "var(--mono)",
          fontSize: "0.72rem",
          color: "var(--muted)",
          maxWidth: 400,
          lineHeight: 1.6,
          marginBottom: "var(--space-lg)",
        }}
      >
        {error.message || "An unexpected error occurred."}
      </p>
      <button className="btn" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
