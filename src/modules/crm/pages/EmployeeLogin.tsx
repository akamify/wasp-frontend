import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { useEmployeeAuth } from "@modules/crm/providers/EmployeeAuthContext";
import { Eye, EyeOff } from "lucide-react";
import { EmployeeIllustration } from "@components/auth/EmployeeIllustration";

export default function EmployeeLoginPage() {
  const { login } = useEmployeeAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaceId, setWorkspaceId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(workspaceId.trim(), email.trim(), password);
      const from = (location.state as any)?.from;
      const target = typeof from === "string" && from.startsWith("/employee") ? from : "/employee/inbox";
      navigate(target, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-row items-center justify-center min-h-dvh gap-12">
      <div className="hidden lg:sticky lg:top-10 lg:self-start lg:block">
        <EmployeeIllustration />
      </div>
      <div className="w-full max-w-md">
        <Card className="w-full p-6">
          <div className="text-xs font-semibold text-ink-800/60">CRM Employee</div>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-ink-800/70">Login with your assigned workspace ID, email and password.</p>

          <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
            {error ? <Alert>{error}</Alert> : null}
            <Input label="Workspace ID" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              rightIconLabel={showPassword ? "Hide password" : "Show password"}
              onRightIconClick={() => setShowPassword((v) => !v)}
            />
            <Button type="submit" disabled={busy}>
              {busy ? "Please wait..." : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
