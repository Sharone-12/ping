"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Google profile picture with a reliable fallback.
 *
 * Two things make these images vanish intermittently:
 *  - lh3.googleusercontent.com rejects some hotlinked requests when a Referer
 *    header is sent, so the request is made without one.
 *  - A failed image previously left an empty circle, because the initial was
 *    only rendered when avatar_url was null — not when loading failed.
 */
export function Avatar({
  src,
  name,
  size = 34,
  className,
}: {
  src: string | null;
  name: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";

  const shared = cn(
    "shrink-0 rounded-full border border-line object-cover",
    className,
  );

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
        className={cn(
          shared,
          "grid place-items-center bg-white font-extrabold text-ink",
        )}
      >
        {initial}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className={shared}
    />
  );
}
