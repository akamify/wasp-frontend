import { useEffect, useMemo, useState } from "react";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Select } from "@components/ui/Select";
import { Input } from "@components/ui/Input";
import { Alert } from "@components/ui/Alert";

type Employee = {
  id: string;
  name: string;
  email: string;
  status: string;
};

export function AssignLeadModal({
  open,
  onClose,
  phone,
  phones,
  employees,
  onAssign,
}: {
  open: boolean;
  onClose: () => void;
  phone: string;
  phones?: string[];
  employees: Employee[];
  onAssign: (employeeId: string, reason: string) => Promise<void>;
}) {
  const activeEmployees = useMemo(
    () => (employees || []).filter((e) => String(e.status || "").toUpperCase() === "ACTIVE"),
    [employees]
  );
  const [employeeId, setEmployeeId] = useState("");
  const [reason, setReason] = useState("manual_assign");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setReason("manual_assign");
    setEmployeeId(activeEmployees[0]?.id || "");
  }, [open, activeEmployees]);

  async function submit() {
    if (!employeeId) return;
    setBusy(true);
    setError(null);
    try {
      await onAssign(employeeId, reason);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to assign");
    } finally {
      setBusy(false);
    }
  }

  const selectedPhones = Array.isArray(phones) ? phones.filter(Boolean) : [];
  const title = selectedPhones.length
    ? `Assign leads (${selectedPhones.length})`
    : `Assign lead: ${phone}`;

  return (
    <Modal isOpen={open} onClose={onClose} title={title} className="max-w-[620px]">
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="grid gap-3">
        {selectedPhones.length ? (
          <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3 text-[12px] font-semibold text-slate-700">
            {selectedPhones.length} leads selected
          </div>
        ) : null}

        <Select
          label="Employee"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          disabled={busy}
        >
          {activeEmployees.length ? null : <option value="">No active employees</option>}
          {activeEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {(e.name || e.email || e.id).slice(0, 60)}
            </option>
          ))}
        </Select>

        <Input label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} />

        <div className="flex items-center gap-2">
          <Button onClick={() => void submit()} disabled={busy || !employeeId || !activeEmployees.length}>
            {busy ? "Assigning..." : "Assign"}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
