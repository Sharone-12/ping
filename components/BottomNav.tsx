"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FeedIcon,
  ProfileIcon,
  ProjectsIcon,
  SearchIcon,
} from "@/components/NavIcons";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/feed", label: "Feed", Icon: FeedIcon },
  { href: "/search", label: "Search", Icon: SearchIcon },
  { href: "/projects", label: "Projects", Icon: ProjectsIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
] as const;

export function useActiveNav() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/feed"
      ? pathname === "/feed" || pathname.startsWith("/events")
      : pathname.startsWith(href);
}

/** Mobile navigation. Desktop uses the inline links in TopBar. */
export function BottomNav() {
  const isActive = useActiveNav();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur sm:hidden"
    >
      <ul className="mx-auto flex max-w-shell items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5",
                  "text-[11px] font-semibold transition-colors",
                  active ? "text-ink" : "text-ink-muted hover:text-ink-soft",
                )}
              >
                <item.Icon />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
