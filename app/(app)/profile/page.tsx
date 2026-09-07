import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { redirect } from "next/navigation";
import { ConnectGmailButton } from "@/components/ConnectGmailButton";
import { EventTypeIcon, SignOutIcon } from "@/components/Icons";
import { SyncEmailsButton } from "@/components/SyncEmailsButton";
import { InterestsEditor } from "@/components/InterestsEditor";
import { RegistrationDetails } from "@/components/RegistrationDetails";
import { PageTransition } from "@/components/PageTransition";
import { EmptyScene } from "@/components/illustrations/EmptyScene";
import { getEvents, getSavedEventIds, getTotalXp } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { daysUntil, formatDateRange } from "@/lib/utils";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [
    { data: profile },
    { events },
    savedIds,
    { data: ownProjects },
    xp,
    { data: registrations },
  ] = await Promise.all([
    supabase
      .from("users")
      .select(
        "full_name, avatar_url, department, year, interests, email, gmail_connected, phone, registration_number, section",
      )
      .eq("id", user.id)
      .single(),
    getEvents(),
    getSavedEventIds(),
    supabase
      .from("projects")
      .select("id, title, tech_stack")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getTotalXp(),
    supabase
      .from("event_registrations")
      .select("event_id, created_at, registered_via")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const savedEvents = events.filter((e) => savedIds.has(e.id));
  const eventsById = new Map(events.map((e) => [e.id, e]));
  const registeredEvents = (registrations ?? [])
    .map((r) => ({ ...r, event: eventsById.get(r.event_id as string) }))
    .filter((r) => r.event);
  const myProjects = ownProjects ?? [];
  const name = profile?.full_name ?? user.email ?? "Student";

  return (
    <PageTransition>
      <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <div className="flex items-center gap-4">
          <Avatar src={profile?.avatar_url ?? null} name={name} size={64} />
          <div className="min-w-0">
            <h1 className="truncate text-[28px] font-extrabold tracking-[-0.02em] text-ink sm:text-[34px]">
              {name}
            </h1>
            <p className="mt-0.5 text-[14px] text-ink-soft">
              {profile?.department ?? "Department not set"}
              {profile?.year ? ` • Year ${profile.year}` : ""}
            </p>
            <p className="truncate text-[13px] text-ink-muted">
              {profile?.email ?? user.email}
            </p>
            {xp > 0 ? (
              <p className="mt-2 inline-flex rounded-full bg-butter px-2.5 py-1 text-[11.5px] font-bold text-butter-ink">
                {xp} XP
              </p>
            ) : null}
          </div>
        </div>

        <Section title="Interests">
          <InterestsEditor initial={profile?.interests ?? []} />
        </Section>

        <Section title="Registration details">
          <RegistrationDetails
            fullName={profile?.full_name ?? null}
            phone={profile?.phone ?? null}
            registrationNumber={profile?.registration_number ?? null}
            section={profile?.section ?? null}
            department={profile?.department ?? null}
            year={profile?.year ?? null}
          />
        </Section>

        <Section title={`Saved events (${savedEvents.length})`}>
          {savedEvents.length > 0 ? (
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
              {savedEvents.map((event) => {
                const days = daysUntil(event.date_start);
                return (
                  <li key={event.id}>
                    <Link
                      href={`/events/${event.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-paper-deep"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 truncate text-[14px] font-semibold text-ink">
                          <EventTypeIcon
                            type={event.event_type}
                            className="shrink-0 text-ink-soft"
                          />
                          <span className="truncate">{event.title}</span>
                        </span>
                        <span className="text-[12px] text-ink-muted">
                          {formatDateRange(event.date_start, event.date_end)}
                        </span>
                      </span>
                      <span className="shrink-0 text-[12px] font-semibold text-ink-soft">
                        {days !== null && days >= 0 ? `in ${days}d` : "past"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center rounded-card border border-line bg-white px-5 py-10 text-center">
              <EmptyScene className="h-24 w-auto" />
              <p className="mt-3.5 text-[13.5px] text-ink-soft">
                Nothing saved yet — tap the bookmark on any event card.
              </p>
            </div>
          )}
        </Section>

        <Section title={`Registered (${registeredEvents.length})`}>
          {registeredEvents.length > 0 ? (
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
              {registeredEvents.map((r) => (
                <li key={r.event_id as string}>
                  <Link
                    href={`/events/${r.event_id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-paper-deep"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold text-ink">
                        {r.event!.title}
                      </span>
                      <span className="text-[12px] text-ink-muted">
                        {formatDateRange(
                          r.event!.date_start,
                          r.event!.date_end,
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-mint px-2.5 py-1 text-[11px] font-bold text-mint-ink">
                      {r.registered_via === "agent" ? "via agent" : "manual"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-card border border-line bg-white px-5 py-8 text-center text-[13.5px] text-ink-soft">
              No registrations yet — open an event and let the agent fill the
              form for you.
            </p>
          )}
        </Section>

        <Section title={`My projects (${myProjects.length})`}>
          {myProjects.length > 0 ? (
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
              {myProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href="/projects"
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-paper-deep"
                  >
                    <span className="truncate text-[14px] font-semibold text-ink">
                      {project.title}
                    </span>
                    <span className="shrink-0 text-[12px] text-ink-muted">
                      {project.tech_stack?.[0] ?? ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center rounded-card border border-line bg-white px-5 py-10 text-center">
              <p className="text-[13.5px] text-ink-soft">
                You have not published a project yet.
              </p>
              <Link
                href="/projects/new"
                className="mt-4 inline-flex rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
              >
                Add your project
              </Link>
            </div>
          )}
        </Section>

        <Section title="Account">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <ConnectGmailButton connected={profile?.gmail_connected ?? false} />
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-transparent bg-alert px-5 py-2.5 text-[13px] font-semibold text-alert-ink transition-colors hover:border-alert-ink"
              >
                <SignOutIcon size={15} /> Sign Out
              </button>
            </form>
          </div>

          <div className="mt-3">
            <SyncEmailsButton connected={profile?.gmail_connected ?? false} />
          </div>

          <p className="mt-4 max-w-xl text-[12px] leading-relaxed text-ink-muted">
            Connecting Gmail is separate from signing in. It asks for a Google
            restricted scope, so until the app passes Google&apos;s review only
            accounts listed as test users can grant it — everyone else can still
            use the rest of LICET Pulse normally.
          </p>
        </Section>
      </main>
    </PageTransition>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9 border-t border-line pt-7">
      <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-ink-soft">
        {title}
      </h2>
      {children}
    </section>
  );
}
