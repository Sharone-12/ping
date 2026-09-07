import { SearchClient } from "./SearchClient";
import { getSavedEventIds } from "@/lib/data";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const savedIds = await getSavedEventIds();
  return (
    <SearchClient
      savedIds={Array.from(savedIds)}
      initialQuery={searchParams.q ?? ""}
    />
  );
}
