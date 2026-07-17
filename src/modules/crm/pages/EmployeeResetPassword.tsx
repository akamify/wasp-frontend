import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { crmEmployeeAuthService } from "@modules/crm/services/crmEmployeeAuth.service";
import { Seo } from "@shared/components/Seo";
import { BRAND_NAME } from "@shared/config/brand";

export default function EmployeeResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => String(params.get("token") || "").trim(), [params]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing token. Please use the reset link from your email.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await crmEmployeeAuthService.resetPassword({ token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate("/employee/login", { replace: true }), 800);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to reset password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10 bg-slate-50">
      <Seo title={`Reset employee password | ${BRAND_NAME}`} description="Reset your employee account password." robots="noindex,nofollow" />
      <Card className="w-full max-w-md p-6">
        <div className="text-xs font-semibold text-ink-800/60">CRM Employee</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight">Set new password</h1>
        <p className="mt-2 text-sm text-ink-800/70">Create a new password for your employee account.</p>

        <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
          {error ? <Alert>{error}</Alert> : null}
          {done ? (
            <Alert>
              Password updated successfully. Redirecting to sign in...
              <div className="mt-2">
                <Link to="/employee/login" className="text-sm font-semibold underline">
                  Go to sign in
                </Link>
              </div>
            </Alert>
          ) : (
            <>
              <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Input label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              <Button type="submit" disabled={busy}>
                {busy ? "Please wait..." : "Reset password"}
              </Button>
              <Link to="/employee/login" className="text-sm font-semibold text-ink-800 underline">
                Back to sign in
              </Link>
            </>
          )}
        </form>
      </Card>
    </div>
  );
}

