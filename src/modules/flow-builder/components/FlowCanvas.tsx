import { useCallback, useEffect, useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState, type Connection } from "reactflow";
import { useFlowBuilderStore } from "@modules/flow-builder/store";
import { ScreenNode } from "@modules/flow-builder/components/ScreenNode";
import type { ScreenNodeData } from "@modules/flow-builder/types";

export function FlowCanvas() {
  const storeNodes = useFlowBuilderStore((s) => s.nodes);
  const storeEdges = useFlowBuilderStore((s) => s.edges);
  const setStoreEdges = useFlowBuilderStore((s) => s.setEdges);
  const setSelectedNodeId = useFlowBuilderStore((s) => s.setSelectedNodeId);
  const addScreenNode = useFlowBuilderStore((s) => s.addScreenNode);

  const [nodes, setNodes, onNodesChange] = useNodesState<ScreenNodeData>(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  useEffect(() => setNodes(storeNodes), [storeNodes, setNodes]);
  useEffect(() => setEdges(storeEdges), [storeEdges, setEdges]);

  const nodeTypes = useMemo(() => ({ screenNode: ScreenNode }), []);

  const syncEdges = useCallback((next: any) => {
    setEdges(next);
    const resolved = typeof next === "function" ? next(edges) : next;
    setStoreEdges(resolved);
  }, [edges, setEdges, setStoreEdges]);

  const onConnect = useCallback((connection: Connection) => syncEdges((eds: any) => addEdge({ ...connection, animated: true }, eds)), [syncEdges]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const bounds = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    addScreenNode({ x, y });
  }, [addScreenNode]);

  return (
    <div className="h-[460px] overflow-hidden rounded-[6px] border border-slate-200 bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
