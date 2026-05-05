import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { BRAND_NAME } from "../config/brand";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await login(email, password);
      if (res?.user?.role !== "admin") {
        setError("This account is not an admin.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Admin login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <div className="text-xs font-semibold text-ink-800/60">Admin access</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight">Admin sign in</h1>
        <p className="mt-2 text-sm text-ink-800/70">
          Sign in to manage {BRAND_NAME} users, credentials, templates, and wallets.
        </p>

        <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
          {error ? <Alert>{error}</Alert> : null}

          <Input
            label="Admin Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

