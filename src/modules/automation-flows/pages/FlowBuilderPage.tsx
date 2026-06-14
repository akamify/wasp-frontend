import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactFlowProvider, type ReactFlowInstance } from "reactflow";
import "reactflow/dist/style.css";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { BuilderCanvas } from "@modules/automation-flows/components/BuilderCanvas";
import { AutomationBuilderSkeleton } from "@modules/automation-flows/components/AutomationBuilderSkeleton";
import { BuilderTopBar } from "@modules/automation-flows/components/BuilderTopBar";
import { FlowSettingsPanel } from "@modules/automation-flows/components/FlowSettingsPanel";
import { NodePalette } from "@modules/automation-flows/components/NodePalette";
import { NodeSettingsPanel } from "@modules/automation-flows/components/NodeSettingsPanel";
import { SettingsSidebar } from "@modules/automation-flows/components/SettingsSidebar";
import { ValidationModal } from "@modules/automation-flows/components/ValidationModal";
import { toDraftPayload } from "@modules/automation-flows/flowMapping";
import { NODE_META } from "@modules/automation-flows/nodeCatalog";
import type {
  FlowNodeType,
  FlowValidationResult,
} from "@modules/automation-flows/types";
import { useAutomationBuilder } from "@modules/automation-flows/useAutomationBuilder";
import { useAutomationBuilderPreferences } from "@modules/automation-flows/useAutomationBuilderPreferences";
import { useFlowPublishWorkflow } from "@modules/automation-flows/useFlowPublishWorkflow";
import { useFlow } from "@modules/automation-flows/useFlows";
import { useToast } from "@shared/providers/ToastContext";

export default function FlowBuilderPage() {
  const { flowId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { flow, setFlow, loading, error, reload } = useFlow(flowId);
  const builder = useAutomationBuilder(flow);
  const [name, setName] = useState("");
  const [validation, setValidation] = useState<FlowValidationResult | null>(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const flowInstance = useRef<ReactFlowInstance | null>(null);
  const layout = useAutomationBuilderPreferences();

  useEffect(() => {
    if (flow) setName(flow.name);
  }, [flow]);

  const nameDirty = Boolean(flow && name.trim() !== flow.name);
  const dirty = builder.dirty || nameDirty;
  const editable = flow?.status !== "archived";
  const draftPayload = useMemo(
    () =>
      toDraftPayload(
        builder.trigger,
        builder.nodes,
        builder.edges,
        builder.fallbackNodeId,
        builder.handoverNodeId,
        builder.runtimeSettings
      ),
    [
      builder.edges,
      builder.fallbackNodeId,
      builder.handoverNodeId,
      builder.nodes,
      builder.runtimeSettings,
      builder.trigger,
    ]
  );
  const workflow = useFlowPublishWorkflow({
    flowId,
    flow,
    name,
    isDirty: dirty,
    payload: draftPayload,
    setFlow,
    setName,
    markSaved: () => builder.setDirty(false),
    showValidation: (result) => {
      setValidation(result);
      setValidationOpen(true);
      const firstNodeIssue = result.errors.find((issue) => issue.nodeId);
      const invalidNode = firstNodeIssue?.nodeId
        ? builder.nodes.find((node) => node.id === firstNodeIssue.nodeId)
        : null;
      if (invalidNode) {
        builder.setSelectedNodeId(invalidNode.id);
        void flowInstance.current?.setCenter(
          invalidNode.position.x + 115,
          invalidNode.position.y + 80,
          { zoom: 1, duration: 400 }
        );
      }
    },
    toast,
  });

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    function handleDelete(event: KeyboardEvent) {
      if (!["Delete", "Backspace"].includes(event.key)) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName || "")
      ) {
        return;
      }
      event.preventDefault();
      builder.deleteSelection();
    }
    window.addEventListener("keydown", handleDelete);
    return () => window.removeEventListener("keydown", handleDelete);
  }, [builder.deleteSelection]);

  useEffect(() => {
    const notifyResize = () => window.dispatchEvent(new Event("resize"));
    const frame = window.requestAnimationFrame(notifyResize);
    const timeout = window.setTimeout(notifyResize, 240);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [
    layout.isDesktop,
    layout.leftSidebarCollapsed,
    layout.rightSidebarOpen,
  ]);

  useEffect(() => {
    layout.updatePreference({
      lastActivePanel: builder.selectedNode ? "node_settings" : "flow_settings",
    });
  }, [builder.selectedNode, layout.updatePreference]);

  function goBack() {
    if (dirty && !window.confirm("Leave without saving your flow changes?")) return;
    navigate("/app/automation");
  }

  function focusValidationNode(nodeId: string) {
    const node = builder.nodes.find((item) => item.id === nodeId);
    if (!node) return;
    builder.setSelectedNodeId(nodeId);
    setValidationOpen(false);
    void flowInstance.current?.setCenter(node.position.x + 115, node.position.y + 80, {
      zoom: 1,
      duration: 400,
    });
  }

  function deleteSelectedNode() {
    const deletedId = builder.deleteSelectedNode();
    if (!deletedId) return;
    if (builder.fallbackNodeId === deletedId) builder.changeFallback(null);
    if (builder.handoverNodeId === deletedId) builder.changeHandover(null);
  }

  function addNodeFromPalette(type: FlowNodeType) {
    if (!editable) return;
    const node = builder.addNode(type);
    if (!node) return;
    layout.setRightSidebarOpen(true);
    if (!layout.isDesktop) layout.setMobileBlocksOpen(false);
  }

  function addNodeFromDrop(
    type: FlowNodeType,
    position: { x: number; y: number }
  ) {
    if (!editable) return;
    const node = builder.addNodeAtPosition(type, position);
    if (node) layout.setRightSidebarOpen(true);
  }

  if (loading) {
    return (
      <AutomationBuilderSkeleton
        leftCollapsed={layout.leftSidebarCollapsed}
        rightOpen={layout.rightSidebarOpen}
        leftWidth={layout.leftSidebarWidth}
        rightWidth={layout.rightSettingsWidth}
      />
    );
  }

  if (error || !flow) {
    return (
      <div className="p-8">
        <Alert tone="error">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span>{error || "Flow not found."}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/app/automation")}>
                Back to automations
              </Button>
              <Button variant="outline" size="sm" onClick={() => void reload()}>Retry</Button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="automation-builder flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <BuilderTopBar
        name={name}
        status={flow.status}
        dirty={dirty}
        editable={editable}
        isSaving={workflow.isSaving}
        isValidating={workflow.isValidating}
        isPublishing={workflow.isPublishing}
        canSave={workflow.canSave}
        canValidate={workflow.canValidate}
        canPublish={workflow.canPublish}
        validationStatus={workflow.validationStatus}
        lastSavedAt={workflow.lastSavedAt}
        blocksCollapsed={
          layout.isDesktop
            ? layout.leftSidebarCollapsed
            : !layout.mobileBlocksOpen
        }
        settingsOpen={layout.rightSidebarOpen}
        onNameChange={setName}
        onBack={goBack}
        onSave={() => void workflow.save()}
        onValidate={() => void workflow.validate()}
        onPublish={() => void workflow.publish()}
        onToggleBlocks={layout.toggleBlocks}
        onToggleSettings={layout.toggleSettings}
      />
      {flow.status === "archived" ? (
        <Alert tone="warn" className="m-3">Archived flows are read-only.</Alert>
      ) : null}
      <div className="relative flex h-full min-h-0 flex-1 overflow-hidden">
        {layout.mobileBlocksOpen ? (
          <button
            type="button"
            className="absolute inset-0 z-30 bg-slate-950/20 backdrop-blur-[1px] focus-visible:outline-none lg:hidden"
            onClick={() => layout.setMobileBlocksOpen(false)}
            aria-label="Close content blocks"
            title="Close content blocks"
          />
        ) : null}
        <NodePalette
          collapsed={layout.leftSidebarCollapsed}
          mobileOpen={layout.mobileBlocksOpen}
          width={layout.leftSidebarWidth}
          activeTab={layout.lastActiveLeftTab}
          onToggleCollapsed={() =>
            layout.setLeftSidebarCollapsed(!layout.leftSidebarCollapsed)
          }
          onCloseMobile={() => layout.setMobileBlocksOpen(false)}
          onActiveTabChange={(lastActiveLeftTab) =>
            layout.updatePreference({ lastActiveLeftTab })
          }
          onAdd={addNodeFromPalette}
        />
        <ReactFlowProvider>
          <BuilderCanvas
            nodes={builder.nodes}
            edges={builder.edges}
            editable={editable}
            onNodesChange={builder.onNodesChange}
            onEdgesChange={builder.onEdgesChange}
            onConnect={builder.onConnect}
            onNodeSelect={builder.setSelectedNodeId}
            onEdgeSelect={builder.setSelectedEdgeId}
            onClearSelection={builder.clearSelection}
            onDropNode={addNodeFromDrop}
            onInit={(instance) => { flowInstance.current = instance; }}
          />
        </ReactFlowProvider>
        <SettingsSidebar
          open={layout.rightSidebarOpen}
          width={layout.rightSettingsWidth}
          title={builder.selectedNode ? "Node Settings" : "Flow Settings"}
          subtitle={
            builder.selectedNode
              ? NODE_META[
                  builder.selectedNode.data.nodeType as FlowNodeType
                ].label
              : "Trigger, fallback and session behavior"
          }
          onClose={() => layout.setRightSidebarOpen(false)}
          onOpen={() => layout.setRightSidebarOpen(true)}
        >
          {builder.selectedNode ? (
            <NodeSettingsPanel
              node={builder.selectedNode}
              nodes={builder.nodes}
              flowId={flowId}
              onConfigChange={builder.updateSelectedConfig}
              onHandleRename={builder.renameHandle}
              onDelete={deleteSelectedNode}
            />
          ) : (
            <FlowSettingsPanel
              trigger={builder.trigger}
              nodes={builder.nodes}
              fallbackNodeId={builder.fallbackNodeId}
              handoverNodeId={builder.handoverNodeId}
              runtimeSettings={builder.runtimeSettings}
              onTriggerChange={builder.changeTrigger}
              onFallbackChange={builder.changeFallback}
              onHandoverChange={builder.changeHandover}
              onRuntimeSettingsChange={builder.changeRuntimeSettings}
            />
          )}
        </SettingsSidebar>
      </div>
      <ValidationModal open={validationOpen} result={validation} onClose={() => setValidationOpen(false)} onSelectNode={focusValidationNode} />
    </div>
  );
}
