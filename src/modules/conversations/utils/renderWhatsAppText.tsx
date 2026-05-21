import React from "react";

function renderWhatsAppInline(text: string) {
  const parts: any[] = [];
  const regex = /(\*[^*]+\*|_[^_]+_|~[^~]+~|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(String(text || ""))) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const content = token.slice(1, -1);
    if (token.startsWith("*")) parts.push(<strong key={`b-${parts.length}`}>{content}</strong>);
    else if (token.startsWith("_")) parts.push(<em key={`i-${parts.length}`}>{content}</em>);
    else if (token.startsWith("~")) parts.push(<del key={`s-${parts.length}`}>{content}</del>);
    else if (token.startsWith("`")) {
      parts.push(
        <code key={`c-${parts.length}`} className="rounded bg-slate-100 px-1 text-[12px] text-slate-700">
          {content}
        </code>
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? parts : text;
}

export function renderWhatsAppText(text: string) {
  const segments = String(text || "").split("```");
  return segments.map((segment, idx) => {
    if (idx % 2 === 1) {
      return (
        <code key={`mono-${idx}`} className="block rounded bg-slate-100 px-2 py-1 text-[12px] text-slate-700">
          {segment}
        </code>
      );
    }
    return <span key={`seg-${idx}`}>{renderWhatsAppInline(segment)}</span>;
  });
}

