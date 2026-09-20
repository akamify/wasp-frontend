import { useState } from "react";
import { Link } from "react-router-dom";
import { useCommerce, useCommerceQuery } from "./commerceContext";
import { Pager, Panel, QueryState } from "./ui";
import { useDeliveryRefresh } from "./DeliveryManagement";

type Snapshot = { orders: { id: string; orderNumber: string }[]; nextCursor: string | null; eligiblePickupCouriers: number; freeSlots: number; couriers: { _id: string; name: string; distance: number; batchLoad?: number; batchCapacity?: number }[] };
export default function BranchDispatch({ outletId }: { outletId: string }) {
  const { environment } = useCommerce(), [cursors, setCursors] = useState<string[]>([]);
  const query = useCommerceQuery<Snapshot>(`/outlets/${outletId}/dispatch`, { environment, limit: 25, cursor: cursors.at(-1) }, true);
  useDeliveryRefresh(query.reload, 10000, query.loading);
  return <Panel title="Branch acceptance queue and nearby couriers"><QueryState {...query} />{query.data && <>
    <p>{query.data.eligiblePickupCouriers} nearby pickup candidates; {query.data.freeSlots} remaining slots. Order radius, preparation and route compatibility are checked during assignment.</p>
    {!query.data.orders.length && <p>No automatically selected orders awaiting acceptance.</p>}
    {query.data.orders.map((o) => <div key={o.id} className="border-b py-2"><Link className="underline" to={`/app/commerce/orders/${o.id}`}>{o.orderNumber} — review and accept</Link></div>)}
    <Pager next={query.data.nextCursor} back={cursors.length ? () => setCursors((v) => v.slice(0, -1)) : undefined} onNext={() => setCursors((v) => [...v, query.data!.nextCursor!])} />
    {query.data.couriers.map((c) => <p key={c._id}>{c.name}: {(c.distance / 1000).toFixed(1)} km straight-line to pickup; {c.batchLoad || 0}/{c.batchCapacity || 1} slots occupied.</p>)}
    <p>Showing up to 25 nearby couriers. Assignment uses road ETA.</p><Link className="underline" to="/app/commerce/batch-dispatch">Open bulk assignment</Link>
  </>}</Panel>;
}
