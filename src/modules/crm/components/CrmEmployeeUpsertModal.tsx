import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Save, UserPlus } from "lucide-react";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Alert } from "@components/ui/Alert";

type EmployeeLite = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  maxActiveLeads?: number | null;
};

export function CrmEmployeeUpsertModal({
  open,
  onClose,
  employee,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  employee: EmployeeLite | null;
  onSaved?: () => void;
}) {
  const isEdit = !!employee?.id;
  const title = isEdit ? "Edit Employee" : "New Employee";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"employee" | "team_leader">("employee");
  const [maxActiveLeads, setMaxActiveLeads] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
    setName(String(employee?.name || ""));
    setEmail(String(employee?.email || ""));
    setRole((String(employee?.role || "employee") as any) || "employee");
    setMaxActiveLeads(employee?.maxActiveLeads == null ? "" : String(employee.maxActiveLeads || 0));
  }, [open, employee]);

  const canSave = useMemo(() => {
    if (busy) return false;
    if (!open) return false;
    const nextEmail = String(email || "").trim().toLowerCase();
    if (!nextEmail) return false;
    return true;
  }, [busy, email, open]);

  async function save() {
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        email: String(email || "").trim().toLowerCase(),
        name: String(name || ""),
        role,
        maxActiveLeads: maxActiveLeads === "" ? null : Number(maxActiveLeads || 0),
      };

      if (isEdit) await API.crm.updateEmployeeProfile(String(employee!.id), payload);
      else await API.crm.createEmployee(payload);

      onClose();
      onSaved?.();
    } catch (e: any) {
      setError(e?.response?.data?.message || (isEdit ? "Failed to update employee" : "Failed to create employee"));
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[999] overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="mx-auto my-20 w-full max-w-2xl bg-white rounded-[5px] shadow-2xl border border-slate-100 overflow-hidden"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">{title}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {isEdit ? "Update details" : "Create employee inbox access"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-[5px] transition-colors text-slate-400 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {error ? <Alert variant="danger">{error}</Alert> : null}

              <div className="mt-2 rounded-[5px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Info</div>
                <div className="mt-1 text-sm font-bold text-slate-700">
                  Employee login is workspace-scoped. Use a real email (password/reset links are sent on email).
                </div>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Employee name"
                  disabled={busy}
                />
                <Input
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@company.com"
                  disabled={busy}
                />
                <div className="sm:col-span-2">
                  <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as any)} disabled={busy}>
                    <option value="employee">employee</option>
                    <option value="team_leader">team_leader</option>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Max Active Leads"
                    value={maxActiveLeads}
                    onChange={(e) => setMaxActiveLeads(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="Blank = unlimited"
                    disabled={busy}
                  />
                  <div className="mt-1 text-[11px] font-semibold text-slate-500">
                    Used by FIXED_LIMIT routing. Leave blank for no per-agent cap.
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-end gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button variant="outline" onClick={onClose} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={() => void save()} disabled={!canSave} className="min-w-[140px] gap-2">
                  {busy ? (
                    "Saving..."
                  ) : isEdit ? (
                    <>
                      <Save size={16} /> Save Changes
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} /> Create Employee
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
