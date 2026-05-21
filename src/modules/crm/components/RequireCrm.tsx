import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { API, getToken } from "@api/api";
import { SessionSkeleton } from "@components/ui/Skeletons";
import CrmLockedPage from "@modules/crm/pages/CrmLocked";

type WorkspaceCrmRes = { success: boolean; workspace?: { crmEnabled?: boolean } };

export function RequireCrm() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [crmEnabled, setCrmEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      setCrmEnabled(null);
      return;
    }

    let active = true;
    setLoading(true);
    API.crm
      .workspace()
      .then((res: WorkspaceCrmRes) => {
        if (!active) return;
        setCrmEnabled(Boolean(res?.workspace?.crmEnabled));
      })
      .catch(() => {
        if (!active) return;
        setCrmEnabled(false);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (loading) return <SessionSkeleton />;

  if (!crmEnabled) {
    return <CrmLockedPage />;
  }

  return <Outlet />;
}

