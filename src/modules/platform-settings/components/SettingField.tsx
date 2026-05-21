import { useState } from "react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { useToast } from "@shared/providers/ToastContext";
import { platformSettingsService } from "@modules/platform-settings/services/platformSettings.service";
import { runtimeEffectLabel, sourceBadgeClass, settingInputValue } from "@modules/platform-settings/utils/settingFormatters";
import type { PlatformSettingItem } from "@modules/platform-settings/types/platformSettings.types";
import { API } from "@api/api";

type Props = {
  item: PlatformSettingItem;
  onChanged: () => Promise<void>;
};

export function SettingField({ item, onChanged }: Props) {
  const { toast } = useToast();
  const [value, setValue] = useState(settingInputValue(item.value));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isBrandLogo = item.key === "APP_BRAND_LOGO_URL";

  async function save() {
    setSaving(true);
    try {
      const nextValue =
        item.valueType === "number" ? Number(value) : item.valueType === "boolean" ? value : value;
      await platformSettingsService.updateOne(item.key, { value: nextValue });
      toast("Setting saved", "success");
      await onChanged();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to save setting", "error");
    } finally {
      setSaving(false);
    }
  }

  async function uploadBrandLogo(file?: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const res: any = await API.admin.platformBrandUploadLogo(file);
      const logoUrl = String(res?.logoUrl || "").trim();
      if (!logoUrl) throw new Error("Invalid upload response");
      setValue(logoUrl);
      await platformSettingsService.updateOne(item.key, { value: logoUrl });
      toast("Logo uploaded", "success");
      await onChanged();
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Failed to upload logo", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-[5px] border border-slate-200 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="text-xs font-black text-slate-900">{item.key}</div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-black ${sourceBadgeClass(item.source)}`}>{item.source.toUpperCase()}</span>
        <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black text-blue-700">{runtimeEffectLabel(item.runtimeEffect)}</span>
      </div>
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <div className="mt-2 flex flex-wrap justify-end gap-2">
        {isBrandLogo ? (
          <label htmlFor={`platform-brand-logo-${item.key}`}>
            <input
              id={`platform-brand-logo-${item.key}`}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => uploadBrandLogo(e.target.files?.[0] || null)}
            />
            <span className="inline-flex h-[42px] cursor-pointer items-center rounded-[5px] border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
              {uploading ? "Uploading..." : "Upload Logo"}
            </span>
          </label>
        ) : null}
        <Button onClick={save} disabled={saving || uploading}>{saving ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  );
}
