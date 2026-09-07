import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { createClient } from "@/lib/supabase/server";

/**
 * Shell for every signed-in screen. Middleware already blocks anonymous
 * requests; this re-checks server-side so the guard does not live in one place.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, avatar_url, onboarded")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarded) redirect("/onboarding");

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <TopBar
        avatarUrl={profile?.avatar_url ?? null}
        fullName={profile?.full_name ?? null}
      />
      {children}
      <BottomNav />
    </div>
  );
}
