import { useCallback, useEffect, useMemo, useState } from "react";
import { API } from "../api/api";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { TemplateForm } from "./templates/TemplateForm";
import { TemplatePreview } from "./templates/TemplatePreview";
import { TemplatesList } from "./templates/TemplatesList";
import { parseComponentsForPreview } from "./templates/helpers";
import type { TemplateItem } from "./templates/types";
import { Pencil, X } from "lucide-react";

export default function TemplatesPage() {
  const FALLBACK_TEMPLATE_LANGUAGES = [
    "en_US",
    "en_GB",
    "hi",
    "ar",
    "pt_BR",
    "es",
    "fr",
    "de",
    "it",
    "id",
  ];
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [syncingMeta, setSyncingMeta] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);

  const approvedCount = useMemo(
    () => templates.filter((template) => String(template.status).toLowerCase() === "approved").length,
    [templates]
  );

  const languageOptions = useMemo(() => {
    const apiLanguages = templates
      .map((template) => String(template.language || "").trim())
      .filter(Boolean);
    const unique = Array.from(new Set([...apiLanguages, ...FALLBACK_TEMPLATE_LANGUAGES]));
    if (!unique.includes("en_US")) unique.unshift("en_US");
    return unique;
  }, [templates]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.templates.list();
      setTemplates(Array.isArray(response?.templates) ? response.templates : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!ok) return;
    const timer = setTimeout(() => setOk(null), 3000);
    return () => clearTimeout(timer);
  }, [ok]);

  const handleCreate = useCallback(async (payload: any) => {
    setCreating(true);
    setError(null);
    setOk(null);
    try {
      await API.templates.create(payload);
      setOk("Template created successfully.");
      await loadTemplates();
    } catch (e: any) {
      const meta = e?.response?.data?.details?.metaDebug?.meta;
      const subcode = meta?.error_subcode;

      // Meta transient lock: 2388023 "language is being deleted" can stick to a template name for a while.
      // Fastest unblock is to create the template under a new unique name.
      if (Number(subcode) === 2388023 && payload?.name) {
        try {
          const existingNames = new Set(
            templates.map((t) => String(t?.name || "").trim().toLowerCase()).filter(Boolean)
          );
          const base = String(payload.name || "").trim().toLowerCase();
          const safeBase = base.replace(/[^a-z0-9_]/g, "_").slice(0, 450);
          const candidate = `${safeBase}_${Date.now()}`.slice(0, 512);
          const newName = existingNames.has(candidate) ? `${safeBase}_${Date.now()}_2`.slice(0, 512) : candidate;

          await API.templates.create({ ...payload, name: newName });
          setOk(`Meta lock detected. Template created as "${newName}" instead.`);
          await loadTemplates();
          return;
        } catch (retryErr: any) {
          const retryMessage =
            retryErr?.response?.data?.details?.metaDebug?.meta?.error_user_msg ||
            retryErr?.response?.data?.message ||
            meta?.error_user_msg ||
            "Failed to create template";
          setError(retryMessage);
          return;
        }
      }

      const message =
        meta?.error_user_msg ||
        e?.response?.data?.message ||
        "Failed to create template";
      setError(message);
    } finally {
      setCreating(false);
    }
  }, [loadTemplates, templates]);

  const handleEdit = useCallback(async (payload: any) => {
    if (!editingTemplate) return;
    setCreating(true);
    setError(null);
    setOk(null);
    try {
      const nameLower = String(editingTemplate.name || "").trim().toLowerCase();

      const existingNames = new Set(
        templates.map((t) => String(t?.name || "").trim().toLowerCase()).filter(Boolean)
      );
      const makeUniqueName = (base: string) => {
        const cleanBase = String(base || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
        if (!existingNames.has(cleanBase)) return cleanBase;
        for (let i = 2; i < 5000; i += 1) {
          const candidate = `${cleanBase}_v${i}`;
          if (!existingNames.has(candidate)) return candidate;
        }
        return `${cleanBase}_${Date.now()}`;
      };

      // Meta's built-in sample template `hello_world` cannot be edited/submitted via API.
      // So we "Save as New" by creating a new template name instead of updating in-place.
      if (nameLower === "hello_world") {
        const newName = makeUniqueName("hello_world_v2");
        try {
          await API.templates.create({
            name: newName,
            language: editingTemplate.language,
            category: payload.category,
            components: payload.components,
          });
          setOk(`Sample template duplicated as "${newName}" and submitted to Meta for review.`);
        } catch (e: any) {
          const meta = e?.response?.data?.details?.metaDebug?.meta;
          const subcode = meta?.error_subcode;
          if (Number(subcode) === 2388023) {
            const fallbackName = makeUniqueName(`${newName}_${Date.now()}`);
            await API.templates.create({
              name: fallbackName,
              language: editingTemplate.language,
              category: payload.category,
              components: payload.components,
            });
            setOk(`Meta lock detected. Sample template duplicated as "${fallbackName}" instead.`);
          } else {
            throw e;
          }
        }
        setShowEditPanel(false);
        setEditingTemplate(null);
        await loadTemplates();
        return;
      }

      await API.templates.update(editingTemplate._id, {
        category: payload.category,
        components: payload.components,
      });
      await API.templates.submit(editingTemplate._id);
      setOk("Template updated and re-submitted to Meta for review.");
      setShowEditPanel(false);
      setEditingTemplate(null);
      await loadTemplates();
    } catch (e: any) {
      const message =
        e?.response?.data?.details?.metaDebug?.meta?.error_user_msg ||
        e?.response?.data?.details?.providerError ||
        e?.response?.data?.message ||
        "Failed to update template";
      setError(message);
    } finally {
      setCreating(false);
    }
  }, [editingTemplate, loadTemplates]);

  const syncMetaTemplates = useCallback(async () => {
    setSyncingMeta(true);
    setError(null);
    setOk(null);
    try {
      const response = await API.templates.syncMeta({});
      setOk(`Synced ${response?.count || 0} template(s) from Meta.`);
      await loadTemplates();
    } catch (e: any) {
      const message = e?.response?.data?.details?.metaDebug?.meta?.error_user_msg || e?.response?.data?.message || "Meta sync failed";
      setError(message);
    } finally {
      setSyncingMeta(false);
    }
  }, [loadTemplates]);

  const syncAndRefreshTemplates = useCallback(async () => {
    await syncMetaTemplates();
  }, [syncMetaTemplates]);

  const openEditForTemplate = useCallback(async (template: TemplateItem) => {
    setError(null);
    setOk(null);
    try {
      const fresh = await API.templates.get(template._id);
      const resolved = fresh?.template?._id ? fresh.template : template;
      setEditingTemplate(resolved);
      setShowEditPanel(true);
      setSelectedTemplate(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load template for edit");
    }
  }, []);

  const runRowAction = useCallback(async (id: string, action: () => Promise<any>, success: string, fallbackError: string) => {
    setBusyId(id);
    setError(null);
    setOk(null);
    try {
      await action();
      setOk(success);
      await loadTemplates();
    } catch (e: any) {
      const message = e?.response?.data?.details?.metaDebug?.meta?.error_user_msg || e?.response?.data?.message || fallbackError;
      setError(message);
    } finally {
      setBusyId(null);
    }
  }, [loadTemplates]);

  const selectTemplate = useCallback(async (template: TemplateItem) => {
    setSelectedTemplate(template);
    try {
      const fresh = await API.templates.get(template._id);
      if (fresh?.template?._id) setSelectedTemplate(fresh.template);
    } catch {}
  }, []);

  const previewData = useMemo(() => {
    if (!selectedTemplate) {
      return {
        category: "utility" as const,
        headerType: "NONE" as const,
        headerText: "",
        mediaHandle: "",
        bodyText: "",
        footerText: "",
        ctaButtons: [],
      };
    }
    const parsed = parseComponentsForPreview(selectedTemplate.components);
    return { category: selectedTemplate.category, ...parsed };
  }, [selectedTemplate]);

  return (
    <div className="grid gap-6">
      <section className="rounded-[5px] border border-ink-900/10 bg-white p-6 shadow-[0_20px_80px_rgba(0,0,0,0.08)] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/60">Template Center</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">Template Library</h1>
            <p className="mt-2 text-sm text-ink-800/70">View approved/pending templates, add new ones, and preview each template instantly.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={syncAndRefreshTemplates} disabled={syncingMeta || loading} className="flex items-center gap-2 rounded-[5px] shadow-none">
              {syncingMeta ? "Syncing..." : "Sync & Refresh Templates"}
            </Button>
          </div>
        </div>
      </section>

      {error || ok ? (
        <section className="rounded-[5px] border border-ink-900/10 bg-white p-4 shadow-none">
          <div className="grid gap-3">
            {error ? <Alert tone="error">{error}</Alert> : null}
            {ok ? <Alert tone="success">{ok}</Alert> : null}
          </div>
        </section>
      ) : null}

      {showCreatePanel ? (
        <TemplateForm
          open={showCreatePanel}
          creating={creating}
          languageOptions={languageOptions}
          onClose={() => setShowCreatePanel(false)}
          onCreate={handleCreate}
        />
      ) : showEditPanel && editingTemplate ? (
        <TemplateForm
          open={showEditPanel}
          creating={creating}
          mode="edit"
          initialTemplate={{
            name: editingTemplate.name,
            language: editingTemplate.language,
            category: editingTemplate.category,
            components: editingTemplate.components || [],
          }}
          languageOptions={languageOptions}
          onClose={() => { setShowEditPanel(false); setEditingTemplate(null); }}
          onCreate={handleEdit}
        />
      ) : (
        <TemplatesList
          templates={templates}
          loading={loading}
          approvedCount={approvedCount}
          busyId={busyId}
          selectedId={selectedTemplate?._id || null}
          onOpenAdd={() => {
            setSelectedTemplate(null);
            setShowCreatePanel(true);
          }}
          onSelectTemplate={selectTemplate}
          onEdit={openEditForTemplate}
          onSyncStatus={(id) => runRowAction(id, () => API.templates.status(id), "Template status synced.", "Status sync failed")}
          onDelete={(template) => {
            if (!confirm(`Delete template "${template.name}" from Meta and local data?`)) return;
            const approvalText = prompt(`Type "${template.name}" to approve deletion`);
            if (approvalText !== template.name) {
              setError("Delete cancelled: approval text did not match template name.");
              return;
            }
            runRowAction(template._id, () => API.templates.remove(template._id), "Template deleted.", "Delete failed");
          }}
        />
      )}

      <div className={`fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l border-ink-900/10 bg-white shadow-2xl transition-transform duration-300 ease-out ${selectedTemplate && !showCreatePanel ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-none items-center justify-between border-b border-ink-900/10 px-4 py-3">
          <div className="text-sm font-bold text-ink-900">{selectedTemplate?.name || "Preview"}</div>
          <div className="flex items-center gap-2">
            {selectedTemplate ? (
              <Button variant="ghost" size="sm" onClick={() => openEditForTemplate(selectedTemplate)}>
                <Pencil size={14} /> Edit
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}><X size={16} /></Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <TemplatePreview {...previewData} variableValues={{}} />
        </div>
      </div>
    </div>
  );
}
