import { Input } from "@components/ui/Input";

interface CsvFieldProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  hint?: string;
}

export function CsvField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: Readonly<CsvFieldProps>) {
  return (
    <Input
      label={label}
      value={value.join(", ")}
      onChange={(event) =>
        onChange(
          event.target.value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      }
      placeholder={placeholder}
      hint={hint}
    />
  );
}
