"use client";

import { useMemo } from "react";
import styles from "./MiniGraph.module.css";
import type { TeaDetail } from "@/lib/types";
import { getTypeColor } from "@/lib/utils";

interface MiniGraphProps {
  tea: TeaDetail;
  onSelectNode: (id: string) => void;
}

export default function MiniGraph({ tea, onSelectNode }: MiniGraphProps) {
  const SIZE = 280;
  const CENTER = SIZE / 2;
  const RADIUS = 90;

  const positions = useMemo(() => {
    return tea.similar.map((s, i) => {
      const angle = (i / tea.similar.length) * Math.PI * 2 - Math.PI / 2;
      return {
        ...s,
        x: CENTER + Math.cos(angle) * RADIUS,
        y: CENTER + Math.sin(angle) * RADIUS,
      };
    });
  }, [tea.similar]);

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={SIZE}
      height={SIZE}
    >
      {/* Edges */}
      {positions.map((s) => (
        <line
          key={`edge-${s.id}`}
          x1={CENTER}
          y1={CENTER}
          x2={s.x}
          y2={s.y}
          stroke="var(--gold)"
          strokeOpacity={s.score * 0.6}
          strokeWidth={s.score * 2}
        />
      ))}

      {/* Center node */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={12}
        fill={getTypeColor(tea.type)}
        stroke="var(--gold)"
        strokeWidth={2}
      />
      <text
        x={CENTER}
        y={CENTER + 24}
        textAnchor="middle"
        className={styles.centerLabel}
      >
        {tea.name.length > 18 ? tea.name.slice(0, 16) + "…" : tea.name}
      </text>

      {/* Neighbor nodes */}
      {positions.map((s) => (
        <g
          key={s.id}
          className={styles.node}
          onClick={() => onSelectNode(s.id)}
        >
          <circle
            cx={s.x}
            cy={s.y}
            r={7}
            fill={getTypeColor(s.type)}
            stroke="var(--ink)"
            strokeWidth={1.5}
          />
          <text
            x={s.x}
            y={s.y + 16}
            textAnchor="middle"
            className={styles.label}
          >
            {s.name.length > 14 ? s.name.slice(0, 12) + "…" : s.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
