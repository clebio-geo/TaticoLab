import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  min?: number;
  step?: string;
  required?: boolean;
};

export function FormField({
  label,
  name,
  type = "text",
  defaultValue,
  min,
  step,
  required,
}: FormFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} min={min} step={step} required={required} />
    </div>
  );
}
