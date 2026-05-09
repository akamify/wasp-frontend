export function parseCsvText(text: string, maxRows = 1000) {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { headers: [] as string[], rows: [] as Record<string, string>[] };

  const headers = lines[0].split(",").map((h) => h.trim()).filter(Boolean);
  const rows = lines.slice(1, 1 + maxRows).map((line) => {
    const parts = line.split(",").map((p) => p.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = parts[i] ?? "";
    });
    return obj;
  });

  return { headers, rows };
}

export function parsePhoneList(raw: string) {
  const parts = String(raw || "")
    .split(/[\n,; ]+/g)
    .map((p) => p.trim())
    .filter(Boolean);
  const phones = parts.map((p) => p.replace(/\D/g, "")).filter(Boolean);
  return Array.from(new Set(phones));
}

export function replacePlaceholders(text: string, values: string[]) {
  return String(text || "").replace(/\{\{(\d+)\}\}/g, (_, idxRaw) => {
    const idx = Number(idxRaw);
    if (!Number.isFinite(idx) || idx <= 0) return `{{${idxRaw}}}`;
    const val = values[idx - 1];
    return val !== undefined && val !== null && String(val) !== "" ? String(val) : `{{${idx}}}`;
  });
}
