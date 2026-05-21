import { Button } from "@components/ui/Button";

export function SettingsSaveBar({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="sticky bottom-0 z-20 mt-3 flex justify-end rounded-[5px] border border-slate-200 bg-white p-3 shadow">
      <Button onClick={onRefresh}>Refresh</Button>
    </div>
  );
}
