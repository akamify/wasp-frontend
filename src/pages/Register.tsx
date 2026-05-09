import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API, setToken, setWorkspaceId } from "../api/api";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const startResendCooldown = () => setResendCooldown(60);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await register(email, password, name);
      if (res?.requiresOtp && res?.challengeToken) {
        setRequiresOtp(true);
        setChallengeToken(String(res.challengeToken));
        setOtp("");
        startResendCooldown();
        return;
      }
      if (res?.token) {
        navigate("/app", { replace: true });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await API.auth.verifyRegisterOtp({ challengeToken, otp });
      const token = String(res?.token || "");
      if (!token) throw new Error("Missing token");
      setToken(token);
      if (res?.workspace?.id) setWorkspaceId(res.workspace.id);
      navigate("/app", { replace: true });
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
      await API.auth.resendRegisterOtp({ challengeToken });
      startResendCooldown();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <div className="text-xs font-semibold text-ink-800/60">{requiresOtp ? "Verify email" : "New tenant"}</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight">{requiresOtp ? "Enter OTP" : "Create account"}</h1>
        <p className="mt-2 text-sm text-ink-800/70">
          {requiresOtp
            ? "We sent a 6-digit OTP to your email address."
            : "This creates your workspace. Generate your API key later from the API Keys page after Meta setup."}
        </p>

        <form className="mt-6 grid gap-3" onSubmit={requiresOtp ? onVerifyOtp : onSubmit}>
          {error ? <Alert>{error}</Alert> : null}

          {!requiresOtp ? (
            <>
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team / brand name"
              />
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint="Minimum 8 characters."
                required
              />
              <Button type="submit" disabled={busy}>
                {busy ? "Creating..." : "Create account"}
              </Button>
            </>
          ) : (
            <>
              <Input
                label="OTP Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                placeholder="123456"
                required
              />
              <Button type="submit" disabled={busy}>
                {busy ? "Verifying..." : "Verify OTP"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy || resendCooldown > 0}
                onClick={resendOtp}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </Button>
            </>
          )}
        </form>

        <div className="mt-4 text-sm text-ink-800/70">
          Already have an account?{" "}
          <Link className="font-semibold text-ink-900 underline" to="/login">
            Sign in
          </Link>
          .
        </div>
      </Card>
    </div>
  );
}

