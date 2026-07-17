import { useState } from "react";
import { Link } from "react-router-dom";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await API.auth.adminForgotPassword({ email });
      setMessage(res?.message || "If the email is valid, a reset link has been sent.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to request admin password reset");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <div className="text-xs font-semibold text-ink-800/60">Admin recovery</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight">Forgot admin password</h1>
        <p className="mt-2 text-sm text-ink-800/70">Enter the configured admin email. We will send a reset link.</p>

        <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
          {error ? <Alert>{error}</Alert> : null}
          {message ? <Alert tone="success">{message}</Alert> : null}
          <Input
            label="Admin email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        <div className="mt-4 text-sm text-ink-800/70">
          Back to{" "}
          <Link className="font-semibold text-ink-900 underline" to="/admin/login">
            Admin sign in
          </Link>
          .
        </div>
      </Card>
    </div>
  );
}
