"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { NAV_ITEMS, useActiveNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

export function TopBar({
  avatarUrl,
  fullName,
}: {
  avatarUrl: string | null;
  fullName: string | null;
}) {
  const isActive = useActiveNav();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between gap-4 px-5">
        <Link
          href="/feed"
          className="text-[15px] font-extrabold tracking-[-0.02em] text-ink"
        >
          LICET Pulse
        </Link>

        <nav aria-label="Main" className="hidden sm:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors",
                      active
                        ? "bg-ink text-white"
                        : "text-ink-soft hover:bg-paper-deep hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link
          href="/profile"
          aria-label="Your profile"
          className="shrink-0 rounded-full ring-offset-2 ring-offset-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <Avatar src={avatarUrl} name={fullName} size={34} />
        </Link>
      </div>
    </header>
  );
}
