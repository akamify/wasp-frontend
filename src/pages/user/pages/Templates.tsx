import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { API, clearApiGetCache } from "@api/api";
import { Button } from "@components/ui/Button";
import { useToast } from "@shared/providers/ToastContext";
import { TemplateForm } from "@pages/user/templates/TemplateForm";
import { TemplatePreview } from "@pages/user/templates/TemplatePreview";
import { TemplatesList } from "@pages/user/templates/TemplatesList";
import { TemplateSubmitConfirmModal } from "@modules/templates/components/TemplateSubmitConfirmModal";
import { TemplateRejectionModal } from "@modules/templates/components/TemplateRejectionModal";
import { TemplateHistoryModal } from "@modules/templates/components/TemplateHistoryModal";
import { useTemplatePreviewBrand } from "@modules/templates/hooks/useTemplatePreviewBrand";
import { buildTemplateSubmissionChecks } from "@modules/templates/utils/submissionChecks";
import { parseComponentsForPreview, truncateTemplateName } from "@pages/user/templates/helpers";
import type { TemplateItem, TemplateVersionItem } from "@pages/user/templates/types";
import { Pencil, X, Copy, SendHorizonal, CircleAlert, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TemplatesPage() {
  const FALLBACK_TEMPLATE_LANGUAGES = ["en_US", "en_GB", "hi", "ar", "pt_BR", "es", "fr", "de", "it", "id"];
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [templateMetadata, setTemplateMetadata] = useState<any>(null);
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const isInitialLoad = useRef(true);
  const [creating, setCreating] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [submitTarget, setSubmitTarget] = useState<TemplateItem | null>(null);
  const [rejectionTarget, setRejectionTarget] = useState<TemplateItem | null>(null);
  const [historyTarget, setHistoryTarget] = useState<TemplateItem | null>(null);
  const [historyVersions, setHistoryVersions] = useState<TemplateVersionItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const previewBrand = useTemplatePreviewBrand();


  const languageOptions = useMemo(() => {
    const apiLanguages = templates.map((template) => String(template.language || "").trim()).filter(Boolean);
    const unique = Array.from(new Set([...apiLanguages, ...FALLBACK_TEMPLATE_LANGUAGES]));
    if (!unique.includes("en_US")) unique.unshift("en_US");
    return unique;
  }, [templates]);

  const loadTemplates = useCallback(async () => {
    const isFirst = isInitialLoad.current;
    if (isFirst) setLoading(true);
    setSyncing(true);
    try {
      if (isFirst) {
        await API.templates.refreshWhatsApp().catch(() => null);
        clearApiGetCache();
      }
      const [response, connectionResponse] = await Promise.all([
        API.templates.list(),
        API.meta.connection().catch(() => null),
      ]);
      setTemplates(Array.isArray(response?.templates) ? response.templates : []);
      setTemplateMetadata(response?.metadata || null);
      setConnection(connectionResponse || null);
      if (!isFirst) toast("Templates refreshed", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to load templates", "error");
    } finally {
      setLoading(false);
      setSyncing(false);
      isInitialLoad.current = false;
    }
  }, [toast]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);



  useEffect(() => {
    const create = searchParams.get("create");
    const editId = searchParams.get("edit");

    if (create === "1") {
      setSelectedTemplate(null);
      setEditingTemplate(null);
      setShowEditPanel(false);
      setShowCreatePanel(true);
      return;
    }

    if (editId) {
      setSelectedTemplate(null);
      setShowCreatePanel(false);
      setShowEditPanel(true);

      const run = async () => {
        try {
          const fresh = await API.templates.get(editId);
          const resolved = fresh?.template?._id ? fresh.template : fresh?._id ? (fresh as any) : null;
          if (resolved?._id) {
            setEditingTemplate(resolved);
            return;
          }
          throw new Error("Template not found");
        } catch (e: any) {
          setShowEditPanel(false);
          setEditingTemplate(null);
          toast(e?.response?.data?.message || e?.message || "Failed to load template for edit", "error");
          setSearchParams({});
        }
      };
      void run();
      return;
    }

    setShowCreatePanel(false);
    setShowEditPanel(false);
    setEditingTemplate(null);
  }, [searchParams, setSearchParams]);

  const handleCreate = useCallback(async (payload: any) => {
    setCreating(true);
    try {
      await API.templates.create(payload);
      toast("Template created successfully.", "success");
      await loadTemplates();
      setSearchParams({});
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.response?.data?.details?.metaDebug?.meta?.error_user_msg || "Failed to create template";
      toast(message, "error");
    } finally { setCreating(false); }
  }, [loadTemplates, setSearchParams]);

  const handleCreateDraft = useCallback(async (payload: any) => {
    setSavingDraft(true);
    try {
      await API.templates.createDraft(payload);
      toast("Draft saved successfully.", "success");
      await loadTemplates();
      setSearchParams({});
    } catch (e: any) {
      const message = e?.response?.data?.message || "Failed to save draft";
      toast(message, "error");
    } finally { setSavingDraft(false); }
  }, [loadTemplates, setSearchParams, toast]);

  const handleEdit = useCallback(async (payload: any) => {
    if (!editingTemplate) return;
    setCreating(true);
    try {
      await API.templates.update(editingTemplate._id, {
        category: payload.category,
        components: payload.components,
      });
      toast("Template updated and sent to Meta for review.", "success");
      setShowEditPanel(false);
      setEditingTemplate(null);
      setSearchParams({});
      await loadTemplates();
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.response?.data?.details?.metaDebug?.meta?.error_user_msg || "Failed to update template";
      toast(message, "error");
    } finally { setCreating(false); }
  }, [editingTemplate, loadTemplates, setSearchParams]);

  const handleEditDraft = useCallback(async (payload: any) => {
    if (!editingTemplate) return;
    setSavingDraft(true);
    try {
      await API.templates.updateDraft(editingTemplate._id, payload);
      toast("Draft updated successfully.", "success");
      setShowEditPanel(false);
      setEditingTemplate(null);
      setSearchParams({});
      await loadTemplates();
    } catch (e: any) {
      const message = e?.response?.data?.message || "Failed to update draft";
      toast(message, "error");
    } finally { setSavingDraft(false); }
  }, [editingTemplate, loadTemplates, setSearchParams, toast]);

  const handleSubmitDraft = useCallback(async (payload: any) => {
    if (!editingTemplate) return;
    setCreating(true);
    try {
      await API.templates.updateDraft(editingTemplate._id, payload);
      await API.templates.submit(editingTemplate._id);
      toast("Draft submitted to Meta successfully.", "success");
      setShowEditPanel(false);
      setEditingTemplate(null);
      setSelectedTemplate(null);
      setSearchParams({});
      await loadTemplates();
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.response?.data?.details?.metaDebug?.meta?.error_user_msg || "Failed to submit draft";
      toast(message, "error");
    } finally { setCreating(false); }
  }, [editingTemplate, loadTemplates, setSearchParams, toast]);

  const openEditForTemplate = useCallback((template: TemplateItem) => {
    setSearchParams({ edit: template._id });
  }, [setSearchParams]);

  const runRowAction = useCallback(async (id: string, action: () => Promise<any>, success: string, fallbackError: string) => {
    setBusyId(id);
    try {
      await action();
      toast(success, "success");
      await loadTemplates();
    } catch (e: any) {
      toast(e?.response?.data?.details?.metaDebug?.meta?.error_user_msg || e?.response?.data?.message || fallbackError, "error");
    } finally { setBusyId(null); }
  }, [loadTemplates]);

  const selectTemplate = useCallback(async (template: TemplateItem) => {
    setSelectedTemplate(template);
    try {
      const fresh = await API.templates.get(template._id);
      if (fresh?.template?._id) setSelectedTemplate(fresh.template);
    } catch { }
  }, []);

  const previewData = useMemo(() => {
    if (!selectedTemplate) return { category: "utility" as const, headerType: "NONE" as const, headerText: "", mediaHandle: "", bodyText: "", footerText: "", ctaButtons: [] };
    const parsed = parseComponentsForPreview(selectedTemplate.components);
    return { category: selectedTemplate.category, ...parsed };
  }, [selectedTemplate]);

  const submitTargetValidation = useMemo(
    () => buildTemplateSubmissionChecks(submitTarget || { category: "utility", components: [] }),
    [submitTarget]
  );

  const openSubmitConfirmation = useCallback((template: TemplateItem) => {
    setSubmitTarget(template);
  }, []);

  const confirmSubmitTarget = useCallback(async () => {
    if (!submitTarget) return;
    const successMessage = submitTarget.status === "rejected" ? "Template resubmitted to Meta." : "Draft submitted to Meta.";
    await runRowAction(submitTarget._id, () => API.templates.submit(submitTarget._id), successMessage, "Submit failed");
    setSubmitTarget(null);
  }, [runRowAction, submitTarget]);

  const openHistory = useCallback(async (template: TemplateItem) => {
    setHistoryTarget(template);
    setHistoryLoading(true);
    try {
      const response = await API.templates.history(template._id);
      setHistoryVersions(Array.isArray(response?.versions) ? response.versions : []);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to load version history", "error");
      setHistoryTarget(null);
      setHistoryVersions([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [toast]);

  const restoreVersion = useCallback(async (version: TemplateVersionItem) => {
    if (!historyTarget) return;
    setRestoringVersionId(version._id);
    try {
      await API.templates.restoreVersion(historyTarget._id, version._id);
      toast(`Version ${version.versionNumber} restored successfully.`, "success");
      await openHistory(historyTarget);
      await loadTemplates();
      const fresh = await API.templates.get(historyTarget._id).catch(() => null);
      if (fresh?.template?._id) setSelectedTemplate(fresh.template);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to restore version", "error");
    } finally {
      setRestoringVersionId(null);
    }
  }, [historyTarget, loadTemplates, openHistory, toast]);

  return (
    <div className=" p-2 md:p-2 relative">
      {/* Main List */}
      <div className="relative">
        {showCreatePanel ? (
          <TemplateForm open={showCreatePanel} creating={creating} savingDraft={savingDraft} languageOptions={languageOptions} onClose={() => setSearchParams({})} onCreate={handleCreate} onSaveDraft={handleCreateDraft} />
        ) : showEditPanel && editingTemplate ? (
          <TemplateForm open={showEditPanel} creating={creating} savingDraft={savingDraft} mode="edit" initialStatus={editingTemplate.status} initialTemplate={{ name: editingTemplate.name, language: editingTemplate.language, category: editingTemplate.category, components: editingTemplate.components || [] }} languageOptions={languageOptions} onClose={() => setSearchParams({})} onCreate={handleEdit} onSaveDraft={editingTemplate.status === "draft" ? handleEditDraft : undefined} onSubmitDraft={editingTemplate.status === "draft" ? handleSubmitDraft : undefined} />
        ) : (
          <TemplatesList templates={templates} loading={loading} syncing={syncing} onRefresh={loadTemplates} busyId={busyId} selectedId={selectedTemplate?._id || null} onOpenAdd={() => setSearchParams({ create: "1" })} onSelectTemplate={selectTemplate} onEdit={openEditForTemplate} onDuplicate={(t) => runRowAction(t._id, () => API.templates.duplicate(t._id), "Draft duplicated.", "Duplicate failed")} onSubmitDraft={openSubmitConfirmation} onResubmitRejected={openSubmitConfirmation} onViewRejectedDetails={(t) => setRejectionTarget(t)} onSyncStatus={(id) => runRowAction(id, () => API.templates.status(id), "Status synced.", "Sync failed")} onDelete={(t) => { if (confirm(`Delete "${t.name}"?`)) runRowAction(t._id, () => API.templates.remove(t._id), "Deleted.", "Delete failed"); }} />
        )}
      </div>

      {/* Preview Slide-over */}
      <AnimatePresence>
        {selectedTemplate && !showCreatePanel && !showEditPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTemplate(null)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-[101] flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50 mt-16">
                <div className="flex items-center justify-between gap-4 mx-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-900 truncate uppercase tracking-widest">{truncateTemplateName(selectedTemplate.name)}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runRowAction(selectedTemplate._id, () => API.templates.duplicate(selectedTemplate._id), "Draft duplicated.", "Duplicate failed")}
                      className="h-9 px-3 rounded-[5px] text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-white-900 transition-all"
                    >
                      <Copy size={14} className="mr-2" /> Duplicate
                    </Button>
                    {selectedTemplate.status === "draft" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openSubmitConfirmation(selectedTemplate)}
                        className="h-9 px-3 rounded-[5px] text-emerald-700 font-black text-[10px] uppercase tracking-widest hover:bg-white-900 transition-all"
                      >
                        <SendHorizonal size={14} className="mr-2" /> Submit
                      </Button>
                    ) : null}
                    {selectedTemplate.status === "rejected" ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRejectionTarget(selectedTemplate)}
                          className="h-9 px-3 rounded-[5px] text-rose-700 font-black text-[10px] uppercase tracking-widest hover:bg-white-900 transition-all"
                        >
                          <CircleAlert size={14} className="mr-2" /> Rejected
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSubmitConfirmation(selectedTemplate)}
                          className="h-9 px-3 rounded-[5px] text-emerald-700 font-black text-[10px] uppercase tracking-widest hover:bg-white-900 transition-all"
                        >
                          <SendHorizonal size={14} className="mr-2" /> Resubmit
                        </Button>
                      </>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void openHistory(selectedTemplate)}
                      className="h-9 px-3 rounded-[5px] text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-white-900 transition-all"
                    >
                      <History size={14} className="mr-2" /> History
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditForTemplate(selectedTemplate)}
                      className="h-9 px-3 rounded-[5px] text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-white-900 transition-all"
                    >
                      <Pencil size={14} className="mr-2" /> Edit
                    </Button>
                    <button onClick={() => setSelectedTemplate(null)} className="h-9 px-3 rounded-[5px] text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-white-900 transition-all">
                      <X size={18} className="mr-2" />
                    </button>
                  </div>
                </div>
                <div className="max-w-sm mx-auto">
                  <TemplatePreview {...previewData} variableValues={{}} previewBrand={previewBrand} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <TemplateSubmitConfirmModal
        open={!!submitTarget}
        busy={busyId === submitTarget?._id}
        templateName={submitTarget?.name || ""}
        checks={submitTargetValidation.checks}
        onClose={() => setSubmitTarget(null)}
        onConfirm={() => void confirmSubmitTarget()}
      />
      <TemplateRejectionModal
        open={!!rejectionTarget}
        template={rejectionTarget}
        busy={busyId === rejectionTarget?._id}
        onClose={() => setRejectionTarget(null)}
        onFix={(template) => {
          setRejectionTarget(null);
          openEditForTemplate(template);
        }}
        onResubmit={(template) => {
          setRejectionTarget(null);
          openSubmitConfirmation(template);
        }}
      />
      <TemplateHistoryModal
        open={!!historyTarget}
        template={historyTarget}
        versions={historyVersions}
        loading={historyLoading}
        restoringVersionId={restoringVersionId}
        onClose={() => {
          setHistoryTarget(null);
          setHistoryVersions([]);
        }}
        onRestore={(version) => {
          void restoreVersion(version);
        }}
      />
    </div>
  );
}

