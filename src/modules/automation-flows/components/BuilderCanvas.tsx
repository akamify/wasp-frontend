import { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
  useReactFlow,
} from "reactflow";
import { Move, Plus } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { AutomationNode } from "@modules/automation-flows/components/AutomationNode";
import { NODE_CATALOG } from "@modules/automation-flows/nodeCatalog";
import type { BuilderEdge, BuilderNode, FlowNodeType } from "@modules/automation-flows/types";

interface BuilderCanvasProps {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  editable: boolean;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onEdgeSelect: (edgeId: string | null) => void;
  onClearSelection: () => void;
  onDropNode: (type: FlowNodeType, position: { x: number; y: number }) => void;
  onInit: (instance: ReactFlowInstance) => void;
}

export function BuilderCanvas({
  nodes,
  edges,
  editable,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeSelect,
  onEdgeSelect,
  onClearSelection,
  onDropNode,
  onInit,
}: Readonly<BuilderCanvasProps>) {
  const nodeTypes = useMemo(() => ({ automationNode: AutomationNode }), []);
  const [dragActive, setDragActive] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (!dragActive) setDragActive(true);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    if (!editable) return;
    const rawType = event.dataTransfer.getData("application/reactflow");
    const validType = NODE_CATALOG.some((item) => item.type === rawType);
    if (!validType) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    onDropNode(rawType as FlowNodeType, position);
  }

  return (
    <div
      className={cn(
        "relative h-full min-h-0 min-w-0 flex-1 bg-slate-50 transition-shadow",
        dragActive && "inset-ring-4 inset-ring-brand-400/40"
      )}
      onDragEnter={() => setDragActive(true)}
      onDragOver={handleDragOver}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false);
      }}
      onDrop={handleDrop}
    >
      <ReactFlow
        className="h-full w-full"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeSelect(node.id)}
        onEdgeClick={(_, edge) => onEdgeSelect(edge.id)}
        onPaneClick={onClearSelection}
        onInit={onInit}
        nodesDraggable={editable}
        nodesConnectable={editable}
        edgesUpdatable={editable}
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.24 }}
        minZoom={0.25}
        maxZoom={1.6}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.25} color="#cbd5e1" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor="#06b77e"
          maskColor="rgba(248,250,252,0.75)"
          className="!border !border-slate-200 !bg-white"
        />
      </ReactFlow>
      {nodes.length <= 1 ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="max-w-sm rounded-[12px] border border-dashed border-slate-300 bg-white/90 px-6 py-5 text-center shadow-lg shadow-slate-900/5 backdrop-blur">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[8px] bg-brand-50 text-brand-700">
              <Move size={19} />
            </div>
            <div className="mt-3 text-sm font-black text-slate-800">Drag blocks from the left</div>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
              Drop them anywhere to build your automation flow.
            </p>
          </div>
        </div>
      ) : null}
      {dragActive ? (
        <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-[12px] border-2 border-dashed border-brand-500 bg-brand-50/70 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-brand-700 shadow-lg">
            <Plus size={15} />
            Drop block here
          </div>
        </div>
      ) : null}
    </div>
  );
}
