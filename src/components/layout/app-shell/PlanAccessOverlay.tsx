export function PlanAccessOverlay({ show, requiredPlan, featureNeedsPro, navigate }: { show: boolean; requiredPlan: string | null; featureNeedsPro: boolean; navigate: (to: string) => void; }) {
  if (!show) return null;
  const upgradeToPro = requiredPlan === "pro" || featureNeedsPro;
  return (
    <>
      <div className="fixed inset-0 z-[350] bg-white/35 backdrop-blur-[1px]" />
      <div className="fixed inset-0 z-[351] cursor-not-allowed" />
      <div className="fixed inset-0 z-[360] flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-[5px] border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="text-[11px] font-black uppercase tracking-widest text-brand-600">Access Restricted</div>
          <h3 className="mt-2 text-2xl font-black text-slate-900">{upgradeToPro ? "Upgrade to Pro to access this page" : "Buy Basic Plan to continue"}</h3>
          <p className="mt-2 text-sm font-semibold text-slate-600">{upgradeToPro ? "This module is available on Pro plan. Upgrade to unlock this feature." : "This module is available on paid plans. You can preview the UI, but actions are locked until you buy a plan."}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="rounded-[5px] bg-brand-600 px-4 py-2 text-sm font-black text-white hover:bg-brand-700 transition-colors" onClick={() => navigate("/app/plan")}>{upgradeToPro ? "Upgrade to Pro" : "Buy Basic Plan"}</button>
            <button type="button" className="rounded-[5px] border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => navigate("/app/meta")}>Go to WhatsApp Setup</button>
          </div>
        </div>
      </div>
    </>
  );
}

