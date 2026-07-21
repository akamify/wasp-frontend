import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { PublicShell } from "@pages/public/PublicShell";
import { Seo } from "@shared/components/Seo";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Copy, Menu, Minus, Moon, Plus, Search, Sparkles, Sun } from "lucide-react";
import { AcademySearchModal } from "./academy/AcademySearchModal";
import { AcademyContentRenderer } from "./academy/AcademyContentRenderer";

const DOCS_SCROLL_OFFSET = 96;

function slugHeading(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stableSectionId(block: any, fallbackText = "") {
  const explicitId = String(block?.sectionId || block?.anchorId || block?.id || "").trim();
  return slugHeading(explicitId || fallbackText);
}

function headingItemsFromArticle(article: any) {
  const blocks = Array.isArray(article?.contentBlocks) ? article.contentBlocks : [];
  const blockHeadings = blocks.flatMap((block: any) => {
    if (block?.type === "heading" && Number
      (block?.level || 2) >= 2) {
      const title = String(block?.value || "");
      return [
        {
          id: stableSectionId(block, title),
          title,
          level: Number(block?.level || 2),
        },
      ];
    }

    if (block?.type === "text") {
      const value = String(block?.value || "");
      return value
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^##\s+|^###\s+/.test(line))
        .map((line) => {
          const level = line.startsWith("###") ? 3 : 2;
          const title = line.replace(/^#{2,3}\s+/, "").trim();
          return { id: slugHeading(title), title, level };
        });
    }

    return [];
  });

  if (blockHeadings.length) return blockHeadings;

  const markdown = String(article?.content || "");
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^##\s+|^###\s+/.test(line))
    .map((line) => {
      const level = line.startsWith("###") ? 3 : 2;
      const title = line.replace(/^#{2,3}\s+/, "").trim();
      return { id: slugHeading(title), title, level };
    });
}


export default function AcademyDocsPage() {
  
  const navigate = useNavigate();
  const { categorySlug, articleSlug } = useParams();
  const mainScrollRef = useRef<HTMLDivElement | null>(null);
  const [home, setHome] = useState<any | null>(null);
  const [articleResponse, setArticleResponse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState<null | boolean>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [dark, setDark] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      API.public.academyHome(),
      categorySlug && articleSlug ? API.public.academyArticle(categorySlug, articleSlug) : Promise.resolve(null),
    ])
      .then(([homeResponse, articleData]) => {
        if (!active) return;
        setHome(homeResponse || null);
        setArticleResponse(articleData || null);
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e?.response?.data?.message || "Failed to load academy.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [categorySlug, articleSlug]);


  const tree = Array.isArray(home?.tree) ? home.tree : [];
  const featuredArticles = Array.isArray(home?.featuredArticles) ? home.featuredArticles : [];
  const recentArticles = Array.isArray(home?.recentArticles) ? home.recentArticles : [];
  const article = articleResponse?.article || null;
  const toc = useMemo(() => headingItemsFromArticle(article), [article]);

  useEffect(() => {
    const node = mainScrollRef.current;
    if (!node) return;
    const onScroll = () => {
      const scrollTop = node.scrollTop;
      const height = node.scrollHeight - node.clientHeight;
      setProgress(height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0);

      if (!toc.length) {
        setActiveHeading("");
        return;
      }

      const headingNodes = toc
        .map((item: { id: string }) => document.getElementById(item.id))
        .filter(Boolean) as HTMLElement[];
      if (!headingNodes.length) return;

      const containerTop = node.getBoundingClientRect().top;
      let current = headingNodes[0];
      for (const headingNode of headingNodes) {
        const relativeTop = headingNode.getBoundingClientRect().top - containerTop;
        if (relativeTop <= DOCS_SCROLL_OFFSET) {
          current = headingNode;
        } else {
          break;
        }
      }
      if (current?.id) setActiveHeading(current.id);
    };
    onScroll();
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [article?.id, loading, toc]);

  useEffect(() => {
    const activeSlug = article?.category?.slug || tree[0]?.slug;
    if (!activeSlug) return;
    setExpandedSections((prev) => ({ ...prev, [activeSlug]: true }));
  }, [article?.category?.slug, tree]);

  async function submitFeedback(helpful: boolean) {
    if (!article) return;
    if (!helpful && !feedbackText.trim()) {
      setFeedbackOpen(false);
      return;
    }
    await API.public.submitDocsFeedback({
      slug: article.slug,
      articleId: article.id,
      helpful,
      docTitle: article.title,
      pagePath: window.location.pathname,
      visitorId: localStorage.getItem("aiwiz_docs_visitor") || "anonymous",
      feedback: helpful ? "" : feedbackText.trim(),
    });
    setFeedbackOpen(null);
    setFeedbackText("");
  }

  const rootClass = dark ? "dark" : "";
  const activeCategory = article?.category?.slug || tree[0]?.slug || null;

  return (
    <div className={rootClass}>
      <PublicShell contentClassName="relative z-10 mx-auto flex h-[100dvh] max-w-[1440px] flex-col overflow-hidden" pageClassName="overflow-hidden bg-[#f8f8f3] dark:bg-slate-950">
        <Seo
          title={article?.seo?.metaTitle || "AI Wiz Chat Academy"}
          description={article?.seo?.metaDescription || "Learn AI Wiz Chat with product guides and developer docs."}
          canonical={window.location.href}
        />
        <div className="fixed left-0 right-0 top-0 z-40 h-1 bg-slate-200/70">
          <div
            className="h-full origin-left bg-brand-600 will-change-transform"
            style={{ transform: `scaleX(${Math.max(0, Math.min(1, progress / 100))})` }}
          />
        </div>

        <div className="mb-0 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-0 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMobileNavOpen((value) => !value)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                <Menu size={18} />
              </button>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-brand-600">{home?.brand?.name || "AI Wiz Chat Academy"}</div>
                <div className="mt-1 text-lg font-black text-slate-950 dark:text-white">Documentation & Learning Center</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setSearchOpen(true)} className="gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                <Search size={16} /> Search
                <span className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Ctrl K
                </span>
              </Button>
              <Button variant="ghost" onClick={() => setDark((value) => !value)} className="h-10 w-10 rounded-xl border border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
            </div>
          </div>
        </div>

        {error ? <Alert tone="error">{error}</Alert> : null}
        {loading ? <div className="text-sm font-semibold text-slate-500">Loading AI Wiz Chat Academy...</div> : null}

        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
          <div className="grid h-full items-start xl:grid-cols-[280px_minmax(0,1fr)_240px]">
          <aside className={`${mobileNavOpen ? "block" : "hidden"} border-b border-slate-200/80 bg-transparent p-0 dark:border-slate-800 lg:block lg:h-full lg:border-b-0 lg:border-r`}>
            <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
              <div className="mb-0 flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              <BookOpen size={14} /> Navigation
              </div>
            </div>
            <div className="space-y-2 overflow-y-auto px-3 py-3 lg:h-[calc(100dvh-176px)]">
              {tree.map((section: any) => (
                <div key={section.slug} className="rounded-xl">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, [section.slug]: !prev[section.slug] }))}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <div className="text-sm font-bold text-slate-950 dark:text-white">{section.name}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        {Array.isArray(section.items) ? section.items.length : 0}
                      </div>
                      {expandedSections[section.slug] ? <Minus size={14} className="text-slate-400" /> : <Plus size={14} className="text-slate-400" />}
                    </div>
                  </button>
                  {expandedSections[section.slug] ? (
                  <div className="mt-1 space-y-1 border-l border-slate-200 pl-2 dark:border-slate-800">
                    {section.items.map((item: any) => {
                      const active = item.slug === article?.slug && section.slug === article?.category?.slug;
                      return (
                        <button
                          key={item.slug}
                          type="button"
                          onClick={() => {
                            navigate(`/academy/${section.slug}/${item.slug}`);
                            setMobileNavOpen(false);
                          }}
                          className={`block w-full rounded-r-xl border-l-2 px-3 py-2 text-left text-[13px] transition ${active ? "border-brand-500 bg-emerald-50 font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "border-transparent text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"}`}
                        >
                          {item.title}
                        </button>
                      );
                    })}
                  </div>
                  ) : null}
                </div>
              ))}
            </div>
          </aside>

          <main ref={mainScrollRef} className="min-w-0 overflow-y-auto bg-transparent lg:h-[calc(100dvh-176px)]">
            {!article ? (
              <>
                <section className="overflow-hidden border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
                  <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.24em] text-brand-600">Featured Guides</div>
                        <div className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Start from the best academy paths</div>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                          Product setup, WhatsApp campaigns, API integrations, and conversion tracking in one place.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                        {featuredArticles.length || 0} editor-picked guides
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    {featuredArticles.map((item: any) => (
                      <button key={item.id} type="button" onClick={() => navigate(`/academy/${item.category?.slug}/${item.slug}`)} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 text-left transition hover:border-brand-200 hover:shadow-md dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{item.category?.name}</div>
                          <Sparkles size={16} className="text-brand-500" />
                        </div>
                        <div className="mt-3 text-xl font-black text-slate-950 dark:text-white">{item.title}</div>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand-600">
                          Open article <ArrowRight size={14} />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="bg-white p-5 dark:bg-slate-950">
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-brand-600">Recently Updated</div>
                  <div className="mt-4 grid gap-3">
                    {recentArticles.map((item: any) => (
                      <button key={item.id} type="button" onClick={() => navigate(`/academy/${item.category?.slug}/${item.slug}`)} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left transition hover:border-brand-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-950">
                        <div>
                          <div className="text-sm font-black text-slate-950 dark:text-white">{item.title}</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.category?.name}</div>
                        </div>
                        <Badge tone="neutral" className="border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                          {item.readingTime} min
                        </Badge>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <article className="overflow-hidden bg-white dark:bg-slate-950">
                <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-7">
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Academy / {article.category?.name || "Docs"}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="neutral" className="h-7 border border-brand-100 bg-brand-50 px-3 py-0 text-[10px] font-black uppercase tracking-widest text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                    {article.category?.name}
                  </Badge>
                  <Badge tone="neutral" className="h-7 border border-slate-200 bg-white px-3 py-0 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {article.readingTime} min read
                  </Badge>
                  {(Array.isArray(article.audience) ? article.audience : []).map((item: string) => (
                    <Badge key={item} tone="neutral" className="h-7 border border-slate-200 bg-white px-3 py-0 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                      {item}
                    </Badge>
                  ))}
                  </div>

                  <h1 className="mt-4 max-w-4xl text-[32px] font-black tracking-tight text-[#0f172a] dark:text-white sm:text-[42px] sm:leading-[1.15]">{article.title}</h1>
                  <p className="mt-3 max-w-3xl text-base leading-[1.7] text-[#475569] dark:text-slate-300">{article.description}</p>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Button variant="ghost" onClick={() => navigator.clipboard.writeText(window.location.href)} className="gap-2 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                      <Copy size={15} /> Copy Link
                    </Button>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                      Views: {Number(article.analytics?.views || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-5 sm:px-10 sm:py-8">
                  <AcademyContentRenderer article={article} />
                </div>

                <div className="mx-5 mb-5 rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900 sm:mx-7">
                  <div className="text-sm font-black text-slate-950 dark:text-white">Was this helpful?</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => void submitFeedback(true)}>Yes</Button>
                    <Button variant="ghost" onClick={() => setFeedbackOpen(false)} className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white">No</Button>
                  </div>
                  {feedbackOpen === false ? (
                    <div className="mt-4 space-y-3">
                      <textarea value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none ring-brand-500/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="What was missing from this article?" />
                      <div className="flex justify-end">
                        <Button onClick={() => void submitFeedback(false)}>Send Feedback</Button>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Helpful: {Number(articleResponse?.feedbackSummary?.helpfulPct || 0).toFixed(1)}% from {Number(articleResponse?.feedbackSummary?.total || 0)} responses
                  </div>
                </div>

                <div className="mx-5 mb-6 grid gap-4 sm:mx-7 md:grid-cols-2">
                  {articleResponse?.previousArticle ? (
                    <button type="button" onClick={() => navigate(`/academy/${articleResponse.previousArticle.category?.slug}/${articleResponse.previousArticle.slug}`)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-brand-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-950">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400"><ChevronLeft size={14} /> Previous</div>
                      <div className="mt-2 text-base font-black text-slate-950 dark:text-white">{articleResponse.previousArticle.title}</div>
                    </button>
                  ) : <div />}
                  {articleResponse?.nextArticle ? (
                    <button type="button" onClick={() => navigate(`/academy/${articleResponse.nextArticle.category?.slug}/${articleResponse.nextArticle.slug}`)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-right transition hover:border-brand-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-950">
                      <div className="flex items-center justify-end gap-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Next <ChevronRight size={14} /></div>
                      <div className="mt-2 text-base font-black text-slate-950 dark:text-white">{articleResponse.nextArticle.title}</div>
                    </button>
                  ) : null}
                </div>
              </article>
            )}
          </main>

          <aside className="hidden border-l border-slate-200/80 bg-transparent xl:block xl:h-full dark:border-slate-800">
            <div className="p-4 xl:sticky xl:top-0">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">On This Page</div>
              <div className="mt-3 space-y-2">
                {toc.length ? toc.map((item: any) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const node = document.getElementById(item.id);
                      const container = mainScrollRef.current;
                      if (node && container) {
                        const targetTop = node.offsetTop - DOCS_SCROLL_OFFSET;
                        container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
                        setActiveHeading(item.id);
                      }
                    }}
                    className={`block w-full border-l-2 px-3 py-1.5 text-left text-sm ${item.level >= 3 ? "pl-6" : ""} ${activeHeading === item.id ? "border-brand-500 text-brand-700 dark:text-brand-300" : "border-transparent text-slate-600 hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-300"}`}
                  >
                    {item.title}
                  </button>
                )) : <div className="text-sm text-slate-500 dark:text-slate-400">Select an article to see section links.</div>}
              </div>
            </div>
          </aside>
          </div>
        </div>

        <AcademySearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onPick={(item) => {
            setSearchOpen(false);
            navigate(`/academy/${item.category?.slug}/${item.slug}`);
          }}
        />
      </PublicShell>
    </div>
  );
}
