type Tab = { id: string; label: string };

export function SettingsCategoryTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-[5px] px-3 py-2 text-xs font-black uppercase tracking-wider ${
            active === tab.id ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
