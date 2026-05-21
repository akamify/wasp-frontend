import { useCallback, useState } from "react";
import { adminApiKeysService } from "@modules/admin/services/adminApiKeys.service";
import type { UserApiKeyListResponse } from "@modules/admin/types/api-key.types";

export function useUserApiKeys() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserApiKeyListResponse | null>(null);

  const load = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const res = await adminApiKeysService.listForUser(userId);
      setData(res);
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, data, load, setData };
}
