import { notFound } from "next/navigation";
import { FeedClient } from "@/app/(app)/feed/FeedClient";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { PREVIEW_EVENTS } from "@/lib/preview-fixtures";

/**
 * Dev-only design harness: renders the signed-in shell with seed data so the UI
 * can be reviewed without going through Google OAuth. Never served in prod.
 */
export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <TopBar avatarUrl={null} fullName="Sharone" />
      <FeedClient
        events={PREVIEW_EVENTS}
        savedIds={[PREVIEW_EVENTS[1].id]}
        department="AI&DS"
        interests={["Hackathons", "AI/ML", "Web Dev"]}
      />
      <BottomNav />
    </div>
  );
}
