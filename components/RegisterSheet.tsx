"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon } from "@/components/Icons";
import type { MappedField } from "@/lib/form-mapper";
import { cn } from "@/lib/utils";

type Status =
  | "loading"
  | "ready"
  | "manual"
  | "closed"
  | "payment"
  | "no_link"
  | "already_registered"
  | "submitted"
  | "error";

interface PreviewResponse {
  status: string;
  message?: string;
  form_url?: string;
  form_title?: string | null;
  fields?: MappedField[];
}

export function RegisterSheet({
  eventId,
  eventTitle,
  open,
  onClose,
}: {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");
  const [formUrl, setFormUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<MappedField[]>([]);
  const [xp, setXp] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/agent/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = (await res.json()) as PreviewResponse;
      if (!res.ok) {
        setStatus("error");
        setMessage("Could not read the registration form.");
        return;
      }
      setMessage(data.message ?? "");
      setFormUrl(data.form_url ?? null);
      setFields(data.fields ?? []);
      setStatus(data.status as Status);
    } catch {
      setStatus("error");
      setMessage("Could not reach the server.");
    }
  }, [eventId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function confirm(method: "auto" | "prefill") {
    if (!formUrl) return;
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/agent/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          form_url: formUrl,
          method,
          fields: fields
            .filter((f) => f.value)
            .map((f) => ({ entry_id: f.entry_id, value: f.value as string })),
        }),
      });
      const data = (await res.json()) as {
        submitted?: boolean;
        prefill_url?: string;
        xp_earned?: number;
        error?: string;
      };

      if (!res.ok) {
        // Auto-submit failed. Keep the sheet open and offer the filled form so
        // the user is not left stranded.
        setMessage(data.error ?? "Could not submit the form.");
        if (data.prefill_url) setFormUrl(data.prefill_url);
        setSubmitting(false);
        return;
      }

      if (data.prefill_url) window.open(data.prefill_url, "_blank", "noopener");
      setSubmitted(Boolean(data.submitted));
      setXp(data.xp_earned ?? 0);
      setStatus("submitted");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function setValue(entryId: string, value: string) {
    setFields((prev) =>
      prev.map((f) =>
        f.entry_id === entryId
          ? { ...f, value: value || null, needs_user_input: !value }
          : f,
      ),
    );
  }

  const missingRequired = fields.some(
    (f) => f.required && !f.unsupported && !f.value,
  );
  // A file upload cannot be sent by a plain POST, so those forms fall back to
  // opening a pre-filled copy for the user to finish.
  const hasUpload = fields.some((f) => f.unsupported);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Register for ${eventTitle}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-card border-t border-line bg-paper sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-h-[80dvh] sm:w-[440px] sm:rounded-card sm:border"
          >
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-line bg-paper px-6 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                  Auto-register
                </p>
                <h2 className="mt-1 truncate text-[16px] font-extrabold tracking-[-0.02em] text-ink">
                  {eventTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-full px-2 text-[18px] leading-none text-ink-muted transition-colors hover:text-ink"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5">
              {status === "loading" ? <Loading /> : null}

              {status === "ready" ? (
                <>
                  <p className="text-[13px] text-ink-soft">
                    Filled in from your profile. Check it over, then the agent
                    submits it for you.
                  </p>
                  <ul className="mt-4 space-y-3">
                    {fields.map((f) => (
                      <FieldRow
                        key={f.entry_id}
                        field={f}
                        onChange={setValue}
                      />
                    ))}
                  </ul>

                  {missingRequired ? (
                    <p className="mt-4 rounded-soft bg-alert px-3 py-2 text-[12px] font-medium text-alert-ink">
                      Some required fields still need an answer.
                    </p>
                  ) : null}

                  {message ? (
                    <p className="mt-4 rounded-soft bg-alert px-3 py-2 text-[12px] font-medium text-alert-ink">
                      {message}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => confirm(hasUpload ? "prefill" : "auto")}
                    disabled={submitting || missingRequired}
                    className="mt-5 w-full rounded-full bg-ink px-6 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                  >
                    {submitting
                      ? "Submitting…"
                      : hasUpload
                        ? "Open pre-filled form"
                        : "Submit registration"}
                  </button>
                  <button
                    type="button"
                    onClick={() => confirm("prefill")}
                    disabled={submitting}
                    className="mt-2 block w-full text-center text-[12.5px] font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-50"
                  >
                    Open the filled form instead
                  </button>
                </>
              ) : null}

              {status === "submitted" ? (
                <div className="py-6 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-mint text-mint-ink">
                    <CheckIcon size={22} />
                  </span>
                  <p className="mt-4 text-[17px] font-extrabold tracking-[-0.02em] text-ink">
                    {submitted ? "Registered" : "Form pre-filled"}
                  </p>
                  <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-ink-soft">
                    {submitted
                      ? "Your response was submitted and Google confirmed it was recorded."
                      : "It opened in a new tab with your details already in. Press Submit there to finish registering."}
                  </p>
                  {xp > 0 ? (
                    <p className="mt-4 inline-flex rounded-full bg-butter px-3 py-1 text-[12px] font-bold text-butter-ink">
                      +{xp} XP
                    </p>
                  ) : null}
                </div>
              ) : null}

              {[
                "manual",
                "closed",
                "payment",
                "no_link",
                "already_registered",
                "error",
              ].includes(status) ? (
                <div className="py-4">
                  <p className="text-[13.5px] leading-relaxed text-ink-soft">
                    {message || "Something went wrong."}
                  </p>
                  {formUrl && status !== "closed" ? (
                    <a
                      href={formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
                    >
                      Open the form
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Loading() {
  return (
    <div className="py-8">
      <p className="text-[13.5px] font-semibold text-ink">
        Reading the registration form…
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-deep">
        <motion.div
          className="h-full w-1/3 rounded-full bg-ink"
          animate={{ x: ["-100%", "300%"] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

function FieldRow({
  field,
  onChange,
}: {
  field: MappedField;
  onChange: (entryId: string, value: string) => void;
}) {
  const state = field.unsupported
    ? "unsupported"
    : field.value
      ? "filled"
      : "needs";

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={field.entry_id}
          className="text-[12.5px] font-semibold text-ink"
        >
          {field.label}
          {field.required ? <span className="text-alert-ink"> *</span> : null}
        </label>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            state === "filled" && "bg-mint text-mint-ink",
            state === "needs" && "bg-butter text-butter-ink",
            state === "unsupported" && "bg-paper-deep text-ink-muted",
          )}
        >
          {state === "filled"
            ? field.confidence
            : state === "needs"
              ? "you"
              : "manual"}
        </span>
      </div>

      {field.unsupported ? (
        <p className="mt-1 text-[12px] text-ink-muted">
          File upload — complete this on the form itself.
        </p>
      ) : field.options ? (
        <select
          id={field.entry_id}
          value={field.value ?? ""}
          onChange={(e) => onChange(field.entry_id, e.target.value)}
          className="mt-1.5 w-full rounded-soft border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-muted"
        >
          <option value="">Choose…</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={field.entry_id}
          value={field.value ?? ""}
          placeholder="Tap to fill"
          onChange={(e) => onChange(field.entry_id, e.target.value)}
          className="mt-1.5 w-full rounded-soft border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-muted focus:border-ink-muted"
        />
      )}
    </li>
  );
}
