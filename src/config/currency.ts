export const CURRENCY_CODE = (import.meta.env.VITE_CURRENCY_CODE as string) || "INR";
export const CURRENCY_LOCALE = (import.meta.env.VITE_CURRENCY_LOCALE as string) || (CURRENCY_CODE === "INR" ? "en-IN" : "en-US");
export const CURRENCY_SYMBOL = (import.meta.env.VITE_CURRENCY_SYMBOL as string) || "";

export function formatCurrency(value: number, currency?: string, locale?: string) {
    const n = Number.isFinite(value) ? value : 0;
    const rounded = Math.round((n + Number.EPSILON) * 100) / 100;
    const cur = currency || CURRENCY_CODE;
    const loc = locale || CURRENCY_LOCALE;
    return new Intl.NumberFormat(loc, {
        style: "currency",
        currency: cur,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(rounded);
}

export function formatCurrencySafe(value: number, currency?: string) {
    try {
        return formatCurrency(value, currency);
    } catch (e) {
        const cur = currency || CURRENCY_CODE;
        return `${cur} ${Number(value || 0)}`;
    }
}
