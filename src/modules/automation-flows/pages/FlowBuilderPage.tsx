import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactFlowProvider, type ReactFlowInstance } from "reactflow";
import "reactflow/dist/style.css";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { BuilderCanvas } from "@modules/automation-flows/components/BuilderCanvas";
import { BuilderTopBar } from "@modules/automation-flows/components/BuilderTopBar";
import { FlowSettingsPanel } from "@modules/automation-flows/components/FlowSettingsPanel";
import { NodePalette } from "@modules/automation-flows/components/NodePalette";
import { NodeSettingsPanel } from "@modules/automation-flows/components/NodeSettingsPanel";
import { ValidationModal } from "@modules/automation-flows/components/ValidationModal";
import { flowsApi } from "@modules/automation-flows/flowsApi";
import { toDraftPayload } from "@modules/automation-flows/flowMapping";
import type { AutomationFlow, FlowValidationResult } from "@modules/automation-flows/types";
import { useAutomationBuilder } from "@modules/automation-flows/useAutomationBuilder";
import { useFlow } from "@modules/automation-flows/useFlows";
import { useToast } from "@shared/providers/ToastContext";

function requestMessage(error: unknown, fallback: string) {
  const errorLike = error as {
    userMessage?: string;
    message?: string;
    response?: { data?: { message?: string } };
  };
  return errorLike.userMessage || errorLike.response?.data?.message || errorLike.message || fallback;
}

function validationFromError(error: unknown): FlowValidationResult | null {
  const errorLike = error as {
    response?: {
      data?: {
        valid?: boolean;
        errors?: FlowValidationResult["errors"];
        warnings?: FlowValidationResult["warnings"];
        details?: FlowValidationResult;
      };
    };
  };
  const data = errorLike.response?.data;
  if (data?.details?.errors) return data.details;
  if (Array.isArray(data?.errors)) {
    return { valid: Boolean(data.valid), errors: data.errors, warnings: data.warnings || [] };
  }
  return null;
}

export default function FlowBuilderPage() {
  const { flowId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { flow, setFlow, loading, error, reload } = useFlow(flowId);
  const builder = useAutomationBuilder(flow);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [validation, setValidation] = useState<FlowValidationResult | null>(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const flowInstance = useRef<ReactFlowInstance | null>(null);

  useEffect(() => {
    if (flow) setName(flow.name);
  }, [flow]);

  const nameDirty = Boolean(flow && name.trim() !== flow.name);
  const dirty = builder.dirty || nameDirty;
  const editable = flow?.status !== "archived";

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

  function goBack() {
    if (dirty && !window.confirm("Leave without saving your flow changes?")) return;
    navigate("/app/automation");
  }

  async function saveCurrentDraft(showToast = true): Promise<AutomationFlow | null> {
    if (!flowId || !flow || !name.trim()) {
      toast("Flow name is required.", "warning");
      return null;
    }
    setBusy(true);
    try {
      let currentFlow = flow;
      if (nameDirty) {
        const metadata = await flowsApi.updateMetadata(flowId, { name: name.trim() });
        currentFlow = metadata.flow;
      }
      const payload = toDraftPayload(
        builder.trigger,
        builder.nodes,
        builder.edges,
        builder.fallbackNodeId,
        builder.handoverNodeId
      );
      const response = await flowsApi.saveDraft(flowId, payload);
      const saved = { ...response.flow, name: currentFlow.name };
      setFlow(saved);
      setName(saved.name);
      builder.setDirty(false);
      if (showToast) toast("Flow draft saved.", "success");
      return saved;
    } catch (requestError: unknown) {
      toast(requestMessage(requestError, "Unable to save flow draft."), "error");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function validateCurrentDraft() {
    const saved = await saveCurrentDraft(false);
    if (!saved || !flowId) return;
    setBusy(true);
    try {
      const result = await flowsApi.validate(flowId);
      setValidation(result);
      setValidationOpen(true);
      toast(result.valid ? "Flow validation passed." : "Flow needs attention.", result.valid ? "success" : "warning");
    } catch (requestError: unknown) {
      toast(requestMessage(requestError, "Unable to validate flow."), "error");
    } finally {
      setBusy(false);
    }
  }

  async function publishCurrentDraft() {
    const saved = await saveCurrentDraft(false);
    if (!saved || !flowId) return;
    setBusy(true);
    try {
      const result = await flowsApi.publish(flowId);
      setValidation(result.validation);
      setFlow({ ...saved, status: "active", activeVersionId: result.version._id });
      toast(`Flow published as version ${result.version.versionNumber}.`, "success");
    } catch (requestError: unknown) {
      const result = validationFromError(requestError);
      if (result) {
        setValidation(result);
        setValidationOpen(true);
      }
      toast(requestMessage(requestError, "Unable to publish flow."), "error");
    } finally {
      setBusy(false);
    }
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

  if (loading) {
    return <div className="h-[calc(100dvh-4rem)] animate-pulse bg-slate-100" />;
  }

  if (error || !flow) {
    return (
      <div className="p-8">
        <Alert tone="error">
          <div className="flex items-center justify-between gap-4">
            <span>{error || "Flow not found."}</span>
            <Button variant="outline" size="sm" onClick={() => void reload()}>Retry</Button>
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
        busy={busy}
        editable={editable}
        onNameChange={setName}
        onBack={goBack}
        onSave={() => void saveCurrentDraft()}
        onValidate={() => void validateCurrentDraft()}
        onPublish={() => void publishCurrentDraft()}
      />
      {flow.status === "archived" ? (
        <Alert tone="warn" className="m-3">Archived flows are read-only.</Alert>
      ) : null}
      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
        <NodePalette onAdd={(type) => editable && builder.addNode(type)} />
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
            onDropNode={builder.addNodeAtPosition}
            onInit={(instance) => { flowInstance.current = instance; }}
          />
        </ReactFlowProvider>
        <aside className="relative z-20 hidden w-[320px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-5 custom-scrollbar lg:block xl:w-[360px]">
          {builder.selectedNode ? (
            <NodeSettingsPanel
              node={builder.selectedNode}
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
              onTriggerChange={builder.changeTrigger}
              onFallbackChange={builder.changeFallback}
              onHandoverChange={builder.changeHandover}
            />
          )}
        </aside>
      </div>
      <ValidationModal open={validationOpen} result={validation} onClose={() => setValidationOpen(false)} onSelectNode={focusValidationNode} />
    </div>
  );
}
