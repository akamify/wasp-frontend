import { create } from "zustand";
import { temporal } from "zundo";
import type { Edge, Node } from "reactflow";
import type { FlowComponent, ScreenNodeData } from "./types";

type BuilderState = {
  nodes: Node<ScreenNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  metaFlowId: string;
  setMetaFlowId: (id: string) => void;
  setNodes: (nodes: Node<ScreenNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  addScreenNode: (position?: { x: number; y: number }) => string;
  updateNodeTitle: (nodeId: string, title: string) => void;
  addComponentToSelectedNode: (type: FlowComponent["type"]) => void;
  updateComponent: (nodeId: string, componentId: string, patch: Partial<FlowComponent>) => void;
  removeComponent: (nodeId: string, componentId: string) => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const componentFactory = (type: FlowComponent["type"]): FlowComponent => ({
  id: `cmp_${uid()}`,
  type,
  label: type === "Footer" ? "Continue" : type,
  required: type !== "Text",
  placeholder: type === "TextInput" ? "Type here..." : "",
  options: type === "Dropdown" || type === "Radio" ? ["Option 1", "Option 2"] : undefined,
  nextScreenId: type === "Footer" ? "" : undefined,
});

const initialNodeId = "screen_1";

export const useFlowBuilderStore = create<BuilderState>()(
  temporal((set, get) => ({
    nodes: [
      {
        id: initialNodeId,
        type: "screenNode",
        position: { x: 120, y: 120 },
        data: { title: "Lead Form", components: [componentFactory("TextInput"), componentFactory("Footer")] },
      },
    ],
    edges: [],
    selectedNodeId: initialNodeId,
    metaFlowId: "",
    setMetaFlowId: (id) => set({ metaFlowId: id }),
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    addScreenNode: (position = { x: 320, y: 220 }) => {
      const id = `screen_${uid()}`;
      set((state) => ({
        nodes: [...state.nodes, { id, type: "screenNode", position, data: { title: "New Screen", components: [] } }],
        selectedNodeId: id,
      }));
      return id;
    },
    updateNodeTitle: (nodeId, title) =>
      set((state) => ({
        nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, title } } : n)),
      })),
    addComponentToSelectedNode: (type) => {
      const selectedNodeId = get().selectedNodeId;
      if (!selectedNodeId) return;
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === selectedNodeId
            ? { ...n, data: { ...n.data, components: [...(n.data.components || []), componentFactory(type)] } }
            : n
        ),
      }));
    },
    updateComponent: (nodeId, componentId, patch) =>
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  components: (n.data.components || []).map((c) => (c.id === componentId ? { ...c, ...patch } : c)),
                },
              }
            : n
        ),
      })),
    removeComponent: (nodeId, componentId) =>
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, components: (n.data.components || []).filter((c) => c.id !== componentId) } }
            : n
        ),
      })),
  }))
);
