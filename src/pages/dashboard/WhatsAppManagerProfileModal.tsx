import { useEffect, useMemo, useState } from "react";
import { X, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../../api/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { Alert } from "../../components/ui/Alert";

const VERTICAL_OPTIONS = [
  "AUTO",
  "BEAUTY",
  "CLOTHING",
  "EDU",
  "ENTERTAIN",
  "EVENT_PLAN",
  "FINANCE",
  "GROCERY",
  "HEALTH",
  "HOTEL",
  "NONPROFIT",
  "PROF_SERVICES",
  "RETAIL",
  "TRAVEL",
  "OTHER",
];

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function WhatsAppManagerProfileModal({
  open,
  onClose,
  businessProfile,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  businessProfile: any;
  onSaved?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [about, setAbout] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [vertical, setVertical] = useState("");
  const [websites, setWebsites] = useState<string[]>([""]);

  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const [profilePictureHandle, setProfilePictureHandle] = useState<string>("");
  const [uploadBusy, setUploadBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setOk(null);
    setAbout(businessProfile?.about || "");
    setDescription(businessProfile?.description || "");
    setAddress(businessProfile?.address || "");
    setEmail(businessProfile?.email || "");
    setVertical(businessProfile?.vertical || "OTHER");
    const ws = Array.isArray(businessProfile?.websites) ? businessProfile.websites : [];
    setWebsites(ws.length ? ws : [""]);
    setProfilePictureUrl(businessProfile?.profile_picture_url || "");
    setProfilePictureHandle("");
  }, [open, businessProfile]);

  const normalizedWebsites = useMemo(
    () => websites.map((w) => String(w || "").trim()).filter(Boolean),
    [websites]
  );

  const websitesError = useMemo(() => {
    for (const w of normalizedWebsites) {
      if (!isValidHttpUrl(w)) return "Websites must be valid http/https URLs.";
    }
    if (normalizedWebsites.length > 2) return "You can add up to 2 websites.";
    return null;
  }, [normalizedWebsites]);

  const verticalOptions = useMemo(() => {
    const current = String(vertical || "").trim();
    const all = new Set(VERTICAL_OPTIONS);
    if (current && !all.has(current)) {
      return [current, ...VERTICAL_OPTIONS];
    }
    return VERTICAL_OPTIONS;
  }, [vertical]);

  async function onPickImage(file: File) {
    setErr(null);
    setOk(null);
    setUploadBusy(true);
    try {
      const res = await API.meta.uploadProfilePicture(file);
      setProfilePictureHandle(res.handle);
      setOk("Profile picture uploaded. Click Save to apply it.");
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Upload failed");
    } finally {
      setUploadBusy(false);
    }
  }

  async function save() {
    setErr(null);
    setOk(null);
    if (websitesError) {
      setErr(websitesError);
      return;
    }
    setBusy(true);
    try {
      await API.meta.updateProfile({
        about,
        description,
        address,
        email,
        websites: normalizedWebsites,
        vertical,
        profilePictureHandle: profilePictureHandle || undefined,
      });
      setOk("WhatsApp manager profile updated.");
      onSaved?.();
      setTimeout(() => setOk(null), 2500);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="mx-auto my-6 flex w-full max-w-2xl flex-col overflow-hidden rounded-[5px] bg-white shadow-none ring-1 ring-ink-900/10"
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
          >
            <div className="flex items-center justify-between border-b border-ink-900/10 px-5 py-4">
              <div>
                <div className="text-lg font-black tracking-tight">Edit Business Profile</div>
              </div>
              <button
                onClick={onClose}
                className="rounded-[5px] p-2 text-ink-900/60 hover:bg-ink-900/5 hover:text-ink-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-ink-800/80">Profile picture</div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[5px] bg-white px-3 py-2 text-xs font-bold text-ink-900 ring-1 ring-ink-900/12 hover:bg-ink-900/5">
                      <Upload size={14} />
                      {uploadBusy ? "Uploading..." : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) onPickImage(f);
                        }}
                        disabled={uploadBusy}
                      />
                    </label>
                  </div>

                  <div className="mt-3 flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-[5px] bg-ink-900/5 ring-1 ring-ink-900/10">
                      {profilePictureUrl ? (
                        <img
                          src={profilePictureUrl}
                          alt="profile"
                          className="h-full w-full object-cover"
                          onError={() => setProfilePictureUrl("")}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-ink-900/40">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-ink-800/70">
                      {profilePictureHandle ? (
                        <div>
                          Uploaded handle: <span className="font-mono">{profilePictureHandle}</span>
                        </div>
                      ) : (
                        <div>Upload an image to get a handle, then Save to apply.</div>
                      )}
                    </div>
                  </div>
                </div>
                <Textarea
                  label="About"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Short about line"
                  className="min-h-[84px]"
                />
                <Textarea
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your business"
                  className="min-h-[84px]"
                />

                <Textarea
                  label="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Business address"
                  className="min-h-[84px]"
                />
                <div className="grid gap-4">
                  <Input
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="support@example.com"
                  />
                  <Select label="Vertical" value={vertical} onChange={(e) => setVertical(e.target.value)}>
                    {verticalOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <div className="mb-1 text-xs font-semibold text-ink-800/80">Websites (max 2)</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[0, 1].map((idx) => (
                      <Input
                        key={idx}
                        value={websites[idx] || ""}
                        onChange={(e) => {
                          const next = [...websites];
                          next[idx] = e.target.value;
                          setWebsites(next);
                        }}
                        placeholder={idx === 0 ? "https://example.com" : "https://example.org"}
                      />
                    ))}
                  </div>
                  {websitesError ? <div className="mt-2 text-xs font-semibold text-red-700">{websitesError}</div> : null}
                </div>
              </div>
            </div>

            <div className="border-t border-ink-900/10 px-5 py-4">
              {err ? (
                <div className="mb-3">
                  <Alert tone="error">{err}</Alert>
                </div>
              ) : null}
              {ok ? (
                <div className="mb-3">
                  <Alert tone="success">{ok}</Alert>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={onClose} disabled={busy}>
                  Close
                </Button>
                <Button onClick={save} disabled={busy || !!websitesError}>
                  {busy ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
