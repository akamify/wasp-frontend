import { useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { useToast } from "@shared/providers/ToastContext";
import {
  FLOW_CATEGORIES,
  FLOW_TEMPLATES,
  templateToFlowJson,
  type FlowTemplate,
  type FlowTemplateType,
} from "@modules/flow-builder/templateEngine";
import { TemplateFlowPreview } from "@modules/flow-builder/components/TemplateFlowPreview";
import { cn } from "@shared/utils/cn";

function getErrorMessage(e: any, fallback: string) {
  return e?.userMessage || e?.response?.data?.details?.providerError || e?.response?.data?.message || e?.message || fallback;
}

export default function FlowsCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [templateType, setTemplateType] = useState<FlowTemplateType>("without_endpoint");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const screensScrollerRef = useRef<HTMLDivElement | null>(null);

  const filteredTemplates = useMemo(
    () =>
      FLOW_TEMPLATES.filter((t) => t.type === templateType).filter((t) =>
        category ? t.category.toLowerCase() === category.toLowerCase() : true
      ),
    [category, templateType]
  );

  const selectedTemplate: FlowTemplate | null = useMemo(() => {
    if (selectedTemplateId) return filteredTemplates.find((t) => t.id === selectedTemplateId) || null;
    return filteredTemplates[0] || null;
  }, [filteredTemplates, selectedTemplateId]);

  const selectedScreen = selectedTemplate?.screens[currentScreenIndex] || selectedTemplate?.screens[0] || null;

  const handleTemplatePick = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setCurrentScreenIndex(0);
  };

  const handleContinue = (_payload: Record<string, string | string[] | boolean>) => {
    if (!selectedTemplate) return;
    const nextIndex = currentScreenIndex + 1;
    if (nextIndex < selectedTemplate.screens.length) {
      setCurrentScreenIndex(nextIndex);
      return;
    }
    toast("Preview flow completed.", "success");
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast("Flow name is required.", "warning");
      return;
    }
    if (!selectedTemplate) {
      toast("Select a template first.", "warning");
      return;
    }

    setBusy(true);
    try {
      const created = await API.meta.createFlow({
        name: name.trim(),
        categories: [category || "OTHER"],
      });
      const flowId = created?.id || created?.data?.id || created?.flow?.id;
      if (!flowId) throw new Error("Flow created but flow ID missing.");

      const flowJson = templateToFlowJson(selectedTemplate);
      await API.meta.uploadFlowJson(flowId, flowJson);
      toast("Flow created and template JSON uploaded.", "success");
      navigate("/app/flows");
    } catch (e: any) {
      toast(getErrorMessage(e, "Failed to create flow"), "error");
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink-900">Flow Builder</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-800/50">Template engine + mobile preview</p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/app/flows")} className="gap-2 border border-slate-200 bg-white">
          <ArrowLeft size={16} />
          Back to List
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          <Card className="flex items-start justify-between flex-col p-6 gap-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              maxLength={200}
              hint={`${name.length}/200`}
            />
            <Select label="Categories" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select categories</option>
              {FLOW_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Card>

          <Card className="p-6">
            <h2 className="text-[18px] font-black text-slate-900">Template</h2>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setTemplateType("without_endpoint");
                  setSelectedTemplateId("");
                  setCurrentScreenIndex(0);
                }}
                className={cn(
                  "rounded-xl px-5 py-3 text-[12px] font-semibold",
                  templateType === "without_endpoint" ? "bg-blue-100 text-blue-700" : "text-slate-900 hover:bg-slate-100"
                )}
              >
                Without Endpoint
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplateType("with_endpoint");
                  setSelectedTemplateId("");
                  setCurrentScreenIndex(0);
                }}
                className={cn(
                  "rounded-xl px-5 py-3 text-[12px] font-semibold",
                  templateType === "with_endpoint" ? "bg-blue-100 text-blue-700" : "text-slate-900 hover:bg-slate-100"
                )}
              >
                With Endpoint
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {filteredTemplates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No templates found for this category.
                </div>
              ) : (
                filteredTemplates.map((template) => {
                  const selected = (selectedTemplate?.id || "") === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleTemplatePick(template.id)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition",
                        selected
                          ? "border-blue-300 bg-gradient-to-r from-blue-100/80 from-55% to-transparent"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white", selected ? "border-blue-600" : "border-slate-300")}>
                        <span className={cn("h-2.5 w-2.5 rounded-full", selected ? "bg-blue-600 border-blue-600" : "bg-transparent")} />
                      </span>
                      <span className="block">
                        <span className="block text-[12px] font-medium text-slate-900">{template.name}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">Flow Preview</h2>
          </div>

          <div className="mx-auto h-[640px] max-w-[420px]">
            {selectedTemplate && selectedScreen ? (
              <TemplateFlowPreview
                template={selectedTemplate}
                screen={selectedScreen}
                screenIndex={currentScreenIndex}
                onContinue={handleContinue}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-[26px] border border-slate-300 bg-slate-100 text-slate-500">
                Pick a template to preview.
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div ref={screensScrollerRef} className="flex-1 overflow-x-auto">
              <div className="flex min-w-max gap-2 pb-1">
                {(selectedTemplate?.screens || []).map((scr, idx) => (
                  <button
                    key={scr.id}
                    type="button"
                    onClick={() => setCurrentScreenIndex(idx)}
                    className={cn(
                      "rounded-[5px] border px-3 py-1.5 text-xs font-semibold",
                      idx === currentScreenIndex ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"
                    )}
                  >
                    {scr.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="sticky bottom-0 z-20 rounded-xl border border-slate-200 bg-white/95 p-4 backdrop-blur">
        <div className="flex flex-wrap items-end justify-end gap-4">
          <Button
            className="h-14 min-w-[130px] bg-emerald-200 text-emerald-50 hover:bg-emerald-300"
            onClick={handleCreate}
            disabled={busy || !name.trim() || !selectedTemplate}
          >
            {busy ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
