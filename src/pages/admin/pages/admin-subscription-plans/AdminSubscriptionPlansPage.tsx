import { Alert } from "@components/ui/Alert";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { EditorView } from "./EditorView";
import { ListView } from "./ListView";
import { useSubscriptionPlansState } from "./useSubscriptionPlans";

export default function AdminSubscriptionPlansPage() {
  const state = useSubscriptionPlansState();
  if (!state.isSuperAdmin) return <div className="p-4 md:p-8"><Alert variant="danger">Only super admin can access plan management.</Alert></div>;
  if (state.loading) return <div className="p-4 md:p-8"><TableSkeleton cols={10} rows={8} /></div>;
  const isFreePlan = Boolean(state.editor?.isFreePlan || state.editor?.slug === "free" || state.editor?.id === "free-plan");
  if (state.isCreate || state.isEdit || state.isReview || state.isView) {
    return <EditorView {...state} isFreePlan={isFreePlan} />;
  }
  return <ListView {...state} />;
}
