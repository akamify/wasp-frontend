import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { PublicShell } from "@pages/public/PublicShell";
import { HelpCircle, Info, Shield, FileText, Briefcase, Cookie } from "lucide-react";
import { Seo } from "@shared/components/Seo";

const ICONS: Record<string, any> = { HelpCircle, Info, Shield, FileText, Briefcase, Cookie };

function IconFromName({ name }: { name?: string }) {
  const Icon = name && ICONS[name] ? ICONS[name] : Info;
  return <Icon className="h-5 w-5 text-brand-600" />;
}

export function PublicCmsPage({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState<any>(null);

  const normalizedSlug = useMemo(() => String(slug || "").trim().toLowerCase(), [slug]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    API.public
      .page(normalizedSlug)
      .then((r: any) => {
        if (!mounted) return;
        setPage(r.page);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load page.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [normalizedSlug]);

  const hero = page?.data?.hero || {};
  const body = String(page?.data?.bodyMarkdown || "").trim();
  const pageTitle = `${String(hero?.title || page?.title || slug || "Page").trim()} | WaspAkamify`;
  const pageDescription = String(hero?.subtitle || page?.excerpt || body.slice(0, 155) || "").trim() || undefined;

  return (
    <PublicShell>
      <Seo title={pageTitle} description={pageDescription} canonical={window.location.href} />
      {error ? <Alert>{error}</Alert> : null}
      <div className="rounded-3xl border border-ink-900/10 bg-white/80 p-8 shadow-xl shadow-ink-900/5 backdrop-blur-md">
        <div className="mb-6 flex items-start gap-3">
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-200/40">
            <IconFromName name={hero?.icon} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">{hero?.title || page?.title || "Page"}</h1>
            {hero?.subtitle ? <p className="mt-1 text-sm text-ink-900/60">{hero.subtitle}</p> : null}
          </div>
        </div>

        {loading ? (
          <div className="text-sm font-semibold text-ink-900/60">Loading…</div>
        ) : (
          <div className="prose prose-slate max-w-none whitespace-pre-wrap text-sm leading-7 text-ink-900/80">
            {body || "Content coming soon. (Manage this page from Admin → Pages.)"}
          </div>
        )}
      </div>
    </PublicShell>
  );
}

