import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/OnboardingForm";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, onboarded")
    .eq("id", user.id)
    .single();

  if (profile?.onboarded) redirect("/feed");

  const fullName =
    profile?.full_name ?? user.user_metadata.full_name ?? "there";
  const firstName = String(fullName).split(" ")[0];

  return (
    <main className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
      <span className="text-[15px] font-extrabold tracking-[-0.02em] text-ink">
        LICET Pulse
      </span>
      <h1 className="mt-8 text-[34px] font-extrabold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[44px]">
        Welcome, {firstName}.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        Three quick questions so your feed shows the events that actually apply
        to you.
      </p>
      <OnboardingForm firstName={firstName} />
    </main>
  );
}
