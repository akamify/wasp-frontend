import { lazy, Suspense } from "react";
const DeliveryManagement = lazy(() => import("./DeliveryManagement"));
import { NavLink, useParams } from "react-router-dom";
import { CommerceProvider, useCommerce, useWorkspaceId } from "./commerceContext";
import ProductsPage from "./ProductsPage";
import OrdersPage from "./OrdersPage";
import PaymentsPage from "./PaymentsPage";
import SettingsPage from "./SettingsPage";
import { EnvironmentPicker } from "./ui";
export function CommerceDashboard() {
  const { section = "products", recordId } = useParams(), { can, environment, access } = useCommerce();
  const tabs = [["products", "Catalog & Products", "commerce.products.view"], ["orders", "Orders", "commerce.orders.view"],
    ["payments", "Payments", "commerce.payments.view"], ["settings", "Settings", "commerce.catalog.view"]];
  if (access.capabilities.delivery) tabs.push(...[["overview", "Overview"], ["outlets", "Restaurants & Branches"], ["dispatch", "Live Dispatch"], ["couriers", "Courier Partners"], ["dispatch-settings", "Dispatch Settings"], ["delivery-zones", "Delivery Zones"], ["batch-dispatch", "Batch Dispatch"], ["delivery-reports", "Reports & Activity"]].map(([key, title]) => [key, title, "commerce.delivery.view"]));
  const permitted = section === "settings" ? tabs.some((t) => can(t[2])) || can("commerce.gateway.manage") : tabs.some((t) => t[0] === section && can(t[2]));
  return <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Ecommerce Management</h1><p className="text-sm text-slate-500">Catalog, customer orders and merchant payments.</p></div><EnvironmentPicker /></div>
    <nav aria-label="Commerce" className="flex gap-2 overflow-x-auto border-b border-slate-200">{tabs.filter((t) => t[0] === "settings" || can(t[2])).map(([path, title]) => <NavLink key={path} to={`/app/commerce/${path}`} className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 ${section === path ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500"}`}>{title}</NavLink>)}</nav>
    {!permitted ? <p role="alert">This Commerce screen is unavailable for your workspace role.</p> : section === "products" ? <ProductsPage />
      : section === "orders" ? <OrdersPage key={`${environment}:${recordId || "list"}`} id={recordId} /> : section === "payments" ? <PaymentsPage key={environment} />
        : section === "settings" ? <SettingsPage key={environment} /> : access.capabilities.delivery && ["overview", "outlets", "dispatch", "couriers", "dispatch-settings", "delivery-zones", "batch-dispatch", "delivery-reports"].includes(section) ? <Suspense fallback={<p role="status">Loading delivery management...</p>}><DeliveryManagement key={`${environment}:${section}`} section={section} /></Suspense> : <p>Commerce screen not found.</p>}
  </div>;
}
export default function CommercePage() { const workspaceId = useWorkspaceId(); return <CommerceProvider key={workspaceId} workspaceId={workspaceId}><CommerceDashboard /></CommerceProvider>; }
