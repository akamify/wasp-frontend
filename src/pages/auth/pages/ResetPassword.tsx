import { useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => String(searchParams.get("token") || ""), [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await API.auth.resetPassword({ token, password });
      setMessage("Password has been reset. Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <div className="text-xs font-semibold text-ink-800/60">Account recovery</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight">Reset password</h1>
        <p className="mt-2 text-sm text-ink-800/70">Set a new password for your account.</p>

        <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
          {error ? <Alert>{error}</Alert> : null}
          {message ? <Alert tone="success">{message}</Alert> : null}
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Updating..." : "Reset password"}
          </Button>
        </form>

        <div className="mt-4 text-sm text-ink-800/70">
          Back to{" "}
          <Link className="font-semibold text-ink-900 underline" to="/login">
            Sign in
          </Link>
          .
        </div>
      </Card>
    </div>
  );
}
