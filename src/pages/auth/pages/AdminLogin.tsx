import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@shared/providers/AuthContext";
import { API, setToken, setWorkspaceId } from "@api/api";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { BRAND_NAME } from "@shared/config/brand";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (res?.requires2fa && res?.challengeToken) {
        if (res?.user?.role !== "admin") {
          setError("This account is not an admin.");
          return;
        }
        setRequiresOtp(true);
        setChallengeToken(String(res.challengeToken));
        setOtp("");
        setResendCooldown(60);
        return;
      }
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

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await API.auth.verifyLoginOtp({ challengeToken, otp });
      if (res?.user?.role !== "admin") {
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
        <div className="text-xs font-semibold text-ink-800/60">{requiresOtp ? "Admin verification" : "Admin access"}</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight">{requiresOtp ? "Enter OTP" : "Admin sign in"}</h1>
        <p className="mt-2 text-sm text-ink-800/70">
          {requiresOtp
            ? "We sent a 6-digit OTP to the admin email address."
            : `Sign in to manage ${BRAND_NAME} users, credentials, templates, and wallets.`}
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
                setResendCooldown(0);
              }}
            >
              Back
            </Button>
          ) : null}
        </form>

        <div className="mt-4 text-sm text-ink-800/70">
          Forgot password?{" "}
          <Link className="font-semibold text-ink-900 underline" to="/admin/forgot-password">
            Reset admin password
          </Link>
          .
        </div>
      </Card>
    </div>
  );
}

