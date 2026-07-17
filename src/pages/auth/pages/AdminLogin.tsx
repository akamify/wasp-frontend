import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@shared/providers/AuthContext";
import { API, setToken, setWorkspaceId } from "@api/api";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { BRAND_NAME } from "@shared/config/brand";
import { normalizeRole } from "@shared/utils/authRole";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await login(email, password);
      const role = normalizeRole(res?.user?.role);
      if (role !== "admin") {
        setError("This account is not an admin.");
        return;
      }
      if (res?.requires2fa && res?.challengeToken) {
        setRequiresOtp(true);
        setChallengeToken(String(res.challengeToken));
        setResendCooldown(60);
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Admin login failed");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await API.auth.verifyLoginOtp({ challengeToken, otp });
      const role = normalizeRole(res?.user?.role);
      if (role !== "admin") {
        setError("This account is not an admin.");
        return;
      }
      const token = String(res?.token || "");
      if (!token) throw new Error("Missing token");
      setToken(token);
      if (res?.workspace?.id) setWorkspaceId(res.workspace.id);
      window.location.replace("/admin");
    } catch (err: any) {
      setError(err?.response?.data?.message || "OTP verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    if (!challengeToken) return;
    setError(null);
    setBusy(true);
    try {
      await API.auth.resendLoginOtp({ challengeToken });
      setResendCooldown(60);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
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

        <form className="mt-6 grid gap-3" onSubmit={requiresOtp ? onVerifyOtp : onSubmit}>
          {error ? <Alert>{error}</Alert> : null}

          {!requiresOtp ? (
            <>
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
              <div className="text-right">
                <Link className="text-sm font-semibold text-ink-900 underline" to="/admin/forgot-password">
                  Forgot password?
                </Link>
              </div>
            </>
          ) : (
            <Input
              label="OTP Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              placeholder="123456"
              required
            />
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Please wait..." : requiresOtp ? "Verify OTP" : "Sign in"}
          </Button>
          {requiresOtp ? (
            <Button type="button" variant="ghost" disabled={busy || resendCooldown > 0} onClick={resendOtp}>
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
            </Button>
          ) : null}
          {requiresOtp ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setRequiresOtp(false);
                setOtp("");
                setChallengeToken("");
              }}
            >
              Back
            </Button>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
