import type { ChangeEvent } from "react";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  suffix?: string;
  disabled?: boolean;
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  suffix,
  disabled = false
}: NumberFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(Number(event.target.value));
  }

  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          disabled={disabled}
          onChange={handleChange}
        />
        {suffix && <em>{suffix}</em>}
      </div>
    </label>
  );
}

export function TextField({ label, value, onChange, disabled = false }: TextFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function money(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function price(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function shares(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

export function percent(value: number) {
  return `${(value * 100).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}%`;
}

export function krw(value: number) {
  return `₩${Math.round(value).toLocaleString("ko-KR")}`;
}
