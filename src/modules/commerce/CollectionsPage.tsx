import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import type { Conversation } from "@modules/conversations/types/conversations.types";
import { useCommerce, useCommerceAction, useCommerceQuery } from "./commerceContext";
import type { Collection, Product } from "./types";
import { Check, ErrorNotice, QueryState, Status } from "./ui";

function CollectionEditor({ collection, close, saved }: { collection: Collection; close: () => void; saved: () => void }) {
  const { can } = useCommerce(), action = useCommerceAction(), [current, setCurrent] = useState(collection), [name, setName] = useState(collection.name), [search, setSearch] = useState("");
  const assigned = useCommerceQuery<{ products: (Product & { position: number })[]; nextCursor: number | null }>(`/collections/${collection.id}/products`, { limit: 100 });
  const all = useCommerceQuery<{ products: Product[]; nextCursor: string | null }>("/products", { limit: 100, archived: false });
  const assignedIds = new Set(assigned.data?.products.map((p) => p.id));
  const available = useMemo(() => (all.data?.products || []).filter((p) => !assignedIds.has(p.id) && `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())), [all.data, assigned.data, search]);
  const manage = can("commerce.products.manage");
  const mutate = (path: string, data: unknown) => action.run<{ collection: Collection }>(path, data, (result) => { setCurrent(result.collection); setName(result.collection.name); assigned.reload(); all.reload(); saved(); });
  return <Modal open title={`Edit collection: ${collection.name}`} onClose={() => !action.busy && close()}>
    <div className="space-y-4"><form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); mutate(`/collections/${collection.id}`, { name, revision: current.revision }); }}>
      <Input label="Collection name" required maxLength={24} value={name} onChange={(e) => setName(e.target.value)} />
      <Button className="self-end" disabled={!manage || action.busy || !name.trim() || name.trim() === current.name} type="submit">Save</Button>
    </form><ErrorNotice message={action.error} />
    <div><h3 className="font-semibold">Assigned products</h3><QueryState {...assigned} empty={!assigned.data?.products.length} />
      <div className="divide-y">{assigned.data?.products.map((product, index) => <div key={product.id} className="flex items-center justify-between gap-2 py-2">
        <div><p className="text-sm font-medium">{product.name}</p><Status value={product.syncStatus} /></div>
        {manage && <div className="flex gap-1"><Button size="sm" variant="ghost" disabled={action.busy || index === 0} onClick={() => mutate(`/collections/${collection.id}/products/${product.id}/move`, { revision: current.revision, direction: "up" })}>Up</Button><Button size="sm" variant="ghost" disabled={action.busy || index === (assigned.data?.products.length || 0) - 1} onClick={() => mutate(`/collections/${collection.id}/products/${product.id}/move`, { revision: current.revision, direction: "down" })}>Down</Button><Button size="sm" variant="ghost" disabled={action.busy} onClick={() => mutate(`/collections/${collection.id}/products/remove`, { revision: current.revision, productIds: [product.id] })}>Remove</Button></div>}
      </div>)}</div></div>
    {manage && <div className="space-y-2"><h3 className="font-semibold">Add products</h3><Input label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
      <QueryState {...all} empty={!available.length} />{available.slice(0, 25).map((product) => <div key={product.id} className="flex items-center justify-between gap-2"><span className="text-sm">{product.name} · {product.sku}</span><Button size="sm" variant="outline" disabled={action.busy} onClick={() => mutate(`/collections/${collection.id}/products`, { revision: current.revision, productIds: [product.id] })}>Add</Button></div>)}</div>}
    <div className="flex justify-end"><Button variant="outline" onClick={close}>Close</Button></div></div>
  </Modal>;
}

function ConversationPicker({ collection, close }: { collection: Collection; close: () => void }) {
  const navigate = useNavigate(), [search, setSearch] = useState(""), [loading, setLoading] = useState(false), [error, setError] = useState(""), [items, setItems] = useState<Conversation[]>([]);
  const load = async () => { setLoading(true); setError(""); try { const data = await API.conversations.list({ limit: 100, search: search || undefined }); setItems(data.conversations || []); } catch { setError("Conversations could not be loaded."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const openWindow = (conversation: Conversation) => !!conversation.lastInboundAt && Date.now() - new Date(conversation.lastInboundAt).getTime() < 24 * 60 * 60 * 1000;
  return <Modal open title={`Send ${collection.name}`} onClose={close}><div className="space-y-3"><p className="text-sm text-slate-500">Choose a customer. The collection will open in the composer for final review; it will not send automatically.</p>
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void load(); }}><Input label="Search conversations" value={search} onChange={(e) => setSearch(e.target.value)} /><Button className="self-end" type="submit">Search</Button></form>
    <ErrorNotice message={error} />{loading && <p role="status">Loading…</p>}<div className="max-h-80 divide-y overflow-auto">{items.map((item) => <div key={item.phone} className="flex items-center justify-between gap-2 py-3"><div><p className="font-medium">{item.contact?.name || item.phone}</p><p className="text-xs text-slate-500">{openWindow(item) ? "Service window open" : "Service window closed"}</p></div><Button size="sm" disabled={!openWindow(item)} onClick={() => navigate(`/app/conversations/${encodeURIComponent(item.phone)}?commerceCollections=${collection.id}`)}>Open composer</Button></div>)}</div></div></Modal>;
}

export default function CollectionsPage() {
  const { can } = useCommerce(), query = useCommerceQuery<{ collections: Collection[] }>("/collections", { archived: false }), action = useCommerceAction();
  const [creating, setCreating] = useState(false), [name, setName] = useState(""), [editing, setEditing] = useState<Collection | null>(null), [sending, setSending] = useState<Collection | null>(null);
  const manage = can("commerce.products.manage");
  const create = () => action.run<{ collection: Collection }>("/collections", { name }, () => { setCreating(false); setName(""); query.reload(); });
  return <section className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="font-bold">Collections</h2><p className="text-sm text-slate-500">Build named WhatsApp product sections. Products may belong to more than one collection.</p></div>{manage && <Button onClick={() => setCreating(true)}>New collection</Button>}</div>
    <ErrorNotice message={action.error} /><QueryState {...query} empty={!query.data?.collections.length} />
    <div className="divide-y rounded-lg border bg-white px-4">{query.data?.collections.map((collection, index) => <div key={collection.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold">{collection.name}</p><p className="text-sm text-slate-500">{collection.totalProducts} products · {collection.eligibleProducts} eligible · {collection.pendingProducts} pending · {collection.unavailableProducts} unavailable</p></div><div className="flex gap-1">{manage && <><Button size="sm" variant="ghost" disabled={action.busy || index === 0} onClick={() => action.run(`/collections/${collection.id}/move`, { revision: collection.revision, direction: "up" }, query.reload)}>Up</Button><Button size="sm" variant="ghost" disabled={action.busy || index === (query.data?.collections.length || 0) - 1} onClick={() => action.run(`/collections/${collection.id}/move`, { revision: collection.revision, direction: "down" }, query.reload)}>Down</Button><Button size="sm" variant="outline" onClick={() => setEditing(collection)}>Edit</Button><Button size="sm" variant="ghost" disabled={action.busy} onClick={() => action.run(`/collections/${collection.id}/archive`, { revision: collection.revision }, query.reload)}>Archive</Button></>}<Button size="sm" disabled={!collection.eligibleProducts || collection.eligibleProducts > 30} onClick={() => setSending(collection)}>Send</Button></div></div>)}</div>
    {creating && <Modal open title="New collection" onClose={() => !action.busy && setCreating(false)}><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create(); }}><Input label="Name" required maxLength={24} value={name} onChange={(e) => setName(e.target.value)} /><ErrorNotice message={action.error} /><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit" disabled={action.busy || !name.trim()}>Create</Button></div></form></Modal>}
    {editing && <CollectionEditor key={`${editing.id}:${editing.revision}`} collection={editing} close={() => setEditing(null)} saved={query.reload} />}
    {sending && <ConversationPicker collection={sending} close={() => setSending(null)} />}
  </section>;
}
