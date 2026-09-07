export type EventType =
  | "hackathon"
  | "workshop"
  | "seminar"
  | "fest"
  | "competition"
  | "guest-lecture"
  | "other";

export interface CampusEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  department: string | null;
  date_start: string | null;
  date_end: string | null;
  registration_deadline: string | null;
  venue: string | null;
  registration_link: string | null;
  poster_url: string | null;
  tags: string[];
  team_size: string | null;
  source_email_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  ai_summary: string | null;
  tech_stack: string[];
  tags: string[];
  looking_for: string[];
  github_url: string | null;
  demo_url: string | null;
  image_url: string | null;
  status: "active" | "completed" | "looking-for-team";
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  department: string | null;
  year: number | null;
  interests: string[];
  gmail_connected: boolean;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export const DEPARTMENTS = [
  "AI&DS",
  "ECE",
  "EEE",
  "MECHANICAL",
  "CSE A",
  "CSE B",
] as const;

export const YEARS = [1, 2, 3, 4] as const;

/**
 * Events parsed from email carry a plain department ("CSE", "MECH"), while a
 * student picks a section ("CSE A"). Normalise both before comparing so a
 * CSE A student still matches a CSE event.
 */
export function normaliseDepartment(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  if (v === "ALL") return "ALL";
  if (v.startsWith("CSE")) return "CSE";
  if (v.startsWith("MECH")) return "MECH";
  if (v.startsWith("AI")) return "AI&DS";
  return v;
}

export function departmentMatches(
  userDepartment: string | null,
  eventDepartment: string | null,
): boolean {
  const a = normaliseDepartment(userDepartment);
  const b = normaliseDepartment(eventDepartment);
  return Boolean(a && b && a === b);
}

export const INTERESTS = [
  "Hackathons",
  "AI/ML",
  "Web Dev",
  "Robotics",
  "IoT",
  "Cybersecurity",
  "Blockchain",
  "Cloud",
  "Mobile Dev",
  "Data Science",
  "Design",
  "Competitive Programming",
] as const;

export const EVENT_TYPE_META: Record<EventType, { label: string }> = {
  hackathon: { label: "Hackathon" },
  workshop: { label: "Workshop" },
  seminar: { label: "Seminar" },
  fest: { label: "Fest" },
  competition: { label: "Competition" },
  "guest-lecture": { label: "Guest Lecture" },
  other: { label: "Event" },
};
