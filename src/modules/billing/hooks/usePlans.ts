import { useEffect, useState } from "react";
import { billingService } from "@modules/billing/services/billing.service";

export function usePlans() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    billingService
      .listPlans()
      .then((res) => {
        if (!active) return;
        const next =
          (Array.isArray(res?.data?.plans) && res.data.plans) ||
          (Array.isArray(res?.items) && res.items) ||
          [];
        setItems(next);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.userMessage || err?.response?.data?.message || err?.message || "Failed to load plans");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { items, loading, error };
}
