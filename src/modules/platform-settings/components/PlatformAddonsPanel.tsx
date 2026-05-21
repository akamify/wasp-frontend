import { useMemo, useState } from "react";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { useToast } from "@shared/providers/ToastContext";
import { platformAddonsService } from "@modules/platform-settings/services/platformAddons.service";
import { addonStatusLabel, isHighImpactAddon } from "@modules/platform-settings/utils/addonFormatters";
import { PlatformAddonToggle } from "@modules/platform-settings/components/PlatformAddonToggle";
import type { PlatformAddonItem } from "@modules/platform-settings/types/platformSettings.types";

type Props = {
  items: PlatformAddonItem[];
  onChanged: () => Promise<void>;
};

export function PlatformAddonsPanel({ items, onChanged }: Props) {
  const { toast } = useToast();
  const [busyKey, setBusyKey] = useState("");
  const [confirm, setConfirm] = useState<{ key: string; enabled: boolean; label: string } | null>(null);

  const grouped = useMemo(() => {
    const out: Record<string, PlatformAddonItem[]> = {};
    for (const item of items) {
      out[item.category] = out[item.category] || [];
      out[item.category].push(item);
    }
    return Object.entries(out);
  }, [items]);

  async function updateAddon(key: string, enabled: boolean) {
    setBusyKey(key);
    try {
      await platformAddonsService.updateOne(key, enabled);
      toast("Add-on updated", "success");
      await onChanged();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to update add-on", "error");
    } finally {
      setBusyKey("");
    }
  }

  function onToggle(item: PlatformAddonItem, nextEnabled: boolean) {
    if (!nextEnabled && isHighImpactAddon(item.key)) {
      setConfirm({ key: item.key, enabled: nextEnabled, label: item.label });
      return;
    }
    void updateAddon(item.key, nextEnabled);
  }

  return (
    <div className="space-y-4">
      {grouped.map(([category, list]) => (
        <div key={category} className="rounded-[5px] border border-slate-200 bg-white p-4">
          <div className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">{category.replace(/_/g, " ")}</div>
          <div className="space-y-2">
            {list.map((item) => (
              <div key={item.key} className="flex flex-wrap items-center justify-between gap-3 rounded-[5px] border border-slate-200 p-3">
                <div className="min-w-[280px] flex-1">
                  <div className="text-sm font-black text-slate-900">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.description || "-"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-black ${item.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {addonStatusLabel(item.enabled)}
                  </span>
                  <PlatformAddonToggle enabled={item.enabled} busy={busyKey === item.key} onToggle={(next) => onToggle(item, next)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Modal isOpen={!!confirm} onClose={() => setConfirm(null)} title="Confirm Add-on Disable" className="max-w-lg">
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            You are disabling a high-impact add-on: <span className="font-black text-slate-900">{confirm?.label}</span>. Continue?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!confirm) return;
                const target = confirm;
                setConfirm(null);
                await updateAddon(target.key, target.enabled);
              }}
            >
              Confirm Disable
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
