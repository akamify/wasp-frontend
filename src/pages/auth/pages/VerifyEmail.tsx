import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API, setToken, setWorkspaceId } from "@api/api";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { AuthIllustration } from "@components/auth/AuthIllustration";
import { Seo } from "@shared/components/Seo";
import { BRAND_NAME } from "@shared/config/brand";
import { useOtpGuard } from "@shared/hooks/useOtpGuard";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as { email?: string; challengeToken?: string; message?: string };
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(state.message || "We sent a 6-digit verification OTP to your email.");
  const otpGuard = useOtpGuard({ cooldownSeconds: 60, maxAttempts: 5 });

  const email = String(state.email || "").trim();
  const challengeToken = String(state.challengeToken || "").trim();

  React.useEffect(() => {
    if (!challengeToken) navigate("/login", { replace: true });
  }, [challengeToken, navigate]);

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
      setInfo("A new verification OTP has been sent to your email.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-row items-center lg:items-start justify-center min-h-screen bg-gray-50 gap-12">
      <Seo
        title={`Verify email | ${BRAND_NAME}`}
        description="Verify your email to complete account sign in."
        robots="noindex,nofollow"
      />
      <div className="hidden lg:sticky lg:top-10 lg:self-start lg:block">
        <AuthIllustration />
      </div>
      <div className="flex min-h-dvh items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-5">
          <div className="text-xs font-semibold text-ink-800/60">Verify email</div>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Enter OTP</h1>
          <p className="mt-2 text-sm text-ink-800/70">
            Enter the 6-digit OTP sent to <span className="font-semibold text-ink-900">{email || "your email"}</span>.
          </p>

          <form className="mt-6 grid gap-3" onSubmit={onVerifyOtp}>
            {error ? <Alert>{error}</Alert> : null}
            {!error && info ? <Alert variant="success">{info}</Alert> : null}
            <Input
              label="OTP Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              placeholder="123456"
              required
            />
            <Button type="submit" disabled={busy || !challengeToken}>
              {busy ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy || !challengeToken || !otpGuard.canSend}
              onClick={resendOtp}
            >
              {!otpGuard.canSend
                ? otpGuard.cooldown > 0
                  ? `Resend in ${otpGuard.cooldown}s`
                  : "Resend limit reached"
                : "Resend OTP"}
            </Button>
          </form>

          <div className="mt-4 text-sm text-ink-800/70">
            Back to{" "}
            <Link className="font-semibold text-ink-900 underline" to="/login">
              sign in
            </Link>
            .
          </div>
        </Card>
      </div>
    </div>
  );
}
