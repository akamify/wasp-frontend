import { formatCurrency } from "./currency";

export const PLAN_AMOUNT_STARTER = Number(import.meta.env.VITE_PLAN_STARTER_PRICE || 29);
export const PLAN_AMOUNT_GROWTH = Number(import.meta.env.VITE_PLAN_GROWTH_PRICE || 99);
const enterpriseEnv = import.meta.env.VITE_PLAN_ENTERPRISE_PRICE;
export const PLAN_AMOUNT_ENTERPRISE: number | "custom" =
    enterpriseEnv === undefined || enterpriseEnv === null || enterpriseEnv === ""
        ? "custom"
        : isNaN(Number(enterpriseEnv))
            ? "custom"
            : Number(enterpriseEnv);

export const PLAN_PER = (import.meta.env.VITE_PLAN_PER as string) || "/mo";

export function getPlanDisplayPrice(name: string) {
    const map: Record<string, number | "custom"> = {
        Starter: PLAN_AMOUNT_STARTER,
        Growth: PLAN_AMOUNT_GROWTH,
        Enterprise: PLAN_AMOUNT_ENTERPRISE,
    };
    const val = map[name];
    if (val === undefined) return "—";
    if (val === "custom") return "Custom";
    if (Number(val) === 0) return "Free";
    return formatCurrency(Number(val));
}
