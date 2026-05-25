import React from "react";
import { Check, Copy, ExternalLink, FileText, MenuIcon, MessageSquareReply, PhoneCall, Sparkles, Star, Workflow } from "lucide-react";

export function renderWhatsAppInline(text: string) {
  const parts: Array<React.ReactNode> = [];
  const regex = /(\*[^*]+\*|_[^_]+_|~[^~]+~|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const content = token.slice(1, -1);
    if (token.startsWith("*")) parts.push(<strong key={`b-${parts.length}`}>{content}</strong>);
    else if (token.startsWith("_")) parts.push(<em key={`i-${parts.length}`}>{content}</em>);
    else if (token.startsWith("~")) parts.push(<del key={`s-${parts.length}`}>{content}</del>);
    else if (token.startsWith("`")) parts.push(<code key={`c-${parts.length}`} className="rounded bg-slate-100 px-1 text-[12px] text-slate-700">{content}</code>);
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? parts : text;
}

export function renderWhatsAppText(text: string) {
  const segments = String(text || "").split("```");
  return segments.map((segment, idx) => idx % 2 === 1 ? <code key={`mono-${idx}`} className="block rounded bg-slate-100 px-2 py-1 text-[12px] text-slate-700">{segment}</code> : <React.Fragment key={`seg-${idx}`}>{renderWhatsAppInline(segment)}</React.Fragment>);
}

export function renderTemplateText(source: string, values: Record<number, string>) {
  const text = String(source || "");
  if (!text.trim()) return null;
  const lines = text.split(/\r?\n/);
  return lines.map((line, lineIdx) => {
    const parts: Array<{ value: string; kind: "text" | "varValue" | "varPlaceholder" }> = [];
    let last = 0; const re = /\{\{(\d+)\}\}/g;
    for (let m = re.exec(line); m; m = re.exec(line)) {
      const start = m.index; const end = start + m[0].length;
      if (start > last) parts.push({ value: line.slice(last, start), kind: "text" });
      const index = Number(m[1]); const value = (values?.[index] || "").trim();
      parts.push({ value: value ? value : m[0], kind: value ? "varValue" : "varPlaceholder" }); last = end;
    }
    if (last < line.length) parts.push({ value: line.slice(last), kind: "text" });
    return <span key={lineIdx}>{parts.map((p, idx) => p.kind === "varValue" ? <span key={idx} className="font-medium text-[#355fa3]">{p.value}</span> : p.kind === "varPlaceholder" ? <span key={idx} className="rounded bg-blue-100 px-1 text-blue-700">{p.value}</span> : <span key={idx}>{renderWhatsAppText(p.value)}</span>)}{lineIdx < lines.length - 1 ? <br /> : null}</span>;
  });
}

export const MediaSkeleton = () => <div className="h-40 w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-100" />;
export const MediaStatus = ({ label, onCopy }: { label: string; onCopy: () => void }) => <div className="mt-2 flex items-center justify-between rounded-[5px] border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-600"><span className="font-medium">{label}</span><button type="button" className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600" onClick={onCopy}>Copy handle</button></div>;

export const iconForFlow = (icon: string) => { const value = String(icon || "DEFAULT").toUpperCase(); if (value === "DOCUMENT") return FileText; if (value === "PROMOTION") return Sparkles; if (value === "REVIEW") return Star; return Workflow; };
export const formatBytes = (value?: number) => { const n = Number(value || 0); if (!Number.isFinite(n) || n <= 0) return ""; if (n < 1024) return `${n} B`; if (n < 1024 * 1024) return `${Math.round((n / 1024) * 10) / 10} KB`; return `${Math.round((n / (1024 * 1024)) * 10) / 10} MB`; };
export const openUrl = (value: string) => { const normalized = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`; if (value.trim()) window.open(normalized, "_blank", "noopener,noreferrer"); };
export const dialPhone = (value: string) => value.trim() && window.open(`tel:${value.trim().replace(/\s+/g, "")}`, "_self");
export const copyButtonIcon = (copied: boolean) => copied ? <Check size={14} /> : <Copy size={14} />;
export { ExternalLink, MessageSquareReply, PhoneCall, MenuIcon };
