"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckIcon } from "@/components/Icons";
import { RegisterSheet } from "@/components/RegisterSheet";

export function RegisterButton({
  eventId,
  eventTitle,
  hasLink,
  alreadyRegistered,
}: {
  eventId: string;
  eventTitle: string;
  hasLink: boolean;
  alreadyRegistered: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (alreadyRegistered) {
    return (
      <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-mint px-6 py-3.5 text-[15px] font-bold text-mint-ink">
        <CheckIcon size={17} /> Registered
      </span>
    );
  }

  if (!hasLink) {
    return (
      <span className="inline-flex flex-1 items-center justify-center rounded-full border border-line bg-white px-6 py-3.5 text-[15px] font-semibold text-ink-muted">
        No registration link
      </span>
    );
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.99 }}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-85"
      >
        Register with agent
      </motion.button>

      <RegisterSheet
        eventId={eventId}
        eventTitle={eventTitle}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
