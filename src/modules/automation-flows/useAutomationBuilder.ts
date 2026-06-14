import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useEdgesState,
  useNodesState,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "reactflow";
import { createBuilderNode } from "@modules/automation-flows/flowDefaults";
import { DEFAULT_TRIGGER } from "@modules/automation-flows/flowDefaults";
import {
  DEFAULT_RUNTIME_SETTINGS,
  normalizedRuntimeSettings,
  normalizedTrigger,
  toBuilderEdges,
  toBuilderNodes,
} from "@modules/automation-flows/flowMapping";
import { createBuilderEdge, refreshBuilderEdgeLabels } from "@modules/automation-flows/flowEdges";
import { getFlowId } from "@modules/automation-flows/flowIdentity";
import type {
  AutomationFlow,
  BuilderEdge,
  BuilderNode,
  FlowNodeConfig,
  FlowNodeType,
  FlowRuntimeSettings,
  FlowTrigger,
} from "@modules/automation-flows/types";

function hasMeaningfulNodeChange(changes: NodeChange[]) {
  return changes.some((change) => !["select", "dimensions"].includes(change.type));
}

function hasMeaningfulEdgeChange(changes: EdgeChange[]) {
  return changes.some((change) => change.type !== "select");
}

export function useAutomationBuilder(flow: AutomationFlow | null) {
  const [nodes, setNodes, applyNodeChanges] = useNodesState([]);
  const [edges, setEdges, applyEdgeChanges] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [trigger, setTrigger] = useState<FlowTrigger>(DEFAULT_TRIGGER);
  const [runtimeSettings, setRuntimeSettings] = useState<FlowRuntimeSettings>(DEFAULT_RUNTIME_SETTINGS);
  const [fallbackNodeId, setFallbackNodeId] = useState<string | null>(null);
  const [handoverNodeId, setHandoverNodeId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const hydratedFlowId = useRef("");

  useEffect(() => {
    const flowId = flow ? getFlowId(flow) : "";
    if (!flow || !flowId || hydratedFlowId.current === flowId) return;
    hydratedFlowId.current = flowId;
    const loadedNodes = toBuilderNodes(flow.draft?.nodes);
    setNodes(loadedNodes);
    setEdges(toBuilderEdges(flow.draft?.edges, loadedNodes));
    setTrigger(normalizedTrigger(flow));
    setRuntimeSettings(normalizedRuntimeSettings(flow));
    setFallbackNodeId(flow.draft?.fallbackNodeId || null);
    setHandoverNodeId(flow.draft?.handoverNodeId || null);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setDirty(!flow.draft?.nodes?.length);
  }, [flow, setEdges, setNodes]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const protectedChanges = changes.filter((change) => {
      if (change.type !== "remove") return true;
      const node = nodes.find((item) => item.id === change.id);
      return node?.data.nodeType !== "start";
    });
    applyNodeChanges(protectedChanges);
    if (hasMeaningfulNodeChange(protectedChanges)) setDirty(true);
  }, [applyNodeChanges, nodes]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    applyEdgeChanges(changes);
    if (hasMeaningfulEdgeChange(changes)) setDirty(true);
  }, [applyEdgeChanges]);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const nextEdge = createBuilderEdge({
      id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    }, nodes as BuilderNode[]);
    setEdges((current) => [
      ...current.filter(
        (edge) =>
          !(
            edge.source === connection.source &&
            String(edge.sourceHandle || "default") ===
              String(connection.sourceHandle || "default")
          )
      ),
      nextEdge,
    ]);
    setSelectedEdgeId(nextEdge.id);
    setSelectedNodeId(null);
    setDirty(true);
  }, [nodes, setEdges]);

  const addNodeAtPosition = useCallback((
    type: FlowNodeType,
    position: { x: number; y: number }
  ) => {
    if (type === "start") return null;
    const node = createBuilderNode(type, position);
    setNodes((current) => [...current, node]);
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setDirty(true);
    return node;
  }, [setNodes]);

  const addNode = useCallback((type: FlowNodeType) => {
    const offset = nodes.length * 24;
    return addNodeAtPosition(type, {
      x: 380 + (offset % 240),
      y: 120 + (offset % 360),
    });
  }, [addNodeAtPosition, nodes.length]);

  const updateSelectedConfig = useCallback((config: FlowNodeConfig) => {
    if (!selectedNodeId) return;
    const nextNodes = nodes.map((node) =>
      node.id === selectedNodeId ? { ...node, data: { ...node.data, config } } : node
    );
    setNodes(nextNodes);
    setEdges((currentEdges) =>
      refreshBuilderEdgeLabels(currentEdges as BuilderEdge[], nextNodes as BuilderNode[])
    );
    setDirty(true);
  }, [nodes, selectedNodeId, setEdges, setNodes]);

  const renameHandle = useCallback((oldHandle: string, newHandle: string) => {
    if (!selectedNodeId || !oldHandle || !newHandle) return;
    setEdges((current) => {
      const withoutConflictingHandle = current.filter(
        (edge) =>
          !(
            edge.source === selectedNodeId &&
            edge.sourceHandle === newHandle &&
            edge.sourceHandle !== oldHandle
          )
      );
      const renamed = withoutConflictingHandle.map((edge) =>
        edge.source === selectedNodeId && edge.sourceHandle === oldHandle
          ? { ...edge, sourceHandle: newHandle }
          : edge
      );
      return refreshBuilderEdgeLabels(renamed as BuilderEdge[], nodes as BuilderNode[]);
    });
    setDirty(true);
  }, [nodes, selectedNodeId, setEdges]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode || selectedNode.data.nodeType === "start") return null;
    const deletedId = selectedNode.id;
    setNodes((current) => current.filter((node) => node.id !== deletedId));
    setEdges((current) => current.filter((edge) => edge.source !== deletedId && edge.target !== deletedId));
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setDirty(true);
    return deletedId;
  }, [selectedNode, setEdges, setNodes]);

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId) setSelectedEdgeId(null);
  }, []);

  const selectEdge = useCallback((edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    if (edgeId) setSelectedNodeId(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const deleteSelection = useCallback(() => {
    if (selectedEdgeId) {
      setEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId));
      setSelectedEdgeId(null);
      setDirty(true);
      return;
    }
    deleteSelectedNode();
  }, [deleteSelectedNode, selectedEdgeId, setEdges]);

  function changeTrigger(next: FlowTrigger) {
    setTrigger(next);
    setDirty(true);
  }

  function changeFallback(nodeId: string | null) {
    setFallbackNodeId(nodeId);
    setDirty(true);
  }

  function changeHandover(nodeId: string | null) {
    setHandoverNodeId(nodeId);
    setDirty(true);
  }

  function changeRuntimeSettings(next: FlowRuntimeSettings) {
    setRuntimeSettings(next);
    setDirty(true);
  }

  return {
    nodes: nodes as BuilderNode[],
    edges: edges as BuilderEdge[],
    selectedNode,
    selectedNodeId,
    selectedEdgeId,
    trigger,
    runtimeSettings,
    fallbackNodeId,
    handoverNodeId,
    dirty,
    setDirty,
    setSelectedNodeId: selectNode,
    setSelectedEdgeId: selectEdge,
    clearSelection,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    addNodeAtPosition,
    updateSelectedConfig,
    renameHandle,
    deleteSelectedNode,
    deleteSelection,
    changeTrigger,
    changeFallback,
    changeHandover,
    changeRuntimeSettings,
  };
}
