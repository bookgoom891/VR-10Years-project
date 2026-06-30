import { useEffect, useState } from "react";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  suffix?: string;
  disabled?: boolean;
}

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  step?: number;
  min?: number;
  disabled?: boolean;
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function roundToTwo(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function parseNumberInput(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNumberInput(value: number) {
  return String(roundToTwo(value));
}

export function NumericInput({
  value,
  onChange,
  className,
  step = 0.01,
  min,
  disabled = false
}: NumericInputProps) {
  const [draft, setDraft] = useState(() => formatNumberInput(value));

  useEffect(() => {
    setDraft(formatNumberInput(value));
  }, [value]);

  function commit(rawValue: string) {
    const rounded = rawValue.trim() === "" ? 0 : roundToTwo(parseNumberInput(rawValue));
    setDraft(formatNumberInput(rounded));
    onChange(rounded);
  }

  function updateDraft(rawValue: string) {
    if (/^-?\d*\.?\d*$/.test(rawValue)) setDraft(rawValue);
  }

  return (
    <input
      className={className}
      type="text"
      inputMode="decimal"
      value={draft}
      min={min}
      step={step}
      disabled={disabled}
      onChange={(event) => updateDraft(event.target.value)}
      onBlur={(event) => commit(event.target.value)}
    />
  );
}

export function NumberField({
  label,
  value,
  onChange,
  step = 0.01,
  min,
  suffix,
  disabled = false
}: NumberFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <NumericInput
          value={value}
          min={min}
          step={step}
          disabled={disabled}
          onChange={onChange}
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
  return `$${roundToTwo(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function price(value: number) {
  return `$${roundToTwo(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function shares(value: number) {
  return roundToTwo(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

export function percent(value: number) {
  return `${roundToTwo(value * 100).toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}%`;
}

export function krw(value: number) {
  return `₩${Math.round(value).toLocaleString("ko-KR")}`;
}
