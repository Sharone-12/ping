"use client";

import { motion } from "framer-motion";
import { BotIcon } from "@/components/Icons";

export function AIAnswerCard({ answer }: { answer: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3.5 rounded-card border border-line bg-white p-5 shadow-card"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-lilac text-ink-soft">
        <BotIcon size={17} />
      </span>
      <div>
        <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink-muted">
          AI answer
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink sm:text-[15px]">
          {answer}
        </p>
      </div>
    </motion.div>
  );
}
