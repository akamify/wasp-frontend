import type { Edge, Node } from "reactflow";
import type { ScreenNodeData, ValidationIssue } from "./types";

export function generateFlowJson(nodes: Node<ScreenNodeData>[], edges: Edge[]) {
  const screens = nodes.map((node) => ({
    id: node.id,
    title: node.data.title,
    layout: {
      type: "SingleColumnLayout",
      children: (node.data.components || []).map((c) => ({
        type: c.type,
        name: c.id,
        label: c.label,
        required: !!c.required,
        placeholder: c.placeholder || undefined,
        options: c.options || undefined,
        nextScreenId: c.nextScreenId || undefined,
      })),
    },
  }));
  return { version: "3.1", screens, edges: edges.map((e) => ({ source: e.source, target: e.target })) };
}

export function validateFlow(nodes: Node<ScreenNodeData>[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  for (const node of nodes) {
    const components = node.data.components || [];
    if (components.length === 0) {
      issues.push({ id: `empty-${node.id}`, level: "error", message: `${node.data.title}: empty screen.` });
    }
    const hasFooter = components.some((c) => c.type === "Footer");
    if (!hasFooter) {
      issues.push({ id: `footer-${node.id}`, level: "error", message: `${node.data.title}: footer missing.` });
    }
    for (const c of components) {
      if (c.type === "Footer" && c.nextScreenId && !nodeIds.has(c.nextScreenId)) {
        issues.push({ id: `nav-${node.id}-${c.id}`, level: "error", message: `${node.data.title}: invalid navigation target.` });
      }
    }
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      issues.push({ id: `edge-${edge.id}`, level: "error", message: "Broken edge detected." });
    }
  }

  return issues;
}
