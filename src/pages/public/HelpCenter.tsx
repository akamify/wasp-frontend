import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { PublicShell } from "@pages/public/PublicShell";
import { HelpCircle } from "lucide-react";
import { Seo } from "@shared/components/Seo";
import { BRAND_NAME } from "@shared/config/brand";

export default function HelpCenterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    API.public
      .page("help-center")
      .then((r: any) => {
        if (!mounted) return;
        setPage(r.page);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load help center.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const hero = page?.data?.hero || {};
  const faqs = Array.isArray(page?.data?.faqs) ? page.data.faqs : [];
  const contacts = Array.isArray(page?.data?.contacts) ? page.data.contacts : [];
  const pageTitle = `${String(hero?.title || "Help Center").trim()} | ${BRAND_NAME}`;
  const pageDescription = String(hero?.subtitle || "Find answers, contact support, or raise a ticket.").trim();

  return (
    <PublicShell>
      <Seo title={pageTitle} description={pageDescription} canonical={window.location.href} />
      {error ? <Alert>{error}</Alert> : null}

      <div className="p-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-brand-700">
              <HelpCircle className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Support</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">{hero?.title || "Help Center"}</h1>
            {hero?.subtitle ? <p className="mt-2 max-w-2xl text-sm text-ink-900/60">{hero.subtitle}</p> : null}
          </div>
          <Button className="h-11 rounded-2xl px-5 font-bold" onClick={() => navigate("/help-center/ticket")}>
            Raise Ticket
          </Button>
        </div>

        {loading ? (
          <div className="mt-6 text-sm font-semibold text-ink-900/60">Loading…</div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <aside>
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-ink-900/60">Contact</h2>
              <div className="mt-4 grid gap-3">
                {contacts.map((c: any, idx: number) => {
                  const label = String(c?.label || "").trim();
                  const value = String(c?.value || "").trim();
                  return (
                    <div key={idx} className="flex items-start gap-3 rounded-2xl border border-ink-900/10 bg-white p-4">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-200/40">
                        <div className="h-4 w-4 rounded bg-brand-600/20" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold uppercase tracking-widest text-ink-900/50">{label || "Contact"}</div>
                        <div className="mt-1 break-words text-sm font-semibold text-ink-900/80">{value || "—"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
            <section className="lg:col-span-2">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-ink-900/60">FAQs</h2>
              <div className="mt-4 grid gap-3">
                {faqs.length ? (
                  faqs.map((f: any, idx: number) => (
                    <details key={idx} className="group rounded-2xl border border-ink-900/10 bg-white p-4">
                      <summary className="cursor-pointer list-none text-sm font-bold text-ink-900">
                        {String(f?.q || "").trim() || "FAQ"}
                      </summary>
                      <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink-900/70">
                        {String(f?.a || "").trim() || "—"}
                      </div>
                    </details>
                  ))
                ) : (
                  <div className="rounded-2xl border border-ink-900/10 bg-white p-4 text-sm text-ink-900/60">
                    FAQs coming soon. (Manage from Admin → Pages → help-center.)
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
