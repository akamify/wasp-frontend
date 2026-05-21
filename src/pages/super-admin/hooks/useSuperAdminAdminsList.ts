import { API } from "@api/api";
import { useCallback } from "react";
import { useAdminList } from "@pages/admin/hooks/useAdminList";

export type SuperAdminListItem = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
};

export function useSuperAdminAdminsList() {
  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string; filter?: string; sort?: string }) =>
      API.superAdmin.admins(params).then((r: any) => {
        const items = Array.isArray(r.items) ? r.items : [];
        return {
          items,
          total: Number(r.total || items.length || 0),
          page: Number(r.page || params.page),
          limit: Number(r.limit || params.limit),
          totalPages: Number(r.totalPages || 1),
        };
      }),
    []
  );

  return useAdminList<SuperAdminListItem>({
    fetcher,
    initialLimit: 25,
    initialFilter: "all",
    initialSort: "recent",
  });
}
