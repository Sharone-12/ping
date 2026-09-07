"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { completeOnboarding } from "@/app/actions/profile";
import { DEPARTMENTS, INTERESTS } from "@/types";
import { cn } from "@/lib/utils";

export function OnboardingForm({ firstName }: { firstName: string }) {
  const [state, formAction] = useFormState(completeOnboarding, {});
  const [department, setDepartment] = useState<string>("");
  const [year, setYear] = useState<number | null>(null);
  const [interests, setInterests] = useState<string[]>([]);

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value],
    );
  }

  return (
    <form action={formAction} className="mt-10 space-y-9">
      <input type="hidden" name="department" value={department} />
      <input type="hidden" name="year" value={year ?? ""} />
      {interests.map((i) => (
        <input key={i} type="hidden" name="interests" value={i} />
      ))}

      <Step index={1} label="What's your department?">
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((dept) => (
            <Choice
              key={dept}
              selected={department === dept}
              onClick={() => setDepartment(dept)}
            >
              {dept}
            </Choice>
          ))}
        </div>
      </Step>

      <Step index={2} label="What year are you in?">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((y) => (
            <Choice key={y} selected={year === y} onClick={() => setYear(y)}>
              Year {y}
            </Choice>
          ))}
        </div>
      </Step>

      <Step
        index={3}
        label="What are you interested in?"
        hint="Pick as many as you like — this shapes your For You feed."
      >
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <Choice
              key={interest}
              selected={interests.includes(interest)}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Choice>
          ))}
        </div>
      </Step>

      <Step
        index={4}
        label="Registration details"
        hint="These appear on nearly every college form. Fill them once and the agent fills them for you forever. You can skip and add them later."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <TextField name="phone" label="Phone" placeholder="9876543210" />
          <TextField
            name="registration_number"
            label="Registration number"
            placeholder="AD22001"
          />
          <TextField name="section" label="Section" placeholder="A" />
        </div>
      </Step>

      {state.error ? (
        <p className="rounded-soft border border-transparent bg-alert px-4 py-3 text-[13px] font-medium text-alert-ink">
          {state.error}
        </p>
      ) : null}

      <Submit firstName={firstName} />
    </form>
  );
}

function TextField({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-ink">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-soft border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-muted focus:border-ink-muted"
      />
    </label>
  );
}

function Submit({ firstName }: { firstName: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="border-t border-line pt-7">
      <motion.button
        type="submit"
        disabled={pending}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
        className="w-full rounded-full border border-line bg-ink px-6 py-3.5 text-[15px] font-bold text-white shadow-card transition-shadow hover:shadow-lift disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {pending ? "Saving…" : `Get started, ${firstName} →`}
      </motion.button>
    </div>
  );
}

function Step({
  index,
  label,
  hint,
  children,
}: {
  index: number;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.fieldset
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      <legend className="flex items-baseline gap-2.5">
        <span className="text-[12px] font-bold text-ink-muted">
          {String(index).padStart(2, "0")}
        </span>
        <span className="text-[21px] font-bold tracking-tight text-ink">
          {label}
        </span>
      </legend>
      {hint ? <p className="mt-1.5 text-[13px] text-ink-soft">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </motion.fieldset>
  );
}

function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.14 }}
      className={cn(
        "rounded-full border px-4 py-2 text-[13px] font-semibold transition-all",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        selected
          ? "border-ink bg-ink text-white"
          : "border-line bg-white text-ink-soft hover:border-ink-muted hover:text-ink",
      )}
    >
      {children}
    </motion.button>
  );
}
