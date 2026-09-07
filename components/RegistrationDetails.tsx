"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateRegistrationDetails } from "@/app/actions/profile";
import { DEPARTMENTS, YEARS } from "@/types";

/**
 * The details that appear on nearly every college registration form. Collected
 * once here so the agent can fill them every time.
 */
export function RegistrationDetails({
  fullName,
  phone,
  registrationNumber,
  section,
  department,
  year,
}: {
  fullName: string | null;
  phone: string | null;
  registrationNumber: string | null;
  section: string | null;
  department: string | null;
  year: number | null;
}) {
  const [state, formAction] = useFormState(updateRegistrationDetails, {});
  const missing = !phone || !registrationNumber;

  return (
    <form action={formAction}>
      <p className="text-[12.5px] leading-relaxed text-ink-soft">
        Used by the registration agent to fill forms for you.
        {missing ? (
          <span className="ml-1 font-semibold text-alert-ink">
            Fill these in so forms can be completed automatically.
          </span>
        ) : null}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Text
            name="full_name"
            label="Name as it should appear on forms"
            defaultValue={fullName}
            placeholder="Antony Thomas Sharone A"
          />
        </div>

        <Select name="department" label="Department" defaultValue={department}>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>

        <Select
          name="year"
          label="Year"
          defaultValue={year ? String(year) : null}
        >
          {YEARS.map((y) => (
            <option key={y} value={String(y)}>
              Year {y}
            </option>
          ))}
        </Select>

        <Text
          name="registration_number"
          label="Registration number"
          defaultValue={registrationNumber}
          placeholder="312422243001"
        />
        <Text
          name="phone"
          label="Phone"
          defaultValue={phone}
          placeholder="9876543210"
        />
        <Text
          name="section"
          label="Section"
          defaultValue={section}
          placeholder="A"
        />
      </div>

      {state.error ? (
        <p className="mt-3 text-[12px] font-medium text-alert-ink">
          {state.error}
        </p>
      ) : null}
      {state.saved ? (
        <p className="mt-3 text-[12px] font-medium text-mint-ink">Saved.</p>
      ) : null}

      <Save />
    </form>
  );
}

function Text({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue: string | null;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-ink">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-soft border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-muted focus:border-ink-muted"
      />
    </label>
  );
}

function Select({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  defaultValue: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-ink">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1.5 w-full rounded-soft border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-muted"
      >
        <option value="">Choose…</option>
        {children}
      </select>
    </label>
  );
}

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-3.5 rounded-full border border-line bg-white px-5 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:border-ink-muted disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save details"}
    </button>
  );
}
