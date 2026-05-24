import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API, setToken, setWorkspaceId } from "../api/api";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { BRAND_NAME } from "../config/brand";
import { normalizeRole } from "../shared/utils/authRole";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as any)?.from || null;

  function defaultTargetByRole(role?: string | null) {
    const normalized = normalizeRole(role);
    if (normalized === "super_admin") return "/super-admin";
    if (normalized === "admin") return "/admin";
    return "/app";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await login(email, password);
      if (res?.requires2fa && res?.challengeToken) {
        setRequiresOtp(true);
        setChallengeToken(String(res.challengeToken));
        setResendCooldown(60);
        setError(null);
        return;
      }
      const target = from || defaultTargetByRole(res?.user?.role);
      navigate(target, { replace: true });
    } catch (err: any) {
      const timeout = String(err?.code || "").toUpperCase() === "ECONNABORTED";
      setError(
        err?.userMessage ||
        err?.response?.data?.message ||
        (timeout ? "Login is taking too long. Please try again in a few seconds." : "Login failed")
      );
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
      const token = String(res?.token || "");
      if (!token) throw new Error("Missing token");
      setToken(token);
      if (res?.workspace?.id) setWorkspaceId(res.workspace.id);
      const target = from || defaultTargetByRole(res?.user?.role);
      window.location.replace(target);
    } catch (err: any) {
      setError(err?.response?.data?.message || "OTP verification failed");
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

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
    <div className="flex flex-col min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <div className="text-xs font-semibold text-ink-800/60">{requiresOtp ? "Security verification" : "Welcome back"}</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight">{requiresOtp ? "Enter OTP" : "Sign in"}</h1>
        <p className="mt-2 text-sm text-ink-800/70">
          {requiresOtp
            ? "We sent a 6-digit OTP to your registered email address."
            : `Use your ${BRAND_NAME} account to manage your dashboard.`}
        </p>

        <form className="mt-6 grid gap-3" onSubmit={requiresOtp ? onVerifyOtp : onSubmit}>
          {error ? <Alert>{error}</Alert> : null}

          {!requiresOtp ? (
            <>
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
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                onRightIconClick={() => setShowPassword((v) => !v)}
                rightIconLabel={showPassword ? "Hide password" : "Show password"}
                required
              />
              <div className="text-right">
                <Link className="text-sm font-semibold text-ink-900 underline" to="/forgot-password">
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
            <Button
              type="button"
              variant="ghost"
              disabled={busy || resendCooldown > 0}
              onClick={resendOtp}
            >
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

        <div className="mt-4 text-sm text-ink-800/70">
          No account?{" "}
          <Link className="font-semibold text-ink-900 underline" to="/register">
            Create one
          </Link>
          .
        </div>
      </Card>
      <Card className="flex items-center justify-center w-full max-w-md mt-4 p-4">
        <div className="text-sm text-ink-800/70">
          CRM employee?{" "}
          <Link className="font-semibold text-ink-900 underline" to="/employee/login">
            Employee login
          </Link>
          .
        </div>
      </Card>
    </div>
  );
}

