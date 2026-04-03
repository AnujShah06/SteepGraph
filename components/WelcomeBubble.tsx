"use client";

import { useEffect, useState } from "react";

export default function WelcomeBubble() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("steepwisdom-welcome-dismissed");
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem("steepwisdom-welcome-dismissed", "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 14, 12, 0.75)",
        backdropFilter: "blur(4px)",
      }}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--ink2)",
          border: "1px solid rgba(200, 169, 110, 0.4)",
          borderRadius: "4px",
          padding: "40px 48px",
          maxWidth: "480px",
          width: "90vw",
          textAlign: "center",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          animation: "fadeUp 0.35s cubic-bezier(0.4,0,0.2,1) both",
        }}
      >
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.65rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "var(--gold)",
            marginBottom: "16px",
          }}
        >
          Welcome
        </p>
        <h2
          style={{
            fontFamily: "var(--serif)",
            fontSize: "2rem",
            fontWeight: 400,
            color: "var(--cream)",
            marginBottom: "16px",
            lineHeight: 1.2,
          }}
        >
          SteepWisdom
        </h2>
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: "0.9rem",
            color: "var(--cream2)",
            lineHeight: 1.7,
            marginBottom: "32px",
          }}
        >
          A tea discovery tool built on a knowledge graph.
          Browse ~150 teas from 11 brands, explore how they relate by flavor,
          origin, and ingredients, and find something new to steep.
        </p>
        <button
          onClick={dismiss}
          className="btn"
          style={{ padding: "10px 40px" }}
        >
          Explore
        </button>
      </div>
    </div>
  );
}
