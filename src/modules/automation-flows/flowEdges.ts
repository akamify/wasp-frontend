import { MarkerType } from "reactflow";
import { outputHandles } from "@modules/automation-flows/nodeCatalog";
import type { BuilderEdge, BuilderNode } from "@modules/automation-flows/types";

function edgeLabel(sourceNode: BuilderNode | undefined, sourceHandle: string | null | undefined) {
  if (!sourceHandle || sourceHandle === "default") return "";
  const handle = sourceNode
    ? outputHandles(sourceNode.data.nodeType, sourceNode.data.config).find(
        (item) => item.id === sourceHandle
      )
    : null;
  return handle?.label || sourceHandle;
}

export function createBuilderEdge(
  connection: {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  },
  nodes: BuilderNode[]
): BuilderEdge {
  const sourceNode = nodes.find((node) => node.id === connection.source);
  const label = edgeLabel(sourceNode, connection.sourceHandle);
  return {
    ...connection,
    type: "smoothstep",
    animated: false,
    label: label || undefined,
    labelStyle: {
      fill: "#475569",
      fontSize: 10,
      fontWeight: 700,
    },
    labelBgStyle: {
      fill: "#ffffff",
      fillOpacity: 0.94,
    },
    labelBgPadding: [5, 3],
    labelBgBorderRadius: 5,
    style: { stroke: "#06b77e", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#06b77e" },
  };
}

export function refreshBuilderEdgeLabels(edges: BuilderEdge[], nodes: BuilderNode[]) {
  return edges.map((edge) =>
    createBuilderEdge(
      {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
      },
      nodes
    )
  );
}
