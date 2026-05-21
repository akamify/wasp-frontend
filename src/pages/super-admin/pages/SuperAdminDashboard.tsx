import { Link } from "react-router-dom";
import { ShieldCheck, Users, UserCircle2 } from "lucide-react";

const cards = [
  { title: "Admin Management", desc: "Create and manage admins with strict role rules.", to: "/super-admin/admins", icon: Users },
  { title: "Root Profile", desc: "Manage super admin profile and security controls.", to: "/super-admin/profile", icon: UserCircle2 },
];

export default function SuperAdminDashboardPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-[5px] border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-slate-900">
          <ShieldCheck className="size-5 text-brand-600" />
          <h1 className="text-lg font-black">Super Admin Dashboard</h1>
        </div>
        <p className="mt-1 text-sm text-slate-600">Dedicated root control area. Admin and super admin flows stay separate.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.to} to={card.to} className="rounded-[5px] border border-slate-200 bg-white p-5 transition hover:border-brand-200 hover:bg-brand-50/30">
              <Icon className="size-5 text-brand-600" />
              <div className="mt-3 text-sm font-black text-slate-900">{card.title}</div>
              <div className="mt-1 text-sm text-slate-600">{card.desc}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
