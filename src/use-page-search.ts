import { useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

const subscribe = () => () => {};
// Static HTML represents default choices. Apply URL choices after that HTML hydrates.
export const useSearchReady = () => useSyncExternalStore(subscribe, () => true, () => false);

/** Shareable UI choices live in router history; drafts and personal data stay local. */
export function usePageSearch() {
  const ready = useSearchReady();
  const locationSearch = useLocation({ select: location => location.search }) as Record<string, unknown>;
  const locationHash = useLocation({ select: location => location.hash });
  const search = ready ? locationSearch : {};
  const navigate = useNavigate();
  const get = (key: string, fallback = "") => typeof search[key] === "string" ? search[key] as string : fallback;
  const choice = <T extends string>(key: string, values: readonly T[], fallback: T): T => {
    const value = get(key);
    return values.includes(value as T) ? value as T : fallback;
  };
  // Changing an option is not a request to revisit the URL's existing section anchor.
  const update = (patch: Record<string, string | undefined>, replace = false, preserveHash = true) => {
    if (Object.entries(patch).every(([key, value]) => locationSearch[key] === value) && (preserveHash || !locationHash)) return;
    void navigate({ to: "./", search: previous => ({ ...previous, ...patch }), replace, resetScroll: false, hashScrollIntoView: false, hash: preserveHash ? true : "" });
  };
  return { get, choice, update, ready };
}
