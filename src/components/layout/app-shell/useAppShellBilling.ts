import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { requiredFeatureForPath, requiredPlanForPath } from "@components/layout/app-shell/utils";
import type { RequiredFeatureKey } from "@components/layout/app-shell/utils";

export function useAppShellBilling(pathname: string) {
  const [billingCurrent, setBillingCurrent] = useState<any>(null);
  const [billingLoading, setBillingLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await API.billing.current();
        if (alive) setBillingCurrent(res || null);
      } catch {
        if (alive) setBillingCurrent(null);
      } finally {
        if (alive) setBillingLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  return useMemo(() => {
    const requiredPlan = requiredPlanForPath(pathname);
    const requiredFeature = requiredFeatureForPath(pathname);
    const features = billingCurrent?.effective?.features || {};
    const hasProAccess = Boolean(features?.crmAccess || features?.externalChatApiAccess || features?.automationAccess);
    const isBlockedByPlan = !billingLoading && requiredPlan !== null && requiredPlan === "pro" && !hasProAccess;
    const proFeatureKeys: RequiredFeatureKey[] = [
      "crmPageAccess",
      "flowsPageAccess",
      "linksPageAccess",
      "automationPageAccess",
      "activityPageAccess",
      "apiKeysPageAccess",
      "apiReportsPageAccess",
    ];
    const featureNeedsPro = requiredFeature ? proFeatureKeys.includes(requiredFeature) : false;
    const hasFeaturePageAccess = requiredFeature == null ? true : Boolean(features?.[requiredFeature]);
    const isBlockedByFeature = !billingLoading && requiredFeature !== null && !hasFeaturePageAccess;
    const planRestrictionEnabled = billingCurrent?.enforcement?.planRestrictionsEnabled === true;
    return {
      requiredPlan,
      featureNeedsPro,
      isPlanAccessBlocked: planRestrictionEnabled && (isBlockedByPlan || isBlockedByFeature),
      isAccessCheckPending: planRestrictionEnabled && billingLoading && (requiredPlan !== null || requiredFeature !== null),
    };
  }, [billingCurrent, billingLoading, pathname]);
}

