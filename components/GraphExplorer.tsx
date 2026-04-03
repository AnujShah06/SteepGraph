"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import styles from "./GraphExplorer.module.css";
import type {
  GraphPayload,
  GraphNode,
  GraphEdge,
  FilterState,
  TeaType,
} from "@/lib/types";
import { getTypeColor } from "@/lib/utils";

interface SimNode extends GraphNode, d3.SimulationNodeDatum {}
interface SimEdge extends d3.SimulationLinkDatum<SimNode> {
  score: number;
}

interface GraphExplorerProps {
  payload: GraphPayload;
  initialSelectedId?: string;
}

const TEA_TYPES: TeaType[] = [
  "black", "green", "white", "oolong", "pu-erh", "herbal", "rooibos", "blend",
];

export default function GraphExplorer({
  payload,
  initialSelectedId,
}: GraphExplorerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId || null
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedTea, setSelectedTea] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<TeaType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const simulationRef = useRef<d3.Simulation<SimNode, SimEdge> | null>(null);

  const nodeRadius = useCallback(
    (d: SimNode) => Math.max(10, Math.min(28, 8 + d.degree * 1.8)),
    []
  );

  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Filter nodes/edges by type
    let filteredNodes = [...payload.nodes] as SimNode[];
    if (filterType) {
      filteredNodes = filteredNodes.filter((n) => n.type === filterType);
    }
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    let filteredEdges: SimEdge[] = payload.edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({ ...e }));

    // Clear existing
    d3.select(svg).selectAll("*").remove();

    const svgSel = d3
      .select(svg)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    // Zoom container
    const g = svgSel.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svgSel.call(zoom);

    // Force simulation per spec
    const simulation = d3
      .forceSimulation<SimNode>(filteredNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimEdge>(filteredEdges)
          .id((d) => d.id)
          .distance((d) => 120 + (1 - d.score) * 80)
          .strength((d) => d.score * 0.3)
      )
      .force("charge", d3.forceManyBody().strength(-280))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide<SimNode>().radius((d) => nodeRadius(d) + 22)
      )
      .alphaDecay(0.03);

    simulationRef.current = simulation;

    // Edges
    const edges = g
      .append("g")
      .attr("class", "edges")
      .selectAll("line")
      .data(filteredEdges)
      .join("line")
      .attr("stroke", "var(--gold)")
      .attr("stroke-opacity", (d) => d.score * 0.5)
      .attr("stroke-width", (d) => d.score * 2);

    // Nodes
    const nodes = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, SimNode>("g")
      .data(filteredNodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            // Keep pinned — double-click unpins
          })
      );

    // Node circles
    nodes
      .append("circle")
      .attr("r", (d) => nodeRadius(d))
      .attr("fill", (d) => getTypeColor(d.type))
      .attr("stroke", "var(--ink)")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.9);

    // Selection ring (hidden by default)
    nodes
      .append("circle")
      .attr("class", "selection-ring")
      .attr("r", (d) => nodeRadius(d) + 4)
      .attr("fill", "none")
      .attr("stroke", "var(--gold)")
      .attr("stroke-width", 2)
      .attr("opacity", 0);

    // Hover label
    const labels = g
      .append("g")
      .attr("class", "labels")
      .selectAll<SVGGElement, SimNode>("g")
      .data(filteredNodes)
      .join("g")
      .attr("opacity", 0)
      .attr("pointer-events", "none");

    // Background rect for readability
    labels
      .append("rect")
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("fill", "rgba(15,14,12,0.75)");

    const nameText = labels
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.15em")
      .attr("font-family", "var(--serif)")
      .attr("font-size", "10px")
      .attr("fill", "var(--cream)")
      .text((d) => d.name);

    const brandText = labels
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.95em")
      .attr("font-family", "var(--mono)")
      .attr("font-size", "7px")
      .attr("fill", "var(--gold)")
      .text((d) => d.brand);

    // Size the background rect to fit the text
    labels.each(function () {
      const g = d3.select(this);
      const texts = g.selectAll<SVGTextElement, unknown>("text");
      let maxW = 0;
      let totalH = 0;
      texts.each(function () {
        const bb = (this as SVGTextElement).getBBox();
        if (bb.width > maxW) maxW = bb.width;
        totalH += bb.height;
      });
      g.select("rect")
        .attr("x", -maxW / 2 - 4)
        .attr("y", -totalH * 0.6)
        .attr("width", maxW + 8)
        .attr("height", totalH + 6);
    });

    // Interactions
    nodes
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedId(d.id);
        setSelectedTea(d);
        updateSelection(d.id);
      })
      .on("mouseenter", (_, d) => {
        setHoveredId(d.id);
        labels.filter((l) => l.id === d.id).attr("opacity", 1);
        // Highlight neighbors
        const neighborIds = new Set<string>();
        const scoredNeighbors: { id: string; score: number }[] = [];
        filteredEdges.forEach((e) => {
          const src = typeof e.source === "object" ? (e.source as SimNode).id : String(e.source);
          const tgt = typeof e.target === "object" ? (e.target as SimNode).id : String(e.target);
          if (src === d.id) scoredNeighbors.push({ id: tgt, score: e.score });
          if (tgt === d.id) scoredNeighbors.push({ id: src, score: e.score });
        });
        scoredNeighbors.forEach(({ id }) => neighborIds.add(id));
        neighborIds.add(d.id);

        // Only show labels for hovered node + top 5 closest neighbors
        const labelIds = new Set([
          d.id,
          ...scoredNeighbors.sort((a, b) => b.score - a.score).slice(0, 5).map((n) => n.id),
        ]);
        nodes
          .select("circle:first-child")
          .attr("opacity", (n) => (neighborIds.has(n.id) ? 1 : 0.3));
        labels.filter((l) => labelIds.has(l.id)).attr("opacity", 1);
      })
      .on("mouseleave", (_, d) => {
        setHoveredId(null);
        labels.attr("opacity", 0);
        if (!selectedId) {
          nodes.select("circle:first-child").attr("opacity", 0.9);
        }
      })
      .on("dblclick", (_, d) => {
        d.fx = null;
        d.fy = null;
        simulation.alphaTarget(0.1).restart();
        setTimeout(() => simulation.alphaTarget(0), 500);
      });

    // Background click to deselect
    svgSel.on("click", () => {
      setSelectedId(null);
      setSelectedTea(null);
      nodes.select("circle:first-child").attr("opacity", 0.9);
      nodes.select(".selection-ring").attr("opacity", 0);
    });

    function updateSelection(id: string) {
      const neighborIds = new Set<string>();
      filteredEdges.forEach((e) => {
        const src = typeof e.source === "object" ? (e.source as SimNode).id : String(e.source);
        const tgt = typeof e.target === "object" ? (e.target as SimNode).id : String(e.target);
        if (src === id) neighborIds.add(tgt);
        if (tgt === id) neighborIds.add(src);
      });
      neighborIds.add(id);

      nodes
        .select("circle:first-child")
        .transition()
        .duration(300)
        .attr("opacity", (n) => (neighborIds.has(n.id) ? 1 : 0.15));

      nodes
        .select(".selection-ring")
        .attr("opacity", (n) => (n.id === id ? 1 : 0));

      labels.attr("opacity", (n) => (n.id === id ? 1 : 0));
    }

    // Tick
    simulation.on("tick", () => {
      edges
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      nodes.attr("transform", (d) => `translate(${d.x},${d.y})`);
      labels.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [payload, filterType, nodeRadius]);

  return (
    <div className={styles.wrapper}>
      {/* Filter bar */}
      <div className={styles.controls}>
        <div className={styles.typeFilters}>
          <button
            className={`tag ${!filterType ? "tag--active" : ""}`}
            onClick={() => setFilterType(null)}
          >
            All
          </button>
          {TEA_TYPES.map((t) => (
            <button
              key={t}
              className={`tag ${filterType === t ? "tag--active" : ""}`}
              onClick={() => setFilterType(filterType === t ? null : t)}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          type="text"
          className={styles.search}
          placeholder="Search graph…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          spellCheck={false}
        />
      </div>

      {/* Graph */}
      <div ref={containerRef} className={styles.graphContainer}>
        <svg ref={svgRef} />
      </div>

      {/* Sidebar */}
      {selectedTea && (
        <div className={styles.sidebar}>
          <button
            className={styles.sidebarClose}
            onClick={() => {
              setSelectedId(null);
              setSelectedTea(null);
            }}
          >
            ×
          </button>
          <div
            className={styles.sidebarDot}
            style={{ background: getTypeColor(selectedTea.type) }}
          />
          <h3 className={styles.sidebarName}>{selectedTea.name}</h3>
          <span className={styles.sidebarBrand}>{selectedTea.brand}</span>
          <div className={styles.sidebarMeta}>
            <span>{selectedTea.type}</span>
            <span className={styles.sep}>·</span>
            <span>{selectedTea.degree} connections</span>
          </div>
          <a href={`/tea/${selectedTea.id}`} className={styles.sidebarLink}>
            View full detail →
          </a>
        </div>
      )}

      {/* Legend */}
      <div className={styles.legend}>
        {TEA_TYPES.map((t) => (
          <div key={t} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: getTypeColor(t) }}
            />
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
