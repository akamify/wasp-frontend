import { useEffect, useState } from "react";

const RUPEE_SYMBOL = "\u20b9";
const listeners = new Set<(symbol: string) => void>();

export const CURRENCY_CODE = (import.meta.env.VITE_CURRENCY_CODE as string) || "INR";
export const CURRENCY_LOCALE = (import.meta.env.VITE_CURRENCY_LOCALE as string) || (CURRENCY_CODE === "INR" ? "en-IN" : "en-US");
export const CURRENCY_SYMBOL = (import.meta.env.VITE_CURRENCY_SYMBOL as string) || RUPEE_SYMBOL;

let runtimeCurrencySymbol = CURRENCY_SYMBOL;

export function setCurrencySymbolOverride(symbol?: string | null) {
    const next = String(symbol || "").trim();
    runtimeCurrencySymbol = next || CURRENCY_SYMBOL || RUPEE_SYMBOL;
    listeners.forEach((listener) => listener(runtimeCurrencySymbol));
}

export function getCurrencySymbol() {
    return runtimeCurrencySymbol || CURRENCY_SYMBOL || RUPEE_SYMBOL;
}

export function useCurrencySymbol() {
    const [symbol, setSymbol] = useState(getCurrencySymbol());
    useEffect(() => {
        listeners.add(setSymbol);
        return () => {
            listeners.delete(setSymbol);
        };
    }, []);
    return symbol;
}

function isInrCurrency(currency?: string) {
    return String(currency || CURRENCY_CODE || "INR").trim().toUpperCase() === "INR";
}

export function formatCurrency(value: number, currency?: string, locale?: string) {
    const n = Number.isFinite(value) ? value : 0;
    const rounded = Math.round((n + Number.EPSILON) * 100) / 100;
    const cur = currency || CURRENCY_CODE;
    const loc = locale || CURRENCY_LOCALE;
    if (isInrCurrency(cur)) {
        return `${getCurrencySymbol()}${rounded.toLocaleString(loc || "en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }
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
        if (isInrCurrency(cur)) return `${getCurrencySymbol()}${Number(value || 0)}`;
        return `${cur} ${Number(value || 0)}`;
    }
}

export function formatCurrencyFromPaise(paise?: number | null, currency = "INR") {
    if (paise == null) return "-";
    return formatCurrencySafe(Math.round(Number(paise) || 0) / 100, currency);
}
