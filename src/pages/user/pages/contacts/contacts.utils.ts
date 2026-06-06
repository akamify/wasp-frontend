export type Contact = {
  _id: string;
  name?: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  tags?: string[];
  attributes?: Record<string, string | number | boolean>;
  source?: string;
  lastMessagePreview?: string;
  lastInboundAt?: string;
  lastOutboundAt?: string;
  updatedAt?: string;
};

export const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  company: "",
  tags: "",
  attributes: {} as Record<string, string | number | boolean | null>,
  legacyAttributes: {} as Record<string, string | number | boolean>,
  notes: "",
};

export function joinTags(tags?: string[]) {
  return (tags || []).join(", ");
}

function normalizeTag(tag: string) {
  return tag.replace(/\s+/g, " ").trim();
}

export function parseTags(raw: string) {
  if (!raw.trim()) return [];
  const pieces = raw.split(/[,\n;]+/g).map(normalizeTag).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of pieces) {
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag.slice(0, 32));
    if (result.length >= 20) break;
  }
  return result;
}

export function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

