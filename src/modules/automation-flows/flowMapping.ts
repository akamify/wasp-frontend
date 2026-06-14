import type {
  AutomationFlow,
  BackendFlowEdge,
  BackendFlowNode,
  BuilderEdge,
  BuilderNode,
  FlowDraftPayload,
  FlowTrigger,
} from "@modules/automation-flows/types";
import { createStartNode, DEFAULT_TRIGGER } from "@modules/automation-flows/flowDefaults";
import { refreshBuilderEdgeLabels } from "@modules/automation-flows/flowEdges";

export function toBuilderNodes(nodes: BackendFlowNode[] | undefined): BuilderNode[] {
  if (!Array.isArray(nodes) || nodes.length === 0) return [createStartNode()];
  return nodes.map((node) => ({
    id: node.id,
    type: "automationNode",
    position: node.position || { x: 0, y: 0 },
    data: {
      nodeType: node.type,
      config: node.config && typeof node.config === "object" ? node.config : {},
    },
  }));
}

export function toBuilderEdges(
  edges: BackendFlowEdge[] | undefined,
  nodes: BuilderNode[]
): BuilderEdge[] {
  if (!Array.isArray(edges)) return [];
  return refreshBuilderEdgeLabels(edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || undefined,
  })), nodes);
}

export function toDraftPayload(
  trigger: FlowTrigger,
  nodes: BuilderNode[],
  edges: BuilderEdge[],
  fallbackNodeId: string | null,
  handoverNodeId: string | null
): FlowDraftPayload {
  return {
    trigger,
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.data.nodeType,
      position: { x: node.position.x, y: node.position.y },
      config: node.data.config,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || undefined,
    })),
    fallbackNodeId,
    handoverNodeId,
  };
}

export function normalizedTrigger(flow: AutomationFlow): FlowTrigger {
  return {
    ...DEFAULT_TRIGGER,
    ...(flow.trigger || {}),
    keywords: flow.trigger?.keywords || [],
    templateButtonPayloads: flow.trigger?.templateButtonPayloads || [],
    ctwaPayloads: flow.trigger?.ctwaPayloads || [],
  };
}
