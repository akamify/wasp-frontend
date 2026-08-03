import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getToken } from "@api/api";
import { ContentAreaSkeleton } from "@components/ui/Skeletons";
import { aiAgentsApi } from "@modules/ai-agents/aiAgentsApi";
import AiAgentsLockedPage from "@modules/ai-agents/pages/AiAgentsLockedPage";
import type { AiAddonStatusResponse } from "@modules/ai-agents/types";

export function RequireAiAgents() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AiAddonStatusResponse | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      setStatus(null);
      return;
    }

    let active = true;
    setLoading(true);
    aiAgentsApi
      .addonStatus()
      .then((response) => {
        if (!active) return;
        setStatus(response);
      })
      .catch(() => {
        if (!active) return;
        setStatus(null);
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

  if (loading) return <ContentAreaSkeleton />;

  if (!status?.access?.enabled) {
    return <AiAgentsLockedPage status={status} onPurchased={setStatus} />;
  }

  return <Outlet />;
}
