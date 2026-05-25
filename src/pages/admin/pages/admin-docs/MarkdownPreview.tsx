import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";

export function MarkdownPreview({ content }: { content: string }) {
  const previewMarkdown = useMemo(() => String(content || "").replace(/:::step-card\s*([\s\S]*?):::/g, (_m, inner) => `<div class="step-card">\n${String(inner || "").trim()}\n</div>`), [content]);
  return (
    <div className="docs-preview bg-[#f8fafc] p-8">
      <style>{`.docs-preview { color:#64748b; line-height:1.72; font-size:15px; font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; } .docs-preview h1,.docs-preview h2,.docs-preview h3 { color:#0f172a; margin:0; } .docs-preview h1 { font-size:22px; font-weight:700; line-height:1.1; margin:0 0 22px; letter-spacing:0.1em; text-transform:uppercase; } .docs-preview h2,.docs-preview h3 { font-size:16px; font-weight:700; line-height:1.35; margin:42px 0 16px; letter-spacing:0.14em; text-transform:uppercase; } .docs-preview p { margin:0 0 22px; } .docs-preview ul { margin:0 0 20px 30px; } .docs-preview li { margin:0 0 14px; } .docs-preview li::marker { color:#d1d5db; } .docs-preview strong { color:#111827; font-weight:600; } .docs-preview .step-card { border:1px solid #dbe1ea; border-radius:8px; padding:26px 28px; background:#f8fafc; margin:18px 0; } .docs-preview a { color:#111827; font-weight:700; text-decoration:underline; text-underline-offset:4px; }`}</style>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeHighlight]}>{previewMarkdown}</ReactMarkdown>
    </div>
  );
}
