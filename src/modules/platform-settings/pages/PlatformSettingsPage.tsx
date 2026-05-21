import { useMemo, useState } from "react";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { Button } from "@components/ui/Button";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { usePlatformSettings } from "@modules/platform-settings/hooks/usePlatformSettings";
import { usePlatformAddons } from "@modules/platform-settings/hooks/usePlatformAddons";
import { SettingField } from "@modules/platform-settings/components/SettingField";
import { SecretSettingField } from "@modules/platform-settings/components/SecretSettingField";
import { PlatformAddonsPanel } from "@modules/platform-settings/components/PlatformAddonsPanel";
import { SettingsTestPanel } from "@modules/platform-settings/components/SettingsTestPanel";

export default function PlatformSettingsPage() {
  const [tab, setTab] = useState<"settings" | "addons">("settings");
  const settings = usePlatformSettings();
  const addons = usePlatformAddons();

  const groupedSettings = useMemo(() => Object.entries(settings.byCategory), [settings.byCategory]);

  return (
    <div className="flex flex-col gap-4 p-6">
      <AdminToolbar
        title="Platform Settings"
        subtitle="Super-admin controlled platform configuration with DB-first and ENV fallback behavior."
        onRefresh={() => {
          void settings.refresh();
          void addons.refresh();
        }}
        right={
          <div className="flex gap-2">
            <Button variant={tab === "settings" ? "primary" : "outline"} onClick={() => setTab("settings")}>Settings</Button>
            <Button variant={tab === "addons" ? "primary" : "outline"} onClick={() => setTab("addons")}>Add-ons</Button>
          </div>
        }
      />

      {tab === "settings" ? (
        <div className="space-y-4">
          <SettingsTestPanel />
          {settings.loading ? (
            <TableSkeleton rows={8} cols={2} />
          ) : (
            groupedSettings.map(([category, items]) => (
              <div key={category} className="rounded-[5px] border border-slate-200 bg-white p-4">
                <div className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">{category.replace(/_/g, " ")}</div>
                <div className="space-y-2">
                  {items.map((item) =>
                    item.valueType === "secret" ? (
                      <SecretSettingField key={item.key} item={item} onChanged={settings.refresh} />
                    ) : (
                      <SettingField key={item.key} item={item} onChanged={settings.refresh} />
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : addons.loading ? (
        <TableSkeleton rows={8} cols={2} />
      ) : (
        <PlatformAddonsPanel items={addons.items} onChanged={addons.refresh} />
      )}
    </div>
  );
}
