import type { CsvParsed } from "@modules/campaigns/types/campaign-form.types";
import { formatCurrencySafe } from "@shared/config/currency";

export function formatCurrency(value: unknown, currency = "INR") {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return formatCurrencySafe(0, currency);
  return formatCurrencySafe(amount, currency);
}

export function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export function parseCsvText(text: string, maxRows = 5000): CsvParsed {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((header) => header.trim()).filter(Boolean);
  const rows = lines.slice(1, 1 + maxRows).map((line) => {
    const parts = line.split(",").map((part) => part.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = parts[index] ?? "";
    });
    return row;
  });

  return { headers, rows };
}
