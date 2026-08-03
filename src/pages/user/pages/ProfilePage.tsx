import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Calendar,
  Camera,
  Check,
  Copy,
  Edit2,
  Globe,
  Mail,
  Phone,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { EditProfileModal } from "@pages/user/components/EditProfileModal";
import { useProfilePage } from "@pages/user/hooks/useProfilePage";
import { WhatsAppManagerProfileModal } from "@pages/user/dashboard/WhatsAppManagerProfileModal";
import { useToast } from "@shared/providers/ToastContext";
import { cn } from "@shared/utils/cn";
import { whatsappProfilePictureUrl } from "@shared/utils/whatsappProfile";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    user,
    workspace,
    editModalOpen,
    editBusy,
    editForm,
    setEditForm,
    profileOtp,
    setProfileOtp,
    profileOtpBusy,
    profileOtpPurpose,
    otpSent,
    copiedWorkspaceId,
    formatDate,
    openEditModal,
    closeEditModal,
    handleSaveProfile,
    requestOtp,
    verifyOtp,
    copyWorkspaceId,
  } = useProfilePage();

  const [whatsAppProfileOpen, setWhatsAppProfileOpen] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaRefreshing, setMetaRefreshing] = useState(false);
  const [metaConnection, setMetaConnection] = useState<any>(null);
  const [metaImageBroken, setMetaImageBroken] = useState(false);

  const loadMetaConnection = useCallback(
    async (silent = false) => {
      if (!silent) setMetaLoading(true);
      try {
        const response = await API.meta.connection();
        setMetaConnection(response || null);
      } catch (e: any) {
        if (!silent) toast(e?.response?.data?.message || "Failed to load WhatsApp profile details", "error");
      } finally {
        if (!silent) setMetaLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    void loadMetaConnection();
  }, [loadMetaConnection]);

  const businessProfile = metaConnection?.businessProfile || {};
  const profilePictureUrl = whatsappProfilePictureUrl(businessProfile);

  useEffect(() => {
    setMetaImageBroken(false);
  }, [profilePictureUrl]);

  const isWhatsAppConnected = metaConnection?.connected === true;
  const connectionLabel = isWhatsAppConnected ? "Connected" : "Not connected";
  const workspaceName = workspace?.name || "Personal workspace";
  const userInitial = String(user?.name || user?.email || "?").trim().charAt(0).toUpperCase() || "?";
  const businessInitials = String(metaConnection?.verifiedName || metaConnection?.wabaName || workspaceName || "WA")
    .trim()
    .slice(0, 2)
    .toUpperCase();
  const websitesLabel = Array.isArray(businessProfile?.websites) && businessProfile.websites.length
    ? businessProfile.websites.join(", ")
    : "Not available yet";

  const detailCards = useMemo(
    () => [
      { label: "Email", value: user?.email || "Not available", icon: <Mail size={14} className="text-slate-400" /> },
      { label: "Phone", value: user?.phone || "Not provided yet", icon: <Phone size={14} className="text-slate-400" /> },
      { label: "Workspace", value: workspaceName, icon: <Building2 size={14} className="text-slate-400" /> },
      { label: "Joined", value: formatDate(user?.createdAt), icon: <Calendar size={14} className="text-slate-400" /> },
    ],
    [formatDate, user?.createdAt, user?.email, user?.phone, workspaceName]
  );

  async function refreshWhatsAppProfile() {
    setMetaRefreshing(true);
    try {
      await API.meta.refreshConnectionMetadata();
      await loadMetaConnection(true);
      toast("WhatsApp profile refreshed from Meta", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to refresh WhatsApp profile", "error");
    } finally {
      setMetaRefreshing(false);
      setMetaLoading(false);
    }
  }

  return (
    <div className="space-y-6 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_24%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(255,255,255,1))] p-4 pb-12 md:p-6 xl:p-8">
      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden border border-emerald-100/80 bg-[linear-gradient(135deg,_#052e2b_0%,_#0f766e_48%,_#10b981_100%)] p-6 text-white shadow-[0_30px_80px_-38px_rgba(6,78,59,0.58)] md:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_22%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.12),_transparent_26%)]" />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-50">
              <Sparkles size={14} />
              Workspace profile
            </div>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-white/15 bg-white/16 text-3xl font-black text-white shadow-lg shadow-emerald-950/15">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-3xl font-black tracking-tight text-white md:text-4xl">{user?.name || "Workspace owner"}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/15 bg-white/12 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-50">
                      {workspace?.plan || "Free"} plan
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/12 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-50">
                      <BadgeCheck size={13} />
                      Active account
                    </span>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-emerald-50/88">
                    Manage your account details, workspace identity, and the WhatsApp Business profile that customers see inside WhatsApp.
                  </p>
                </div>
              </div>
              <Button
                onClick={openEditModal}
                className="h-11 shrink-0 border-0 bg-white/14 px-5 text-white shadow-none backdrop-blur hover:bg-white/22"
              >
                <Edit2 size={14} />
                Edit account
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {detailCards.map((item) => (
                <div key={item.label} className="rounded-[18px] border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/62">
                    {item.icon}
                    {item.label}
                  </div>
                  <div className="mt-3 text-sm font-bold leading-6 text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="border border-white/80 bg-white/92 p-5 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Workspace identity</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">{workspaceName}</div>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  This workspace controls billing, WhatsApp setup, templates, campaigns, and all production messaging assets.
                </p>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Live workspace
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ProfileMetric label="Workspace ID" value={workspace?.id || "Not available"} compactCopy onCopy={() => void copyWorkspaceId()} copied={copiedWorkspaceId} />
              <ProfileMetric label="WhatsApp profile" value={connectionLabel} tone={isWhatsAppConnected ? "emerald" : "amber"} />
              <ProfileMetric label="Business name" value={metaConnection?.verifiedName || metaConnection?.wabaName || "Pending from Meta"} />
              <ProfileMetric label="Display phone" value={metaConnection?.displayPhoneNumber || "Connect WhatsApp first"} />
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border border-white/80 bg-white/92 p-5 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.38)]">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Settings</div>
              <div className="mt-2 text-lg font-black text-slate-900">Account controls</div>
              <div className="mt-1 text-sm font-medium leading-6 text-slate-500">Update personal details, security preferences, and workspace preferences.</div>
              <Button variant="outline" className="mt-4 w-full justify-center border-slate-200 bg-white font-bold hover:border-emerald-200 hover:bg-emerald-50/50" onClick={() => navigate("/app/settings")}>
                <Settings size={14} />
                Account settings
              </Button>
            </Card>
            <Card className="border border-white/80 bg-white/92 p-5 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.38)]">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Billing</div>
              <div className="mt-2 text-lg font-black text-slate-900">Plan and wallet</div>
              <div className="mt-1 text-sm font-medium leading-6 text-slate-500">Manage plan renewals, wallet balance, and add-on purchases from one place.</div>
              <div className="mt-4 flex gap-3">
                <Button variant="outline" className="flex-1 justify-center border-slate-200 bg-white font-bold hover:border-emerald-200 hover:bg-emerald-50/50" onClick={() => navigate("/app/plan")}>
                  <ArrowUpRight size={14} />
                  Plans
                </Button>
                <Button className="flex-1 justify-center border-0 bg-[linear-gradient(135deg,_#059669,_#10b981)] font-bold text-white hover:brightness-105" onClick={() => navigate("/app/wallet")}>
                  <WalletCards size={14} />
                  Wallet
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="overflow-hidden border border-white/80 bg-white/95 p-5 shadow-[0_24px_64px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">WhatsApp business profile</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Customer-facing brand profile</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Upload the profile photo, update the about/description, and save directly to Meta. This is the image and business profile customers see in WhatsApp.
              </p>
            </div>
            <div
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]",
                isWhatsAppConnected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              )}
            >
              {connectionLabel}
            </div>
          </div>

          <div className="mt-5 rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.88),_rgba(255,255,255,1))] p-5">
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="flex shrink-0 justify-center sm:block">
                {profilePictureUrl && !metaImageBroken ? (
                  <img
                    src={profilePictureUrl}
                    alt="WhatsApp business profile"
                    className="h-28 w-28 rounded-[26px] border border-slate-200 object-cover shadow-md"
                    onError={() => setMetaImageBroken(true)}
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-[26px] border border-dashed border-emerald-200 bg-emerald-50 text-3xl font-black text-emerald-700 shadow-sm">
                    {businessInitials}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <div className="text-xl font-black text-slate-900">{metaConnection?.verifiedName || metaConnection?.wabaName || workspaceName}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-500">
                    {businessProfile.about || "Add a business about line to make your WhatsApp profile feel complete."}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                    {metaConnection?.displayPhoneNumber || "No live phone yet"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                    {businessProfile.vertical || "Category pending"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                    {metaConnection?.qualityRating || "Quality not available"}
                  </span>
                </div>
                <div className="rounded-[16px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">
                  To change the WhatsApp profile photo: click <span className="font-black">Edit WhatsApp profile</span>, upload image, then click <span className="font-black">Save Changes</span>. Upload alone is not enough until Meta save is completed.
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1 justify-center border-0 bg-[linear-gradient(135deg,_#059669,_#10b981)] font-bold text-white hover:brightness-105"
                onClick={() => setWhatsAppProfileOpen(true)}
                disabled={!isWhatsAppConnected}
              >
                <Camera size={14} />
                Edit WhatsApp profile
              </Button>
              <Button
                variant="outline"
                className="flex-1 justify-center border-slate-200 bg-white font-bold hover:border-emerald-200 hover:bg-emerald-50/50"
                onClick={() => void refreshWhatsAppProfile()}
                disabled={metaRefreshing || !isWhatsAppConnected}
              >
                <RefreshCw size={14} className={cn(metaRefreshing && "animate-spin")} />
                {metaRefreshing ? "Refreshing..." : "Refresh from Meta"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 justify-center border-slate-200 bg-white font-bold hover:border-emerald-200 hover:bg-emerald-50/50"
                onClick={() => navigate("/app/meta")}
              >
                <ArrowUpRight size={14} />
                Open setup
              </Button>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border border-white/80 bg-white/95 p-5 shadow-[0_24px_64px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Live business details</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">What Meta currently has</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                These values come from your connected WhatsApp Business profile and are used across previews, branding, and customer trust surfaces.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
              {metaLoading ? "Loading" : "Synced view"}
            </div>
          </div>

          {metaLoading ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-[16px] border border-slate-200 bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <ProfileInfoTile label="Description" value={businessProfile.description || "Not available yet"} className="md:col-span-2" multiline />
              <ProfileInfoTile label="Business email" value={businessProfile.email || "Not available yet"} />
              <ProfileInfoTile label="Websites" value={websitesLabel} />
              <ProfileInfoTile label="Address" value={businessProfile.address || "Not available yet"} className="md:col-span-2" multiline />
              <ProfileInfoTile label="Vertical" value={businessProfile.vertical || "Not available yet"} icon={<Globe size={13} className="text-slate-400" />} />
              <ProfileInfoTile label="Meta connection status" value={metaConnection?.connectionStatus || "Not available yet"} />
            </div>
          )}

          {!isWhatsAppConnected ? (
            <div className="mt-5 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
              WhatsApp is not connected right now. Connect your WABA first from <span className="font-black">WhatsApp Setup</span>, then this page will let you update the live business profile and profile photo.
            </div>
          ) : null}
        </Card>
      </section>

      <EditProfileModal
        open={editModalOpen}
        onClose={closeEditModal}
        editForm={editForm}
        setEditForm={setEditForm}
        profileOtp={profileOtp}
        setProfileOtp={setProfileOtp}
        profileOtpBusy={profileOtpBusy}
        profileOtpPurpose={profileOtpPurpose}
        otpSent={otpSent}
        onRequestOtp={requestOtp}
        onVerifyOtp={verifyOtp}
        onSave={handleSaveProfile}
        editBusy={editBusy}
      />

      <WhatsAppManagerProfileModal
        open={whatsAppProfileOpen}
        onClose={() => setWhatsAppProfileOpen(false)}
        businessProfile={businessProfile}
        onSaved={() => {
          setWhatsAppProfileOpen(false);
          void loadMetaConnection(true);
        }}
      />
    </div>
  );
}

function ProfileMetric({
  label,
  value,
  tone = "slate",
  compactCopy = false,
  copied = false,
  onCopy,
}: {
  label: string;
  value: string;
  tone?: "slate" | "emerald" | "amber";
  compactCopy?: boolean;
  copied?: boolean;
  onCopy?: () => void;
}) {
  const valueToneClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-slate-700";

  return (
    <div className="rounded-[16px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.88),_rgba(255,255,255,1))] px-4 py-3">
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 flex items-center gap-2">
        <div className={cn("text-sm font-bold leading-6", valueToneClass)}>
          {value}
        </div>
        {compactCopy && onCopy ? (
          <button type="button" onClick={onCopy} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title={copied ? "Copied" : "Copy"}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ProfileInfoTile({
  label,
  value,
  icon,
  className,
  multiline = false,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  className?: string;
  multiline?: boolean;
}) {
  return (
    <div className={cn("rounded-[16px] border border-slate-200 bg-white px-4 py-3 shadow-sm", className)}>
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {icon}
        {label}
      </div>
      <div className={cn("mt-2 text-sm font-semibold text-slate-700", multiline ? "leading-6" : "line-clamp-3 leading-6")}>{value}</div>
    </div>
  );
}
