import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { Alert } from "@components/ui/Alert";
import { useToast } from "@shared/providers/ToastContext";
import { PublicShell } from "@pages/public/PublicShell";
import { Seo } from "@shared/components/Seo";

export default function RaiseTicketPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && email.trim().length >= 5 && subject.trim().length >= 3 && message.trim().length >= 5;
  }, [name, email, subject, message]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");
    try {
      await API.public.createSupportTicket({ name, email, phone, subject, message });
      toast("Ticket raised successfully.", "success");
      navigate("/help-center");
    } catch (err: any) {
      setError(err?.userMessage || err?.response?.data?.message || err?.message || "Failed to submit ticket.");
      toast("Failed to submit ticket.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <Seo
        title="Raise a Ticket | WaspAkamify"
        description="Contact support by raising a ticket with your details, subject, and issue description."
        canonical={window.location.href}
      />
      <div className="rounded-3xl border border-ink-900/10 bg-white/80 p-8 shadow-xl shadow-ink-900/5 backdrop-blur-md">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Raise a Ticket</h1>
        <p className="mt-2 text-sm text-ink-900/60">Please share your details and the problem. Our team will contact you.</p>

        {error ? <div className="mt-6"><Alert>{error}</Alert></div> : null}

        <form onSubmit={onSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          <Input label="Name*" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
          <Input label="Email*" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone / WhatsApp" />
          <Input label="Subject*" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required />
          <div className="md:col-span-2">
            <Textarea label="Problem / Message*" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Describe your issue…" required />
          </div>
          <div className="md:col-span-2 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" className="h-11 rounded-2xl px-5 font-bold" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button disabled={!canSubmit || loading} className="h-11 rounded-2xl px-5 font-bold">
              {loading ? "Submitting…" : "Submit Ticket"}
            </Button>
          </div>
        </form>
      </div>
    </PublicShell>
  );
}

