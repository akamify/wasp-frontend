import { useCallback, useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { useAuth } from "@shared/providers/AuthContext";
import { useToast } from "@shared/providers/ToastContext";

type PageItem = { slug: string; title: string; updatedAt?: string };

const COMMON_SLUGS = ["about", "privacy-policy", "terms-of-service", "cookie-policy", "help-center", "careers"] as const;
const KNOWN_DOC_SLUGS = ["introduction", "quick-start", "authentication", "meta-setup", "webhooks"] as const;

function normalizeSlug(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isDocLikeSlug(slug: any, docsSlugSet: Set<string>) {
  const s = normalizeSlug(slug);
  if (!s) return false;
  if (docsSlugSet.has(s)) return true;
  if (KNOWN_DOC_SLUGS.includes(s as (typeof KNOWN_DOC_SLUGS)[number])) return true;
  return s.startsWith("docs/") || s.startsWith("docs-");
}

function safeJsonParse(text: string) {
  try {
    return { ok: true as const, value: JSON.parse(text || "{}") };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || "Invalid JSON" };
  }
}

function toLines(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v ?? "")).filter((s) => s.trim());
}

function splitLines(text: string): string[] {
  return String(text || "")
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function AdminPagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [items, setItems] = useState<PageItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("about");

  const [loadingPage, setLoadingPage] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [data, setData] = useState<any>({});
  const [rawJson, setRawJson] = useState("");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"editor" | "json">("editor");
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandUploading, setBrandUploading] = useState(false);
  const [brandUploadPct, setBrandUploadPct] = useState(0);
  const [brandSettings, setBrandSettings] = useState({ brandName: "", brandLogoUrl: "" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base: PageItem[] = items.length ? items : COMMON_SLUGS.map((s) => ({ slug: s, title: "", updatedAt: "" }));
    if (!q) return base;
    return base.filter((p) => p.slug.includes(q) || String(p.title || "").toLowerCase().includes(q));
  }, [items, query]);

  const loadList = useCallback(() => {
    setLoadingList(true);
    setListError(null);
    Promise.allSettled([API.admin.pages(), API.admin.docsList()])
      .then(([pagesRes, docsRes]: any) => {
        if (pagesRes?.status !== "fulfilled") {
          throw pagesRes?.reason;
        }
        const docsItems = docsRes?.status === "fulfilled" && Array.isArray(docsRes.value?.items) ? docsRes.value.items : [];
        const docsSlugSet = new Set<string>(docsItems.map((x: any) => normalizeSlug(x?.slug)).filter(Boolean));
        const pageItems = Array.isArray(pagesRes.value?.items) ? pagesRes.value.items : [];
        const filteredItems = pageItems.filter((item: PageItem) => !isDocLikeSlug(item?.slug, docsSlugSet));
        setItems(filteredItems);
      })
      .catch((e: any) => setListError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load pages"))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    let mounted = true;
    setBrandLoading(true);
    API.admin
      .platformBrandGet()
      .then((r: any) => {
        if (!mounted) return;
        setBrandSettings({
          brandName: String(r?.settings?.brandName || ""),
          brandLogoUrl: String(r?.settings?.brandLogoUrl || ""),
        });
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setBrandLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!selectedSlug) return;
    setLoadingPage(true);
    setPageError(null);
    API.admin
      .pageGet(selectedSlug)
      .then((r: any) => {
        if (!mounted) return;
        const page = r?.page || {};
        setTitle(String(page.title || ""));
        const d = page.data || {};
        setData(d);
        setRawJson(JSON.stringify(d, null, 2));
      })
      .catch((e: any) => {
        if (!mounted) return;
        setPageError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load page");
      })
      .finally(() => {
        if (mounted) setLoadingPage(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedSlug]);

  function updateData(patch: any) {
    setData((prev: any) => {
      const next = { ...(prev || {}), ...(patch || {}) };
      setRawJson(JSON.stringify(next, null, 2));
      return next;
    });
  }

  async function onSave() {
    if (!selectedSlug || saving) return;
    setSaving(true);
    setPageError(null);
    try {
      let dataObj = data || {};
      if (mode === "json") {
        const parsed = safeJsonParse(rawJson);
        if (!parsed.ok) throw new Error(parsed.error);
        dataObj = parsed.value || {};
        setData(dataObj);
      }
      await API.admin.pageUpsert(selectedSlug, { title, data: dataObj });
      toast("Page saved.", "success");
      loadList();
    } catch (e: any) {
      setPageError(e?.message || e?.userMessage || "Failed to save page");
      toast("Failed to save page.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveBrand() {
    if (user?.role !== "super_admin") return;
    setBrandSaving(true);
    try {
      const res: any = await API.admin.platformBrandUpdate(brandSettings);
      setBrandSettings({
        brandName: String(res?.settings?.brandName || ""),
        brandLogoUrl: String(res?.settings?.brandLogoUrl || ""),
      });
      toast("Brand updated.", "success");
      setBrandModalOpen(false);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to update brand", "error");
    } finally {
      setBrandSaving(false);
    }
  }

  async function onUploadBrandLogo(file?: File | null) {
    if (!file || user?.role !== "super_admin") return;
    setBrandUploading(true);
    setBrandUploadPct(0);
    try {
      const res: any = await API.admin.platformBrandUploadLogo(file, (pct: number) => setBrandUploadPct(pct));
      const logoUrl = String(res?.logoUrl || "").trim();
      if (!logoUrl) throw new Error("Invalid upload response");
      setBrandSettings((prev) => ({ ...prev, brandLogoUrl: logoUrl }));
      toast("Logo uploaded.", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Logo upload failed", "error");
    } finally {
      setBrandUploading(false);
      setBrandUploadPct(0);
    }
  }

  const hero = data?.hero || {};
  const isStatic = ["about", "privacy-policy", "terms-of-service", "cookie-policy"].includes(selectedSlug);
  const isHelp = selectedSlug === "help-center";
  const isCareers = selectedSlug === "careers";

  const contacts = Array.isArray(data?.contacts) ? data.contacts : [];
  const faqs = Array.isArray(data?.faqs) ? data.faqs : [];

  const departmentsText = toLines(data?.departments).join("\n");
  const noticePeriodsText = toLines(data?.noticePeriods).join("\n");
  const modesOfWorkText = toLines(data?.modesOfWork).join("\n");

  return (
    <div className="grid gap-4 p-4 md:p-8">
      <AdminToolbar
        title="Pages"
        subtitle="Manage footer pages, Help Center, and Careers content."
        query={query}
        setQuery={setQuery}
        onRefresh={loadList}
        isSyncing={loadingList}
        right={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setBrandModalOpen(true)}>
              Edit Brand
            </Button>
            <Button type="button" onClick={onSave} disabled={saving || loadingPage}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      />

      {listError ? <Alert>{listError}</Alert> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[5px] border border-ink-900/10 bg-white p-4">
          <div className="text-xs font-extrabold uppercase tracking-widest text-ink-900/60">Pages</div>
          <div className="mt-3 grid gap-2">
            {filtered.map((p) => (
              <button
                key={p.slug}
                onClick={() => setSelectedSlug(p.slug)}
                className={
                  "flex w-full items-center justify-between rounded-[5px] border px-3 py-2 text-left text-sm font-semibold transition-colors " +
                  (p.slug === selectedSlug
                    ? "border-brand-300/40 bg-brand-50 text-ink-900"
                    : "border-ink-900/10 bg-white text-ink-900/70 hover:bg-ink-900/5")
                }
              >
                <span className="truncate">{p.slug}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-900/40">
                  {(p.updatedAt && new Date(p.updatedAt).toLocaleDateString()) || ""}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[5px] border border-ink-900/10 bg-white p-4 lg:col-span-2">
          {pageError ? <Alert>{pageError}</Alert> : null}

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-extrabold uppercase tracking-widest text-ink-900/60">Editing</div>
              <div className="mt-1 truncate text-sm font-bold text-ink-900">{selectedSlug}</div>
            </div>
            <div className="w-[220px]">
              <Select label="Mode" value={mode} onChange={(e) => setMode(e.target.value as any)}>
                <option value="editor">Editor</option>
                <option value="json">Raw JSON</option>
              </Select>
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            <Input label="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" />

            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Hero title"
                value={String(hero?.title || "")}
                onChange={(e) => updateData({ hero: { ...(hero || {}), title: e.target.value } })}
                placeholder="Page heading"
              />
              <Input
                label="Hero subtitle"
                value={String(hero?.subtitle || "")}
                onChange={(e) => updateData({ hero: { ...(hero || {}), subtitle: e.target.value } })}
                placeholder="Short description"
              />
            </div>

            {mode === "json" ? (
              <Textarea label="Page Data (JSON)" value={rawJson} onChange={(e) => setRawJson(e.target.value)} rows={18} className="font-mono text-xs" />
            ) : (
              <>
                {isStatic ? (
                  <Textarea
                    label="Body (Markdown/text)"
                    value={String(data?.bodyMarkdown || "")}
                    onChange={(e) => updateData({ bodyMarkdown: e.target.value })}
                    rows={12}
                    placeholder="Write your content…"
                  />
                ) : null}

                {isHelp ? (
                  <>
                    <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 p-3 text-xs font-semibold text-ink-900/60">
                      Help Center uses `contacts[]` and `faqs[]`.
                    </div>

                    <div className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-extrabold uppercase tracking-widest text-ink-900/60">Contacts</div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => updateData({ contacts: [...contacts, { label: "", value: "" }] })}
                        >
                          Add
                        </Button>
                      </div>
                      {contacts.map((c: any, idx: number) => (
                        <div key={idx} className="grid gap-3 md:grid-cols-2">
                          <Input
                            label="Label"
                            value={String(c?.label || "")}
                            onChange={(e) => {
                              const next = [...contacts];
                              next[idx] = { ...(next[idx] || {}), label: e.target.value };
                              updateData({ contacts: next });
                            }}
                          />
                          <div className="flex items-end gap-2">
                            <Input
                              label="Value"
                              value={String(c?.value || "")}
                              onChange={(e) => {
                                const next = [...contacts];
                                next[idx] = { ...(next[idx] || {}), value: e.target.value };
                                updateData({ contacts: next });
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                const next = contacts.filter((_: any, i: number) => i !== idx);
                                updateData({ contacts: next });
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-extrabold uppercase tracking-widest text-ink-900/60">FAQs</div>
                        <Button type="button" variant="secondary" onClick={() => updateData({ faqs: [...faqs, { q: "", a: "" }] })}>
                          Add
                        </Button>
                      </div>
                      {faqs.map((f: any, idx: number) => (
                        <div key={idx} className="grid gap-3">
                          <Input
                            label="Question"
                            value={String(f?.q || "")}
                            onChange={(e) => {
                              const next = [...faqs];
                              next[idx] = { ...(next[idx] || {}), q: e.target.value };
                              updateData({ faqs: next });
                            }}
                          />
                          <div className="flex items-end gap-2">
                            <Textarea
                              label="Answer"
                              value={String(f?.a || "")}
                              onChange={(e) => {
                                const next = [...faqs];
                                next[idx] = { ...(next[idx] || {}), a: e.target.value };
                                updateData({ faqs: next });
                              }}
                              rows={3}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                const next = faqs.filter((_: any, i: number) => i !== idx);
                                updateData({ faqs: next });
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}

                {isCareers ? (
                  <>
                    <Textarea
                      label="Intro (Markdown/text)"
                      value={String(data?.introMarkdown || "")}
                      onChange={(e) => updateData({ introMarkdown: e.target.value })}
                      rows={6}
                    />
                    <Textarea
                      label="Departments (one per line)"
                      value={departmentsText}
                      onChange={(e) => updateData({ departments: splitLines(e.target.value) })}
                      rows={6}
                    />
                    <Textarea
                      label="Notice Periods (one per line)"
                      value={noticePeriodsText}
                      onChange={(e) => updateData({ noticePeriods: splitLines(e.target.value) })}
                      rows={6}
                    />
                    <Textarea
                      label="Modes of Work (one per line)"
                      value={modesOfWorkText}
                      onChange={(e) => updateData({ modesOfWork: splitLines(e.target.value) })}
                      rows={6}
                    />
                  </>
                ) : null}
              </>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setRawJson(JSON.stringify(data || {}, null, 2))}>
                Reset JSON
              </Button>
              <Button type="button" onClick={onSave} disabled={saving || loadingPage}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={brandModalOpen} onClose={() => setBrandModalOpen(false)} title="Edit Platform Brand">
        {brandLoading ? (
          <div className="text-sm text-slate-500">Loading brand settings...</div>
        ) : (
          <div className="space-y-3">
            <Input
              label="Brand Name"
              value={brandSettings.brandName}
              onChange={(e) => setBrandSettings((p) => ({ ...p, brandName: e.target.value }))}
              disabled={user?.role !== "super_admin"}
            />
            <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Logo Upload</div>
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="platform-brand-logo-file">
                  <input
                    id="platform-brand-logo-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    disabled={user?.role !== "super_admin" || brandUploading}
                    onChange={(e) => onUploadBrandLogo(e.target.files?.[0] || null)}
                  />
                  <span className="inline-flex h-9 cursor-pointer items-center rounded-[5px] border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100">
                    {brandUploading ? `Uploading ${brandUploadPct}%` : "Upload Logo"}
                  </span>
                </label>
                {brandSettings.brandLogoUrl ? (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setBrandSettings((p) => ({ ...p, brandLogoUrl: "" }))}
                    disabled={user?.role !== "super_admin"}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">Allowed: PNG, JPG, WEBP, SVG. Max size: 5MB.</div>
            </div>
            <Input
              label="Logo URL (fallback)"
              value={brandSettings.brandLogoUrl}
              onChange={(e) => setBrandSettings((p) => ({ ...p, brandLogoUrl: e.target.value }))}
              disabled={user?.role !== "super_admin"}
            />
            {brandSettings.brandLogoUrl ? (
              <div className="rounded-[5px] border border-slate-200 p-3">
                <img src={brandSettings.brandLogoUrl} alt="Platform brand logo" className="h-14 w-auto object-contain" />
              </div>
            ) : null}
            {user?.role !== "super_admin" ? (
              <Alert variant="warning">Only super admin can update platform brand.</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setBrandModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={onSaveBrand} disabled={user?.role !== "super_admin" || brandSaving || brandUploading}>
                {brandSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
