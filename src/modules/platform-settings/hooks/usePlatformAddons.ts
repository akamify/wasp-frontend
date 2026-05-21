import { useCallback, useEffect, useMemo, useState } from "react";
import { platformAddonsService } from "@modules/platform-settings/services/platformAddons.service";
import type { PlatformAddonItem } from "@modules/platform-settings/types/platformSettings.types";

export function usePlatformAddons() {
  const [items, setItems] = useState<PlatformAddonItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformAddonsService.listAll();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const byCategory = useMemo(() => {
    const map: Record<string, PlatformAddonItem[]> = {};
    for (const item of items) {
      map[item.category] = map[item.category] || [];
      map[item.category].push(item);
    }
    return map;
  }, [items]);

  return { items, byCategory, loading, refresh, setItems };
}
