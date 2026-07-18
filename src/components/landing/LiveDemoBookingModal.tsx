import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { Modal } from "@components/ui/Modal";
import { useToast } from "@shared/providers/ToastContext";
import { cn } from "@shared/utils/cn";

type SlotState = {
  slot: string;
  available: boolean;
  booked: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const initialForm = {
  name: "",
  email: "",
  phone: "",
  platform: "Google Meet",
  date: todayIsoDate(),
  slot: "",
  notes: "",
};

export function LiveDemoBookingModal({ open, onClose }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const visibleSlots = useMemo(
    () => slots.filter((slot) => slot.available || slot.booked),
    [slots]
  );

  useEffect(() => {
    if (!open || !form.date) return;
    let active = true;
    setLoadingSlots(true);
    API.liveDemo
      .slots({ date: form.date })
      .then((res: any) => {
        if (!active) return;
        const nextSlots = Array.isArray(res?.slots) ? res.slots : [];
        setSlots(nextSlots);
        if (form.slot && !nextSlots.some((slot: SlotState) => slot.slot === form.slot && slot.available)) {
          setForm((prev) => ({ ...prev, slot: "" }));
        }
      })
      .catch((err: any) => {
        if (active) {
          setSlots([]);
          toast(err?.userMessage || "Could not load demo slots.", "error");
        }
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [form.date, form.slot, open, toast]);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.phone.trim()) return "Phone is required.";
    if (!form.date) return "Date is required.";
    if (!form.slot) return "Please select an available time slot.";
    if (form.notes.trim().length < 20) return "Notes must be at least 20 characters.";
    return "";
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const error = validate();
    if (error) {
      toast(error, "error");
      return;
    }
    setSubmitting(true);
    try {
      await API.liveDemo.create(form);
      toast("Live demo enquiry submitted.", "success");
      setForm({ ...initialForm, date: todayIsoDate() });
      onClose();
    } catch (err: any) {
      toast(err?.userMessage || err?.response?.data?.message || "Could not submit demo enquiry.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Book Live Demo" className="max-w-3xl">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Full Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          <Input label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
          <Select label="Platform" value={form.platform} onChange={(e) => update("platform", e.target.value)}>
            <option value="Google Meet">Google Meet</option>
            <option value="Zoom">Zoom</option>
          </Select>
          <Input label="Date" type="date" min={todayIsoDate()} value={form.date} onChange={(e) => update("date", e.target.value)} required />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Time Slot</label>
            <span className="text-[11px] font-semibold text-slate-400">
              {loadingSlots ? "Loading slots..." : "Available or booked slots only"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {visibleSlots.map((slot) => (
              <button
                key={slot.slot}
                type="button"
                disabled={!slot.available}
                onClick={() => update("slot", slot.slot)}
                className={cn(
                  "rounded-[5px] border px-3 py-2 text-left text-xs font-black transition-all",
                  slot.slot === form.slot
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50/40",
                  slot.booked && "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400 hover:bg-slate-100"
                )}
              >
                <span className="block">{slot.slot}</span>
                <span className="mt-1 block text-[9px] uppercase tracking-widest">
                  {slot.booked ? "Booked" : "Available"}
                </span>
              </button>
            ))}
            {!loadingSlots && !visibleSlots.length ? (
              <div className="col-span-full rounded-[5px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                No available slots for this date.
              </div>
            ) : null}
          </div>
        </div>

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Tell us what you want to discuss in the live demo."
          rows={5}
          required
        />
        <p className="text-[11px] font-semibold text-slate-400">
          Notes are required and must be at least 20 characters.
        </p>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || loadingSlots}>
            {submitting ? "Submitting..." : "Save Demo Enquiry"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
