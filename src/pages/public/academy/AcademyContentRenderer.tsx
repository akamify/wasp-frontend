import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { Modal } from "@components/ui/Modal";
import { Copy, ExternalLink, ImageIcon, PlayCircle, UploadCloud } from "lucide-react";

type Props = {
  article: any;
};

function slugHeading(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textFromNode((node as any).props?.children);
  }
  return "";
}

export function AcademyContentRenderer({ article }: Props) {
  const [lightbox, setLightbox] = useState<{ url: string; caption?: string } | null>(null);
  const rawBlocks = Array.isArray(article?.contentBlocks) ? article.contentBlocks : [];
  const blocks = useMemo(() => {
    if (!rawBlocks.length) return rawBlocks;
    const normalized: any[] = [];
    for (let index = 0; index < rawBlocks.length; index += 1) {
      const block = rawBlocks[index];
      const type = String(block?.type || "");
      const value = String(block?.value || "").trim();

      if (type === "text" && /^:::(step-card|callout|video|api-endpoint)/i.test(value)) {
        const collected = [value];
        let cursor = index + 1;
        while (cursor < rawBlocks.length) {
          const next = rawBlocks[cursor];
          if (String(next?.type || "") !== "text") break;
          const nextValue = String(next?.value || "").trim();
          collected.push(nextValue);
          if (nextValue === ":::") {
            index = cursor;
            break;
          }
          cursor += 1;
        }
        const snippet = collected.join("\n\n");
        if (/^:::step-card/i.test(value)) {
          const title = snippet.match(/####\s*([^\n]+)/i)?.[1] || "";
          const body = snippet
            .replace(/^:::step-card/i, "")
            .replace(/####\s*[^\n]+/i, "")
            .replace(/:::$/i, "")
            .trim();
          normalized.push({ type: "step-card", step: "", title, description: body, buttonText: "", url: "" });
          continue;
        }
        if (/^:::callout/i.test(value)) {
          const tone = snippet.match(/type="([^"]+)"/i)?.[1] || "info";
          const title = snippet.match(/\*\*([^\n*]+)\*\*/)?.[1] || "Note";
          const description = snippet
            .replace(/^:::callout[^\n]*\n?/i, "")
            .replace(/\*\*[^\n*]+\*\*\n?/i, "")
            .replace(/:::$/i, "")
            .trim();
          normalized.push({ type: "callout", tone, title, description });
          continue;
        }
        if (/^:::video/i.test(value)) {
          normalized.push(block);
          continue;
        }
        if (/^:::api-endpoint/i.test(value)) {
          normalized.push(block);
          continue;
        }
      }

      if (type === "text" && (value === ":::" || /^:::step-card$/i.test(value))) {
        continue;
      }

      normalized.push(block);
    }

    return normalized.filter((block: any, index: number) => {
      if (index !== 0) return true;
      return !(
        String(block?.type || "") === "heading" &&
        Number(block?.level || 2) === 1 &&
        String(block?.value || "").trim().toLowerCase() === String(article?.title || "").trim().toLowerCase()
      );
    });
  }, [rawBlocks, article?.title]);
  const markdownContent = useMemo(() => {
    const content = String(article?.content || "");
    const lines = content.split("\n");
    const firstLine = lines[0]?.trim() || "";
    if (/^#\s+/.test(firstLine) && firstLine.replace(/^#\s+/, "").trim().toLowerCase() === String(article?.title || "").trim().toLowerCase()) {
      return lines.slice(1).join("\n").trim();
    }
    return content;
  }, [article?.content, article?.title]);

  return (
    <>
      <div className="academy-prose mx-auto max-w-[840px] space-y-6">
        {blocks.length
          ? blocks.map((block: any, index: number) => (
              <ContentBlock key={`${block?.type || "block"}-${index}`} block={block} onOpenLightbox={setLightbox} />
            ))
          : <MarkdownFallback content={markdownContent} />}
      </div>

      <Modal isOpen={!!lightbox} onClose={() => setLightbox(null)} title={lightbox?.caption || "Preview"} className="max-w-5xl">
        {lightbox ? <img src={lightbox.url} alt={lightbox.caption || "Academy preview"} className="max-h-[75vh] w-full rounded-[5px] object-contain" /> : null}
      </Modal>
    </>
  );
}

function shouldRenderTextAsMarkdown(value: string) {
  return /(^-\s)|(^\d+\.\s)|(^\|.+\|)|(^```)|(^#{1,6}\s)|(^:::)/m.test(value);
}

function preprocessDocsMarkdown(content: string) {
  let next = String(content || "");

  next = next.replace(
    /:::callout\s+type="([^"]+)"\s*\n\*\*([^\n]+)\*\*\s*\n([\s\S]*?)\n:::/g,
    (_match, tone, title, body) => {
      const label = String(tone || "info").trim().toUpperCase();
      return [
        `<div class="academy-callout academy-callout-${String(tone || "info").trim().toLowerCase()}">`,
        `<div class="academy-callout-label">${label}</div>`,
        `<div class="academy-callout-title">${String(title || "").trim()}</div>`,
        `<div class="academy-callout-body">${String(body || "").trim().replace(/\n/g, "<br />")}</div>`,
        `</div>`,
      ].join("");
    }
  );

  next = next.replace(
    /:::step-card\s*\n####\s*([^\n]+)\n([\s\S]*?)\n:::/g,
    (_match, title, body) => {
      return [
        `<div class="academy-step-card">`,
        `<div class="academy-step-title">${String(title || "").trim()}</div>`,
        `<div class="academy-step-body">${String(body || "").trim()}</div>`,
        `</div>`,
      ].join("");
    }
  );

  next = next.replace(
    /:::video\s*\nTitle:\s*(.+)\nURL:\s*(.*)\nCaption:\s*(.*)\nDuration:\s*(.*)\n:::/g,
    (_match, title, url, caption, duration) => {
      const safeUrl = String(url || "").trim();
      return [
        `<div class="academy-video-card">`,
        `<div class="academy-video-kicker">Video Tutorial</div>`,
        `<div class="academy-video-title">${String(title || "").trim()}</div>`,
        String(caption || "").trim() ? `<div class="academy-video-caption">${String(caption || "").trim()}</div>` : "",
        String(duration || "").trim() ? `<div class="academy-video-duration">${String(duration || "").trim()}</div>` : "",
        safeUrl ? `<a class="academy-video-link" href="${safeUrl}" target="_blank" rel="noreferrer">Watch video</a>` : "",
        `</div>`,
      ].join("");
    }
  );

  next = next.replace(
    /:::api-endpoint\s*\nTitle:\s*(.+)\nMethod:\s*(.+)\nEndpoint:\s*(.+)\nAuth:\s*(.+)\nRequest:\n([\s\S]*?)\nResponse:\n([\s\S]*?)\n:::/g,
    (_match, title, method, endpoint, auth, requestBody, responseBody) => {
      return [
        `<div class="academy-api-card">`,
        `<div class="academy-api-header"><span class="academy-api-method">${String(method || "POST").trim()}</span><code class="academy-api-path">${String(endpoint || "").trim()}</code></div>`,
        `<div class="academy-api-title">${String(title || "").trim()}</div>`,
        `<div class="academy-api-auth">Authentication: ${String(auth || "").trim()}</div>`,
        `</div>`,
        `\n\n#### Request\n\n\`\`\`json\n${String(requestBody || "").trim()}\n\`\`\`\n\n#### Response\n\n\`\`\`json\n${String(responseBody || "").trim()}\n\`\`\``,
      ].join("");
    }
  );

  return next;
}

function ContentBlock({ block, onOpenLightbox }: { block: any; onOpenLightbox: (payload: { url: string; caption?: string }) => void }) {
  const type = String(block?.type || "text");
  if (type === "heading") {
    const level = Math.min(4, Math.max(1, Number(block?.level || 2)));
    const text = String(block?.value || "");
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (level === 1) return <h1 id={id} className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">{text}</h1>;
    if (level === 2) return <h2 id={id} className="scroll-mt-24 border-t border-slate-100 pt-6 text-2xl font-black tracking-tight text-slate-950 dark:border-slate-800 dark:text-white">{text}</h2>;
    if (level === 3) return <h3 id={id} className="scroll-mt-24 text-xl font-black text-slate-900 dark:text-slate-100">{text}</h3>;
    return <h4 id={id} className="scroll-mt-24 text-lg font-black text-slate-900 dark:text-slate-100">{text}</h4>;
  }
  if (type === "text") {
    const value = String(block?.value || "");
    if (shouldRenderTextAsMarkdown(value)) {
      return <MarkdownFallback content={value} />;
    }
    return <p className="text-[15px] leading-8 text-slate-700 dark:text-slate-300">{value}</p>;
  }
  if (type === "list") {
    const items = Array.isArray(block?.items) ? block.items : [];
    return (
      <ul className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/80">
        {items.map((item: string, index: number) => (
          <li key={`${item}-${index}`} className="flex gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span className="mt-2 h-2.5 w-2.5 rounded-full bg-brand-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (type === "callout") {
    const tones: Record<string, string> = {
      info: "border-sky-200 bg-sky-50 text-sky-900",
      warning: "border-amber-200 bg-amber-50 text-amber-900",
      success: "border-emerald-200 bg-emerald-50 text-emerald-900",
      error: "border-rose-200 bg-rose-50 text-rose-900",
    };
    const cls = tones[String(block?.tone || "info")] || tones.info;
    return (
      <div className={`rounded-2xl border px-5 py-4 ${cls}`}>
        <div className="text-sm font-black uppercase tracking-widest">{String(block?.title || "Note")}</div>
        <div className="mt-2 text-sm leading-7">{String(block?.description || "")}</div>
      </div>
    );
  }
  if (type === "code") return <CodeBlock code={String(block?.code || "")} language={String(block?.language || "text")} title={String(block?.title || "Code Example")} />;
  if (type === "response") return <CodeBlock code={String(block?.code || block?.responseBody || "")} language={String(block?.language || "json")} title={String(block?.title || "Response")} meta={String(block?.status || "")} />;
  if (type === "tabs") {
    const tabs = Array.isArray(block?.tabs) ? block.tabs : [];
    return <CodeTabs tabs={tabs} />;
  }
  if (type === "image") {
    const url = String(block?.url || "").trim();
    if (!url) {
      return (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/90 p-6 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-3 text-slate-500 shadow-sm dark:bg-slate-950 dark:text-slate-300">
              <ImageIcon size={22} />
            </div>
            <div>
              <div className="text-base font-black text-slate-900 dark:text-white">Screenshot placeholder</div>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Yeh article image block support karta hai, lekin abhi is block me media URL save nahi hai. Super Admin docs CMS se image upload karke yahan live preview dikhega.
              </p>
              {block?.caption ? <div className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Caption: {String(block.caption)}</div> : null}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <button type="button" onClick={() => onOpenLightbox({ url, caption: block?.caption })} className="w-full bg-slate-50">
          <img src={url} alt={String(block?.caption || "Academy image")} className="max-h-[420px] w-full object-cover" />
        </button>
        {block?.caption ? <div className="border-t border-slate-100 px-4 py-3 text-sm font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">{String(block.caption)}</div> : null}
      </div>
    );
  }
  if (type === "video") {
    return (
      <div className="rounded-[24px] border border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Video Tutorial</div>
            <div className="mt-2 text-2xl font-black">{String(block?.title || "Watch tutorial")}</div>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">{String(block?.caption || "Hosted tutorial URL add hote hi yahan video CTA live ho jayega.")}</p>
          </div>
          {block?.duration ? <Badge tone="neutral" className="border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">{String(block.duration)}</Badge> : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {block?.url ? (
            <a href={String(block.url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-[5px] bg-white px-4 py-2 text-sm font-black text-slate-900">
              <PlayCircle size={18} /> Watch Video
            </a>
          ) : (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-[14px] bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                <UploadCloud size={18} /> Add video URL from docs admin
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Video block configured, media pending
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (type === "step-card") {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-none dark:border-slate-800 dark:bg-slate-900">
        <div className="text-lg font-black text-slate-950 dark:text-white">{String(block?.title || "")}</div>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{String(block?.description || "")}</p>
        {block?.url ? (
          <a href={String(block.url)} target={String(block.url).startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand-600">
            {String(block?.buttonText || "Continue")} <ExternalLink size={14} />
          </a>
        ) : null}
      </div>
    );
  }
  if (type === "api-endpoint") {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="neutral" className="border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-800">
            {String(block?.method || "POST")}
          </Badge>
          <code className="rounded bg-slate-100 px-2 py-1 text-sm font-black text-slate-900 dark:bg-slate-950 dark:text-slate-100">{String(block?.endpoint || "/api/example")}</code>
        </div>
        {block?.auth ? <div className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">Authentication: {String(block.auth)}</div> : null}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <CodeBlock code={String(block?.requestExample || "{}")} language="json" title="Request" compact />
          <CodeBlock code={String(block?.responseExample || "{}")} language="json" title="Response" compact />
        </div>
      </div>
    );
  }
  if (type === "table") {
    const columns = Array.isArray(block?.columns) ? block.columns : [];
    const rows = Array.isArray(block?.rows) ? block.rows : [];
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>{columns.map((column: any, index: number) => <th key={`${column}-${index}`} className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{String(column)}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950">
            {rows.map((row: any[], rowIndex: number) => (
              <tr key={rowIndex}>{row.map((cell: any, cellIndex: number) => <td key={`${cellIndex}-${rowIndex}`} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{String(cell)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return <MarkdownFallback content={String(block?.value || block?.content || "")} />;
}

function MarkdownFallback({ content }: { content: string }) {
  const normalized = useMemo(() => preprocessDocsMarkdown(content), [content]);
  return (
    <div className="academy-markdown dark:academy-markdown-dark">
      <style>{`
        .academy-markdown { color: #334155; font-size: 16px; line-height: 1.9; }
        .academy-markdown > * + * { margin-top: 1.2rem; }
        .academy-markdown h1, .academy-markdown h2, .academy-markdown h3, .academy-markdown h4 { color: #0f172a; scroll-margin-top: 96px; }
        .academy-markdown h1 { font-size: 2.75rem; line-height: 1; font-weight: 900; letter-spacing: -0.04em; margin-top: 0; margin-bottom: 1.2rem; }
        .academy-markdown h2 { font-size: 1.7rem; line-height: 1.2; font-weight: 900; letter-spacing: -0.03em; padding-top: 1.6rem; border-top: 1px solid #e2e8f0; margin-top: 2.5rem; }
        .academy-markdown h3 { font-size: 1.2rem; line-height: 1.35; font-weight: 800; margin-top: 2rem; }
        .academy-markdown p { max-width: 72ch; color: #334155; }
        .academy-markdown ul, .academy-markdown ol { max-width: 72ch; padding-left: 1.35rem; color: #334155; }
        .academy-markdown li { margin: 0.45rem 0; padding-left: 0.2rem; }
        .academy-markdown a { color: #0f766e; text-decoration: underline; text-underline-offset: 3px; font-weight: 700; }
        .academy-markdown table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 18px; border: 1px solid #e2e8f0; margin: 1.5rem 0; }
        .academy-markdown thead { background: #f8fafc; }
        .academy-markdown th { text-align: left; font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; font-weight: 900; padding: 0.95rem 1rem; }
        .academy-markdown td { padding: 0.95rem 1rem; border-top: 1px solid #e2e8f0; color: #334155; vertical-align: top; }
        .academy-markdown pre { border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); background: #020617; padding: 1rem; overflow-x: auto; margin: 1.5rem 0; }
        .academy-markdown code { font-size: 0.92em; }
        .academy-markdown :not(pre) > code { background: #f1f5f9; color: #0f172a; border-radius: 8px; padding: 0.14rem 0.42rem; font-weight: 700; }
        .academy-callout, .academy-step-card, .academy-video-card, .academy-api-card { border-radius: 22px; margin: 1.5rem 0; }
        .academy-callout { border: 1px solid #dbeafe; background: #eff6ff; padding: 1rem 1.1rem; }
        .academy-callout-warning { border-color: #fde68a; background: #fffbeb; }
        .academy-callout-success { border-color: #a7f3d0; background: #ecfdf5; }
        .academy-callout-error { border-color: #fecdd3; background: #fff1f2; }
        .academy-callout-label { font-size: 0.7rem; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; color: #475569; }
        .academy-callout-title { margin-top: 0.5rem; font-size: 1rem; font-weight: 900; color: #0f172a; }
        .academy-callout-body { margin-top: 0.45rem; color: #334155; line-height: 1.8; max-width: 72ch; }
        .academy-step-card { border: 1px solid #e2e8f0; background: #ffffff; box-shadow: 0 12px 28px rgba(15,23,42,0.06); padding: 1.2rem 1.2rem; }
        .academy-step-title { font-size: 1.02rem; font-weight: 900; color: #0f172a; }
        .academy-step-body { margin-top: 0.6rem; color: #475569; line-height: 1.85; max-width: 72ch; }
        .academy-video-card { border: 1px solid #0f172a; background: linear-gradient(135deg, #020617 0%, #0f172a 100%); padding: 1.25rem 1.25rem; color: #f8fafc; }
        .academy-video-kicker { font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 900; color: #86efac; }
        .academy-video-title { margin-top: 0.55rem; font-size: 1.35rem; font-weight: 900; color: #ffffff; }
        .academy-video-caption { margin-top: 0.55rem; max-width: 72ch; color: #cbd5e1; }
        .academy-video-duration { margin-top: 0.85rem; font-size: 0.76rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #94a3b8; }
        .academy-video-link { display: inline-flex; margin-top: 0.95rem; background: #ffffff; color: #0f172a !important; text-decoration: none !important; padding: 0.7rem 1rem; border-radius: 14px; font-weight: 900; }
        .academy-api-card { border: 1px solid #e2e8f0; background: #ffffff; box-shadow: 0 12px 28px rgba(15,23,42,0.06); padding: 1.15rem 1.15rem; }
        .academy-api-header { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
        .academy-api-method { display: inline-flex; align-items: center; border-radius: 999px; background: #ecfdf5; color: #166534; padding: 0.3rem 0.7rem; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 900; }
        .academy-api-path { background: #f8fafc; color: #0f172a; border-radius: 10px; padding: 0.35rem 0.6rem; font-weight: 800; }
        .academy-api-title { margin-top: 0.75rem; font-size: 1rem; font-weight: 900; color: #0f172a; }
        .academy-api-auth { margin-top: 0.45rem; color: #475569; font-size: 0.95rem; }
        .academy-markdown-dark { color: #cbd5e1; }
        .academy-markdown-dark h1, .academy-markdown-dark h2, .academy-markdown-dark h3, .academy-markdown-dark h4 { color: #f8fafc; }
        .academy-markdown-dark h2 { border-top-color: #1e293b; }
        .academy-markdown-dark p, .academy-markdown-dark ul, .academy-markdown-dark ol, .academy-markdown-dark td, .academy-markdown-dark .academy-callout-body, .academy-markdown-dark .academy-step-body, .academy-markdown-dark .academy-api-auth { color: #cbd5e1; }
        .academy-markdown-dark thead { background: #0f172a; }
        .academy-markdown-dark th { color: #94a3b8; }
        .academy-markdown-dark table, .academy-markdown-dark td { border-color: #1e293b; }
        .academy-markdown-dark :not(pre) > code { background: #0f172a; color: #f8fafc; }
        .academy-markdown-dark .academy-step-card, .academy-markdown-dark .academy-api-card { border-color: #1e293b; background: #020617; }
        .academy-markdown-dark .academy-callout { background: rgba(14,165,233,0.10); border-color: rgba(56,189,248,0.30); }
        .academy-markdown-dark .academy-callout-warning { background: rgba(245,158,11,0.10); border-color: rgba(251,191,36,0.30); }
        .academy-markdown-dark .academy-callout-success { background: rgba(16,185,129,0.10); border-color: rgba(52,211,153,0.30); }
        .academy-markdown-dark .academy-callout-error { background: rgba(244,63,94,0.10); border-color: rgba(251,113,133,0.30); }
        .academy-markdown-dark .academy-callout-title, .academy-markdown-dark .academy-step-title, .academy-markdown-dark .academy-api-title { color: #f8fafc; }
        .academy-markdown-dark .academy-callout-label, .academy-markdown-dark .academy-video-duration { color: #94a3b8; }
        .academy-markdown-dark .academy-api-path { background: #0f172a; color: #f8fafc; }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          h1: ({ children, ...props }) => <h1 id={slugHeading(textFromNode(children))} {...props}>{children}</h1>,
          h2: ({ children, ...props }) => <h2 id={slugHeading(textFromNode(children))} {...props}>{children}</h2>,
          h3: ({ children, ...props }) => <h3 id={slugHeading(textFromNode(children))} {...props}>{children}</h3>,
          h4: ({ children, ...props }) => <h4 id={slugHeading(textFromNode(children))} {...props}>{children}</h4>,
          p: ({ ...props }) => <p {...props} />,
          ul: ({ ...props }) => <ul {...props} />,
          ol: ({ ...props }) => <ol {...props} />,
          a: ({ ...props }) => <a {...props} />,
          table: ({ ...props }) => <table {...props} />,
          pre: ({ ...props }) => <pre {...props} />,
          code: ({ ...props }) => <code {...props} />,
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}

function CodeTabs({ tabs }: { tabs: any[] }) {
  const usableTabs = useMemo(() => (Array.isArray(tabs) ? tabs.filter((tab) => tab?.code) : []), [tabs]);
  const [activeTab, setActiveTab] = useState(usableTabs[0]?.label || "curl");
  const active = usableTabs.find((tab) => tab.label === activeTab) || usableTabs[0];
  if (!active) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-950">
        {usableTabs.map((tab) => (
          <button key={tab.label} type="button" onClick={() => setActiveTab(tab.label)} className={`rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-widest ${tab.label === active.label ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}>
            {String(tab.label)}
          </button>
        ))}
      </div>
      <CodeBlock code={String(active.code || "")} language={String(active.language || "text")} title={String(active.label || "Example")} compact />
    </div>
  );
}

function CodeBlock({ code, language, title, meta, compact = false }: { code: string; language: string; title: string; meta?: string; compact?: boolean }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {}
  };
  return (
    <div className={`overflow-hidden rounded-[5px] border border-slate-100 bg-slate-950 ${compact ? "" : "shadow-sm"}`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{title}</div>
          {meta ? <div className="mt-1 text-[11px] font-semibold text-slate-500">{meta}</div> : null}
        </div>
        <Button variant="ghost" onClick={copy} className="h-8 gap-2 border border-white/10 bg-white/5 px-3 text-xs font-black text-white hover:bg-white/10">
          <Copy size={13} /> Copy
        </Button>
      </div>
      <pre className={`overflow-x-auto p-4 text-sm text-slate-100 ${compact ? "min-h-[220px]" : ""}`}>
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}
