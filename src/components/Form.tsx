import { ComponentProps } from "react";

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: ComponentProps<"input">["type"];
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-[#666]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full border border-[#1a1a1a] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-[#666]">
        {label}
      </span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="mt-1 w-full border border-[#1a1a1a] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
      />
    </label>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-[#666]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full border border-[#1a1a1a] px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SubmitButton({
  children = "Save",
  variant = "primary",
}: {
  children?: React.ReactNode;
  variant?: "primary" | "danger" | "ghost";
}) {
  const classes =
    variant === "primary"
      ? "bg-[#1a1a1a] text-white hover:opacity-90"
      : variant === "danger"
        ? "border border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
        : "text-[#666] hover:text-[#1a1a1a] hover:underline";
  return (
    <button
      type="submit"
      className={`px-4 py-2 text-xs uppercase tracking-wider ${classes}`}
    >
      {children}
    </button>
  );
}
