import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { useCommerceAction, useCommerceQuery } from "./commerceContext";
import { Check, ErrorNotice, QueryState } from "./ui";

type Setup = { name: string; catalogId: string; state: "ready" | "creating" | "created" | "connected"; activePhoneMatches: boolean };
export function CreateCatalog({ connected }: { connected: () => void }) {
  const query = useCommerceQuery<{ setup: Setup | null }>("/catalog/setup");
  const action = useCommerceAction();
  const [name, setName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [recoveryCatalogId, setRecoveryCatalogId] = useState("");
  const setup = query.data?.setup;
  const uncertain = setup?.state === "creating" && !setup.catalogId;
  return <form className="space-y-3 rounded-lg border p-4" onSubmit={(event) => {
    event.preventDefault();
    void action.run("/catalog/create", { name: setup?.name || name.trim(), confirmOwnership: confirmed,
      ...(uncertain && recoveryCatalogId.trim() ? { recoveryCatalogId: recoveryCatalogId.trim() } : {}) }, connected)
      .then(query.reload);
  }}>
    <h3 className="font-semibold">Create new catalog</h3>
    <p className="text-sm text-slate-500">Create a menu or product catalog in the Meta Business that owns your connected WhatsApp account. Then add your products here.</p>
    <QueryState {...query} />
    {query.data && <fieldset disabled={action.busy || setup?.activePhoneMatches === false} className="space-y-3">
      <Input label="Catalog name" required maxLength={150} value={setup?.name || name} disabled={!!setup} onChange={(event) => setName(event.target.value)} placeholder="Faizan Restaurant Menu" />
      {setup?.catalogId && <p className="text-sm">Catalog {setup.catalogId} has already been created. Continue to finish connecting it.</p>}
      {setup?.activePhoneMatches === false && <ErrorNotice message="Restore the WhatsApp connection used to start this setup before continuing." />}
      {uncertain && <><p role="alert" className="text-sm">The previous creation result is uncertain or still processing. Refresh status first. If no ID appears, find the catalog in Meta Commerce Manager and enter its ID to resume safely.</p>
        <Input label="Existing catalog ID for recovery" required pattern="[0-9]{1,30}" value={recoveryCatalogId} onChange={(event) => setRecoveryCatalogId(event.target.value)} /></>}
      <Check label="Create and connect this catalog in my WhatsApp business." checked={confirmed} onChange={setConfirmed} />
      <p className="text-xs text-slate-500">Meta must grant your connection business, catalog and WhatsApp management access. If permission is denied, update your Meta authorization before retrying.</p>
      <Link className="inline-block text-sm font-semibold text-emerald-700 underline" to="/app/meta">Check or authorize catalog access</Link>
      <Button type="submit" disabled={!confirmed || action.busy}>{action.busy ? "Connecting…" : setup ? "Continue setup" : "Create & connect"}</Button>
    </fieldset>}
    <ErrorNotice message={action.error} />
    <Button type="button" variant="ghost" disabled={action.busy} onClick={query.reload}>Refresh setup status</Button>
  </form>;
}
