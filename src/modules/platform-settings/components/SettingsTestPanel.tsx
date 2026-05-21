import { useState } from "react";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { useToast } from "@shared/providers/ToastContext";
import { platformSettingsService } from "@modules/platform-settings/services/platformSettings.service";

export function SettingsTestPanel() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState("");

  async function run(action: "email" | "meta" | "razorpay") {
    setBusy(action);
    try {
      if (action === "email") {
        await platformSettingsService.testEmail(email);
        toast("Test email sent", "success");
      } else if (action === "meta") {
        const res = await platformSettingsService.testMeta();
        toast(res?.success ? "Meta settings valid" : "Meta settings incomplete", res?.success ? "success" : "error");
      } else {
        const res = await platformSettingsService.testRazorpay();
        toast(res?.success ? "Razorpay settings valid" : "Razorpay settings incomplete", res?.success ? "success" : "error");
      }
    } catch (e: any) {
      toast(e?.response?.data?.message || "Test failed", "error");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="rounded-[5px] border border-slate-200 bg-white p-4">
      <div className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Validation Tests</div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Test email address" />
        <Button onClick={() => run("email")} disabled={!email || busy !== ""}>{busy === "email" ? "Sending..." : "Send Test Email"}</Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => run("meta")} disabled={busy !== ""}>{busy === "meta" ? "Checking..." : "Validate Meta"}</Button>
        <Button variant="outline" onClick={() => run("razorpay")} disabled={busy !== ""}>{busy === "razorpay" ? "Checking..." : "Validate Razorpay"}</Button>
      </div>
    </div>
  );
}
