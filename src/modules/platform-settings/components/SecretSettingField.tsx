import { useState } from "react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { useToast } from "@shared/providers/ToastContext";
import { platformSettingsService } from "@modules/platform-settings/services/platformSettings.service";
import { runtimeEffectLabel, sourceBadgeClass } from "@modules/platform-settings/utils/settingFormatters";
import type { PlatformSettingItem } from "@modules/platform-settings/types/platformSettings.types";

type Props = {
  item: PlatformSettingItem;
  onChanged: () => Promise<void>;
};

export function SecretSettingField({ item, onChanged }: Props) {
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await platformSettingsService.updateOne(item.key, {
        value: draft,
        confirmReplaceSecret: true,
      });
      toast("Secret replaced", "success");
      setDraft("");
      setConfirm(false);
      await onChanged();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to replace secret", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[5px] border border-slate-200 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="text-xs font-black text-slate-900">{item.key}</div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-black ${sourceBadgeClass(item.source)}`}>{item.source.toUpperCase()}</span>
        <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black text-blue-700">{runtimeEffectLabel(item.runtimeEffect)}</span>
      </div>
      <Input value={String(item.value || "")} readOnly />
      <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Enter new secret value" />
        <Button onClick={() => setConfirm(true)} disabled={!draft.trim() || saving}>Replace</Button>
      </div>
      <Modal isOpen={confirm} onClose={() => setConfirm(false)} title="Confirm Secret Replacement" className="max-w-lg">
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Secret value will be replaced for <span className="font-black text-slate-900">{item.key}</span>. Continue?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Confirm Replace"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
