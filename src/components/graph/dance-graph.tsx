"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Edge,
  type Node,
  type NodeTypes,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FigureNode, type FigureNodeData } from "./figure-node";

const LEVEL_EDGE_COLORS: Record<string, string> = {
  student_teacher: "#CD7F32",
  associate: "#CD7F32",
  licentiate: "#C0C0C0",
  fellow: "#FFD700",
};

const LEVEL_NODE_COLORS: Record<string, string> = {
  student_teacher: "#CD7F32",
  associate: "#CD7F32",
  licentiate: "#C0C0C0",
  fellow: "#FFD700",
};

export interface GraphFigure {
  id: number;
  name: string;
  variantName: string | null;
  level: string;
  figureNumber: number | null;
}

export interface GraphEdge {
  id: number;
  sourceFigureId: number;
  targetFigureId: number;
  level: string;
  conditions: string | null;
}

interface DanceGraphProps {
  danceSlug: string;
  figures: GraphFigure[];
  edges: GraphEdge[];
  centerFigureId?: number;
}

function makeNodeData(fig: GraphFigure, danceSlug: string, isCenterNode?: boolean): FigureNodeData {
  const label = fig.variantName
    ? `${fig.name} (${fig.variantName})`
    : fig.name;
  return {
    label,
    level: fig.level,
    danceSlug,
    figureId: fig.id,
    isCenterNode,
  };
}

/**
 * Local graph layout: center figure in the middle,
 * precedes stacked on the left, follows stacked on the right.
 */
function layoutLocal(
  figures: GraphFigure[],
  edges: GraphEdge[],
  centerFigureId: number,
  danceSlug: string
): Node<FigureNodeData>[] {
  const centerFig = figures.find((f) => f.id === centerFigureId);
  if (!centerFig) return [];

  const precedeIds = new Set(
    edges
      .filter((e) => e.targetFigureId === centerFigureId)
      .map((e) => e.sourceFigureId)
  );
  const followIds = new Set(
    edges
      .filter((e) => e.sourceFigureId === centerFigureId)
      .map((e) => e.targetFigureId)
  );

  // Remove center from precede/follow sets (self-loops)
  precedeIds.delete(centerFigureId);
  followIds.delete(centerFigureId);

  const precedes = figures.filter((f) => precedeIds.has(f.id));
  const follows = figures.filter((f) => followIds.has(f.id));

  const yGap = 60;
  const nodes: Node<FigureNodeData>[] = [];

  // Center node
  nodes.push({
    id: String(centerFig.id),
    type: "figure",
    position: { x: 0, y: 0 },
    data: makeNodeData(centerFig, danceSlug, true),
  });

  // Precedes on the left
  const precedeStartY = -((precedes.length - 1) * yGap) / 2;
  precedes.forEach((fig, i) => {
    nodes.push({
      id: String(fig.id),
      type: "figure",
      position: { x: -350, y: precedeStartY + i * yGap },
      data: makeNodeData(fig, danceSlug),
    });
  });

  // Follows on the right
  const followStartY = -((follows.length - 1) * yGap) / 2;
  follows.forEach((fig, i) => {
    nodes.push({
      id: String(fig.id),
      type: "figure",
      position: { x: 350, y: followStartY + i * yGap },
      data: makeNodeData(fig, danceSlug),
    });
  });

  return nodes;
}

/**
 * Full dance graph layout: group figures by level in rows.
 */
function layoutFull(
  figures: GraphFigure[],
  danceSlug: string
): Node<FigureNodeData>[] {
  const levels = ["student_teacher", "associate", "licentiate", "fellow"];
  const grouped = new Map<string, GraphFigure[]>();
  for (const level of levels) grouped.set(level, []);
  for (const fig of figures) {
    grouped.get(fig.level)?.push(fig);
  }

  const nodes: Node<FigureNodeData>[] = [];
  const xGap = 220;
  const yGap = 150;

  let y = 0;
  for (const level of levels) {
    const group = grouped.get(level) ?? [];
    if (group.length === 0) continue;

    const totalWidth = group.length * xGap;
    let x = -totalWidth / 2;

    for (const fig of group) {
      nodes.push({
        id: String(fig.id),
        type: "figure",
        position: { x, y },
        data: makeNodeData(fig, danceSlug),
      });
      x += xGap;
    }
    y += yGap;
  }

  return nodes;
}

function buildEdges(edges: GraphEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: `e${edge.id}`,
    source: String(edge.sourceFigureId),
    target: String(edge.targetFigureId),
    style: {
      stroke: LEVEL_EDGE_COLORS[edge.level] ?? "#666",
      strokeWidth: 1.5,
      opacity: 0.5,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: LEVEL_EDGE_COLORS[edge.level] ?? "#666",
      width: 15,
      height: 15,
    },
  }));
}

const nodeTypes: NodeTypes = {
  figure: FigureNode,
};

export function DanceGraph({ danceSlug, figures, edges, centerFigureId }: DanceGraphProps) {
  const initialNodes = useMemo(() => {
    if (centerFigureId != null) {
      return layoutLocal(figures, edges, centerFigureId, danceSlug);
    }
    return layoutFull(figures, danceSlug);
  }, [figures, edges, centerFigureId, danceSlug]);

  const initialEdges = useMemo(() => buildEdges(edges), [edges]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-[calc(100vh-200px)] min-h-[500px] rounded-lg border border-border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
      >
        <Background color="#333" gap={20} />
        <Controls className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-secondary" />
        <MiniMap
          nodeColor={(node) => {
            const level = (node.data as FigureNodeData)?.level;
            return LEVEL_NODE_COLORS[level] ?? "#666";
          }}
          className="!bg-card !border-border"
          maskColor="rgba(0,0,0,0.7)"
        />
      </ReactFlow>
    </div>
  );
}
