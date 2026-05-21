import { useCallback, useEffect, useMemo, useState } from "react";
import { platformSettingsService } from "@modules/platform-settings/services/platformSettings.service";
import type { PlatformSettingItem } from "@modules/platform-settings/types/platformSettings.types";

export function usePlatformSettings() {
  const [items, setItems] = useState<PlatformSettingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformSettingsService.listAll();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const byCategory = useMemo(() => {
    const map: Record<string, PlatformSettingItem[]> = {};
    for (const item of items) {
      map[item.category] = map[item.category] || [];
      map[item.category].push(item);
    }
    return map;
  }, [items]);

  return { items, byCategory, loading, refresh, setItems };
}
