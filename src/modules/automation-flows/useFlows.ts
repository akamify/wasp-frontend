import { useCallback, useEffect, useState } from "react";
import { flowsApi } from "@modules/automation-flows/flowsApi";
import type { AutomationFlow, FlowListParams } from "@modules/automation-flows/types";

export function useFlowsList(params: FlowListParams) {
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await flowsApi.list(params);
      setFlows(Array.isArray(response.flows) ? response.flows : []);
      setTotal(Number(response.total || 0));
    } catch (requestError: unknown) {
      const errorLike = requestError as {
        userMessage?: string;
        message?: string;
        response?: { data?: { message?: string; details?: string[] } };
      };
      const detail = errorLike.response?.data?.details?.[0];
      setError(
        detail ||
          errorLike.userMessage ||
          errorLike.response?.data?.message ||
          errorLike.message ||
          "Unable to load automation flows."
      );
    } finally {
      setLoading(false);
    }
  }, [params.limit, params.page, params.search, params.status]);

  useEffect(() => {
    void load();
  }, [load]);

  return { flows, loading, error, total, reload: load };
}

export function useFlow(flowId: string | undefined) {
  const [flow, setFlow] = useState<AutomationFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!flowId) return;
    setLoading(true);
    setError("");
    try {
      const response = await flowsApi.get(flowId);
      setFlow(response.flow);
    } catch (requestError: unknown) {
      const errorLike = requestError as { userMessage?: string; message?: string };
      setError(errorLike.userMessage || errorLike.message || "Unable to load this flow.");
    } finally {
      setLoading(false);
    }
  }, [flowId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { flow, setFlow, loading, error, reload: load };
}
