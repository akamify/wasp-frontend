import { useParams } from "react-router-dom";
import { SubscriptionsList } from "./admin-subscriptions-data/subscriptions-list";
import { SubscriptionWorkspaceDetail } from "./admin-subscriptions-data/workspace-detail";

export default function AdminSubscriptionsDataPage() {
  const { workspaceId } = useParams();
  return workspaceId ? <SubscriptionWorkspaceDetail /> : <SubscriptionsList />;
}
