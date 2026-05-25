export const EMPTY_DOC = {
  id: "",
  title: "",
  slug: "",
  description: "",
  content: "",
  keywords: [] as string[],
  category: "general",
  status: "draft",
  sidebar: { section: "", sectionOrder: 0, itemOrder: 0 },
  seo: { metaTitle: "", metaDescription: "", ogImage: "", noIndex: false },
};

export const TOOLBAR = [
  { label: "Text", title: "Text Block" },
  { label: "H", title: "Heading" },
  { label: "Sec", title: "Section Heading" },
  { label: "B", title: "Bold" },
  { label: "I", title: "Italic" },
  { label: "Link", title: "Link" },
  { label: "Code", title: "Code Block" },
  { label: "JSON", title: "API Response" },
  { label: "Resp", title: "Response Block" },
  { label: "Callout", title: "Callout Block" },
  { label: "Bash", title: "Bash Command" },
  { label: "Key", title: "Key Capability" },
  { label: "Mermaid", title: "Mermaid Diagram" },
  { label: "Step", title: "Step Card" },
] as const;

export function slugify(value: string) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function splitBlocks(content: string) {
  return String(content || "").split(/\n{2,}/g).map((x) => x.trim()).filter(Boolean);
}

export function detectBlockLabel(snippet: string) {
  const s = String(snippet || "").trim();
  if (!s) return "Text Block";
  if (/^:::step-card/i.test(s)) return "Step Card";
  if (/^:::callout/i.test(s)) return "Callout Block";
  if (/^\*\s+\*\*.+\*\*\s*:/.test(s)) return "Key Capability";
  if (/^####\s+.*\n```json/i.test(s)) return "Response Block";
  if (/^```mermaid/i.test(s)) return "Mermaid Diagram";
  if (/^```bash/i.test(s)) return "Bash Command";
  if (/^```json/i.test(s)) return "API Response";
  if (/^```/.test(s)) return "Code Block";
  if (/^###\s+/.test(s)) return "Section Heading";
  if (/^#\s+/.test(s)) return "Heading";
  if (/^\*\*.+\*\*$/.test(s)) return "Bold";
  if (/^\*[^\n]+\*$/.test(s)) return "Italic";
  if (/^\[[^\]]+\]\([^\)]+\)$/.test(s)) return "Link";
  return "Text Block";
}
