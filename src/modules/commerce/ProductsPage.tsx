import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { useCommerce, useCommerceAction, useCommerceQuery } from "./commerceContext";
import type { Catalog, Product } from "./types";
import { Check, DisabledFeature, ErrorNotice, fieldClass, money, Pager, Panel, QueryState, Status } from "./ui";
function ProductForm({ product, close, saved }: { product?: Product; close: () => void; saved: () => void }) {
  const [form, setForm] = useState({ sku: product?.sku || "", name: product?.name || "", description: product?.description || "", imageUrl: product?.imageUrl || "", productUrl: product?.productUrl || "",
    brand: product?.brand || "", category: product?.category || "", condition: product?.condition || "new", price: product ? (product.pricePaise / 100).toFixed(2) : "", tax: product?.taxRateBps == null ? "" : String(product.taxRateBps / 100),
    taxConfirmed: false, available: product?.available ?? true, trackInventory: product?.trackInventory ?? false, stockOnHand: product?.stockOnHand || 0 });
  const action = useCommerceAction(), upload = useCommerceAction(), [imageError, setImageError] = useState("");
  const change = (key: string, value: unknown) => setForm((old) => ({ ...old, [key]: value }));
  return <Modal open title={product ? "Edit product" : "Add product"} onClose={() => !action.busy && !upload.busy && close()}><form className="space-y-4" onSubmit={(e) => { e.preventDefault();
    const { tax, sku, ...fields } = form;
    void action.run(product ? `/products/${product.id}` : "/products", { ...fields, taxRateBps: tax === "" ? null : Math.round(Number(tax) * 100),
      ...(product ? { revision: product.revision } : { sku }) }, saved, product ? "PATCH" : "POST"); }}>
    <fieldset disabled={action.busy || upload.busy} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2">
      <Input label="SKU" required maxLength={100} disabled={!!product} value={form.sku} onChange={(e) => change("sku", e.target.value)} />
      <Input label="Product name" required maxLength={150} value={form.name} onChange={(e) => change("name", e.target.value)} />
      <Input label="Selling price (INR, tax inclusive)" inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" required value={form.price} onChange={(e) => change("price", e.target.value)} />
      <Input label="Included tax rate % (blank if unspecified)" type="number" min="0" max="100" step="0.01" value={form.tax} onChange={(e) => change("tax", e.target.value)} />
      <Input label="Image URL (HTTPS)" type="url" required maxLength={2048} value={form.imageUrl} onChange={(e) => change("imageUrl", e.target.value)} />
      <Input label="Product page URL (HTTPS)" type="url" required maxLength={2048} value={form.productUrl} onChange={(e) => change("productUrl", e.target.value)} />
      <Input label="Brand (optional)" maxLength={100} value={form.brand} onChange={(e) => change("brand", e.target.value)} />
      <Input label="Category (optional)" maxLength={100} value={form.category} onChange={(e) => change("category", e.target.value)} />
    </div><Input label="Or upload a product image (JPEG/PNG, up to 5 MiB)" type="file" accept="image/jpeg,image/png" onChange={(e) => {
      const file = e.target.files?.[0]; e.target.value = ""; setImageError(""); if (!file) return;
      if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024) { setImageError("Choose a JPEG or PNG image no larger than 5 MiB."); return; }
      const body = new FormData(); body.append("file", file); void upload.run<{ asset: { publicUrl: string } }>("/images", body, (result) => change("imageUrl", result.asset.publicUrl));
    }} /><ErrorNotice message={imageError || upload.error} /><label className="block text-sm">Description<textarea className={fieldClass} required maxLength={5000} rows={3} value={form.description} onChange={(e) => change("description", e.target.value)} /></label>
    <label className="block text-sm">Condition<select className={fieldClass} value={form.condition} onChange={(e) => change("condition", e.target.value)}>{["new", "refurbished", "used"].map((v) => <option key={v}>{v}</option>)}</select></label>
    <Check label="Available for sale" checked={form.available} onChange={(v) => change("available", v)} />
    <Check label="Track inventory" checked={form.trackInventory} onChange={(v) => change("trackInventory", v)} />
    {form.trackInventory && <Input label={`Stock on hand (${product?.stockReserved || 0} reserved)`} type="number" min={product?.stockReserved || 0} max={1000000000} step={1} required value={form.stockOnHand} onChange={(e) => change("stockOnHand", Number(e.target.value))} />}
    <Check label="I confirm this selling price includes tax and the tax rate is correct." checked={form.taxConfirmed} onChange={(v) => change("taxConfirmed", v)} />
    </fieldset><ErrorNotice message={action.error} /><div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={action.busy || upload.busy} onClick={close}>Cancel</Button><Button type="submit" disabled={action.busy || upload.busy || !form.taxConfirmed}>{action.busy ? "Saving…" : upload.busy ? "Uploading…" : "Save product"}</Button></div>
  </form></Modal>;
}
export default function ProductsPage() {
  const { can, access } = useCommerce(), [cursors, setCursors] = useState<string[]>([]), [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState<Product | "new" | null>(null), [confirmArchive, setConfirmArchive] = useState<Product | null>(null);
  const catalogQuery = useCommerceQuery<{ catalog: Catalog | null }>(access.capabilities.catalog ? "/catalog" : null);
  const catalogConnected = !!catalogQuery.data?.catalog && catalogQuery.data.catalog.activePhoneMatches !== false;
  const query = useCommerceQuery<{ products: Product[]; nextCursor: string | null }>(catalogConnected ? "/products" : null, { limit: 25, archived, cursor: cursors.at(-1) });
  const action = useCommerceAction(), manage = can("commerce.products.manage");
  if (!access.capabilities.catalog) return <DisabledFeature name="Catalog" />;
  return <Panel title="Products" action={manage && <Button disabled={!query.data || query.loading || !!query.error} onClick={() => setEditing("new")}>Add product</Button>}>
    <QueryState {...catalogQuery} />
    {catalogQuery.data && !catalogConnected && <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
      <p>Connect a catalog for the active WhatsApp account before managing products.</p>
      {can("commerce.catalog.manage") && <Link className="font-semibold underline" to="/app/commerce/settings">Open catalog setup</Link>}
    </div>}
    {query.error && can("commerce.catalog.manage") && <Link className="text-sm underline" to="/app/commerce/settings">Open catalog setup</Link>}
    <p className="text-sm text-slate-500">Prices and inventory are managed here. Products become sendable after Meta synchronization.</p>
    {catalogConnected && <div className="flex justify-between"><Check label="Archived products" checked={archived} onChange={(v) => { setArchived(v); setCursors([]); }} /><Button variant="ghost" size="sm" onClick={query.reload}>Refresh</Button></div>}
    <ErrorNotice message={action.error} />{catalogConnected && <QueryState {...query} empty={!query.data?.products.length} />}
    <div className="divide-y divide-slate-100">{query.data?.products.map((product) => <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="min-w-0"><p className="font-semibold break-words">{product.name}</p><p className="text-sm text-slate-500 break-all">{product.sku} · {money(product.pricePaise)} · {product.trackInventory ? `${product.stockOnHand - product.stockReserved} available / ${product.stockReserved} reserved` : "Inventory not tracked"}</p><Status value={product.syncStatus} />{product.syncError && <p className="mt-1 text-sm text-rose-700">{product.syncError}</p>}</div>
      {manage && <div className="flex flex-wrap gap-2">{!product.archivedAt && <><Button size="sm" variant="outline" onClick={() => setEditing(product)}>Edit</Button><Button size="sm" variant="ghost" disabled={action.busy} onClick={() => setConfirmArchive(product)}>Archive</Button></>}
        <Button size="sm" variant="outline" disabled={action.busy || product.syncStatus === "synced"} onClick={() => action.run(`/products/${product.id}/sync`, { revision: product.revision }, query.reload)}>Retry sync</Button></div>}
    </div>)}</div><Pager next={query.data?.nextCursor} back={cursors.length ? () => setCursors((v) => v.slice(0, -1)) : undefined} onNext={() => setCursors((v) => [...v, query.data!.nextCursor!])} />
    {editing && <ProductForm key={editing === "new" ? "new" : `${editing.id}:${editing.revision}`} product={editing === "new" ? undefined : editing} close={() => setEditing(null)} saved={() => { setEditing(null); query.reload(); }} />}
    {confirmArchive && <Modal open title="Archive product" onClose={() => !action.busy && setConfirmArchive(null)}><p className="mb-4">Archive {confirmArchive.name}? It will be removed from sale after synchronization.</p><ErrorNotice message={action.error} /><Button variant="danger" disabled={action.busy} onClick={() => action.run(`/products/${confirmArchive.id}/archive`, { revision: confirmArchive.revision }, () => { setConfirmArchive(null); query.reload(); })}>Archive product</Button></Modal>}
  </Panel>;
}
