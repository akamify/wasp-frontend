import { Plus, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { newAuthSupportedApp } from "@modules/templates/utils/helpers";
import type { AuthSupportedApp } from "@modules/templates/types/templates.types";

type AuthOtpType = "ZERO_TAP" | "ONE_TAP" | "COPY_CODE";

type Props = {
  authAddExpiration: boolean;
  authAddSecurity: boolean;
  authAppsValid: boolean;
  authExpiresMinutes: string;
  authOtpType: AuthOtpType;
  authRequiresAppSetup: boolean;
  authSupportedApps: AuthSupportedApp[];
  setAuthAddExpiration: (value: boolean) => void;
  setAuthAddSecurity: (value: boolean) => void;
  setAuthExpiresMinutes: (value: string) => void;
  setAuthOtpType: (value: AuthOtpType) => void;
  setAuthSupportedApps: Dispatch<SetStateAction<AuthSupportedApp[]>>;
};

const AUTH_OTP_OPTIONS = [
  {
    id: "ZERO_TAP",
    title: "Zero-tap autofill",
    desc: "Recommended. The code is sent automatically where supported. If zero-tap or autofill is not available, WhatsApp falls back to a copy code flow.",
  },
  {
    id: "ONE_TAP",
    title: "One-tap autofill",
    desc: "Customers tap the button to send the code to your app. A copy code message is used if autofill is not possible.",
  },
  {
    id: "COPY_CODE",
    title: "Copy code",
    desc: "Basic authentication with quick setup. Customers copy and paste the code into your app.",
  },
] as const;

export function AuthenticationTemplateSection(props: Props) {
  return (
    <div className="grid gap-4">
      <CodeDeliverySetup authOtpType={props.authOtpType} setAuthOtpType={props.setAuthOtpType} />
      {props.authRequiresAppSetup ? <AppSetupSection {...props} /> : null}
      <AuthenticationContentSection {...props} />
    </div>
  );
}

function CodeDeliverySetup({ authOtpType, setAuthOtpType }: Pick<Props, "authOtpType" | "setAuthOtpType">) {
  return (
    <div className="rounded-[5px] border border-ink-900/10 bg-slate-50/50 p-5 shadow-none">
      <div className="mb-1 text-sm font-bold text-ink-900">Code delivery setup</div>
      <div className="text-xs text-ink-800/60">Choose how customers send the code from WhatsApp to your app. Edits to this section do not change the template category.</div>
      <div className="mt-4 grid gap-3">
        {AUTH_OTP_OPTIONS.map((opt) => (
          <label key={opt.id} className={`flex cursor-pointer items-start gap-3 rounded-[5px] border px-4 py-3 transition ${authOtpType === opt.id ? "border-brand-300 bg-white" : "border-ink-900/10 bg-white/80 hover:bg-white"}`}>
            <input type="radio" name="authOtpType" value={opt.id} checked={authOtpType === opt.id} onChange={(e) => setAuthOtpType(e.target.value as AuthOtpType)} className="mt-1 h-4 w-4" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink-900">{opt.title}</div>
              <div className="mt-0.5 text-xs text-ink-800/60">{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>
      {authOtpType === "ZERO_TAP" ? (
        <div className="mt-4 rounded-[5px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900/80">
          By using zero-tap, you confirm your customers expect WhatsApp to automatically fill the code on their behalf.
        </div>
      ) : null}
    </div>
  );
}

function AppSetupSection({ authAppsValid, authSupportedApps, setAuthSupportedApps }: Props) {
  return (
    <div className="rounded-[5px] border border-ink-900/10 bg-slate-50/50 p-5 shadow-none">
      <div className="mb-1 text-sm font-bold text-ink-900">App setup</div>
      <div className="text-xs text-ink-800/60">You can add up to 5 apps. Package name and app signature hash are required for autofill authentication.</div>
      <div className="mt-4 grid gap-4">
        {authSupportedApps.map((app, index) => (
          <div key={app.id} className="rounded-[5px] border border-ink-900/10 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-800/50">App {index + 1}</div>
              {authSupportedApps.length > 1 ? (
                <Button type="button" size="sm" variant="ghost" className="rounded-[5px] text-red-500 shadow-none hover:bg-red-50 hover:text-red-600" onClick={() => setAuthSupportedApps((prev) => prev.filter((item) => item.id !== app.id))}>
                  <Trash2 size={14} />
                </Button>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Package name" value={app.packageName} onChange={(e) => setAuthSupportedApps((prev) => prev.map((item) => item.id === app.id ? { ...item, packageName: e.target.value } : item))} placeholder="com.example.myapplication" className="rounded-[5px] shadow-none" required />
              <Input label="App signature hash" value={app.signatureHash} onChange={(e) => setAuthSupportedApps((prev) => prev.map((item) => item.id === app.id ? { ...item, signatureHash: e.target.value.trim() } : item))} placeholder="11 characters" hint="Your signature hash must be 11 characters long." className="rounded-[5px] shadow-none" required />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-ink-800/60">{authAppsValid ? "App setup looks good." : "Add package name and 11-character signature hash for each app."}</div>
        <Button type="button" size="sm" variant="ghost" className="rounded-[5px] border border-ink-900/10 bg-white shadow-none" onClick={() => setAuthSupportedApps((prev) => [...prev, newAuthSupportedApp()])} disabled={authSupportedApps.length >= 5}>
          <Plus size={14} /> Add app
        </Button>
      </div>
    </div>
  );
}

function AuthenticationContentSection({ authAddExpiration, authAddSecurity, authExpiresMinutes, setAuthAddExpiration, setAuthAddSecurity, setAuthExpiresMinutes }: Props) {
  return (
    <div className="rounded-[5px] border border-ink-900/10 bg-slate-50/50 p-5 shadow-none">
      <div className="mb-1 text-sm font-bold text-ink-900">Content</div>
      <div className="text-xs text-ink-800/60">Authentication template content cannot be edited. You can only add the options below.</div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[5px] border border-ink-900/10 bg-white px-4 py-3">
        <input type="checkbox" checked={authAddSecurity} onChange={(e) => setAuthAddSecurity(e.target.checked)} className="mt-1 h-4 w-4" />
        <div><div className="text-sm font-semibold text-ink-900">Add security recommendation</div><div className="mt-0.5 text-xs text-ink-800/60">Adds "For your security, do not share this code."</div></div>
      </label>
      <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-[5px] border border-ink-900/10 bg-white px-4 py-3">
        <input type="checkbox" checked={authAddExpiration} onChange={(e) => setAuthAddExpiration(e.target.checked)} className="mt-1 h-4 w-4" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-ink-900">Add expiration time for the code</div>
          <div className="mt-0.5 text-xs text-ink-800/60">Shows "This code expires in X minutes."</div>
          {authAddExpiration ? <div className="mt-3 max-w-[220px]"><Input label="Expiration (minutes)" value={authExpiresMinutes} onChange={(e) => setAuthExpiresMinutes(e.target.value.replace(/[^\d]/g, ""))} placeholder="10" hint="Allowed range: 1-90." className="rounded-[5px] shadow-none" /></div> : null}
        </div>
      </label>
      <div className="mt-4 rounded-[5px] border border-ink-900/10 bg-white px-4 py-3 text-xs text-ink-800/70">Authentication template name, language, and category cannot be edited later.</div>
    </div>
  );
}
