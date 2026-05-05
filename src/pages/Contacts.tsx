import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Spinner } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Badge";

type Contact = {
  _id: string;
  name?: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  tags?: string[];
  source?: string;
  lastMessagePreview?: string;
  lastInboundAt?: string;
  lastOutboundAt?: string;
  updatedAt?: string;
};

function joinTags(tags?: string[]) {
  return (tags || []).join(", ");
}

function parseTags(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  company: "",
  tags: "",
  notes: "",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    try {
      const res = await API.contacts.list({ limit: 250, search });
      setContacts(res.contacts || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact._id === selectedId) || null,
    [contacts, selectedId]
  );

  function resetForm() {
    setSelectedId(null);
    setForm(EMPTY_FORM);
  }

  function fillForm(contact: Contact) {
    setSelectedId(contact._id);
    setForm({
      name: contact.name || "",
      phone: contact.phone || "",
      email: contact.email || "",
      company: contact.company || "",
      tags: joinTags(contact.tags),
      notes: contact.notes || "",
    });
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);

    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      company: form.company,
      tags: parseTags(form.tags),
      notes: form.notes,
    };

    try {
      if (selectedId) {
        const res = await API.contacts.update(selectedId, payload);
        setContacts((current) =>
          current.map((contact) => (contact._id === selectedId ? res.contact : contact))
        );
        fillForm(res.contact);
        setOk("Contact updated.");
      } else {
        const res = await API.contacts.create(payload);
        setContacts((current) => [res.contact, ...current]);
        fillForm(res.contact);
        setOk("Contact created.");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  }

  async function deleteContact() {
    if (!selectedId) return;
    if (!confirm("Delete this contact?")) return;

    setSaving(true);
    setError(null);
    setOk(null);

    try {
      await API.contacts.remove(selectedId);
      setContacts((current) => current.filter((contact) => contact._id !== selectedId));
      resetForm();
      setOk("Contact deleted.");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to delete contact");
    } finally {
      setSaving(false);
    }
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    await load();
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-[5px] border border-ink-900/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(236,255,248,0.92))] p-6 text-ink-900 shadow-[0_24px_90px_rgba(0,0,0,0.18)] sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-800/55">
              Audience desk
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Contacts</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-800/72">
              Add and maintain your WhatsApp audience here. Contacts are linked per tenant, so each
              logged-in user keeps a separate customer list and chat history.
            </p>
          </div>

          <div className="rounded-[5px] border border-emerald-200 bg-white/75 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-800/55">
              Audience health
            </div>
            <div className="mt-3 text-4xl font-black text-ink-900">{contacts.length}</div>
            <div className="mt-2 text-sm leading-6 text-ink-800/72">
              Contacts can be added manually, created from inbound chats, or touched automatically
              when outbound campaigns send.
            </div>
          </div>
        </div>
      </section>

      {error ? <Alert>{error}</Alert> : null}
      {ok ? (
        <div className="rounded-[5px] bg-brand-50 px-4 py-3 text-sm text-ink-900 ring-1 ring-brand-200">
          {ok}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_420px]">
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
                Contact list
              </div>
              <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
                Browse and open customer chatrooms
              </div>
            </div>
            <Button variant="ghost" onClick={resetForm}>
              New contact
            </Button>
          </div>

          <form className="mt-5 flex flex-wrap gap-3" onSubmit={runSearch}>
            <div className="min-w-0 w-full flex-1 sm:min-w-[240px]">
              <Input
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Phone, name, company"
              />
            </div>
            <div className="flex w-full items-end gap-2 sm:w-auto">
              <Button type="submit">Search</Button>
              <Button type="button" variant="ghost" onClick={load}>
                Refresh
              </Button>
            </div>
          </form>

          <div className="mt-5 grid gap-3">
            {loading ? (
              <Spinner label="Loading contacts..." />
            ) : contacts.length ? (
              contacts.map((contact) => (
                <div
                  key={contact._id}
                  className={`rounded-[5px] border p-4 transition ${
                    selectedId === contact._id
                      ? "border-brand-300/45 bg-brand-50"
                      : "border-ink-900/8 bg-slate-50/80 hover:bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      className="min-w-0 text-left"
                      onClick={() => fillForm(contact)}
                    >
                      <div className="truncate text-base font-black text-ink-900">
                        {contact.name || contact.phone}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-ink-800/50">
                        {contact.phone}
                        {contact.company ? ` | ${contact.company}` : ""}
                      </div>
                      {contact.lastMessagePreview ? (
                        <div className="mt-3 truncate text-sm text-ink-800/72">
                          {contact.lastMessagePreview}
                        </div>
                      ) : null}
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={contact.source === "manual" ? "neutral" : "good"}>
                        {contact.source || "manual"}
                      </Badge>
                      <Link to={`/app/conversations/${encodeURIComponent(contact.phone)}`}>
                        <Button size="sm">Open chatroom</Button>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs text-ink-800/58 sm:grid-cols-3">
                    <div>Inbound: {formatDate(contact.lastInboundAt)}</div>
                    <div>Outbound: {formatDate(contact.lastOutboundAt)}</div>
                    <div>Updated: {formatDate(contact.updatedAt)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[5px] border border-dashed border-ink-900/12 bg-slate-50/80 p-6 text-sm text-ink-800/70">
                No contacts found yet.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
                {selectedContact ? "Edit contact" : "Add contact"}
              </div>
              <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
                {selectedContact ? selectedContact.name || selectedContact.phone : "Create audience record"}
              </div>
            </div>
            {selectedContact ? (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Clear
              </Button>
            ) : null}
          </div>

          <form className="mt-5 grid gap-4" onSubmit={saveContact}>
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              placeholder="Aarav Gupta"
            />
            <Input
              label="WhatsApp phone"
              value={form.phone}
              onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
              placeholder="919999999999"
              required
            />
            <Input
              label="Email"
              value={form.email}
              onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              placeholder="aarav@example.com"
            />
            <Input
              label="Company"
              value={form.company}
              onChange={(e) => setForm((current) => ({ ...current, company: e.target.value }))}
              placeholder="Northwind Retail"
            />
            <Input
              label="Tags"
              value={form.tags}
              onChange={(e) => setForm((current) => ({ ...current, tags: e.target.value }))}
              placeholder="vip, repeat buyer, paid campaign"
            />
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
              placeholder="Conversation notes, handoff context, preferences"
              className="min-h-36"
            />

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : selectedContact ? "Save changes" : "Create contact"}
              </Button>
              {selectedContact ? (
                <Button type="button" variant="danger" onClick={deleteContact} disabled={saving}>
                  Delete
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
