import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@shared/providers/AuthContext";
import { API, setToken, setWorkspaceId } from "@api/api";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { AuthIllustration } from "@components/auth/AuthIllustration";
import { useOtpGuard } from "@shared/hooks/useOtpGuard";
import { authenticatedHome } from "@shared/utils/authNavigation";

export default function RegisterPage() {
  const { loading, register, token, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
  const otpGuard = useOtpGuard({ cooldownSeconds: 60, maxAttempts: 5 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && token && user) {
      navigate(authenticatedHome(user.role, token), { replace: true });
    }
  }, [loading, navigate, token, user]);

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
        otpGuard.onSendSuccess();
        return;
      }
      if (res?.token) {
        navigate("/workspaces", { replace: true });
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
      navigate("/workspaces", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "OTP verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    if (!challengeToken || !otpGuard.canSend) return;
    setError(null);
    setBusy(true);
    try {
      await API.auth.resendRegisterOtp({ challengeToken });
      otpGuard.onSendSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-row items-center justify-center min-h-screen bg-gray-50 gap-12 lg:px-2 lg:py-10">
      <div className="hidden lg:block">
        <AuthIllustration />
      </div>
      <div className="flex min-h-dvh items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-6">
          <div className="text-xs font-semibold text-ink-800/60">{requiresOtp ? "Verify email" : ""}</div>
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
                  disabled={busy || !otpGuard.canSend}
                  onClick={resendOtp}
                >
                  {!otpGuard.canSend
                    ? otpGuard.cooldown > 0
                      ? `Resend in ${otpGuard.cooldown}s`
                      : "Resend limit reached"
                    : "Resend OTP"}
                </Button>
                <div className="text-center text-[11px] font-semibold text-slate-500">
                  OTP tries left: {otpGuard.remainingAttempts}/{otpGuard.maxAttempts}
                </div>
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
    </div>
  );
}
