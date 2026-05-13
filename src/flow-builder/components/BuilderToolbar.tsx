import { API } from "../../api/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../context/ToastContext";
import { useFlowBuilderStore } from "../store";
import { generateFlowJson, validateFlow } from "../utils";

export function BuilderToolbar() {
  const { toast } = useToast();
  const nodes = useFlowBuilderStore((s) => s.nodes);
  const edges = useFlowBuilderStore((s) => s.edges);
  const addScreenNode = useFlowBuilderStore((s) => s.addScreenNode);
  const metaFlowId = useFlowBuilderStore((s) => s.metaFlowId);
  const setMetaFlowId = useFlowBuilderStore((s) => s.setMetaFlowId);

  const undo = () => useFlowBuilderStore.temporal.getState().undo();
  const redo = () => useFlowBuilderStore.temporal.getState().redo();

  const onValidate = () => {
    const issues = validateFlow(nodes, edges);
    if (!issues.length) toast("Validation passed.", "success");
    else toast(`${issues.length} validation issue(s) found.`, "warning");
  };

  const onSyncMeta = async () => {
    if (!metaFlowId.trim()) {
      toast("Meta Flow ID is required for sync.", "warning");
      return;
    }
    const issues = validateFlow(nodes, edges).filter((i) => i.level === "error");
    if (issues.length) {
      toast("Fix validation errors before Meta sync.", "error");
      return;
    }
    const flowJson = generateFlowJson(nodes, edges);
    try {
      await API.meta.uploadFlowJson(metaFlowId.trim(), flowJson);
      await API.meta.publishFlow(metaFlowId.trim());
      toast("Meta sync + publish successful.", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Meta sync failed", "error");
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-[6px] border border-slate-200 bg-white p-3">
      <Button variant="ghost" onClick={() => addScreenNode()} className="border border-slate-200">+ Screen</Button>
      <Button variant="ghost" onClick={undo} className="border border-slate-200">Undo</Button>
      <Button variant="ghost" onClick={redo} className="border border-slate-200">Redo</Button>
      <Button variant="ghost" onClick={onValidate} className="border border-slate-200">Validate</Button>
      <div className="min-w-[260px] flex-1">
        <Input label="Meta Flow ID" value={metaFlowId} onChange={(e) => setMetaFlowId(e.target.value)} placeholder="flow id for publish" />
      </div>
      <Button onClick={onSyncMeta}>Meta Sync + Publish</Button>
    </div>
  );
}
