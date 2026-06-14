import type { ReactNode } from "react";

const MARKDOWN_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|www\.[^)\s]+|[a-z0-9.-]+\.[a-z]{2,}[^\s)]*)\)/gi;
const RAW_LINK_RE = /((?:https?:\/\/|www\.)[^\s<]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s<]*)?)/gi;
const TRAILING_PUNCTUATION_RE = /[.,)\]}]+$/;

function safeHref(value: string) {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function splitTrailingPunctuation(value: string) {
  const trailing = value.match(TRAILING_PUNCTUATION_RE)?.[0] || "";
  return {
    link: trailing ? value.slice(0, -trailing.length) : value,
    trailing,
  };
}

function linkNode(label: string, rawHref: string, key: string) {
  const { link, trailing } = splitTrailingPunctuation(rawHref);
  const href = safeHref(link);
  if (!href) return rawHref;
  return (
    <span key={key}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-brand-600 underline underline-offset-2"
        onClick={(event) => event.stopPropagation()}
      >
        {label}
      </a>
      {trailing}
    </span>
  );
}

export function linkifyTextNodes(text: string, keyPrefix = "link"): ReactNode[] {
  const source = String(text || "");
  const nodes: ReactNode[] = [];
  let cursor = 0;

  source.replace(MARKDOWN_LINK_RE, (match, label: string, href: string, offset: number) => {
    if (offset > cursor) {
      nodes.push(...linkifyRawText(source.slice(cursor, offset), `${keyPrefix}-raw-${offset}`));
    }
    nodes.push(linkNode(label, href, `${keyPrefix}-md-${offset}`));
    cursor = offset + match.length;
    return match;
  });

  if (cursor < source.length) {
    nodes.push(...linkifyRawText(source.slice(cursor), `${keyPrefix}-tail`));
  }
  return nodes.length ? nodes : [source];
}

function linkifyRawText(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  text.replace(RAW_LINK_RE, (match, _unused: string, offset: number) => {
    if (offset > cursor) nodes.push(text.slice(cursor, offset));
    nodes.push(linkNode(match, match, `${keyPrefix}-${offset}`));
    cursor = offset + match.length;
    return match;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.length ? nodes : [text];
}

export function LinkifiedText({ text }: Readonly<{ text: string }>) {
  return <>{linkifyTextNodes(text)}</>;
}
