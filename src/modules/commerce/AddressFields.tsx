import { Input } from "@components/ui/Input";
import type { Address } from "./types";
import LocationPicker from "./LocationPicker";
export const emptyAddress: Address = { name: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "IN" };
export default function AddressFields({ value, onChange, disabled = false, locationRequired = false }: { value: Address; onChange: (value: Address) => void; disabled?: boolean; locationRequired?: boolean }) {
  return <fieldset disabled={disabled} className="grid gap-3 sm:grid-cols-2"><legend className="mb-3 text-sm font-semibold">Delivery address · India</legend>
    {([ ["name", "Recipient name", 150], ["phone", "Phone with country code", 15], ["line1", "Address", 200], ["line2", "Address line 2 (optional)", 200], ["city", "City", 100], ["state", "State", 100], ["postalCode", "Postal code", 6] ] as const).map(([key, label, max]) =>
      <Input key={key} label={label} value={value[key] || ""} maxLength={max} required={key !== "line2"} pattern={key === "phone" ? "[1-9][0-9]{7,14}" : key === "postalCode" ? "[1-9][0-9]{5}" : undefined}
        onChange={(e) => onChange({ ...value, [key]: e.target.value })} />)}
    {locationRequired && <LocationPicker value={value.location} onChange={(location) => onChange({ ...value, location })} />}
  </fieldset>;
}
