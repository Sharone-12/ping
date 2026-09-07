"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Badge } from "@/components/ui/Badge";
import { updateInterests } from "@/app/actions/profile";
import { INTERESTS } from "@/types";
import { cn } from "@/lib/utils";

export function InterestsEditor({ initial }: { initial: string[] }) {
  const [state, formAction] = useFormState(updateInterests, {});
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>(initial);

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {initial.length > 0 ? (
          initial.map((i) => <Badge key={i}>{i}</Badge>)
        ) : (
          <span className="text-[13px] text-ink-muted">
            No interests picked yet.
          </span>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-line bg-white px-3 py-1 text-[12px] font-semibold text-ink-soft transition-colors hover:border-ink-muted hover:text-ink"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        setEditing(false);
      }}
    >
      {selected.map((i) => (
        <input key={i} type="hidden" name="interests" value={i} />
      ))}
      <div className="flex flex-wrap gap-2">
        {INTERESTS.map((interest) => {
          const on = selected.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              aria-pressed={on}
              onClick={() =>
                setSelected((prev) =>
                  prev.includes(interest)
                    ? prev.filter((i) => i !== interest)
                    : [...prev, interest],
                )
              }
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                on
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink-soft hover:border-ink-muted hover:text-ink",
              )}
            >
              {interest}
            </button>
          );
        })}
      </div>
      {state.error ? (
        <p className="mt-3 text-[12px] font-medium text-alert-ink">
          {state.error}
        </p>
      ) : null}
      <div className="mt-3.5 flex gap-2">
        <SaveInterests />
        <button
          type="button"
          onClick={() => {
            setSelected(initial);
            setEditing(false);
          }}
          className="rounded-full border border-line bg-white px-4 py-1.5 text-[12px] font-semibold text-ink-soft transition-colors hover:border-ink-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function SaveInterests() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:opacity-85 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}
